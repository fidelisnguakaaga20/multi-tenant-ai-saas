// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log: ["query"], // /// enable if you want to debug
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;



// // src/lib/db.ts
// import { PrismaClient } from "@prisma/client";

// // Prevent creating extra clients during dev hot reload.
// declare global {
//   // eslint-disable-next-line no-var
//   var prisma: PrismaClient | undefined;
// }

// export const db =
//   global.prisma ??
//   new PrismaClient({
//     log: ["warn", "error"],
//   });

// if (process.env.NODE_ENV !== "production") {
//   global.prisma = db;
// }
