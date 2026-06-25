// src/api/services.Api.js
import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api"; // make sure this exports the correct base (e.g. http://localhost:5000)

const api = axios.create({
  baseURL: `${VITE_BACKEND_URL}/service`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach admin JWT if present (uncomment when auth is ready)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));


export const getAllServices = () => api.get("/");

export const getServiceBySlug = (slug) => api.get(`/${slug}`);

export const saveService = (formData) => {
  return api.post("/save", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


export const toggleServiceStatus = (slug, status) =>
  api.patch(`/${slug}/status`, { status });

export const deleteService = (slug) => api.delete(`/${slug}`);

export const getPublishedServices = async () => {
  try {
    const { data } = await getAllServices();
    return data.success ? (data.data || []).filter((s) => s.status === "published") : [];
  } catch (err) {
    console.error("Failed to fetch published services:", err);
    return [];
  }
};

export default api;