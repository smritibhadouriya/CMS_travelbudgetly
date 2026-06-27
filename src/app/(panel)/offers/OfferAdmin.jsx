'use client';

import { useState, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { SectionCard, Divider, Input, Textarea, Toggle } from "@/components/ui/UI.jsx";
import { ImagePicker } from "@/components/ui/FormComponents";
import { getOffers, createOffer, updateOffer, deleteOffer } from "@/client-api/api.js";

/* ─── image helpers (copied exactly) ─── */
const mapImg   = (raw) => ({ url:(raw?.src||raw?.url||""), file:null, _preview:null, alt:raw?.alt||"", title:raw?.title||"" });
const cleanImg = (i)   => ({ src:(i?.file instanceof File)?"":(i?.url||""), alt:i?.alt||"", title:i?.title||"" });
const appendImg = (fd, key, img) => { if (img?.file instanceof File) fd.append(key, img.file); };

export default function OfferAdmin({ initialOffers = [] }) {
  // Initial list comes from the Server Component (service → Prisma), not axios.
  const [offers, setOffers]   = useState(initialOffers);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const inFlight = useRef(false);

  /* form state */
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [heading, setHeading]   = useState("");
  const [subtext, setSubtext]   = useState("");
  const [slug, setSlug]         = useState("");
  const [banner, setBanner]     = useState(mapImg());
  const [isPublished, setIsPublished] = useState(true);

  const load = useCallback(async () => {
    let cancelled = false;
    setLoading(true); setLoadErr(null);
    try {
      const res = await getOffers();
      if (cancelled) return;
      setOffers(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      if (!cancelled) { const msg = err.userMessage || "Failed to load offers."; setLoadErr(msg); toast.error(msg); }
    } finally {
      if (!cancelled) setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  // Initial offers arrive via the `initialOffers` prop (server-fetched).
  // `load` is retained for post-mutation refresh (create/update/delete) below.

  const resetForm = () => {
    setEditId(null);
    setHeading(""); setSubtext(""); setSlug("");
    setBanner(mapImg()); setIsPublished(true);
  };

  const openCreate = () => { resetForm(); setFormOpen(true); };

  const openEdit = (o) => {
    setEditId(o?._id || o?.id || null);
    setHeading(o?.Heading || "");
    setSubtext(o?.Subtext || "");
    setSlug(o?.slug || "");
    setBanner(mapImg(o?.banner));
    setIsPublished(o?.isPublished !== false);
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); resetForm(); };

  const handleSave = async () => {
    if (inFlight.current || saving) return;
    if (!heading.trim()) { toast.error("Heading is required."); return; }
    inFlight.current = true; setSaving(true);
    try {
      const payload = {
        slug: slug.trim(),
        Heading: heading,
        Subtext: subtext,
        banner: cleanImg(banner),
        isPublished,
      };

      const fd = new FormData();
      fd.append("data", JSON.stringify(payload));
      appendImg(fd, "banner", banner);

      if (editId) {
        await updateOffer(editId, fd);
        toast.success("✅ Offer updated!", { autoClose:3000 });
      } else {
        await createOffer(fd);
        toast.success("✅ Offer created!", { autoClose:3000 });
      }
      closeForm();
      await load();
    } catch (err) {
      toast.error(err.userMessage || "Save failed.");
    } finally { setSaving(false); inFlight.current = false; }
  };

  const handleDelete = async (o) => {
    const id = o?._id || o?.id;
    if (!id) return;
    if (!window.confirm(`Delete offer "${o?.Heading || "Untitled"}"? This cannot be undone.`)) return;
    try {
      await deleteOffer(id);
      toast.success("🗑️ Offer deleted.", { autoClose:3000 });
      if (editId === id) closeForm();
      await load();
    } catch (err) {
      toast.error(err.userMessage || "Delete failed.");
    }
  };

  if (loading) return <div className="cms-root"><div className="cms-loading"><div className="cms-spinner"/><p style={{color:"var(--cms-muted)",fontSize:13}}>Loading offers…</p></div></div>;
  if (loadErr)  return <div className="cms-root"><div className="cms-error-state"><span style={{fontSize:36}}>⚠️</span><p style={{color:"#ef4444",fontWeight:600,fontSize:14}}>{loadErr}</p><button onClick={load} style={{padding:"8px 20px",background:"var(--cms-accent)",color:"#fff",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer"}}>Retry</button></div></div>;

  return (
    <div className="cms-root">
      {saving && <div className="cms-overlay"><div className="cms-overlay-box"><div className="cms-spinner"/><p style={{fontWeight:700,fontSize:16}}>Saving…</p></div></div>}

      <div className="cms-page-header">
        <div><p className="cms-page-title">Offers</p><p className="cms-page-sub">Manage promotional offers · banners · publish state</p></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {!formOpen && (
            <button type="button" onClick={openCreate} className="cms-save-btn">➕ Add Offer</button>
          )}
        </div>
      </div>

      <div className="cms-content">
        {formOpen && (
          <SectionCard icon="🏷️" title={editId ? "Edit Offer" : "New Offer"}>
            <Input label="Heading" limit={12} value={heading} onChange={e=>setHeading(e.target.value)} required placeholder="Summer Sale — 20% Off" />
            <Textarea label="Subtext" limit={40} rows={3} value={subtext} onChange={e=>setSubtext(e.target.value)} placeholder="A short supporting line for the offer…" />
            <Input label="Slug" value={slug} onChange={e=>setSlug(e.target.value)} placeholder="summer-sale" hint="Optional — auto from heading if left blank" />
            <Divider label="Banner Image" />
            <ImagePicker value={banner} onChange={setBanner} fieldName="banner"  uploadEndpoint="api/upload/image"/>
            <Divider />
            <Toggle label="Published" description="Visible on the public site" checked={isPublished} onChange={setIsPublished} />
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <button type="button" onClick={handleSave} disabled={saving} className="cms-save-btn">
                {saving ? "Saving…" : (editId ? "Update Offer" : "Create Offer")}
              </button>
              <button type="button" onClick={closeForm} disabled={saving} className="cms-add-btn" style={{width:"auto"}}>Cancel</button>
            </div>
          </SectionCard>
        )}

        {offers.length === 0 ? (
          <div className="cms-error-state">
            <span style={{fontSize:36}}>📭</span>
            <p style={{color:"var(--cms-muted)",fontWeight:600,fontSize:14}}>No offers yet.</p>
            {!formOpen && <button onClick={openCreate} style={{padding:"8px 20px",background:"var(--cms-accent)",color:"#fff",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer"}}>➕ Add your first offer</button>}
          </div>
        ) : (
          offers.map((o) => {
            const id  = o?._id || o?.id;
            const img = o?.banner?.src || o?.banner?.url || "";
            const published = o?.isPublished !== false;
            return (
              <div key={id || o?.Heading} className="cms-member-card" style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:88,height:60,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#f1f5f9",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {img
                    ? <img src={img} alt={o?.banner?.alt||o?.Heading||"banner"} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
                    : <span style={{fontSize:20}}>🏷️</span>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontWeight:700,fontSize:14,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o?.Heading || "Untitled offer"}</p>
                  {o?.slug && <p style={{fontSize:11,color:"#94a3b8",marginTop:2}}>/{o.slug}</p>}
                </div>
                <span className={`cms-vis-badge ${published?"on":"off"}`} style={{pointerEvents:"none"}}>{published ? "Live" : "Hidden"}</span>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  <button type="button" className="cms-add-btn" style={{width:"auto",padding:"6px 14px"}} onClick={()=>openEdit(o)}>✏️ Edit</button>
                  <button type="button" className="cms-remove-btn" onClick={()=>handleDelete(o)}>🗑️ Delete</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}