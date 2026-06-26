import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const BASE = VITE_BACKEND_URL.replace(/\/$/, "");

// withCredentials so the httpOnly `token` cookie is sent on every API request.
const api = axios.create({ baseURL: BASE, timeout: 60_000, withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!navigator.onLine || err.code === "ERR_NETWORK") {
      err.userMessage = "No internet connection.";
    } else if (err.code === "ECONNABORTED") {
      err.userMessage = "Request timed out. Please try again.";
    } else if (err.response) {
      const s   = err.response.status;
      const msg = err.response.data?.message;
      if      (s === 400) err.userMessage = msg || "Invalid data.";
      else if (s === 404) err.userMessage = msg || "Not found.";
      else if (s === 409) err.userMessage = msg || "Already exists.";
      else if (s === 413) err.userMessage = "File too large. Use images under 5 MB.";
      else if (s >= 500)  err.userMessage = "Server error. Please try again.";
      else                err.userMessage = msg || "Something went wrong.";
    } else {
      err.userMessage = "Unable to reach server.";
    }
    return Promise.reject(err);
  }
);

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

/* ══════════════════════════════════════
   PAGES  (/api/pages/:slug)
══════════════════════════════════════ */
export const getHomePage  = ()   => api.get("/pages/home");
export const saveHomePage = (fd) => api.post("/pages/home", fd, multipart);
export const getAboutPage  = ()   => api.get("/pages/about");
export const saveAboutPage = (fd) => api.post("/pages/about", fd, multipart);

/* ══════════════════════════════════════
   PACKAGE LISTING PAGE  (/api/package-page)
══════════════════════════════════════ */
export const getPackagePage  = ()   => api.get("/package-page");
export const savePackagePage = (fd) => api.post("/package-page", fd, multipart);

/* ══════════════════════════════════════
   BLOG LISTING PAGE  (/api/blogpage)
══════════════════════════════════════ */
export const getBlogPage  = ()   => api.get("/blogpage");
export const saveBlogPage = (fd) => api.post("/blogpage", fd, multipart);

/* ══════════════════════════════════════
   PACKAGES  (/api/packages)
══════════════════════════════════════ */
export const getPackages   = (params = {}) => api.get("/packages", { params });
export const getPackage     = (slug)        => api.get(`/packages/${slug}`);
export const createPackage = (fd)          => api.post("/packages", fd, multipart);
export const updatePackage = (id, fd)      => api.put(`/packages/${id}`, fd, multipart);
export const deletePackage = (id)          => api.delete(`/packages/${id}`);

/* ══════════════════════════════════════
   OFFERS  (/api/offers)
══════════════════════════════════════ */
export const getOffers   = (params = {}) => api.get("/offers", { params });
export const getOffer     = (slug)        => api.get(`/offers/${slug}`);
export const createOffer = (fd)          => api.post("/offers", fd, multipart);
export const updateOffer = (id, fd)      => api.put(`/offers/${id}`, fd, multipart);
export const deleteOffer = (id)          => api.delete(`/offers/${id}`);

/* ══════════════════════════════════════
   REDIRECTS  (/api/redirects)
══════════════════════════════════════ */
export const getRedirects   = ()          => api.get("/redirects");
export const createRedirect = (data)      => api.post("/redirects", data);
export const updateRedirect = (id, data)  => api.put(`/redirects/${id}`, data);
export const deleteRedirect = (id)        => api.delete(`/redirects/${id}`);

/* ══════════════════════════════════════
   BLOGS  (/api/blogs)
══════════════════════════════════════ */
export const getBlogs          = (params = {}) => api.get("/blogs", { params });
export const getBlog           = (id)           => api.get(`/blogs/${id}`);
export const createBlog        = (fd)           => api.post("/blogs",             fd, multipart);
export const updateBlog        = (id, fd)       => api.put(`/blogs/${id}`,        fd, multipart);
export const deleteBlog        = (id)           => api.delete(`/blogs/${id}`);
export const toggleBlogPublish = (id)           => api.patch(`/blogs/${id}/publish`);
export const toggleBlogFeature = (id)           => api.patch(`/blogs/${id}/feature`);

/* ══════════════════════════════════════
   AUTHORS  (/api/authors)
══════════════════════════════════════ */
export const getAuthors          = (params = {}) => api.get("/authors", { params });
export const getAuthor           = (id)          => api.get(`/authors/${id}`);
export const getAuthorProfile    = (id)          => api.get(`/authors/profile/${id}`);
export const createAuthor        = (fd)          => api.post("/authors",       fd, multipart);
export const updateAuthor        = (id, fd)      => api.put(`/authors/${id}`,  fd, multipart);
export const deleteAuthor        = (id)          => api.delete(`/authors/${id}`);

/* ══════════════════════════════════════
   COMMENTS  (/api/comments)
══════════════════════════════════════ */
export const getAllComments       = (params = {})  => api.get("/comments", { params });
export const getGroupedComments   = (params = {})  => api.get("/comments", { params: { ...params, grouped: "true" } });
export const getCommentStats      = ()             => api.get("/comments/stats");
export const updateCommentStatus  = (id, status)   => api.put(`/comments/${id}/status`, { status });
export const deleteComment        = (id)           => api.delete(`/comments/${id}`);
export const bulkUpdateComments   = (ids, status)  => api.put("/comments/bulk", { ids, status });
export const bulkDeleteComments   = (ids)          => api.put("/comments/bulk", { ids, action: "delete" });

/* ══════════════════════════════════════
   SETTINGS  (/api/settings)
══════════════════════════════════════ */
export const getSettings  = ()   => api.get("/settings");
export const saveSettings = (fd) => api.post("/settings", fd, multipart);

/* ══════════════════════════════════════
   SEO  (/api/seo)
══════════════════════════════════════ */
export const getAllSeo    = ()             => api.get("/seo/all");
export const saveSeoByPage = (page, fd)    => api.put("/seo", fd, { ...multipart, params: { page } });

/* ══════════════════════════════════════
   IMAGES  (/api/images)
══════════════════════════════════════ */
export const cleanupImages   = ()         => api.post("/images/admin/cleanup");

export default api;
