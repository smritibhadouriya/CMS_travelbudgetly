/* normalizeImage — accepts both DB shape {src} and frontend shape {url} */
export const normalizeImage = (raw = {}) => ({
  src:   (raw?.src || raw?.url || "").trim(),
  alt:   (raw?.alt   || "").trim(),
  title: (raw?.title || "").trim(),
});
