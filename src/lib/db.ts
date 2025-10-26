// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

// Prevent creating extra clients during dev hot reload.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
