import { Hono } from 'hono';
import type { Env, HonoVariables } from '../env.d';
import { getPublicProfile, getProductBySlug, insertAnalyticsEvent, detectDevice } from '../lib/db';
import { trackEventSchema } from '../lib/validator';

type AppEnv = { Bindings: Env; Variables: HonoVariables };

const pub = new Hono<AppEnv>();

// ── GET /p/:username ────────────────────────────────────────────────────────
// Full public profile — user + links + products in a single response
// Cached at CF edge for 60 seconds

pub.get('/:username', async (c) => {
  const username = c.req.param('username').toLowerCase();
  const profile  = await getPublicProfile(c.env.DB, username);

  if (!profile) {
    return c.json({ success: false, error: { message: 'Profil tidak ditemukan', code: 'NOT_FOUND' } }, 404);
  }

  const user = profile.user as any;

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        user: {
          ...user,
          settings: JSON.parse(user.settings ?? '{}'),
        },
        links:    profile.links,
        products: profile.products.map((p: any) => ({
          ...p,
          images: JSON.parse(p.images ?? '[]'),
        })),
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type':  'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    }
  );
});

// ── GET /p/:username/products/:slug ─────────────────────────────────────────

pub.get('/:username/products/:slug', async (c) => {
  const username = c.req.param('username').toLowerCase();
  const slug     = c.req.param('slug');

  const user = await c.env.DB
    .prepare('SELECT id FROM users WHERE username = ? AND is_active = 1')
    .bind(username)
    .first() as any;

  if (!user) return c.json({ success: false, error: { message: 'Profil tidak ditemukan' } }, 404);

  const product = await getProductBySlug(c.env.DB, user.id, slug) as any;
  if (!product)  return c.json({ success: false, error: { message: 'Produk tidak ditemukan' } }, 404);

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        ...product,
        images: JSON.parse(product.images ?? '[]'),
        meta:   JSON.parse(product.meta ?? '{}'),
      },
    }),
    {
      headers: {
        'Content-Type':  'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    }
  );
});

// ── POST /p/:username/track ─────────────────────────────────────────────────
// Fire-and-forget analytics tracking (no auth required)

pub.post('/:username/track', async (c) => {
  const username = c.req.param('username').toLowerCase();
  const body     = await c.req.json().catch(() => ({}));
  const parsed   = trackEventSchema.safeParse(body);

  if (!parsed.success) return c.json({ success: true }); // Fail silently for tracking

  const user = await c.env.DB
    .prepare('SELECT id FROM users WHERE username = ? AND is_active = 1')
    .bind(username)
    .first() as any;

  if (!user) return c.json({ success: true }); // Fail silently

  const country   = c.req.header('CF-IPCountry') ?? undefined;
  const userAgent = c.req.header('User-Agent')   ?? '';
  const device    = detectDevice(userAgent);
  const referrer  = c.req.header('Referer')       ?? undefined;

  // Fire and forget — don't await to keep response fast
  c.executionCtx.waitUntil(
    insertAnalyticsEvent(c.env.DB, {
      user_id:     user.id,
      entity_type: parsed.data.entity_type,
      entity_id:   parsed.data.entity_id,
      event:       parsed.data.event,
      referrer:    parsed.data.referrer ?? referrer,
      country,
      device,
    })
  );

  return c.json({ success: true });
});

// ── POST /p/:username/products/:slug/track ──────────────────────────────────

pub.post('/:username/products/:slug/track', async (c) => {
  const username = c.req.param('username').toLowerCase();
  const slug     = c.req.param('slug');

  const user = await c.env.DB
    .prepare('SELECT id FROM users WHERE username = ? AND is_active = 1')
    .bind(username)
    .first() as any;

  if (!user) return c.json({ success: true });

  const product = await getProductBySlug(c.env.DB, user.id, slug) as any;
  if (!product)  return c.json({ success: true });

  const country   = c.req.header('CF-IPCountry') ?? undefined;
  const userAgent = c.req.header('User-Agent')   ?? '';
  const device    = detectDevice(userAgent);

  c.executionCtx.waitUntil(
    insertAnalyticsEvent(c.env.DB, {
      user_id:     user.id,
      entity_type: 'product',
      entity_id:   product.id,
      event:       'buy_click',
      country,
      device,
    })
  );

  return c.json({ success: true });
});

export { pub as publicRoutes };
