'use client';



// admin/src/pages/BlogTableView.jsx
import { useNavigate } from '@/lib/nav';
import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { getBlogs, deleteBlog, toggleBlogPublish, toggleBlogFeature, createBlog } from '../../service/api.js';
import Papa from 'papaparse';
import { FiEye, FiEdit2, FiTrash2, FiSearch, FiArrowUp, FiArrowDown, FiDownload, FiUploadCloud, FiX } from 'react-icons/fi';
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

// SeoAdmin jaisa — config se BASE_URL
const BASE_URL = VITE_BACKEND_URL;

const getAuthorName = (a) => {
  if (!a) return '—';
  if (typeof a === 'string') return a || '—';
  return a.name || '—';
};

const getImageSrc = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img.startsWith('http') ? img : `${img}`;
  if (img.src) return img.src.startsWith('http') ? img.src : `${img.src}`;
  return '';
};

const CAT_COLORS = {
  'credit-cards':     { bg: '#3b82f618', text: '#3b82f6' },
  'insurance':        { bg: '#10b98118', text: '#10b981' },
  'investments':      { bg: '#8b5cf618', text: '#8b5cf6' },
  'personal-finance': { bg: '#ec489918', text: '#ec4899' },
  'taxation':         { bg: '#f59e0b18', text: '#f59e0b' },
  'travel':           { bg: '#ef444418', text: '#ef4444' },
};

export default function BlogTableView() {
  const navigate  = useNavigate();
  const importRef = useRef(null);

  const [blogList,    setBlogList]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [deleteTgt,   setDeleteTgt]   = useState(null);

  const [search,      setSearch]      = useState('');
  const [cat,         setCat]         = useState('all');
  const [status,      setStatus]      = useState('all');
  const [dateF,       setDateF]       = useState('all');
  const [dateSingle,  setDateSingle]  = useState('');
  const [dateStart,   setDateStart]   = useState('');
  const [dateEnd,     setDateEnd]     = useState('');
  const [sortBy,      setSortBy]      = useState('updatedAt');
  const [sortDir,     setSortDir]     = useState('desc');
  const [page,        setPage]        = useState(1);
  const [perPage,     setPerPage]     = useState(10);
  const [selected,    setSelected]    = useState(new Set());

  const fetchBlogs = async (signal) => {
    try {
      setLoading(true);
      const r = await getBlogs();
      if (signal?.aborted) return;
      setBlogList(Array.isArray(r?.data?.data) ? r.data.data : []);
    } catch (e) {
      if (e?.name === 'CanceledError' || e?.name === 'AbortError') return;
      toast.error('Failed to load blogs');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchBlogs(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (dateF !== 'custom_single') setDateSingle('');
    if (dateF !== 'custom_range')  { setDateStart(''); setDateEnd(''); }
  }, [dateF]);

  const patchLocal = (id, changes) =>
    setBlogList(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b));

  const doTogglePublish = async (item, e) => {
    e.stopPropagation();
    patchLocal(item.id, { isPublished: !item.isPublished });
    try {
      await toggleBlogPublish(item.id);
      toast.success(!item.isPublished ? 'Published' : 'Draft');
    } catch {
      patchLocal(item.id, { isPublished: item.isPublished });
      toast.error('Update failed');
    }
  };

  const doDelete = async () => {
    if (!deleteTgt) return;
    try {
      await deleteBlog(deleteTgt.id);
      setBlogList(prev => prev.filter(b => b.id !== deleteTgt.id));
      setSelected(prev => { const s = new Set(prev); s.delete(deleteTgt.id); return s; });
      toast.success('Deleted');
      setDeleteTgt(null);
    } catch { toast.error('Delete failed'); }
  };

  const doBulkDelete = async (ids) => {
    try {
      await Promise.all(ids.map(id => deleteBlog(id)));
      setBlogList(prev => prev.filter(b => !ids.includes(b.id)));
      setSelected(new Set());
      toast.success(`${ids.length} deleted`);
    } catch { toast.error('Bulk delete failed'); }
  };

  const doBulkStatus = async (ids, pub) => {
    try {
      await Promise.all(ids.map(id => {
        const item = blogList.find(b => b.id === id);
        if (!item || item.isPublished === pub) return;
        return toggleBlogPublish(id);
      }));
      ids.forEach(id => {
        const item = blogList.find(b => b.id === id);
        if (item && item.isPublished !== pub) patchLocal(id, { isPublished: pub });
      });
      setSelected(new Set());
      toast.success('Updated');
    } catch { toast.error('Failed'); }
  };

  const doExport = () => {
    const rows = filtered.map(b => ({
      id:           b.id           || '',
      Title:         b.title         || '',
      Excerpt:       b.excerpt       || '',
      Category:      b.category      || '',
      Status:        b.isPublished   ? 'Published' : 'Draft',
      Featured:      b.isFeatured    ? 'Yes' : 'No',
      ImageSrc:      b.image?.src    || b.image?.url || '',
      ImageAlt:      b.image?.alt    || '',
      ImageMode:     b.image?.mode   || 'url',
      AuthorName:    typeof b.author === 'object' ? (b.author?.name  || '') : (b.author || ''),
      AuthorEmail:   typeof b.author === 'object' ? (b.author?.email || '') : '',
      AuthorBio:     typeof b.author === 'object' ? (b.author?.bio   || '') : '',
      ApplyUrl:      b.applyUrl      || '',
      ApplyText:     b.applyText     || '',
      Slug:          b.slug          || '',
      PublishedDate: b.publishedDate ? new Date(b.publishedDate).toISOString() : '',
      UpdatedAt:     b.updatedAt     ? new Date(b.updatedAt).toISOString()     : '',
    }));
    const blob = new Blob([Papa.unparse(rows)], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `blogs_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const doImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async ({ data: rows }) => {
        const t = toast.loading(`Importing ${rows.length} blogs...`);
        let ok = 0, fail = 0;
        for (const row of rows) {
          try {
            const payload = {
              title:       row.Title       || 'Untitled',
              excerpt:     row.Excerpt     || '',
              category:    row.Category    || '',
              isPublished: row.Status      === 'Published',
              isFeatured:  row.Featured    === 'Yes',
              applyUrl:    row.ApplyUrl    || '',
              applyText:   row.ApplyText   || '',
              image: row.ImageSrc ? {
                mode: row.ImageMode || 'url',
                src:  row.ImageSrc  || '',
                alt:  row.ImageAlt  || row.Title || '',
                title: '',
              } : { mode: 'url', src: '', alt: '', title: '' },
              bannerImage: row.ImageSrc ? {
                mode: row.ImageMode || 'url',
                src:  row.ImageSrc  || '',
                alt:  '',
                title: '',
              } : { mode: 'url', src: '', alt: '', title: '' },
              author: {
                name:  row.AuthorName  || '',
                email: row.AuthorEmail || '',
                bio:   row.AuthorBio   || '',
                image: { mode: 'url', src: '', alt: '', title: '' },
              },
            };
            const fd = new FormData();
            fd.append('data', JSON.stringify(payload));
            await createBlog(fd);
            ok++;
          } catch (err) {
            console.error('Import row failed:', err);
            fail++;
          }
        }
        toast.update(t, {
          render: `${ok} imported${fail ? `, ${fail} failed` : ''}`,
          type: fail && !ok ? 'error' : fail ? 'warning' : 'success',
          isLoading: false, autoClose: 4000,
        });
        if (ok) fetchBlogs();
        if (importRef.current) importRef.current.value = '';
      },
    });
  };

  const handleSort = (k) => {
    sortBy === k ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortBy(k), setSortDir('desc'));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(''); setCat('all'); setStatus('all');
    setDateF('all'); setDateSingle(''); setDateStart(''); setDateEnd('');
    setSortBy('updatedAt'); setSortDir('desc'); setPage(1);
  };

  const allCats = ['all', ...Array.from(new Set(blogList.map(b => b.category).filter(Boolean)))];

  const filtered = useMemo(() => {
    let f = blogList.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || item.title?.toLowerCase().includes(q)
        || item.excerpt?.toLowerCase().includes(q)
        || getAuthorName(item.author).toLowerCase().includes(q);
      const matchCat    = cat === 'all' || item.category === cat;
      const matchStatus = status === 'all' || (status === 'published' ? item.isPublished : !item.isPublished);
      let matchDate = true;
      if (dateF !== 'all') {
        const upd = new Date(item.updatedAt), now = new Date();
        if      (dateF === 'today')         matchDate = upd.toDateString() === now.toDateString();
        else if (dateF === 'week')          { const d = new Date(now); d.setDate(now.getDate() - 7); matchDate = upd >= d; }
        else if (dateF === 'month')         { const d = new Date(now); d.setMonth(now.getMonth() - 1); matchDate = upd >= d; }
        else if (dateF === 'custom_single') matchDate = dateSingle ? upd.toDateString() === new Date(dateSingle).toDateString() : false;
        else if (dateF === 'custom_range')  matchDate = (dateStart && dateEnd) ? (upd >= new Date(dateStart) && upd <= new Date(dateEnd)) : false;
      }
      return matchSearch && matchCat && matchStatus && matchDate;
    });
    f.sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (['updatedAt', 'publishedDate', 'createdAt'].includes(sortBy)) {
        va = new Date(a[sortBy] || 0); vb = new Date(b[sortBy] || 0);
      }
      return sortDir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
    });
    return f;
  }, [blogList, search, cat, status, dateF, dateSingle, dateStart, dateEnd, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);
  const selectAll  = (e) => setSelected(e.target.checked ? new Set(paginated.map(b => b.id)) : new Set());
  const selectOne  = (id) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };

  const stats = {
    total:     blogList.length,
    published: blogList.filter(b => b.isPublished).length,
    draft:     blogList.filter(b => !b.isPublished).length,
    cats:      new Set(blogList.map(b => b.category).filter(Boolean)).size,
  };

  const SortIcon = ({ k }) => sortBy !== k ? null
    : sortDir === 'asc'
      ? <FiArrowUp   className="inline ml-1 w-3 h-3 text-indigo-500" />
      : <FiArrowDown className="inline ml-1 w-3 h-3 text-indigo-500" />;

  const Modal = ({ title, body, onCancel, onConfirm, confirmLabel = 'Confirm', confirmCls = 'bg-indigo-600 hover:bg-indigo-700' }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
        {body && <p className="text-sm text-gray-500 mb-5">{body}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-lg text-sm ${confirmCls}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );

  const selArr = Array.from(selected);

  return (
    <>
      <input type="file" accept=".csv" ref={importRef} className="hidden" onChange={doImport} />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
            <button
              onClick={() => navigate('/blog/addblog')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Blog
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total',      value: stats.total,     color: 'bg-indigo-500' },
              { label: 'Published',  value: stats.published, color: 'bg-emerald-500' },
              { label: 'Drafts',     value: stats.draft,     color: 'bg-amber-500' },
              { label: 'Categories', value: stats.cats,      color: 'bg-sky-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{value}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text" placeholder="Search..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <select value={cat} onChange={e => { setCat(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                {allCats.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
              </select>
              <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select value={dateF} onChange={e => setDateF(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="custom_single">Specific Date</option>
                <option value="custom_range">Date Range</option>
              </select>
            </div>

            {dateF === 'custom_single' && (
              <input type="date" value={dateSingle} onChange={e => setDateSingle(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48" />
            )}
            {dateF === 'custom_range' && (
              <div className="flex gap-3">
                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={() => importRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-xs font-semibold">
                <FiUploadCloud size={12} /> Import CSV
              </button>
              <button onClick={doExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-xs font-semibold">
                <FiDownload size={12} /> Export CSV
              </button>
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 text-xs font-semibold">
                <FiX size={12} /> Clear
              </button>
            </div>

            {selArr.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold self-center">{selArr.length} selected:</span>
                <button onClick={() => doBulkStatus(selArr, true)}  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Publish</button>
                <button onClick={() => doBulkStatus(selArr, false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200">Unpublish</button>
                <button onClick={() => doBulkDelete(selArr)}        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200">Delete</button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox"
                      onChange={selectAll}
                      checked={selected.size === paginated.length && paginated.length > 0}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                  </th>
                  <th className="px-4 py-3 w-14 text-left text-xs font-semibold text-gray-400 uppercase">Image</th>
                  <th onClick={() => handleSort('title')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:bg-gray-100 select-none">
                    Title <SortIcon k="title" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Author</th>
                  <th onClick={() => handleSort('updatedAt')}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:bg-gray-100 select-none">
                    Updated <SortIcon k="updatedAt" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin h-5 w-5 rounded-full border-b-2 border-indigo-500" /> Loading...
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">No blogs found</td></tr>
                ) : paginated.map(item => {
                  const cc  = CAT_COLORS[item.category] || { bg: '#6b728018', text: '#6b7280' };
                  const src = getImageSrc(item.image);
                  return (
                    <tr key={item.id}
                      onClick={() => navigate(`/blog/view/${item.id}`)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => selectOne(item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                      </td>
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
                        {item.excerpt && <p className="text-xs text-gray-400 truncate mt-0.5">{item.excerpt}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {item.category
                          ? <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: cc.bg, color: cc.text }}>{item.category}</span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{getAuthorName(item.author)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={(e) => doTogglePublish(item, e)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            item.isPublished
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}>
                          {item.isPublished ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button onClick={() => navigate(`/blog/edit/${item.id}`)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Edit">
                            <FiEdit2 size={13} />
                          </button>
                          <button onClick={() => navigate(`/blog/view/${item.id}`)}
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

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
              <div className="flex items-center gap-3">
                <select value={perPage} onChange={e => { setPerPage(+e.target.value); setPage(1); }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm">
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
                <span className="text-sm text-gray-400">
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = totalPages <= 5 ? i + 1
                    : page <= 3 ? i + 1
                    : page >= totalPages - 2 ? totalPages - 4 + i
                    : page - 2 + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        page === p ? 'bg-indigo-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}>{p}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {deleteTgt && (
        <Modal
          title="Delete Blog"
          body={`"${deleteTgt.title}" delete hoga permanently.`}
          onCancel={() => setDeleteTgt(null)}
          onConfirm={doDelete}
          confirmLabel="Delete"
          confirmCls="bg-red-600 hover:bg-red-700"
        />
      )}
    </>
  );
}