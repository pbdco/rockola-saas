import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import fetcher from 'lib/fetcher';
import type { ApiResponse } from 'types';
import type { SerializedVenue } from 'models/venue';
import { EditVenueForm } from '@/components/venues';
import { Loading } from '@/components/shared';
import { AccountLayout } from '@/components/layouts';
import { Button } from 'react-daisyui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import SpotifyConnect from '@/components/venues/SpotifyConnect';

const EditVenuePage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { venueId } = router.query as { venueId: string };

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<SerializedVenue>>(
    venueId ? `/api/venues/${venueId}` : null,
    fetcher
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center text-red-500">
        {t('failed-to-load-venue')}
      </div>
    );
  }

  const venue = data.data;

  const handleVenueUpdate = (updatedVenue: SerializedVenue) => {
    // Update SWR cache with the new venue data
    mutate(
      {
        data: updatedVenue,
        error: undefined,
      } as ApiResponse<SerializedVenue>,
      false // Don't revalidate, we already have the latest data
    );
  };

  const handleSuccess = () => {
    // Stay on page but scroll to top to show success state
    // This allows users to verify changes and make additional edits if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    router.push('/venues');
  };

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button
            size="sm"
            color="ghost"
            onClick={() => router.push('/venues')}
            startIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            {t('back')}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <button
            onClick={() => router.push('/venues')}
            className="hover:text-primary"
          >
            {t('venues')}
          </button>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100">{venue.name}</span>
        </div>
        <h1 className="text-2xl font-bold">{t('edit-venue')}</h1>
      </div>

      <div className="max-w-4xl">
        {/* Spotify Connection Section */}
        <div className="mb-8 p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">{t('spotify-integration')}</h2>
          <SpotifyConnect venue={venue} />
        </div>

        {/* Edit Venue Form */}
        <div className="p-6 rounded-lg border">
          <EditVenueForm 
            venue={venue} 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            onVenueUpdate={handleVenueUpdate}
          />
        </div>
      </div>
    </>
  );
};

EditVenuePage.getLayout = function getLayout(page: ReactElement) {
  return <AccountLayout>{page}</AccountLayout>;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default EditVenuePage;

