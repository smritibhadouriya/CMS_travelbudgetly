import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadSingle, convertToWebP } from '@/lib/upload';
import { uploadImage } from '@/controllers/uploadController.js';

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadSingle('image'), convertToWebP, uploadImage);
}
