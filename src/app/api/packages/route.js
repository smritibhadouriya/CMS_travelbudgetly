import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getPackages, createPackage } from '@/controllers/package.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getPackages);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadAny(), convertMultipleToWebP, createPackage);
}
