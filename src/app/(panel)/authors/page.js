import AuthorsPage from '@/screens/Author/AuthorsPage.jsx';
import { findAuthors } from '@/lib/services/author.service';

// Live admin list — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Same query the old GET /api/authors (no params) returned: where={},
  // orderBy createdAt desc, response array. Search/filter/sort/pagination
  // remain client-side in the island.
  const initialAuthors = await findAuthors({});
  return <AuthorsPage initialAuthors={initialAuthors} />;
}
