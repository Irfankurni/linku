import { Hono } from 'hono';
import type { Env, HonoVariables } from '../env.d';
import { signJwt, authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';
import {
  getUserByEmail,
  getUserByUsername,
  createUser,
  createRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  deleteAllRefreshTokensByUser,
} from '../lib/db';
import { registerSchema, loginSchema, checkUsernameSchema } from '../lib/validator';
import { ulid, now } from '../lib/ulid';

type AppEnv = { Bindings: Env; Variables: HonoVariables };

const auth = new Hono<AppEnv>();

const AUTH_RATE_LIMIT = rateLimitMiddleware({
  windowSeconds: 60,
  maxRequests:   10,
  keyPrefix:     'auth',
});

// Utility: hash password via Web Crypto PBKDF2
async function hashPassword(password: string): Promise<string> {
  const enc  = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key  = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
    key,
    256
  );
  const hashArr = new Uint8Array(bits);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArr).map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, saltHex, storedHash] = stored.split(':');
  if (!saltHex || !storedHash) return false;
  const enc     = new TextEncoder();
  const salt    = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const key     = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits    = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
    key,
    256
  );
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

async function generateTokens(
  c: { env: Env },
  user: { id: string; email: string; username: string; plan: string }
) {
  const accessExpiresIn  = parseInt(c.env.ACCESS_TOKEN_EXPIRES_IN);
  const refreshExpiresIn = parseInt(c.env.REFRESH_TOKEN_EXPIRES_IN);
  const iat = Math.floor(Date.now() / 1000);

  const accessToken = await signJwt(
    { sub: user.id, email: user.email, username: user.username, plan: user.plan, iat, exp: iat + accessExpiresIn },
    c.env.JWT_ACCESS_SECRET
  );

  const refreshToken = ulid();
  const refreshTokenHash = await sha256(refreshToken);
  const expiresAt = Date.now() + refreshExpiresIn * 1000;

  return { accessToken, refreshToken, refreshTokenHash, expiresAt };
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function setAuthCookies(
  headers: Headers,
  accessToken: string,
  refreshToken: string,
  env: Env,
  clear = false
) {
  const secure   = env.ENVIRONMENT === 'production' ? '; Secure' : '';
  const maxAge   = clear ? 0 : parseInt(env.ACCESS_TOKEN_EXPIRES_IN);
  const rMaxAge  = clear ? 0 : parseInt(env.REFRESH_TOKEN_EXPIRES_IN);

  headers.append('Set-Cookie', `access_token=${accessToken}; HttpOnly; SameSite=Strict; Path=/${secure}; Max-Age=${maxAge}`);
  headers.append('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; SameSite=Strict; Path=/api/auth/refresh${secure}; Max-Age=${rMaxAge}`);
}

// ── POST /api/auth/register ────────────────────────────────────────────────

auth.post('/register', AUTH_RATE_LIMIT, async (c) => {
  const body   = await c.req.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  const { email, username, display_name, password } = parsed.data;

  const existingEmail    = await getUserByEmail(c.env.DB, email);
  if (existingEmail)     return c.json({ success: false, error: { message: 'Email sudah digunakan', code: 'EMAIL_TAKEN' } }, 409);

  const existingUsername = await getUserByUsername(c.env.DB, username);
  if (existingUsername)  return c.json({ success: false, error: { message: 'Username sudah digunakan', code: 'USERNAME_TAKEN' } }, 409);

  const password_hash = await hashPassword(password);
  const user = await createUser(c.env.DB, { email, username, display_name, password_hash });
  if (!user) return c.json({ success: false, error: { message: 'Gagal membuat akun' } }, 500);

  const u = user as any;
  const { accessToken, refreshToken, refreshTokenHash, expiresAt } = await generateTokens(c, u);
  await createRefreshToken(c.env.DB, u.id, refreshTokenHash, expiresAt);

  const res = c.json({ success: true, data: { id: u.id, email: u.email, username: u.username, display_name: u.display_name, plan: u.plan } }, 201);
  setAuthCookies((await res).headers, accessToken, refreshToken, c.env);
  return res;
});

// ── POST /api/auth/login ───────────────────────────────────────────────────

auth.post('/login', AUTH_RATE_LIMIT, async (c) => {
  const body   = await c.req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ success: false, error: { message: 'Validasi gagal', issues: parsed.error.issues } }, 422);
  }

  const { email, password } = parsed.data;
  const user = await getUserByEmail(c.env.DB, email) as any;

  if (!user || !await verifyPassword(password, user.password_hash)) {
    return c.json({ success: false, error: { message: 'Email atau password salah', code: 'INVALID_CREDENTIALS' } }, 401);
  }

  if (!user.is_active) {
    return c.json({ success: false, error: { message: 'Akun tidak aktif', code: 'ACCOUNT_INACTIVE' } }, 403);
  }

  const { accessToken, refreshToken, refreshTokenHash, expiresAt } = await generateTokens(c, user);
  await createRefreshToken(c.env.DB, user.id, refreshTokenHash, expiresAt);

  const res = c.newResponse(
    JSON.stringify({ success: true, data: { id: user.id, email: user.email, username: user.username, display_name: user.display_name, plan: user.plan } }),
    200,
    { 'Content-Type': 'application/json' }
  );
  setAuthCookies(res.headers, accessToken, refreshToken, c.env);
  return res;
});

// ── POST /api/auth/refresh ─────────────────────────────────────────────────

auth.post('/refresh', async (c) => {
  const cookie = c.req.header('Cookie') ?? '';
  const match  = cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  const token  = match?.[1];

  if (!token) return c.json({ success: false, error: { message: 'No refresh token', code: 'NO_REFRESH_TOKEN' } }, 401);

  const tokenHash = await sha256(token);
  const stored    = await getRefreshToken(c.env.DB, tokenHash) as any;
  if (!stored)    return c.json({ success: false, error: { message: 'Token tidak valid', code: 'INVALID_REFRESH_TOKEN' } }, 401);

  // Token rotation: delete old, issue new
  await deleteRefreshToken(c.env.DB, tokenHash);

  const { accessToken, refreshToken: newRefresh, refreshTokenHash: newHash, expiresAt } = await generateTokens(
    c,
    { id: stored.user_id, email: '', username: '', plan: 'free' }
  );
  await createRefreshToken(c.env.DB, stored.user_id, newHash, expiresAt);

  const res = c.newResponse(JSON.stringify({ success: true }), 200, { 'Content-Type': 'application/json' });
  setAuthCookies(res.headers, accessToken, newRefresh, c.env);
  return res;
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────

auth.post('/logout', authMiddleware(), async (c) => {
  const cookie = c.req.header('Cookie') ?? '';
  const match  = cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/);
  if (match?.[1]) {
    const hash = await sha256(match[1]);
    await deleteRefreshToken(c.env.DB, hash);
  }

  const res = c.newResponse(JSON.stringify({ success: true }), 200, { 'Content-Type': 'application/json' });
  setAuthCookies(res.headers, '', '', c.env, true);
  return res;
});

// ── POST /api/auth/check-username ─────────────────────────────────────────

auth.post('/check-username', AUTH_RATE_LIMIT, async (c) => {
  const body   = await c.req.json().catch(() => ({}));
  const parsed = checkUsernameSchema.safeParse(body);
  if (!parsed.success) return c.json({ success: false, error: { message: 'Username tidak valid' } }, 422);

  const existing = await getUserByUsername(c.env.DB, parsed.data.username);
  return c.json({ success: true, data: { available: !existing } });
});

export { auth as authRoutes };
