// Cloudflare Workers binding types
export interface Env {
  // D1 Database
  DB: D1Database;

  // KV Namespaces
  RATE_LIMIT_KV: KVNamespace;

  // R2 Buckets
  BUCKET: R2Bucket;

  // Environment variables
  ENVIRONMENT: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_IMAGES_TOKEN: string;
  FRONTEND_URL: string;
  ACCESS_TOKEN_EXPIRES_IN: string;   // seconds as string
  REFRESH_TOKEN_EXPIRES_IN: string;  // seconds as string
}

// JWT payload shape
export interface JwtPayload {
  sub: string;        // user ID
  email: string;
  username: string;
  plan: Plan;
  iat: number;
  exp: number;
}

// Hono context variables (injected by auth middleware)
export interface HonoVariables {
  userId: string;
  email: string;
  username: string;
  plan: Plan;
}

export type Plan = 'free' | 'pro' | 'business';
