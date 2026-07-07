import { Hono } from 'hono';
import type { Env, HonoVariables } from '../env.d';
import { authMiddleware } from '../middleware/auth';
import { PLAN_LIMITS } from '../lib/constants';
import {
  getProductsByUserId,
  getProductById,
  countProductsByUserId,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
} from '../lib/db';
import { createProductSchema, updateProductSchema, reorderSchema } from '../lib/validator';

type AppEnv = { Bindings: Env; Variables: HonoVariables };

const products = new Hono<AppEnv>();
products.use('*', authMiddleware());

// Helper: parse product row (JSON fields)
function parseProduct(p: Record<string, unknown>) {
  return {
    ...p,
    images:      JSON.parse((p.images as string) ?? '[]'),
    meta:        JSON.parse((p.meta as string) ?? '{}'),
    is_active:   Boolean(p.is_active),
    is_featured: Boolean(p.is_featured),
  };
}

// ── GET /api/products ──────────────────────────────────────────────────────

products.get('/', async (c) => {
  const userId = c.get('userId');
  const result = await getProductsByUserId(c.env.DB, userId);
  return c.json({ success: true, data: result.results.map(p => parseProduct(p as any)) });
});

// ── POST /api/products ─────────────────────────────────────────────────────

products.post('/', async (c) => {
  const plan    = c.get('plan');
  const userId  = c.get('userId');
  const limit   = PLAN_LIMITS[plan]?.products ?? PLAN_LIMITS.free.products;
  const current = await countProductsByUserId(c.env.DB, userId);

  if (limit !== -1 && current >= limit) {
    return c.json({
      success: false,
      error: {
        message: `Batas produk untuk plan ${plan} adalah ${limit}. Upgrade ke Pro untuk menambah lebih banyak.`,
        code: 'PLAN_LIMIT_REACHED',
      },
    }, 403);
  }

  const body   = await c.req.json().catch(() => ({}));
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  // Check slug uniqueness per user
  const slugCheck = await c.env.DB
    .prepare('SELECT id FROM products WHERE user_id = ? AND slug = ?')
    .bind(userId, parsed.data.slug)
    .first();
  if (slugCheck) {
    return c.json({ success: false, error: { message: 'Slug sudah digunakan', code: 'SLUG_TAKEN' } }, 409);
  }

  const product = await createProduct(c.env.DB, userId, parsed.data) as any;
  if (!product) return c.json({ success: false, error: { message: 'Gagal membuat produk' } }, 500);

  return c.json({ success: true, data: parseProduct(product) }, 201);
});

// ── PATCH /api/products/:id ────────────────────────────────────────────────

products.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id     = c.req.param('id');
  const exists = await getProductById(c.env.DB, id, userId);
  if (!exists) return c.json({ success: false, error: { message: 'Produk tidak ditemukan' } }, 404);

  const body   = await c.req.json().catch(() => ({}));
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  const { images, meta, is_featured, ...rest } = parsed.data;
  await updateProduct(c.env.DB, id, userId, {
    ...rest,
    ...(images      !== undefined ? { images: JSON.stringify(images) }        : {}),
    ...(meta        !== undefined ? { meta:   JSON.stringify(meta) }           : {}),
    ...(is_featured !== undefined ? { is_featured: is_featured ? 1 : 0 }      : {}),
  });

  const updated = await getProductById(c.env.DB, id, userId);
  return c.json({ success: true, data: parseProduct(updated as any) });
});

// ── DELETE /api/products/:id ───────────────────────────────────────────────

products.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id     = c.req.param('id');
  const exists = await getProductById(c.env.DB, id, userId);
  if (!exists) return c.json({ success: false, error: { message: 'Produk tidak ditemukan' } }, 404);

  await deleteProduct(c.env.DB, id, userId);
  return c.json({ success: true, data: { message: 'Produk berhasil dihapus' } });
});

// ── POST /api/products/reorder ─────────────────────────────────────────────

products.post('/reorder', async (c) => {
  const userId = c.get('userId');
  const body   = await c.req.json().catch(() => ({}));
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  await reorderProducts(c.env.DB, userId, parsed.data.ordered_ids);
  return c.json({ success: true, data: { message: 'Urutan berhasil disimpan' } });
});

// ── PATCH /api/products/:id/toggle ────────────────────────────────────────

products.patch('/:id/toggle', async (c) => {
  const userId  = c.get('userId');
  const id      = c.req.param('id');
  const product = await getProductById(c.env.DB, id, userId) as any;
  if (!product) return c.json({ success: false, error: { message: 'Produk tidak ditemukan' } }, 404);

  await updateProduct(c.env.DB, id, userId, { is_active: product.is_active ? 0 : 1 });
  return c.json({ success: true, data: { is_active: !product.is_active } });
});

// ── POST /api/products/upload-image ────────────────────────────────────────
// Upload gambar ke Cloudflare Images, return URL

products.post('/upload-image', async (c) => {
  const formData = await c.req.formData();
  const file     = formData.get('file') as File | null;

  if (!file) {
    return c.json({ success: false, error: { message: 'File tidak ditemukan' } }, 400);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: { message: 'Tipe file tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.' } }, 400);
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return c.json({ success: false, error: { message: 'Ukuran file maksimal 5MB' } }, 400);
  }

  const form = new FormData();
  form.append('file', file);

  const uploadRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_IMAGES_TOKEN}` },
      body: form,
    }
  );

  const result = await uploadRes.json() as any;
  if (!result.success) {
    return c.json({ success: false, error: { message: 'Gagal upload gambar ke Cloudflare Images' } }, 500);
  }

  return c.json({
    success: true,
    data: {
      id:       result.result.id,
      url:      result.result.variants[0],
      variants: result.result.variants,
    },
  });
});

export { products as productsRoutes };
