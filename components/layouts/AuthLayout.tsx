import app from '@/lib/app';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import useTheme from 'hooks/useTheme';

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  description?: string;
}

export default function AuthLayout({
  children,
  heading,
  description,
}: AuthLayoutProps) {
  const { t } = useTranslation('common');
  const { theme } = useTheme();

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-20 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <Image
            src={theme !== 'dark' ? app.logoUrl : '/logowhite.png'}
            className="mx-auto object-contain"
            alt={app.name}
            width={120}
            height={40}
            unoptimized
            priority
          />
          {heading && (
            <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              {t(heading)}
            </h2>
          )}
          {description && (
            <p className="text-center text-gray-600 dark:text-white">
              {t(description)}
            </p>
          )}
        </div>
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">{children}</div>
      </div>
    </>
  );
}
