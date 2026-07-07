import type { Context, Next } from 'hono';
import type { Env, HonoVariables } from '../env.d';

/**
 * JWT Stateless Auth Middleware
 *
 * Verifikasi JWT dari httpOnly cookie "access_token".
 * Inject userId, email, username, plan ke Hono context variables.
 *
 * Menggunakan Web Crypto API (native di Cloudflare Workers).
 */

type HonoContext = Context<{ Bindings: Env; Variables: HonoVariables }>;

async function importSecret(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];

  try {
    const key = await importSecret(secret);
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const headerB64  = encode(header);
  const payloadB64 = encode(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importSecret(secret);
  const sigBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signingInput)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signingInput}.${sigB64}`;
}

export function authMiddleware() {
  return async (c: HonoContext, next: Next) => {
    const token = getCookieToken(c) ?? getBearerToken(c);

    if (!token) {
      return c.json({ success: false, error: { message: 'Unauthorized', code: 'NO_TOKEN' } }, 401);
    }

    const payload = await verifyJwt(token, c.env.JWT_ACCESS_SECRET);
    if (!payload) {
      return c.json({ success: false, error: { message: 'Token tidak valid atau kadaluarsa', code: 'INVALID_TOKEN' } }, 401);
    }

    c.set('userId',   payload['sub'] as string);
    c.set('email',    payload['email'] as string);
    c.set('username', payload['username'] as string);
    c.set('plan',     payload['plan'] as any);

    return next();
  };
}

function getCookieToken(c: HonoContext): string | undefined {
  const cookie = c.req.header('Cookie') ?? '';
  const match  = cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match?.[1];
}

function getBearerToken(c: HonoContext): string | undefined {
  const auth = c.req.header('Authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return undefined;
}
