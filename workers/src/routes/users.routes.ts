import { Hono } from 'hono';
import type { Env, HonoVariables } from '../env.d';
import { authMiddleware } from '../middleware/auth';
import { getUserById, updateUser } from '../lib/db';
import { updateProfileSchema, changePasswordSchema } from '../lib/validator';
import { PLAN_LIMITS } from '../lib/constants';

type AppEnv = { Bindings: Env; Variables: HonoVariables };

const users = new Hono<AppEnv>();

// Apply auth to all routes in this router
users.use('*', authMiddleware());

// ── GET /api/users/me ──────────────────────────────────────────────────────

users.get('/me', async (c) => {
  const userId = c.get('userId');
  const user   = await getUserById(c.env.DB, userId) as any;
  if (!user) return c.json({ success: false, error: { message: 'User tidak ditemukan' } }, 404);

  const { password_hash: _, ...safeUser } = user;
  return c.json({ success: true, data: { ...safeUser, settings: JSON.parse(safeUser.settings ?? '{}') } });
});

// ── PATCH /api/users/me ────────────────────────────────────────────────────

users.patch('/me', async (c) => {
  const body   = await c.req.json().catch(() => ({}));
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  const userId = c.get('userId');
  const plan   = c.get('plan');
  const { settings, ...rest } = parsed.data;

  if (plan === 'free') {
    if (rest.theme && rest.theme !== 'default') {
      return c.json({ success: false, error: { message: 'Fitur kustom tema hanya untuk pengguna Pro.', code: 'PLAN_REQUIRED' } }, 403);
    }
    if (settings && (settings as any).background_url) {
      return c.json({ success: false, error: { message: 'Fitur background kustom hanya untuk pengguna Pro.', code: 'PLAN_REQUIRED' } }, 403);
    }
  }

  await updateUser(c.env.DB, userId, {
    ...rest,
    ...(settings ? { settings: JSON.stringify(settings) } : {}),
  });

  const updated = await getUserById(c.env.DB, userId) as any;
  const { password_hash: _, ...safeUser } = updated;
  return c.json({ success: true, data: { ...safeUser, settings: JSON.parse(safeUser.settings ?? '{}') } });
});

// ── GET /api/users/me/plan ─────────────────────────────────────────────────

users.get('/me/plan', async (c) => {
  const plan   = c.get('plan');
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  return c.json({ success: true, data: { plan, limits } });
});

// ── DELETE /api/users/me ───────────────────────────────────────────────────

users.delete('/me', async (c) => {
  const userId = c.get('userId');
  await c.env.DB.prepare('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?')
    .bind(Date.now(), userId)
    .run();
  return c.json({ success: true, data: { message: 'Akun berhasil dinonaktifkan' } });
});

export { users as usersRoutes };
