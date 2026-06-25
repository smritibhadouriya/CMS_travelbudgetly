import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getPackagePage, savePackagePage } from '@/controllers/packagePage.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getPackagePage);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadAny(), convertMultipleToWebP, savePackagePage);
}
