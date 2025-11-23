import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoUserAccess, isSuperAdmin, createUser, getUser } from 'models/user';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { validateWithSchema } from '@/lib/zod';
import { z } from 'zod';
import { email, name, password } from '@/lib/zod/primitives';
import { Role } from '@prisma/client';

const createUserSchema = z.object({
  name: name(100),
  email: email,
  password: password,
  role: z.enum(['USER', 'SUPERADMIN']).optional(),
});


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    const user = await throwIfNoUserAccess(req, res);

    if (!isSuperAdmin(user)) {
      return res.status(403).json({
        error: { message: 'Forbidden - Super Admin access required' },
      });
    }

    switch (method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'POST':
        await handlePOST(req, res);
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
  res: NextApiResponse
) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerified: true,
      lockedAt: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          venues: true,
          apiKeys: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.status(200).json({ data: users });
};

const handlePOST = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const { name, email, password, role } = validateWithSchema(createUserSchema, req.body);

  // Check if user already exists
  const existingUser = await getUser({ email });
  if (existingUser) {
    return res.status(400).json({
      error: { message: 'User with this email already exists' },
    });
  }

  const newUser = await createUser({
    name,
    email,
    password: await hashPassword(password),
    role: role || Role.USER,
    emailVerified: new Date(), // Auto-verify for admin-created users
  });

  return res.status(201).json({ data: newUser });
};

