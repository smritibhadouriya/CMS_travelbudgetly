import { runRoute } from '@/lib/express-adapter';
import { updateRedirect, deleteRedirect } from '@/controllers/redirect.controller.js';

export async function PUT(req, ctx) {
  return runRoute(req, ctx, updateRedirect);
}

export async function DELETE(req, ctx) {
  return runRoute(req, ctx, deleteRedirect);
}
