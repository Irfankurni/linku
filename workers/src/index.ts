import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, HonoVariables } from './env.d';
import { authRoutes }      from './routes/auth.routes';
import { usersRoutes }     from './routes/users.routes';
import { linksRoutes }     from './routes/links.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { publicRoutes }    from './routes/public.routes';
import { uploadRoutes }    from './routes/upload.routes';

const app = new Hono<{ Bindings: Env; Variables: HonoVariables }>();

// ── Global Middleware ──────────────────────────────────────────────────────

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin:           (origin) => origin ?? '*',
    allowHeaders:     ['Content-Type', 'Authorization'],
    allowMethods:     ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials:      true,
    exposeHeaders:    ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge:           86400,
  });
  return corsMiddleware(c, next);
});

// ── Health check ───────────────────────────────────────────────────────────

app.get('/', (c) => c.json({ status: 'ok', version: '1.0.0', timestamp: Date.now() }));

// ── API Routes ─────────────────────────────────────────────────────────────

app.route('/api/auth',      authRoutes);
app.route('/api/users',     usersRoutes);
app.route('/api/links',     linksRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/upload',    uploadRoutes);

// ── Public Routes (no auth, CF-cached) ────────────────────────────────────

app.route('/p', publicRoutes);

// ── 404 fallback ───────────────────────────────────────────────────────────

app.notFound((c) => c.json({ success: false, error: { message: 'Endpoint tidak ditemukan', code: 'NOT_FOUND' } }, 404));

// ── Global error handler ───────────────────────────────────────────────────

app.onError((err, c) => {
  console.error('[Worker Error]', err);
  return c.json({ success: false, error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } }, 500);
});

export default app;
