import { runRoute } from '@/lib/express-adapter';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getAboutPage, saveAboutPage } from '@/controllers/about.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAboutPage);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, uploadAny(), convertMultipleToWebP, saveAboutPage);
}
