// src/middleware/rateLimit.ts

// @ts-nocheck
// In-memory rate limiter for MVP.
// Keyed by orgId. Allows 1 request / second per org.

const lastCallByOrg: Record<string, number> = {};

export function checkRateLimit(orgId: string) {
  const now = Date.now();
  const last = lastCallByOrg[orgId] || 0;
  const minGapMs = 1000; // 1 second

  if (now - last < minGapMs) {
    const retryAfterSeconds = Math.ceil(
      (minGapMs - (now - last)) / 1000
    );

    return {
      ok: false,
      retryAfterSeconds,
    };
  }

  lastCallByOrg[orgId] = now;
  return { ok: true };
}
