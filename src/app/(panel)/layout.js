'use client';

import { useEffect, useState } from 'react';
import Main from '@/components/Main';
import config from '@/lib/panel-config';

// Panel shell. Route protection is handled by the cookie-based proxy
// (src/proxy.js), NOT here — a localStorage check here would fight the proxy
// and cause a /login <-> /dashboard redirect loop. This only needs a
// client-only render gate because Header reads localStorage during render,
// which would crash during SSR. (The blog editor now loads CKEditor on its own
// page via next/dynamic, so no global editor deps are needed here.)
export default function PanelLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <Main config={config}>{children}</Main>;
}
