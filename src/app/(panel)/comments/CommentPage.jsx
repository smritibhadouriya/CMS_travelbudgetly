'use client';
// admin/src/pages/CommentsPage.jsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "react-toastify";
import {
  FiCheck, FiX, FiTrash2, FiRefreshCw, FiSearch,
  FiChevronDown, FiChevronRight, FiFilter, FiCheckSquare,
  FiSquare, FiClock, FiAlertCircle, FiExternalLink,
  FiMessageSquare, FiZap, FiTrendingUp, FiMinus,
} from "react-icons/fi";
import {
  getAllComments,
  getGroupedComments,
  getCommentStats,
  updateCommentStatus,
  deleteComment,
  bulkUpdateComments,
  bulkDeleteComments,
} from "@/client-api/api";

/* ─── Constants ─────────────────────────── */
const TABS = [
  { value: "pending",  label: "Inbox",    icon: FiAlertCircle,   color: "text-amber-500" },
  { value: "approved", label: "Approved", icon: FiCheck,         color: "text-emerald-500" },
  { value: "rejected", label: "Rejected", icon: FiX,             color: "text-red-500" },
  { value: "",         label: "All",      icon: FiMessageSquare, color: "text-blue-500" },
];

const STATUS_STYLES = {
  pending:  { badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",       dot: "bg-amber-400" },
  approved: { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-400" },
  rejected: { badge: "bg-red-50 text-red-600 ring-1 ring-red-200",             dot: "bg-red-400" },
};

const SORT_OPTIONS = [
  { value: "latest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const DATE_OPTIONS = [
  { value: "",      label: "All time"    },
  { value: "today", label: "Today"       },
  { value: "week",  label: "Last 7 days" },
];

function isNew(date) {
  return Date.now() - new Date(date).getTime() < 2 * 60 * 60 * 1000;
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Skeleton ───────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

/* ─── Top Blogs Widget ───────────────────── */
function TopBlogsWidget({ blogs }) {
  if (!blogs?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <FiTrendingUp size={14} className="text-indigo-500" />
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Most Active Blogs</span>
      </div>
      <div className="space-y-2">
        {blogs.map((b, i) => (
          <div key={b.blogId} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-gray-700 flex-1 truncate">{b.title}</span>
            <div className="flex items-center gap-1.5">
              {b.pending > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-medium">
                  {b.pending} pending
                </span>
              )}
              <span className="text-xs text-gray-400 font-medium">{b.total} total</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Comment Card ───────────────────────── */
function CommentCard({ comment, selected, onToggle, onStatus, onDelete, updating }) {
  const [hovered, setHovered] = useState(false);
  const isPending  = comment.status === "pending";
  const newComment = isNew(comment.createdAt);
  const avatarColors = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-rose-500","bg-orange-500"];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative flex items-start gap-3 px-4 py-3.5 transition-all duration-150
        ${selected   ? "bg-blue-50" : isPending ? "bg-amber-50/40 hover:bg-amber-50/70" : "hover:bg-gray-50"}
        ${isPending  ? "border-l-2 border-l-amber-400" : "border-l-2 border-l-transparent"}
      `}
    >
      {/* Checkbox */}
      <button onClick={() => onToggle(comment.id)} className="mt-0.5 shrink-0 text-gray-300 hover:text-blue-500 transition-colors">
        {selected
          ? <FiCheckSquare size={16} className="text-blue-600"/>
          : <FiSquare size={16}/>
        }
      </button>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColors[comment.name.charCodeAt(0) % 5]}`}>
        {comment.name.charAt(0).toUpperCase()}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className="font-semibold text-sm text-gray-900">{comment.name}</span>
          <span className="text-xs text-gray-400">{comment.email}</span>
          <span className={`ml-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[comment.status]?.badge || ""}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[comment.status]?.dot || ""}`} />
            {comment.status}
          </span>
          {newComment && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full">
              <FiZap size={9}/> NEW
            </span>
          )}
        </div>

        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2 mb-1.5">{comment.message}</p>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FiClock size={11}/>
          <span>{timeAgo(comment.createdAt)}</span>
          <span className="text-gray-200">·</span>
          <span>{new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-0.5 shrink-0 transition-all duration-150 ${hovered || selected ? "opacity-100" : "opacity-0"}`}>
        {comment.status !== "approved" && (
          <button onClick={() => onStatus(comment.id, "approved")} disabled={updating} title="Approve"
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-100 transition disabled:opacity-40">
            <FiCheck size={15}/>
          </button>
        )}
        {comment.status !== "rejected" && (
          <button onClick={() => onStatus(comment.id, "rejected")} disabled={updating} title="Reject"
            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 transition disabled:opacity-40">
            <FiX size={15}/>
          </button>
        )}
        {comment.status !== "pending" && (
          <button onClick={() => onStatus(comment.id, "pending")} disabled={updating} title="Move to Pending"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition disabled:opacity-40">
            <FiMinus size={15}/>
          </button>
        )}
        <button onClick={() => onDelete(comment.id)} title="Delete"
          className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 transition">
          <FiTrash2 size={14}/>
        </button>
      </div>
    </div>
  );
}

/* ─── Blog Group ─────────────────────────── */
function BlogGroup({ group, selectedIds, onToggle, onToggleGroup, onStatus, onDelete, updatingId, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const groupSelected = group.comments.filter(c => selectedIds.includes(c.id)).length;
  const allSelected   = groupSelected === group.comments.length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3 bg-white shadow-sm">
      {/* Group Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition select-none"
        onClick={() => setOpen(o => !o)}
      >
        <button
          onClick={e => { e.stopPropagation(); onToggleGroup(group.comments.map(c => c.id), !allSelected); }}
          className="shrink-0 text-gray-400 hover:text-blue-500 transition"
        >
          {allSelected
            ? <FiCheckSquare size={15} className="text-blue-600"/>
            : groupSelected > 0
              ? <FiCheckSquare size={15} className="text-blue-400"/>
              : <FiSquare size={15}/>
          }
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          {open
            ? <FiChevronDown  size={14} className="text-gray-400 shrink-0"/>
            : <FiChevronRight size={14} className="text-gray-400 shrink-0"/>
          }
          <span className="font-semibold text-sm text-gray-800 truncate">
            {group.blog?.title ?? "Unknown Blog"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {group.pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
              {group.pendingCount} pending
            </span>
          )}
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
            {group.total} total
          </span>
          {group.blog?.slug && (
            <a
              href={`/blog/${group.blog.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1 text-gray-400 hover:text-blue-500 transition"
              title="View blog"
            >
              <FiExternalLink size={13}/>
            </a>
          )}
        </div>
      </div>

      {/* Comments */}
      {open && (
        <div className="divide-y divide-gray-100">
          {group.comments.map(comment => (
            <CommentCard
              key={comment.id}
              comment={comment}
              selected={selectedIds.includes(comment.id)}
              onToggle={onToggle}
              onStatus={onStatus}
              onDelete={onDelete}
              updating={updatingId === comment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function CommentsPage({ initialComments = [] }) {
  // Initial grouped comments come from the Server Component (service → Prisma),
  // not axios. Filters/search/sort/date + the 45s poll still refetch client-side.
  const [groups,       setGroups]       = useState(initialComments);
  const [stats,        setStats]        = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab,    setActiveTab]    = useState("pending");
  const [selected,     setSelected]     = useState([]);
  const [updatingId,   setUpdatingId]   = useState(null);
  const [bulkLoading,  setBulkLoading]  = useState(false);
  const [search,       setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort,         setSort]         = useState("latest");
  const [dateFilter,   setDateFilter]   = useState("");
  const [showFilters,  setShowFilters]  = useState(false);
  const autoRefreshRef = useRef(null);
  const prevTotalRef   = useRef(null);
  const didMountRef     = useRef(false);   // skip the initial fetch (seeded data)

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  /* Load stats */
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await getCommentStats();
      setStats(res.data?.stats);
    } catch { /* silent */ }
    finally { setStatsLoading(false); }
  }, []);

  /* Load grouped comments */
  const loadComments = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const params = { sort };
      if (activeTab)       params.status = activeTab;
      if (debouncedSearch) params.q      = debouncedSearch;
      if (dateFilter)      params.date   = dateFilter;

      const res       = await getGroupedComments(params);
      const newGroups = res.data?.groups || [];

      /* Auto-refresh toast */
      const newTotal = newGroups.reduce((s, g) => s + g.total, 0);
      if (prevTotalRef.current !== null && newTotal > prevTotalRef.current) {
        toast.info(`🔔 ${newTotal - prevTotalRef.current} new comment(s) arrived!`);
      }
      prevTotalRef.current = newTotal;

      setGroups(newGroups);
      setSelected([]);
    } catch {
      if (showLoader) toast.error("Failed to load comments");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [activeTab, debouncedSearch, sort, dateFilter]);

  // Initial grouped comments arrive via the `initialComments` prop (server-fetched);
  // skip the first run so we don't refetch on mount. Subsequent runs (tab/search/
  // sort/date changes) still fetch — filters stay intact.
  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    loadComments(true);
  }, [loadComments]);
  useEffect(() => { loadStats(); },         [loadStats]);

  /* Auto-refresh every 45s */
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => loadComments(false), 45000);
    return () => clearInterval(autoRefreshRef.current);
  }, [loadComments]);

  /* All comment IDs flat */
  const allIds = useMemo(() => groups.flatMap(g => g.comments.map(c => c.id)), [groups]);

  /* ── Status update ── */
  const handleStatus = useCallback(async (id, status) => {
    try {
      setUpdatingId(id);
      await updateCommentStatus(id, status);
      toast.success(`Comment ${status}`);
      setGroups(prev =>
        prev.map(g => ({
          ...g,
          comments:     g.comments.map(c => c.id === id ? { ...c, status } : c),
          pendingCount: g.comments.filter(c => (c.id === id ? status : c.status) === "pending").length,
        }))
      );
      loadStats();
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdatingId(null);
    }
  }, [loadStats]);

  /* ── Delete ── */
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this comment permanently?")) return;
    try {
      await deleteComment(id);
      toast.success("Comment deleted");
      setGroups(prev =>
        prev
          .map(g => ({
            ...g,
            comments: g.comments.filter(c => c.id !== id),
            total:    g.total - (g.comments.some(c => c.id === id) ? 1 : 0),
          }))
          .filter(g => g.comments.length > 0)
      );
      loadStats();
    } catch {
      toast.error("Failed to delete");
    }
  }, [loadStats]);

  /* ── Bulk approve/reject ── */
  const handleBulk = useCallback(async (status) => {
    if (!selected.length) return toast.info("No comments selected");
    try {
      setBulkLoading(true);
      await bulkUpdateComments(selected, status);
      toast.success(`${selected.length} comments ${status}`);
      await Promise.all([loadComments(true), loadStats()]);
    } catch {
      toast.error("Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  }, [selected, loadComments, loadStats]);

  /* ── Bulk delete ── */
  const handleBulkDelete = useCallback(async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} comments permanently?`)) return;
    try {
      setBulkLoading(true);
      await bulkDeleteComments(selected);
      toast.success(`${selected.length} comments deleted`);
      await Promise.all([loadComments(true), loadStats()]);
    } catch {
      toast.error("Bulk delete failed");
    } finally {
      setBulkLoading(false);
    }
  }, [selected, loadComments, loadStats]);

  /* ── Select helpers ── */
  const toggleSelect    = useCallback((id) => setSelected(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]), []);
  const toggleGroup     = useCallback((ids, add) => setSelected(p => add ? [...new Set([...p, ...ids])] : p.filter(id => !ids.includes(id))), []);
  const toggleSelectAll = () => setSelected(p => p.length === allIds.length ? [] : allIds);

  const hasFilters = debouncedSearch || dateFilter || sort !== "latest";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Comment Moderation</h1>
            <p className="text-sm text-gray-500 mt-0.5">Review, approve, and manage all blog comments</p>
          </div>
          <button
            onClick={() => { loadComments(true); loadStats(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition shadow-sm"
          >
            <FiRefreshCw size={13}/> Refresh
          </button>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { key: "pending",  label: "Needs Review", color: "bg-amber-50 border-amber-200",   text: "text-amber-600",   icon: FiAlertCircle },
            { key: "approved", label: "Approved",      color: "bg-emerald-50 border-emerald-200", text: "text-emerald-600", icon: FiCheck },
            { key: "rejected", label: "Rejected",      color: "bg-red-50 border-red-200",       text: "text-red-500",     icon: FiX },
            { key: "total",    label: "Total",          color: "bg-blue-50 border-blue-200",     text: "text-blue-600",    icon: FiMessageSquare },
          ].map(({ key, label, color, text, icon: Icon }) => (
            <div
              key={key}
              onClick={() => key !== "total" && setActiveTab(key === activeTab ? "" : key)}
              className={`p-4 rounded-xl border ${color} ${key !== "total" ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${activeTab === key ? "ring-2 ring-current ring-offset-1 shadow-md" : ""}`}
            >
              <div className={`flex items-center gap-2 mb-2 ${text}`}>
                <Icon size={15}/>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
              </div>
              {statsLoading
                ? <div className="animate-pulse h-8 w-16 bg-gray-200 rounded-lg"/>
                : <span className={`text-3xl font-black ${text}`}>{stats?.[key] ?? 0}</span>
              }
            </div>
          ))}
        </div>

        {/* ── Top Blogs ── */}
        {stats?.topBlogs?.length > 0 && <TopBlogsWidget blogs={stats.topBlogs}/>}

        {/* ── Tab Nav ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            {TABS.map(({ value, label, icon: Icon, color }) => {
              const count = value === "" ? stats?.total : stats?.[value];
              return (
                <button
                  key={value}
                  onClick={() => setActiveTab(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    activeTab === value
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={13} className={activeTab === value ? "text-white" : color}/>
                  {label}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${activeTab === value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition ${
              hasFilters || showFilters
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <FiFilter size={13}/>
            Filters
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"/>}
          </button>
        </div>

        {/* ── Filters Bar ── */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input
                  type="text"
                  placeholder="Search name, email, message…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
              >
                {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {hasFilters && (
                <button
                  onClick={() => { setSearch(""); setSort("latest"); setDateFilter(""); }}
                  className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Bulk Action Bar ── */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 mb-4 px-4 py-2.5 bg-indigo-900 text-white rounded-xl shadow-lg">
            <button onClick={toggleSelectAll} className="text-indigo-300 hover:text-white transition">
              <FiCheckSquare size={15}/>
            </button>
            <span className="text-sm font-semibold">{selected.length} selected</span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => handleBulk("approved")}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 rounded-lg transition disabled:opacity-50"
              >
                <FiCheck size={12}/> Approve
              </button>
              <button
                onClick={() => handleBulk("rejected")}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 rounded-lg transition disabled:opacity-50"
              >
                <FiX size={12}/> Reject
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 rounded-lg transition disabled:opacity-50"
              >
                <FiTrash2 size={12}/> Delete
              </button>
              <button
                onClick={() => setSelected([])}
                className="px-3 py-1.5 text-xs text-indigo-300 hover:text-white border border-indigo-600 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Select All row ── */}
        {groups.length > 0 && !loading && (
          <div className="flex items-center gap-2 px-2 mb-3">
            <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition">
              {selected.length === allIds.length && allIds.length > 0
                ? <FiCheckSquare size={13} className="text-blue-600"/>
                : <FiSquare size={13}/>
              }
              Select all {allIds.length}
            </button>
            <span className="text-gray-200">·</span>
            <span className="text-xs text-gray-400">{groups.length} blog(s)</span>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div className="px-4 py-3 bg-gray-50 flex items-center gap-3">
                  <Skeleton className="w-24 h-4"/>
                  <Skeleton className="w-16 h-5 ml-auto"/>
                </div>
                {[1, 2].map(j => (
                  <div key={j} className="flex items-start gap-3 px-4 py-4 border-t border-gray-100">
                    <Skeleton className="w-8 h-8 rounded-full"/>
                    <div className="flex-1 space-y-2">
                      <Skeleton className="w-48 h-3"/>
                      <Skeleton className="w-full h-3"/>
                      <Skeleton className="w-32 h-3"/>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-200">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-gray-600 font-semibold text-lg">
              No {activeTab || ""} comments found
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {hasFilters ? "Try clearing your filters" : "Check back later"}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setSort("latest"); setDateFilter(""); }}
                className="mt-4 px-4 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {groups.map(group => (
              <BlogGroup
                key={String(group.id)}
                group={group}
                selectedIds={selected}
                onToggle={toggleSelect}
                onToggleGroup={toggleGroup}
                onStatus={handleStatus}
                onDelete={handleDelete}
                updatingId={updatingId}
                defaultOpen={group.pendingCount > 0}
              />
            ))}
          </div>
        )}

        {/* ── Auto-refresh indicator ── */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
          Auto-refreshes every 45 seconds
        </div>

      </div>
    </div>
  );
}