/**
 * ULID generator — sortable, URL-safe unique IDs.
 * Optimized for Cloudflare Workers (no crypto.randomUUID dependency).
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = 281474976710655; // 2^48 - 1
const RANDOM_LEN = 16;

function randomChar(): string {
  const rand = Math.floor(Math.random() * ENCODING_LEN);
  return ENCODING[rand]!;
}

function encodeTime(now: number, len: number): string {
  if (now > TIME_MAX) throw new Error('Time too large to encode');
  let str = '';
  for (let i = len; i > 0; i--) {
    const mod = now % ENCODING_LEN;
    str = ENCODING[mod] + str;
    now = Math.floor(now / ENCODING_LEN);
  }
  return str;
}

function encodeRandom(len: number): string {
  let str = '';
  for (let i = 0; i < len; i++) {
    str += randomChar();
  }
  return str;
}

export function ulid(seedTime?: number): string {
  const now = seedTime ?? Date.now();
  return encodeTime(now, 10) + encodeRandom(RANDOM_LEN);
}

export function now(): number {
  return Date.now();
}
