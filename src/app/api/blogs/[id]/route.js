import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getBlogById, updateBlog, deleteBlog } from '@/controllers/blog.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getBlogById);
}

export async function PUT(req, ctx) {
  return runRoute(req, ctx, uploadAny(), convertMultipleToWebP, updateBlog);
}

export async function DELETE(req, ctx) {
  return runRoute(req, ctx, verifyToken, deleteBlog);
}
