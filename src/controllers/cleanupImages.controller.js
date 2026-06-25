// src/controllers/images.controller.js
import fs from 'fs';
import path from 'path';
import * as cleanupImagesService from '../lib/services/cleanupImages.service.js';

// In Next.js the server runs from the project root (cms-nextjs); uploads
// live in <root>/upload (same dir the upload helper writes to).
const UPLOAD_DIR = path.join(process.cwd(), 'upload');

// ── Filename safety check ──
const isValidFilename = (f) =>
  f && typeof f === 'string' &&
  !f.includes('..') && !f.includes('/') &&
  !f.includes('\\') && !f.includes('%') &&
  f.length < 255;

// ── GET /api/images — sabhi uploaded images list ──
export const getAllImages = async (_req, res) => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return res.status(404).json({ error: 'Upload folder not found' });
    }

    const files  = fs.readdirSync(UPLOAD_DIR);
    const images = files
      .filter((f) => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f))
      .map((file) => ({
        url:      `/api/upload/${file}`,
        filename: file,
      }));

    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images', message: err.message });
  }
};

// ── DELETE /api/images/:filename — single image delete ──
export const deleteImage = async (req, res) => {
  try {
    let { filename } = req.params;
    filename = decodeURIComponent(filename);

    if (!isValidFilename(filename)) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Image not found on server' });
    }

    // Check if in use (Prisma version — JSON field mein search)
    const inUse = await isImageInUse(filename);
    if (inUse) {
      return res.status(400).json({
        success: false,
        message: 'This image is currently used in content. Cannot delete.',
      });
    }

    await fs.promises.unlink(filePath);
    res.json({ success: true, message: 'Image deleted', filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/cleanup-images — unused images delete ──
export const cleanupUnusedImages = async (_req, res) => {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      return res.json({ success: true, deletedCount: 0, message: 'Upload directory not found' });
    }

    const allFiles = fs.readdirSync(UPLOAD_DIR).filter((f) =>
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f),
    );

    if (allFiles.length === 0) {
      return res.json({ success: true, deletedCount: 0, message: 'No images found' });
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

    res.json({
      success: true,
      deletedCount,
      deletedFiles,
      totalScanned:     allFiles.length,
      usedImagesCount:  usedImages.size,
      message:          `Deleted ${deletedCount} unused image(s)`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Helper: kisi bhi DB record mein filename hai? ──
const isImageInUse = async (filename) => {
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
