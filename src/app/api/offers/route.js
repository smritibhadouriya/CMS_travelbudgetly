import { runRoute } from '@/lib/express-adapter';
import { verifyToken } from '@/middleware/auth.middleware';
import { uploadAny, convertMultipleToWebP } from '@/lib/upload';
import { getOffers, createOffer } from '@/controllers/offer.controller.js';

export async function GET(req, ctx) {
  return runRoute(req, ctx, getOffers);
}

export async function POST(req, ctx) {
  return runRoute(req, ctx, verifyToken, uploadAny(), convertMultipleToWebP, createOffer);
}
