import { Hono } from 'hono';
import type { Env, HonoVariables } from '../env.d';
import { authMiddleware } from '../middleware/auth';
import { PLAN_LIMITS } from '../lib/constants';
import {
  getLinksByUserId,
  getLinkById,
  countLinksByUserId,
  createLink,
  updateLink,
  deleteLink,
  reorderLinks,
} from '../lib/db';
import { createLinkSchema, updateLinkSchema, reorderSchema } from '../lib/validator';

type AppEnv = { Bindings: Env; Variables: HonoVariables };

const links = new Hono<AppEnv>();
links.use('*', authMiddleware());

// ── GET /api/links ─────────────────────────────────────────────────────────

links.get('/', async (c) => {
  const userId = c.get('userId');
  const result = await getLinksByUserId(c.env.DB, userId);
  return c.json({
    success: true,
    data: result.results.map(l => ({
      ...(l as any),
      meta: JSON.parse((l as any).meta ?? '{}'),
      is_active:   Boolean((l as any).is_active),
      is_featured: Boolean((l as any).is_featured),
    })),
  });
});

// ── POST /api/links ────────────────────────────────────────────────────────

links.post('/', async (c) => {
  const plan    = c.get('plan');
  const userId  = c.get('userId');
  const limit   = PLAN_LIMITS[plan]?.links ?? PLAN_LIMITS.free.links;
  const current = await countLinksByUserId(c.env.DB, userId);

  if (limit !== -1 && current >= limit) {
    return c.json({
      success: false,
      error: {
        message: `Batas link untuk plan ${plan} adalah ${limit}. Upgrade ke Pro untuk menambah lebih banyak.`,
        code: 'PLAN_LIMIT_REACHED',
      },
    }, 403);
  }

  const body   = await c.req.json().catch(() => ({}));
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  const link = await createLink(c.env.DB, userId, parsed.data) as any;
  if (!link) return c.json({ success: false, error: { message: 'Gagal membuat link' } }, 500);

  return c.json({
    success: true,
    data: { ...link, meta: JSON.parse(link.meta ?? '{}'), is_active: Boolean(link.is_active), is_featured: Boolean(link.is_featured) },
  }, 201);
});

// ── PATCH /api/links/:id ───────────────────────────────────────────────────

links.patch('/:id', async (c) => {
  const userId = c.get('userId');
  const id     = c.req.param('id');
  const exists = await getLinkById(c.env.DB, id, userId);
  if (!exists) return c.json({ success: false, error: { message: 'Link tidak ditemukan' } }, 404);

  const body   = await c.req.json().catch(() => ({}));
  const parsed = updateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  const { meta, is_featured, ...rest } = parsed.data;
  await updateLink(c.env.DB, id, userId, {
    ...rest,
    ...(meta        !== undefined ? { meta: JSON.stringify(meta) }          : {}),
    ...(is_featured !== undefined ? { is_featured: is_featured ? 1 : 0 }   : {}),
  });

  const updated = await getLinkById(c.env.DB, id, userId) as any;
  return c.json({ success: true, data: { ...updated, meta: JSON.parse(updated.meta ?? '{}') } });
});

// ── DELETE /api/links/:id ──────────────────────────────────────────────────

links.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id     = c.req.param('id');
  const exists = await getLinkById(c.env.DB, id, userId);
  if (!exists) return c.json({ success: false, error: { message: 'Link tidak ditemukan' } }, 404);

  await deleteLink(c.env.DB, id, userId);
  return c.json({ success: true, data: { message: 'Link berhasil dihapus' } });
});

// ── POST /api/links/reorder ────────────────────────────────────────────────

links.post('/reorder', async (c) => {
  const userId = c.get('userId');
  const body   = await c.req.json().catch(() => ({}));
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  await reorderLinks(c.env.DB, userId, parsed.data.ordered_ids);
  return c.json({ success: true, data: { message: 'Urutan berhasil disimpan' } });
});

// ── PATCH /api/links/:id/toggle ────────────────────────────────────────────

links.patch('/:id/toggle', async (c) => {
  const userId = c.get('userId');
  const id     = c.req.param('id');
  const link   = await getLinkById(c.env.DB, id, userId) as any;
  if (!link) return c.json({ success: false, error: { message: 'Link tidak ditemukan' } }, 404);

  await updateLink(c.env.DB, id, userId, { is_active: link.is_active ? 0 : 1 });
  return c.json({ success: true, data: { is_active: !link.is_active } });
});

export { links as linksRoutes };
