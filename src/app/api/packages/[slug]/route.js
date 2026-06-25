import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getPackage, updatePackage, deletePackage } from '@/controllers/package.controller.js';

// getPackage reads `:slug`, update/delete read `:id` — expose the single
// segment value under BOTH keys.
async function aliasedCtx(ctx) {
  const p = (await ctx.params) || {};
  const value = p.slug;
  return { params: { slug: value, id: value } };
}

export async function GET(req, ctx) {
  return runRoute(req, await aliasedCtx(ctx), getPackage);
}

export async function PUT(req, ctx) {
  return runRoute(req, await aliasedCtx(ctx), uploadAny(), convertMultipleToWebP, updatePackage);
}

export async function DELETE(req, ctx) {
  return runRoute(req, await aliasedCtx(ctx), verifyToken, deletePackage);
}
