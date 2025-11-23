import fetcher from '@/lib/fetcher';
import type { Permission } from '@/lib/permissions';
import useSWR from 'swr';
import type { ApiResponse } from 'types';

const usePermissions = () => {
  const { data, error, isLoading } = useSWR<ApiResponse<Permission[]>>(
    '/api/permissions',
    fetcher
  );

  return {
    isLoading,
    isError: error,
    permissions: data?.data,
  };
};

export default usePermissions;
