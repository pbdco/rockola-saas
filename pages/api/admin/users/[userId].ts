import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoUserAccess, isSuperAdmin, getUser, updateUser, deleteUser } from 'models/user';
import { hashPassword } from '@/lib/auth';
import { unlockAccount } from '@/lib/accountLock';
import { deleteManySessions } from 'models/session';
import { validateWithSchema } from '@/lib/zod';
import { z } from 'zod';
import { email, name, password } from '@/lib/zod/primitives';
import env from '@/lib/env';

const updateUserSchema = z.object({
  name: name(100).optional(),
  email: email.optional(),
  role: z.enum(['USER', 'SUPERADMIN']).optional(),
});

const changePasswordSchema = z.object({
  newPassword: password,
});

const blockUserSchema = z.object({
  blocked: z.boolean(),
});

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

    switch (method) {
      case 'PUT':
        await handlePUT(req, res, userId);
        break;
      case 'PATCH':
        await handlePATCH(req, res, userId);
        break;
      case 'DELETE':
        await handleDELETE(req, res, userId, currentUser.id);
        break;
      default:
        res.setHeader('Allow', 'PUT, PATCH, DELETE');
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

const handlePUT = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => {
  const { name, email, role } = validateWithSchema(updateUserSchema, req.body);

  const user = await getUser({ id: userId });
  if (!user) {
    return res.status(404).json({
      error: { message: 'User not found' },
    });
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await getUser({ email });
    if (existingUser) {
      return res.status(400).json({
        error: { message: 'Email already in use' },
      });
    }
  }

  const updatedUser = await updateUser({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
    },
  });

  return res.status(200).json({ data: updatedUser });
};

const handlePATCH = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) => {
  const { action } = req.query;

  if (action === 'change-password') {
    const { newPassword } = validateWithSchema(changePasswordSchema, req.body);

    const user = await getUser({ id: userId });
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    await updateUser({
      where: { id: userId },
      data: { password: await hashPassword(newPassword) },
    });

    // Remove all sessions for the user
    if (env.nextAuth.sessionStrategy === 'database') {
      await deleteManySessions({
        where: { userId },
      });
    }

    return res.status(200).json({ data: { message: 'Password changed successfully' } });
  }

  if (action === 'block') {
    const { blocked } = validateWithSchema(blockUserSchema, req.body);

    const user = await getUser({ id: userId });
    if (!user) {
      return res.status(404).json({
        error: { message: 'User not found' },
      });
    }

    if (blocked) {
      // Block user
      await updateUser({
        where: { id: userId },
        data: { lockedAt: new Date() },
      });
    } else {
      // Unblock user
      await unlockAccount(user);
    }

    return res.status(200).json({ data: { message: blocked ? 'User blocked' : 'User unblocked' } });
  }

  return res.status(400).json({
    error: { message: 'Invalid action. Use ?action=change-password or ?action=block' },
  });
};

const handleDELETE = async (
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  currentUserId: string
) => {
  const user = await getUser({ id: userId });
  if (!user) {
    return res.status(404).json({
      error: { message: 'User not found' },
    });
  }

  // Prevent deleting yourself
  if (userId === currentUserId) {
    return res.status(400).json({
      error: { message: 'You cannot delete your own account' },
    });
  }

  await deleteUser({ id: userId });

  return res.status(200).json({ data: { message: 'User deleted successfully' } });
};
