// Serves uploaded images at /api/upload/<file> (replaces Express static mount).
import fs from 'fs';
import path from 'path';
import { uploadDir } from '@/lib/upload';

const MIME = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export async function GET(_req, ctx) {
  const { file } = (await ctx.params) || {};
  const name = decodeURIComponent(file || '');

  // Path-traversal guard
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return new Response('Bad request', { status: 400 });
  }

  const filePath = path.join(uploadDir, name);
  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const data = await fs.promises.readFile(filePath);
  const ext = path.extname(name).toLowerCase();
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
