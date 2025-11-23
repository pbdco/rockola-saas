import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/server-common';
import { throwIfNoUserAccess } from 'models/user';
import { validateWithSchema } from '@/lib/zod';
import { z } from 'zod';

const checkSlugSchema = z.object({
  slug: z.string().min(1),
  venueId: z.string().uuid().optional(), // Exclude this venue from check (for updates)
});

/**
 * Check if a slug is available and what it would become after auto-resolution
 * Returns:
 * - available: boolean - whether the exact slug is available
 * - suggestedSlug: string - the slug that would actually be used (may have suffix)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    await throwIfNoUserAccess(req, res);

    const { slug, venueId } = validateWithSchema(
      checkSlugSchema,
      req.query as { slug: string; venueId?: string }
    );

    const normalizedSlug = slugify(slug);

    // Check if the exact slug exists
    const existing = await prisma.venue.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });

    // If slug doesn't exist, or it's the same venue we're updating, it's available
    const isAvailable =
      !existing || (venueId && existing.id === venueId);

    // If not available, find what slug would actually be used
    let suggestedSlug = normalizedSlug;
    if (!isAvailable) {
      let counter = 1;
      while (true) {
        const candidate = `${normalizedSlug}-${counter}`;
        const candidateExists = await prisma.venue.findUnique({
          where: { slug: candidate },
          select: { id: true },
        });

        if (!candidateExists || (venueId && candidateExists.id === venueId)) {
          suggestedSlug = candidate;
          break;
        }
        counter++;
      }
    }

    res.status(200).json({
      data: {
        available: isAvailable,
        slug: normalizedSlug,
        suggestedSlug: suggestedSlug,
        willBeModified: !isAvailable && suggestedSlug !== normalizedSlug,
      },
    });
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}
