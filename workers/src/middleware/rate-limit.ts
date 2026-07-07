import type { Context, Next } from 'hono';
import type { Env } from '../env.d';

/**
 * Rate Limiting Middleware via Cloudflare KV.
 * Key format: "rl:{clientIp}:{route_prefix}" → count
 */

interface RateLimitOptions {
  windowSeconds: number;
  maxRequests:   number;
  keyPrefix:     string;
}

export function rateLimitMiddleware(opts: RateLimitOptions) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const ip  = c.req.header('CF-Connecting-IP') ?? 'unknown';
    const key = `rl:${ip}:${opts.keyPrefix}`;

    const raw   = await c.env.RATE_LIMIT_KV.get(key);
    const count = raw ? parseInt(raw, 10) : 0;

    if (count >= opts.maxRequests) {
      return c.json(
        { success: false, error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
        429
      );
    }

    // Increment counter; reset after window
    const newCount = count + 1;
    await c.env.RATE_LIMIT_KV.put(key, String(newCount), {
      expirationTtl: opts.windowSeconds,
    });

    c.header('X-RateLimit-Limit',     String(opts.maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, opts.maxRequests - newCount)));

    return next();
  };
}
