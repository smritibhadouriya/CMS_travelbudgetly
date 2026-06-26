import React from 'react';

// Presentational Server Component — receives pre-fetched stats from the
// dashboard page (Server Component → dashboard.service → Prisma). No client
// JS, no axios, no data fetching here.

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
    {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
  </div>
);

const DashboardView = ({ stats }) => {
  const { blogs, packages, authors, comments, subscribers, recentBlogs } = stats;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Blogs"
          value={blogs.total}
          sub={`${blogs.published} published · ${blogs.draft} draft`}
        />
        <StatCard
          label="Packages"
          value={packages.total}
          sub={`${packages.published} published · ${packages.draft} draft`}
        />
        <StatCard label="Authors" value={authors.total} sub="active" />
        <StatCard label="Comments" value={comments.total} sub={`${comments.pending} pending`} />
        <StatCard label="Subscribers" value={subscribers.total} sub="active" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Blogs</h2>
        {recentBlogs.length === 0 ? (
          <p className="text-slate-400 text-sm">No blogs yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentBlogs.map((b) => (
              <li key={b.id} className="py-3 flex items-center justify-between">
                <span className="text-sm text-slate-700">{b.title || b.slug}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    b.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {b.isPublished ? 'Published' : 'Draft'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
