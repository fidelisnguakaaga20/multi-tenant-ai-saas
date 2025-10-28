// src/lib/logger.ts

// @ts-nocheck
export function logServerError(tag: string, err: any) {
  console.error(`[${tag}]`, {
    message: err?.message || String(err),
    stack: err?.stack || null,
  });
}
