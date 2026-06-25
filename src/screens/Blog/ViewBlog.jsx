'use client';

// admin/src/pages/ViewBlog.jsx
import { useParams, useNavigate } from '@/lib/nav';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { getBlog, deleteBlog, toggleBlogPublish, toggleBlogFeature } from '../../service/api.js';
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

// SeoAdmin jaisa — config se BASE_URL
const BASE_URL = VITE_BACKEND_URL.replace(/\/api\/?$/, '');

const imgSrc = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (typeof img === 'object') {
    const src = img.src || img.url || '';
    if (!src) return '';
    if (src.startsWith('http')) return src;
    return src.startsWith('/') ? `${BASE_URL}${src}` : `${BASE_URL}/${src}`;
  }
  return '';
};

const authorName = (a) => (!a ? '—' : typeof a === 'string' ? a : a.name || '—');

const CAT = {
  'credit-cards': { bg: '#3b82f618', color: '#3b82f6' },
  'insurance': { bg: '#10b98118', color: '#10b981' },
  'investments': { bg: '#8b5cf618', color: '#8b5cf6' },
  'personal-finance': { bg: '#ec489918', color: '#ec4899' },
  'taxation': { bg: '#f59e0b18', color: '#f59e0b' },
  'travel': { bg: '#ef444418', color: '#ef4444' },
};

const Badge = ({ label, bg, color }) => (
  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: bg, color }}>
    {label}
  </span>
);

const Row = ({ label, value }) => value ? (
  <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-semibold text-gray-400 w-32 flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-gray-700 flex-1 break-words">{value}</span>
  </div>
) : null;

export default function ViewBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDel, setShowDel] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const r = await getBlog(id);
        const b = r?.data?.data || r?.data;
        if (b) {
          setBlog(b);
        } else {
          toast.error('Blog not found');
        }
      } catch (err) {
        console.error("Error loading blog:", err);
        toast.error('Failed to load blog');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Table wrapper for better table display (same as public blog)
  useEffect(() => {
    if (contentRef.current) {
      const tables = contentRef.current.querySelectorAll('table');
      tables.forEach((table) => {
        if (table.closest('.table-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      });
    }
  }, [blog]);

  const handleDelete = async () => {
    try {
      await deleteBlog(id);
      toast.success('Blog deleted successfully');
      navigate('/blog');
    } catch {
      toast.error('Failed to delete blog');
    }
  };

  const doTogglePublish = async () => {
    const currentStatus = blog.isPublished;
    setBlog(b => ({ ...b, isPublished: !b.isPublished }));
    try {
      await toggleBlogPublish(id);
      toast.success(!currentStatus ? 'Published' : 'Moved to Draft');
    } catch {
      setBlog(b => ({ ...b, isPublished: currentStatus }));
      toast.error('Failed to update status');
    }
  };

  const doToggleFeatured = async () => {
    const currentFeatured = blog.isFeatured;
    setBlog(b => ({ ...b, isFeatured: !b.isFeatured }));
    try {
      await toggleBlogFeature(id);
      toast.success(!currentFeatured ? 'Marked as Featured' : 'Removed from Featured');
    } catch {
      setBlog(b => ({ ...b, isFeatured: currentFeatured }));
      toast.error('Failed to update featured status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-400 mb-3">Blog not found</p>
          <button
            onClick={() => navigate('/blog')}
            className="text-indigo-600 text-sm hover:underline flex items-center gap-1 mx-auto"
          >
            <FiArrowLeft size={13} /> Back
          </button>
        </div>
      </div>
    );
  }

  const cat = CAT[blog.category] || { bg: '#6b728018', color: '#6b7280' };
  const hasImg = imgSrc(blog.image);
  const aName = authorName(blog.author);
  const aImg = blog.author?.image ? imgSrc(blog.author.image) : '';
  const aBio = typeof blog.author === 'object' ? blog.author?.bio : '';
  const aEmail = typeof blog.author === 'object' ? blog.author?.email : '';
  const lc = blog.layoutConfig;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/blog')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors"
          >
            <FiArrowLeft size={15} /> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/blog/edit/${id}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold"
            >
              <FiEdit2 size={13} /> Edit
            </button>
            <button
              onClick={() => setShowDel(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm font-semibold"
            >
              <FiTrash2 size={13} /> Delete
            </button>
          </div>
        </div>

        {/* Hero image */}
        {hasImg && (
          <div className="rounded-2xl overflow-hidden shadow-md h-72 sm:h-96">
            <img
              src={hasImg}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentNode.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Title + meta */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-wrap items-start gap-3 mb-3">
            <h1 className="text-2xl font-bold text-gray-900 flex-1 leading-tight">{blog.title}</h1>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {blog.category && <Badge label={blog.category} bg={cat.bg} color={cat.color} />}
              <button
                onClick={doTogglePublish}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  blog.isPublished
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {blog.isPublished ? '✓ Published' : '⏳ Draft'}
              </button>
              <button
                onClick={doToggleFeatured}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                  blog.isFeatured
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {blog.isFeatured ? '★ Featured' : '☆ Not Featured'}
              </button>
            </div>
          </div>
          {blog.excerpt && <p className="text-gray-500 text-sm leading-relaxed">{blog.excerpt}</p>}
        </div>

        {/* Two-column: Details + Author */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Blog Details</h2>
            <Row label="Category" value={blog.category} />
            <Row label="Status" value={blog.isPublished ? 'Published' : 'Draft'} />
            <Row label="Featured" value={blog.isFeatured ? 'Yes' : 'No'} />
            <Row label="Views" value={String(blog.views || 0)} />
            <Row
              label="Published"
              value={
                blog.publishedDate
                  ? new Date(blog.publishedDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : null
              }
            />
            <Row label="Created" value={new Date(blog.createdAt).toLocaleString('en-IN')} />
            <Row label="Last Updated" value={new Date(blog.updatedAt).toLocaleString('en-IN')} />
            <Row label="Slug" value={blog.slug} />
          </div>

          {/* Author card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Author</h2>
            <div className="flex flex-col items-center text-center gap-3">
              {aImg ? (
                <img
                  src={aImg}
                  alt={aName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML += `<div class="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">${aName?.[0]?.toUpperCase() || '?'}</div>`;
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  {aName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-800">{aName}</p>
                {aEmail && <p className="text-xs text-gray-400 mt-0.5">{aEmail}</p>}
                {aBio && <p className="text-xs text-gray-500 mt-2 leading-relaxed">{aBio}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* SEO & Layout Config (unchanged) */}
        {(blog.seo?.metaTitle || blog.seo?.metaDescription) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">🔍 SEO</h2>
            <Row label="Meta Title" value={blog.seo.metaTitle} />
            <Row label="Meta Description" value={blog.seo.metaDescription} />
            {blog.seo.canonicalUrl && <Row label="Canonical" value={blog.seo.canonicalUrl} />}
          </div>
        )}

        {lc && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">🎨 Layout Config</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(lc).map(([k, v]) => (
                <span key={k} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-mono text-gray-600">
                  <span className="text-gray-400">{k}:</span> {String(v)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Section with Fixed Table Styling */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-bold text-gray-700 mb-4">📝 Content</h2>
          
          <style dangerouslySetInnerHTML={{ __html: `
            .blog-content table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 1.5rem 0 !important;
              font-size: 0.95rem !important;
              background-color: #ffffff !important;
              border: 1px solid #e2e8f0 !important;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
            }
            .blog-content th {
              background-color: #f8fafc !important;
              color: #1e293b !important;
              font-weight: 700 !important;
              text-transform: uppercase !important;
              font-size: 0.75rem !important;
              padding: 12px 15px !important;
              border: 1px solid #e2e8f0 !important;
            }
            .blog-content td {
              padding: 12px 15px !important;
              border: 1px solid #e2e8f0 !important;
              color: #475569 !important;
            }
            .blog-content tr:nth-child(even) {
              background-color: #f1f5f9 !important;
            }
            .blog-content tr:hover {
              background-color: #f8fafc !important;
            }
            .blog-content .table-wrapper {
              width: 100%;
              overflow-x: auto;
              margin-bottom: 1.5rem;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .blog-content {
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
          ` }} />

          <article
            ref={contentRef}
            className="blog-content prose prose-sm sm:prose max-w-none text-gray-800
              prose-headings:font-bold prose-headings:text-gray-900
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-code:bg-gray-100 prose-code:rounded prose-code:text-sm"
          >
            {blog.content ? (
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            ) : (
              <p className="text-gray-400 text-center py-12 italic">No content available</p>
            )}
          </article>
        </div>
      </div>

      {/* Delete modal */}
      {showDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Blog</h3>
            <p className="text-sm text-gray-500 mb-5">
              Delete <strong>"{blog.title}"</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDel(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}