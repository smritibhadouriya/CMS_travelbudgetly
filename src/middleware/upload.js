import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadDir = path.join(__dirname, '../../upload');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ──── STORAGE: Memory (best for processing) ────
const storage = multer.memoryStorage();

// ──── STRICT FILE FILTER ────
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'
  ];
  const allowedExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

  const extname = path.extname(file.originalname).toLowerCase();
  const isValidExt = allowedExt.includes(extname);
  const isValidMime = allowedTypes.includes(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, WebP, HEIC/HEIF images allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB – safe & reasonable
  fileFilter,
});

// ──── SINGLE FILE CONVERTER + RESIZE ────
const convertToWebP = async (req, res, next) => {
  console.log("FILES:", req.files);
console.log("BODY:", req.body);
  if (!req.file) return next();

  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    await sharp(req.file.buffer)
      .rotate()                     // auto-orientation
      .resize({ width: 1920, withoutEnlargement: true }) // max width 1920, no upscale
      .webp({ quality: 82, effort: 4 }) // effort 4 = good balance speed vs compression
      .toFile(outputPath);

    req.file.path = `/upload/${filename}`;
    req.file.filename = filename;
    req.file.mimetype = 'image/webp';
    req.file.size = fs.statSync(outputPath).size; // updated size after compression

    next();
  } catch (err) {
    console.error('❌ Single file conversion error:', err);
    next(new Error('Image processing failed: ' + err.message));
  }
};

// ──── MULTIPLE FILES CONVERTER + RESIZE ────
const convertMultipleToWebP = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    for (const file of req.files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
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

export { upload, convertToWebP, convertMultipleToWebP };