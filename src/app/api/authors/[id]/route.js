import { runRoute } from '@/lib/express-adapter';
import { uploadSingle, convertToWebP } from '@/lib/upload';
import { getAuthorById, updateAuthor, deleteAuthor } from '@/controllers/author.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getAuthorById);
}

export async function PUT(req, ctx) {
  return runRoute(req, ctx, uploadSingle('imageFile'), convertToWebP, updateAuthor);
}

export async function DELETE(req, ctx) {
  return runRoute(req, ctx, deleteAuthor);
}
