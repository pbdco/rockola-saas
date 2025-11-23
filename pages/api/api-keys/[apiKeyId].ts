import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { throwIfNoUserAccess, isSuperAdmin } from 'models/user';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    const user = await throwIfNoUserAccess(req, res);

    switch (method) {
      case 'DELETE':
        await handleDELETE(req, res, user);
        break;
      default:
        res.setHeader('Allow', 'DELETE');
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

const handleDELETE = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) => {
  const { apiKeyId } = req.query as { apiKeyId: string };

  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
  });

  if (!apiKey) {
    throw new ApiError(404, 'API key not found');
  }

  // Only owner or SUPERADMIN can delete
  if (apiKey.userId !== user.id && !isSuperAdmin(user)) {
    throw new ApiError(403, 'Access denied');
  }

  await prisma.apiKey.delete({
    where: { id: apiKeyId },
  });

  res.status(204).end();
};


