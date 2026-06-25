'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { SectionCard, Divider, Input } from "../../components/CommonUI/UI.jsx";
import { getRedirects, createRedirect, updateRedirect, deleteRedirect } from "../../service/api";

const blankForm = () => ({ oldSlug: "", newSlug: "", pageType: "" });

export default function RedirectsAdmin() {
  const [redirects, setRedirects] = useState([]);
  const [form, setForm]           = useState(blankForm());

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);
  const [adding,  setAdding]  = useState(false);
  const [busyId,  setBusyId]  = useState(null);

  const [editId, setEditId]     = useState(null);
  const [editForm, setEditForm] = useState(blankForm());

  const inFlight = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr(null);
    try {
      const res = await getRedirects();
      const list = res.data?.data;
      setRedirects(Array.isArray(list) ? list : []);
    } catch (err) {
      const msg = err.userMessage || "Failed to load redirects.";
      setLoadErr(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (inFlight.current || adding) return;
    const oldSlug = form.oldSlug.trim();
    const newSlug = form.newSlug.trim();
    const pageType = form.pageType.trim();
    if (!oldSlug || !newSlug) { toast.error("Old Slug and New Slug are required."); return; }

    inFlight.current = true; setAdding(true);
    try {
      const res = await createRedirect({ oldSlug, newSlug, pageType });
      if (res.data?.success === false) { toast.error(res.data?.message || "Failed to add redirect."); return; }
      toast.success("✅ Redirect added!", { autoClose: 3000 });
      setForm(blankForm());
      await load();
    } catch (err) {
      toast.error(err.userMessage || "Failed to add redirect.");
    } finally {
      setAdding(false); inFlight.current = false;
    }
  };

  const startEdit = (r) => {
    setEditId(r.id);
    setEditForm({ oldSlug: r.oldSlug || "", newSlug: r.newSlug || "", pageType: r.pageType || "" });
  };
  const cancelEdit = () => { setEditId(null); setEditForm(blankForm()); };

  const handleSaveEdit = async (id) => {
    if (busyId) return;
    const oldSlug = editForm.oldSlug.trim();
    const newSlug = editForm.newSlug.trim();
    const pageType = editForm.pageType.trim();
    if (!oldSlug || !newSlug) { toast.error("Old Slug and New Slug are required."); return; }

    setBusyId(id);
    try {
      const res = await updateRedirect(id, { oldSlug, newSlug, pageType });
      if (res.data?.success === false) { toast.error(res.data?.message || "Failed to update redirect."); return; }
      toast.success("✅ Redirect updated!", { autoClose: 3000 });
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(err.userMessage || "Failed to update redirect.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (busyId) return;
    if (!window.confirm("Delete this redirect? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await deleteRedirect(id);
      toast.success("🗑️ Redirect deleted.", { autoClose: 3000 });
      if (editId === id) cancelEdit();
      await load();
    } catch (err) {
      toast.error(err.userMessage || "Failed to delete redirect.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="cms-root"><div className="cms-loading"><div className="cms-spinner"/><p style={{color:"var(--cms-muted)",fontSize:13}}>Loading redirects…</p></div></div>;
  if (loadErr)  return <div className="cms-root"><div className="cms-error-state"><span style={{fontSize:36}}>⚠️</span><p style={{color:"#ef4444",fontWeight:600,fontSize:14}}>{loadErr}</p><button onClick={load} style={{padding:"8px 20px",background:"var(--cms-accent)",color:"#fff",borderRadius:10,border:"none",fontWeight:700,cursor:"pointer"}}>Retry</button></div></div>;

  return (
    <div className="cms-root">
      <div className="cms-page-header">
        <div><p className="cms-page-title">Redirects</p><p className="cms-page-sub">Manage URL redirects · old path → new path</p></div>
      </div>

      <div className="cms-content">
        <div className="cms-info-banner">
          <svg style={{width:16,height:16,flexShrink:0}} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Create 301-style redirects from an <strong>old slug</strong> to a <strong>new slug</strong>. Page Type is an optional free-text label.</span>
        </div>

        <SectionCard icon="↪️" title="Add Redirect">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Old Slug" required value={form.oldSlug} placeholder="/old-page"
              onChange={e=>setForm(f=>({...f, oldSlug:e.target.value}))} />
            <Input label="New Slug" required value={form.newSlug} placeholder="/new-page"
              onChange={e=>setForm(f=>({...f, newSlug:e.target.value}))} />
            <Input label="Page Type" value={form.pageType} placeholder="blog, package… (optional)"
              onChange={e=>setForm(f=>({...f, pageType:e.target.value}))} />
          </div>
          <Divider />
          <button type="button" className="cms-add-btn" disabled={adding} onClick={handleAdd}>
            {adding ? "Adding…" : "+ Add Redirect"}
          </button>
        </SectionCard>

        <SectionCard icon="📋" title="Existing Redirects" badge={`${redirects.length}`}>
          {redirects.length === 0 ? (
            <div style={{padding:"32px 12px",textAlign:"center",color:"var(--cms-muted)"}}>
              <span style={{fontSize:32,display:"block",marginBottom:8}}>🗂️</span>
              <p style={{fontSize:13,fontWeight:600}}>No redirects yet.</p>
              <p style={{fontSize:12}}>Add one above to get started.</p>
            </div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{textAlign:"left",color:"var(--cms-muted)",borderBottom:"1px solid #e2e8f0"}}>
                    <th style={{padding:"8px 10px",fontWeight:700}}>Old → New</th>
                    <th style={{padding:"8px 10px",fontWeight:700}}>Page Type</th>
                    <th style={{padding:"8px 10px",fontWeight:700,textAlign:"right"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {redirects.map(r => {
                    const isEditing = editId === r.id;
                    const rowBusy = busyId === r.id;
                    return (
                      <tr key={r.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        {isEditing ? (
                          <>
                            <td style={{padding:"8px 10px"}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                <input className="cms-input" style={{minWidth:120}} value={editForm.oldSlug}
                                  placeholder="/old" onChange={e=>setEditForm(f=>({...f, oldSlug:e.target.value}))} />
                                <span style={{color:"var(--cms-muted)"}}>→</span>
                                <input className="cms-input" style={{minWidth:120}} value={editForm.newSlug}
                                  placeholder="/new" onChange={e=>setEditForm(f=>({...f, newSlug:e.target.value}))} />
                              </div>
                            </td>
                            <td style={{padding:"8px 10px"}}>
                              <input className="cms-input" style={{minWidth:100}} value={editForm.pageType}
                                placeholder="optional" onChange={e=>setEditForm(f=>({...f, pageType:e.target.value}))} />
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right",whiteSpace:"nowrap"}}>
                              <button type="button" className="cms-add-btn" style={{display:"inline-flex",marginRight:6}}
                                disabled={rowBusy} onClick={()=>handleSaveEdit(r.id)}>
                                {rowBusy ? "Saving…" : "Save"}
                              </button>
                              <button type="button" className="cms-remove-btn" disabled={rowBusy} onClick={cancelEdit}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{padding:"8px 10px"}}>
                              <code style={{color:"#0f172a"}}>{r.oldSlug}</code>
                              <span style={{color:"var(--cms-muted)",margin:"0 6px"}}>→</span>
                              <code style={{color:"var(--cms-accent)"}}>{r.newSlug}</code>
                            </td>
                            <td style={{padding:"8px 10px"}}>
                              {r.pageType ? <span className="cms-badge">{r.pageType}</span> : <span style={{color:"var(--cms-muted)"}}>—</span>}
                            </td>
                            <td style={{padding:"8px 10px",textAlign:"right",whiteSpace:"nowrap"}}>
                              <button type="button" className="cms-add-btn" style={{display:"inline-flex",marginRight:6}}
                                disabled={rowBusy} onClick={()=>startEdit(r)}>Edit</button>
                              <button type="button" className="cms-remove-btn" disabled={rowBusy} onClick={()=>handleDelete(r.id)}>
                                {rowBusy ? "…" : "Delete"}
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}