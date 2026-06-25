import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getSettings, saveSettings } from '@/controllers/settings.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getSettings);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadAny(), convertMultipleToWebP, saveSettings);
}
