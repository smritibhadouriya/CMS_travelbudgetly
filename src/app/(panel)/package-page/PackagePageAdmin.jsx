'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { SectionCard, Input, Textarea } from "@/components/ui/UI.jsx";
import { SeoSection } from "@/components/ui/Sections.jsx";
import { getPackagePage, savePackagePage } from "@/client-api/api.js";

/* ─── image helpers ─── */
const mapImg   = (raw) => ({ url:(raw?.src||raw?.url||""), file:null, _preview:null, alt:raw?.alt||"", title:raw?.title||"" });
const cleanImg = (i)   => ({ src:(i?.file instanceof File)?"":(i?.url||""), alt:i?.alt||"", title:i?.title||"" });
const appendImg = (fd, key, img) => { if (img?.file instanceof File) fd.append(key, img.file); };

const blankSeo = () => ({ metaTitle:"", metaDescription:"", metaKeywords:[], canonicalUrl:"", index:true, follow:true, image:mapImg() });

/* ─── Tab definitions ─── */
const TABS = [
  { id: "hero",    label: "Hero",          icon: "🎒" },
  { id: "sidebar", label: "Sidebar & Blogs", icon: "📰" },
  { id: "seo",     label: "SEO",           icon: "🔍" },
];

export default function PackagePageAdmin({ initialData = {} }) {
  const d = initialData || {};
  const [tab, setTab] = useState("hero");

  const [heroLabel, setHeroLabel]     = useState(d.heroLabel || "");
  const [heroHeading, setHeroHeading] = useState(d.heroHeading || "");
  const [heroSubtext, setHeroSubtext] = useState(d.heroSubtext || "");
  const [helpText, setHelpText]       = useState(d.helpText || "");
  const [blogsHeading, setBlogsHeading] = useState(d.blogsHeading || "Travel Blogs");
  const [seo, setSeo]                 = useState({
    metaTitle:        d.seo?.metaTitle || "",
    metaDescription:  d.seo?.metaDescription || "",
    metaKeywords:     d.seo?.metaKeywords || [],
    canonicalUrl:     d.seo?.canonicalUrl || "",
    index:            d.seo?.index !== false,
    follow:           d.seo?.follow !== false,
    image:            mapImg(d.seo?.image),
  });

  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    let cancelled = false;
    setLoading(true); setLoadErr(null);
    try {
      const res = await getPackagePage();
      if (cancelled) return;
      const data = res.data?.data;
      if (data && Object.keys(data).length) {
        setHeroLabel(data.heroLabel || "");
        setHeroHeading(data.heroHeading || "");
        setHeroSubtext(data.heroSubtext || "");
        setHelpText(data.helpText || "");
        setBlogsHeading(data.blogsHeading || "Travel Blogs");
        setSeo({
          metaTitle:        data.seo?.metaTitle || "",
          metaDescription:  data.seo?.metaDescription || "",
          metaKeywords:     data.seo?.metaKeywords || [],
          canonicalUrl:     data.seo?.canonicalUrl || "",
          index:            data.seo?.index !== false,
          follow:           data.seo?.follow !== false,
          image:            mapImg(data.seo?.image),
        });
      }
    } catch (err) {
      if (!cancelled) { const msg = err.userMessage || "Failed to load page data."; setLoadErr(msg); toast.error(msg); }
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (inFlight.current || saving) return;
    inFlight.current = true; setSaving(true);
    try {
      const payload = {
        slug: "package_page",
        heroLabel,
        heroHeading,
        heroSubtext,
        helpText,
        blogsHeading,
        seo: { ...seo, image: cleanImg(seo.image) },
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      appendImg(fd, "seoImage", seo.image);

      const { data: res } = await savePackagePage(fd);
      if (res?.success) { toast.success("✅ Package page saved!", { autoClose:3000 }); await load(); }
      else toast.error(res?.message || "Save failed.");
    } catch (err) {
      toast.error(err.userMessage || "Save failed.");
    } finally { setSaving(false); inFlight.current = false; }
  };

  if (loading) return (
    <div className="cms-root">
      <div className="cms-loading">
        <div className="cms-spinner"/>
        <p style={{color:"var(--cms-muted)",fontSize:13}}>Loading Package page…</p>
      </div>
    </div>
  );
  if (loadErr) return (
    <div className="cms-root">
      <div className="cms-error-state">
        <span style={{fontSize:36}}>⚠️</span>
        <p style={{color:"#ef4444",fontWeight:600,fontSize:14}}>{loadErr}</p>
        <button onClick={load} style={{padding:"8px 20px",background:"var(--cms-accent)",color:"#fff",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer"}}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="cms-root">
      {saving && (
        <div className="cms-overlay">
          <div className="cms-overlay-box">
            <div className="cms-spinner"/>
            <p style={{fontWeight:700,fontSize:16}}>Saving…</p>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="cms-page-header">
        <div>
          <p className="cms-page-title">Package Page</p>
          <p className="cms-page-sub">Hero · Sidebar & Blogs · SEO</p>
        </div>
        <button type="button" onClick={handleSave} disabled={saving} className="cms-save-btn">
          {saving
            ? <><div className="cms-spinner" style={{width:14,height:14,borderWidth:2}}/> Saving…</>
            : <><svg style={{width:14,height:14}} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zM12 17v-6m-3 3h6"/></svg> Save Page</>
          }
        </button>
      </div>

      {/* ── Sidebar + Content layout ── */}
      <div className="cms-layout">
        <nav className="cms-sidenav">
          {TABS.map(({ id, label, icon }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`cms-sidenav-item ${isActive ? "active" : ""}`}
              >
                <span className="cms-sidenav-icon">{icon}</span>
                <span className="cms-sidenav-label">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Main Panel ── */}
        <div className="cms-panel">
          {tab === "hero" && (
            <SectionCard icon="🎒" title="Hero">
              <Input label="Hero Label" limit={6} value={heroLabel} onChange={e=>setHeroLabel(e.target.value)} placeholder="Travel Packages" />
              <Input label="Hero Heading" limit={12} value={heroHeading} onChange={e=>setHeroHeading(e.target.value)} placeholder="Find Your Perfect Trip" />
              <Textarea label="Hero Subtext" limit={40} rows={3} value={heroSubtext} onChange={e=>setHeroSubtext(e.target.value)} placeholder="A short line that introduces the packages…" />
            </SectionCard>
          )}

          {tab === "sidebar" && (
            <SectionCard icon="📰" title="Sidebar & Blogs">
              <Textarea label="Help Text" limit={60} rows={4} value={helpText} onChange={e=>setHelpText(e.target.value)} placeholder="Help block shown in the sidebar…" />
              <Input label="Blogs Heading" limit={6} value={blogsHeading} onChange={e=>setBlogsHeading(e.target.value)} placeholder="Travel Blogs" />
            </SectionCard>
          )}

          {tab === "seo" && (
            <SeoSection data={seo} onChange={setSeo} siteUrl="https://www.TravelBudgetly.com" />
          )}
        </div>
      </div>

      {/* ── Injected layout styles (mirror other editors) ── */}
      <style>{`
        .cms-layout {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-height: calc(100vh - 72px);
        }

        /* ── Horizontal tab bar ── */
        .cms-sidenav {
          width: 100%;
          min-width: unset;
          background: var(--cms-sidebar, #f8f9fb);
          border-right: none;
          border-bottom: 1px solid var(--cms-border, #e5e7eb);
          padding: 8px 12px;
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          overflow-x: auto;
          gap: 4px;
          position: sticky;
          top: 0;
          height: auto;
          z-index: 10;
        }

        .cms-sidenav::-webkit-scrollbar {
          height: 4px;
        }
        .cms-sidenav::-webkit-scrollbar-thumb {
          background: var(--cms-border, #e5e7eb);
          border-radius: 4px;
        }

        .cms-sidenav-item {
          display: flex;
          align-items: center;
          gap: 6px;
          width: auto;
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--cms-text, #374151);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s, color 0.15s;
        }

        .cms-sidenav-item:hover {
          background: var(--cms-hover, #eef2ff);
          color: var(--cms-accent, #6366f1);
        }

        .cms-sidenav-item.active {
          background: var(--cms-accent-light, #eef2ff);
          color: var(--cms-accent, #6366f1);
          font-weight: 600;
        }

        .cms-sidenav-icon {
          font-size: 15px;
          line-height: 1;
          flex-shrink: 0;
        }

        .cms-sidenav-label {
          white-space: nowrap;
        }

        /* ── Main panel ── */
        .cms-panel {
          flex: 1;
          min-width: 0;
          padding: 24px;
          overflow-y: auto;
        }

        /* ── Small screens ── */
        @media (max-width: 640px) {
          .cms-sidenav-item { padding: 7px 10px; }
          .cms-panel { padding: 16px; }
        }
      `}</style>
    </div>
  );
}