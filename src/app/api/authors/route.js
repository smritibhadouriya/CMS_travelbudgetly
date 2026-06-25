import { runRoute } from '@/lib/express-adapter';
import { uploadSingle, convertToWebP } from '@/lib/upload';
import { getAllAuthors, createAuthor } from '@/controllers/author.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAllAuthors);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, uploadSingle('imageFile'), convertToWebP, createAuthor);
}
