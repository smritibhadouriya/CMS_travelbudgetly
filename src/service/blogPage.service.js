
import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api"; // ya jo bhi aapka config file hai

const API = axios.create({
  baseURL: `${VITE_BACKEND_URL}`,
  // timeout: 30000,          // optional – agar chahiye to add kar sakte ho
  // withCredentials: true,   // agar auth/cookies bhejna ho to
});

export const getBlogPage = async () => {
  try {
    const response = await API.get("/blogpage");   // ← yeh sahi endpoint hai
    return response;
  } catch (error) {
    console.error("❌ getBlogPage failed:", error?.response?.data || error.message);
    throw error; // ya custom error handling kar sakte ho
  }
};

export const saveBlogPage = async (formData) => {
  try {
    const response = await API.post("/blogpage", formData, {   // ← POST use kar rahe hain (backend mein post hai)
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("❌ saveBlogPage failed:", error?.response?.data || error.message);
    throw error;
  }
};
