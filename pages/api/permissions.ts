import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { permissions } from '@/lib/permissions';
import { getUser } from 'models/user';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: { message: 'Method not allowed' },
    });
  }

  try {
    const session = await getSession(req, res);

    if (!session || !session.user) {
      return res.status(401).json({
        error: { message: 'Unauthorized' },
      });
    }

    const user = await getUser({ id: session.user.id });

    if (!user) {
      return res.status(401).json({
        error: { message: 'Unauthorized' },
      });
    }

    const userPermissions = permissions[user.role] || [];

    return res.status(200).json({
      data: userPermissions,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: { message: error.message || 'Internal server error' },
    });
  }
}

