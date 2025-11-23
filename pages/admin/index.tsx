import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { AccountLayout } from '@/components/layouts';
import { getSession } from '@/lib/session';
import { getUser, isSuperAdmin } from 'models/user';
import AdminDashboard from '@/components/admin/AdminDashboard';

const AdminPage: NextPageWithLayout = () => {
  const { t } = useTranslation('common');

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('admin-dashboard')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('admin-dashboard-description')}
        </p>
      </div>
      <AdminDashboard />
    </>
  );
};

AdminPage.getLayout = function getLayout(page: ReactElement) {
  return <AccountLayout>{page}</AccountLayout>;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context.req, context.res);

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const user = await getUser({ id: session.user.id });

  if (!user || !isSuperAdmin(user)) {
    return {
      redirect: {
        destination: '/venues',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(context.locale as string, ['common'])),
    },
  };
};

export default AdminPage;

