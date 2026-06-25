'use client';
// src/screens/PagesContent/PackageTableView.jsx
import { useNavigate } from '@/lib/nav';
import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { deletePackage } from '../../service/api';
import { FiEye, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

const getThumb = (p) => {
  const fromImages = Array.isArray(p?.images) ? p.images.find(Boolean) : null;
  const fromUrls   = Array.isArray(p?.imageUrls) ? p.imageUrls.find(Boolean) : null;
  const src = fromImages || fromUrls || "";
  if (!src) return "";
  return typeof src === 'string' ? src : (src.src || src.url || "");
};

export default function PackageTableView({ initialPackages = [] }) {
  const navigate = useNavigate();

  // Initial list comes from the Server Component (service → Prisma), not axios.
  const [list,      setList]      = useState(initialPackages);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [deleteTgt, setDeleteTgt] = useState(null);

  const doDelete = async () => {
    if (!deleteTgt) return;
    try {
      await deletePackage(deleteTgt.id);
      setList(prev => prev.filter(p => p.id !== deleteTgt.id));
      toast.success('Deleted');
      setDeleteTgt(null);
    } catch { toast.error('Delete failed'); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  }, [list, search]);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
            <button
              onClick={() => navigate('/packages/addpackage')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              ➕ Add Package
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="relative max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text" placeholder="Search by title or location..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-14 text-left text-xs font-semibold text-gray-400 uppercase">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin h-5 w-5 rounded-full border-b-2 border-indigo-500" /> Loading...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No packages found</td></tr>
                ) : filtered.map(item => {
                  const src = getThumb(item);
                  return (
                    <tr key={item.id}
                      onClick={() => navigate(`/packages/view/${item.id}`)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
                          {src
                            ? <img src={src} alt={item.title} className="w-full h-full object-cover"
                                onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                            : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{item.title}</p>
                        {item.duration && <p className="text-xs text-gray-400 truncate mt-0.5">{item.duration}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.location || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-semibold">
                        {item.price != null
                          ? `${item.currency || 'INR'} ${item.price}`
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {item.tourCategory
                          ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-700">{item.tourCategory}</span>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            item.isPublished
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.isPublished ? 'Published' : 'Draft'}
                          </span>
                          {item.isFeatured && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">Featured</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => navigate(`/packages/edit/${item.id}`)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Edit">
                            <FiEdit2 size={13} />
                          </button>
                          <button onClick={() => navigate(`/packages/view/${item.id}`)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="View">
                            <FiEye size={13} />
                          </button>
                          <button onClick={() => setDeleteTgt(item)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete">
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && (
            <p className="text-xs text-gray-400">{filtered.length} package{filtered.length !== 1 ? 's' : ''}</p>
          )}

        </div>
      </div>

      {deleteTgt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-2">Delete Package</h2>
            <p className="text-sm text-gray-500 mb-5">{`"${deleteTgt.title}" will be deleted permanently.`}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTgt(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={doDelete} className="px-4 py-2 text-white rounded-lg text-sm bg-red-600 hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}