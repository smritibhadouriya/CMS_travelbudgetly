import { normalizeImage } from "./image.js";

export const parseSeo = (raw = {}) => ({
  metaTitle:       (raw?.metaTitle       || "").trim(),
  metaDescription: (raw?.metaDescription || "").trim(),
  metaKeywords:    Array.isArray(raw?.metaKeywords) ? raw.metaKeywords : [],
  canonicalUrl:    (raw?.canonicalUrl    || "").trim(),
  index:           raw?.index  !== false,
  follow:          raw?.follow !== false,
  image:           normalizeImage(raw?.image),
});
