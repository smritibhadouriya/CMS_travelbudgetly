import PackageTableView from './PackageTableView.jsx';
import { listPackages } from '@/lib/services/package.service';

// Live admin list — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Same query the old GET /api/packages?limit=500 returned: where={}, skip 0,
  // take 500, ordered [{isFeatured desc},{order asc},{createdAt desc}].
  // Search stays client-side in the island.
  const initialPackages = await listPackages({ where: {}, skip: 0, take: 500 });
  return <PackageTableView initialPackages={initialPackages} />;
}
