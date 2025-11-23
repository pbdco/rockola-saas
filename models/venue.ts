import { Prisma, Venue, VenueMode } from '@prisma/client';

import { ApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/server-common';

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

  const updated = await prisma.venue.update({
    where: { id },
    data: {
      name: data.name ?? existing.name,
      slug: finalSlug,
      address: data.address ?? existing.address,
      mode: data.mode ?? existing.mode,
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
