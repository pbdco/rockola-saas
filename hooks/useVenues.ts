import useSWR from 'swr';
import type { ApiResponse } from 'types';
import fetcher from 'lib/fetcher';
import type { SerializedVenue } from 'models/venue';

const useVenues = () => {
  const url = '/api/venues';

  const { data, error, isLoading, mutate} = useSWR<
    ApiResponse<SerializedVenue[]>
  >(url, fetcher);

  return {
    isLoading,
    isError: error,
    venues: data?.data,
    mutate,
  };
};

export default useVenues;



