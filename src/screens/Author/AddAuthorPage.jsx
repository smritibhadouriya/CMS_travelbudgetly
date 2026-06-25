'use client';



// admin/src/pages/AddAuthorPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@/lib/nav";
import { toast } from "react-toastify";
import {
  FiTwitter, FiLinkedin, FiInstagram, FiFacebook, FiGlobe,
} from "react-icons/fi";
import { createAuthor, updateAuthor, getAuthor } from "../../service/api";
import { ImagePicker } from "../../components/CommonUI/FormComponents";

const SOCIAL_FIELDS = [
  { key: "twitter",   label: "Twitter / X",  Icon: FiTwitter,   placeholder: "https://twitter.com/username" },
  { key: "linkedin",  label: "LinkedIn",     Icon: FiLinkedin,  placeholder: "https://linkedin.com/in/username" },
  { key: "instagram", label: "Instagram",    Icon: FiInstagram, placeholder: "https://instagram.com/username" },
  { key: "facebook",  label: "Facebook",     Icon: FiFacebook,  placeholder: "https://facebook.com/username" },
  { key: "website",   label: "Website",      Icon: FiGlobe,     placeholder: "https://yourwebsite.com" },
];

/* ── SectionCard ── */
const SectionCard = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>{title}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
};

const blankImg = () => ({ url: "", file: null, _preview: null, alt: "", title: "" });

const mapImg = (raw) => ({
  url:      raw?.src || raw?.url || "",
  file:     null,
  _preview: null,
  alt:      raw?.alt   || "",
  title:    raw?.title || "",
});

/* ✅ Helper: ImagePicker alag-alag shapes mein file return karta hai
   ye function har possible key check karta hai */
const extractFile = (imgObj) => {
  if (!imgObj) return null;
  // Most common: imgObj.file
  if (imgObj.file instanceof File) return imgObj.file;
  // Some pickers use: imgObj._file
  if (imgObj._file instanceof File) return imgObj._file;
  // Some pickers use: imgObj.raw
  if (imgObj.raw instanceof File) return imgObj.raw;
  // Some pickers use: imgObj.fileObj
  if (imgObj.fileObj instanceof File) return imgObj.fileObj;
  return null;
};

/* ✅ Helper: existing URL nikalna — url ya src dono check karo */
const extractUrl = (imgObj) => {
  if (!imgObj) return "";
  return imgObj.url || imgObj.src || "";
};

export default function AddAuthorPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id) && id !== "new";

  const [pageLoading, setPageLoading] = useState(isEdit);
  const [saving,      setSaving]      = useState(false);

  const [form, setForm] = useState({
    name:        "",
    email:       "",
    designation: "",
    bio:         "",
    isActive:    true,
  });

  const [socialLinks, setSocialLinks] = useState({
    twitter: "", linkedin: "", instagram: "", facebook: "", website: "",
  });

  const [image, setImage] = useState(blankImg());

  /* ── Load author for edit ── */
  useEffect(() => {
    if (!isEdit) return;
    console.log("Author ID:", id);
    let cancelled = false;
    (async () => {
      try {
        setPageLoading(true);
        const res = await getAuthor(id);
        const a   = res.data?.author;
        if (!a || cancelled) return;

        setForm({
          name:        a.name        || "",
          email:       a.email       || "",
          designation: a.designation || "",
          bio:         a.bio         || "",
          isActive:    a.isActive !== undefined ? a.isActive : true,
        });
        setSocialLinks({
          twitter:   a.socialLinks?.twitter   || "",
          linkedin:  a.socialLinks?.linkedin  || "",
          instagram: a.socialLinks?.instagram || "",
          facebook:  a.socialLinks?.facebook  || "",
          website:   a.socialLinks?.website   || "",
        });
        if (a.image) setImage(mapImg(a.image));
      } catch {
        if (!cancelled) toast.error("Failed to load author");
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) { toast.error("Name is required"); return; }

    setSaving(true);
    try {
      const fd = new FormData();

      fd.append("name",     form.name.trim());
      fd.append("isActive", String(form.isActive));

      if (form.email.trim())       fd.append("email",       form.email.trim());
      if (form.designation.trim()) fd.append("designation", form.designation.trim());
      if (form.bio.trim())         fd.append("bio",         form.bio.trim());

      fd.append("socialLinks", JSON.stringify(socialLinks));

      // ✅ FIX: extractFile() — ImagePicker ka exact shape matter nahi karta
      const fileToUpload = extractFile(image);
      const existingUrl  = extractUrl(image);

      // ✅ imageData — JSON metadata (text field)
      fd.append("imageData", JSON.stringify({
        mode:  fileToUpload ? "upload" : "url",
        src:   fileToUpload ? "" : existingUrl,
        alt:   image?.alt   || "",
        title: image?.title || "",
      }));

      // ✅ imageFile — actual File binary (separate key)
      if (fileToUpload) {
        fd.append("imageFile", fileToUpload);
      }

      // DEBUG: console mein dekho kya ja raha hai
      console.log("📤 Image state:", image);
      console.log("📤 fileToUpload:", fileToUpload);
      console.log("📤 existingUrl:", existingUrl);
      console.log("📤 imageData JSON:", {
        mode:  fileToUpload ? "upload" : "url",
        src:   fileToUpload ? "" : existingUrl,
      });

      if (isEdit) await updateAuthor(id, fd);
      else        await createAuthor(fd);

      toast.success(`Author ${isEdit ? "updated" : "created"}!`);
      navigate("/authors");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-600"/>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/authors")} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back
          </button>
          <h1 className="text-base font-bold text-gray-900">
            {isEdit ? "Edit Author" : "New Author"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setF("isActive", !form.isActive)}
          >
            <span className="text-xs text-gray-400">Inactive</span>
            <div className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? "bg-emerald-500" : "bg-gray-300"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`}/>
            </div>
            <span className={`text-xs font-semibold ${form.isActive ? "text-emerald-600" : "text-gray-400"}`}>
              Active
            </span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Update" : "Create Author"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">

        {/* ── Basic Info ── */}
        <SectionCard title="👤 Basic Info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setF("name", e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                Email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setF("email", e.target.value)}
                placeholder="john@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Designation <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.designation}
              onChange={e => setF("designation", e.target.value)}
              placeholder="e.g. Senior Travel Writer"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Bio <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.bio}
              onChange={e => setF("bio", e.target.value)}
              rows={4}
              placeholder="Short author biography..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>
        </SectionCard>

        {/* ── Photo ── */}
        <SectionCard title="📷 Author Photo">
          <ImagePicker
            label="Profile Photo"
            value={image}
            onChange={setImage}
            fieldName="imageFile"
          />
          <p className="text-xs text-gray-400 mt-1">
            Recommended: square image, min 200×200px. Max 5 MB.
          </p>
        </SectionCard>

        {/* ── Social Links ── */}
        <SectionCard title="🔗 Social Links" defaultOpen={false}>
          <p className="text-xs text-gray-400 -mt-1">
            Only filled links will appear on the website.
          </p>
          <div className="space-y-3">
            {SOCIAL_FIELDS.map(({ key, label, Icon, placeholder }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg flex-shrink-0">
                  <Icon size={15} className="text-gray-500"/>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-0.5">{label}</label>
                  <input
                    type="url"
                    value={socialLinks[key]}
                    onChange={e => setSocialLinks(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </form>
  );
}