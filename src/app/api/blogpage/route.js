import { runRoute } from '@/lib/express-adapter';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getBlogPage, saveBlogPage } from '@/controllers/blogPage.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getBlogPage);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, uploadAny(), convertMultipleToWebP, saveBlogPage);
}
