import { runRoute } from '@/lib/express-adapter';
import { uploadAny } from '@/lib/upload';
import { deleteImage } from '@/controllers/cleanupImages.controller.js';

export async function DELETE(req, ctx) {
  return runRoute(req, ctx, uploadAny(), deleteImage);
}
