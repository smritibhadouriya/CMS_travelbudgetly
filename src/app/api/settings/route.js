import { runRoute } from '@/lib/express-adapter';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getSettings, saveSettings } from '@/controllers/settings.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getSettings);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, uploadAny(), convertMultipleToWebP, saveSettings);
}
