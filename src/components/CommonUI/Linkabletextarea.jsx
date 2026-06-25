'use client';
// components/CommonUI/LinkableTextarea.jsx
// Reusable textarea with "🔗 Add Link" button
// Select text → click Add Link → enter URL → inserts <a href="...">text</a>
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { insertLink, isTextAlreadyLinked } from "../../utils/linkUtils";

/**
 * Props:
 *   label       — field label
 *   value       — string (may contain <a href="..."> tags)
 *   onChange    — (newValue: string) => void
 *   placeholder — string
 *   rows        — number (default 4)
 *   hint        — optional hint text below
 */
export default function LinkableTextarea({
  label, value = "", onChange, placeholder, rows = 4, hint,
}) {
  const ref = useRef(null);
  const [modal, setModal] = useState(false);
  const [url,   setUrl]   = useState("");

  const openModal = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    if (s === e)         { toast.error("Select text first");         return; }
    if (isTextAlreadyLinked(value, s, e)) { toast.info("Already linked"); return; }
    setModal(true);
  };

  const insertIt = () => {
    const el = ref.current;
    if (!el) return;
    if (!url.trim()) { toast.error("Enter a URL"); return; }
    const { selectionStart: s, selectionEnd: e } = el;
    onChange(insertLink(value, s, e, url));
    setUrl(""); setModal(false);
  };

  // Preview: strip tags for character count
  const hasLinks = value.includes("<a ");

  return (
    <div className="mb-4">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1">
        {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
        <button
          type="button"
          onClick={openModal}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-colors"
        >
          🔗 Add Link
        </button>
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition resize-none font-mono"
      />

      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {hasLinks && (
        <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
          🔗 Contains inline links — they'll render as clickable on the site
        </p>
      )}

      {/* Link Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-base font-bold text-gray-900 mb-1">Insert Link</h3>
            <p className="text-sm text-gray-500 mb-4">
              Selected text will become a clickable link
            </p>
            <input
              type="url"
              autoFocus
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && insertIt()}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setModal(false); setUrl(""); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertIt}
                className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}