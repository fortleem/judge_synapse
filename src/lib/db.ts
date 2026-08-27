import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client — Turso for production, local SQLite for dev
// On Vercel, TURSO_DATABASE_URL is available at module load time
const tursoUrl = process.env.TURSO_DATABASE_URL

function createPrismaClient(): PrismaClient {
  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    // Production: Turso via libSQL adapter
    const libsql = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter, log: ['error', 'warn'] })
  }

  // Local development: standard SQLite
  return new PrismaClient({ log: ['error', 'warn'] })
}

export const db =
  globalForPrisma.prisma ??
  createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
