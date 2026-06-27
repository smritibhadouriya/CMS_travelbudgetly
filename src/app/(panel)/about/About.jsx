'use client';
import { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { SectionCard, Divider, Input, Textarea } from "@/components/ui/UI.jsx";
import { ImagePicker } from "@/components/ui/FormComponents";
import { SeoSection } from "@/components/ui/Sections.jsx";
import { getAboutPage, saveAboutPage } from "@/client-api/api.js";

/* ─── image helpers ─── */
const mapImg   = (raw) => ({ url:(raw?.src||raw?.url||""), file:null, _preview:null, alt:raw?.alt||"", title:raw?.title||"" });
const cleanImg = (i)   => ({ src:(i?.file instanceof File)?"":(i?.url||""), alt:i?.alt||"", title:i?.title||"" });
const appendImg = (fd, key, img) => { if (img?.file instanceof File) fd.append(key, img.file); };

const blankSeo = () => ({ metaTitle:"", metaDescription:"", metaKeywords:[], canonicalUrl:"", index:true, follow:true, image:mapImg() });
const blankStat = () => ({ value:"", label:"" });

/* ─── Tab definitions ─── */
const TABS = [
  { id: "hero",    label: "Hero",    icon: "🌍" },
  { id: "mission", label: "Mission", icon: "🎯" },
  { id: "journey", label: "Journey", icon: "🧭" },
  { id: "stats",   label: "Stats",   icon: "📊" },
  { id: "seo",     label: "SEO",     icon: "🔍" },
];

export default function AboutAdmin({ initialData = {} }) {
  const d = initialData || {};
  const [tab, setTab] = useState("hero");

  /* ── state ── */
  const [heroHeading, setHeroHeading]       = useState(d.heroHeading || "");
  const [heroSubtext, setHeroSubtext]       = useState(d.heroSubtext || "");
  const [heroImage, setHeroImage]           = useState(mapImg(d.heroImage));
  const [missionHeading, setMissionHeading] = useState(d.missionHeading || "");
  const [missionText, setMissionText]       = useState(d.missionText || "");
  const [journeyHeading, setJourneyHeading] = useState(d.journeyHeading || "");
  const [journeyBody, setJourneyBody]       = useState(d.journeyBody || "");
  const [journeyImage, setJourneyImage]     = useState(mapImg(d.journeyImage));
  const [stats, setStats]                   = useState((d.stats || []).map(s => ({ value:s?.value||"", label:s?.label||"" })));
  const [seo, setSeo]                       = useState({
    metaTitle:        d.seo?.metaTitle || "",
    metaDescription:  d.seo?.metaDescription || "",
    metaKeywords:     d.seo?.metaKeywords || [],
    canonicalUrl:     d.seo?.canonicalUrl || "",
    index:            d.seo?.index !== false,
    follow:           d.seo?.follow !== false,
    image:            mapImg(d.seo?.image),
  });

  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const inFlight = useRef(false);

  /* ── load (for retry & post‑save refresh) ── */
  const load = useCallback(async () => {
    let cancelled = false;
    setLoading(true); setLoadErr(null);
    try {
      const res = await getAboutPage();
      if (cancelled) return;
      const data = res.data?.data;
      if (data && Object.keys(data).length) {
        setHeroHeading(data.heroHeading || "");
        setHeroSubtext(data.heroSubtext || "");
        setHeroImage(mapImg(data.heroImage));
        setMissionHeading(data.missionHeading || "");
        setMissionText(data.missionText || "");
        setJourneyHeading(data.journeyHeading || "");
        setJourneyBody(data.journeyBody || "");
        setJourneyImage(mapImg(data.journeyImage));
        setStats((data.stats || []).map(s => ({ value:s?.value||"", label:s?.label||"" })));
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

  /* ── save ── */
  const handleSave = async () => {
    if (inFlight.current || saving) return;
    inFlight.current = true; setSaving(true);
    try {
      const payload = {
        heroHeading,
        heroSubtext,
        heroImage: cleanImg(heroImage),
        missionHeading,
        missionText,
        journeyHeading,
        journeyBody,
        journeyImage: cleanImg(journeyImage),
        stats: stats.map(s => ({ value:s.value, label:s.label })),
        seo: { ...seo, image: cleanImg(seo.image) },
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      appendImg(fd, "heroImage",    heroImage);
      appendImg(fd, "journeyImage", journeyImage);
      appendImg(fd, "seoImage",     seo.image);

      const { data: res } = await saveAboutPage(fd);
      if (res?.success) { toast.success("✅ About page saved!", { autoClose:3000 }); await load(); }
      else toast.error(res?.message || "Save failed.");
    } catch (err) {
      toast.error(err.userMessage || "Save failed.");
    } finally { setSaving(false); inFlight.current = false; }
  };

  if (loading) return (
    <div className="cms-root">
      <div className="cms-loading">
        <div className="cms-spinner"/>
        <p style={{color:"var(--cms-muted)",fontSize:13}}>Loading About page…</p>
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
          <p className="cms-page-title">About Page</p>
          <p className="cms-page-sub">Hero · Mission · Journey · Stats · SEO</p>
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
            <SectionCard icon="🌍" title="Hero Section">
              <Input label="Hero Heading" limit={12} value={heroHeading} onChange={e=>setHeroHeading(e.target.value)} placeholder="Travel More, Spend Less" />
              <Textarea label="Hero Subtext" limit={40} rows={3} value={heroSubtext} onChange={e=>setHeroSubtext(e.target.value)} placeholder="A short line that introduces TravelBudgetly…" />
              <Divider label="Hero Image" />
              <ImagePicker value={heroImage} onChange={setHeroImage} fieldName="heroImage" uploadEndpoint="api/upload/image" />
            </SectionCard>
          )}

          {tab === "mission" && (
            <SectionCard icon="🎯" title="Mission">
              <Input label="Mission Heading" limit={12} value={missionHeading} onChange={e=>setMissionHeading(e.target.value)} placeholder="Our Mission" />
              <Textarea label="Mission Text" limit={60} rows={4} value={missionText} onChange={e=>setMissionText(e.target.value)} placeholder="Describe what TravelBudgetly sets out to do…" />
            </SectionCard>
          )}

          {tab === "journey" && (
            <SectionCard icon="🧭" title="Our Journey">
              <Input label="Journey Heading" limit={12} value={journeyHeading} onChange={e=>setJourneyHeading(e.target.value)} placeholder="How We Started" />
              <Textarea label="Journey Body" limit={150} rows={6} value={journeyBody} onChange={e=>setJourneyBody(e.target.value)} placeholder="Tell the story of how TravelBudgetly came to be…" />
              <Divider label="Journey Image" />
              <ImagePicker value={journeyImage} onChange={setJourneyImage} fieldName="journeyImage" uploadEndpoint="api/upload/image" />
            </SectionCard>
          )}

          {tab === "stats" && (
            <SectionCard icon="📊" title="Stats">
              {stats.map((s, i) => (
                <div key={i} className="cms-member-card">
                  <div className="cms-member-header">
                    <span className="cms-member-num">Stat {i+1}</span>
                    <button type="button" className="cms-remove-btn" onClick={()=>setStats(prev=>prev.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Value" limit={4} value={s.value} placeholder="50K+" onChange={e=>{const a=[...stats];a[i]={...a[i],value:e.target.value};setStats(a);}} />
                    <Input label="Label" limit={6} value={s.label} placeholder="Happy Travellers" onChange={e=>{const a=[...stats];a[i]={...a[i],label:e.target.value};setStats(a);}} />
                  </div>
                </div>
              ))}
              <button type="button" className="cms-add-btn" disabled={stats.length>=8} onClick={()=>setStats(prev=>[...prev, blankStat()])}>+ Add Stat ({stats.length}/8)</button>
            </SectionCard>
          )}

          {tab === "seo" && (
            <SeoSection data={seo} onChange={setSeo} siteUrl="https://www.TravelBudgetly.com" />
          )}
        </div>
      </div>

      {/* ── Injected layout styles (mirror HomePageAdmin) ── */}
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