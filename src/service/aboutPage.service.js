

// // service/aboutPage.service.js - Following Technology Pattern
// import axios from "axios";
// import { VITE_BACKEND_URL } from "../../config.js";

// const API = axios.create({
//   baseURL: `${VITE_BACKEND_URL}/about`,
// });

// export const getAboutPage = async () => {
//   try {
//     const response = await API.get("/");
//     return response;
//   } catch (error) {
//     console.error("❌ getAboutPage failed:", error?.response?.data || error.message);
//     throw error;
//   }
// };

// export const saveAboutPage = async (formData) => {
//   try {
//     const response = await API.post("/", formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });
//     return response;
//   } catch (error) {
//     console.error("❌ saveAboutPage failed:", error?.response?.data || error.message);
//     throw error;
//   }
// };


// service/aboutPage.service.js — TravelBudgetly
import axios from "axios";

/* ── Base URL (same-origin Next.js API) ── */
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";
const BASE_URL = VITE_BACKEND_URL || "/api";

const API = axios.create({
  baseURL: `${BASE_URL}/about`,
  timeout: 30_000,   // 30 s — enough for large image uploads
});

/* ── Interceptor: enrich errors with user-friendly messages ── */
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!navigator.onLine || error.code === "ERR_NETWORK") {
      error.userMessage = "No internet connection. Please check your network and try again.";
    } else if (error.code === "ECONNABORTED") {
      error.userMessage = "Request timed out. Please try again.";
    } else if (error.response) {
      const status = error.response.status;
      if (status === 413)      error.userMessage = "File too large. Please use images under 5 MB.";
      else if (status === 422) error.userMessage = error.response.data?.message || "Validation failed.";
      else if (status >= 500)  error.userMessage = "Server error. Please try again in a moment.";
      else                     error.userMessage = error.response.data?.message || "Something went wrong.";
    } else {
      error.userMessage = "Unable to reach the server. Please try again.";
    }
    return Promise.reject(error);
  }
);

/* ── GET ── */
export const getAboutPage = () =>
  API.get("/").catch((err) => {
    console.error("❌ getAboutPage:", err.userMessage || err.message);
    throw err;
  });

/* ── SAVE ── */
export const saveAboutPage = (formData) =>
  API.post("/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      /* progress available if caller wants it */
      const pct = Math.round((e.loaded * 100) / (e.total || 1));
      if (typeof window.__aboutUploadProgress === "function") {
        window.__aboutUploadProgress(pct);
      }
    },
  }).catch((err) => {
    console.error("❌ saveAboutPage:", err.userMessage || err.message);
    throw err;
  });