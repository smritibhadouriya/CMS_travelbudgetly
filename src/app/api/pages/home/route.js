import { runRoute } from '@/lib/express-adapter';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getHomePage, saveHomePage } from '@/controllers/home.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getHomePage);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, uploadAny(), convertMultipleToWebP, saveHomePage);
}
