import { Prisma, Venue, VenueMode } from '@prisma/client';

import { ApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/server-common';
import { createPlaylist } from '@/lib/n8n-webhooks';
import env from '@/lib/env';
import { logger } from '@/lib/logger';

export type SerializedVenue = Omit<Venue, 'pricePerSong'> & {
  pricePerSong: number | null;
  spotifyDisplayName?: string | null;
  n8nCredentialId?: string | null;
};

const serializeVenue = (venue: Venue): SerializedVenue => ({
  ...venue,
  pricePerSong: venue.pricePerSong ? Number(venue.pricePerSong) : null,
});

export const listVenues = async (
  userId: string,
  isActive?: boolean
): Promise<SerializedVenue[]> => {
  const venues = await prisma.venue.findMany({
    where: {
      userId,
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return venues.map(serializeVenue);
};

export const listAllVenues = async (
  isActive?: boolean
): Promise<SerializedVenue[]> => {
  // For SUPERADMIN - list all venues across all users
  const venues = await prisma.venue.findMany({
    where: {
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return venues.map((venue) => serializeVenue(venue as Venue));
};

export const getVenueById = async (id: string) => {
  const venue = await prisma.venue.findUnique({ where: { id } });

  if (!venue) {
    throw new ApiError(404, 'Venue not found');
  }

  return venue;
};

/**
 * Generate a unique slug by checking if it exists and appending a suffix if needed
 * @param baseSlug - The base slug to check
 * @param excludeVenueId - Optional venue ID to exclude from uniqueness check (for updates)
 * @returns A unique slug (e.g., "my-venue", "my-venue-2", "my-venue-3", etc.)
 */
const generateUniqueSlug = async (
  baseSlug: string,
  excludeVenueId?: string
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.venue.findUnique({
      where: { slug },
      select: { id: true },
    });

    // If slug doesn't exist, or it's the same venue we're updating, it's available
    if (!existing || (excludeVenueId && existing.id === excludeVenueId)) {
      return slug;
    }

    // Slug exists, try with suffix
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

export const createVenue = async (
  userId: string,
  data: {
    name: string;
    slug?: string;
    address?: string;
    mode: VenueMode;
    pricingEnabled?: boolean;
    pricePerSong?: number | null;
    currency?: string;
    isActive?: boolean;
    spotifyClientId?: string;
    spotifyClientSecret?: string;
  }
) => {
  const baseSlug = slugify(data.slug || data.name);
  const slug = await generateUniqueSlug(baseSlug);

  const venue = await prisma.venue.create({
    data: {
      userId,
      name: data.name,
      slug,
      address: data.address,
      mode: data.mode,
      pricingEnabled: Boolean(data.pricingEnabled),
      pricePerSong:
        data.pricingEnabled && typeof data.pricePerSong === 'number'
          ? new Prisma.Decimal(data.pricePerSong)
          : null,
      currency: data.currency || 'USD',
      isActive:
        typeof data.isActive === 'boolean' ? data.isActive : true,
      spotifyClientId: data.spotifyClientId,
      spotifyClientSecret: data.spotifyClientSecret,
    },
  });

  // Auto-create playlist for Playlist Mode venues (only if playlist doesn't exist)
  // For new venues, spotifyPlaylistId will be null, so we can safely create
  if (venue.mode === 'PLAYLIST') {
    // Fetch the venue again to check if playlist already exists
    const venueCheck = await prisma.venue.findUnique({
      where: { id: venue.id },
    });

    // Only create playlist if it doesn't exist
    // Type assertion needed because Prisma types may not be fully updated
    const hasPlaylist = (venueCheck as any)?.spotifyPlaylistId;
    if (!hasPlaylist) {
      try {
      // Use default Spotify credentials for Playlist Mode
      const spotifyClientId = env.spotify.defaultClientId;
      const spotifyClientSecret = env.spotify.defaultClientSecret;

      if (!spotifyClientId || !spotifyClientSecret) {
        logger.warn('Cannot create playlist: Default Spotify credentials not configured', {
          type: 'playlist_creation_skipped',
          venueId: venue.id,
          venueName: venue.name,
        });
      } else {
        const playlistResult = await createPlaylist(
          venue.id,
          venue.name,
          spotifyClientId,
          spotifyClientSecret
        );

        if (playlistResult.success && playlistResult.playlistId) {
          // Update venue with playlist information
          // Type assertion needed because Prisma types may not be fully updated
          const updatedVenue = await prisma.venue.update({
            where: { id: venue.id },
            data: {
              spotifyPlaylistId: playlistResult.playlistId,
              spotifyPlaylistUrl: playlistResult.playlistUrl || null,
            } as any,
          });

          logger.info('Playlist created successfully for venue', {
            type: 'playlist_creation_success',
            venueId: venue.id,
            playlistId: playlistResult.playlistId,
            playlistUrl: playlistResult.playlistUrl,
          });

          // Return updated venue with playlist info
          return serializeVenue(updatedVenue);
        } else {
          logger.error('Failed to create playlist for venue', {
            type: 'playlist_creation_failed',
            venueId: venue.id,
            venueName: venue.name,
            error: playlistResult.error,
          });
          // Continue - don't fail venue creation if playlist creation fails
        }
      }
    } catch (error: any) {
      // Log error but don't fail venue creation
      logger.error('Error creating playlist for venue', {
        type: 'playlist_creation_error',
        venueId: venue.id,
        venueName: venue.name,
        error: error.message,
        stack: error.stack,
      });
      // Continue - venue is created, playlist can be created later
      }
    }
  }

  return serializeVenue(venue);
};

export const updateVenue = async (
  id: string,
  userId: string,
  data: Partial<{
    name: string;
    slug?: string;
    address?: string;
    mode: VenueMode;
    pricingEnabled?: boolean;
    pricePerSong?: number | null;
    currency?: string;
    isActive?: boolean;
    spotifyClientId?: string | null;
    spotifyClientSecret?: string | null;
    spotifyUserId?: string | null;
    spotifyDisplayName?: string | null;
    spotifyAccessToken?: string | null;
    spotifyRefreshToken?: string | null;
    spotifyTokenExpiresAt?: Date | null;
    n8nCredentialId?: string | null;
  }>
) => {
  const existing = await getVenueById(id);

  if (existing.userId !== userId) {
    throw new ApiError(403, 'You do not have access to this venue');
  }

  const finalPricingEnabled =
    typeof data.pricingEnabled === 'boolean'
      ? data.pricingEnabled
      : existing.pricingEnabled;

  // Handle slug generation/update
  let finalSlug = existing.slug;
  if (data.slug) {
    // User provided a custom slug
    const baseSlug = slugify(data.slug);
    finalSlug = await generateUniqueSlug(baseSlug, id);
  } else if (data.name && data.name !== existing.name) {
    // Name changed but no slug provided - auto-generate from new name
    const baseSlug = slugify(data.name);
    finalSlug = await generateUniqueSlug(baseSlug, id);
  }

  const finalMode = data.mode ?? existing.mode;

  const updated = await prisma.venue.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      slug: finalSlug,
      address: data.address ?? existing.address,
      mode: finalMode,
      pricingEnabled: finalPricingEnabled,
      pricePerSong: finalPricingEnabled
        ? typeof data.pricePerSong === 'number'
          ? new Prisma.Decimal(data.pricePerSong)
          : existing.pricePerSong
        : null,
      currency: data.currency ?? existing.currency,
      isActive:
        typeof data.isActive === 'boolean' ? data.isActive : existing.isActive,
      spotifyClientId: data.spotifyClientId ?? existing.spotifyClientId,
      spotifyClientSecret: data.spotifyClientSecret ?? existing.spotifyClientSecret,
      spotifyUserId: data.spotifyUserId ?? existing.spotifyUserId,
      spotifyDisplayName:
        data.spotifyDisplayName ?? existing.spotifyDisplayName,
      spotifyAccessToken: data.spotifyAccessToken ?? existing.spotifyAccessToken,
      spotifyRefreshToken:
        data.spotifyRefreshToken ?? existing.spotifyRefreshToken,
      spotifyTokenExpiresAt:
        data.spotifyTokenExpiresAt ?? existing.spotifyTokenExpiresAt,
      n8nCredentialId: data.n8nCredentialId ?? existing.n8nCredentialId,
    },
  });

  // Auto-create playlist if mode changed to PLAYLIST and playlist doesn't exist
  // Type assertion needed because Prisma types may not be fully updated
  const hasPlaylist = (updated as any)?.spotifyPlaylistId;
  if (finalMode === 'PLAYLIST' && !hasPlaylist) {
    try {
      // Use default Spotify credentials for Playlist Mode
      const spotifyClientId = env.spotify.defaultClientId;
      const spotifyClientSecret = env.spotify.defaultClientSecret;

      if (!spotifyClientId || !spotifyClientSecret) {
        logger.warn('Cannot create playlist: Default Spotify credentials not configured', {
          type: 'playlist_creation_skipped',
          venueId: updated.id,
          venueName: updated.name,
        });
      } else {
        const playlistResult = await createPlaylist(
          updated.id,
          updated.name,
          spotifyClientId,
          spotifyClientSecret
        );

        if (playlistResult.success && playlistResult.playlistId) {
          // Update venue with playlist information
          // Type assertion needed because Prisma types may not be fully updated
          const venueWithPlaylist = await prisma.venue.update({
            where: { id: updated.id },
            data: {
              spotifyPlaylistId: playlistResult.playlistId,
              spotifyPlaylistUrl: playlistResult.playlistUrl || null,
            } as any,
          });

          logger.info('Playlist created successfully for venue (via update)', {
            type: 'playlist_creation_success',
            venueId: updated.id,
            playlistId: playlistResult.playlistId,
            playlistUrl: playlistResult.playlistUrl,
          });

          return serializeVenue(venueWithPlaylist);
        } else {
          logger.error('Failed to create playlist for venue (via update)', {
            type: 'playlist_creation_failed',
            venueId: updated.id,
            venueName: updated.name,
            error: playlistResult.error,
          });
          // Continue - don't fail venue update if playlist creation fails
        }
      }
    } catch (error: any) {
      // Log error but don't fail venue update
      logger.error('Error creating playlist for venue (via update)', {
        type: 'playlist_creation_error',
        venueId: updated.id,
        venueName: updated.name,
        error: error.message,
        stack: error.stack,
      });
      // Continue - venue is updated, playlist can be created later
    }
  }

  return serializeVenue(updated);
};

export const getVenueForUser = async (id: string, userId: string) => {
  const venue = await getVenueById(id);

  if (venue.userId !== userId) {
    throw new ApiError(403, 'You do not have access to this venue');
  }

  return serializeVenue(venue);
};

export const deleteVenue = async (id: string, userId: string) => {
  const existing = await getVenueById(id);

  if (existing.userId !== userId) {
    throw new ApiError(403, 'You do not have access to this venue');
  }

  await prisma.venue.delete({ where: { id } });
};
