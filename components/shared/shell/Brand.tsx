import app from '@/lib/app';
import Image from 'next/image';
import Link from 'next/link';
import useTheme from 'hooks/useTheme';

const Brand = () => {
  const { theme } = useTheme();
  return (
    <div className="flex pt-6 shrink-0 items-center justify-center dark:text-gray-100">
      <Link href="/dashboard" className="cursor-pointer">
        <Image
          src={theme !== 'dark' ? app.logoUrl : '/logowhite.png'}
          alt={app.name}
          width={120}
          height={40}
          className="object-contain"
          unoptimized
          priority
        />
      </Link>
    </div>
  );
};

export default Brand;
