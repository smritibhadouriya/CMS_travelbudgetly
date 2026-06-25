import BlogTableView from '@/screens/Blog/BlogTableView.jsx';
import { listBlogs } from '@/lib/services/blog.service';

// Live admin list — render per request, never statically prerender / cache.
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Same query the old GET /api/blogs (no params) returned: controller default
  // limit=100, where={}, ordered [{order asc},{publishedDate desc}], author included.
  // The client island still does all search/filter/sort/pagination in-memory.
  const initialBlogs = await listBlogs({ where: {}, skip: 0, take: 100 });
  return <BlogTableView initialBlogs={initialBlogs} />;
}
