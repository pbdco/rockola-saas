import type { NextApiRequest } from 'next';
import { ApiError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { extractAuthToken } from '@/lib/server-common';
import crypto from 'crypto';
import { User } from '@prisma/client';

export const validateApiKey = async (
  req: NextApiRequest
): Promise<User | null> => {
  const token = extractAuthToken(req);

  if (!token) {
    return null;
  }

  // Hash the provided token to compare with stored hashed keys
  const hashedKey = crypto.createHash('sha256').update(token).digest('hex');

  // Find the API key
  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
    include: { user: true },
  });

  if (!apiKey) {
    return null;
  }

  // Check if API key is expired
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    throw new ApiError(401, 'API key has expired');
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return apiKey.user;
};

export const getUserFromRequest = async (
  req: NextApiRequest
): Promise<User | null> => {
  // Try API key first
  try {
    const user = await validateApiKey(req);
    if (user) {
      return user;
    }
  } catch (error) {
    // If API key validation throws (e.g., expired), re-throw it
    throw error;
  }

  // If no API key, return null (session will be checked separately)
  return null;
};
