'use client';
import { useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { SectionCard, Divider, Input, Textarea, Toggle, VisBadge } from "../../components/CommonUI/UI.jsx";
import ImagePicker from "../../components/CommonUI/ImagePicker.jsx";
import { SeoSection } from "../../components/CommonUI/Sections.jsx";
import { getHomePage, saveHomePage } from "../../service/api.js";

/* ─── image helpers (same as About.jsx) ─── */
const mapImg   = (raw) => ({ url:(raw?.src||raw?.url||""), file:null, _preview:null, alt:raw?.alt||"", title:raw?.title||"" });
const cleanImg = (i)   => ({ src:(i?.file instanceof File)?"":(i?.url||""), alt:i?.alt||"", title:i?.title||"" });
const appendImg = (fd, key, img) => { if (img?.file instanceof File) fd.append(key, img.file); };

/* ─── blank factories ─── */
const blankSeo = () => ({ metaTitle:"", metaDescription:"", metaKeywords:[], canonicalUrl:"", index:true, follow:true, image:mapImg() });

export default function HomePageAdmin({ initialData = {} }) {
  // Initial page data comes from the Server Component (service → Prisma), not
  // axios. Seeds mirror `load`'s mapping exactly. `load` is retained for the
  // post-save refresh + the retry button.
  const d = initialData || {};
  const [tab, setTab] = useState("content");

  /* Hero */
  const [heroEnabled,  setHeroEnabled]  = useState(d.heroEnabled !== false);
  const [heroMobile,   setHeroMobile]   = useState(mapImg({ url: d.heroImageMobile }));
  const [heroTablet,   setHeroTablet]   = useState(mapImg({ url: d.heroImageTablet }));
  const [heroDesktop,  setHeroDesktop]  = useState(mapImg({ url: d.heroImageDesktop }));
  const [heroLaptop,   setHeroLaptop]   = useState(mapImg({ url: d.heroImageLaptop }));

  /* Featured Destinations */
  const [destinationsEnabled,   setDestinationsEnabled]   = useState(d.destinationsEnabled !== false);
  const [destinationsWatermark, setDestinationsWatermark] = useState(d.destinationsWatermark || "");
  const [destinationsHeading,   setDestinationsHeading]   = useState(d.destinationsHeading || "");
  const [destinationsSubtext,   setDestinationsSubtext]   = useState(d.destinationsSubtext || "");

  /* Special Offers */
  const [specialOffersEnabled, setSpecialOffersEnabled] = useState(d.specialOffersEnabled !== false);
  const [specialOffersHeading, setSpecialOffersHeading] = useState(d.specialOffersHeading || "");

  /* Popular Cities */
  const [popularCitiesEnabled,         setPopularCitiesEnabled]         = useState(d.popularCitiesEnabled !== false);
  const [popularCitiesHeading,         setPopularCitiesHeading]         = useState(d.popularCitiesHeading || "");
  const [popularCitiesExploreLinkText, setPopularCitiesExploreLinkText] = useState(d.popularCitiesExploreLinkText || "");

  /* Spiritual Packages */
  const [spritualpackage,        setSpritualpackage]        = useState(d.spritualpackage !== false);
  const [spritualpackageHeading, setSpritualpackageHeading] = useState(d.spritualpackageHeading || "");

  /* Why Choose Us */
  const [whyChooseUsEnabled,   setWhyChooseUsEnabled]   = useState(d.whyChooseUsEnabled !== false);
  const [whyChooseUsWatermark, setWhyChooseUsWatermark] = useState(d.whyChooseUsWatermark || "");
  const [whyChooseUsHeading,   setWhyChooseUsHeading]   = useState(d.whyChooseUsHeading || "");
  const [trustFeatures, setTrustFeatures] = useState((Array.isArray(d.trustFeatures) ? d.trustFeatures : []).map(f => ({ icon:f?.icon||"", title:f?.title||"", desc:f?.desc||"" })));
  const [centerImgs,    setCenterImgs]    = useState(() => {
    let center = [];
    try { center = JSON.parse(d.whyChooseUsCenterImages || "[]"); } catch { center = []; }
    return (Array.isArray(center) ? center : []).map(u => mapImg({ url: typeof u === "string" ? u : (u?.url || u?.src || "") }));
  });

  /* Popular Packages */
  const [packagesEnabled,         setPackagesEnabled]         = useState(d.packagesEnabled !== false);
  const [packagesWatermark,       setPackagesWatermark]       = useState(d.packagesWatermark || "");
  const [packagesHeading,         setPackagesHeading]         = useState(d.packagesHeading || "");
  const [packagesSubtext,         setPackagesSubtext]         = useState(d.packagesSubtext || "");
  const [packagesExploreLinkText, setPackagesExploreLinkText] = useState(d.packagesExploreLinkText || "");

  /* Seasonal Travel */
  const [seasonalEnabled,   setSeasonalEnabled]   = useState(d.seasonalEnabled !== false);
  const [seasonalWatermark, setSeasonalWatermark] = useState(d.seasonalWatermark || "");
  const [seasonalHeading,   setSeasonalHeading]   = useState(d.seasonalHeading || "");
  const [seasonalSubtext,   setSeasonalSubtext]   = useState(d.seasonalSubtext || "");
  const [seasons, setSeasons] = useState((Array.isArray(d.seasons) ? d.seasons : []).map(s => ({ id:s?.id||"", label:s?.label||"", image:s?.image||"" })));

  /* Latest Blogs */
  const [blogsEnabled,         setBlogsEnabled]         = useState(d.blogsEnabled !== false);
  const [blogsWatermark,       setBlogsWatermark]       = useState(d.blogsWatermark || "");
  const [blogsHeading,         setBlogsHeading]         = useState(d.blogsHeading || "");
  const [blogsSubheading,      setBlogsSubheading]      = useState(d.blogsSubheading || "");
  const [blogsExploreLinkText, setBlogsExploreLinkText] = useState(d.blogsExploreLinkText || "");

  /* Newsletter */
  const [newsletterEnabled, setNewsletterEnabled] = useState(d.newsletterEnabled !== false);
  const [newsletterHeading, setNewsletterHeading] = useState(d.newsletterHeading || "");
  const [newsletterSubtext, setNewsletterSubtext] = useState(d.newsletterSubtext || "");

  /* SEO */
  const [seo, setSeo] = useState(d.seo ? {
    metaTitle: d.seo?.metaTitle || "",
    metaDescription: d.seo?.metaDescription || "",
    metaKeywords: d.seo?.metaKeywords || [],
    canonicalUrl: d.seo?.canonicalUrl || "",
    index: d.seo?.index !== false,
    follow: d.seo?.follow !== false,
    image: mapImg(d.seo?.image),
  } : blankSeo());

  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    let cancelled = false;
    setLoading(true); setLoadErr(null);
    try {
      const res = await getHomePage();
      if (cancelled) return;
      const d = res.data?.data;
      if (!d || !Object.keys(d).length) return;

      setHeroEnabled(d.heroEnabled !== false);
      setHeroMobile(mapImg({ url: d.heroImageMobile }));
      setHeroTablet(mapImg({ url: d.heroImageTablet }));
      setHeroDesktop(mapImg({ url: d.heroImageDesktop }));
      setHeroLaptop(mapImg({ url: d.heroImageLaptop }));

      setDestinationsEnabled(d.destinationsEnabled !== false);
      setDestinationsWatermark(d.destinationsWatermark || "");
      setDestinationsHeading(d.destinationsHeading || "");
      setDestinationsSubtext(d.destinationsSubtext || "");

      setSpecialOffersEnabled(d.specialOffersEnabled !== false);
      setSpecialOffersHeading(d.specialOffersHeading || "");

      setPopularCitiesEnabled(d.popularCitiesEnabled !== false);
      setPopularCitiesHeading(d.popularCitiesHeading || "");
      setPopularCitiesExploreLinkText(d.popularCitiesExploreLinkText || "");

      setSpritualpackage(d.spritualpackage !== false);
      setSpritualpackageHeading(d.spritualpackageHeading || "");

      setWhyChooseUsEnabled(d.whyChooseUsEnabled !== false);
      setWhyChooseUsWatermark(d.whyChooseUsWatermark || "");
      setWhyChooseUsHeading(d.whyChooseUsHeading || "");
      setTrustFeatures((Array.isArray(d.trustFeatures) ? d.trustFeatures : []).map(f => ({ icon:f?.icon||"", title:f?.title||"", desc:f?.desc||"" })));

      let center = [];
      try { center = JSON.parse(d.whyChooseUsCenterImages || "[]"); } catch { center = []; }
      setCenterImgs((Array.isArray(center) ? center : []).map(u => mapImg({ url: typeof u === "string" ? u : (u?.url || u?.src || "") })));

      setPackagesEnabled(d.packagesEnabled !== false);
      setPackagesWatermark(d.packagesWatermark || "");
      setPackagesHeading(d.packagesHeading || "");
      setPackagesSubtext(d.packagesSubtext || "");
      setPackagesExploreLinkText(d.packagesExploreLinkText || "");

      setSeasonalEnabled(d.seasonalEnabled !== false);
      setSeasonalWatermark(d.seasonalWatermark || "");
      setSeasonalHeading(d.seasonalHeading || "");
      setSeasonalSubtext(d.seasonalSubtext || "");
      setSeasons((Array.isArray(d.seasons) ? d.seasons : []).map(s => ({ id:s?.id||"", label:s?.label||"", image:s?.image||"" })));

      setBlogsEnabled(d.blogsEnabled !== false);
      setBlogsWatermark(d.blogsWatermark || "");
      setBlogsHeading(d.blogsHeading || "");
      setBlogsSubheading(d.blogsSubheading || "");
      setBlogsExploreLinkText(d.blogsExploreLinkText || "");

      setNewsletterEnabled(d.newsletterEnabled !== false);
      setNewsletterHeading(d.newsletterHeading || "");
      setNewsletterSubtext(d.newsletterSubtext || "");

      setSeo({
        metaTitle: d.seo?.metaTitle || "",
        metaDescription: d.seo?.metaDescription || "",
        metaKeywords: d.seo?.metaKeywords || [],
        canonicalUrl: d.seo?.canonicalUrl || "",
        index: d.seo?.index !== false,
        follow: d.seo?.follow !== false,
        image: mapImg(d.seo?.image),
      });
    } catch (err) {
      if (!cancelled) { const msg = err.userMessage || "Failed to load page data."; setLoadErr(msg); toast.error(msg); }
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  // Initial data arrives via the `initialData` prop (server-fetched) — no
  // on-mount GET. `load` below still runs after save and on the retry button.

  const handleSave = async () => {
    if (inFlight.current || saving) return;
    inFlight.current = true; setSaving(true);
    try {
      const payload = {
        heroEnabled,
        heroImageMobile:  (heroMobile.file instanceof File)  ? "" : (heroMobile.url  || ""),
        heroImageTablet:  (heroTablet.file instanceof File)  ? "" : (heroTablet.url  || ""),
        heroImageDesktop: (heroDesktop.file instanceof File) ? "" : (heroDesktop.url || ""),
        heroImageLaptop:  (heroLaptop.file instanceof File)  ? "" : (heroLaptop.url  || ""),

        destinationsEnabled,
        destinationsWatermark,
        destinationsHeading,
        destinationsSubtext,

        specialOffersEnabled,
        specialOffersHeading,

        popularCitiesEnabled,
        popularCitiesHeading,
        popularCitiesExploreLinkText,

        spritualpackage,
        spritualpackageHeading,

        whyChooseUsEnabled,
        whyChooseUsWatermark,
        whyChooseUsHeading,
        trustFeatures: trustFeatures.map(f => ({ icon:f.icon, title:f.title, desc:f.desc })),
        whyChooseUsCenterImages: centerImgs.map(i => i.file instanceof File ? "" : (i.url || "")).filter(Boolean),

        packagesEnabled,
        packagesWatermark,
        packagesHeading,
        packagesSubtext,
        packagesExploreLinkText,

        seasonalEnabled,
        seasonalWatermark,
        seasonalHeading,
        seasonalSubtext,
        seasons: seasons.map(s => ({ id:s.id, label:s.label, image:s.image })),

        blogsEnabled,
        blogsWatermark,
        blogsHeading,
        blogsSubheading,
        blogsExploreLinkText,

        newsletterEnabled,
        newsletterHeading,
        newsletterSubtext,

        seo: { ...seo, image: cleanImg(seo.image) },
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      appendImg(fd, "heroImageMobile",  heroMobile);
      appendImg(fd, "heroImageTablet",  heroTablet);
      appendImg(fd, "heroImageDesktop", heroDesktop);
      appendImg(fd, "heroImageLaptop",  heroLaptop);
      appendImg(fd, "seoImage", seo.image);

      const { data: res } = await saveHomePage(fd);
      if (res?.success) { toast.success("✅ Home page saved!", { autoClose:3000 }); await load(); }
      else toast.error(res?.message || "Save failed.");
    } catch (err) {
      toast.error(err.userMessage || "Save failed.");
    } finally { setSaving(false); inFlight.current = false; }
  };

  if (loading) return <div className="cms-root"><div className="cms-loading"><div className="cms-spinner"/><p style={{color:"var(--cms-muted)",fontSize:13}}>Loading Home page…</p></div></div>;
  if (loadErr)  return <div className="cms-root"><div className="cms-error-state"><span style={{fontSize:36}}>⚠️</span><p style={{color:"#ef4444",fontWeight:600,fontSize:14}}>{loadErr}</p><button onClick={load} style={{padding:"8px 20px",background:"var(--cms-accent)",color:"#fff",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer"}}>Retry</button></div></div>;

  return (
    <div className="cms-root">
      {saving && <div className="cms-overlay"><div className="cms-overlay-box"><div className="cms-spinner"/><p style={{fontWeight:700,fontSize:16}}>Saving…</p></div></div>}

      <div className="cms-page-header">
        <div><p className="cms-page-title">Home Page</p><p className="cms-page-sub">Hero · Destinations · Offers · Cities · Packages · Seasonal · Blogs · Newsletter · SEO</p></div>
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
              <span>Use each section's <strong>toggle</strong> to show/hide it on the live site.</span>
            </div>

            {/* HERO */}
            <SectionCard icon="🦸" title="Hero Section" isVisible={heroEnabled} onVisToggle={setHeroEnabled}>
              <Toggle label="Show section" checked={heroEnabled} onChange={setHeroEnabled} />
              <Divider label="Responsive Hero Images" />
              <ImagePicker label="Mobile Image"  value={heroMobile}  onChange={setHeroMobile}  fieldName="heroImageMobile" />
              <ImagePicker label="Tablet Image"  value={heroTablet}  onChange={setHeroTablet}  fieldName="heroImageTablet" />
              <ImagePicker label="Laptop Image"  value={heroLaptop}  onChange={setHeroLaptop}  fieldName="heroImageLaptop" />
              <ImagePicker label="Desktop Image" value={heroDesktop} onChange={setHeroDesktop} fieldName="heroImageDesktop" />
            </SectionCard>

            {/* FEATURED DESTINATIONS */}
            <SectionCard icon="🌍" title="Featured Destinations" defaultOpen={false} isVisible={destinationsEnabled} onVisToggle={setDestinationsEnabled}>
              <Toggle label="Show section" checked={destinationsEnabled} onChange={setDestinationsEnabled} />
              <Divider />
              <Input label="Watermark" value={destinationsWatermark} onChange={e=>setDestinationsWatermark(e.target.value)} placeholder="EXPLORE" />
              <Input label="Heading" value={destinationsHeading} onChange={e=>setDestinationsHeading(e.target.value)} placeholder="Featured Destinations" />
              <Textarea label="Subtext" rows={2} value={destinationsSubtext} onChange={e=>setDestinationsSubtext(e.target.value)} />
            </SectionCard>

            {/* SPECIAL OFFERS */}
            <SectionCard icon="🏷️" title="Special Offers" defaultOpen={false} isVisible={specialOffersEnabled} onVisToggle={setSpecialOffersEnabled}>
              <Toggle label="Show section" checked={specialOffersEnabled} onChange={setSpecialOffersEnabled} />
              <Divider />
              <Input label="Heading" value={specialOffersHeading} onChange={e=>setSpecialOffersHeading(e.target.value)} placeholder="Special Offers" />
            </SectionCard>

            {/* POPULAR CITIES */}
            <SectionCard icon="🏙️" title="Popular Cities" defaultOpen={false} isVisible={popularCitiesEnabled} onVisToggle={setPopularCitiesEnabled}>
              <Toggle label="Show section" checked={popularCitiesEnabled} onChange={setPopularCitiesEnabled} />
              <Divider />
              <Input label="Heading" value={popularCitiesHeading} onChange={e=>setPopularCitiesHeading(e.target.value)} placeholder="Popular Cities" />
              <Input label="Explore Link Text" value={popularCitiesExploreLinkText} onChange={e=>setPopularCitiesExploreLinkText(e.target.value)} placeholder="Explore all cities" />
            </SectionCard>

            {/* SPIRITUAL PACKAGES */}
            <SectionCard icon="🛕" title="Spiritual Packages" defaultOpen={false} isVisible={spritualpackage} onVisToggle={setSpritualpackage}>
              <Toggle label="Show section" checked={spritualpackage} onChange={setSpritualpackage} />
              <Divider />
              <Input label="Heading" value={spritualpackageHeading} onChange={e=>setSpritualpackageHeading(e.target.value)} placeholder="Spiritual Packages" />
            </SectionCard>

            {/* WHY CHOOSE US */}
            <SectionCard icon="⭐" title="Why Choose Us" defaultOpen={false} isVisible={whyChooseUsEnabled} onVisToggle={setWhyChooseUsEnabled}>
              <Toggle label="Show section" checked={whyChooseUsEnabled} onChange={setWhyChooseUsEnabled} />
              <Divider />
              <Input label="Watermark" value={whyChooseUsWatermark} onChange={e=>setWhyChooseUsWatermark(e.target.value)} placeholder="WHY US" />
              <Input label="Heading" value={whyChooseUsHeading} onChange={e=>setWhyChooseUsHeading(e.target.value)} placeholder="Why Choose Us" />

              <Divider label={`Trust Features (${trustFeatures.length})`} />
              {trustFeatures.map((f,i) => (
                <div key={i} className="cms-member-card">
                  <div className="cms-member-header">
                    <span className="cms-member-num">Feature {i+1}</span>
                    <button type="button" className="cms-remove-btn" onClick={()=>setTrustFeatures(arr=>arr.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Icon" value={f.icon} onChange={e=>{const a=[...trustFeatures];a[i]={...a[i],icon:e.target.value};setTrustFeatures(a);}} placeholder="FaShieldAlt" />
                    <Input label="Title" value={f.title} onChange={e=>{const a=[...trustFeatures];a[i]={...a[i],title:e.target.value};setTrustFeatures(a);}} />
                  </div>
                  <Textarea label="Description" rows={2} value={f.desc} onChange={e=>{const a=[...trustFeatures];a[i]={...a[i],desc:e.target.value};setTrustFeatures(a);}} />
                </div>
              ))}
              <button type="button" className="cms-add-btn" onClick={()=>setTrustFeatures(a=>[...a,{ icon:"", title:"", desc:"" }])}>+ Add Trust Feature ({trustFeatures.length})</button>

              <Divider label={`Center Images (${centerImgs.length})`} />
              {centerImgs.map((img,i) => (
                <div key={i} className="cms-member-card">
                  <div className="cms-member-header">
                    <span className="cms-member-num">Image {i+1}</span>
                    <button type="button" className="cms-remove-btn" onClick={()=>setCenterImgs(arr=>arr.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                  <Input label="Image URL" type="url" value={img.url} onChange={e=>{const a=[...centerImgs];a[i]={...a[i],url:e.target.value,file:null,_preview:null};setCenterImgs(a);}} placeholder="https://example.com/image.jpg" />
                </div>
              ))}
              <button type="button" className="cms-add-btn" onClick={()=>setCenterImgs(a=>[...a,mapImg()])}>+ Add Center Image ({centerImgs.length})</button>
            </SectionCard>

            {/* POPULAR PACKAGES */}
            <SectionCard icon="🎒" title="Popular Packages" defaultOpen={false} isVisible={packagesEnabled} onVisToggle={setPackagesEnabled}>
              <Toggle label="Show section" checked={packagesEnabled} onChange={setPackagesEnabled} />
              <Divider />
              <Input label="Watermark" value={packagesWatermark} onChange={e=>setPackagesWatermark(e.target.value)} placeholder="PACKAGES" />
              <Input label="Heading" value={packagesHeading} onChange={e=>setPackagesHeading(e.target.value)} placeholder="Popular Packages" />
              <Textarea label="Subtext" rows={2} value={packagesSubtext} onChange={e=>setPackagesSubtext(e.target.value)} />
              <Input label="Explore Link Text" value={packagesExploreLinkText} onChange={e=>setPackagesExploreLinkText(e.target.value)} placeholder="View all packages" />
            </SectionCard>

            {/* SEASONAL TRAVEL */}
            <SectionCard icon="🍂" title="Seasonal Travel" defaultOpen={false} isVisible={seasonalEnabled} onVisToggle={setSeasonalEnabled}>
              <Toggle label="Show section" checked={seasonalEnabled} onChange={setSeasonalEnabled} />
              <Divider />
              <Input label="Watermark" value={seasonalWatermark} onChange={e=>setSeasonalWatermark(e.target.value)} placeholder="SEASONS" />
              <Input label="Heading" value={seasonalHeading} onChange={e=>setSeasonalHeading(e.target.value)} placeholder="Seasonal Travel" />
              <Textarea label="Subtext" rows={2} value={seasonalSubtext} onChange={e=>setSeasonalSubtext(e.target.value)} />

              <Divider label={`Seasons (${seasons.length})`} />
              {seasons.map((s,i) => (
                <div key={i} className="cms-member-card">
                  <div className="cms-member-header">
                    <span className="cms-member-num">Season {i+1}</span>
                    <button type="button" className="cms-remove-btn" onClick={()=>setSeasons(arr=>arr.filter((_,j)=>j!==i))}>✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="ID" value={s.id} onChange={e=>{const a=[...seasons];a[i]={...a[i],id:e.target.value};setSeasons(a);}} placeholder="summer" />
                    <Input label="Label" value={s.label} onChange={e=>{const a=[...seasons];a[i]={...a[i],label:e.target.value};setSeasons(a);}} placeholder="Summer" />
                  </div>
                  <Input label="Image URL" type="url" value={s.image} onChange={e=>{const a=[...seasons];a[i]={...a[i],image:e.target.value};setSeasons(a);}} placeholder="https://example.com/image.jpg" />
                </div>
              ))}
              <button type="button" className="cms-add-btn" onClick={()=>setSeasons(a=>[...a,{ id:"", label:"", image:"" }])}>+ Add Season ({seasons.length})</button>
            </SectionCard>

            {/* LATEST BLOGS */}
            <SectionCard icon="📝" title="Latest Blogs" defaultOpen={false} isVisible={blogsEnabled} onVisToggle={setBlogsEnabled}>
              <Toggle label="Show section" checked={blogsEnabled} onChange={setBlogsEnabled} />
              <Divider />
              <Input label="Watermark" value={blogsWatermark} onChange={e=>setBlogsWatermark(e.target.value)} placeholder="BLOG" />
              <Input label="Heading" value={blogsHeading} onChange={e=>setBlogsHeading(e.target.value)} placeholder="Latest Blogs" />
              <Input label="Subheading" value={blogsSubheading} onChange={e=>setBlogsSubheading(e.target.value)} />
              <Input label="Explore Link Text" value={blogsExploreLinkText} onChange={e=>setBlogsExploreLinkText(e.target.value)} placeholder="Read all articles" />
            </SectionCard>

            {/* NEWSLETTER */}
            <SectionCard icon="📧" title="Newsletter" defaultOpen={false} isVisible={newsletterEnabled} onVisToggle={setNewsletterEnabled}>
              <Toggle label="Show section" checked={newsletterEnabled} onChange={setNewsletterEnabled} />
              <Divider />
              <Input label="Heading" value={newsletterHeading} onChange={e=>setNewsletterHeading(e.target.value)} placeholder="Subscribe to our Newsletter" />
              <Textarea label="Subtext" rows={2} value={newsletterSubtext} onChange={e=>setNewsletterSubtext(e.target.value)} />
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}