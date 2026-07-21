import type { D1Database } from '@cloudflare/workers-types';
import type { Plan } from '../env.d';
import { ulid, now } from './ulid';

// ── Generic helpers ────────────────────────────────────────────────────────

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return { success: true as const, data, ...(meta ? { meta } : {}) };
}

export function fail(message: string, code?: string) {
  return { success: false as const, error: { message, code } };
}

// ── User queries ───────────────────────────────────────────────────────────

export async function getUserById(db: D1Database, id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}

export async function getUserByEmail(db: D1Database, email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
}

export async function getUserByUsername(db: D1Database, username: string) {
  return db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').bind(username).first();
}

export async function createUser(
  db: D1Database,
  data: {
    email: string;
    username: string;
    display_name: string;
    password_hash: string;
  }
) {
  const id = ulid();
  const ts = now();
  await db
    .prepare(
      `INSERT INTO users (id, email, username, display_name, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, data.email, data.username, data.display_name, data.password_hash, ts, ts)
    .run();
  return getUserById(db, id);
}

export async function updateUser(
  db: D1Database,
  id: string,
  fields: Partial<{
    display_name: string;
    bio: string;
    avatar_url: string | null;
    theme: string;
    settings: string;
    password_hash: string;
  }>
) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  await db
    .prepare(`UPDATE users SET ${setClauses}, updated_at = ? WHERE id = ?`)
    .bind(...values, now(), id)
    .run();
}

// ── Link queries ───────────────────────────────────────────────────────────

export async function getLinksByUserId(db: D1Database, userId: string) {
  return db
    .prepare('SELECT * FROM links WHERE user_id = ? ORDER BY position ASC, created_at ASC')
    .bind(userId)
    .all();
}

export async function getLinkById(db: D1Database, id: string, userId: string) {
  return db
    .prepare('SELECT * FROM links WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first();
}

export async function countLinksByUserId(db: D1Database, userId: string): Promise<number> {
  const result = await db
    .prepare('SELECT COUNT(*) as count FROM links WHERE user_id = ?')
    .bind(userId)
    .first<{ count: number }>();
  return result?.count ?? 0;
}

export async function createLink(
  db: D1Database,
  userId: string,
  data: {
    title: string;
    url: string;
    description?: string;
    icon_url?: string | null;
    type: string;
    is_featured: boolean;
    meta?: Record<string, unknown>;
  }
) {
  const id = ulid();
  const ts = now();
  // Position = max + 1
  const pos = await db
    .prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM links WHERE user_id = ?')
    .bind(userId)
    .first<{ next_pos: number }>();
  const position = pos?.next_pos ?? 0;

  await db
    .prepare(
      `INSERT INTO links (id, user_id, title, url, description, icon_url, type, is_featured, meta, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id, userId,
      data.title, data.url,
      data.description ?? null,
      data.icon_url ?? null,
      data.type,
      data.is_featured ? 1 : 0,
      JSON.stringify(data.meta ?? {}),
      position, ts, ts
    )
    .run();
  return getLinkById(db, id, userId);
}

export async function updateLink(
  db: D1Database,
  id: string,
  userId: string,
  fields: Partial<{
    title: string;
    url: string;
    description: string | null;
    icon_url: string | null;
    type: string;
    is_featured: number;
    meta: string;
    is_active: number;
  }>
) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  await db
    .prepare(`UPDATE links SET ${setClauses}, updated_at = ? WHERE id = ? AND user_id = ?`)
    .bind(...values, now(), id, userId)
    .run();
}

export async function deleteLink(db: D1Database, id: string, userId: string) {
  return db.prepare('DELETE FROM links WHERE id = ? AND user_id = ?').bind(id, userId).run();
}

export async function reorderLinks(db: D1Database, userId: string, orderedIds: string[]) {
  const stmts = orderedIds.map((id, index) =>
    db
      .prepare('UPDATE links SET position = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(index, now(), id, userId)
  );
  return db.batch(stmts);
}

// ── Analytics queries ──────────────────────────────────────────────────────

export async function insertAnalyticsEvent(
  db: D1Database,
  data: {
    user_id: string;
    entity_type: string;
    entity_id?: string;
    event: string;
    referrer?: string;
    country?: string;
    device?: string;
  }
) {
  const id = ulid();
  const ts = now();
  
  const stmts = [
    db.prepare(
      `INSERT INTO analytics (id, user_id, entity_type, entity_id, event, referrer, country, device, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.user_id,
      data.entity_type,
      data.entity_id ?? null,
      data.event,
      data.referrer ?? null,
      data.country ?? null,
      data.device ?? null,
      ts
    )
  ];

  if (data.entity_type === 'link' && data.event === 'click' && data.entity_id) {
    stmts.push(
      db.prepare(`UPDATE links SET click_count = click_count + 1 WHERE id = ?`).bind(data.entity_id)
    );
  }

  await db.batch(stmts);
}

export async function getAnalyticsSummary(
  db: D1Database,
  userId: string,
  days: number
) {
  const since = Date.now() - days * 86400 * 1000;
  return db
    .prepare(
      `SELECT
         event,
         COUNT(*) as count
       FROM analytics
       WHERE user_id = ? AND created_at >= ?
       GROUP BY event`
    )
    .bind(userId, since)
    .all();
}

export async function getAnalyticsByLinks(db: D1Database, userId: string, days: number) {
  const since = Date.now() - days * 86400 * 1000;
  return db
    .prepare(
      `SELECT
         a.entity_id,
         l.title,
         l.url,
         COUNT(*) as click_count
       FROM analytics a
       LEFT JOIN links l ON l.id = a.entity_id
       WHERE a.user_id = ? AND a.entity_type = 'link' AND a.event = 'click' AND a.created_at >= ?
       GROUP BY a.entity_id
       ORDER BY click_count DESC`
    )
    .bind(userId, since)
    .all();
}

export async function getAnalyticsByGeo(db: D1Database, userId: string, days: number) {
  const since = Date.now() - days * 86400 * 1000;
  return db
    .prepare(
      `SELECT country, COUNT(*) as count
       FROM analytics
       WHERE user_id = ? AND country IS NOT NULL AND created_at >= ?
       GROUP BY country
       ORDER BY count DESC
       LIMIT 20`
    )
    .bind(userId, since)
    .all();
}

export async function getAnalyticsByDevice(db: D1Database, userId: string, days: number) {
  const since = Date.now() - days * 86400 * 1000;
  return db
    .prepare(
      `SELECT device, COUNT(*) as count
       FROM analytics
       WHERE user_id = ? AND device IS NOT NULL AND created_at >= ?
       GROUP BY device
       ORDER BY count DESC`
    )
    .bind(userId, since)
    .all();
}

// ── Refresh tokens ─────────────────────────────────────────────────────────

export async function createRefreshToken(
  db: D1Database,
  userId: string,
  tokenHash: string,
  expiresAt: number
) {
  const id = ulid();
  await db
    .prepare(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, userId, tokenHash, expiresAt, now())
    .run();
}

export async function getRefreshToken(db: D1Database, tokenHash: string) {
  return db
    .prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > ?')
    .bind(tokenHash, now())
    .first();
}

export async function deleteRefreshToken(db: D1Database, tokenHash: string) {
  return db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').bind(tokenHash).run();
}

export async function deleteAllRefreshTokensByUser(db: D1Database, userId: string) {
  return db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').bind(userId).run();
}

// ── Public profile queries ─────────────────────────────────────────────────

export async function getPublicProfile(db: D1Database, username: string) {
  const user = await db
    .prepare(
      `SELECT id, username, display_name, avatar_url, bio, theme, settings
       FROM users WHERE username = ? AND is_active = 1`
    )
    .bind(username)
    .first();

  if (!user) return null;

  const [links] = await db.batch([
    db.prepare(
      'SELECT id, title, url, description, icon_url, type, is_featured, click_count FROM links WHERE user_id = ? AND is_active = 1 ORDER BY position ASC'
    ).bind((user as any).id)
  ]);

  return { user, links: links?.results ?? [] };
}

// ── Utility ────────────────────────────────────────────────────────────────

export function detectDevice(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad/.test(ua)) return 'tablet';
  if (/mobile|android|iphone/.test(ua)) return 'mobile';
  return 'desktop';
}
