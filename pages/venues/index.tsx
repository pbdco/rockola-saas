import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import useVenues from 'hooks/useVenues';
import { VenueList, VenueEmptyState } from '@/components/venues';
import { Loading } from '@/components/shared';
import { AccountLayout } from '@/components/layouts';
import Link from 'next/link';
import { Button } from 'react-daisyui';

const VenuesPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const { venues, isLoading } = useVenues();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('venues')}</h1>
        <Link href="/venues/create">
          <Button color="primary" size="md">
            {t('create-venue')}
          </Button>
        </Link>
      </div>

      {venues && venues.length > 0 ? (
        <VenueList venues={venues} />
      ) : (
        <VenueEmptyState />
      )}
    </>
  );
};

VenuesPage.getLayout = function getLayout(page: ReactElement) {
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

export default VenuesPage;

