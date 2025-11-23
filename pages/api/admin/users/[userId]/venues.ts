import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoUserAccess, isSuperAdmin, getUser } from 'models/user';
import { listVenues, createVenue } from 'models/venue';
import { validateWithSchema } from '@/lib/zod';
import { createVenueSchema } from '@/lib/zod';
import { Prisma } from '@prisma/client';

const handlePrismaError = (error: unknown) => {
  // Note: Slug conflicts are now handled automatically in models/venue.ts
  // by appending suffixes (e.g., "my-venue-2", "my-venue-3")
  // This handler is kept for any other potential unique constraint violations
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    // Log unexpected unique constraint violations
    console.error('Unexpected unique constraint violation:', error);
  }

  throw error;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method, query } = req;
  const { userId } = query;

  try {
    const currentUser = await throwIfNoUserAccess(req, res);

    if (!isSuperAdmin(currentUser)) {
      return res.status(403).json({
        error: { message: 'Forbidden - Super Admin access required' },
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        error: { message: 'User ID is required' },
      });
    }

    // Verify target user exists
    const targetUser = await getUser({ id: userId });
    if (!targetUser) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    switch (method) {
      case 'GET':
        await handleGET(req, res, userId);
        break;
      case 'POST':
        await handlePOST(req, res, userId);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

const handleGET = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => {
  const { active } = req.query;
  const isActive = active === 'true' ? true : active === 'false' ? false : undefined;

  const venues = await listVenues(userId, isActive);

  return res.status(200).json({ data: venues });
};

const handlePOST = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => {
  const payload = validateWithSchema(createVenueSchema, req.body);

  try {
    const venue = await createVenue(userId, payload);

    return res.status(201).json({ data: venue });
  } catch (error) {
    handlePrismaError(error);
  }
};
