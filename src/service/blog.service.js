import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const API = axios.create({
  baseURL: `${VITE_BACKEND_URL}/blogs`,
});

// GET
export const getBlogs = () => API.get("/");
export const getBlog = (id) => API.get(`/${id}`);

// CREATE
export const createBlog = (data) =>
  API.post("/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// UPDATE
export const updateBlog = (id, data) =>
  API.put(`/${id}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// DELETE
export const deleteBlog = (id) => API.delete(`/${id}`);

//Image upload for editor
export const uploadEditorMedia = (file) => {
  const data = new FormData();
  data.append("file", file);

  return API.post("/editor", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
