import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getAboutPage, saveAboutPage } from '@/controllers/about.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAboutPage);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadAny(), convertMultipleToWebP, saveAboutPage);
}
