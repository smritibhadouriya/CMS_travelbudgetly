import sanitizeHtml from "sanitize-html";

export const cleanHTML = (html = "") =>
  sanitizeHtml(html, {
    allowedTags: ["a", "b", "i", "strong", "em", "p", "br", "ul", "ol", "li", "span"],
    allowedAttributes: { a: ["href", "target", "rel"], span: ["class"] },
  });
