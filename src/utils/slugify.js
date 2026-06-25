/**
 * Convert any string into a URL-friendly slug
 * Example: "Senior Frontend Dev & Design" -> "senior-frontend-dev-and-design"
 */
export const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()               // lowercase
    .trim()                      // remove spaces at start/end
    .replace(/&/g, "and")        // replace & with "and"
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanum with dash
    .replace(/^-+|-+$/g, "");    // remove leading/trailing dash
};
