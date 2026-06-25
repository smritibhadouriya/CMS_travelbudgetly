import CommentsPage from '@/screens/Comment/CommentPage.jsx';
import { getGroupedComments } from '@/lib/services/comment.service';

// Live admin list — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Mirrors the client's first call: grouped, default tab "pending", "latest".
  // Filter/tab/search/date changes + the 45s poll still refetch client-side.
  const initialComments = await getGroupedComments({ status: 'pending', sort: 'latest' });
  return <CommentsPage initialComments={initialComments} />;
}
