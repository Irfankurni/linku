import { Hono } from 'hono';
import type { Env, HonoVariables } from '../env.d';
import { authMiddleware } from '../middleware/auth';
import { PLAN_LIMITS } from '../lib/constants';
import {
  getAnalyticsSummary,
  getAnalyticsByLinks,
  getAnalyticsByProducts,
  getAnalyticsByGeo,
  getAnalyticsByDevice,
} from '../lib/db';
import { analyticsQuerySchema } from '../lib/validator';

type AppEnv = { Bindings: Env; Variables: HonoVariables };

const analytics = new Hono<AppEnv>();
analytics.use('*', authMiddleware());

function parseDays(c: { req: { query: (k: string) => string | undefined }; get: (k: string) => any }, plan: string): number {
  const raw     = c.req.query('days');
  const maxDays = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.analytics_days ?? 7;
  const days    = raw ? Math.min(parseInt(raw, 10), maxDays) : 7;
  return isNaN(days) || days < 1 ? 7 : days;
}

// ── GET /api/analytics/summary ─────────────────────────────────────────────

analytics.get('/summary', async (c) => {
  const userId = c.get('userId');
  const plan   = c.get('plan');
  const days   = parseDays(c as any, plan);
  const result = await getAnalyticsSummary(c.env.DB, userId, days);

  const summary = { views: 0, clicks: 0, buy_clicks: 0 };
  for (const row of result.results as any[]) {
    if (row.event === 'view')       summary.views      = row.count;
    if (row.event === 'click')      summary.clicks     = row.count;
    if (row.event === 'buy_click')  summary.buy_clicks = row.count;
  }

  return c.json({ success: true, data: { summary, days, plan_max_days: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.analytics_days ?? 7 } });
});

// ── GET /api/analytics/links ───────────────────────────────────────────────

analytics.get('/links', async (c) => {
  const userId = c.get('userId');
  const plan   = c.get('plan');
  const days   = parseDays(c as any, plan);
  const result = await getAnalyticsByLinks(c.env.DB, userId, days);
  return c.json({ success: true, data: result.results, days });
});

// ── GET /api/analytics/products ───────────────────────────────────────────

analytics.get('/products', async (c) => {
  const userId = c.get('userId');
  const plan   = c.get('plan');
  const days   = parseDays(c as any, plan);
  const result = await getAnalyticsByProducts(c.env.DB, userId, days);
  return c.json({ success: true, data: result.results, days });
});

// ── GET /api/analytics/geo ─────────────────────────────────────────────────
// PRO/Business only

analytics.get('/geo', async (c) => {
  const plan = c.get('plan');
  if (!PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.geo_analytics) {
    return c.json({ success: false, error: { message: 'Fitur ini memerlukan plan Pro atau lebih tinggi.', code: 'PLAN_REQUIRED' } }, 403);
  }
  const userId = c.get('userId');
  const days   = parseDays(c as any, plan);
  const result = await getAnalyticsByGeo(c.env.DB, userId, days);
  return c.json({ success: true, data: result.results, days });
});

// ── GET /api/analytics/devices ─────────────────────────────────────────────
// PRO/Business only

analytics.get('/devices', async (c) => {
  const plan = c.get('plan');
  if (!PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.device_analytics) {
    return c.json({ success: false, error: { message: 'Fitur ini memerlukan plan Pro atau lebih tinggi.', code: 'PLAN_REQUIRED' } }, 403);
  }
  const userId = c.get('userId');
  const days   = parseDays(c as any, plan);
  const result = await getAnalyticsByDevice(c.env.DB, userId, days);
  return c.json({ success: true, data: result.results, days });
});

export { analytics as analyticsRoutes };
