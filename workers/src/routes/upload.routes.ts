import { Hono } from 'hono';
import type { Env, HonoVariables } from '../env.d';
import { authMiddleware } from '../middleware/auth';
import { ulid } from '../lib/ulid';

type AppEnv = { Bindings: Env; Variables: HonoVariables };

const upload = new Hono<AppEnv>();

// ── GET /api/upload/:filename ─────────────────────────────────────────────
// Serve the file from R2
upload.get('/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  if (!c.env.BUCKET) {
    return c.json({ success: false, error: { message: 'R2 Bucket is not configured' } }, 500);
  }

  const object = await c.env.BUCKET.get(filename);
  if (!object) {
    return c.json({ success: false, error: { message: 'File not found' } }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

  return new Response(object.body, {
    headers,
  });
});

// ── POST /api/upload ──────────────────────────────────────────────────────
// Upload a file to R2
upload.post('/', authMiddleware(), async (c) => {
  if (!c.env.BUCKET) {
    return c.json({ success: false, error: { message: 'R2 Bucket is not configured' } }, 500);
  }

  const body = await c.req.parseBody();
  const file = body['file'] as File;

  if (!file) {
    return c.json({ success: false, error: { message: 'No file provided' } }, 400);
  }

  // Basic validation (limit to 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({ success: false, error: { message: 'File is too large (max 5MB)' } }, 400);
  }

  const extension = file.name.split('.').pop() || '';
  const newFileName = `${ulid()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  
  await c.env.BUCKET.put(newFileName, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Construct URL
  const url = new URL(c.req.url);
  const fileUrl = `${url.origin}/api/upload/${newFileName}`;

  return c.json({
    success: true,
    data: {
      url: fileUrl,
    }
  });
});

export { upload as uploadRoutes };
