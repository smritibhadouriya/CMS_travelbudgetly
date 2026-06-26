import dotenv from "dotenv";

dotenv.config();

/* Build full public URL from multer file.path
   upload.js sets: file.path = "/uploads/images/abc.webp"
   server.js serves: app.use("/api/uploads", static(...))
   Result: http://localhost:5000/api/uploads/images/abc.webp
*/
export const fileUrl = (filePath = "") => {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  const base = (process.env.BASE_URL).replace(/\/$/, "");
  // const base = (process.env.BASE_URL || "https://dashboard.travelbudgetly.com/").replace(/\/$/, "");

  // console.log("BASE_URL:", process.env.BASE_URL);
  // strip leading slash, strip "uploads/" prefix — add /api/uploads/
  const rel  = filePath.replace(/^\//, "").replace(/^upload\//, "");
  return `${base}/api/upload/${rel}`;
};
