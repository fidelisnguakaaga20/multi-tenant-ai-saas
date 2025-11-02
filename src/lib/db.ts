// src/lib/db.ts
import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined
}

// /// Create a single PrismaClient during dev to avoid connection storms with PgBouncer
function createClient() {
  return new PrismaClient({
    log: ['warn', 'error'], // /// enable query logs if needed: ['query','warn','error']
  })
}

export const prisma: PrismaClient =
  global.__PRISMA__ ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  global.__PRISMA__ = prisma
}

// /// Quick connectivity probe (optional)
export async function dbPing() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (e) {
    console.error('[db_ping_failed]', e)
    return false
  }
}



// // src/lib/db.ts
// import { PrismaClient } from "@prisma/client";

// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// export const prisma =
//   globalForPrisma.prisma ||
//   new PrismaClient({
//     // log: ["query"], // /// enable if you want to debug
//   });

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

