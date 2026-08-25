"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  ShieldCheck, Bot, Gavel, Cog, ArrowRightLeft, Loader2, Filter,
  Clock, FileText, Scale, FolderOpen, GitBranch, Swords, Quote, Hash,
} from "lucide-react"
import { api } from "@/lib/judicial/api-client"
import { cn, colorClasses, formatDateTime, relativeTime } from "@/lib/judicial/ui"
import { AUDIT_SOURCES, AUDIT_ACTORS, findConstant } from "@/lib/judicial/constants"
import type { AuditLogT } from "@/lib/judicial/schemas"
import { SovereignPanel, StatusBadge, EmptyState, StatTile } from "./ui/primitives"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  system_proposal: <Bot className="h-3.5 w-3.5" />,
  judge_decision: <Gavel className="h-3.5 w-3.5" />,
  system_action: <Cog className="h-3.5 w-3.5" />,
  adversary_transfer: <ArrowRightLeft className="h-3.5 w-3.5" />,
  audit: <ShieldCheck className="h-3.5 w-3.5" />,
}

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  case: <FileText className="h-3 w-3" />,
  fact: <FileText className="h-3 w-3" />,
  evidence: <FolderOpen className="h-3 w-3" />,
  authority: <Scale className="h-3 w-3" />,
  issue: <GitBranch className="h-3 w-3" />,
  judge_field: <Gavel className="h-3 w-3" />,
  adversary_review: <Swords className="h-3 w-3" />,
  conflict: <Swords className="h-3 w-3" />,
  judge_note: <FileText className="h-3 w-3" />,
  citation_verification: <Quote className="h-3 w-3" />,
  legal_source: <FileText className="h-3 w-3" />,
  legal_text: <FileText className="h-3 w-3" />,
  corpus_snapshot: <Hash className="h-3 w-3" />,
  import_job: <Cog className="h-3 w-3" />,
}

export function AuditLogView() {
  const [sourceFilter, setSourceFilter] = React.useState<string>("all")

  const auditQ = useQuery({
    queryKey: ["audit-global", sourceFilter],
    queryFn: () => api.listAudit(undefined, sourceFilter !== "all" ? sourceFilter : undefined),
  })

  const logs = auditQ.data ?? []

  // Count by source for stat tiles
  const counts = React.useMemo(() => {
    const c: Record<string, number> = { system_proposal: 0, judge_decision: 0, system_action: 0, adversary_transfer: 0, audit: 0 }
    logs.forEach((l) => { c[l.source] = (c[l.source] ?? 0) + 1 })
    return c
  }, [logs])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Hero */}
      <div className="border-b border-border bg-card/40 px-5 py-4">
        <div className="flex items-start gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-amber-400 mt-1" />
          <div>
            <h2 className="font-serif-judicial text-xl font-bold mb-1">سجل التدقيق — فصل صارم بين اقتراحات النظام وقرار القاضي</h2>
            <p className="font-kufi text-xs text-muted-foreground leading-relaxed max-w-2xl">
              كل إجراء مُسجَّل بشكل غير قابل للتعديل. يفصل السجل دائماً بين: اقتراحات النظام (system_proposal)، قرارات القاضي (judge_decision)، إجراءات النظام (system_action)، والنقل من المراجعة الخصومية (adversary_transfer). قابل لإعادة الإنتاج ضد اللقطة المحدّدة.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-sovereign p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {AUDIT_SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSourceFilter(sourceFilter === s.value ? "all" : s.value)}
              className={cn(
                "rounded-lg border p-3 text-right transition-all",
                sourceFilter === s.value ? cn(colorClasses(s.color).border, colorClasses(s.color).bg, "seal-frame") : "border-border/60 bg-background/40 hover:border-amber-500/30"
              )}
            >
              <div className={cn("flex items-center gap-1.5 mb-1", colorClasses(s.color).text)}>
                {SOURCE_ICONS[s.value]}
                <span className="font-kufi text-[10px] font-medium">{s.label}</span>
              </div>
              <div className="font-jetbrains text-xl font-bold">{counts[s.value] ?? 0}</div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-44 font-kufi text-xs h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-kufi text-xs">كل المصادر</SelectItem>
              {AUDIT_SOURCES.map((s) => <SelectItem key={s.value} value={s.value} className="font-kufi text-xs">{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="font-kufi text-xs text-muted-foreground">{logs.length} سجل</span>
          {sourceFilter !== "all" && (
            <button onClick={() => setSourceFilter("all")} className="font-kufi text-[10px] text-amber-600 dark:text-amber-400 hover:underline">
              مسح التصفية
            </button>
          )}
        </div>

        {/* Timeline */}
        {auditQ.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
        ) : logs.length === 0 ? (
          <EmptyState title="لا توجد سجلات تدقيق" hint="ستظهر هنا كل الإجراءات مع فصل صارم بين النظام والقاضي" icon={<ShieldCheck className="h-8 w-8" />} />
        ) : (
          <SovereignPanel title="السجل الزمني — غير قابل للتعديل" icon={<Clock className="h-4 w-4" />}>
            <div className="space-y-1">
              {logs.map((log) => <AuditRow key={log.id} log={log} />)}
            </div>
          </SovereignPanel>
        )}
      </div>
    </div>
  )
}

function AuditRow({ log }: { log: AuditLogT }) {
  const sourceMeta = findConstant(AUDIT_SOURCES, log.source)
  const actorMeta = findConstant(AUDIT_ACTORS, log.actor)
  const cc = colorClasses(sourceMeta?.color ?? "slate")

  return (
    <div className={cn("rounded-md border border-border/40 bg-background/30 px-3 py-2 flex items-start gap-3", log.source === "judge_decision" && "border-emerald-500/30 bg-emerald-500/5", log.source === "system_proposal" && "border-amber-500/30 bg-amber-500/5")}>
      <div className={cn("flex h-7 w-7 items-center justify-center rounded shrink-0 mt-0.5", cc.bg, cc.text)}>
        {SOURCE_ICONS[log.source] ?? <Cog className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-kufi text-xs font-medium">{log.action}</span>
          {sourceMeta && <StatusBadge label={sourceMeta.label} color={sourceMeta.color} size="sm" dot={false} />}
          {actorMeta && <span className={cn("font-kufi text-[10px]", colorClasses(actorMeta.color).text)}>— {actorMeta.label}</span>}
        </div>
        {log.details && <p className="font-kufi text-[11px] text-muted-foreground leading-relaxed">{log.details}</p>}
        <div className="flex items-center gap-2 mt-1">
          {ENTITY_ICONS[log.entityType] && <span className="text-muted-foreground/60">{ENTITY_ICONS[log.entityType]}</span>}
          <span className="font-kufi text-[10px] text-muted-foreground">{log.entityType}</span>
          {log.entityId && <code className="font-jetbrains text-[9px] text-muted-foreground/70">{log.entityId.slice(-8)}</code>}
          <span className="font-jetbrains text-[9px] text-muted-foreground/70 mr-auto">{formatDateTime(log.timestamp)}</span>
          <span className="font-kufi text-[9px] text-muted-foreground/50">{relativeTime(log.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}
