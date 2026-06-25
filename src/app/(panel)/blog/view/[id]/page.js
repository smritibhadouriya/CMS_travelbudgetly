'use client';
import ViewBlog from '@/screens/Blog/ViewBlog.jsx';
import config from '@/lib/panel-config';

export default function Page() {
  return <ViewBlog config={config} />;
}
