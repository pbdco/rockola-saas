import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from 'lib/errors';
import { updateVenue, getVenueById } from 'models/venue';
import { recordMetric } from 'lib/metrics';
import env from 'lib/env';

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

    console.log('=== N8N PAYLOAD DEBUG ===');
    console.log('Payload:', JSON.stringify(n8nPayload, null, 2));
    console.log('=========================');

    const n8nResponse = await fetch(env.n8n.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload), // Send as single object
    });

    console.log('=== N8N RESPONSE DEBUG ===');
    console.log('Status:', n8nResponse.status);
    console.log('Status Text:', n8nResponse.statusText);
    console.log('==========================');

    if (!n8nResponse.ok) {
      const errorData = await n8nResponse.json().catch(() => ({}));
      throw new ApiError(
        n8nResponse.status,
        `Failed to create n8n credential: ${errorData.message || n8nResponse.statusText}`
      );
    }

    let n8nResult: any = {};
    let n8nCredentialId: string | undefined;

    try {
      const responseText = await n8nResponse.text();
      console.log('N8N Response Text:', responseText);
      
      if (responseText) {
        n8nResult = JSON.parse(responseText);
        n8nCredentialId = n8nResult.credentialId || n8nResult.id;
      }
      
      console.log('N8N Credential ID:', n8nCredentialId);
    } catch (parseError: any) {
      console.error('Failed to parse n8n response:', parseError.message);
      // Continue without n8n credential ID
      n8nCredentialId = undefined;
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

    // Redirect back to venues page
    res.redirect(`/venues?success=spotify-connected`);
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    console.error('Spotify callback error:', error);
    // Redirect with error message
    res.redirect(`/venues?error=${encodeURIComponent(message)}`);
  }
}

