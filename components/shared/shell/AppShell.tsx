import { useState, useEffect } from 'react';
import { Loading } from '@/components/shared';
import { useSession, signOut } from 'next-auth/react';
import React from 'react';
import Header from './Header';
import Drawer from './Drawer';
import { useRouter } from 'next/router';

export default function AppShell({ children }) {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user is blocked or deleted (session.user.id will be undefined)
  useEffect(() => {
    if (status === 'authenticated' && session && !session.user?.id) {
      // User was blocked or deleted, sign them out
      signOut({ callbackUrl: '/auth/login' });
    }
  }, [status, session]);

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return;
  }

  // If authenticated but no user ID, show loading while sign out happens
  if (status === 'authenticated' && session && !session.user?.id) {
    return <Loading />;
  }

  return (
    <div>
      <Drawer sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="lg:pl-64">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="py-5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
