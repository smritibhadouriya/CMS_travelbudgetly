import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadSingle, convertToWebP } from '@/lib/upload';
import { getAllAuthors, createAuthor } from '@/controllers/author.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAllAuthors);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadSingle('imageFile'), convertToWebP, createAuthor);
}
