import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { AccountLayout } from '@/components/layouts';
import { CreateVenueForm } from '@/components/venues';
import { useRouter } from 'next/router';
import { Button } from 'react-daisyui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CreateVenuePage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/venues');
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
            onClick={handleCancel}
            startIcon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            {t('back')}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <button
            onClick={handleCancel}
            className="hover:text-primary"
          >
            {t('venues')}
          </button>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100">{t('create-venue')}</span>
        </div>
        <h1 className="text-2xl font-bold">{t('create-venue')}</h1>
      </div>

      <CreateVenueForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </>
  );
};

CreateVenuePage.getLayout = function getLayout(page: ReactElement) {
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

export default CreateVenuePage;

