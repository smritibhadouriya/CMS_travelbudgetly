'use client';

// Summernote CSS is safe to import statically (no JS eval); the jQuery +
// Summernote JS are browser-only and loaded dynamically in the effect below.
import 'summernote/dist/summernote-lite.css';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Main from '@/components/Main';
import config from '@/lib/panel-config';

// Protected shell: auth guard + client-only gate. Returns null during SSR and
// until browser deps load, so child pages (localStorage / jQuery / Summernote)
// only ever run in the browser. Replaces <ProtectedRoute> + <Main><Outlet/>.
export default function PanelLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.replace('/login');
      return;
    }
    let active = true;
    (async () => {
      await import('@/lib/setup-jquery');               // sets window.$ / window.jQuery
      await import('summernote/dist/summernote-lite.js'); // jQuery plugin (needs window.$)
      if (active) setReady(true);
    })();
    return () => { active = false; };
  }, [router]);

  if (!ready) return null;

  return <Main config={config}>{children}</Main>;
}
