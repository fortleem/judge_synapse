// Egyptian Judicial Brain V2.1 — Audit Logger
// Every significant action is recorded with clear source separation:
// system_proposal | judge_decision | system_action | adversary_transfer

import { db } from "@/lib/db"

export async function logAudit(entry: {
  caseId?: string | null
  actor?: string
  action: string
  entityType: string
  entityId?: string | null
  source?: string
  details?: string | null
}) {
  try {
    await db.auditLog.create({
      data: {
        caseId: entry.caseId ?? null,
        actor: entry.actor ?? "system",
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        source: entry.source ?? "system_action",
        details: entry.details ?? null,
      },
    })
  } catch (e) {
    console.error("[audit] failed to log:", e)
  }
}

// Convenience helpers for common patterns
export const audit = {
  systemProposal: (caseId: string, action: string, entityType: string, entityId?: string, details?: string) =>
    logAudit({ caseId, actor: "system", action, entityType, entityId, source: "system_proposal", details }),

  judgeDecision: (caseId: string, action: string, entityType: string, entityId?: string, details?: string) =>
    logAudit({ caseId, actor: "judge", action, entityType, entityId, source: "judge_decision", details }),

  systemAction: (caseId: string | undefined, action: string, entityType: string, entityId?: string, details?: string) =>
    logAudit({ caseId, actor: "system", action, entityType, entityId, source: "system_action", details }),

  adversaryTransfer: (caseId: string, action: string, entityId?: string, details?: string) =>
    logAudit({ caseId, actor: "system", action, entityType: "adversary_review", entityId, source: "adversary_transfer", details }),
}
