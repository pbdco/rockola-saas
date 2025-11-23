import Link from 'next/link';
import React from 'react';
import { useSession } from 'next-auth/react';
import {
  ArrowRightOnRectangleIcon,
  SunIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import useTheme from 'hooks/useTheme';
import env from '@/lib/env';
import { useTranslation } from 'next-i18next';
import { useCustomSignOut } from 'hooks/useCustomSignout';

interface UserMenuProps {
  onLinkClick?: () => void;
}

const UserMenu = ({ onLinkClick }: UserMenuProps) => {
  const { toggleTheme } = useTheme();
  const { status, data } = useSession();
  const { t } = useTranslation('common');
  const signOut = useCustomSignOut();

  if (status === 'loading' || !data) {
    return null;
  }

  const { user } = data;

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div className="space-y-1">
      <div className="px-2 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
        {user.name}
      </div>
      <Link
        href="/settings/account"
        onClick={handleLinkClick}
        className="group flex items-center rounded text-sm text-gray-900 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-800 px-2 p-2 gap-2"
      >
        <UserCircleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {t('account')}
      </Link>

      {env.darkModeEnabled && (
        <button
          className="group flex items-center rounded text-sm text-gray-900 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-800 px-2 p-2 gap-2 w-full text-left"
          type="button"
          onClick={toggleTheme}
        >
          <SunIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {t('switch-theme')}
        </button>
      )}

      <button
        className="group flex items-center rounded text-sm text-gray-900 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-800 px-2 p-2 gap-2 w-full text-left"
        type="button"
        onClick={signOut}
      >
        <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {t('logout')}
      </button>
    </div>
  );
};

export default UserMenu;

