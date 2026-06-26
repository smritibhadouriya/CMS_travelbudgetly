// src/lib/upload.js
//
// Upload directory location, re-exported for the file-serving route
// (app/api/upload/[file]). Image processing lives in
// lib/services/upload.service.js, which each route imports directly.

export { uploadDir } from '@/lib/services/upload.service.js';
