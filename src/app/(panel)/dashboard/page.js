import DashboardView from '@/screens/DashboardView.jsx';
import { getDashboardStats } from '@/lib/services/dashboard.service';

// Live admin stats — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const stats = await getDashboardStats();
  return <DashboardView stats={stats} />;
}
