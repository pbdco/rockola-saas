import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoUserAccess, throwIfNotAllowed, isSuperAdmin } from 'models/user';
import { getVenueForUser, getVenueById } from 'models/venue';
import { ApiError } from 'lib/errors';
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

    await handleGET(req, res);
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;
    res.status(status).json({ error: { message } });
  }
}

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await throwIfNoUserAccess(req, res);
  throwIfNotAllowed(user, 'venue', 'update');

  const { venueId } = req.query as { venueId: string };

  // Get venue - SUPERADMIN can access any, users only their own
  const venue = isSuperAdmin(user)
    ? await getVenueById(venueId)
    : await getVenueForUser(venueId, user.id);

  // Check if venue has Spotify credentials configured
  if (!venue.spotifyClientId || !venue.spotifyClientSecret) {
    throw new ApiError(
      400,
      'Spotify app credentials not configured for this venue. Please add your Spotify Client ID and Secret in venue settings.'
    );
  }

  const appUrl = env.appUrl;

  // Build Spotify authorization URL with venue-specific credentials
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative',
  ].join(' ');

  // Use a single static callback URL for all venues
  const redirectUri = `${appUrl}/api/spotify/callback`;

  // Pass venue info in state parameter (no more teamSlug)
  const state = JSON.stringify({
    venueId,
  });

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('client_id', venue.spotifyClientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);

  // Debug logging
  console.log('=== SPOTIFY OAUTH DEBUG ===');
  console.log('APP_URL from env:', appUrl);
  console.log('Redirect URI:', redirectUri);
  console.log('Client ID:', venue.spotifyClientId);
  console.log('Full auth URL:', authUrl.toString());
  console.log('===========================');

  res.redirect(authUrl.toString());
};


