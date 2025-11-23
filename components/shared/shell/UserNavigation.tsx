import {
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import NavigationItems from './NavigationItems';
import { MenuItem, NavigationProps } from './NavigationItems';
import useSuperAdmin from 'hooks/useSuperAdmin';

interface UserNavigationProps extends NavigationProps {
  onLinkClick?: () => void;
}

const UserNavigation = ({ activePathname, onLinkClick }: UserNavigationProps) => {
  const { t } = useTranslation('common');
  const { isSuperAdmin, isLoading } = useSuperAdmin();

  const menus: MenuItem[] = [
    {
      name: t('venues'),
      href: '/venues',
      icon: BuildingStorefrontIcon,
      active: activePathname?.startsWith('/venues'),
    },
    {
      name: t('account'),
      href: '/settings/account',
      icon: UserCircleIcon,
      active: activePathname === '/settings/account',
    },
    {
      name: t('security'),
      href: '/settings/security',
      icon: ShieldCheckIcon,
      active: activePathname === '/settings/security',
    },
  ];

  // Add SUPERADMIN menu item if user is super admin
  if (!isLoading && isSuperAdmin) {
    menus.unshift({
      name: t('admin'),
      href: '/admin',
      icon: ShieldExclamationIcon,
      active: activePathname?.startsWith('/admin'),
    });
  }

  return <NavigationItems menus={menus} onLinkClick={onLinkClick} />;
};

export default UserNavigation;
