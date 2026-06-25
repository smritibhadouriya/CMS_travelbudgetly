'use client';
// // import React, { useState, useEffect } from 'react';
// // import { useNavigate } from '@/lib/nav';
// // import { toast } from 'react-toastify';

// // import { getBlogs } from "../service/blog.service.js";
// // import { getOpenPositions } from "../service/openposition.service";
// // import { getAllServices } from "../service/services.service.js";
// // import { fetchSeo } from "../service/seo.service.js";

// // const DashboardView = () => {
// //   const navigate = useNavigate();

// //   // States
// //   const [blogStats, setBlogStats] = useState({ total: 0, published: 0, draft: 0 });
// //   const [serviceStats, setServiceStats] = useState({ total: 0, published: 0, draft: 0 });
// //   const [positionStats, setPositionStats] = useState({ total: 0, active: 0, closed: 0 });
// //   const [seoScore, setSeoScore] = useState(92); // Default, can be made smarter later
// //   const [recentActivity, setRecentActivity] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   // Fetch all data
// //   useEffect(() => {
// //     const fetchAllData = async () => {
// //       setLoading(true);
// //       try {
// //         // 1. Blogs
// //         const blogsRes = await getBlogs();
// //         const blogs = blogsRes.data?.blogs || [];
// //         const publishedBlogs = blogs.filter(b => b.status === 'published').length;
// //         setBlogStats({
// //           total: blogs.length,
// //           published: publishedBlogs,
// //           draft: blogs.length - publishedBlogs,
// //         });

// //         // 2. Services
// //         const servicesRes = await getAllServices();
// //         const services = servicesRes.data?.data || [];
// //         const publishedServices = services.filter(s => s.status === 'published').length;
// //         setServiceStats({
// //           total: services.length,
// //           published: publishedServices,
// //           draft: services.length - publishedServices,
// //         });

// //         // 3. Open Positions
// //         const positionsRes = await getOpenPositions();
// //         const positions = positionsRes.data?.positions || [];
// //         const activePositions = positions.filter(p => p.status === 'active').length;
// //         setPositionStats({
// //           total: positions.length,
// //           active: activePositions,
// //           closed: positions.length - activePositions,
// //         });

// //         // 4. SEO (basic score based on configuration)
// //         const seoRes = await fetchSeo();
// //         if (seoRes?.data) {
// //           const seo = seoRes.data;
// //           let score = 85;
// //           if (seo.sitemapEnabled) score += 5;
// //           if (seo.metaTitle && seo.metaDescription) score += 5;
// //           if (seo.robotsTxt) score += 3;
// //           setSeoScore(Math.min(score, 100));
// //         }

// //         // Recent Activity (latest 5 items from all sources)
// //         const allRecent = [
// //           ...blogs.map(b => ({ type: 'blog', title: b.title, date: b.updatedAt, status: b.status })),
// //           ...services.map(s => ({ type: 'service', title: s.hero?.title || s.name, date: s.updatedAt, status: s.status })),
// //           ...positions.map(p => ({ type: 'position', title: p.title || p.Title, date: p.updatedAt, status: p.status })),
// //         ].sort((a, b) => new Date(b.date) - new Date(a.date))
// //          .slice(0, 5);

// //         setRecentActivity(allRecent);

// //       } catch (err) {
// //         console.error(err);
// //         toast.error("Failed to load dashboard data");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchAllData();
// //   }, []);

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center bg-gray-50">
// //         <div className="flex items-center gap-3 text-xl text-gray-600">
// //           <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
// //           Loading dashboard...
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="min-h-screen bg-gray-50 p-6 md:p-8">
// //       {/* Header */}
// //       <div className="flex justify-between items-center mb-8">
// //         <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
// //         <button
// //           onClick={() => window.location.reload()}
// //           className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-medium"
// //         >
// //           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.058 11H1M12 3v2m0 16v2m9-9H15" />
// //           </svg>
// //           Refresh
// //         </button>
// //       </div>

// //       {/* Stats Cards */}
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
// //         {/* Blogs */}
// //         <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
// //           <div className="flex items-center justify-between mb-4">
// //             <h3 className="text-lg font-semibold text-gray-800">Blogs</h3>
// //             <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 text-xl">
// //               ✍️
// //             </div>
// //           </div>
// //           <div className="space-y-2 text-sm mb-4">
// //             <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-semibold">{blogStats.total}</span></div>
// //             <div className="flex justify-between"><span className="text-green-600">Published</span><span className="font-semibold text-green-600">{blogStats.published}</span></div>
// //             <div className="flex justify-between"><span className="text-amber-600">Drafts</span><span className="font-semibold text-amber-600">{blogStats.draft}</span></div>
// //           </div>
// //           <button
// //             onClick={() => navigate('/blog')}
// //             className="mt-auto py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition text-sm"
// //           >
// //             Manage Blogs
// //           </button>
// //         </div>

// //         {/* Services */}
// //         <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
// //           <div className="flex items-center justify-between mb-4">
// //             <h3 className="text-lg font-semibold text-gray-800">Services</h3>
// //             <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 text-xl">
// //               ⚙️
// //             </div>
// //           </div>
// //           <div className="space-y-2 text-sm mb-4">
// //             <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-semibold">{serviceStats.total}</span></div>
// //             <div className="flex justify-between"><span className="text-green-600">Published</span><span className="font-semibold text-green-600">{serviceStats.published}</span></div>
// //             <div className="flex justify-between"><span className="text-amber-600">Drafts</span><span className="font-semibold text-amber-600">{serviceStats.draft}</span></div>
// //           </div>
// //           <button
// //             onClick={() => navigate('/services')}
// //             className="mt-auto py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition text-sm"
// //           >
// //             Manage Services
// //           </button>
// //         </div>

// //         {/* Open Positions */}
// //         <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
// //           <div className="flex items-center justify-between mb-4">
// //             <h3 className="text-lg font-semibold text-gray-800">Open Positions</h3>
// //             <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 text-xl">
// //               💼
// //             </div>
// //           </div>
// //           <div className="space-y-2 text-sm mb-4">
// //             <div className="flex justify-between"><span className="text-gray-600">Total</span><span className="font-semibold">{positionStats.total}</span></div>
// //             <div className="flex justify-between"><span className="text-green-600">Active</span><span className="font-semibold text-green-600">{positionStats.active}</span></div>
// //             <div className="flex justify-between"><span className="text-red-600">Closed</span><span className="font-semibold text-red-600">{positionStats.closed}</span></div>
// //           </div>
// //           <button
// //             onClick={() => navigate('/open-position')}
// //             className="mt-auto py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition text-sm"
// //           >
// //             Manage Positions
// //           </button>
// //         </div>

// //         {/* SEO Health */}
// //         <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
// //           <div className="flex items-center justify-between mb-4">
// //             <h3 className="text-lg font-semibold text-gray-800">SEO Health</h3>
// //             <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 text-xl">
// //               📈
// //             </div>
// //           </div>
// //           <div className="flex items-center justify-center mb-4">
// //             <div className="relative w-20 h-20">
// //               <svg className="w-full h-full" viewBox="0 0 36 36">
// //                 <path
// //                   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
// //                   fill="none"
// //                   stroke="#E5E7EB"
// //                   strokeWidth="3"
// //                 />
// //                 <path
// //                   d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
// //                   fill="none"
// //                   stroke="#10B981"
// //                   strokeWidth="3"
// //                   strokeDasharray={`${seoScore}, 100`}
// //                   strokeLinecap="round"
// //                 />
// //               </svg>
// //               <div className="absolute inset-0 flex items-center justify-center">
// //                 <span className="text-xl font-bold text-emerald-600">{seoScore}</span>
// //               </div>
// //             </div>
// //           </div>
// //           <p className="text-center text-sm text-emerald-600 font-medium mb-4">
// //             {seoScore >= 90 ? 'Excellent' : seoScore >= 70 ? 'Good' : 'Needs Improvement'}
// //           </p>
// //           <button
// //             onClick={() => navigate('/seo-handling')}
// //             className="mt-auto py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition text-sm"
// //           >
// //             Manage SEO
// //           </button>
// //         </div>
// //       </div>

// //       {/* Quick Actions */}
// //       <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
// //         <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
// //         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
// //           <button onClick={() => navigate('/blog/addblog')} className="bg-white border border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 rounded-lg py-6 flex flex-col items-center gap-2 transition">
// //             <span className="text-2xl">✍️</span>
// //             <span className="font-medium text-gray-800 text-sm">New Blog</span>
// //           </button>

// //           <button onClick={() => navigate('/services/add')} className="bg-white border border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 rounded-lg py-6 flex flex-col items-center gap-2 transition">
// //             <span className="text-2xl">⚙️</span>
// //             <span className="font-medium text-gray-800 text-sm">New Service</span>
// //           </button>

// //           <button onClick={() => navigate('/open-position/addposition')} className="bg-white border border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 rounded-lg py-6 flex flex-col items-center gap-2 transition">
// //             <span className="text-2xl">💼</span>
// //             <span className="font-medium text-gray-800 text-sm">New Position</span>
// //           </button>
// //         </div>
// //       </div>

// //       {/* Recent Activity */}
// //       <div className="bg-white rounded-xl p-6 shadow-sm">
// //         <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>

// //         {recentActivity.length === 0 ? (
// //           <p className="text-gray-500 py-4 text-center text-sm">No recent activity yet.</p>
// //         ) : (
// //           <div className="space-y-3">
// //             {recentActivity.map((item, idx) => (
// //               <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
// //                 <div className="flex items-center gap-3">
// //                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
// //                     item.type === 'blog' ? 'bg-purple-50 text-purple-600' :
// //                     item.type === 'service' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
// //                   }`}>
// //                     {item.type === 'blog' ? '✍️' : item.type === 'service' ? '⚙️' : '💼'}
// //                   </div>
// //                   <div>
// //                     <p className="font-medium text-gray-800 text-sm">{item.title}</p>
// //                     <p className="text-xs text-gray-500 capitalize">{item.type} • {item.status}</p>
// //                   </div>
// //                 </div>
// //                 <span className="text-xs text-gray-400 whitespace-nowrap">
// //                   {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
// //                 </span>
// //               </div>
// //             ))}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default DashboardView;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from '@/lib/nav';
// import { toast } from 'react-toastify';

// import { getBlogs } from "../service/blog.service.js";

// const DashboardView = () => {
//   const navigate = useNavigate();

//   // States
//   const [blogStats, setBlogStats] = useState({ total: 0, published: 0, draft: 0 });
//   const [recentActivity, setRecentActivity] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Fetch Blog Data
//   useEffect(() => {
//     const fetchBlogData = async () => {
//       setLoading(true);
//       try {
//         const blogsRes = await getBlogs();
//         const blogs = blogsRes.data?.blogs || [];

//         const publishedBlogs = blogs.filter(b => b.status === 'published').length;

//         setBlogStats({
//           total: blogs.length,
//           published: publishedBlogs,
//           draft: blogs.length - publishedBlogs,
//         });

//         // Recent Activity (latest 5 blogs)
//         const recentBlogs = blogs
//           .map(b => ({
//             type: 'blog',
//             title: b.title,
//             date: b.updatedAt,
//             status: b.status
//           }))
//           .sort((a, b) => new Date(b.date) - new Date(a.date))
//           .slice(0, 5);

//         setRecentActivity(recentBlogs);

//       } catch (err) {
//         console.error(err);
//         toast.error("Failed to load dashboard data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBlogData();
//   }, []);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="flex items-center gap-3 text-xl text-gray-600">
//           <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
//           Loading dashboard...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      
//       {/* Header */}
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
//         <button
//           onClick={() => window.location.reload()}
//           className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-medium"
//         >
//           Refresh
//         </button>
//       </div>

//       {/* Blog Stats Card */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

//         <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-semibold text-gray-800">Blogs</h3>
//             <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 text-xl">
//               ✍️
//             </div>
//           </div>

//           <div className="space-y-2 text-sm mb-4">
//             <div className="flex justify-between">
//               <span className="text-gray-600">Total</span>
//               <span className="font-semibold">{blogStats.total}</span>
//             </div>

//             <div className="flex justify-between">
//               <span className="text-green-600">Published</span>
//               <span className="font-semibold text-green-600">{blogStats.published}</span>
//             </div>

//             <div className="flex justify-between">
//               <span className="text-amber-600">Drafts</span>
//               <span className="font-semibold text-amber-600">{blogStats.draft}</span>
//             </div>
//           </div>

//           <button
//             onClick={() => navigate('/blog')}
//             className="mt-auto py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition text-sm"
//           >
//             Manage Blogs
//           </button>
//         </div>

//       </div>

//       {/* Quick Action */}
//       <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>

//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//           <button
//             onClick={() => navigate('/blog/addblog')}
//             className="bg-white border border-indigo-200 hover:border-indigo-600 hover:bg-indigo-50 rounded-lg py-6 flex flex-col items-center gap-2 transition"
//           >
//             <span className="text-2xl">✍️</span>
//             <span className="font-medium text-gray-800 text-sm">New Blog</span>
//           </button>
//         </div>
//       </div>

//       {/* Recent Activity */}
//       <div className="bg-white rounded-xl p-6 shadow-sm">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Blogs</h3>

//         {recentActivity.length === 0 ? (
//           <p className="text-gray-500 py-4 text-center text-sm">
//             No recent blog activity yet.
//           </p>
//         ) : (
//           <div className="space-y-3">
//             {recentActivity.map((item, idx) => (
//               <div
//                 key={idx}
//                 className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-purple-50 text-purple-600">
//                     ✍️
//                   </div>
//                   <div>
//                     <p className="font-medium text-gray-800 text-sm">
//                       {item.title}
//                     </p>
//                     <p className="text-xs text-gray-500 capitalize">
//                       {item.status}
//                     </p>
//                   </div>
//                 </div>

//                 <span className="text-xs text-gray-400 whitespace-nowrap">
//                   {new Date(item.date).toLocaleDateString('en-US', {
//                     month: 'short',
//                     day: 'numeric',
//                     hour: '2-digit',
//                     minute: '2-digit'
//                   })}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//     </div>
//   );
// };

// export default DashboardView;


// import React, { useState, useEffect } from 'react';
// import { useNavigate } from '@/lib/nav';
// import { toast } from 'react-toastify';
// import { getBlogs, getProducts } from "../service/api.js";

// const DashboardView = () => {
//   const navigate = useNavigate();

//   const [stats, setStats] = useState({
//     blogs:       { total: 0, published: 0, draft: 0 },
//     creditCards: { total: 0, active: 0, topPicks: 0 },
//     insurance:   { total: 0, active: 0, topPicks: 0 },
//     investments: { total: 0, active: 0, topPicks: 0 },
//   });
//   const [recentBlogs, setRecentBlogs] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;
//     const fetchAll = async () => {
//       setLoading(true);
//       try {
//         const [blogsRes, ccRes, insRes, invRes] = await Promise.allSettled([
//           getBlogs({ limit: 500 }),
//           getProducts({ type: 'credit-card', limit: 500 }),
//           getProducts({ type: 'insurance',   limit: 500 }),
//           getProducts({ type: 'investment',  limit: 500 }),
//         ]);
//         if (cancelled) return;

//         const blogs = blogsRes.status === 'fulfilled'
//           ? (blogsRes.value?.data?.data || []) : [];

//         const pStats = (res) => {
//           if (res.status !== 'fulfilled') return { total: 0, active: 0, topPicks: 0 };
//           const items = res.value?.data?.data || [];
//           return {
//             total:    items.length,
//             active:   items.filter(p => p.isActive !== false).length,
//             topPicks: items.filter(p => p.isTopPick).length,
//           };
//         };

//         setStats({
//           blogs:       { total: blogs.length, published: blogs.filter(b => b.isPublished).length, draft: blogs.filter(b => !b.isPublished).length },
//           creditCards: pStats(ccRes),
//           insurance:   pStats(insRes),
//           investments: pStats(invRes),
//         });

//         setRecentBlogs(
//           [...blogs]
//             .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
//             .slice(0, 6)
//         );
//       } catch {
//         if (!cancelled) toast.error("Failed to load dashboard data");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };
//     fetchAll();
//     return () => { cancelled = true; };
//   }, []);

//   const fmtDate = (d) => d
//     ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
//     : '—';

//   if (loading) return (
//     <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
//       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
//         <div style={{ width: 32, height: 32, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
//         <p style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>Loading dashboard…</p>
//       </div>
//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//     </div>
//   );

//   const StatRow = ({ label, value, color }) => (
//     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
//       <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
//       <span style={{ fontSize: 14, fontWeight: 700, color: color || '#1e293b' }}>{value}</span>
//     </div>
//   );

//   const Card = ({ icon, iconBg, title, rows, btnLabel, btnColor, btnBg, onBtn }) => (
//     <div style={{
//       background: '#fff', borderRadius: 16, border: '1px solid #e8edf3',
//       boxShadow: '0 1px 8px rgba(0,0,0,0.05)', overflow: 'hidden',
//       display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s',
//     }}
//       onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
//       onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
//     >
//       <div style={{ padding: '18px 20px' }}>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
//           <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{icon}</div>
//           <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</span>
//         </div>
//         <div>{rows.map((r, i) => <StatRow key={i} label={r.label} value={r.value} color={r.color} />)}</div>
//       </div>
//       <div style={{ padding: '0 16px 16px' }}>
//         <button onClick={onBtn} style={{
//           width: '100%', padding: '9px 0', borderRadius: 10, border: 'none',
//           background: btnBg, color: btnColor, fontWeight: 700, fontSize: 13, cursor: 'pointer',
//           transition: 'filter 0.15s',
//         }}
//           onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.92)'}
//           onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
//         >{btnLabel}</button>
//       </div>
//     </div>
//   );

//   const QBtn = ({ icon, label, sub, color, bg, onClick }) => (
//     <button onClick={onClick} style={{
//       background: '#fff', border: '1px solid #e8edf3', borderRadius: 12,
//       padding: '12px 12px', display: 'flex', alignItems: 'center', gap: 10,
//       cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%',
//     }}
//       onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg; }}
//       onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8edf3'; e.currentTarget.style.background = '#fff'; }}
//     >
//       <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
//       <div style={{ flex: 1 }}>
//         <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{label}</div>
//         {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
//       </div>
//       <span style={{ color: '#cbd5e1', fontSize: 14 }}>→</span>
//     </button>
//   );

//   return (
//     <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '28px 24px 56px' }}>
//       <style>{`
//         @keyframes spin   { to { transform: rotate(360deg); } }
//         @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
//         .ds { animation: fadeUp 0.3s ease both; }
//       `}</style>

//       {/* Header */}
//       <div className="ds" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
//         <div>
//           <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
//           <p style={{ color: '#94a3b8', fontSize: 12, margin: '3px 0 0', fontWeight: 500 }}>
//             {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
//           </p>
//         </div>
//         <button onClick={() => window.location.reload()} style={{
//           padding: '7px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9,
//           fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer',
//           display: 'flex', alignItems: 'center', gap: 5,
//         }}>↺ Refresh</button>
//       </div>

//       {/* Stat Cards */}
//       <div className="ds" style={{ animationDelay: '0.05s', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 20 }}>
//         <Card
//           icon="✍️" iconBg="#eef2ff" title="Blogs"
//           rows={[
//             { label: 'Total',     value: stats.blogs.total },
//             { label: 'Published', value: stats.blogs.published, color: '#16a34a' },
//             { label: 'Drafts',    value: stats.blogs.draft,     color: '#d97706' },
//           ]}
//           btnLabel="Manage Blogs →" btnColor="#6366f1" btnBg="#eef2ff"
//           onBtn={() => navigate('/blog')}
//         />
//         <Card
//           icon="💳" iconBg="#e0f2fe" title="Credit Cards"
//           rows={[
//             { label: 'Total',     value: stats.creditCards.total },
//             { label: 'Active',    value: stats.creditCards.active,   color: '#16a34a' },
//             { label: 'Top Picks', value: stats.creditCards.topPicks, color: '#0ea5e9' },
//           ]}
//           btnLabel="Manage Cards →" btnColor="#0ea5e9" btnBg="#e0f2fe"
//           onBtn={() => navigate('/product/credit-cards')}
//         />
//         <Card
//           icon="🛡️" iconBg="#dcfce7" title="Insurance"
//           rows={[
//             { label: 'Total',     value: stats.insurance.total },
//             { label: 'Active',    value: stats.insurance.active,   color: '#16a34a' },
//             { label: 'Top Picks', value: stats.insurance.topPicks, color: '#16a34a' },
//           ]}
//           btnLabel="Manage Insurance →" btnColor="#16a34a" btnBg="#dcfce7"
//           onBtn={() => navigate('/product/insurance')}
//         />
//         <Card
//           icon="📈" iconBg="#fef9c3" title="Investments"
//           rows={[
//             { label: 'Total',     value: stats.investments.total },
//             { label: 'Active',    value: stats.investments.active,   color: '#16a34a' },
//             { label: 'Top Picks', value: stats.investments.topPicks, color: '#ca8a04' },
//           ]}
//           btnLabel="Manage Investments →" btnColor="#ca8a04" btnBg="#fef9c3"
//           onBtn={() => navigate('/product/investments')}
//         />
//       </div>

//       {/* Bottom row */}
//       <div className="ds" style={{ animationDelay: '0.1s', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, alignItems: 'start' }}>

//         {/* Quick Actions */}
//         <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf3', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', padding: 16 }}>
//           <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', margin: '0 0 10px' }}>Quick Actions</p>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
//             <QBtn icon="✍️" label="New Blog"          sub="Write & publish"      color="#6366f1" bg="#eef2ff" onClick={() => navigate('/blog/addblog')} />
//             <QBtn icon="💳" label="Add Credit Card"   sub="New product"          color="#0ea5e9" bg="#e0f2fe" onClick={() => navigate('/product/credit-cards/new')} />
//             <QBtn icon="🛡️" label="Add Insurance"     sub="New product"          color="#16a34a" bg="#dcfce7" onClick={() => navigate('/product/insurance/new')} />
//             <QBtn icon="📈" label="Add Investment"    sub="New product"          color="#ca8a04" bg="#fef9c3" onClick={() => navigate('/product/investments/new')} />
//             <QBtn icon="🏠" label="Home Page"         sub="Hero, sections, SEO"  color="#8b5cf6" bg="#f5f3ff" onClick={() => navigate('/home')} />
//             <QBtn icon="👥" label="About Page"        sub="Story, team, values"  color="#ec4899" bg="#fdf2f8" onClick={() => navigate('/about')} />
//           </div>
//         </div>

//         {/* Recent Blogs */}
//         <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf3', boxShadow: '0 1px 8px rgba(0,0,0,0.05)', padding: 18 }}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
//             <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', margin: 0 }}>Recent Blogs</p>
//             <button onClick={() => navigate('/blog')} style={{
//               fontSize: 12, fontWeight: 600, color: '#6366f1', background: '#eef2ff',
//               border: 'none', borderRadius: 7, padding: '4px 12px', cursor: 'pointer',
//             }}>View All</button>
//           </div>

//           {recentBlogs.length === 0 ? (
//             <div style={{ textAlign: 'center', padding: '32px 0' }}>
//               <div style={{ fontSize: 32, marginBottom: 8 }}>✍️</div>
//               <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>No blogs yet.</p>
//               <button onClick={() => navigate('/blog/addblog')} style={{
//                 padding: '8px 20px', background: '#6366f1', color: '#fff',
//                 border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
//               }}>+ New Blog</button>
//             </div>
//           ) : (
//             recentBlogs.map((blog, i) => (
//               <div key={blog.id || i} style={{
//                 display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//                 padding: '10px 0', gap: 12,
//                 borderBottom: i < recentBlogs.length - 1 ? '1px solid #f1f5f9' : 'none',
//               }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
//                   <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                     {(blog.image?.src || blog.image?.url)
//                       ? <img src={blog.image.src || blog.image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
//                       : <span style={{ fontSize: 16 }}>✍️</span>
//                     }
//                   </div>
//                   <div style={{ minWidth: 0 }}>
//                     <p style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
//                       {blog.title}
//                     </p>
//                     <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
//                       <span style={{
//                         fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
//                         background: blog.isPublished ? '#dcfce7' : '#fef9c3',
//                         color:      blog.isPublished ? '#15803d' : '#b45309',
//                         textTransform: 'uppercase', letterSpacing: '0.04em',
//                       }}>
//                         {blog.isPublished ? 'Published' : 'Draft'}
//                       </span>
//                       {blog.category && <span style={{ fontSize: 11, color: '#94a3b8' }}>{blog.category}</span>}
//                     </div>
//                   </div>
//                 </div>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
//                   <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtDate(blog.updatedAt)}</span>
//                   <button
//                     onClick={() => navigate(`/blog/edit/${blog.id}`)}
//                     style={{
//                       fontSize: 11, fontWeight: 600, color: '#6366f1', background: '#eef2ff',
//                       border: 'none', borderRadius: 7, padding: '4px 10px', cursor: 'pointer',
//                     }}
//                     onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.92)'}
//                     onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
//                   >Edit</button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//       </div>
//     </div>
//   );
// };

// export default DashboardView;
import React from 'react'

const DashboardView = () => {
  return (
    <div>
      
    </div>
  )
}

export default DashboardView