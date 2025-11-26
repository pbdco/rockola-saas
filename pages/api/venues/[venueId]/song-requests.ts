import type { NextApiRequest, NextApiResponse } from 'next';
import { RequestStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { validateWithSchema, venueIdSchema } from '@/lib/zod';
import { z } from 'zod';
import { throwIfNoUserAccess, isSuperAdmin } from 'models/user';
import { getVenueById, getVenueForUser } from 'models/venue';
import { searchTrack, addSongToPlaylist } from '@/lib/n8n-webhooks';

const createSongRequestSchema = z.object({
  trackName: z.string().min(1, 'Track name is required').max(200),
  artistName: z.string().min(1, 'Artist name is required').max(200),
  patronIdentifier: z.string().optional(), // Optional: phone number, name, etc.
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    const user = await throwIfNoUserAccess(req, res);

    switch (method) {
      case 'POST':
        await handlePOST(req, res, user);
        break;
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    logger.error('Song request API error', {
      type: 'song_request_api_error',
      error: message,
      stack: error.stack,
    });

    res.status(status).json({ error: { message } });
  }
}

const handlePOST = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) => {
  const { venueId } = validateWithSchema(
    venueIdSchema,
    req.query as { venueId: string }
  );

  const payload = validateWithSchema(createSongRequestSchema, req.body);

  // Get venue and verify access
  const venue = isSuperAdmin(user)
    ? await getVenueById(venueId)
    : await getVenueForUser(venueId, user.id);

  // Validate venue is active
  if (!venue.isActive) {
    throw new ApiError(400, 'Venue is not active');
  }

  // Validate venue mode is PLAYLIST (for now, Automation Mode will be added later)
  if (venue.mode !== 'PLAYLIST') {
    throw new ApiError(400, 'Song requests are only available for Playlist Mode venues');
  }

  // Validate playlist exists
  if (!venue.spotifyPlaylistId) {
    throw new ApiError(400, 'Playlist not created yet. Please wait a moment and try again.');
  }

  // Get Spotify credentials (use default for Playlist Mode)
  const spotifyClientId = env.spotify.defaultClientId;
  const spotifyClientSecret = env.spotify.defaultClientSecret;

  if (!spotifyClientId || !spotifyClientSecret) {
    throw new ApiError(500, 'Spotify credentials not configured');
  }

  // Generate request ID for tracking
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Step 1: Search for track
  logger.songRequest('searching_track', requestId, venueId, 'PENDING', {
    trackName: payload.trackName,
    artistName: payload.artistName,
  });

  const searchResult = await searchTrack(
    venueId,
    requestId,
    payload.trackName,
    payload.artistName,
    spotifyClientId,
    spotifyClientSecret
  );

  if (!searchResult.success) {
    throw new ApiError(500, searchResult.error || 'Failed to search track');
  }

  if (!searchResult.track) {
    throw new ApiError(404, searchResult.message || 'Track not found on Spotify');
  }

  const track = searchResult.track;

  // Step 2: Create SongRequest record (status: PENDING)
  const songRequest = await prisma.songRequest.create({
    data: {
      venueId: venue.id,
      patronIdentifier: payload.patronIdentifier || null,
      spotifyTrackId: track.spotifyTrackId,
      trackName: track.trackName,
      artistName: track.artistName,
      albumName: track.albumName || null,
      trackUri: track.trackUri,
      status: RequestStatus.PENDING,
      price: venue.pricingEnabled && venue.pricePerSong
        ? new Prisma.Decimal(Number(venue.pricePerSong))
        : null,
      currency: venue.currency || 'USD',
    },
  });

  logger.songRequest('request_created', songRequest.id, venueId, 'PENDING', {
    spotifyTrackId: track.spotifyTrackId,
  });

  // Step 3: Add song to playlist
  logger.songRequest('adding_to_playlist', songRequest.id, venueId, 'PENDING', {
    playlistId: venue.spotifyPlaylistId,
    trackUri: track.trackUri,
  });

  const addResult = await addSongToPlaylist(
    venueId,
    songRequest.id,
    venue.spotifyPlaylistId!,
    track.trackUri,
    spotifyClientId,
    spotifyClientSecret
  );

  if (!addResult.success || !addResult.added) {
    // Update request status to FAILED
    await prisma.songRequest.update({
      where: { id: songRequest.id },
      data: { status: RequestStatus.FAILED },
    });

    logger.songRequest('add_to_playlist_failed', songRequest.id, venueId, 'FAILED', {
      error: addResult.error,
    });

    throw new ApiError(500, addResult.error || 'Failed to add song to playlist');
  }

  // Step 4: Update request status to QUEUED
  await prisma.songRequest.update({
    where: { id: songRequest.id },
    data: {
      status: RequestStatus.QUEUED,
      queuedAt: new Date(),
      queuePosition: addResult.playlistLength || null,
    },
  });

  logger.songRequest('request_queued', songRequest.id, venueId, 'QUEUED', {
    queuePosition: addResult.playlistLength,
  });

  // Return success response
  res.status(201).json({
    data: {
      id: songRequest.id,
      trackName: track.trackName,
      artistName: track.artistName,
      status: RequestStatus.QUEUED,
      queuePosition: addResult.playlistLength,
      playlistUrl: venue.spotifyPlaylistUrl,
    },
  });
};
