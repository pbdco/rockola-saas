import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoUserAccess, isSuperAdmin, getUser } from 'models/user';
import { getVenueById, updateVenue, deleteVenue } from 'models/venue';
import { validateWithSchema } from '@/lib/zod';
import { updateVenueSchema } from '@/lib/zod';
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
  const { userId, venueId } = query;

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

    if (!venueId || typeof venueId !== 'string') {
      return res.status(400).json({
        error: { message: 'Venue ID is required' },
      });
    }

    // Verify target user exists
    const targetUser = await getUser({ id: userId });
    if (!targetUser) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    // Verify venue exists and belongs to the user
    const venue = await getVenueById(venueId);
    if (venue.userId !== userId) {
      return res.status(403).json({
        error: { message: 'Venue does not belong to this user' },
      });
    }

    switch (method) {
      case 'GET':
        await handleGET(req, res, venueId);
        break;
      case 'PUT':
        await handlePUT(req, res, venueId, userId);
        break;
      case 'DELETE':
        await handleDELETE(req, res, venueId, userId);
        break;
      default:
        res.setHeader('Allow', 'GET, PUT, DELETE');
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
  venueId: string
) => {
  const venue = await getVenueById(venueId);
  return res.status(200).json({ data: venue });
};

const handlePUT = async (
  req: NextApiRequest,
  res: NextApiResponse,
  venueId: string,
  userId: string
) => {
  const payload = validateWithSchema(updateVenueSchema, req.body);

  try {
    const venue = await updateVenue(venueId, userId, payload);
    return res.status(200).json({ data: venue });
  } catch (error) {
    handlePrismaError(error);
  }
};

const handleDELETE = async (
  req: NextApiRequest,
  res: NextApiResponse,
  venueId: string,
  userId: string
) => {
  await deleteVenue(venueId, userId);
  return res.status(204).end();
};
