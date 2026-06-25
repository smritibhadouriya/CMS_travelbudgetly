import NewsletterSubscribersPage from '@/screens/PagesContent/NewsletterSubscribersPage.jsx';
import { countSubscribers, findSubscribers } from '@/lib/services/newsletter.service';

// Live admin list — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

const LIMIT = 15; // must match the client component's LIMIT

export default async function Page({ searchParams }) {
  const sp     = await searchParams;
  const page   = Math.max(1, Number(sp?.page) || 1);
  const status = sp?.status === 'active' || sp?.status === 'inactive' ? sp.status : '';

  // Mirrors the controller's getAllSubscribers `where` (service translates
  // isActive → unsubscribedAt) and getStats counts — fetched directly here.
  const where = {};
  if (status === 'active')   where.isActive = true;
  if (status === 'inactive') where.isActive = false;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [total, subscribers, statTotal, statActive, statInactive, statNew] = await Promise.all([
    countSubscribers(where),
    findSubscribers({ where, skip: (page - 1) * LIMIT, take: LIMIT }),
    countSubscribers(),
    countSubscribers({ isActive: true }),
    countSubscribers({ isActive: false }),
    countSubscribers({ subscribedAt: { gte: sevenDaysAgo } }),
  ]);

  const initialSubscribers = { subscribers, total, totalPages: Math.ceil(total / LIMIT) };
  const initialStats = { total: statTotal, active: statActive, inactive: statInactive, newThisWeek: statNew };

  return (
    <NewsletterSubscribersPage
      initialSubscribers={initialSubscribers}
      initialStats={initialStats}
      initialPage={page}
      initialStatus={status}
    />
  );
}
