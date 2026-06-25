'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Index: send to dashboard if logged in, else to login (matches old SPA).
export default function IndexPage() {
  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== 'undefined' && localStorage.getItem('token');
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);
  return null;
}
