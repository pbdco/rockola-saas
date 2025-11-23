import { useRouter } from 'next/router';

export function useCustomSignOut() {
  const router = useRouter();

  const signOut = async () => {
    try {
      const response = await fetch('/api/auth/custom-signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Signout failed');
      }

      // Redirect to login without callbackUrl to avoid redirect loops
      router.push('/auth/login?callbackUrl=/venues');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return signOut;
}
