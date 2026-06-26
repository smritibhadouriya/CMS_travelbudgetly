// src/lib/services/upload.service.js
//
// Single owner of all image PROCESSING logic (sharp WebP conversion, resize,
// filename generation, output sizing). No request parsing, no multer, no
// middleware, no route/response handling — those stay in lib/upload.js.
//
// Moved verbatim from lib/upload.js so output (filename, dimensions, WebP
// bytes, compression) is byte-identical.

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Uploads live in <project-root>/upload and are served at /api/upload/<file>.
const uploadDir = path.join(process.cwd(), 'upload');

export { uploadDir };

export function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}

// ──── FILENAME GENERATION (same as lib/upload.js) ────
export function generateFilename() {
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
}

// ──── SHARP WEBP CONVERT + RESIZE + OPTIMIZE (same as lib/upload.js) ────
// Returns the file metadata that callers assign onto req.file / req.files.
export async function processImageToWebP(buffer) {
  ensureUploadDir();

  const filename = generateFilename();
  const outputPath = path.join(uploadDir, filename);

  await sharp(buffer)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(outputPath);

  return {
    path: `/upload/${filename}`,
    filename,
    mimetype: 'image/webp',
    size: fs.statSync(outputPath).size,
  };
}
