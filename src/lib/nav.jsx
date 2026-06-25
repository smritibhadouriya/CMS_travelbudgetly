'use client';

// Compatibility shim: exposes Next.js navigation under the same names the
// components already use (@/lib/nav API), so only the import source
// needs to change — all `navigate(...)`, `useParams()`, `useLocation()`,
// and `<Link to=...>` usage stays identical.
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams } from 'next/navigation';

export function useNavigate() {
  const router = useRouter();
  return (to, opts) => {
    if (typeof to === 'number') {
      if (to < 0) router.back();
      else router.forward();
      return;
    }
    if (opts && opts.replace) router.replace(to);
    else router.push(to);
  };
}

export function useLocation() {
  const pathname = usePathname();
  return { pathname: pathname || '/' };
}

export function useParams() {
  return useNextParams() || {};
}

export function Link({ to, href, children, ...rest }) {
  return (
    <NextLink href={to ?? href ?? '#'} {...rest}>
      {children}
    </NextLink>
  );
}
