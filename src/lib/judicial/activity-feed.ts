// Egyptian Judicial Smart V2.1 — Recent Activity Feed
// Judge-facing activity feed (distinct from technical audit log)
import { db } from "@/lib/db"

export interface ActivityItem {
  id: string
  type: "case" | "source" | "review" | "alert"
  title: string
  detail: string
  time: string
  caseId?: string
}

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const logs = await db.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: limit * 2,
    include: { case: { select: { id: true, caseNumber: true, title: true } } },
  })

  const activities: ActivityItem[] = []
  for (const log of logs) {
    const item = logToActivity(log)
    if (item) activities.push(item)
  }

  const recentCases = await db.case.findMany({
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, caseNumber: true, title: true, updatedAt: true },
  })

  for (const c of recentCases) {
    activities.push({
      id: `case-update-${c.id}`, type: "case", title: "تحديث قضية",
      detail: `${c.caseNumber} — ${c.title.slice(0, 60)}`,
      time: c.updatedAt.toISOString(), caseId: c.id,
    })
  }

  const seen = new Set<string>()
  return activities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true })
    .slice(0, limit)
}

function logToActivity(log: any): ActivityItem | null {
  const time = log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp)
  const caseNum = log.case?.caseNumber
  const caseTitle = log.case?.title?.slice(0, 60)

  if (log.source === "judge_decision") return { id: log.id, type: "review", title: "قرار قضائي", detail: log.details || (caseNum ? `${caseNum} — ${caseTitle}` : ""), time, caseId: log.caseId ?? undefined }
  if (log.source === "system_proposal") {
    if (log.action?.includes("cross_case")) return { id: log.id, type: "alert", title: "كشف قضية متقاطعة", detail: log.details || "", time, caseId: log.caseId ?? undefined }
    if (log.action?.includes("adversary") || log.action?.includes("contradiction")) return { id: log.id, type: "alert", title: "تنبيه مراجعة خصومية", detail: log.details || "", time, caseId: log.caseId ?? undefined }
    if (log.action?.includes("source") || log.action?.includes("corpus") || log.action?.includes("snapshot")) return { id: log.id, type: "source", title: "تحديث مصدر قانوني", detail: log.details || "", time }
    return { id: log.id, type: "case", title: "إجراء النظام", detail: log.details || "", time, caseId: log.caseId ?? undefined }
  }
  if (log.source === "adversary_transfer") return { id: log.id, type: "review", title: "نقل من المراجعة الخصومية", detail: log.details || "", time, caseId: log.caseId ?? undefined }
  return null
}
