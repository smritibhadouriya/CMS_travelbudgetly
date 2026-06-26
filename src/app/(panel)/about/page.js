import About from './About.jsx';
import { getAbout } from '@/lib/services/about.service';

// Singleton config — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Mirrors GET /api/pages/about → { data: page || { slug: 'about' } }.
  // Save/update still go through the existing API layer unchanged.
  const initialData = (await getAbout('about')) || { slug: 'about' };
  return <About initialData={initialData} />;
}
