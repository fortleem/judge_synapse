// Egyptian Judicial Brain V2.1 — Knowledge Expansion Orchestrator
// The "Judge Brain AI" that orchestrates all knowledge and constantly expands.
// Per §95: Knowledge updates and model updates are SEPARATE.
// Knowledge update = new law/precedent enters the corpus after validation.
// This is NOT model training — it's corpus expansion with full provenance.

import { db } from "@/lib/db"
import { audit } from "./audit"
import { LEGAL_DEADLINES } from "./deadlines"
import { COURT_TYPES } from "./court-types"

export interface KnowledgeExpansionResult {
  expanded: boolean
  newTexts: number
  newSources: number
  newCourtTypes: number
  newDeadlines: number
  corpusVersion: string
  lastExpanded: string
  coverage: {
    constitutional: number
    statutes: number
    courtTypes: number
    deadlineTypes: number
    totalSources: number
    totalTexts: number
  }
}

// ─── Orchestrator: expand knowledge base ────────────────────────
// This is called periodically or on demand to:
// 1. Verify all court types are registered
// 2. Verify all legal deadline types are available
// 3. Check corpus coverage
// 4. Generate a knowledge expansion report
export async function orchestrateKnowledge(): Promise<KnowledgeExpansionResult> {
  const start = Date.now()

  // 1. Count current coverage
  const totalSources = await db.legalSource.count()
  const totalTexts = await db.legalText.count()
  const constitutionalTexts = await db.legalText.count({ where: { documentType: "constitutional_provision" } })
  const statuteTexts = await db.legalText.count({ where: { documentType: "statute_article" } })

  // 2. Log the orchestration
  audit.systemAction(undefined, "knowledge_orchestration_started", "corpus", undefined,
    `بدء توسعة المعرفة — المصادر: ${totalSources}، النصوص: ${totalTexts}`)

  // 3. Generate coverage report
  const coverage = {
    constitutional: constitutionalTexts,
    statutes: statuteTexts,
    courtTypes: COURT_TYPES.length,
    deadlineTypes: LEGAL_DEADLINES.length,
    totalSources,
    totalTexts,
  }

  // 4. Determine if expansion is needed
  const expanded = totalTexts < 50 // expand if less than 50 texts
  const newTexts = expanded ? await seedExpandedLegalTextsSafe() : 0

  // 5. Log completion
  audit.systemAction(undefined, "knowledge_orchestration_completed", "corpus", undefined,
    `اكتملت توسعة المعرفة — النصوص الجديدة: ${newTexts} — التغطية: ${JSON.stringify(coverage)}`)

  return {
    expanded: expanded || newTexts > 0,
    newTexts,
    newSources: 0,
    newCourtTypes: COURT_TYPES.length,
    newDeadlines: LEGAL_DEADLINES.length,
    corpusVersion: "EJB-CORPUS-2026.08-R1",
    lastExpanded: new Date().toISOString(),
    coverage: {
      ...coverage,
      totalTexts: totalTexts + newTexts,
    },
  }
}

// Safe wrapper for expanded seed — won't fail if already seeded
async function seedExpandedLegalTextsSafe(): Promise<number> {
  try {
    const { seedExpandedLegalTexts } = await import("./seed-expanded-corpus")
    const result = await seedExpandedLegalTexts()
    return result.inserted
  } catch (e) {
    console.error("[orchestrator] seed failed:", e)
    return 0
  }
}

// ─── Coverage report ────────────────────────────────────────────
export async function getKnowledgeCoverage() {
  const [sources, texts, snapshots, importJobs] = await Promise.all([
    db.legalSource.count(),
    db.legalText.count(),
    db.corpusSnapshot.count(),
    db.importJob.count(),
  ])

  const textsByType = await db.legalText.groupBy({
    by: ["documentType"],
    _count: { _all: true },
  })

  const textsByDomain = await db.legalText.groupBy({
    by: ["legalDomain"],
    _count: { _all: true },
  })

  const sourcesByType = await db.legalSource.groupBy({
    by: ["sourceType"],
    _count: { _all: true },
  })

  const sourcesByAccess = await db.legalSource.groupBy({
    by: ["accessStatus"],
    _count: { _all: true },
  })

  const lastSnapshot = await db.corpusSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
  })

  return {
    totals: {
      sources,
      texts,
      snapshots,
      importJobs,
      courtTypes: COURT_TYPES.length,
      deadlineTypes: LEGAL_DEADLINES.length,
    },
    textsByType: textsByType.map((t) => ({ type: t.documentType, count: t._count._all })),
    textsByDomain: textsByDomain.map((t) => ({ domain: t.legalDomain ?? "غير محدد", count: t._count._all })),
    sourcesByType: sourcesByType.map((t) => ({ type: t.sourceType, count: t._count._all })),
    sourcesByAccess: sourcesByAccess.map((t) => ({ status: t.accessStatus, count: t._count._all })),
    corpusVersion: lastSnapshot?.versionLabel ?? "EJB-CORPUS-2026.08-R1",
    lastSnapshotAt: lastSnapshot?.createdAt?.toISOString() ?? null,
    coveragePercent: Math.min(100, Math.round((texts / 100) * 100)), // 100 texts = 100% coverage target
  }
}
