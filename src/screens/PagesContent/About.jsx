'use client';
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { SectionCard, Divider, Input, Textarea } from "../../components/CommonUI/UI.jsx";
import ImagePicker from "../../components/CommonUI/ImagePicker.jsx";
import { SeoSection } from "../../components/CommonUI/Sections.jsx";
import { getAboutPage, saveAboutPage } from "../../service/api.js";

/* ─── image helpers (copied exactly) ─── */
const mapImg   = (raw) => ({ url:(raw?.src||raw?.url||""), file:null, _preview:null, alt:raw?.alt||"", title:raw?.title||"" });
const cleanImg = (i)   => ({ src:(i?.file instanceof File)?"":(i?.url||""), alt:i?.alt||"", title:i?.title||"" });
const appendImg = (fd, key, img) => { if (img?.file instanceof File) fd.append(key, img.file); };

const blankSeo = () => ({ metaTitle:"", metaDescription:"", metaKeywords:[], canonicalUrl:"", index:true, follow:true, image:mapImg() });
const blankStat = () => ({ value:"", label:"" });

export default function AboutAdmin() {
  const [tab, setTab] = useState("content");

  const [heroHeading, setHeroHeading]       = useState("");
  const [heroSubtext, setHeroSubtext]       = useState("");
  const [heroImage, setHeroImage]           = useState(mapImg());
  const [missionHeading, setMissionHeading] = useState("");
  const [missionText, setMissionText]       = useState("");
  const [journeyHeading, setJourneyHeading] = useState("");
  const [journeyBody, setJourneyBody]       = useState("");
  const [journeyImage, setJourneyImage]     = useState(mapImg());
  const [stats, setStats]                   = useState([]);
  const [seo, setSeo]                       = useState(blankSeo());

  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);
  const inFlight = useRef(false);

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

  useEffect(() => { load(); }, [load]);

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

  if (loading) return <div className="cms-root"><div className="cms-loading"><div className="cms-spinner"/><p style={{color:"var(--cms-muted)",fontSize:13}}>Loading About page…</p></div></div>;
  if (loadErr)  return <div className="cms-root"><div className="cms-error-state"><span style={{fontSize:36}}>⚠️</span><p style={{color:"#ef4444",fontWeight:600,fontSize:14}}>{loadErr}</p><button onClick={load} style={{padding:"8px 20px",background:"var(--cms-accent)",color:"#fff",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer"}}>Retry</button></div></div>;

  return (
    <div className="cms-root">
      {saving && <div className="cms-overlay"><div className="cms-overlay-box"><div className="cms-spinner"/><p style={{fontWeight:700,fontSize:16}}>Saving…</p></div></div>}

      <div className="cms-page-header">
        <div><p className="cms-page-title">About Page</p><p className="cms-page-sub">Hero · Mission · Journey · Stats · SEO</p></div>
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
        {tab === "seo" && <SeoSection data={seo} onChange={setSeo} siteUrl="https://www.TravelBudgetly.com" />}

        {tab === "content" && (
          <>
            <div className="cms-info-banner">
              <svg style={{width:16,height:16,flexShrink:0}} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Edit the public <strong>About</strong> page — hero, mission, journey story and headline stats.</span>
            </div>

            {/* HERO */}
            <SectionCard icon="🌍" title="Hero Section">
              <Input label="Hero Heading" limit={12} value={heroHeading} onChange={e=>setHeroHeading(e.target.value)} placeholder="Travel More, Spend Less" />
              <Textarea label="Hero Subtext" limit={40} rows={3} value={heroSubtext} onChange={e=>setHeroSubtext(e.target.value)} placeholder="A short line that introduces TravelBudgetly…" />
              <Divider label="Hero Image" />
              <ImagePicker value={heroImage} onChange={setHeroImage} fieldName="heroImage" />
            </SectionCard>

            {/* MISSION */}
            <SectionCard icon="🎯" title="Mission" defaultOpen={false}>
              <Input label="Mission Heading" limit={12} value={missionHeading} onChange={e=>setMissionHeading(e.target.value)} placeholder="Our Mission" />
              <Textarea label="Mission Text" limit={60} rows={4} value={missionText} onChange={e=>setMissionText(e.target.value)} placeholder="Describe what TravelBudgetly sets out to do…" />
            </SectionCard>

            {/* JOURNEY */}
            <SectionCard icon="🧭" title="Our Journey" defaultOpen={false}>
              <Input label="Journey Heading" limit={12} value={journeyHeading} onChange={e=>setJourneyHeading(e.target.value)} placeholder="How We Started" />
              <Textarea label="Journey Body" limit={150} rows={6} value={journeyBody} onChange={e=>setJourneyBody(e.target.value)} placeholder="Tell the story of how TravelBudgetly came to be…" />
              <Divider label="Journey Image" />
              <ImagePicker value={journeyImage} onChange={setJourneyImage} fieldName="journeyImage" />
            </SectionCard>

            {/* STATS */}
            <SectionCard icon="📊" title="Stats" defaultOpen={false}>
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
          </>
        )}
      </div>
    </div>
  );
}