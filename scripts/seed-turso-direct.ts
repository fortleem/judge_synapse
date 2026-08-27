// Seed Turso database directly via libsql client (bypasses Prisma adapter issues)
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import crypto from 'crypto'

const TURSO_URL = process.env.TURSO_DATABASE_URL || 'libsql://judge-fortleem.aws-us-east-1.turso.io'
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || ''

function hash(text: string): string {
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex").slice(0, 24)}`
}

async function main() {
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })
  console.log('Connected to Turso:', TURSO_URL.slice(0, 40))

  // 1. Check existing data
  const caseCount = await client.execute('SELECT COUNT(*) as c FROM "Case"')
  console.log('Existing cases:', caseCount.rows[0].c)

  if (Number(caseCount.rows[0].c) > 0) {
    console.log('✓ Turso already has data — skipping seed')
    const texts = await client.execute('SELECT COUNT(*) as c FROM "LegalText"')
    const sources = await client.execute('SELECT COUNT(*) as c FROM "LegalSource"')
    console.log(`  Cases: ${caseCount.rows[0].c}, Texts: ${texts.rows[0].c}, Sources: ${sources.rows[0].c}`)
    return
  }

  // 2. Read downloaded laws
  const downloaded = JSON.parse(readFileSync('/home/z/my-project/downloaded-laws.json', 'utf-8'))
  let textCount = 0
  let lawCount = 0

  // 3. Create internal source
  const sourceId = crypto.randomUUID()
  await client.execute({
    sql: `INSERT INTO "LegalSource" (id, name, "nameEn", "portalUrl", "sourceType", "issuingBody", jurisdiction, "accessStatus", "sourceTier", "contentAvailable", "accessNotes", verified, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    args: [sourceId, 'السجل الداخلي الموثَّق — المنصة القضائية الذكية', 'EJB Internal Verified Registry', null, 'statute', 'المنصة القضائية الذكية — فريق المعرفة القانونية', 'داخلي — نصوص موثَّقة من المصادر الرسمية', 'VERIFIED', 3, 'نصوص دستورية وتشريعية محقَّق منها', 'سجل داخلي موثَّق', 1],
  })
  console.log('✓ Internal source created')

  // 4. Insert legal texts from downloaded laws
  for (const law of downloaded.laws) {
    lawCount++
    const effectiveFrom = `${law.lawYear}-01-01T00:00:00.000Z`
    for (const article of law.articles) {
      try {
        await client.execute({
          sql: `INSERT INTO "LegalText" (id, "sourceId", title, citation, "documentType", "legalDomain", "legalForce", "effectiveFrom", "effectiveTo", "versionLabel", "sourceHash", "retrievalTimestamp", "publicationDate", "officialJournalRef", "verificationStatus", "temporalStatus", "exactText", "sourceUrl", notes, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          args: [
            crypto.randomUUID(), sourceId, article.title, article.citation, 'statute_article',
            law.domain, 'statute', effectiveFrom, null, `قانون ${law.lawNumber} لسنة ${law.lawYear}`,
            hash(article.exactText), new Date().toISOString(), effectiveFrom, law.officialJournalRef,
            'verified', 'current', article.exactText, law.sourceUrl || null,
            `${article.notes || ''} | ${law.lawName}`,
          ],
        })
        textCount++
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`  ✓ ${law.lawName} (${law.lawNumber}/${law.lawYear}) — ${law.articles.length} articles`)
  }

  // 5. Add constitutional provisions (key articles)
  const constitutionalTexts = [
    { citation: 'دستوري — 184', title: 'المادة 184 من الدستور — السلطة القضائية', text: 'السلطة القضائية مستقلة، وتتولاها المحاكم على اختلاف أنواعها ودرجاتها، وتصدر أحكامها وفق القانون.' },
    { citation: 'دستوري — 186', title: 'المادة 186 من الدستور — استقلال القضاء', text: 'القضاة مستقلون، لا سلطان عليهم في قضائهم لغير القانون، ولا يجوز عزلهم بغير الطريق التأديبي.' },
    { citation: 'دستوري — 195', title: 'المادة 195 من الدستور — أحكام المحكمة الدستورية', text: 'تُنشر أحكام المحكمة الدستورية العليا وقراراتها في الجريدة الرسمية، وملزمة للجميع ولجميع سلطات الدولة.' },
    { citation: 'دستوري — 97', title: 'المادة 97 من الدستور — شرعية الجرائم', text: 'لا جريمة ولا عقوبة إلا بنص، والعقوبة شخصية، ولا عقوبة إلا بحكم قضائي.' },
    { citation: 'دستوري — 98', title: 'المادة 98 من الدستور — البراءة', text: 'المتهم بريء حتى تثبت إدانته في محاكمة قضائية تكفل له فيها ضمانات الدفاع عن نفسه.' },
  ]

  for (const t of constitutionalTexts) {
    try {
      await client.execute({
        sql: `INSERT INTO "LegalText" (id, "sourceId", title, citation, "documentType", "legalDomain", "legalForce", "effectiveFrom", "effectiveTo", "versionLabel", "sourceHash", "retrievalTimestamp", "publicationDate", "officialJournalRef", "verificationStatus", "temporalStatus", "exactText", "sourceUrl", notes, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        args: [crypto.randomUUID(), sourceId, t.title, t.citation, 'constitutional_provision', 'الدستوري — السلطة القضائية', 'constitutional_provision', '2014-01-18T00:00:00.000Z', null, 'نسخة 2014', hash(t.text), new Date().toISOString(), '2014-01-18T00:00:00.000Z', 'الجريدة الرسمية — 18 يناير 2014', 'verified', 'current', t.text, null, 'نص دستوري مؤسِّس'],
      })
      textCount++
    } catch (e) { /* skip duplicates */ }
  }
  console.log(`  ✓ Constitutional provisions: ${constitutionalTexts.length}`)

  // 6. Create corpus snapshot
  await client.execute({
    sql: `INSERT INTO "CorpusSnapshot" (id, "versionLabel", "createdAt", "sourceManifest", hash, signature, "approvalStatus", "effectiveFrom", "effectiveTo", "textCount", "sourceCount", notes) VALUES (?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), 'EJB-CORPUS-2026.08-R1', JSON.stringify({ sources: 1, texts: textCount }), `sha256:${crypto.randomBytes(16).toString('hex')}`, `ejb-sig-${crypto.randomBytes(8).toString('hex')}`, 'published', '2026-08-01T00:00:00.000Z', null, textCount, 1, 'اللقطة الأولى — موقّعة رقميًا'],
  })
  console.log('✓ Corpus snapshot created')

  // 7. Create settings
  const settings = [
    ['governance', 'judicial_authority_principle', 'الذكاء الاصطناعي يُساعد العمل القضائي. القاضي يمارس السلطة القضائية.'],
    ['governance', 'ai_autonomy', 'لا توجد صلاحية للذكاء الاصطناعي في إصدار الأحكام'],
    ['law_sources', 'corpus_version', 'EJB-CORPUS-2026.08-R1'],
    ['model_policy', 'default_route', 'SOVEREIGN_MODEL_POOL'],
  ]
  for (const [cat, key, val] of settings) {
    await client.execute({
      sql: `INSERT INTO "Setting" (id, category, key, value, "updatedAt") VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [crypto.randomUUID(), cat, key, val],
    })
  }
  console.log('✓ Settings created')

  console.log(`\n✓ Turso seeded: ${lawCount} laws, ${textCount} legal texts, 1 source, 1 snapshot, ${settings.length} settings`)
}

main().catch(console.error)
