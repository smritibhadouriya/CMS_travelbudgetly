'use client';



// admin/src/pages/AddBlogPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "@/lib/nav";
import { toast } from "react-toastify";
import { getBlog, createBlog, updateBlog, getAuthors } from "../../service/api";
import { SectionCard, ImagePicker } from "../../components/CommonUI/FormComponents";
import { SeoSection } from "../../components/CommonUI/Sections.jsx";

const SNOTE_CSS = `
  @import url('https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-bs4.min.css');
  .note-editor{border-radius:.5rem!important;border:1px solid #e5e7eb!important}
  .note-toolbar{background:#f9fafb!important;border-bottom:1px solid #e5e7eb!important;padding:6px 8px!important}
  .note-btn{background:white!important;border:1px solid #e5e7eb!important;color:#374151!important;padding:3px 9px!important;margin:1px!important;border-radius:4px!important;font-size:12px!important}
  .note-btn:hover{background:#f3f4f6!important}
  .note-editable{padding:16px!important;min-height:460px!important;background:white!important;color:#111827!important;font-size:15px!important;line-height:1.7!important}
`;

const blankImg = () => ({ url: "", file: null, _preview: null, alt: "", title: "" });

const LIMITS = {
  title:       { max: 100 },
  category:    { max: 50  },
  Destination: { max: 100 },
  IMAGE_MB:    10,
};

const countChars = (str = "") => str.replace(/<[^>]+>/g, "").length;

const CC = ({ val = "", max }) => {
  const n   = typeof val === "string" ? countChars(val) : 0;
  const pct = n / max;
  return (
    <span className={`text-xs ml-1 font-mono ${
      pct >= 1 ? "text-red-500 font-bold" : pct >= 0.85 ? "text-amber-500" : "text-gray-400"
    }`}>
      {n}/{max}
    </span>
  );
};

const blank = () => ({
  title:       "",
  category:    "",
  readtime:    5,
  Destination: "",
  isPublished: false,
  isFeatured:  false,
  author:      "",
  tags:        [],
  tagInput:    "",
  content:     "",
  image:       blankImg(),
  seo: {
    metaTitle:       "",
    metaDescription: "",
    metaKeywords:    [],
    canonicalUrl:    "",
    index:           true,
    follow:          true,
    image:           blankImg(),
    h1:              "",
    jsonSchema:      {},
  },
});

const mapImg = (raw) => ({
  url:      raw?.src  || raw?.url  || "",
  file:     null,
  _preview: null,
  alt:      raw?.alt   || "",
  title:    raw?.title || "",
});

const mapBlog = (b) => ({
  title:       b.title       || "",
  category:    b.category    || "",
  readtime:    b.readtime    || 5,
  Destination: b.Destination || "",
  isPublished: Boolean(b.isPublished),
  isFeatured:  Boolean(b.isFeatured),
  author:      b.author?.id || b.author || "",
  tags:        Array.isArray(b.tags) ? b.tags : [],
  tagInput:    "",
  content:     b.content || "",
  image:       mapImg(b.image),
  seo: {
    metaTitle:       b.seo?.metaTitle       || "",
    metaDescription: b.seo?.metaDescription || "",
    metaKeywords:    Array.isArray(b.seo?.metaKeywords) ? b.seo.metaKeywords : [],
    canonicalUrl:    b.seo?.canonicalUrl    || "",
    index:           b.seo?.index  !== false,
    follow:          b.seo?.follow !== false,
    image:           mapImg(b.seo?.image),
    h1:              b.seo?.h1      || "",
    jsonSchema:      b.seo?.jsonSchema || {},
  },
});

const buildFd = (data, content) => {
  const payload = {
    title:       data.title?.trim() || "",
    category:    data.category      || "",
    readtime:    Number(data.readtime) || 5,
    Destination: data.Destination?.trim() || "",
    content:     content            || "",
    isPublished: data.isPublished,
    isFeatured:  data.isFeatured,
    author:      data.author,
    tags:        data.tags || [],
    image: {
      mode:  data.image?.file instanceof File ? "upload" : "url",
      src:   data.image?.file instanceof File ? "" : (data.image?.url || ""),
      alt:   data.image?.alt   || "",
      title: data.image?.title || "",
    },
    bannerImage: {
      mode:  data.image?.file instanceof File ? "upload" : "url",
      src:   data.image?.file instanceof File ? "" : (data.image?.url || ""),
      alt:   data.image?.alt   || "",
      title: data.image?.title || "",
    },
    seo: {
      metaTitle:       data.seo?.metaTitle       || "",
      metaDescription: data.seo?.metaDescription || "",
      metaKeywords:    Array.isArray(data.seo?.metaKeywords) ? data.seo.metaKeywords : [],
      canonicalUrl:    data.seo?.canonicalUrl    || "",
      index:           data.seo?.index  !== false,
      follow:          data.seo?.follow !== false,
      image: data.seo?.image?.file instanceof File
        ? { mode: "upload", src: "", alt: "", title: "" }
        : {
            mode:  "url",
            src:   data.seo?.image?.url   || "",
            alt:   data.seo?.image?.alt   || "",
            title: data.seo?.image?.title || "",
          },
      h1:         data.seo?.h1 || "",
      jsonSchema: data.seo?.jsonSchema && typeof data.seo.jsonSchema === "object"
                    ? data.seo.jsonSchema
                    : {},
    },
  };

  const fd = new FormData();
  fd.append("data", JSON.stringify(payload));
  if (data.image?.file instanceof File)      fd.append("imageFile",    data.image.file);
  if (data.seo?.image?.file instanceof File) fd.append("seoImageFile", data.seo.image.file);
  return fd;
};

/* ════════════════════════════════════════
   Collapsible Section wrapper
════════════════════════════════════════ */
const Section = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-bold text-gray-800">{title}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {/* 
        KEY FIX: Always render children (never unmount), just hide visually.
        This prevents Summernote from losing its DOM node when section is collapsed.
        visibility:hidden + height:0 keeps node in DOM but invisible.
      */}
      <div
        style={{
          overflow:   open ? "visible" : "hidden",
          maxHeight:  open ? "none"    : "0px",
          visibility: open ? "visible" : "hidden",
          transition: "max-height 0.2s ease",
        }}
      >
        <div className="px-5 pb-5 pt-1 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function AddBlogPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id) && id !== "new";

  const editorRef      = useRef(null);
  const editorInit     = useRef(false);
  const pendingHtml    = useRef("");
  const contentOpen    = useRef(true); // track content section open state

  const [data, setData]                     = useState(blank());
  const [authors, setAuthors]               = useState([]);
  const [authorsLoading, setAuthorsLoading] = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [pageLoading, setPageLoading]       = useState(isEdit);
  const [editorReady, setEditorReady]       = useState(false);

  /* ── Load Authors ── */
  useEffect(() => {
    (async () => {
      try {
        setAuthorsLoading(true);
        const res = await getAuthors({ active: "true" });
        setAuthors(res.data?.authors || res.data || []);
      } catch {
        toast.error("Failed to load authors");
      } finally {
        setAuthorsLoading(false);
      }
    })();
  }, []);

  /* ── Load Blog for Edit ── */
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        setPageLoading(true);
        const r    = await getBlog(id);
        if (cancelled) return;
        const blog = r?.data?.data || r?.data?.blog || r?.data;
        if (!blog) { toast.error("Blog not found"); return; }
        pendingHtml.current = blog.content || "";
        setData(mapBlog(blog));
      } catch {
        if (!cancelled) toast.error("Failed to load blog");
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  /* ── Load Summernote scripts ── */
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = SNOTE_CSS;
    document.head.appendChild(style);

    const load = (src) => new Promise((res) => {
      if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
      const s  = document.createElement("script");
      s.src    = src;
      s.onload = res;
      document.body.appendChild(s);
    });

    (async () => {
      if (!window.jQuery) await load("https://code.jquery.com/jquery-3.6.0.min.js");
      if (!window.jQuery?.fn?.summernote)
        await load("https://cdnjs.cloudflare.com/ajax/libs/summernote/0.8.20/summernote-bs4.min.js");
      setEditorReady(true);
    })();

    return () => {
      if (editorRef.current && window.jQuery && editorInit.current) {
        try { window.jQuery(editorRef.current).summernote("destroy"); } catch (_) {}
      }
      editorInit.current = false;
    };
  }, []);

  /* ── initEditor — stable callback so we can call it from multiple places ── */
  const initEditor = useCallback(() => {
    if (!editorRef.current || !window.jQuery || editorInit.current) return;
    const $ = window.jQuery;
    const $el = $(editorRef.current);

    // Destroy stale instance if any
    try { if ($el.data("summernote")) $el.summernote("destroy"); } catch (_) {}

    $el.summernote({
      height: 460,
      focus:  false,
      dialogsInBody: true,
      dialogsFade:   true,
      placeholder: "Write your blog content here...",
      fontNames: ["Arial","Georgia","Times New Roman","Courier New","Verdana","Trebuchet MS","Impact","Comic Sans MS","Tahoma","Helvetica"],
      fontNamesIgnoreCheck: ["Arial","Georgia","Times New Roman","Courier New","Verdana","Trebuchet MS","Impact","Comic Sans MS","Tahoma","Helvetica"],
      toolbar: [
        ["style",   ["style"]],
        ["font",    ["bold","italic","underline","clear"]],
        ["fontname",["fontname"]],
        ["size",    ["fontsize"]],
        ["color",   ["color"]],
        ["para",    ["ul","ol","paragraph"]],
        ["table",   ["table"]],
        ["insert",  ["link","picture","hr"]],
        ["view",    ["fullscreen","codeview"]],
      ],
      callbacks: {
        onInit() {
          editorInit.current = true;
          // Restore saved content
          if (pendingHtml.current) {
            setTimeout(() => {
              try { $el.summernote("code", pendingHtml.current); } catch (_) {}
            }, 50);
          }
        },
        onChange(html) {
          pendingHtml.current = html;
          setData(p => ({ ...p, content: html }));
        },
      },
    });
  }, []);

  /* ── Init Summernote once scripts + data ready ── */
  useEffect(() => {
    if (!editorReady || pageLoading) return;
    // Small delay so DOM is fully painted
    const t = setTimeout(() => initEditor(), 200);
    return () => clearTimeout(t);
  }, [editorReady, pageLoading, initEditor]);

  /* ─────────────────────────────────────────────────────────────
     KEY FIX: Watch editor container visibility with IntersectionObserver.
     When the Content section is collapsed (visibility:hidden), the editor
     loses layout. When it becomes visible again, we check if Summernote
     lost its toolbar and re-init if needed.
  ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!editorRef.current || !editorReady) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Section became visible — check if editor toolbar exists
            const toolbarExists = editorRef.current
              ?.closest('.note-editor') !== null ||
              editorRef.current
              ?.nextElementSibling?.classList?.contains('note-editor');

            // If Summernote toolbar is missing, re-initialize
            const noteEditorEl = editorRef.current?.parentElement?.querySelector('.note-editor');
            if (!noteEditorEl && editorReady && !pageLoading) {
              editorInit.current = false;
              setTimeout(() => initEditor(), 100);
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(editorRef.current);
    return () => observer.disconnect();
  }, [editorReady, pageLoading, initEditor]);

  /* ─────────────────────────────────────────────────────────────
     SIMPLER BACKUP FIX: Also use MutationObserver on the editor
     container — if .note-editor child is removed (collapsed section
     caused re-render), re-init.
  ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!editorRef.current || !editorReady) return;

    const container = editorRef.current.parentElement;
    if (!container) return;

    const mutationObs = new MutationObserver(() => {
      // If editor was previously initialized but note-editor div is gone
      if (editorInit.current) {
        const noteEditor = container.querySelector('.note-editor');
        if (!noteEditor && editorRef.current) {
          editorInit.current = false;
          setTimeout(() => initEditor(), 150);
        }
      }
    });

    mutationObs.observe(container, { childList: true, subtree: false });
    return () => mutationObs.disconnect();
  }, [editorReady, initEditor]);

  const set = (k, v) => setData(p => ({ ...p, [k]: v }));

  const getContent = () => {
    if (editorInit.current && editorRef.current && window.jQuery) {
      try { return window.jQuery(editorRef.current).summernote("code"); } catch (_) {}
    }
    return pendingHtml.current;
  };

  /* ── Tag helpers ── */
  const addTag = () => {
    const tag = data.tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag) return;
    if (data.tags.includes(tag)) { set("tagInput", ""); return; }
    if (data.tags.length >= 10)  { toast.warning("Max 10 tags allowed"); return; }
    setData(p => ({ ...p, tags: [...p.tags, tag], tagInput: "" }));
  };
  const removeTag = (tag) => setData(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }));
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
    if (e.key === "Backspace" && !data.tagInput && data.tags.length > 0)
      setData(p => ({ ...p, tags: p.tags.slice(0, -1) }));
  };

  /* ── Validation ── */
  const validate = () => {
    if (!data.title?.trim())
      { toast.error("Title is required"); return false; }
    if (countChars(data.title) > LIMITS.title.max)
      { toast.error(`Title max ${LIMITS.title.max} chars`); return false; }
    if (!data.author)
      { toast.error("Please select an author"); return false; }
    if (data.image?.file instanceof File && data.image.file.size > LIMITS.IMAGE_MB * 1024 * 1024)
      { toast.error(`Image max ${LIMITS.IMAGE_MB} MB`); return false; }
    if (data.seo?.image?.file instanceof File && data.seo.image.file.size > LIMITS.IMAGE_MB * 1024 * 1024)
      { toast.error(`SEO image max ${LIMITS.IMAGE_MB} MB`); return false; }
    return true;
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = buildFd(data, getContent());
      if (isEdit) await updateBlog(id, fd);
      else        await createBlog(fd);
      toast.success(`Blog ${isEdit ? "updated" : "created"} successfully!`);
      navigate("/blog");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }

  /* ══════════════════════════════════════
     RENDER
  ══════════════════════════════════════ */
  return (
    <div>

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/blog")} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back
          </button>
          <h1 className="text-base font-bold text-gray-900">
            {isEdit ? "Edit Blog" : "New Blog"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => set("isPublished", !data.isPublished)}
          >
            <span className="text-xs text-gray-400">Draft</span>
            <div className={`relative w-10 h-5 rounded-full transition-colors ${data.isPublished ? "bg-indigo-500" : "bg-gray-300"}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.isPublished ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
            <span className={`text-xs font-semibold ${data.isPublished ? "text-indigo-600" : "text-gray-400"}`}>
              Published
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4">

        {/* ── Basic Info ── */}
        <Section title="📋 Basic Info" defaultOpen={true}>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600">
                Title <span className="text-red-500">*</span>
              </span>
              <CC val={data.title} max={LIMITS.title.max} />
            </div>
            <input
              value={data.title}
              onChange={e => set("title", e.target.value)}
              maxLength={LIMITS.title.max}
              placeholder="Blog title"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                countChars(data.title) >= LIMITS.title.max ? "border-red-400" : "border-gray-300"
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">Category</span>
                <CC val={data.category} max={LIMITS.category.max} />
              </div>
              <input
                value={data.category}
                onChange={e => set("category", e.target.value)}
                maxLength={LIMITS.category.max}
                placeholder="e.g. Adventure, Budget, Luxury"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Author */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">
                  Author <span className="text-red-500">*</span>
                </span>
              </div>
              <select
                value={data.author}
                onChange={e => set("author", e.target.value)}
                disabled={authorsLoading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white disabled:bg-gray-50"
              >
                <option value="">{authorsLoading ? "Loading authors..." : "Select Author"}</option>
                {authors.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {!authorsLoading && authors.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">No authors found. Please add authors first.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Destination */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">Destination</span>
                <CC val={data.Destination} max={LIMITS.Destination.max} />
              </div>
              <input
                value={data.Destination}
                onChange={e => set("Destination", e.target.value)}
                maxLength={LIMITS.Destination.max}
                placeholder="e.g. Paris, Tokyo, New York"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Read Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">Read Time (min)</span>
              </div>
              <input
                type="number"
                min={1}
                max={120}
                value={data.readtime}
                onChange={e => set("readtime", e.target.value)}
                placeholder="5"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-600">Tags</span>
              <span className="text-xs text-gray-400">{data.tags.length}/10</span>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center border border-gray-300 rounded-lg px-3 py-2 min-h-[42px] focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-300 bg-white">
              {data.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium px-2 py-0.5 rounded-full"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 transition-colors ml-0.5 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={data.tagInput}
                onChange={e => set("tagInput", e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={data.tags.length === 0 ? "Add tags (press Enter or comma)..." : ""}
                className="flex-1 min-w-[140px] outline-none text-sm bg-transparent placeholder:text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Press Enter or comma to add. Max 10 tags.</p>
          </div>

        </Section>

        {/* ── Image ── */}
        <Section title="🖼️ Image" defaultOpen={true}>
          <ImagePicker
            label="Blog Image"
            value={data.image}
            onChange={v => {
              if (v?.file instanceof File && v.file.size > LIMITS.IMAGE_MB * 1024 * 1024) {
                toast.error(`Image max ${LIMITS.IMAGE_MB} MB`);
                return;
              }
              set("image", v);
            }}
            fieldName="imageFile"
          />
          <p className="text-xs text-gray-400 mt-1">
            Featured + banner image. Max: <strong>{LIMITS.IMAGE_MB} MB</strong>.
          </p>
        </Section>

        {/* ── Content — NOTE: editorRef lives here, Section keeps DOM alive ── */}
        <Section title="📝 Content" defaultOpen={true}>
          <p className="text-xs text-gray-400 mb-3">
            💡 SEO friendly content.{" "}
            <strong className="text-amber-600">Images in content should be under 5 MB.</strong>
          </p>
          {/*
            IMPORTANT: editorRef is attached here.
            The Section component uses visibility:hidden (NOT display:none)
            so this DOM node is NEVER removed from the tree.
            Summernote stays alive even when section is collapsed.
          */}
          <div
            ref={editorRef}
            className="border border-gray-200 rounded-xl bg-white"
            style={{ minHeight: "460px" }}
          />
          {!editorReady && (
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <div className="animate-spin h-3 w-3 rounded-full border-b-2 border-indigo-400" />
              Loading editor...
            </div>
          )}
        </Section>

        {/* ── SEO ── */}
        <Section title="🔍 SEO Settings" defaultOpen={false}>
          <p className="text-xs text-gray-500 mb-4">
            Khali chhodne par blog ka <strong>title</strong>, <strong>content</strong> aur{" "}
            <strong>image</strong> automatically use ho jayega.
          </p>
          <SeoSection
            data={{
              metaTitle:       data.seo.metaTitle,
              metaDescription: data.seo.metaDescription,
              metaKeywords:    data.seo.metaKeywords,
              canonicalUrl:    data.seo.canonicalUrl,
              index:           data.seo.index,
              follow:          data.seo.follow,
              image:           data.seo.image,
              h1:              data.seo.h1,
              jsonSchema:      data.seo.jsonSchema,
            }}
            onChange={v => {
              if (v?.image?.file instanceof File && v.image.file.size > LIMITS.IMAGE_MB * 1024 * 1024) {
                toast.error(`SEO image max ${LIMITS.IMAGE_MB} MB`);
                return;
              }
              set("seo", {
                ...data.seo,
                metaTitle:       v.metaTitle       ?? data.seo.metaTitle,
                metaDescription: v.metaDescription ?? data.seo.metaDescription,
                metaKeywords:    Array.isArray(v.metaKeywords) ? v.metaKeywords : data.seo.metaKeywords,
                canonicalUrl:    v.canonicalUrl    ?? data.seo.canonicalUrl,
                index:           v.index  !== undefined ? v.index  : data.seo.index,
                follow:          v.follow !== undefined ? v.follow : data.seo.follow,
                image:           v.image  !== undefined ? v.image  : data.seo.image,
                h1:              v.h1               ?? data.seo.h1,
                jsonSchema:      v.jsonSchema       ?? data.seo.jsonSchema,
              });
            }}
            siteUrl="https://www.yourdomain.com"
          />
        </Section>

      </div>
    </div>
  );
}