import RedirectsAdmin from '@/screens/PagesContent/RedirectsAdmin.jsx';
import { findAllRedirects } from '@/lib/services/redirect.service';

// Live admin list — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Same query the old GET /api/redirects returned: all redirects, orderBy
  // oldSlug asc, response array. Mutations stay client-side.
  const initialRedirects = await findAllRedirects();
  return <RedirectsAdmin initialRedirects={initialRedirects} />;
}
