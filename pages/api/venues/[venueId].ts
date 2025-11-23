import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { recordMetric } from '@/lib/metrics';
import {
  updateVenueSchema,
  validateWithSchema,
  venueIdSchema,
} from '@/lib/zod';
import { throwIfNotAllowed, throwIfNoUserAccess, isSuperAdmin } from 'models/user';
import {
  deleteVenue,
  getVenueForUser,
  getVenueById,
  updateVenue,
} from 'models/venue';

const ensureVenuesEnabled = () => {
  if (!env.teamFeatures.venues) {
    throw new ApiError(404, 'Not Found');
  }
};

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
  const { method } = req;

  try {
    ensureVenuesEnabled();

    const user = await throwIfNoUserAccess(req, res);

    switch (method) {
      case 'GET':
        throwIfNotAllowed(user, 'venue', 'read');
        await handleGET(req, res, user);
        break;
      case 'PUT':
        throwIfNotAllowed(user, 'venue', 'update');
        await handlePUT(req, res, user);
        break;
      case 'DELETE':
        throwIfNotAllowed(user, 'venue', 'delete');
        await handleDELETE(req, res, user);
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
  user: any
) => {
  const { venueId } = validateWithSchema(
    venueIdSchema,
    req.query as { venueId: string }
  );

  // SUPERADMIN can access any venue, regular users only their own
  const venue = isSuperAdmin(user)
    ? await getVenueById(venueId)
    : await getVenueForUser(venueId, user.id);

  recordMetric('venue.fetched');

  res.status(200).json({ data: venue });
};

const handlePUT = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) => {
  const { venueId } = validateWithSchema(
    venueIdSchema,
    req.query as { venueId: string }
  );
  const payload = validateWithSchema(updateVenueSchema, req.body);

  try {
    // For SUPERADMIN, we need to get the venue's actual userId
    let targetUserId = user.id;
    if (isSuperAdmin(user)) {
      const venue = await getVenueById(venueId);
      targetUserId = venue.userId;
    }

    const venue = await updateVenue(venueId, targetUserId, payload);

    recordMetric('venue.updated');

    res.status(200).json({ data: venue });
  } catch (error) {
    handlePrismaError(error);
  }
};

const handleDELETE = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) => {
  const { venueId } = validateWithSchema(
    venueIdSchema,
    req.query as { venueId: string }
  );

  // For SUPERADMIN, we need to get the venue's actual userId
  let targetUserId = user.id;
  if (isSuperAdmin(user)) {
    const venue = await getVenueById(venueId);
    targetUserId = venue.userId;
  }

  await deleteVenue(venueId, targetUserId);

  recordMetric('venue.deleted');

  res.status(204).end();
};


