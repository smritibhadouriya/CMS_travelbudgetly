import NewsletterSubscribersPage from './NewsletterSubscribersPage.jsx';
import { getSubscribersPage, getSubscriberStats } from '@/lib/services/newsletter.service';

// Live admin list — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

const LIMIT = 15; // must match the client component's LIMIT

export default async function Page({ searchParams }) {
  const sp     = await searchParams;
  const page   = Math.max(1, Number(sp?.page) || 1);
  const status = sp?.status === 'active' || sp?.status === 'inactive' ? sp.status : '';

  // Same data the /api/newsletter list + stats endpoints produce — now via
  // the shared service functions (single source of truth).
  const [sub, initialStats] = await Promise.all([
    getSubscribersPage({ page, limit: LIMIT, status }),
    getSubscriberStats(),
  ]);

  const initialSubscribers = { subscribers: sub.subscribers, total: sub.total, totalPages: sub.totalPages };

  return (
    <NewsletterSubscribersPage
      initialSubscribers={initialSubscribers}
      initialStats={initialStats}
      initialPage={page}
      initialStatus={status}
    />
  );
}
