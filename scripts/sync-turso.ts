// ═══════════════════════════════════════════════════════════════════
// Turso Auto-Sync: automatically sync Prisma schema to Turso database
// Runs: DROP all tables → CREATE all tables → SEED all data
// Called by: bun run db:push-turso OR postinstall on Vercel
// ═══════════════════════════════════════════════════════════════════

import { createClient } from "@libsql/client"
import { readFileSync, existsSync, writeFileSync } from "fs"
import crypto from "crypto"

const TURSO_URL = process.env.TURSO_DATABASE_URL!
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!

function hash(text: string): string {
  return `sha256:${crypto.createHash("sha256").update(text).digest("hex").slice(0, 24)}`
}

async function main() {
  if (!TURSO_URL || !TURSO_TOKEN) {
    console.log("[turso-sync] No TURSO env vars — skipping (local dev mode)")
    return
  }

  console.log("[turso-sync] Connecting to:", TURSO_URL.slice(0, 40) + "...")
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })

  // ── 1. Generate SQL from Prisma schema ──────────────────────
  const { execSync } = await import("child_process")
  const sqlPath = "/tmp/turso-schema-sync.sql"

  let sqlContent = ""
  try {
    sqlContent = execSync("npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script", {
      cwd: "/home/z/my-project",
      encoding: "utf-8",
      timeout: 30000,
    })
    writeFileSync(sqlPath, sqlContent)
  } catch (err) {
    console.error("[turso-sync] prisma migrate diff failed:", err instanceof Error ? err.message.slice(0, 200) : "")
    return
  }

  if (!existsSync(sqlPath)) {
    console.error("[turso-sync] SQL file not generated")
    return
  }

  const sql = readFileSync(sqlPath, "utf-8")
  // Split on semicolons — keep statements that have CREATE or INDEX in them
  const statements = sql.split(";").filter((s) => {
    const trimmed = s.trim()
    if (trimmed.length < 5) return false
    // Skip pure comment lines
    if (trimmed.startsWith("--") && !trimmed.includes("CREATE") && !trimmed.includes("INDEX")) return false
    return true
  })
  console.log(`[turso-sync] Generated ${statements.length} SQL statements`)

  // ── 2. Check current state ──────────────────────────────────
  let existingTables: string[] = []
  try {
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existingTables = tables.rows.map((r) => String(r.name))
    console.log(`[turso-sync] Existing tables: ${existingTables.length}`)
  } catch {
    console.log("[turso-sync] No existing tables (fresh database)")
  }

  // ── 3. DROP existing tables in reverse dependency order ────
  // Drop child tables first, then parent tables
  const dropOrder = ["Party", "StoredDocument", "CaseDeadline", "CitationVerification", "AuditLog", "JudgeNote", "AdversaryReview", "Conflict", "ImportJob", "CorpusSnapshot", "LegalText", "LegalSource", "Indicator", "AIAnalysis", "JudgeField", "Authority", "LegalIssue", "TimelineEvent", "Evidence", "Fact", "Case", "Setting"]
  const tablesToDrop = [...dropOrder, ...existingTables.filter((t) => !dropOrder.includes(t))]
  for (const table of tablesToDrop) {
    if (table.startsWith("_") || table === "sqlite_sequence") continue
    try {
      await client.execute(`DROP TABLE IF EXISTS "${table}"`)
    } catch (e) {
      // ignore — might be FK constraint, will retry after other drops
    }
  }
  // Second pass for any that failed due to FK
  for (const table of tablesToDrop) {
    if (table.startsWith("_")) continue
    try {
      await client.execute(`DROP TABLE IF EXISTS "${table}"`)
    } catch {
      // still failing — skip
    }
  }
  console.log("[turso-sync] Dropped existing tables")

  // ── 4. CREATE all tables from schema ────────────────────────
  let created = 0
  let failed = 0
  for (const stmt of statements) {
    try {
      await client.execute(stmt)
      created++
    } catch (e) {
      failed++
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes("already exists")) {
        console.error(`[turso-sync] CREATE error: ${msg.slice(0, 100)}`)
      }
    }
  }
  console.log(`[turso-sync] Created ${created} tables (${failed} errors)`)

  // ── 6. Verify ───────────────────────────────────────────────
  const finalTables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  console.log(`[turso-sync] ✓ Final table count: ${finalTables.rows.length}`)
  for (const row of finalTables.rows) {
    console.log(`  ✓ ${row.name}`)
  }

  // ── 7. Seed if empty ────────────────────────────────────────
  const caseCount = await client.execute('SELECT COUNT(*) as c FROM "Case"').catch(() => ({ rows: [{ c: 0 }] }))
  if (Number(caseCount.rows[0].c) === 0) {
    console.log("[turso-sync] Database is empty — seeding...")
    await seedTurso(client)
  } else {
    console.log(`[turso-sync] Database has ${caseCount.rows[0].c} cases — skipping seed`)
  }

  console.log("[turso-sync] ✅ Sync complete!")
}

// ─── Seed function ──────────────────────────────────────────────
async function seedTurso(client: ReturnType<typeof createClient>) {
  const now = new Date().toISOString()
  let count = 0

  // Cases
  const cases = [
    { num: "تجارى رقم 142 لسنة 2026", title: "شركة النيل ضد شركة الصحراء — إخلال بعقد توريد", court: "المحكمة الاقتصادية", circuit: "الدائرة الأولى", type: "تجاري", stage: "EVIDENCE", risk: "HIGH", state: "REVIEW", parties: "المدّعي: شركة النيل | المدّعى عليه: شركة الصحراء", subject: "تعويض عن إخلال", summary: "نزاع تجاري حول إخلال بعقد توريد." },
    { num: "عمل رقم 87 لسنة 2026", title: "أحمد عبد الرحمن ضد شركة الدلتا — بطلان فصل تعسفي", court: "محكمة العمل", circuit: "دائرة العمل بالجيزة", type: "عمل", stage: "PLEADINGS", risk: "MEDIUM", state: "NOMINAL", parties: "المدّعي: أحمد | المدّعى عليه: شركة الدلتا", subject: "إبطال فصل", summary: "دعوى بطلان فصل تعسفي." },
    { num: "إداري رقم 301 لسنة 2026", title: "محمود فؤاد ضد محافظة القاهرة — إلغاء قرار", court: "مجلس الدولة", circuit: "المحكمة الإدارية العليا", type: "إداري", stage: "HEARING", risk: "CRITICAL", state: "CONFLICT", parties: "المدّعي: محمود فؤاد | المدّعى عليه: محافظة القاهرة", subject: "إلغاء قرار", summary: "دعوى إدارية لإلغاء قرار فصل." },
    { num: "مدنى كلى رقم 5 لسنة 2026", title: "ورثة المرحوم/ سالم — إثبات ملكية", court: "محكمة الاستئناف", circuit: "الدائرة المدنية", type: "مدني", stage: "EVIDENCE", risk: "MEDIUM", state: "INSUFFICIENT_EVIDENCE", parties: "المدّعون: ورثة سالم | المدّعى عليه: شركة العقارية", subject: "إثبات ملكية", summary: "دعوى إثبات ملكية عقار." },
  ]

  const caseIds: string[] = []
  for (const c of cases) {
    const id = crypto.randomUUID()
    caseIds.push(id)
    await client.execute({
      sql: `INSERT INTO "Case" (id, "caseNumber", title, court, circuit, "caseType", parties, "subjectMatter", "proceduralStage", "riskLevel", "operatingState", summary, "filedDate", "nextHearing", "aiSyncEnabled", "corpusVersion", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      args: [id, c.num, c.title, c.court, c.circuit, c.type, c.parties, c.subject, c.stage, c.risk, c.state, c.summary, "2026-01-12T00:00:00.000Z", "2026-09-04T00:00:00.000Z", "EJB-CORPUS-2026.08-R1", now, now],
    })

    // Judge fields
    for (const ft of ["judge_results", "judge_reasoning", "draft", "integrity_review"]) {
      await client.execute({ sql: `INSERT INTO "JudgeField" (id, "caseId", "fieldType", content, status, "updatedAt") VALUES (?, ?, ?, ?, ?, ?)`, args: [crypto.randomUUID(), id, ft, "", "empty", now] })
    }
    // Indicators
    for (const it of ["citation_soundness", "legal_version", "defense_coverage", "evidence_consistency"]) {
      await client.execute({ sql: `INSERT INTO "Indicator" (id, "caseId", "indicatorType", score, status, "updatedAt") VALUES (?, ?, ?, 0, ?, ?)`, args: [crypto.randomUUID(), id, it, "pending", now] })
    }
    count++
  }
  console.log(`[turso-sync] Seeded ${count} cases`)

  // Parties (with cross-case: شركة الصحراء in case 1 + case 3)
  const parties = [
    { caseIdx: 0, name: "شركة النيل للتجارة الخارجية", type: "company", role: "plaintiff", companyReg: "100001", nationalId: null, address: "القاهرة - مدينة نصر" },
    { caseIdx: 0, name: "شركة الصحراء للتصنيع", type: "company", role: "defendant", companyReg: "200002", nationalId: null, address: "القاهرة - المعادي" },
    { caseIdx: 1, name: "أحمد عبد الرحمن محمد", type: "person", role: "plaintiff", companyReg: null, nationalId: "29001011234567", address: "الجيزة - الهرم" },
    { caseIdx: 1, name: "شركة الدلتا للصناعات", type: "company", role: "defendant", companyReg: "300003", nationalId: null, address: "الجيزة - 6 أكتوبر" },
    { caseIdx: 2, name: "محمود فؤاد سيد", type: "person", role: "plaintiff", companyReg: null, nationalId: "28503159876543", address: "القاهرة - حلوان" },
    { caseIdx: 2, name: "شركة الصحراء للتصنيع", type: "company", role: "defendant", companyReg: "200002", nationalId: null, address: "القاهرة - المعادي" },
    { caseIdx: 3, name: "ورثة المرحوم سالم", type: "person", role: "plaintiff", companyReg: null, nationalId: "27909151111111", address: null },
    { caseIdx: 3, name: "شركة العقارية الكبرى", type: "company", role: "defendant", companyReg: "400004", nationalId: null, address: null },
  ]
  for (const p of parties) {
    await client.execute({
      sql: `INSERT INTO "Party" (id, "caseId", name, type, role, "nationalId", "companyReg", address, "createdAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), caseIds[p.caseIdx], p.name, p.type, p.role, p.nationalId, p.companyReg, p.address, now],
    })
  }
  console.log("[turso-sync] Seeded 8 parties (companyReg 200002 cross-case)")

  // Legal source
  const sourceId = crypto.randomUUID()
  await client.execute({
    sql: `INSERT INTO "LegalSource" (id, name, "nameEn", "portalUrl", "sourceType", "issuingBody", jurisdiction, "accessStatus", "sourceTier", "contentAvailable", "accessNotes", verified, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [sourceId, "السجل الداخلي الموثَّق", "EJB Internal Verified Registry", null, "statute", "المنصة القضائية الذكية", "داخلي", "VERIFIED", 3, "نصوص موثَّقة", "سجل داخلي", 1, now, now],
  })

  // Legal texts from downloaded-laws.json
  let textCount = 0
  if (existsSync("/home/z/my-project/downloaded-laws.json")) {
    try {
      const downloaded = JSON.parse(readFileSync("/home/z/my-project/downloaded-laws.json", "utf-8"))
      for (const law of downloaded.laws) {
        const effectiveFrom = `${law.lawYear}-01-01T00:00:00.000Z`
        for (const article of law.articles) {
          try {
            await client.execute({
              sql: `INSERT INTO "LegalText" (id, "sourceId", title, citation, "documentType", "legalDomain", "legalForce", "effectiveFrom", "effectiveTo", "versionLabel", "sourceHash", "retrievalTimestamp", "publicationDate", "officialJournalRef", "verificationStatus", "temporalStatus", "exactText", "sourceUrl", notes, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [crypto.randomUUID(), sourceId, article.title, article.citation, "statute_article", law.domain, "statute", effectiveFrom, null, `قانون ${law.lawNumber} لسنة ${law.lawYear}`, hash(article.exactText), now, effectiveFrom, law.officialJournalRef, "verified", "current", article.exactText, law.sourceUrl || null, article.notes || null, now, now],
            })
            textCount++
          } catch { /* duplicate */ }
        }
      }
      console.log(`[turso-sync] Seeded ${textCount} legal texts from ${downloaded.laws.length} laws`)
    } catch {
      console.log("[turso-sync] Could not read downloaded-laws.json — skipping legal texts")
    }
  }

  // Constitutional provisions
  const constitutional = [
    { citation: "دستوري — 184", title: "المادة 184 — السلطة القضائية", text: "السلطة القضائية مستقلة، وتتولاها المحاكم على اختلاف أنواعها ودرجاتها، وتصدر أحكامها وفق القانون." },
    { citation: "دستوري — 186", title: "المادة 186 — استقلال القضاء", text: "القضاة مستقلون، لا سلطان عليهم في قضائهم لغير القانون، ولا يجوز عزلهم بغير الطريق التأديبي." },
    { citation: "دستوري — 195", title: "المادة 195 — أحكام المحكمة الدستورية", text: "تُنشر أحكام المحكمة الدستورية العليا في الجريدة الرسمية، وملزمة للجميع ولجميع سلطات الدولة." },
    { citation: "دستوري — 97", title: "المادة 97 — شرعية الجرائم", text: "لا جريمة ولا عقوبة إلا بنص، والعقوبة شخصية، ولا عقوبة إلا بحكم قضائي." },
    { citation: "دستوري — 98", title: "المادة 98 — البراءة", text: "المتهم بريء حتى تثبت إدانته في محاكمة قضائية تكفل له فيها ضمانات الدفاع عن نفسه." },
  ]
  for (const t of constitutional) {
    try {
      await client.execute({
        sql: `INSERT INTO "LegalText" (id, "sourceId", title, citation, "documentType", "legalDomain", "legalForce", "effectiveFrom", "effectiveTo", "versionLabel", "sourceHash", "retrievalTimestamp", "publicationDate", "officialJournalRef", "verificationStatus", "temporalStatus", "exactText", "sourceUrl", notes, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [crypto.randomUUID(), sourceId, t.title, t.citation, "constitutional_provision", "الدستوري", "constitutional_provision", "2014-01-18T00:00:00.000Z", null, "نسخة 2014", hash(t.text), now, "2014-01-18T00:00:00.000Z", "الجريدة الرسمية", "verified", "current", t.text, null, "نص دستوري مؤسِّس", now, now],
      })
      textCount++
    } catch { /* duplicate */ }
  }
  console.log(`[turso-sync] + ${constitutional.length} constitutional provisions (total: ${textCount})`)

  // Corpus snapshot
  await client.execute({
    sql: `INSERT INTO "CorpusSnapshot" (id, "versionLabel", "createdAt", "sourceManifest", hash, signature, "approvalStatus", "effectiveFrom", "effectiveTo", "textCount", "sourceCount", notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), "EJB-CORPUS-2026.08-R1", now, JSON.stringify({ sources: 1, texts: textCount }), `sha256:${crypto.randomBytes(16).toString("hex")}`, `ejb-sig-${crypto.randomBytes(8).toString("hex")}`, "published", "2026-08-01T00:00:00.000Z", null, textCount, 1, "لقطة موقّعة رقميًا"],
  })
  console.log("[turso-sync] Created corpus snapshot")

  // Settings
  const settings = [
    ["governance", "judicial_authority_principle", "الذكاء الاصطناعي يُساعد العمل القضائي. القاضي يمارس السلطة القضائية."],
    ["law_sources", "corpus_version", "EJB-CORPUS-2026.08-R1"],
    ["model_policy", "default_route", "SOVEREIGN_MODEL_POOL"],
  ]
  for (const [cat, key, val] of settings) {
    await client.execute({ sql: `INSERT INTO "Setting" (id, category, key, value, "updatedAt") VALUES (?, ?, ?, ?, ?)`, args: [crypto.randomUUID(), cat, key, val, now] })
  }
  console.log("[turso-sync] Seeded settings")

  // Audit logs
  const auditEntries = [
    { caseIdx: 0, actor: "system", action: "case_created", entity: "case", source: "system_action", details: "إنشاء قضية تجارية" },
    { caseIdx: 0, actor: "system", action: "fact_added", entity: "fact", source: "system_proposal", details: "إضافة وقائع القضية" },
    { caseIdx: 0, actor: "judge", action: "judge_review_started", entity: "case", source: "judge_decision", details: "بدأ القاضي مراجعة القضية" },
    { caseIdx: 2, actor: "system", action: "cross_case_detected", entity: "party", source: "system_proposal", details: "اكتشاف قضية متقاطعة: شركة الصحراء (سجل 200002) في قضيتين" },
  ]
  for (const a of auditEntries) {
    await client.execute({
      sql: `INSERT INTO "AuditLog" (id, "caseId", actor, action, "entityType", "entityId", source, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), caseIds[a.caseIdx], a.actor, a.action, a.entity, null, a.source, a.details, now],
    })
  }
  console.log("[turso-sync] Seeded 4 audit log entries")

  console.log(`[turso-sync] ✅ Seeded: ${count} cases, 8 parties, ${textCount} legal texts, 1 snapshot, ${settings.length} settings, 4 audit logs`)
}

main().catch((err) => {
  console.error("[turso-sync] FATAL:", err)
  process.exit(1)
})
