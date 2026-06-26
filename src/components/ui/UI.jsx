'use client';
// admin/components/common/ui.jsx
// Base atoms: Field, Input, Textarea, HeadingSelect, Toggle, VisBadge, SectionCard
import { useState } from "react";

/* ── word count ── */
export const wc = (t="") => (t||"").trim().replace(/\s+/g," ").split(" ").filter(Boolean).length;

/* ══════════════════════════════════════
   FIELD — label + live word counter
══════════════════════════════════════ */
export const Field = ({ label, limit, value="", required, hint, children }) => {
  const count = limit ? wc(value) : 0;
  const over  = limit && count > limit;
  const warn  = limit && count > limit * 0.8 && !over;
  return (
    <div className="cms-field">
      {label && (
        <div className="cms-field-row">
          <label className="cms-field-label">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          {limit && (
            <span className={`cms-wc ${over?"over":warn?"warn":""}`}>
              {count} / {limit}
            </span>
          )}
        </div>
      )}
      {children}
      {hint && !over && <p className="cms-hint">{hint}</p>}
      {over  && <p className="cms-error-hint">⚠ Trim to ≤{limit} words for best SEO</p>}
    </div>
  );
};

/* ══════════════════════════════════════
   INPUT
══════════════════════════════════════ */
export const Input = ({ label, limit, value, onChange, placeholder, type="text", required, hint, ...rest }) => (
  <Field label={label} limit={limit} value={value} required={required} hint={hint}>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="cms-input" {...rest} />
  </Field>
);

/* ══════════════════════════════════════
   TEXTAREA
══════════════════════════════════════ */
export const Textarea = ({ label, limit, value, onChange, placeholder, rows=3, required, hint }) => (
  <Field label={label} limit={limit} value={value} required={required} hint={hint}>
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="cms-input cms-textarea" />
  </Field>
);

/* ══════════════════════════════════════
   HEADING SELECT  — pill buttons
══════════════════════════════════════ */
export const HeadingSelect = ({ value, onChange }) => (
  <div className="cms-field">
    <label className="cms-field-label">Heading Tag</label>
    <div className="flex gap-1.5">
      {["h1","h2","h3","h4","h5","h6"].map(h => (
        <button key={h} type="button" onClick={() => onChange(h)}
          className={`cms-heading-pill ${value===h ? "active" : ""}`}>
          {h.toUpperCase()}
        </button>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════
   TOGGLE — animated switch
══════════════════════════════════════ */
export const Toggle = ({ label, description, checked, onChange }) => (
  <div onClick={() => onChange(!checked)} className={`cms-toggle ${checked?"on":""}`}>
    <div>
      <p className={`text-sm font-semibold ${checked?"text-emerald-700":"text-slate-500"}`}>{label}</p>
      {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
    </div>
    <div className={`cms-toggle-track ${checked?"on":""}`}>
      <div className={`cms-toggle-thumb ${checked?"on":""}`}/>
    </div>
  </div>
);

/* ══════════════════════════════════════
   VISIBILITY BADGE
══════════════════════════════════════ */
export const VisBadge = ({ value, onChange }) => (
  <button type="button"
    onClick={e => { e.stopPropagation(); onChange(!value); }}
    className={`cms-vis-badge ${value?"on":"off"}`}>
    {value
      ? <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      : <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59m5.858.908A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M21 21l-3.59-3.59"/>
        </svg>}
    {value ? "Live" : "Hidden"}
  </button>
);

/* ══════════════════════════════════════
   SECTION CARD — collapsible
══════════════════════════════════════ */
export const SectionCard = ({ icon, title, badge, isVisible=true, onVisToggle, defaultOpen=true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`cms-card ${!onVisToggle||isVisible?"":"dimmed"}`}>
      <div className="cms-card-header" onClick={() => setOpen(o=>!o)}>
        <div className="flex items-center gap-3">
          {icon && <span className="cms-card-icon">{icon}</span>}
          <span className="cms-card-title">{title}</span>
          {badge && <span className="cms-badge">{badge}</span>}
          {onVisToggle && !isVisible && <span className="cms-hidden-tag">hidden</span>}
        </div>
        <div className="flex items-center gap-2">
          {onVisToggle && <VisBadge value={isVisible} onChange={onVisToggle}/>}
          <div className={`cms-chevron ${open?"open":""}`}>
            <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>
      {open && <div className="cms-card-body">{children}</div>}
    </div>
  );
};

/* ══════════════════════════════════════
   DIVIDER
══════════════════════════════════════ */
export const Divider = ({ label }) => (
  <div className="cms-divider">
    <div className="h-px bg-slate-100 flex-1"/>
    {label && <span className="cms-divider-label">{label}</span>}
    <div className="h-px bg-slate-100 flex-1"/>
  </div>
);

/* ══════════════════════════════════════
   TWO-COLUMN GRID
══════════════════════════════════════ */
export const Grid2 = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
);