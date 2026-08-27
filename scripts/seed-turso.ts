// Seed Turso database — uses dynamic imports to ensure env loads first
import { config } from 'dotenv'
config()

async function main() {
  console.log('TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL?.slice(0, 40) + '...')

  // Dynamic imports — ensure db.ts initializes AFTER env is loaded
  const { seedJudicialCorpus } = await import('../src/lib/judicial/seed')
  const { seedCorpusRegistry } = await import('../src/lib/judicial/seed-corpus')
  const { seedExpandedLegalTexts } = await import('../src/lib/judicial/seed-expanded-corpus')
  const { importDownloadedLaws } = await import('../src/lib/judicial/seed-downloaded-laws')

  console.log('Seeding Turso database...')

  try {
    const r1 = await seedJudicialCorpus()
    console.log('✓ Cases:', JSON.stringify(r1))
  } catch (e) {
    console.error('✗ Cases:', e instanceof Error ? e.message.slice(0, 100) : e)
  }

  try {
    const r2 = await seedCorpusRegistry()
    console.log('✓ Corpus:', JSON.stringify(r2))
  } catch (e) {
    console.error('✗ Corpus:', e instanceof Error ? e.message.slice(0, 100) : e)
  }

  try {
    const r3 = await seedExpandedLegalTexts()
    console.log('✓ Expanded texts:', JSON.stringify(r3))
  } catch (e) {
    console.error('✗ Expanded:', e instanceof Error ? e.message.slice(0, 100) : e)
  }

  try {
    const r4 = await importDownloadedLaws()
    console.log('✓ Downloaded laws:', JSON.stringify(r4))
  } catch (e) {
    console.error('✗ Laws:', e instanceof Error ? e.message.slice(0, 100) : e)
  }

  console.log('\n✓ Turso seeding complete')
}

main().catch(console.error)
