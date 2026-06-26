'use client';
// admin/src/pages/AuthorsPage.jsx
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiSearch,
  FiTwitter, FiLinkedin, FiInstagram, FiFacebook, FiGlobe, FiX,FiMail, FiBriefcase, FiCalendar,   
} from "react-icons/fi";
import { deleteAuthor, updateAuthor } from "@/client-api/api";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const BASE_URL = (VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const getImageSrc = (image) => {
  if (!image?.src) return null;
  if (image.src.startsWith("http")) return image.src;
  return `${BASE_URL}/${image.src.replace(/^\//, "")}`;
};

/* ── Author Detail Modal ── */
function AuthorModal({ author, onClose, onEdit }) {
  if (!author) return null;

  const src      = getImageSrc(author.image);
  const initials = author.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "A";
  const socials  = author.socialLinks || {};

  const socialLinks = [
    { key: "twitter",   label: "Twitter",   icon: "ti-brand-twitter",  color: "#1da1f2", href: socials.twitter   },
    { key: "linkedin",  label: "LinkedIn",  icon: "ti-brand-linkedin", color: "#0077b5", href: socials.linkedin  },
    { key: "instagram", label: "Instagram", icon: "ti-brand-instagram",color: "#e1306c", href: socials.instagram },
    { key: "facebook",  label: "Facebook",  icon: "ti-brand-facebook", color: "#1877f2", href: socials.facebook  },
    { key: "website",   label: "Website",   icon: "ti-world",          color: "",        href: socials.website   },
  ].filter(s => s.href);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[420px] shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
          {src ? (
            <img src={src} alt={author.name}
              className="w-14 h-14 rounded-full object-cover border border-gray-200 flex-shrink-0"
              onError={e => { e.target.style.display = "none"; }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg font-semibold flex-shrink-0 border border-indigo-100">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-gray-900 leading-snug truncate">{author.name}</p>
            {author.designation && (
              <p className="text-[13px] text-gray-500 mt-0.5 truncate">{author.designation}</p>
            )}
            <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
              author.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}>
              {author.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="self-start w-[30px] h-[30px] flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <FiX size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">

          {/* Details */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Details</p>
            <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
              {author.email && (
                <div className="flex items-center gap-3 px-3.5 py-2.5">
                  <FiMail size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[14px] text-gray-800 truncate">{author.email}</span>
                </div>
              )}
              {author.designation && (
                <div className="flex items-center gap-3 px-3.5 py-2.5">
                  <FiBriefcase size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[14px] text-gray-800">{author.designation}</span>
                </div>
              )}
              {author.createdAt && (
                <div className="flex items-center gap-3 px-3.5 py-2.5">
                  <FiCalendar size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-[14px] text-gray-500">
                    Joined {new Date(author.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {author.bio && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Bio</p>
              <p className="text-[14px] text-gray-600 leading-relaxed">{author.bio}</p>
            </div>
          )}

          {/* Socials */}
          {socialLinks.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Socials</p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(s => (
                  <a key={s.key} href={s.href} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-[13px] text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {s.key === "twitter"   && <FiTwitter  size={13} style={{ color: s.color }} />}
                    {s.key === "linkedin"  && <FiLinkedin size={13} style={{ color: s.color }} />}
                    {s.key === "instagram" && <FiInstagram size={13} style={{ color: s.color }} />}
                    {s.key === "facebook"  && <FiFacebook size={13} style={{ color: s.color }} />}
                    {s.key === "website"   && <FiGlobe    size={13} />}
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose}
            className="px-4 py-[7px] rounded-lg border border-gray-200 text-[14px] text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button onClick={() => onEdit(author.id)}
            className="px-4 py-[7px] rounded-lg bg-indigo-50 border border-indigo-100 text-[14px] text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <FiEdit2 size={13} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}
export default function AuthorsPage({ initialAuthors = [] }) {
  const router = useRouter();

  // Initial list comes from the Server Component (service → Prisma), not axios.
  const [authorList,    setAuthorList]    = useState(initialAuthors);
  const [loading,       setLoading]       = useState(false);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [deletingId,    setDeletingId]    = useState(null);

  /* ── NEW: detail modal state ── */
  const [viewAuthor,    setViewAuthor]    = useState(null);

  /* Filters */
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [sortBy,        setSortBy]        = useState("name");
  const [sortDir,       setSortDir]       = useState("asc");
  const [page,          setPage]          = useState(1);
  const [perPage,       setPerPage]       = useState(10);

  /* Bulk select */
  const [selected,      setSelected]      = useState(new Set());
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]);

  // Initial author list now arrives via the `initialAuthors` prop
  // (server-fetched). No on-mount axios read. Mutations below still patch
  // local state optimistically, exactly as before.

  /* ── Patch local state ── */
  const patchLocal = (id, changes) =>
    setAuthorList(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a));

  /* ── Toggle active ── */
  const handleToggleActive = async (author, e) => {
    e.stopPropagation();
    patchLocal(author.id, { isActive: !author.isActive });
    try {
      const fd = new FormData();
      fd.append("isActive", String(!author.isActive));
      await updateAuthor(author.id, fd);
      toast.success(!author.isActive ? "Author activated" : "Author deactivated");
    } catch {
      patchLocal(author.id, { isActive: author.isActive });
      toast.error("Update failed");
    }
  };

  /* ── Delete single ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeletingId(deleteTarget.id);
      await deleteAuthor(deleteTarget.id);
      setAuthorList(prev => prev.filter(a => a.id !== deleteTarget.id));
      setSelected(prev => { const s = new Set(prev); s.delete(deleteTarget.id); return s; });
      toast.success("Author deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Bulk delete ── */
  const handleBulkDelete = async () => {
    try {
      await Promise.all(bulkDeleteIds.map(id => deleteAuthor(id)));
      setAuthorList(prev => prev.filter(a => !bulkDeleteIds.includes(a.id)));
      setSelected(new Set());
      toast.success(`${bulkDeleteIds.length} deleted`);
      setBulkDeleteIds([]);
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  /* ── Sort ── */
  const handleSort = (k) => {
    sortBy === k
      ? setSortDir(d => (d === "asc" ? "desc" : "asc"))
      : (setSortBy(k), setSortDir("asc"));
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all");
    setSortBy("name"); setSortDir("asc"); setPage(1);
  };

  /* ── Filtered + sorted list ── */
  const filtered = useMemo(() => {
    let list = authorList.filter(a => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.designation?.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "active"   && a.isActive) ||
        (statusFilter === "inactive" && !a.isActive);
      return matchSearch && matchStatus;
    });
    list.sort((a, b) => {
      const va = (a[sortBy] || "").toLowerCase();
      const vb = (b[sortBy] || "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [authorList, search, statusFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);

  /* ── Select helpers ── */
  const selectAll = (e) =>
    setSelected(e.target.checked ? new Set(paginated.map(a => a.id)) : new Set());
  const selectOne = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const stats = {
    total:    authorList.length,
    active:   authorList.filter(a => a.isActive).length,
    inactive: authorList.filter(a => !a.isActive).length,
    shown:    filtered.length,
  };

  const SortIcon = ({ k }) =>
    sortBy !== k ? null : sortDir === "asc"
      ? <FiArrowUp   className="inline ml-1 w-3 h-3 text-indigo-500" />
      : <FiArrowDown className="inline ml-1 w-3 h-3 text-indigo-500" />;

  const selArr = Array.from(selected);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

          {/* ── Header ── */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Author Management</h1>
            <button
              onClick={() => router.push("/authors/add")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Author
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total",    value: stats.total,    color: "bg-indigo-500" },
              { label: "Active",   value: stats.active,   color: "bg-emerald-500" },
              { label: "Inactive", value: stats.inactive, color: "bg-amber-500" },
              { label: "Filtered", value: stats.shown,    color: "bg-sky-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{value}</span>
                </div>
                <p className="text-sm font-semibold text-gray-600">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14}/>
                <input
                  type="text"
                  placeholder="Search name / email / designation…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 text-xs font-semibold w-fit"
              >
                <FiX size={12}/> Clear Filters
              </button>
            </div>

            {/* Bulk actions */}
            {selArr.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                <span className="text-xs text-gray-500 font-semibold self-center">{selArr.length} selected:</span>
                <button
                  onClick={() => setBulkDeleteIds(selArr)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      onChange={selectAll}
                      checked={selected.size === paginated.length && paginated.length > 0}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                    />
                  </th>
                  <th className="px-4 py-3 w-14 text-left text-xs font-semibold text-gray-400 uppercase">Photo</th>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:bg-gray-100 select-none"
                  >
                    Name <SortIcon k="name"/>
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:bg-gray-100 select-none"
                  >
                    Email <SortIcon k="email"/>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Socials</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <div className="flex justify-center items-center gap-2">
                        <div className="animate-spin h-5 w-5 rounded-full border-b-2 border-indigo-500"/> Loading...
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">No authors found</td>
                  </tr>
                ) : paginated.map(author => {
                  const src      = getImageSrc(author.image);
                  const initials = author.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "A";
                  const hasSocials = author.socialLinks && Object.values(author.socialLinks).some(Boolean);

                  return (
                    <tr
                      key={author.id}
                      onClick={() => setViewAuthor(author)}   /* ── NEW: open modal on row click ── */
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(author.id)}
                          onChange={() => selectOne(author.id)}
                          className="w-4 h-4 rounded border-gray-300 text-indigo-600"
                        />
                      </td>

                      {/* Photo */}
                      <td className="px-4 py-3">
                        {src ? (
                          <img
                            src={src}
                            alt={author.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            onError={e => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            {initials}
                          </div>
                        )}
                      </td>

                      {/* Name + bio */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{author.name}</p>
                        {author.bio && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{author.bio}</p>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {author.email || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {author.designation || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Social links */}
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        {hasSocials ? (
                          <div className="flex items-center gap-1.5">
                            {author.socialLinks?.twitter && (
                              <a href={author.socialLinks.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-sky-500 transition" onClick={e => e.stopPropagation()}>
                                <FiTwitter size={13}/>
                              </a>
                            )}
                            {author.socialLinks?.linkedin && (
                              <a href={author.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-700 transition" onClick={e => e.stopPropagation()}>
                                <FiLinkedin size={13}/>
                              </a>
                            )}
                            {author.socialLinks?.instagram && (
                              <a href={author.socialLinks.instagram} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-pink-500 transition" onClick={e => e.stopPropagation()}>
                                <FiInstagram size={13}/>
                              </a>
                            )}
                            {author.socialLinks?.facebook && (
                              <a href={author.socialLinks.facebook} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-600 transition" onClick={e => e.stopPropagation()}>
                                <FiFacebook size={13}/>
                              </a>
                            )}
                            {author.socialLinks?.website && (
                              <a href={author.socialLinks.website} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-700 transition" onClick={e => e.stopPropagation()}>
                                <FiGlobe size={13}/>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleActive(author, e)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                            author.isActive
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          }`}
                        >
                          {author.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <button
                            onClick={() => router.push(`/authors/edit/${author.id}`)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Edit"
                          >
                            <FiEdit2 size={13}/>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(author)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors" title="Delete"
                          >
                            <FiTrash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
              <div className="flex items-center gap-3">
                <select
                  value={perPage}
                  onChange={e => { setPerPage(+e.target.value); setPage(1); }}
                  className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  {[10, 25, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
                <span className="text-sm text-gray-400">
                  {(page-1)*perPage+1}–{Math.min(page*perPage, filtered.length)} of {filtered.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p-1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i+1 : page <= 3 ? i+1 : page >= totalPages-2 ? totalPages-4+i : page-2+i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${page===p ? "bg-indigo-600 text-white" : "border border-gray-200 hover:bg-gray-50 text-gray-600"}`}>
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p+1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Author Detail Modal (NEW) ── */}
      {viewAuthor && (
        <AuthorModal
          author={viewAuthor}
          onClose={() => setViewAuthor(null)}
          onEdit={(id) => { setViewAuthor(null); router.push(`/authors/edit/${id}`); }}
        />
      )}

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-2">Delete Author</h2>
            <p className="text-sm text-gray-500 mb-5">
              <strong>"{deleteTarget.name}"</strong> ko permanently delete karein? Iske blogs se author reference hata jayega.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deletingId === deleteTarget.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-60"
              >
                {deletingId === deleteTarget.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk delete modal ── */}
      {bulkDeleteIds.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-base font-bold text-gray-900 mb-2">Delete {bulkDeleteIds.length} Authors</h2>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setBulkDeleteIds([])} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}