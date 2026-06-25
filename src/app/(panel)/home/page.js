import HomePage from '@/screens/PagesContent/HomePage.jsx';
import { getHome } from '@/lib/services/home.service';

// Singleton config — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Mirrors GET /api/pages/home → { data: page || { slug: 'home' } }.
  // Save/update still go through the existing API layer unchanged.
  const initialData = (await getHome('home')) || { slug: 'home' };
  return <HomePage initialData={initialData} />;
}
