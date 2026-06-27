'use client';
import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";
const BACKEND_URL = typeof VITE_BACKEND_URL !== "undefined" ? VITE_BACKEND_URL : "";

/* ── Field wrapper ── */
export const Field = ({ label, children, hint }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>}
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

export const Input = ({ label, hint, ...props }) => (
  <Field label={label} hint={hint}>
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 ${props.className || ""}`}
    />
  </Field>
);

export const Textarea = ({ label, hint, rows = 3, ...props }) => (
  <Field label={label} hint={hint}>
    <textarea
      rows={rows}
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none ${props.className || ""}`}
    />
  </Field>
);

export const Select = ({ label, hint, options = [], ...props }) => (
  <Field label={label} hint={hint}>
    <select
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </Field>
);

export const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <div
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${checked ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-4" : ""}`} />
    </div>
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

/* ══════════════════════════════════════════════════
   IMAGE PICKER — BLOB FIX
   value shape: { url, file, _preview, alt, title }
   url       = saved server URL or typed URL
   file      = new File object → FormData
   _preview  = blob: URL (display only, never sent)

   EDIT FIX: When value.url exists (saved image from server),
   default tab to "url" and always show preview from url or _preview.
══════════════════════════════════════════════════ */

const toAbsolute = (src) => {
  if (!src?.trim()) return "";
  if (src.startsWith("http") || src.startsWith("//") || src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (src.startsWith("/api")) return `${BACKEND_URL.replace("/api", "")}${src}`;
  return `${BACKEND_URL}${src.startsWith("/") ? "" : "/"}${src}`;
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteConfirmModal = ({ onClose, onConfirm, imageName, isBulk = false }) =>
  createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isBulk ? "Delete All Unused Images" : "Delete Image"}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {isBulk
                  ? "Permanently delete all images not used in any post."
                  : `Are you sure you want to delete "${imageName}"?`}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {isBulk
              ? "This action cannot be undone. All unused images will be removed from the server."
              : "This action cannot be undone. The image will be permanently removed."}
          </p>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              Cancel
            </button>
            <button onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition shadow-md">
              {isBulk ? "Delete All" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

// ─── ImagePickerModal ─────────────────────────────────────────────────────────
const ImagePickerModal = ({ onClose, onConfirm, initialUrl = "", uploadEndpoint }) => {
  const [tab, setTab] = useState(initialUrl ? "url" : "upload");
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [file, setFile] = useState(null);
  const [dataUrl, setDataUrl] = useState("");
  const [selectedServerUrl, setSelectedServerUrl] = useState("");
  const [search, setSearch] = useState("");
  const [serverImages, setServerImages] = useState([]);
  const [loadingServer, setLoadingServer] = useState(true);
  const [serverError, setServerError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, url: null, filename: null });
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);

  const getFilename = (url) => url?.split("/").pop() || "";

  const fetchServerImages = async () => {
    setLoadingServer(true);
    setServerError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/images`);
      if (res.ok) {
        const data = await res.json();
        setServerImages(Array.isArray(data) ? data : data.images ?? data.data ?? []);
      } else {
        setServerImages([]);
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoadingServer(false);
    }
  };

  useEffect(() => { fetchServerImages(); }, []);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 10 * 1024 * 1024) { alert("Image must be under 10 MB"); e.target.value = ""; return; }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setDataUrl(ev.target.result);
    reader.readAsDataURL(f);
    setSelectedServerUrl("");
  };

  const handleTabChange = (t) => {
    setTab(t);
    setSelectedServerUrl("");
    if (t === "url") { setFile(null); setDataUrl(""); }
    else { setUrlInput(""); }
  };

  const handleDeleteImage = async () => {
    if (!deleteModal.url) return;
    setDeleting(true);
    try {
      const filename = deleteModal.filename || getFilename(deleteModal.url);
      await fetch(`${BACKEND_URL}/images/${encodeURIComponent(filename)}`, { method: "DELETE" });
      await fetchServerImages();
      if (selectedServerUrl === deleteModal.url) setSelectedServerUrl("");
    } catch (err) {
      alert("Failed to delete image");
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, url: null, filename: null });
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`${BACKEND_URL}/images/admin/cleanup`, { method: "POST" });
      await fetchServerImages();
    } catch {
      alert("Failed to delete unused images");
    } finally {
      setDeleting(false);
      setBulkDeleteModal(false);
    }
  };

  const previewSrc = selectedServerUrl || (tab === "upload" ? dataUrl : toAbsolute(urlInput));
  const canConfirm = !!previewSrc;

  const handleConfirm = async () => {
    if (!canConfirm) return;

    if (selectedServerUrl) { onConfirm({ url: selectedServerUrl }); onClose(); return; }
    if (tab === "url" && urlInput) { onConfirm({ url: toAbsolute(urlInput) }); onClose(); return; }

    if (tab === "upload" && file) {
      const endpoint = uploadEndpoint || `${BACKEND_URL}/upload/image`;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(endpoint, { method: "POST", body: formData });
        const data = await res.json();
        const serverPath = data?.path || data?.url || data?.file?.path || data?.filename;
        if (!serverPath) throw new Error("No path returned from server");
        onConfirm({ url: toAbsolute(serverPath) });
        onClose();
      } catch (err) {
        alert(err.message || "Failed to upload image");
      } finally {
        setUploading(false);
      }
    }
  };

  const filtered = serverImages.filter((img) => {
    const src = typeof img === "string" ? img : img.url ?? img.filename ?? "";
    return src.toLowerCase().includes(search.toLowerCase());
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Media Library</h2>
            <p className="text-sm text-gray-500 mt-0.5">Choose an image for your content</p>
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition rounded-full p-2 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Tabs */}
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-gray-200">
              {[
                { id: "upload", label: "Upload Image", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
                { id: "url", label: "Image URL", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m3.172-3.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102" },
              ].map((t) => (
                <button key={t.id} type="button" onClick={() => handleTabChange(t.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all rounded-t-lg
                    ${tab === t.id && !selectedServerUrl
                      ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={t.icon} />
                  </svg>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "upload" ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl
                                h-40 cursor-pointer transition-all group bg-gradient-to-b from-gray-50 to-white
                                hover:border-indigo-400 hover:bg-indigo-50/30">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  onChange={handleFileChange} className="hidden" />
                <div className="w-14 h-14 rounded-full bg-indigo-100 group-hover:bg-indigo-200 transition flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                {file ? (
                  <span className="text-sm font-medium text-indigo-600">{file.name}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">Click to upload image</span>
                    <span className="text-xs text-gray-400 mt-1">JPG · PNG · WebP · HEIC — max 10 MB</span>
                  </>
                )}
              </label>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102" />
                  </svg>
                </div>
                <input type="url" value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setSelectedServerUrl(""); }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition" />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-sm text-gray-500 font-medium">or choose from library</span>
            </div>
          </div>

          {/* Server gallery */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="relative col-span-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your images..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm
                           focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition" />
              </div>
              <button type="button" onClick={() => setBulkDeleteModal(true)}
                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Unused
              </button>
            </div>

            {loadingServer ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading your images...</span>
              </div>
            ) : serverError ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-red-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Failed to load images</span>
                <button onClick={fetchServerImages} className="text-indigo-600 text-sm">Try again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">{search ? `No results for "${search}"` : "Your library is empty"}</span>
                <span className="text-xs">Upload some images to get started</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filtered.map((img, i) => {
                    const rawSrc = typeof img === "string" ? img : img.url ?? img.path ?? "";
                    const absSrc = toAbsolute(rawSrc);
                    const isSelected = selectedServerUrl === absSrc;
                    return (
                      <div key={i} className="relative group">
                        <button type="button" onClick={() => setSelectedServerUrl((p) => (p === absSrc ? "" : absSrc))}
                          className={`relative w-full aspect-square rounded-xl overflow-hidden transition-all duration-200 transform hover:scale-105
                            ${isSelected ? "ring-2 ring-indigo-500 ring-offset-2 shadow-lg" : "hover:shadow-md"}`}>
                          <img src={absSrc} alt="" className="w-full h-full object-cover" loading="lazy"
                            onError={(e) => { e.target.style.display = "none"; }} />
                          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200
                            ${isSelected ? "bg-indigo-600/30" : "bg-black/0 group-hover:bg-black/20"}`}>
                            {isSelected && (
                              <div className="bg-indigo-600 rounded-full p-1.5 shadow-lg">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, url: absSrc, filename: getFilename(absSrc) }); }}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-md">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 text-right">
                  {filtered.length} image{filtered.length !== 1 ? "s" : ""} available
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center gap-4 bg-gray-50/50">
          <div className="w-14 h-14 rounded-xl border border-gray-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
            {previewSrc ? (
              <img src={previewSrc} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700">
              {uploading ? "Uploading..." : previewSrc ? "Image selected" : "No image selected"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {previewSrc ? previewSrc.substring(0, 50) + (previewSrc.length > 50 ? "..." : "") : "Choose an image from above"}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium">
              Cancel
            </button>
            <button type="button" onClick={handleConfirm} disabled={!canConfirm || uploading}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2
                ${canConfirm && !uploading
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              {uploading && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {uploading ? "Uploading..." : "Insert Image"}
            </button>
          </div>
        </div>
      </div>

      {deleteModal.open && (
        <DeleteConfirmModal
          onClose={() => setDeleteModal({ open: false, url: null, filename: null })}
          onConfirm={handleDeleteImage}
          imageName={deleteModal.filename}
          isBulk={false}
        />
      )}
      {bulkDeleteModal && (
        <DeleteConfirmModal
          onClose={() => setBulkDeleteModal(false)}
          onConfirm={handleBulkDelete}
          isBulk={true}
        />
      )}
      {(deleting || uploading) && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-600">{uploading ? "Uploading image..." : "Deleting..."}</p>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

// ─── Main ImagePicker ─────────────────────────────────────────────────────────
/**
 * Props:
 *   label         – field label (optional)
 *   value         – { url, alt, title }
 *   onChange      – (newValue) => void
 *   fieldName     – native input name attribute (optional)
 *   uploadEndpoint – override upload URL (optional)
 *   showAltTitle  – show alt + title inputs below (default true)
 *   readOnly      – disable editing (default false)
 */
export const ImagePicker = ({
  label,
  value = {},
  onChange,
  fieldName,
  uploadEndpoint,
  showAltTitle = true,
  readOnly = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleConfirm = ({ url }) => {
    onChange({ ...value, url, _preview: null, file: null });
  };

  const handleClear = () => {
    onChange({ url: "", alt: value.alt || "", title: value.title || "", _preview: null, file: null });
  };

  // Resolve displayable preview URL
  const displaySrc = (() => {
    const src = value._preview || value.url || "";
    if (!src) return "";
    if (src.startsWith("http") || src.startsWith("//") || src.startsWith("data:") || src.startsWith("blob:")) return src;
    return toAbsolute(src);
  })();

  return (
    <Field label={label}>
      <div className="space-y-3">
        {/* Image preview or empty state */}
        {displaySrc ? (
          <div className="relative group rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
            onClick={() => !readOnly && setModalOpen(true)}>
            <img
              src={displaySrc}
              alt={value.alt || "Preview"}
              title={value.title || ""}
              className="w-full max-h-64 object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            {!readOnly && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent
                              opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl
                              flex items-end justify-center pb-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
                  <span className="text-sm font-medium text-gray-800">Click to change</span>
                </div>
              </div>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClear(); }}
                className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2.5 py-1.5
                           text-xs font-semibold text-white bg-red-500 hover:bg-red-600
                           rounded-lg shadow-md transition-all">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove
              </button>
            )}
          </div>
        ) : (
          !readOnly && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300
                         rounded-xl h-40 text-gray-400 hover:border-indigo-400 hover:text-indigo-500
                         transition-all bg-gray-50 hover:bg-indigo-50 group">
              <div className="w-14 h-14 rounded-full bg-gray-200 group-hover:bg-indigo-200 transition flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-gray-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Choose an image</span>
              <span className="text-xs mt-1 text-gray-400">Upload, URL, or from library</span>
            </button>
          )
        )}

        {/* Hidden native input for form submission if needed */}
        {fieldName && value.url && (
          <input type="hidden" name={fieldName} value={value.url} />
        )}

        {/* Alt + Title */}
        {showAltTitle && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Alt text</label>
              <input
                type="text"
                placeholder="Alternative text for accessibility"
                value={value.alt || ""}
                onChange={(e) => onChange({ ...value, alt: e.target.value })}
                readOnly={readOnly}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs
                           focus:outline-none focus:border-indigo-400 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Title</label>
              <input
                type="text"
                placeholder="Tooltip text on hover"
                value={value.title || ""}
                onChange={(e) => onChange({ ...value, title: e.target.value })}
                readOnly={readOnly}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs
                           focus:outline-none focus:border-indigo-400 transition"
              />
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <ImagePickerModal
          onClose={() => setModalOpen(false)}
          onConfirm={handleConfirm}
          initialUrl={value.url || ""}
          uploadEndpoint={uploadEndpoint}
        />
      )}
    </Field>
  );
};

/* ── SEO Section ── */
export const SeoSection = ({ data = {}, onChange }) => {
  const set = (key, val) => onChange({ ...data, [key]: val });
  return (
    <div className="space-y-3">
      <Input label="Meta Title" value={data.metaTitle||""} onChange={e=>set("metaTitle",e.target.value)} />
      <Textarea label="Meta Description" rows={2} value={data.metaDescription||""} onChange={e=>set("metaDescription",e.target.value)} />
      <Field label="Keywords (comma separated)">
        <input type="text"
          value={Array.isArray(data.metaKeywords) ? data.metaKeywords.join(", ") : ""}
          onChange={e => set("metaKeywords", e.target.value.split(",").map(k=>k.trim()).filter(Boolean))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
      </Field>
      <Input label="Canonical URL" value={data.canonicalUrl||""} onChange={e=>set("canonicalUrl",e.target.value)} />
      <div className="flex gap-4">
        <Toggle label="Index" checked={data.index !== false} onChange={v=>set("index",v)} />
        <Toggle label="Follow" checked={data.follow !== false} onChange={v=>set("follow",v)} />
      </div>
      <ImagePicker label="OG Image" value={data.image||{}} onChange={v=>set("image",v)} fieldName="seoImage" />
    </div>
  );
};

/* ── Section Card ── */
export const SectionCard = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl  border border-gray-200 overflow-hidden shadow-sm">
      <button type="button" onClick={() => setOpen(o=>!o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="font-bold text-gray-800 text-sm">{title}</span>
        <span className={`text-gray-400 transition-transform duration-200 ${open?"rotate-180":""}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </span>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
};

/* ── Page Header ── */
export const PageHeader = ({ title, onSave, saving }) => (
  <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 sticky top-0 z-10">
    <h1 className="text-lg font-bold text-gray-900">{title}</h1>
    <button type="button" onClick={onSave} disabled={saving}
      className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
      {saving ? "Saving…" : "Save"}
    </button>
  </div>
);

export const ArrayControls = ({ onAdd, addLabel = "+ Add" }) => (
  <button type="button" onClick={onAdd} className="mt-2 text-sm text-blue-600 font-semibold hover:underline">
    {addLabel}
  </button>
);

export const RemoveBtn = ({ onClick }) => (
  <button type="button" onClick={onClick}
    className="text-red-400 hover:text-red-600 text-xs font-bold ml-2 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
    ✕
  </button>
);