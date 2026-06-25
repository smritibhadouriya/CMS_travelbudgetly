// backend/utils/helpers.js
import sanitizeHtml from "sanitize-html";
import dotenv from "dotenv";


dotenv.config();



export const cleanHTML = (html = "") =>
  sanitizeHtml(html, {
    allowedTags: ["a", "b", "i", "strong", "em", "p", "br", "ul", "ol", "li", "span"],
    allowedAttributes: { a: ["href", "target", "rel"], span: ["class"] },
  });

export const safeHeading = (val, fallback = "h2") =>
  ["h1", "h2", "h3", "h4", "h5", "h6"].includes(val) ? val : fallback;

/* Build full public URL from multer file.path
   upload.js sets: file.path = "/uploads/images/abc.webp"
   server.js serves: app.use("/api/uploads", static(...))
   Result: http://localhost:5000/api/uploads/images/abc.webp
*/
export const fileUrl = (filePath = "") => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const base = (process.env.BASE_URL).replace(/\/$/, "");
  // const base = (process.env.BASE_URL || "https://dashboard.travelbudgetly.com/").replace(/\/$/, "");
  
// console.log("BASE_URL:", process.env.BASE_URL);
  // strip leading slash, strip "uploads/" prefix — add /api/uploads/
  const rel  = filePath.replace(/^\//, "").replace(/^upload\//, "");
  return `${base}/api/upload/${rel}`;
};

/* normalizeImage — accepts both DB shape {src} and frontend shape {url} */
export const normalizeImage = (raw = {}) => ({
  src:   (raw?.src || raw?.url || "").trim(),
  alt:   (raw?.alt   || "").trim(),
  title: (raw?.title || "").trim(),
});

export const parseSeo = (raw = {}) => ({
  metaTitle:       (raw?.metaTitle       || "").trim(),
  metaDescription: (raw?.metaDescription || "").trim(),
  metaKeywords:    Array.isArray(raw?.metaKeywords) ? raw.metaKeywords : [],
  canonicalUrl:    (raw?.canonicalUrl    || "").trim(),
  index:           raw?.index  !== false,
  follow:          raw?.follow !== false,
  image:           normalizeImage(raw?.image),
});

export const parseBody = (req) => {
  try {
    return req.body?.data ? JSON.parse(req.body.data) : (req.body || {});
  } catch {
    return req.body || {};
  }
};