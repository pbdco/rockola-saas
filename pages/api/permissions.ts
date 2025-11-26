import type { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoUserAccess } from 'models/user';
import { permissions } from '@/lib/permissions';

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
    // This function already supports both API keys and sessions
    const user = await throwIfNoUserAccess(req, res);

    const userPermissions = permissions[user.role] || [];

    return res.status(200).json({
      data: userPermissions,
    });
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).json({
      error: { message: error.message || 'Internal server error' },
    });
  }
}

