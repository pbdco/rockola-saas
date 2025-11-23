import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoUserAccess, throwIfNotAllowed, isSuperAdmin } from 'models/user';
import { getVenueForUser, getVenueById } from 'models/venue';
import { prisma } from 'lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    if (method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({
        error: { message: `Method ${method} Not Allowed` },
      });
    }

    await handlePOST(req, res);
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;
    res.status(status).json({ error: { message } });
  }
}

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await throwIfNoUserAccess(req, res);
  throwIfNotAllowed(user, 'venue', 'update');

  const { venueId } = req.query as { venueId: string };

  // Verify venue exists and user has access (no need to store the result)
  if (isSuperAdmin(user)) {
    await getVenueById(venueId);
  } else {
    await getVenueForUser(venueId, user.id);
  }

  // Clear Spotify credentials
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      spotifyUserId: null,
      spotifyDisplayName: null,
      spotifyAccessToken: null,
      spotifyRefreshToken: null,
      spotifyTokenExpiresAt: null,
      n8nCredentialId: null,
    },
  });

  res.status(200).json({ success: true });
};

