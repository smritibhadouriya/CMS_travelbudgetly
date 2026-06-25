import { runRoute } from '@/lib/express-adapter';
import { deleteSubscriber } from '@/controllers/newsletter.controller.js';

export async function DELETE(req, ctx) {
  return runRoute(req, ctx, deleteSubscriber);
}
