import SeoAdmin from '@/screens/PagesContent/SeoAdmin.jsx';
import { getAllSeoEntries } from '@/lib/services/seo.service';

// Aggregated SEO grid — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Same shape the old GET /api/seo/all returned (res.data.data). Refresh button
  // + save flow still use the existing API layer unchanged.
  const initialData = await getAllSeoEntries();
  return <SeoAdmin initialData={initialData} />;
}
