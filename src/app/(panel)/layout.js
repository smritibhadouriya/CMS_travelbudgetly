'use client';

import Main from '@/app/(panel)/_components/Main';
import config from '@/lib/panel-config';

// Panel shell. Route protection is handled by the cookie-based proxy
// (src/proxy.js), NOT here. Renders normal SSR HTML — the header's localStorage
// read now happens in a useEffect (see _components/Header.jsx), so no client-only
// render gate is required.
export default function PanelLayout({ children }) {
  return <Main config={config}>{children}</Main>;
}
