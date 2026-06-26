// Shared coercion helpers for request → payload mapping.

export const bool = (v, def = false) => (v === undefined || v === null ? def : v === true || v === "true");

export const num = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

export const strArr = (v) =>
  Array.isArray(v)
    ? v.map((s) => String(s || "").trim()).filter(Boolean)
    : typeof v === "string" && v.trim()
    ? v.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
