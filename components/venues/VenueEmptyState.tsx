import { useTranslation } from 'next-i18next';

import { EmptyState } from '@/components/shared';

const VenueEmptyState = () => {
  const { t } = useTranslation('common');

  return (
    <EmptyState
      title={t('no-venues-title')}
      description={t('no-venues-description')}
    />
  );
};

export default VenueEmptyState;
