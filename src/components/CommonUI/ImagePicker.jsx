


// admin/components/common/ImagePicker.jsx
// Unified image picker — no tab confusion, always shows preview
// Upload: blob preview immediately, real File stored for FormData
// Saved:  server URL shown directly in img tag
import { useRef, useState } from "react";
import { toast } from "react-toastify";

const MAX_MB    = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export const validateImg = (file) => {
  if (!file) return null;
  if (file.size > MAX_BYTES)
    return `Image must be under ${MAX_MB} MB (${(file.size/1024/1024).toFixed(1)} MB selected)`;
  if (!["image/jpeg","image/jpg","image/png","image/webp","image/heic","image/heif"].includes(file.type))
    return "Only JPG, PNG, WebP or HEIC allowed";
  return null;
};

/**
 * value shape:
 *   { url: string, file: File|null, _preview: string|null, alt: string, title: string }
 *
 *   url       = typed URL  OR  saved server URL (http://localhost:5000/uploads/...)
 *   file      = new File object — appended to FormData by parent
 *   _preview  = blob: URL — only for display, never sent anywhere
 *
 * Parent FormData usage:
 *   if (image.file) fd.append("heroImage", image.file);
 *   payload.hero.image = { url: image.file ? "" : image.url, alt, title }
 */
export default function ImagePicker({ label, value = {}, onChange, fieldName = "image" }) {
  const fileRef  = useRef(null);
  const [tab, setTab] = useState(() => value.url ? "url" : "upload");

  // Display src: blob preview for new upload, else saved/typed URL
  const displaySrc = value._preview || value.url || "";

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImg(file);
    if (err) { toast.error(err); e.target.value = ""; return; }

    // Revoke old blob to free memory
    if (value._preview?.startsWith("blob:")) URL.revokeObjectURL(value._preview);

    const preview = URL.createObjectURL(file);
    onChange({ ...value, url: "", file, _preview: preview });
    e.target.value = "";
  };

  const handleUrl = (e) => {
    // Clear any pending file when URL is typed
    if (value._preview?.startsWith("blob:")) URL.revokeObjectURL(value._preview);
    onChange({ ...value, url: e.target.value, file: null, _preview: null });
  };

  const handleClear = () => {
    if (value._preview?.startsWith("blob:")) URL.revokeObjectURL(value._preview);
    onChange({ url: "", file: null, _preview: null, alt: value.alt || "", title: value.title || "" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const switchTab = (t) => {
    setTab(t);
    if (t === "url" && value._preview?.startsWith("blob:")) {
      URL.revokeObjectURL(value._preview);
      onChange({ ...value, file: null, _preview: null });
    }
    if (t === "upload") {
      onChange({ ...value, url: "", file: null, _preview: null });
    }
  };

  return (
    <div className="cms-img-picker">
      {label && <p className="cms-field-label" style={{marginBottom:8}}>{label}</p>}

      <div className="cms-img-box">
        {/* ── Tabs ── */}
        <div className="cms-img-tabs">
          <button type="button" onClick={() => switchTab("url")}
            className={`cms-img-tab ${tab==="url" ? "active" : ""}`}>
            🔗 Image URL
          </button>
          <button type="button" onClick={() => switchTab("upload")}
            className={`cms-img-tab ${tab==="upload" ? "active" : ""}`}>
            📁 Upload File
          </button>
        </div>

        <div className="cms-img-body">
          {/* ── URL input ── */}
          {tab === "url" && (
            <input type="url" placeholder="https://example.com/image.jpg"
              value={value.url || ""}
              onChange={handleUrl}
              className="cms-input" />
          )}

          {/* ── File upload area ── */}
          {tab === "upload" && (
            <>
              <input
                ref={fileRef}
                type="file"
                name={fieldName}
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handleFile}
                style={{ display: "none" }}
              />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="cms-upload-drop">
                <span className="cms-upload-icon">
                  <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                  </svg>
                </span>
                <span style={{fontSize:13,fontWeight:600,color:"#475569"}}>Click to upload</span>
                <span style={{fontSize:11,color:"#94a3b8"}}>JPG · PNG · WebP · HEIC — max {MAX_MB} MB</span>
              </button>

              {/* File name badge */}
              {value.file && (
                <div style={{
                  display:"flex",alignItems:"center",gap:6,
                  background:"#f0fdf4",border:"1px solid #bbf7d0",
                  borderRadius:8,padding:"6px 10px",marginTop:4
                }}>
                  <span style={{fontSize:14}}>✅</span>
                  <span style={{fontSize:12,fontWeight:600,color:"#166534",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {value.file.name}
                  </span>
                  <span style={{fontSize:11,color:"#16a34a",marginLeft:"auto",flexShrink:0}}>
                    ({(value.file.size/1024/1024).toFixed(1)} MB)
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── Preview — always show if any src exists ── */}
          {displaySrc && (
            <div style={{position:"relative",marginTop:8,borderRadius:10,overflow:"hidden",border:"2px solid #e2e8f0"}}>
              <img
                src={displaySrc}
                alt={value.alt || "preview"}
                style={{width:"100%",height:160,objectFit:"cover",display:"block",background:"#f8fafc"}}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
                }}
              />
              {/* Error fallback */}
              <div style={{
                display:"none",width:"100%",height:160,alignItems:"center",justifyContent:"center",
                background:"#fef2f2",flexDirection:"column",gap:6
              }}>
                <span style={{fontSize:24}}>🖼️</span>
                <span style={{fontSize:11,color:"#ef4444",fontWeight:600}}>Image could not load</span>
                <span style={{fontSize:10,color:"#94a3b8",wordBreak:"break-all",maxWidth:"80%",textAlign:"center"}}>{displaySrc}</span>
              </div>
              {/* Clear button */}
              <button type="button" onClick={handleClear}
                style={{
                  position:"absolute",top:8,right:8,width:28,height:28,
                  background:"rgba(239,68,68,0.9)",color:"#fff",border:"none",
                  borderRadius:"50%",cursor:"pointer",fontSize:12,fontWeight:700,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  backdropFilter:"blur(4px)"
                }}>
                ✕
              </button>
            </div>
          )}

          {/* ── Alt + Title ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
            <input type="text" placeholder="Alt text (SEO)"
              value={value.alt || ""}
              onChange={e => onChange({...value, alt:e.target.value})}
              className="cms-input-sm" />
            <input type="text" placeholder="Title attribute"
              value={value.title || ""}
              onChange={e => onChange({...value, title:e.target.value})}
              className="cms-input-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}