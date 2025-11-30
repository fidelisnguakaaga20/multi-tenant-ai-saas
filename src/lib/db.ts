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

/**
 * Document helpers
 * Used by Proposal / Scope / Follow-up tools
 */
export const DocumentModel = {
  create(args: {
    orgId: string
    userId: string
    type: string // "PROPOSAL" | "SCOPE" | "FOLLOW_UP" etc.
    title: string
    content: string
  }) {
    const { orgId, userId, type, title, content } = args
    return prisma.document.create({
      data: {
        orgId,
        userId,
        type,
        title,
        content,
      },
    })
  },

  listForOrg(orgId: string) {
    return prisma.document.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })
  },

  getForOrg(orgId: string, id: string) {
    return prisma.document.findFirst({
      where: { id, orgId },
    })
  },

  updateForOrg(orgId: string, id: string, data: { title?: string; content?: string }) {
    return prisma.document.updateMany({
      where: { id, orgId },
      data,
    })
  },

  deleteForOrg(orgId: string, id: string) {
    return prisma.document.deleteMany({
      where: { id, orgId },
    })
  },
}

/**
 * Template helpers
 * Org-level templates for proposals / scopes / emails
 */
export const TemplateModel = {
  create(args: {
    orgId: string
    createdBy?: string | null
    type: string // "PROPOSAL" | "SCOPE" | "FOLLOW_UP"
    name: string
    body: string
  }) {
    const { orgId, createdBy, type, name, body } = args
    return prisma.template.create({
      data: {
        orgId,
        createdBy: createdBy ?? null,
        type,
        name,
        body,
      },
    })
  },

  listForOrg(orgId: string) {
    return prisma.template.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    })
  },

  getForOrg(orgId: string, id: string) {
    return prisma.template.findFirst({
      where: { id, orgId },
    })
  },

  updateForOrg(
    orgId: string,
    id: string,
    data: { name?: string; body?: string; type?: string },
  ) {
    return prisma.template.updateMany({
      where: { id, orgId },
      data,
    })
  },

  deleteForOrg(orgId: string, id: string) {
    return prisma.template.deleteMany({
      where: { id, orgId },
    })
  },
}

/**
 * Usage helpers
 * Used by usage/billing dashboard (later)
 */
export const UsageModel = {
  async incrementGenerations(orgId: string, month: string, amount: number = 1) {
    const existing = await prisma.usageRecord.findFirst({
      where: { orgId, month },
    })

    if (!existing) {
      return prisma.usageRecord.create({
        data: {
          orgId,
          month,
          generations: amount,
        },
      })
    }

    return prisma.usageRecord.update({
      where: { id: existing.id },
      data: {
        generations: existing.generations + amount,
      },
    })
  },

  getForOrgAndMonth(orgId: string, month: string) {
    return prisma.usageRecord.findFirst({
      where: { orgId, month },
    })
  },
}

