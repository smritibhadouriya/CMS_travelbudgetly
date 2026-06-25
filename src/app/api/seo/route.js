import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getSeoByPage, saveSeoByPage } from '@/controllers/seo.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getSeoByPage);
}

export async function PUT(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadAny(), convertMultipleToWebP, saveSeoByPage);
}
