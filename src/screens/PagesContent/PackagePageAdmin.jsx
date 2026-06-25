'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { SectionCard, Input, Textarea } from "../../components/CommonUI/UI.jsx";
import { SeoSection } from "../../components/CommonUI/Sections.jsx";
import { getPackagePage, savePackagePage } from "../../service/api.js";

/* ─── image helpers (copied exactly) ─── */
const mapImg   = (raw) => ({ url:(raw?.src||raw?.url||""), file:null, _preview:null, alt:raw?.alt||"", title:raw?.title||"" });
const cleanImg = (i)   => ({ src:(i?.file instanceof File)?"":(i?.url||""), alt:i?.alt||"", title:i?.title||"" });
const appendImg = (fd, key, img) => { if (img?.file instanceof File) fd.append(key, img.file); };

const blankSeo = () => ({ metaTitle:"", metaDescription:"", metaKeywords:[], canonicalUrl:"", index:true, follow:true, image:mapImg() });

export default function PackagePageAdmin() {
  const [tab, setTab] = useState("content");

  const [heroLabel, setHeroLabel]     = useState("");
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubtext, setHeroSubtext] = useState("");
  const [helpText, setHelpText]       = useState("");
  const [blogsHeading, setBlogsHeading] = useState("Travel Blogs");
  const [seo, setseo]                 = useState(blankSeo());

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
        setseo({
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

  if (loading) return <div className="cms-root"><div className="cms-loading"><div className="cms-spinner"/><p style={{color:"var(--cms-muted)",fontSize:13}}>Loading Package page…</p></div></div>;
  if (loadErr)  return <div className="cms-root"><div className="cms-error-state"><span style={{fontSize:36}}>⚠️</span><p style={{color:"#ef4444",fontWeight:600,fontSize:14}}>{loadErr}</p><button onClick={load} style={{padding:"8px 20px",background:"var(--cms-accent)",color:"#fff",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer"}}>Retry</button></div></div>;

  return (
    <div className="cms-root">
      {saving && <div className="cms-overlay"><div className="cms-overlay-box"><div className="cms-spinner"/><p style={{fontWeight:700,fontSize:16}}>Saving…</p></div></div>}

      <div className="cms-page-header">
        <div><p className="cms-page-title">Package Page</p><p className="cms-page-sub">Hero · Sidebar & Blogs · SEO</p></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div className="cms-tabs">
            {[["content","✏️ Content"],["seo","🔍 SEO"]].map(([id,label]) => (
              <button key={id} type="button" onClick={()=>setTab(id)} className={`cms-tab ${tab===id?"active":""}`}>{label}</button>
            ))}
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className="cms-save-btn">
            {saving ? <><div className="cms-spinner" style={{width:14,height:14,borderWidth:2}}/> Saving…</> : <><svg style={{width:14,height:14}} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zM12 17v-6m-3 3h6"/></svg> Save Page</>}
          </button>
        </div>
      </div>

      <div className="cms-content">
        {tab === "seo" && <SeoSection data={seo} onChange={setseo} siteUrl="https://www.TravelBudgetly.com" />}

        {tab === "content" && (
          <>
            <div className="cms-info-banner">
              <svg style={{width:16,height:16,flexShrink:0}} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Edit the public <strong>Package</strong> page — hero copy, sidebar help text and blogs heading.</span>
            </div>

            {/* HERO */}
            <SectionCard icon="🎒" title="Hero">
              <Input label="Hero Label" limit={6} value={heroLabel} onChange={e=>setHeroLabel(e.target.value)} placeholder="Travel Packages" />
              <Input label="Hero Heading" limit={12} value={heroHeading} onChange={e=>setHeroHeading(e.target.value)} placeholder="Find Your Perfect Trip" />
              <Textarea label="Hero Subtext" limit={40} rows={3} value={heroSubtext} onChange={e=>setHeroSubtext(e.target.value)} placeholder="A short line that introduces the packages…" />
            </SectionCard>

            {/* SIDEBAR & BLOGS */}
            <SectionCard icon="📰" title="Sidebar & Blogs" defaultOpen={false}>
              <Textarea label="Help Text" limit={60} rows={4} value={helpText} onChange={e=>setHelpText(e.target.value)} placeholder="Help block shown in the sidebar…" />
              <Input label="Blogs Heading" limit={6} value={blogsHeading} onChange={e=>setBlogsHeading(e.target.value)} placeholder="Travel Blogs" />
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}