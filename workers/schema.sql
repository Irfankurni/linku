-- =============================================================
-- Micro-Catalog & Link-in-Bio — Cloudflare D1 Schema
-- Engine: SQLite (D1)
-- ID format: ULID (TEXT, sortable, URL-safe)
-- Timestamp: INTEGER (Unix epoch milliseconds)
-- =============================================================

-- PRAGMA journal_mode = WAL;
-- PRAGMA foreign_keys = ON;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  username        TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  plan            TEXT NOT NULL DEFAULT 'free'
                  CHECK(plan IN ('free', 'pro', 'business')),
  plan_expires_at INTEGER,
  theme           TEXT NOT NULL DEFAULT 'default',
  settings        TEXT NOT NULL DEFAULT '{}',
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username  ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan      ON users(plan);

-- ============================================================
-- TABLE: refresh_tokens
-- Untuk JWT refresh token rotation (stateless auth dengan revoke)
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash    ON refresh_tokens(token_hash);

-- ============================================================
-- TABLE: links
-- ============================================================
CREATE TABLE IF NOT EXISTS links (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,
  description  TEXT,
  icon_url     TEXT,
  type         TEXT NOT NULL DEFAULT 'link'
               CHECK(type IN ('link', 'header', 'divider', 'embed')),
  position     INTEGER NOT NULL DEFAULT 0,
  is_active    INTEGER NOT NULL DEFAULT 1,
  is_featured  INTEGER NOT NULL DEFAULT 0,
  meta         TEXT NOT NULL DEFAULT '{}',
  click_count  INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_links_user_position ON links(user_id, position);
CREATE INDEX IF NOT EXISTS idx_links_user_active   ON links(user_id, is_active);

-- ============================================================
-- TABLE: analytics
-- Append-only event log. Hapus data lama via scheduled Worker.
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type  TEXT NOT NULL
               CHECK(entity_type IN ('page', 'link', 'product')),
  entity_id    TEXT,
  event        TEXT NOT NULL
               CHECK(event IN ('view', 'click', 'buy_click')),
  referrer     TEXT,
  country      TEXT(2),
  device       TEXT
               CHECK(device IN ('mobile', 'desktop', 'tablet', NULL)),
  created_at   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_time  ON analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_entity     ON analytics(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event      ON analytics(user_id, event, created_at DESC);
