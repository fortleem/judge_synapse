// Apply Prisma schema to Turso database
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'

async function main() {
  const url = process.env.TURSO_DATABASE_URL!
  const token = process.env.TURSO_AUTH_TOKEN!

  const client = createClient({ url, authToken: token })

  const sql = readFileSync('/tmp/turso-schema.sql', 'utf-8')
  // Split on semicolons but keep CREATE TABLE / CREATE INDEX / CREATE UNIQUE INDEX statements together
  const statements = sql
    .split(/;(?=\s*(?:--|CREATE|DROP|INSERT|UPDATE|DELETE|PRAGMA|$))/)
    .map(s => s.trim())
    .filter(s => s.length > 5 && !s.startsWith('--'))

  console.log(`Applying ${statements.length} SQL statements to Turso...`)
  let success = 0
  let errors = 0

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    try {
      await client.execute(stmt)
      success++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('already exists')) {
        success++ // table already exists — fine
      } else {
        errors++
        console.error(`  Error at statement ${i}: ${msg.slice(0, 150)}`)
      }
    }
  }

  console.log(`\n✓ Applied: ${success} success, ${errors} errors`)

  // Verify
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  console.log(`\nTables in Turso: ${tables.rows.length}`)
  for (const row of tables.rows) {
    console.log(`  ✓ ${row.name}`)
  }
}

main().catch(console.error)
