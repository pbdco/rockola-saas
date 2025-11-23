import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import type { ApiResponse } from 'types';
import type { User } from '@prisma/client';

const useSuperAdmin = () => {
  const { data: session, status } = useSession();
  const { data, error, isLoading } = useSWR<ApiResponse<User>>(
    session?.user?.id ? '/api/users/me' : null,
    fetcher
  );

  const isSuperAdmin = data?.data?.role === 'SUPERADMIN' || false;
  const loading = status === 'loading' || isLoading;

  return { isSuperAdmin, isLoading: loading };
};

export default useSuperAdmin;

