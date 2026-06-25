

// service/homePage.service.js
import axios from "axios";
const VITE_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "/api";

// Router structure:
//   server.js → app.use("/", allRoutes)   [ya similar]
//   routes/index.js → router.use("/", HomeRoute)
//   home.routes.js → router.get("/home", ...)
//
// Final URLs:
//   GET  http://localhost:5000/home
//   POST http://localhost:5000/home
//
// ⚠️ NO trailing slash — /home/ → 404, /home → ✅

const BASE = `${VITE_BACKEND_URL}`;

console.log("🔵 [homePage.service] BACKEND =", BASE);

const API = axios.create({ baseURL: BASE });

export const getHomePage = async () => {
  console.log("🔵 GET", BASE + "/home");
  try {
    const res = await API.get("/home");   // NO trailing slash
    console.log("🟢 getHomePage OK:", res.status);
    return res;
  } catch (err) {
    console.error("❌ getHomePage FAILED:", err?.response?.status, err?.response?.data);
    throw err;
  }
};

export const saveHomePage = async (formData) => {
  console.log("🔵 POST", BASE + "/home");
  try {
    const res = await API.post("/home", formData, {  // NO trailing slash
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("🟢 saveHomePage OK:", res.status);
    return res;
  } catch (err) {
    console.error("❌ saveHomePage FAILED:", err?.response?.status, err?.response?.data);
    throw err;
  }
};