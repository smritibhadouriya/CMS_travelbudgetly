'use client';



import { useState } from "react";
import { toast } from "react-toastify";
import { saveSettings } from "../../service/api";
import { SectionCard, Input, Textarea } from "../../components/CommonUI/FormComponents";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api"; // ✅ same config jo api.js use karta hai

const blank = () => ({
  siteName:          "TravelBudgetly",
  siteUrl:           "https://www.TravelBudgetly.com",
  defaultMeta:       "",
  logoUrl:           "",
  faviconUrl:        "",
  _logoFile:         null,
  _faviconFile:      null,
  social:            { twitter: "", instagram: "", linkedin: "", youtube: "", facebook: "" },
  robotsExtra:       "",
  sitemapExtraUrls:  [],
  googleAnalyticsId:  "",
  googleTagManagerId: "",
});

export default function SettingsAdmin({ initialData = {} }) {
  // Initial settings come from the Server Component (service → Prisma), not
  // axios. Seed mirrors the old mount merge: { ...blank(), ...fetched }.
  const [data,         setData]         = useState({ ...blank(), ...(initialData || {}) });
  const [saving,       setSaving]       = useState(false);
  const [sitemapInput, setSitemapInput] = useState("");

  // ✅ FIX: config.js se aata hai, hardcoded nahi
  const BASE = VITE_BACKEND_URL.replace("/api", "");

  const set       = (key, val)         => setData(p => ({ ...p, [key]: val }));
  const setNested = (key, field, val)  => setData(p => ({ ...p, [key]: { ...p[key], [field]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();

      // Strip internal _file fields
      const clean = JSON.parse(JSON.stringify(data, (k, v) => k.startsWith("_") ? undefined : v));
      fd.append("data", JSON.stringify(clean));

      if (data._logoFile    instanceof File) fd.append("logoFile",    data._logoFile);
      if (data._faviconFile instanceof File) fd.append("faviconFile", data._faviconFile);

      await saveSettings(fd);
      toast.success("Settings saved!");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">⚙️ Settings</h1>
          <p className="text-xs text-gray-400">Logo, social, analytics, sitemap, robots</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving…</>
            : "💾 Save Settings"}
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">

        {/* ══ SITE INFO ══ */}
        <SectionCard title="🌐 Site Information">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Site Name" value={data.siteName}
              onChange={e => set("siteName", e.target.value)} placeholder="TravelBudgetly" />
            <Input label="Site URL" value={data.siteUrl}
              onChange={e => set("siteUrl", e.target.value)} placeholder="https://www.TravelBudgetly.com" />
          </div>
          <Textarea label="Default Meta Description" rows={2} value={data.defaultMeta}
            onChange={e => set("defaultMeta", e.target.value)}
            hint="Fallback when page has no meta description" />

          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* Logo */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Site Logo</label>
              {data.logoUrl && (
                <img src={data.logoUrl} alt="logo"
                  className="mb-2 h-10 object-contain border border-gray-100 rounded p-1 bg-white"/>
              )}
              <input type="file" accept="image/*"
                onChange={e => set("_logoFile", e.target.files[0])}
                className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
            </div>
            {/* Favicon */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Favicon</label>
              {data.faviconUrl && (
                <img src={data.faviconUrl} alt="favicon"
                  className="mb-2 h-8 object-contain border border-gray-100 rounded p-1 bg-white"/>
              )}
              <input type="file" accept="image/*"
                onChange={e => set("_faviconFile", e.target.files[0])}
                className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"/>
            </div>
          </div>
        </SectionCard>

        {/* ══ SOCIAL LINKS ══ */}
        <SectionCard title="📱 Social Media Links" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Twitter / X"  value={data.social?.twitter   || ""} onChange={e => setNested("social","twitter",  e.target.value)} placeholder="https://twitter.com/..." />
            <Input label="Instagram"    value={data.social?.instagram || ""} onChange={e => setNested("social","instagram",e.target.value)} placeholder="https://instagram.com/..." />
            <Input label="LinkedIn"     value={data.social?.linkedin  || ""} onChange={e => setNested("social","linkedin", e.target.value)} placeholder="https://linkedin.com/..." />
            <Input label="YouTube"      value={data.social?.youtube   || ""} onChange={e => setNested("social","youtube",  e.target.value)} placeholder="https://youtube.com/..." />
            <Input label="Facebook"     value={data.social?.facebook  || ""} onChange={e => setNested("social","facebook", e.target.value)} placeholder="https://facebook.com/..." />
          </div>
        </SectionCard>

        {/* ══ ANALYTICS ══ */}
        <SectionCard title="📊 Analytics" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Google Analytics ID"   value={data.googleAnalyticsId  || ""}
              onChange={e => set("googleAnalyticsId",  e.target.value)} placeholder="G-XXXXXXXXXX" />
            <Input label="Google Tag Manager ID" value={data.googleTagManagerId || ""}
              onChange={e => set("googleTagManagerId", e.target.value)} placeholder="GTM-XXXXXXX" />
          </div>
        </SectionCard>

        {/* ══ SITEMAP ══ */}
        <SectionCard title="🗺️ Sitemap.xml" defaultOpen={false}>
          <div className="flex gap-3 p-4 bg-blue-50 rounded-xl mb-4 border border-blue-100">
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-800 mb-1">Auto-generated sitemap</p>
              <p className="text-xs text-blue-600">Includes: all active products + published blogs + static pages</p>
              <a href={`${BASE}/sitemap.xml`} target="_blank" rel="noreferrer"
                className="inline-block mt-2 text-xs font-mono text-blue-700 underline hover:text-blue-900">
                {BASE}/sitemap.xml ↗
              </a>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Extra URLs (manually add):</p>
          <div className="flex gap-2 mb-3">
            <input type="text" value={sitemapInput}
              onChange={e => setSitemapInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && sitemapInput.trim()) {
                  set("sitemapExtraUrls", [...(data.sitemapExtraUrls || []), sitemapInput.trim()]);
                  setSitemapInput("");
                }
              }}
              placeholder="/your-custom-page or https://full-url.com"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"/>
            <button
              onClick={() => {
                if (!sitemapInput.trim()) return;
                set("sitemapExtraUrls", [...(data.sitemapExtraUrls || []), sitemapInput.trim()]);
                setSitemapInput("");
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700">
              Add
            </button>
          </div>
          {(data.sitemapExtraUrls || []).map((url, i) => (
            <div key={i} className="flex items-center gap-2 mb-1">
              <span className="flex-1 text-xs font-mono text-gray-600 bg-gray-50 border border-gray-100 rounded px-2 py-1.5 truncate">{url}</span>
              <button onClick={() => set("sitemapExtraUrls", data.sitemapExtraUrls.filter((_, j) => j !== i))}
                className="text-red-400 hover:text-red-600 text-sm font-bold w-6">✕</button>
            </div>
          ))}
        </SectionCard>

        {/* ══ ROBOTS.TXT ══ */}
        <SectionCard title="🤖 Robots.txt" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Textarea
                label="Extra Rules (appended to defaults)"
                rows={5}
                value={data.robotsExtra || ""}
                onChange={e => set("robotsExtra", e.target.value)}
                placeholder={"# Custom rules:\nDisallow: /private/\nCrawl-delay: 2"}
                hint="These lines are added after default rules"
              />
              <a href={`${BASE}/robots.txt`} target="_blank" rel="noreferrer"
                className="inline-block mt-2 text-xs font-mono text-blue-700 underline hover:text-blue-900">
                {BASE}/robots.txt ↗
              </a>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Live Preview</label>
              <pre className="bg-gray-900 text-green-400 text-xs font-mono p-4 rounded-xl h-full overflow-auto leading-relaxed">
{`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${data.siteUrl}/sitemap.xml${data.robotsExtra ? "\n\n" + data.robotsExtra : ""}`}
              </pre>
            </div>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}