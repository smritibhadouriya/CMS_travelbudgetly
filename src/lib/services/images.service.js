// src/lib/services/images.service.js
//
// Single owner of all image-cleanup BUSINESS LOGIC:
//   • upload-directory traversal / filesystem scan
//   • orphan (unused) detection
//   • in-use detection
//   • delete planning + delete execution
//
// Orchestrates cleanupImages.service.js (Prisma reads) + the filesystem.
// Knows nothing about req/res, status codes, or response envelopes — the route
// handler maps these results onto HTTP responses.

import fs from 'fs';
import path from 'path';
import * as cleanupImagesService from './cleanupImages.service.js';

// In Next.js the server runs from the project root (cms-nextjs); uploads
// live in <root>/upload (same dir the upload helper writes to).
const UPLOAD_DIR = path.join(process.cwd(), 'upload');
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|gif|svg)$/i;

/* ── Filesystem state guards (let the route handler pick the status code) ── */
export const uploadDirExists = () => fs.existsSync(UPLOAD_DIR);

export const imageExists = (filename) => fs.existsSync(path.join(UPLOAD_DIR, filename));

/* ── List all uploaded images (filesystem traversal) ── */
export const listImages = () => {
  const files = fs.readdirSync(UPLOAD_DIR);
  return files
    .filter((f) => IMAGE_EXT_RE.test(f))
    .map((file) => ({
      url:      `/api/upload/${file}`,
      filename: file,
    }));
};

/* ── Delete a single file from disk ── */
export const deleteImageFile = (filename) =>
  fs.promises.unlink(path.join(UPLOAD_DIR, filename));

/* ── Is this filename referenced by any DB record? ── */
export const isImageInUse = async (filename) => {
  const checkJson = (obj) => {
    if (!obj) return false;
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return str.includes(filename);
  };

  const [blogs, packages, homePage, aboutPage, blogPage, packagePage, authors, offers, seoData] =
    await cleanupImagesService.getRecordsForImageScan();

  return [...blogs, ...packages, ...homePage, ...aboutPage, ...blogPage, ...packagePage, ...authors, ...offers, ...seoData]
    .some(checkJson);
};

/* ── Scan upload dir, detect orphans, plan + execute deletes, summarise ── */
export const cleanupUnusedImages = async () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    return { deletedCount: 0, message: 'Upload directory not found' };
  }

  const allFiles = fs.readdirSync(UPLOAD_DIR).filter((f) =>
    IMAGE_EXT_RE.test(f),
  );

  if (allFiles.length === 0) {
    return { deletedCount: 0, message: 'No images found' };
  }

  // Saare DB records se image filenames collect karo
  const usedImages = new Set();

  const collectFromJson = (obj) => {
    if (!obj) return;
    if (typeof obj === 'string') {
      // /upload/filename.webp pattern check
      const match = obj.match(/upload\/([^"'\s,]+)/);
      if (match) usedImages.add(match[1]);
    } else if (typeof obj === 'object') {
      Object.values(obj).forEach(collectFromJson);
    }
  };

  // Saare models scan karo
  const [blogs, packages, homePage, aboutPage, blogPage, packagePage, authors, offers, seoData] =
    await cleanupImagesService.getRecordsForImageScan();

  [...blogs, ...packages, ...homePage, ...aboutPage, ...blogPage, ...packagePage, ...authors, ...offers, ...seoData]
    .forEach(collectFromJson);

  // Package images arrays bhi scan karo
  packages.forEach((p) => {
    [...(p.images || []), ...(p.imageUrls || [])].forEach((img) => {
      const match = img.match(/upload\/([^"'\s,]+)/);
      if (match) usedImages.add(match[1]);
    });
  });

  const unusedFiles = allFiles.filter((f) => !usedImages.has(f));

  let deletedCount = 0;
  const deletedFiles = [];

  for (const file of unusedFiles) {
    try {
      await fs.promises.unlink(path.join(UPLOAD_DIR, file));
      deletedCount++;
      deletedFiles.push(file);
    } catch (e) {
      console.error(`Failed to delete ${file}:`, e.message);
    }
  }

  return {
    deletedCount,
    deletedFiles,
    totalScanned:     allFiles.length,
    usedImagesCount:  usedImages.size,
    message:          `Deleted ${deletedCount} unused image(s)`,
  };
};
