// src/lib/upload.js
//
// Next.js replacement for the Express multer + sharp middleware
// (src/middleware/upload.js). The multipart parsing is handled by the
// express-adapter (req._files); these helpers expose them as req.file /
// req.files and run the EXACT same sharp WebP conversion as the original.

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Uploads live in <project-root>/upload and are served at /api/upload/<file>.
const uploadDir = path.join(process.cwd(), 'upload');

function ensureDir() {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
}

export { uploadDir };

// ──── multer.any() equivalent ────
export function uploadAny() {
  return async (req, _res, next) => {
    req.files = req._files || [];
    next();
  };
}

// ──── multer.single(field) equivalent ────
export function uploadSingle(field) {
  return async (req, _res, next) => {
    req.file = (req._files || []).find((f) => f.fieldname === field);
    next();
  };
}

// ──── SINGLE FILE CONVERTER + RESIZE (same as middleware/upload.js) ────
export const convertToWebP = async (req, _res, next) => {
  if (!req.file) return next();

  try {
    ensureDir();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(outputPath);

    req.file.path = `/upload/${filename}`;
    req.file.filename = filename;
    req.file.mimetype = 'image/webp';
    req.file.size = fs.statSync(outputPath).size;

    next();
  } catch (err) {
    console.error('❌ Single file conversion error:', err);
    next(new Error('Image processing failed: ' + err.message));
  }
};

// ──── MULTIPLE FILES CONVERTER + RESIZE (same as middleware/upload.js) ────
export const convertMultipleToWebP = async (req, _res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    ensureDir();
    for (const file of req.files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const outputPath = path.join(uploadDir, filename);

      await sharp(file.buffer)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(outputPath);

      file.path = `/upload/${filename}`;
      file.filename = filename;
      file.mimetype = 'image/webp';
      file.size = fs.statSync(outputPath).size;
    }
    next();
  } catch (err) {
    console.error('❌ Multiple files conversion error:', err);
    next(new Error('Image processing failed for one or more files'));
  }
};
