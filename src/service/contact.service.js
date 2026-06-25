// // service/contact.service.js
// import axios from "axios";
// import { VITE_BACKEND_URL } from "../../config.js";

// const API = axios.create({
//   baseURL: VITE_BACKEND_URL,
// });

// export const getContacts  = ()    => API.get("/contacts");
// export const deleteContact = (id) => API.delete(`/contacts/${id}`);
// export const addContact   = (data) => API.post("/api/contact", data);


// service/contact.service.js
import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const API = axios.create({
  baseURL: VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getContacts = () => API.get("/contacts");

export const deleteContact = (id) => API.delete(`/contacts/${id}`);

// Public form submission (website se aane wala data)
export const submitContact = (data) => API.post("/contact-message", data);

// Admin ke liye bulk ya single import ke liye (optional, agar chahiye to use kar sakte ho)
export const createContact = (data) => API.post("/contact-message", data);  // same endpoint use kar rahe hain