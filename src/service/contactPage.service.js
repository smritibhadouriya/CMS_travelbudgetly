
// // import axios from "axios";
// // import { VITE_BACKEND_URL } from "../../config.js"; // ya jo bhi aapka config file hai

// // const API = axios.create({
// //   baseURL: `${VITE_BACKEND_URL}`,
// // });

// // export const getContactPage = async () => {
// //   try {
// //     const response = await API.get("/contact");   // ← yeh sahi endpoint hai
// //     return response;
// //   } catch (error) {
// //     console.error("❌ getContactPage failed:", error?.response?.data || error.message);
// //     throw error; // ya custom error handling kar sakte ho
// //   }
// // };

// // export const saveContactPage = async (formData) => {
// //   try {
// //     const response = await API.post("/contact", formData, {   // ← POST use kar rahe hain (backend mein post hai)
// //       headers: {
// //         "Content-Type": "multipart/form-data",
// //       },
// //     });
// //     return response;
// //   } catch (error) {
// //     console.error("❌ saveContactPage failed:", error?.response?.data || error.message);
// //     throw error;
// //   }
// // };


// // service/contactPage.service.js
// import axios from "axios";
// import { VITE_BACKEND_URL } from "../../config.js";

// const API = axios.create({
//   baseURL: `${VITE_BACKEND_URL}`,
// });

// export const getContactPage = async () => {
//   try {
//     const response = await API.get("/contact");
//     return response;
//   } catch (error) {
//     console.error("❌ getContactPage failed:", error?.response?.data || error.message);
//     throw error;
//   }
// };

// export const saveContactPage = async (formData) => {
//   try {
//     const response = await API.post("/contact", formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });
//     return response;
//   } catch (error) {
//     console.error("❌ saveContactPage failed:", error?.response?.data || error.message);
//     throw error;
//   }
// };


import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

const BASE = `${VITE_BACKEND_URL}/contact`;
console.log("🔵 [contact.service] BASE =", BASE);

const API = axios.create({ baseURL: BASE });

export const getContactPage = async () => {
  try {
    return await API.get("");
  } catch (err) {
    console.error("❌ getContactPage:", err?.response?.status);
    throw err;
  }
};

export const saveContactPage = async (formData) => {
  try {
    return await API.post("", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } catch (err) {
    console.error("❌ saveContactPage:", err?.response?.status, err?.response?.data);
    throw err;
  }
};