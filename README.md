# Linku — Advanced Link-in-Bio Platform

A full-stack platform for creating personal bio pages with links, customizable themes, and analytics — all in one place.

## 🏗️ Project Structure

This is a monorepo containing two separate applications:

```
linku/
├── frontend/   # Angular 22 SSR app (UI)
└── workers/    # Cloudflare Workers API (Backend + D1 + KV)
```

## ✨ Features

- 🔗 Link-in-Bio pages with custom slugs
- 🎨 Beautiful themes and appearance customization
- 📊 Analytics dashboard
- 🔐 JWT-based authentication (access + refresh tokens)
- ⚡ Edge-first backend on Cloudflare Workers
- 🗄️ Persistent storage via Cloudflare D1 (SQLite) & KV

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 22, SSR, Tailwind CSS v4 |
| Backend | Cloudflare Workers (Hono / TypeScript) |
| Database | Cloudflare D1 (SQLite at the edge) |
| Cache / Rate Limit | Cloudflare KV |
| Auth | JWT (access + refresh tokens) |
| Image Storage | Cloudflare Images |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)
- A Cloudflare account

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/linku.git
cd linku
```

### 2. Setup Workers (Backend)

```bash
cd workers
npm install

# Copy and configure your environment
cp wrangler.toml wrangler.toml.bak
# Edit wrangler.toml and fill in your Cloudflare IDs and secrets

# Run D1 migration
wrangler d1 execute web-bio-db --local --file=schema.sql

# Start local dev server
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install

# Start Angular dev server
ng serve
```

The frontend will be available at `http://localhost:4200` and the Workers API at `http://localhost:8787`.

## ⚙️ Environment Configuration

Before deploying, update `workers/wrangler.toml` with your actual values:

| Variable | Description |
|----------|--------------|
| `database_id` | Your Cloudflare D1 database ID |
| `RATE_LIMIT_KV` id | Your Cloudflare KV namespace ID |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `CLOUDFLARE_IMAGES_TOKEN` | API token for Cloudflare Images |
| `JWT_ACCESS_SECRET` | Strong random secret for access tokens |
| `JWT_REFRESH_SECRET` | Strong random secret for refresh tokens |
| `FRONTEND_URL` | Your production frontend URL |

> ⚠️ **Never commit real secrets to this file.** Use `wrangler secret put` for production secrets.

## 📦 Deployment

### Deploy Workers

```bash
cd workers
wrangler deploy
```

### Deploy Frontend

```bash
cd frontend
ng build
# Deploy the dist/ folder to your preferred hosting (Cloudflare Pages, Vercel, etc.)
```

## 📄 License

MIT
