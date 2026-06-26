'use client';
// admin/src/pages/ViewAuthorPage.jsx
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiEdit2, FiTrash2, FiTwitter, FiLinkedin, FiInstagram, FiFacebook, FiGlobe, FiExternalLink } from "react-icons/fi";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getAuthorProfile, deleteAuthor, updateAuthor } from "@/client-api/api";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const BASE_URL = (VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const imgSrc = (img) => {
  if (!img) return "";
  if (typeof img === "string") return img;
  const src = img.src || img.url || "";
  if (!src) return "";
  return src.startsWith("http") ? src : `${BASE_URL}/${src.replace(/^\//, "")}`;
};

const Row = ({ label, value }) => value ? (
  <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-semibold text-gray-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-gray-700 flex-1 break-words">{value}</span>
  </div>
) : null;

const BLOG_IMG = (img) => imgSrc(img);

export default function ViewAuthorPage() {
  const { id }   = useParams();
  const router = useRouter();

  const [author,  setAuthor]  = useState(null);
  const [blogs,   setBlogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDel, setShowDel] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const r = await getAuthorProfile(id);
        setAuthor(r.data?.author || null);
        setBlogs(r.data?.blogs   || []);
      } catch {
        toast.error("Failed to load author");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteAuthor(id);
      toast.success("Author deleted");
      router.push("/authors");
    } catch {
      toast.error("Delete failed");
    }
  };

  const doToggleActive = async () => {
    const prev = author.isActive;
    setAuthor(a => ({ ...a, isActive: !a.isActive }));
    try {
      const fd = new FormData();
      fd.append("isActive", String(!prev));
      await updateAuthor(id, fd);
      toast.success(!prev ? "Author activated" : "Author deactivated");
    } catch {
      setAuthor(a => ({ ...a, isActive: prev }));
      toast.error("Update failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-500"/>
    </div>
  );

  if (!author) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-400 mb-3">Author not found</p>
        <button onClick={() => router.push("/authors")} className="text-indigo-600 text-sm hover:underline flex items-center gap-1 mx-auto">
          <FiArrowLeft size={13}/> Back
        </button>
      </div>
    </div>
  );

  const aImg     = imgSrc(author.image);
  const initials = author.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "A";
  const hasSocials = author.socialLinks && Object.values(author.socialLinks).some(Boolean);

  const SOCIAL = [
    { key: "twitter",   Icon: FiTwitter,   color: "text-sky-500",  hover: "hover:text-sky-600"   },
    { key: "linkedin",  Icon: FiLinkedin,  color: "text-blue-700", hover: "hover:text-blue-800"  },
    { key: "instagram", Icon: FiInstagram, color: "text-pink-500", hover: "hover:text-pink-600"  },
    { key: "facebook",  Icon: FiFacebook,  color: "text-blue-600", hover: "hover:text-blue-700"  },
    { key: "website",   Icon: FiGlobe,     color: "text-gray-500", hover: "hover:text-gray-700"  },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/authors")}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors"
          >
            <FiArrowLeft size={15}/> Back
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/authors/edit/${id}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-semibold"
            >
              <FiEdit2 size={13}/> Edit
            </button>
            <button
              onClick={() => setShowDel(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm font-semibold"
            >
              <FiTrash2 size={13}/> Delete
            </button>
          </div>
        </div>

        {/* ── Author hero card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {aImg ? (
                <img
                  src={aImg}
                  alt={author.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-100 shadow-sm"
                  onError={e => { e.target.onerror = null; e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-sm">
                  {initials}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{author.name}</h1>
                <button
                  onClick={doToggleActive}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors mt-0.5 ${
                    author.isActive
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  }`}
                >
                  {author.isActive ? "✓ Active" : "⏸ Inactive"}
                </button>
              </div>

              {author.designation && (
                <p className="text-sm text-indigo-600 font-medium mb-1">{author.designation}</p>
              )}
              {author.email && (
                <p className="text-sm text-gray-500 mb-2">{author.email}</p>
              )}
              {author.bio && (
                <p className="text-sm text-gray-600 leading-relaxed">{author.bio}</p>
              )}

              {/* Social links */}
              {hasSocials && (
                <div className="flex items-center gap-3 mt-3">
                  {SOCIAL.map(({ key, Icon, color, hover }) =>
                    author.socialLinks?.[key] ? (
                      <a
                        key={key}
                        href={author.socialLinks[key]}
                        target="_blank"
                        rel="noreferrer"
                        className={`${color} ${hover} transition-colors`}
                        title={key}
                      >
                        <Icon size={18}/>
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </div>

            {/* Stats badge */}
            <div className="flex-shrink-0 text-center bg-indigo-50 rounded-xl px-5 py-4 border border-indigo-100">
              <p className="text-3xl font-black text-indigo-600">{blogs.length}</p>
              <p className="text-xs text-indigo-500 font-semibold mt-0.5">Published Blogs</p>
            </div>
          </div>
        </div>

        {/* ── Details card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Author Details</h2>
          <Row label="Name"        value={author.name}/>
          <Row label="Email"       value={author.email}/>
          <Row label="Designation" value={author.designation}/>
          <Row label="Status"      value={author.isActive ? "Active" : "Inactive"}/>
          <Row label="Created"     value={new Date(author.createdAt).toLocaleString("en-IN")}/>
          <Row label="Updated"     value={new Date(author.updatedAt).toLocaleString("en-IN")}/>

          {hasSocials && (
            <div className="flex gap-3 py-2.5 border-b border-gray-50">
              <span className="text-xs font-semibold text-gray-400 w-28 flex-shrink-0 pt-0.5">Social Links</span>
              <div className="flex flex-wrap gap-2">
                {SOCIAL.map(({ key, Icon, color }) =>
                  author.socialLinks?.[key] ? (
                    <a
                      key={key}
                      href={author.socialLinks[key]}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium ${color} hover:bg-gray-100 transition-colors`}
                    >
                      <Icon size={12}/> {key}
                    </a>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Blogs by this author ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700">
              Published Blogs
              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{blogs.length}</span>
            </h2>
            <button
              onClick={() => router.push("/blog/addblog")}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + New Blog
            </button>
          </div>

          {blogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8 italic">No published blogs yet.</p>
          ) : (
            <div className="space-y-3">
              {blogs.map(blog => {
                const bImg = BLOG_IMG(blog.image || blog.bannerImage);
                return (
                  <div
                    key={blog.id || blog.slug}
                    onClick={() => router.push(`/blog/view/${blog.id}`)}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                      {bImg ? (
                        <img
                          src={bImg}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.onerror = null; e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{blog.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {blog.category && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600">
                            {blog.category}
                          </span>
                        )}
                        {blog.Destination && (
                          <span className="text-xs text-gray-400">📍 {blog.Destination}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      {blog.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{blog.description}</p>
                      )}
                    </div>

                    <FiExternalLink size={13} className="text-gray-300 flex-shrink-0 mt-1"/>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Delete modal ── */}
      {showDel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Author</h3>
            <p className="text-sm text-gray-500 mb-5">
              Delete <strong>"{author.name}"</strong>? Iske saare blogs ka author reference hata jayega. Permanently delete hoga.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDel(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}