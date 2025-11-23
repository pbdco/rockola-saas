import fetcher from '@/lib/fetcher';
import { ApiKey } from '@prisma/client';
import useSWR, { mutate } from 'swr';
import type { ApiResponse } from 'types';

const useAPIKeys = () => {
  const url = `/api/api-keys`;

  const { data, error, isLoading } = useSWR<ApiResponse<ApiKey[]>>(url, fetcher);

  const mutateAPIKeys = async () => {
    mutate(url);
  };

  return {
    data,
    isLoading,
    error,
    mutate: mutateAPIKeys,
  };
};

export default useAPIKeys;
