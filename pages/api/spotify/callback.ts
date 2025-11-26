import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from 'lib/errors';
import { updateVenue, getVenueById } from 'models/venue';
import { recordMetric } from 'lib/metrics';
import env from 'lib/env';
import { logger } from 'lib/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    if (method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({
        error: { message: `Method ${method} Not Allowed` },
      });
    }

    const { code, state, error } = req.query;

    console.log('=== SPOTIFY CALLBACK DEBUG ===');
    console.log('Code:', code);
    console.log('State:', state);
    console.log('Error:', error);
    console.log('==============================');

    if (error) {
      throw new ApiError(400, `Spotify authorization failed: ${error}`);
    }

    if (!code || !state) {
      throw new ApiError(400, 'Missing authorization code or state');
    }

    // Parse state to get venueId
    let venueId: string;
    
    try {
      const parsed = JSON.parse(state as string);
      venueId = parsed.venueId;
      
      if (!venueId) {
        throw new Error('Missing venueId in state');
      }
    } catch (e: any) {
      console.error('Failed to parse state:', state, 'Error:', e.message);
      throw new ApiError(400, `Invalid state parameter: ${e.message}`);
    }

    // Get venue to get the credentials and name
    const venue = await getVenueById(venueId);

    // Validate venue has Spotify credentials
    if (!venue.spotifyClientId || !venue.spotifyClientSecret) {
      throw new ApiError(
        400,
        'Venue does not have Spotify credentials configured'
      );
    }

    // Exchange authorization code for tokens using venue-specific credentials
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${venue.spotifyClientId}:${venue.spotifyClientSecret}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: `${env.appUrl}/api/spotify/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new ApiError(
        tokenResponse.status,
        `Failed to get Spotify tokens: ${errorData.error_description || tokenResponse.statusText}`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get Spotify user profile
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileResponse.ok) {
      throw new ApiError(
        profileResponse.status,
        'Failed to get Spotify user profile'
      );
    }

    const profile = await profileResponse.json();
    const spotifyUserId = profile.id;
    const spotifyDisplayName = profile.display_name || profile.id;

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Send credentials to n8n webhook with venue-specific credentials
    const n8nPayload = {
      name: `ROCKOLA - ${venue.name}`,
      credentialType: 'spotifyOAuth2Api',
      data: {
        clientId: venue.spotifyClientId,
        clientSecret: venue.spotifyClientSecret,
        oauthTokenData: {
          access_token,
          refresh_token,
        },
        serverUrl: '',
        sendAdditionalBodyProperties: false,
        additionalBodyProperties: {},
        allowedDomains: '',
      },
    };

    // Call n8n webhook to create Spotify OAuth credential for automation workflows
    // This is optional - Spotify tokens are still saved to the venue regardless
    const createCredentialUrl = env.n8n.webhooks.createSpotifyCredential;
    
    logger.info('Attempting to create n8n Spotify credential', {
      type: 'spotify_oauth_callback',
      venueId,
      venueName: venue.name,
      webhookUrl: createCredentialUrl,
    });

    let n8nCredentialId: string | undefined;

    try {
      const n8nResponse = await fetch(createCredentialUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload),
      });

      logger.info('N8N webhook response received', {
        type: 'n8n_webhook_response',
        status: n8nResponse.status,
        statusText: n8nResponse.statusText,
      });

      if (!n8nResponse.ok) {
        const errorData = await n8nResponse.json().catch(() => ({}));
        logger.error('Failed to create n8n credential', {
          type: 'n8n_credential_creation_failed',
          venueId,
          status: n8nResponse.status,
          error: errorData.message || n8nResponse.statusText,
          webhookUrl: createCredentialUrl,
        });
        // Don't throw error - continue without n8n credential
        // The Spotify connection will still work, just without n8n integration
      } else {
        try {
          const responseText = await n8nResponse.text();
          if (responseText) {
            const n8nResult = JSON.parse(responseText);
            n8nCredentialId = n8nResult.credentialId || n8nResult.id;
            
            logger.info('N8N credential created successfully', {
              type: 'n8n_credential_created',
              venueId,
              credentialId: n8nCredentialId,
            });
          }
        } catch (parseError: any) {
          logger.error('Failed to parse n8n response', {
            type: 'n8n_parse_error',
            error: parseError.message,
          });
        }
      }
    } catch (n8nError: any) {
      logger.error('Error calling n8n webhook', {
        type: 'n8n_webhook_error',
        venueId,
        error: n8nError.message,
        stack: n8nError.stack,
      });
      // Continue without n8n credential - Spotify connection will still work
    }

    // Update venue with Spotify credentials
    await updateVenue(venueId, venue.userId, {
      spotifyUserId,
      spotifyDisplayName,
      spotifyAccessToken: access_token,
      spotifyRefreshToken: refresh_token,
      spotifyTokenExpiresAt: expiresAt,
      n8nCredentialId,
    });

    recordMetric('venue.spotify.connected');

    logger.info('Spotify connection successful', {
      type: 'spotify_connected',
      venueId,
      spotifyUserId,
      hasN8nCredential: Boolean(n8nCredentialId),
    });

    // Redirect back to venues page
    res.redirect(`/venues?success=spotify-connected`);
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    
    logger.error('Spotify callback error', {
      type: 'spotify_callback_error',
      error: message,
      stack: error.stack,
      status: error.status || 500,
    });
    
    // Redirect with error message
    res.redirect(`/venues?error=${encodeURIComponent(message)}`);
  }
}

