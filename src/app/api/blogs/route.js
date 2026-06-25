import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getBlogs, createBlog } from '@/controllers/blog.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getBlogs);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadAny(), convertMultipleToWebP, createBlog);
}
