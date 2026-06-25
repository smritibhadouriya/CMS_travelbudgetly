import { runRoute } from '@/lib/express-adapter';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getOffer, updateOffer, deleteOffer } from '@/controllers/offer.controller.js';

// getOffer reads `:slug`, update/delete read `:id` — alias the single segment.
async function aliasedCtx(ctx) {
  const p = (await ctx.params) || {};
  const value = p.slug;
  return { params: { slug: value, id: value } };
}

export async function GET(req, ctx) {
  return runRoute(req, await aliasedCtx(ctx), getOffer);
}

export async function PUT(req, ctx) {
  return runRoute(req, await aliasedCtx(ctx), uploadAny(), convertMultipleToWebP, updateOffer);
}

export async function DELETE(req, ctx) {
  return runRoute(req, await aliasedCtx(ctx), deleteOffer);
}
