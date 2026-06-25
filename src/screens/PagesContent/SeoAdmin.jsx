'use client';


// import { useState, useEffect, useCallback } from "react";
// import { toast } from "react-toastify";
// import axios from "axios";
// import { VITE_BACKEND_URL } from "../../../config";

// const API = VITE_BACKEND_URL.replace(/\/$/, "");
// // Public base URL (for sitemap/robots links in browser)
// const PUBLIC_BASE = API.replace("/api", "");

// const scoreColor = (s) =>
//   s >= 80 ? { bg:"bg-emerald-50", border:"border-emerald-200", text:"text-emerald-700", bar:"bg-emerald-500" }
//   : s >= 50 ? { bg:"bg-amber-50",   border:"border-amber-200",   text:"text-amber-700",   bar:"bg-amber-500"   }
//   :           { bg:"bg-red-50",     border:"border-red-200",     text:"text-red-700",     bar:"bg-red-500"     };

// const GROUPS = ["Pages", "Category", "Blogs", "Credit Cards", "Insurance", "Investments"];

// const blankSeo = () => ({
//   metaTitle:       "",
//   metaDescription: "",
//   metaKeywords:    [],
//   canonicalUrl:    "",
//   index:           true,
//   follow:          true,
//   h1:              "",
//   jsonSchema:      {},
//   image:           { mode: "url", src: "", alt: "", title: "" },
// });

// // ── JSON-LD Template helpers ────────────────────────────
// const JSON_LD_TEMPLATES = {
//   WebPage: {
//     "@context": "https://schema.org",
//     "@type": "WebPage",
//     "name": "",
//     "description": "",
//     "url": ""
//   },
//   FAQPage: {
//     "@context": "https://schema.org",
//     "@type": "FAQPage",
//     "mainEntity": [
//       {
//         "@type": "Question",
//         "name": "Question 1?",
//         "acceptedAnswer": { "@type": "Answer", "text": "Answer 1" }
//       }
//     ]
//   },
//   Article: {
//     "@context": "https://schema.org",
//     "@type": "Article",
//     "headline": "",
//     "author": { "@type": "Person", "name": "" },
//     "datePublished": "",
//     "description": ""
//   },
//   BreadcrumbList: {
//     "@context": "https://schema.org",
//     "@type": "BreadcrumbList",
//     "itemListElement": [
//       { "@type": "ListItem", "position": 1, "name": "Home", "item": "/" }
//     ]
//   },
//   Organization: {
//     "@context": "https://schema.org",
//     "@type": "Organization",
//     "name": "",
//     "url": "",
//     "logo": "",
//     "sameAs": []
//   }
// };

// export default function SeoAdmin() {
//   const [pages,      setPages]      = useState([]);
//   const [loading,    setLoading]    = useState(true);
//   const [search,     setSearch]     = useState("");
//   const [group,      setGroup]      = useState("All");
//   const [editing,    setEditing]    = useState(null);
//   const [saving,     setSaving]     = useState(false);
//   const [kwInput,    setKwInput]    = useState("");
//   const [imgFile,    setImgFile]    = useState(null);
//   const [imgPreview, setImgPreview] = useState(null);
//   const [jsonText,   setJsonText]   = useState("{}");
//   const [jsonError,  setJsonError]  = useState("");

//   const load = useCallback(async () => {
//     setLoading(true);
//     try {
//       const r = await axios.get(`${API}/seo/all`);
//       setPages(r.data.data || []);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to load SEO data");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { load(); }, [load]);

//   const filtered = pages.filter(p => {
//     const mg = group === "All" || p.group === group;
//     const ms = !search || p.label.toLowerCase().includes(search.toLowerCase());
//     return mg && ms;
//   });

//   const openEditor = (p) => {
//     const seo = { ...blankSeo(), ...p.seo };
//     setEditing({ ...p, seo });
//     setKwInput("");
//     setImgFile(null);
//     setImgPreview(seo.image?.src || null);
//     try {
//       setJsonText(
//         seo.jsonSchema && Object.keys(seo.jsonSchema).length
//           ? JSON.stringify(seo.jsonSchema, null, 2)
//           : "{}"
//       );
//     } catch {
//       setJsonText("{}");
//     }
//     setJsonError("");
//   };

//   const setSeo = (k, v) => setEditing(e => ({ ...e, seo: { ...e.seo, [k]: v } }));

//   const handleJsonChange = (text) => {
//     setJsonText(text);
//     try {
//       const parsed = JSON.parse(text);
//       setSeo("jsonSchema", parsed);
//       setJsonError("");
//     } catch {
//       setJsonError("Invalid JSON — please fix before saving");
//     }
//   };

//   const applyTemplate = (templateName) => {
//     const tpl = JSON_LD_TEMPLATES[templateName];
//     if (!tpl) return;
//     const text = JSON.stringify(tpl, null, 2);
//     setJsonText(text);
//     setSeo("jsonSchema", tpl);
//     setJsonError("");
//   };

//   const handleImgFile = (file) => {
//     if (!file) return;
//     setImgFile(file);
//     setImgPreview(URL.createObjectURL(file));
//     setSeo("image", { ...editing.seo.image, mode: "upload", src: "" });
//   };

//   const handleImgUrl = (url) => {
//     setImgFile(null);
//     setSeo("image", { ...editing.seo.image, mode: "url", src: url });
//     setImgPreview(url || null);
//   };

//   const handleSave = async () => {
//     if (!editing) return;
//     if (jsonError) { toast.error("JSON-LD has an error — please fix it first"); return; }
//     setSaving(true);
//     try {
//       const fd = new FormData();
//       const seoData = { ...editing.seo };

//       if (imgFile instanceof File) {
//         seoData.image = { mode: "upload", src: "", alt: seoData.metaTitle || "", title: "" };
//         fd.append("seoImage", imgFile);
//       }

//       fd.append("data", JSON.stringify({ seo: seoData }));

//       const r = await axios.put(
//         `${API}/seo?page=${encodeURIComponent(editing.page)}`,
//         fd,
//         { headers: { "Content-Type": "multipart/form-data" } }
//       );

//       toast.success("✅ SEO saved!");
//       setPages(prev => prev.map(p =>
//         p.page === editing.page
//           ? { ...p, seo: r.data.seo, score: r.data.score }
//           : p
//       ));
//       setEditing(null);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Save failed");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const addKeyword = () => {
//     const kw = kwInput.trim();
//     if (!kw || editing.seo.metaKeywords.includes(kw)) return;
//     setSeo("metaKeywords", [...editing.seo.metaKeywords, kw]);
//     setKwInput("");
//   };

//   const tl = editing?.seo?.metaTitle?.length        || 0;
//   const dl = editing?.seo?.metaDescription?.length  || 0;

//   const liveScore = editing ? (() => {
//     const s = editing.seo;
//     let score = 0;
//     if (s.metaTitle?.trim())       score += 25;
//     if (s.metaDescription?.trim()) score += 25;
//     if (s.metaKeywords?.length)    score += 20;
//     if (s.canonicalUrl?.trim())    score += 15;
//     if (s.image?.src?.trim())      score += 15;
//     return score;
//   })() : 0;

//   return (
//     <div className="min-h-screen bg-gray-50">

//       {/* ── Header ── */}
//       <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4">
//         <div className="flex items-center justify-between mb-4">
//           <div>
//             <h1 className="text-lg font-bold text-gray-900">🔍 SEO Handling</h1>
//             <p className="text-xs text-gray-400">
//               {pages.length} pages · {pages.filter(p => p.score >= 80).length} fully optimized
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <a href={`${API}/seo/sitemap.xml`} target="_blank" rel="noreferrer"
//               className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
//               🗺️ Sitemap
//             </a>
//             <a href={`${API}/seo/robots.txt`} target="_blank" rel="noreferrer"
//               className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
//               🤖 Robots
//             </a>
//             <button onClick={load}
//               className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
//               ↻ Refresh
//             </button>
//           </div>
//         </div>


//         {/* Filters */}
//         <div className="flex flex-wrap items-center gap-3">
//           <input type="text" placeholder="Search pages..." value={search}
//             onChange={e => setSearch(e.target.value)}
//             className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-52 focus:outline-none focus:border-blue-400" />
//           <div className="flex gap-1.5 flex-wrap">
//             {["All", ...GROUPS].map(g => (
//               <button key={g} onClick={() => setGroup(g)}
//                 className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
//                   group === g
//                     ? "bg-blue-600 text-white border-blue-600"
//                     : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
//                 }`}>{g}</button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* ── Grid ── */}
//       <div className="p-6">
//         {loading ? (
//           <div className="text-center py-20">
//             <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"/>
//             <p className="text-sm text-gray-400">Loading all pages...</p>
//           </div>
//         ) : filtered.length === 0 ? (
//           <div className="text-center py-20 text-gray-400 text-sm">No pages found</div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
//             {filtered.map(p => {
//               const c = scoreColor(p.score);
//               return (
//                 <div key={p.page} onClick={() => openEditor(p)}
//                   className={`${c.bg} ${c.border} border-2 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all group`}>
//                   <div className="flex items-start justify-between mb-2">
//                     <div className="flex-1 min-w-0">
//                       <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{p.group}</p>
//                       <p className="text-sm font-bold text-gray-900 truncate">{p.label}</p>
//                       {p.status && (
//                         <span className={`text-xs font-semibold ${p.status === "published" || p.status === "active" ? "text-emerald-600" : "text-gray-400"}`}>
//                           ● {p.status}
//                         </span>
//                       )}
//                     </div>
//                     <span className={`${c.text} text-sm font-black ml-2`}>{p.score}%</span>
//                   </div>
//                   <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden mb-3">
//                     <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${p.score}%` }}/>
//                   </div>
//                   <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
//                     {[
//                       ["Title",    !!p.seo?.metaTitle],
//                       ["Desc",     !!p.seo?.metaDescription],
//                       ["Keywords", !!p.seo?.metaKeywords?.length],
//                       ["Image",    !!p.seo?.image?.src],
//                     ].map(([l, d]) => (
//                       <div key={l} className={`flex items-center gap-1 text-xs ${d ? "text-gray-600" : "text-gray-300"}`}>
//                         <span>{d ? "✓" : "○"}</span><span>{l}</span>
//                       </div>
//                     ))}
//                   </div>
//                   <p className="mt-2 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
//                     Click to edit →
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {/* ── Editor Modal ── */}
//       {editing && (
//         <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-6 px-4">
//           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">

//             {/* Modal Header */}
//             <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
//               <div>
//                 <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">{editing.group}</p>
//                 <h2 className="text-base font-bold text-gray-900 mt-0.5">{editing.label}</h2>
//                 <p className="text-xs font-mono text-gray-400 mt-0.5">/{editing.page}</p>
//               </div>
//               <button onClick={() => setEditing(null)}
//                 className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg transition-colors">✕</button>
//             </div>

//             <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">

//               {/* Meta Title */}
//               <div>
//                 <div className="flex justify-between mb-1.5">
//                   <label className="text-xs font-bold text-gray-700">Meta Title *</label>
//                   <span className={`text-xs font-bold ${tl > 60 ? "text-red-500" : tl > 40 ? "text-emerald-600" : "text-gray-400"}`}>{tl}/60</span>
//                 </div>
//                 <input type="text" value={editing.seo.metaTitle}
//                   onChange={e => setSeo("metaTitle", e.target.value)}
//                   placeholder="Page title for Google — 50-60 chars"
//                   className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"/>
//                 <p className="text-xs text-gray-400 mt-1">Shown in Google search results. Ideal: 50-60 chars.</p>
//               </div>

//               {/* Meta Description */}
//               <div>
//                 <div className="flex justify-between mb-1.5">
//                   <label className="text-xs font-bold text-gray-700">Meta Description *</label>
//                   <span className={`text-xs font-bold ${dl > 160 ? "text-red-500" : dl > 100 ? "text-emerald-600" : "text-gray-400"}`}>{dl}/160</span>
//                 </div>
//                 <textarea rows={3} value={editing.seo.metaDescription}
//                   onChange={e => setSeo("metaDescription", e.target.value)}
//                   placeholder="Description shown in search results — 120-160 chars"
//                   className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none transition-colors"/>
//               </div>

//               {/* H1 */}
//               <div>
//                 <label className="block text-xs font-bold text-gray-700 mb-1.5">
//                   H1 Tag <span className="text-gray-400 font-normal">(manual override)</span>
//                 </label>
//                 <input type="text" value={editing.seo.h1 || ""}
//                   onChange={e => setSeo("h1", e.target.value)}
//                   placeholder="Main page heading — use if different from title"
//                   className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"/>
//               </div>

//               {/* Keywords */}
//               <div>
//                 <label className="block text-xs font-bold text-gray-700 mb-1.5">Keywords</label>
//                 <div className="flex gap-2 mb-2">
//                   <input type="text" value={kwInput}
//                     onChange={e => setKwInput(e.target.value)}
//                     onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword())}
//                     placeholder="Type keyword then press Enter or Add"
//                     className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/>
//                   <button onClick={addKeyword}
//                     className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">Add</button>
//                 </div>
//                 <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
//                   {(editing.seo.metaKeywords || []).map(kw => (
//                     <span key={kw} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
//                       {kw}
//                       <button onClick={() => setSeo("metaKeywords", editing.seo.metaKeywords.filter(k => k !== kw))}
//                         className="hover:text-red-500 transition-colors font-bold">✕</button>
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               {/* Canonical */}
//               <div>
//                 <label className="block text-xs font-bold text-gray-700 mb-1.5">Canonical URL</label>
//                 <input type="url" value={editing.seo.canonicalUrl}
//                   onChange={e => setSeo("canonicalUrl", e.target.value)}
//                   placeholder="https://www.TravelBudgetly.com/page"
//                   className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 font-mono transition-colors"/>
//                 <p className="text-xs text-gray-400 mt-1">Used to prevent duplicate content. Can be left blank.</p>
//               </div>

//               {/* OG Image */}
//               <div>
//                 <label className="block text-xs font-bold text-gray-700 mb-2">
//                   OG / Share Image
//                   <span className="text-gray-400 font-normal ml-1">(shown on WhatsApp/Twitter share)</span>
//                 </label>

//                 {imgPreview && (
//                   <div className="mb-3 relative">
//                     <img src={imgPreview} alt="OG preview"
//                       className="w-full h-36 object-cover rounded-xl border border-gray-200 bg-gray-50"/>
//                     <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
//                       {imgFile ? "New upload" : "Current"}
//                     </span>
//                     <button onClick={() => {
//                         setImgFile(null);
//                         setImgPreview(null);
//                         setSeo("image", { mode: "url", src: "", alt: "", title: "" });
//                       }}
//                       className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full hover:bg-red-600">
//                       Remove
//                     </button>
//                   </div>
//                 )}

//                 <div className="flex gap-3 mb-2">
//                   <input type="text"
//                     value={imgFile ? "(file selected)" : (editing.seo.image?.src || "")}
//                     onChange={e => { setImgFile(null); handleImgUrl(e.target.value); }}
//                     placeholder="https://... image URL"
//                     disabled={!!imgFile}
//                     className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"/>
//                   <label className="px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors whitespace-nowrap">
//                     📁 Upload
//                     <input type="file" accept="image/*" className="hidden"
//                       onChange={e => handleImgFile(e.target.files[0])}/>
//                   </label>
//                 </div>
//                 <p className="text-xs text-gray-400">Recommended: 1200×630px. URL or file upload — both work.</p>
//               </div>

//               {/* JSON-LD Structured Data */}
//               <div>
//                 <div className="flex items-center justify-between mb-2">
//                   <label className="text-xs font-bold text-gray-700">
//                     JSON-LD Structured Data
//                     <span className="text-gray-400 font-normal ml-1">(schema.org)</span>
//                   </label>
//                   <div className="flex gap-1 flex-wrap justify-end">
//                     {Object.keys(JSON_LD_TEMPLATES).map(tpl => (
//                       <button key={tpl} type="button"
//                         onClick={() => applyTemplate(tpl)}
//                         className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors">
//                         {tpl}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <textarea rows={6}
//                   value={jsonText}
//                   onChange={e => handleJsonChange(e.target.value)}
//                   placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page Name"\n}'}
//                   className={`w-full border rounded-xl px-4 py-3 text-xs font-mono focus:outline-none resize-none transition-colors ${
//                     jsonError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-400"
//                   }`}/>

//                 {jsonError ? (
//                   <p className="text-xs text-red-500 font-semibold mt-1">⚠️ {jsonError}</p>
//                 ) : (
//                   <p className="text-xs text-gray-400 mt-1">
//                     Click a template button or write JSON manually. Must be valid JSON.
//                   </p>
//                 )}
//               </div>

//               {/* Index / Follow */}
//               <div className="flex gap-6">
//                 {[["index", "Index (show in Google)"], ["follow", "Follow (crawl links)"]].map(([k, label]) => (
//                   <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
//                     <div onClick={() => setSeo(k, !editing.seo[k])}
//                       className={`relative w-10 h-5 rounded-full transition-colors ${editing.seo[k] ? "bg-blue-500" : "bg-gray-200"}`}>
//                       <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editing.seo[k] ? "translate-x-5" : "translate-x-0.5"}`}/>
//                     </div>
//                     <span className="text-sm text-gray-700 font-medium">{label}</span>
//                   </label>
//                 ))}
//               </div>

//               {/* Google Preview */}
//               <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
//                 <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Google Preview</p>
//                 <p className="text-xs text-green-700 font-mono truncate mb-0.5">
//                   {editing.seo.canonicalUrl || `${PUBLIC_BASE}/${editing.page}`}
//                 </p>
//                 <p className="text-base text-blue-700 font-medium leading-tight hover:underline cursor-pointer truncate">
//                   {editing.seo.metaTitle || editing.label || "Meta Title"}
//                 </p>
//                 <p className="text-sm text-gray-600 leading-snug line-clamp-2 mt-0.5">
//                   {editing.seo.metaDescription || "Meta description here..."}
//                 </p>
//               </div>

//             </div>

//             {/* Modal Footer */}
//             <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
//               <div className="flex items-center gap-2">
//                 <span className={`text-xs font-bold ${scoreColor(liveScore).text}`}>{liveScore}% complete</span>
//                 <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
//                   <div className={`h-full ${scoreColor(liveScore).bar} rounded-full transition-all`} style={{ width: `${liveScore}%` }}/>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3">
//                 <button onClick={() => setEditing(null)}
//                   className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors">
//                   Cancel
//                 </button>
//                 <button onClick={handleSave} disabled={saving || !!jsonError}
//                   className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
//                   {saving
//                     ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</>
//                     : "💾 Save SEO"}
//                 </button>
//               </div>
//             </div>

//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const API = VITE_BACKEND_URL.replace(/\/$/, "");
// Public base URL (for sitemap/robots links in browser)
const PUBLIC_BASE = API.replace("/api", "");

const scoreColor = (s) =>
  s >= 80 ? { bg:"bg-emerald-50", border:"border-emerald-200", text:"text-emerald-700", bar:"bg-emerald-500" }
  : s >= 50 ? { bg:"bg-amber-50",   border:"border-amber-200",   text:"text-amber-700",   bar:"bg-amber-500"   }
  :           { bg:"bg-red-50",     border:"border-red-200",     text:"text-red-700",     bar:"bg-red-500"     };

const GROUPS = ["Pages", "Blogs"];

const blankSeo = () => ({
  metaTitle:       "",
  metaDescription: "",
  metaKeywords:    [],
  canonicalUrl:    "",
  index:           true,
  follow:          true,
  h1:              "",
  jsonSchema:      {},
  image:           { mode: "url", src: "", alt: "", title: "" },
});

// ── JSON-LD Template helpers ────────────────────────────
const JSON_LD_TEMPLATES = {
  WebPage: {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "",
    "description": "",
    "url": ""
  },
  FAQPage: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Question 1?",
        "acceptedAnswer": { "@type": "Answer", "text": "Answer 1" }
      }
    ]
  },
  Article: {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "",
    "author": { "@type": "Person", "name": "" },
    "datePublished": "",
    "description": ""
  },
  BreadcrumbList: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "/" }
    ]
  },
  Organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "",
    "url": "",
    "logo": "",
    "sameAs": []
  }
};

export default function SeoAdmin() {
  const [pages,      setPages]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [group,      setGroup]      = useState("All");
  const [editing,    setEditing]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [kwInput,    setKwInput]    = useState("");
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [jsonText,   setJsonText]   = useState("{}");
  const [jsonError,  setJsonError]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/seo/all`);
      setPages(r.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load SEO data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = pages.filter(p => {
    const mg = group === "All" || p.group === group;
    const ms = !search || p.label.toLowerCase().includes(search.toLowerCase());
    return mg && ms;
  });

  const openEditor = (p) => {
    const seo = { ...blankSeo(), ...p.seo };
    setEditing({ ...p, seo });
    setKwInput("");
    setImgFile(null);
    setImgPreview(seo.image?.src || null);
    try {
      setJsonText(
        seo.jsonSchema && Object.keys(seo.jsonSchema).length
          ? JSON.stringify(seo.jsonSchema, null, 2)
          : "{}"
      );
    } catch {
      setJsonText("{}");
    }
    setJsonError("");
  };

  const setSeo = (k, v) => setEditing(e => ({ ...e, seo: { ...e.seo, [k]: v } }));

  const handleJsonChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setSeo("jsonSchema", parsed);
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON — please fix before saving");
    }
  };

  const applyTemplate = (templateName) => {
    const tpl = JSON_LD_TEMPLATES[templateName];
    if (!tpl) return;
    const text = JSON.stringify(tpl, null, 2);
    setJsonText(text);
    setSeo("jsonSchema", tpl);
    setJsonError("");
  };

  const handleImgFile = (file) => {
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    setSeo("image", { ...editing.seo.image, mode: "upload", src: "" });
  };

  const handleImgUrl = (url) => {
    setImgFile(null);
    setSeo("image", { ...editing.seo.image, mode: "url", src: url });
    setImgPreview(url || null);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (jsonError) { toast.error("JSON-LD has an error — please fix it first"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      const seoData = { ...editing.seo };

      if (imgFile instanceof File) {
        seoData.image = { mode: "upload", src: "", alt: seoData.metaTitle || "", title: "" };
        fd.append("seoImage", imgFile);
      }

      fd.append("data", JSON.stringify({ seo: seoData }));

      const r = await axios.put(
        `${API}/seo?page=${encodeURIComponent(editing.page)}`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("✅ SEO saved!");
      setPages(prev => prev.map(p =>
        p.page === editing.page
          ? { ...p, seo: r.data.seo, score: r.data.score }
          : p
      ));
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (!kw || editing.seo.metaKeywords.includes(kw)) return;
    setSeo("metaKeywords", [...editing.seo.metaKeywords, kw]);
    setKwInput("");
  };

  const tl = editing?.seo?.metaTitle?.length        || 0;
  const dl = editing?.seo?.metaDescription?.length  || 0;

  const liveScore = editing ? (() => {
    const s = editing.seo;
    let score = 0;
    if (s.metaTitle?.trim())       score += 25;
    if (s.metaDescription?.trim()) score += 25;
    if (s.metaKeywords?.length)    score += 20;
    if (s.canonicalUrl?.trim())    score += 15;
    if (s.image?.src?.trim())      score += 15;
    return score;
  })() : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-gray-900">🔍 SEO Handling</h1>
            <p className="text-xs text-gray-400">
              {pages.length} pages · {pages.filter(p => p.score >= 80).length} fully optimized
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href={`${API}/seo/sitemap.xml`} target="_blank" rel="noreferrer"
              className="text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
              🗺️ Sitemap
            </a>
            <a href={`${API}/seo/robots.txt`} target="_blank" rel="noreferrer"
              className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
              🤖 Robots
            </a>
            <button onClick={load}
              className="text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input type="text" placeholder="Search pages..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-52 focus:outline-none focus:border-blue-400" />
          <div className="flex gap-1.5 flex-wrap">
            {["All", ...GROUPS].map(g => (
              <button key={g} onClick={() => setGroup(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  group === g
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                }`}>{g}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"/>
            <p className="text-sm text-gray-400">Loading all pages...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No pages found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(p => {
              const c = scoreColor(p.score);
              return (
                <div key={p.page} onClick={() => openEditor(p)}
                  className={`${c.bg} ${c.border} border-2 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all group`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{p.group}</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{p.label}</p>
                      {p.status && (
                        <span className={`text-xs font-semibold ${p.status === "published" || p.status === "active" ? "text-emerald-600" : "text-gray-400"}`}>
                          ● {p.status}
                        </span>
                      )}
                    </div>
                    <span className={`${c.text} text-sm font-black ml-2`}>{p.score}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200/60 rounded-full overflow-hidden mb-3">
                    <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${p.score}%` }}/>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    {[
                      ["Title",    !!p.seo?.metaTitle],
                      ["Desc",     !!p.seo?.metaDescription],
                      ["Keywords", !!p.seo?.metaKeywords?.length],
                      ["Image",    !!p.seo?.image?.src],
                    ].map(([l, d]) => (
                      <div key={l} className={`flex items-center gap-1 text-xs ${d ? "text-gray-600" : "text-gray-300"}`}>
                        <span>{d ? "✓" : "○"}</span><span>{l}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to edit →
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Editor Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">{editing.group}</p>
                <h2 className="text-base font-bold text-gray-900 mt-0.5">{editing.label}</h2>
                <p className="text-xs font-mono text-gray-400 mt-0.5">/{editing.page}</p>
              </div>
              <button onClick={() => setEditing(null)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 text-lg transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">

              {/* Meta Title */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">Meta Title *</label>
                  <span className={`text-xs font-bold ${tl > 60 ? "text-red-500" : tl > 40 ? "text-emerald-600" : "text-gray-400"}`}>{tl}/60</span>
                </div>
                <input type="text" value={editing.seo.metaTitle}
                  onChange={e => setSeo("metaTitle", e.target.value)}
                  placeholder="Page title for Google — 50-60 chars"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"/>
                <p className="text-xs text-gray-400 mt-1">Shown in Google search results. Ideal: 50-60 chars.</p>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">Meta Description *</label>
                  <span className={`text-xs font-bold ${dl > 160 ? "text-red-500" : dl > 100 ? "text-emerald-600" : "text-gray-400"}`}>{dl}/160</span>
                </div>
                <textarea rows={3} value={editing.seo.metaDescription}
                  onChange={e => setSeo("metaDescription", e.target.value)}
                  placeholder="Description shown in search results — 120-160 chars"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 resize-none transition-colors"/>
              </div>

              {/* H1 */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  H1 Tag <span className="text-gray-400 font-normal">(manual override)</span>
                </label>
                <input type="text" value={editing.seo.h1 || ""}
                  onChange={e => setSeo("h1", e.target.value)}
                  placeholder="Main page heading — use if different from title"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"/>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Keywords</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    placeholder="Type keyword then press Enter or Add"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/>
                  <button onClick={addKeyword}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">Add</button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
                  {(editing.seo.metaKeywords || []).map(kw => (
                    <span key={kw} className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                      {kw}
                      <button onClick={() => setSeo("metaKeywords", editing.seo.metaKeywords.filter(k => k !== kw))}
                        className="hover:text-red-500 transition-colors font-bold">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Canonical */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Canonical URL</label>
                <input type="url" value={editing.seo.canonicalUrl}
                  onChange={e => setSeo("canonicalUrl", e.target.value)}
                  placeholder="https://www.TravelBudgetly.com/page"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 font-mono transition-colors"/>
                <p className="text-xs text-gray-400 mt-1">Used to prevent duplicate content. Can be left blank.</p>
              </div>

              {/* OG Image */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  OG / Share Image
                  <span className="text-gray-400 font-normal ml-1">(shown on WhatsApp/Twitter share)</span>
                </label>

                {imgPreview && (
                  <div className="mb-3 relative">
                    <img src={imgPreview} alt="OG preview"
                      className="w-full h-36 object-cover rounded-xl border border-gray-200 bg-gray-50"/>
                    <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      {imgFile ? "New upload" : "Current"}
                    </span>
                    <button onClick={() => {
                        setImgFile(null);
                        setImgPreview(null);
                        setSeo("image", { mode: "url", src: "", alt: "", title: "" });
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full hover:bg-red-600">
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex gap-3 mb-2">
                  <input type="text"
                    value={imgFile ? "(file selected)" : (editing.seo.image?.src || "")}
                    onChange={e => { setImgFile(null); handleImgUrl(e.target.value); }}
                    placeholder="https://... image URL"
                    disabled={!!imgFile}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"/>
                  <label className="px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors whitespace-nowrap">
                    📁 Upload
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => handleImgFile(e.target.files[0])}/>
                  </label>
                </div>
                <p className="text-xs text-gray-400">Recommended: 1200×630px. URL or file upload — both work.</p>
              </div>

              {/* JSON-LD Structured Data */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700">
                    JSON-LD Structured Data
                    <span className="text-gray-400 font-normal ml-1">(schema.org)</span>
                  </label>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {Object.keys(JSON_LD_TEMPLATES).map(tpl => (
                      <button key={tpl} type="button"
                        onClick={() => applyTemplate(tpl)}
                        className="px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors">
                        {tpl}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea rows={6}
                  value={jsonText}
                  onChange={e => handleJsonChange(e.target.value)}
                  placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Page Name"\n}'}
                  className={`w-full border rounded-xl px-4 py-3 text-xs font-mono focus:outline-none resize-none transition-colors ${
                    jsonError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-blue-400"
                  }`}/>

                {jsonError ? (
                  <p className="text-xs text-red-500 font-semibold mt-1">⚠️ {jsonError}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Click a template button or write JSON manually. Must be valid JSON.
                  </p>
                )}
              </div>

              {/* Index / Follow */}
              <div className="flex gap-6">
                {[["index", "Index (show in Google)"], ["follow", "Follow (crawl links)"]].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => setSeo(k, !editing.seo[k])}
                      className={`relative w-10 h-5 rounded-full transition-colors ${editing.seo[k] ? "bg-blue-500" : "bg-gray-200"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editing.seo[k] ? "translate-x-5" : "translate-x-0.5"}`}/>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{label}</span>
                  </label>
                ))}
              </div>

              {/* Google Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Google Preview</p>
                <p className="text-xs text-green-700 font-mono truncate mb-0.5">
                  {editing.seo.canonicalUrl || `${PUBLIC_BASE}/${editing.page}`}
                </p>
                <p className="text-base text-blue-700 font-medium leading-tight hover:underline cursor-pointer truncate">
                  {editing.seo.metaTitle || editing.label || "Meta Title"}
                </p>
                <p className="text-sm text-gray-600 leading-snug line-clamp-2 mt-0.5">
                  {editing.seo.metaDescription || "Meta description here..."}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${scoreColor(liveScore).text}`}>{liveScore}% complete</span>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full ${scoreColor(liveScore).bar} rounded-full transition-all`} style={{ width: `${liveScore}%` }}/>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditing(null)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !!jsonError}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</>
                    : "💾 Save SEO"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}