import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { recordMetric } from '@/lib/metrics';
import { createVenueSchema, validateWithSchema } from '@/lib/zod';
import { throwIfNotAllowed, throwIfNoUserAccess, isSuperAdmin } from 'models/user';
import { createVenue, listVenues, listAllVenues } from 'models/venue';

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
      case 'POST':
        throwIfNotAllowed(user, 'venue', 'create');
        await handlePOST(req, res, user);
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
  user: any
) => {
  const { active } = req.query;
  const isActive = active === 'true' ? true : active === 'false' ? false : undefined;

  let venues;

  // SUPERADMIN can see all venues, regular users only see their own
  if (isSuperAdmin(user)) {
    venues = await listAllVenues(isActive);
  } else {
    venues = await listVenues(user.id, isActive);
  }

  recordMetric('venue.fetched');

  res.status(200).json({ data: venues });
};

const handlePOST = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) => {
  const payload = validateWithSchema(createVenueSchema, req.body);

  try {
    const venue = await createVenue(user.id, payload);

    recordMetric('venue.created');

    res.status(200).json({ data: venue });
  } catch (error) {
    handlePrismaError(error);
  }
};


