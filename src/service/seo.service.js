import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const API = axios.create({
  baseURL: VITE_BACKEND_URL,
});

export const fetchSeo = () => API.get("/seodata");

export const saveSeo = (data) =>
  API.post("/seodata", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
