'use client';

import { useEffect, useState } from 'react';
import Login from './Login';

// Client-only gate so the Login component (browser APIs) never runs during SSR.
export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Login />;
}
