import { z } from 'zod';

// ── Shared ─────────────────────────────────────────────────────────────────

const paginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Auth ───────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email:        z.string().email().max(255),
  username:     z.string()
                  .min(3).max(32)
                  .regex(/^[a-z0-9_-]+$/, 'Username hanya boleh huruf kecil, angka, - dan _'),
  display_name: z.string().min(1).max(80),
  password:     z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const checkUsernameSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-z0-9_-]+$/),
});

// ── Users ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(80).optional(),
  bio:          z.string().max(300).optional(),
  avatar_url:   z.string().url().optional().nullable(),
  theme:        z.string().max(50).optional(),
  settings:     z.record(z.unknown()).optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password:     z.string().min(8).max(128),
});

// ── Links ──────────────────────────────────────────────────────────────────

export const linkTypeSchema = z.enum(['link', 'header', 'divider', 'embed']);

export const createLinkSchema = z.object({
  title:       z.string().min(1).max(100),
  url:         z.string().url(),
  description: z.string().max(300).optional(),
  icon_url:    z.string().url().optional().nullable(),
  type:        linkTypeSchema.default('link'),
  is_featured: z.boolean().default(false),
  meta:        z.record(z.unknown()).optional(),
});

export const updateLinkSchema = createLinkSchema.partial();

export const reorderSchema = z.object({
  ordered_ids: z.array(z.string()).min(1),
});

// ── Products ───────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  title:       z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  price:       z.number().int().min(0).optional().nullable(),
  currency:    z.string().length(3).default('IDR'),
  images:      z.array(z.string().url()).max(5).default([]),
  buy_url:     z.string().url().optional().nullable(),
  category:    z.string().max(50).optional().nullable(),
  slug:        z.string().min(1).max(80).regex(/^[a-z0-9-]+$/),
  stock:       z.number().int().min(0).optional().nullable(),
  is_featured: z.boolean().default(false),
  meta:        z.record(z.unknown()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ── Analytics ──────────────────────────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
}).merge(paginationSchema.pick({ page: true, limit: true }));

export const trackEventSchema = z.object({
  entity_type: z.enum(['page', 'link', 'product']),
  entity_id:   z.string().optional(),
  event:       z.enum(['view', 'click', 'buy_click']),
  referrer:    z.string().max(500).optional(),
});

// ── Image Upload ───────────────────────────────────────────────────────────

export const imageUploadResponseSchema = z.object({
  id:       z.string(),
  url:      z.string().url(),
  variants: z.array(z.string()),
});

export type RegisterInput        = z.infer<typeof registerSchema>;
export type LoginInput           = z.infer<typeof loginSchema>;
export type UpdateProfileInput   = z.infer<typeof updateProfileSchema>;
export type CreateLinkInput      = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput      = z.infer<typeof updateLinkSchema>;
export type ReorderInput         = z.infer<typeof reorderSchema>;
export type CreateProductInput   = z.infer<typeof createProductSchema>;
export type UpdateProductInput   = z.infer<typeof updateProductSchema>;
export type TrackEventInput      = z.infer<typeof trackEventSchema>;
export type AnalyticsQueryInput  = z.infer<typeof analyticsQuerySchema>;
