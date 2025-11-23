import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserNavigation from './UserNavigation';

interface NavigationProps {
  onLinkClick?: () => void;
}

const Navigation = ({ onLinkClick }: NavigationProps) => {
  const { asPath, isReady } = useRouter();
  const [activePathname, setActivePathname] = useState<null | string>(null);

  useEffect(() => {
    if (isReady && asPath) {
      const activePathname = new URL(asPath, location.href).pathname;
      setActivePathname(activePathname);
    }
  }, [asPath, isReady]);

  return (
    <nav className="flex flex-1 flex-col">
      <UserNavigation activePathname={activePathname} onLinkClick={onLinkClick} />
    </nav>
  );
};

export default Navigation;
