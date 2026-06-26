'use client';



// src/components/ui/Sections.jsx
// Reusable CMS form sections used across About, Contact, etc.
// UPDATED: IconPointsSection now uses IconPicker instead of plain Input for iconName

import { useState } from "react";
import { Input, Textarea, HeadingSelect, Toggle, VisBadge, Divider } from "../ui/UI.jsx";
import ImagePicker from "./ImagePicker.jsx";
import LinkableTextarea from "../ui/Linkabletextarea.jsx";
import IconPicker from "../ui/IconPicker.jsx";

/* ════════════════════════════════════════════════
   HERO SECTION
════════════════════════════════════════════════ */
export function HeroSection({ data, onChange, imgFieldName = "heroImage" }) {
  const s = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div>
      <Toggle
        label="Show this section on site"
        description="Toggle visibility without deleting content"
        checked={data.isVisible !== false}
        onChange={v => s("isVisible", v)}
      />
      <Divider />
      <HeadingSelect value={data.headingLevel || "h1"} onChange={v => s("headingLevel", v)} />
      <Input
        label="Hero Title"
        limit={15}
        value={data.title || ""}
        onChange={e => s("title", e.target.value)}
        placeholder="We Are the Financial Friends Who Tell You the Truth"
        required
      />
      <Textarea
        label="Subtitle / Description"
        limit={50}
        value={data.subtitle || ""}
        onChange={e => s("subtitle", e.target.value)}
        placeholder="A short compelling line below the hero title..."
        rows={3}
      />
      <Divider label="Hero Image" />
      <ImagePicker
        value={data.image || {}}
        onChange={v => s("image", v)}
        fieldName={imgFieldName}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════
   CTA SECTION
════════════════════════════════════════════════ */
export function CTASection({ data, onChange }) {
  const s = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div>
      <Toggle
        label="Show this section on site"
        checked={data.isVisible !== false}
        onChange={v => s("isVisible", v)}
      />
      <Divider />
      <HeadingSelect value={data.headingTag || "h2"} onChange={v => s("headingTag", v)} />
      <Input label="Title" limit={15} value={data.title || ""}
        onChange={e => s("title", e.target.value)} placeholder="Ready to take control of your finances?" />
      <Textarea label="Subtitle" limit={40} value={data.subtitle || ""}
        onChange={e => s("subtitle", e.target.value)} rows={2}
        placeholder="One line that pushes the user to click..." />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Button Text" limit={5} value={data.buttonText || ""}
          onChange={e => s("buttonText", e.target.value)} placeholder="Get Started" />
        <Input label="Button Link" value={data.buttonLink || ""}
          onChange={e => s("buttonLink", e.target.value)} placeholder="/contact" />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ICON POINTS SECTION
   each point: { isVisible, iconName, title, description }
   iconName → stored as FA icon key e.g. "FaShieldAlt"
════════════════════════════════════════════════ */
export function IconPointsSection({ data, onChange, maxPoints = 8, titleLimit = 10, descLimit = 40 }) {
  const s   = (k, v) => onChange({ ...data, [k]: v });
  const upd = (i, k, v) => {
    const pts = [...(data.points || [])];
    pts[i] = { ...pts[i], [k]: v };
    s("points", pts);
  };
  const add    = () => s("points", [...(data.points||[]), { isVisible:true, iconName:"", title:"", description:"" }]);
  const remove = (i) => s("points", (data.points||[]).filter((_,j)=>j!==i));

  return (
    <div>
      <Toggle
        label="Show this section on site"
        checked={data.isVisible !== false}
        onChange={v => s("isVisible", v)}
      />
      <Divider />
      <HeadingSelect value={data.headingLevel || "h2"} onChange={v => s("headingLevel", v)} />
      <Input label="Section Title" limit={12} value={data.title || ""}
        onChange={e => s("title", e.target.value)} placeholder="e.g. Democratising Financial Intelligence" />
      <Textarea label="Sub Heading" limit={40} value={data.subHeading || ""}
        onChange={e => s("subHeading", e.target.value)} rows={2}
        placeholder="Optional short description below the title..." />

      <Divider label={`Points (${(data.points||[]).length}/${maxPoints})`} />

      {(data.points || []).map((p, i) => (
        <div key={i} className={`cms-point-item ${p.isVisible===false ? "hidden-item" : ""}`}>
          <div className="cms-point-header">
            <span className="cms-point-num">#{i + 1}</span>
            <div className="flex items-center gap-2">
              <VisBadge value={p.isVisible !== false} onChange={v => upd(i, "isVisible", v)} />
              <button type="button" onClick={() => remove(i)} className="cms-remove-btn">✕</button>
            </div>
          </div>

          {/* ── ICON PICKER (replaces plain Input) ── */}
          <div className="mb-3">
            <IconPicker
              label="Icon"
              value={p.iconName || ""}
              onChange={v => upd(i, "iconName", v)}
            />
          </div>

          {/* Title */}
          <Input placeholder="Title" limit={titleLimit} value={p.title || ""}
            onChange={e => upd(i, "title", e.target.value)} />

          {/* Description with inline link support */}
          <LinkableTextarea
            placeholder="Short description... (select text + Add Link for inline links)"
            rows={2}
            value={p.description || ""}
            onChange={v => upd(i, "description", v)}
          />
        </div>
      ))}

      <button type="button" onClick={add} disabled={(data.points||[]).length >= maxPoints} className="cms-add-btn">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
        Add Point ({(data.points||[]).length}/{maxPoints})
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   IMAGE + TEXT SECTION
════════════════════════════════════════════════ */
export function ImageTextSection({ data, onChange, imgFieldName = "sectionImage", paragraphLimit = 150 }) {
  const s = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div>
      <Toggle
        label="Show this section on site"
        checked={data.isVisible !== false}
        onChange={v => s("isVisible", v)}
      />
      <Divider />
      <HeadingSelect value={data.headingLevel || "h2"} onChange={v => s("headingLevel", v)} />
      <Input label="Section Title" limit={15} value={data.title || ""}
        onChange={e => s("title", e.target.value)} placeholder="Who We Are" />
      <Textarea label="Paragraph" limit={paragraphLimit} rows={5} value={data.paragraph || ""}
        onChange={e => s("paragraph", e.target.value)} placeholder="Tell your story here..." />
      <Divider label="Section Image" />
      <ImagePicker value={data.image || {}} onChange={v => s("image", v)} fieldName={imgFieldName} />
    </div>
  );
}

/* ════════════════════════════════════════════════
   SEO SECTION
════════════════════════════════════════════════ */
export function SeoSection({ data, onChange, siteUrl = "" }) {
  const s = (k, v) => onChange({ ...data, [k]: v });
  const [kwInput, setKwInput] = useState("");

  const addKeyword = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const kw = kwInput.trim().replace(/,$/, "");
      if (kw && !(data.metaKeywords || []).includes(kw)) {
        s("metaKeywords", [...(data.metaKeywords || []), kw]);
      }
      setKwInput("");
    }
  };
  const removeKw = (kw) => s("metaKeywords", (data.metaKeywords || []).filter(k => k !== kw));

  const previewTitle = data.metaTitle || "Page Title";
  const previewDesc  = data.metaDescription || "Meta description will appear here...";
  const previewUrl   = data.canonicalUrl || siteUrl || "https://www.TravelBudgetly.com/about";

  return (
    <div className="cms-seo-wrap">
      <p className="cms-seo-title">
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        SEO Settings
      </p>
      <div className="cms-seo-preview mb-5">
        <p className="cms-seo-preview-url">{previewUrl}</p>
        <p className="cms-seo-preview-title">{previewTitle}</p>
        <p className="cms-seo-preview-desc">{previewDesc}</p>
      </div>
      <Input label="Meta Title" limit={12} value={data.metaTitle || ""}
        onChange={e => s("metaTitle", e.target.value)}
        placeholder="About Us | TravelBudgetly"
        hint="Shown in browser tab and Google results" />
      <Textarea label="Meta Description" limit={30} rows={2} value={data.metaDescription || ""}
        onChange={e => s("metaDescription", e.target.value)}
        placeholder="One compelling sentence that explains this page..."
        hint="Shown under the title in Google search results" />
      <div className="cms-field">
        <label className="cms-field-label">Keywords</label>
        <input type="text" value={kwInput}
          onChange={e => setKwInput(e.target.value)}
          onKeyDown={addKeyword}
          placeholder="Type a keyword and press Enter..."
          className="cms-input mb-2"
        />
        {(data.metaKeywords || []).length > 0 && (
          <div className="cms-chips-wrap">
            {(data.metaKeywords || []).map(kw => (
              <span key={kw} className="cms-chip">
                {kw}
                <button type="button" onClick={() => removeKw(kw)} className="cms-chip-remove">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <Input label="Canonical URL" value={data.canonicalUrl || ""}
        onChange={e => s("canonicalUrl", e.target.value)}
        placeholder="https://www.TravelBudgetly.com/about"
        hint="Prevents duplicate content issues" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Toggle label="Index this page" description="Let Google crawl this page"
          checked={data.index !== false} onChange={v => s("index", v)} />
        <Toggle label="Follow links" description="Pass SEO value to linked pages"
          checked={data.follow !== false} onChange={v => s("follow", v)} />
      </div>
      <Divider label="OG / Social Image" />
      <ImagePicker label="Open Graph Image" value={data.image || {}} onChange={v => s("image", v)} fieldName="seoImage" />
    </div>
  );
}