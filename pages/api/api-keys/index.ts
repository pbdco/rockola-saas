import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { throwIfNoUserAccess } from 'models/user';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    const user = await throwIfNoUserAccess(req, res);

    switch (method) {
      case 'GET':
        await handleGET(req, res, user);
        break;
      case 'POST':
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
  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ data: apiKeys });
};

const handlePOST = async (
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) => {
  const { name } = req.body;

  if (!name) {
    throw new ApiError(400, 'Name is required');
  }

  // Generate API key
  const crypto = await import('crypto');
  const apiKey = crypto.randomBytes(32).toString('hex');
  const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

  const createdKey = await prisma.apiKey.create({
    data: {
      name,
      userId: user.id,
      hashedKey,
    },
  });

  res.status(201).json({ data: { ...createdKey, apiKey } });
};


