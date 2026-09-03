"use client"

import * as React from "react"
import {
  FolderOpen, FileText, Scale, ShieldAlert, Swords, Loader2, Activity as ActivityIcon,
  Database, Clock, AlertTriangle, ArrowUpRight, Plus, Search, ChevronLeft,
  Bell, BookOpen, CheckCircle2, type LucideIcon,
} from "lucide-react"
import { cn, colorClasses, relativeTime } from "@/lib/judicial/ui"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/judicial/api-client"
import {
  PROCEDURAL_STAGES, RISK_LEVELS, OPERATING_STATES, findConstant,
} from "@/lib/judicial/constants"
import type { DashboardT, CaseT } from "@/lib/judicial/schemas"
import { StatusBadge } from "./ui/primitives"

export function OperationsDashboard({
  dashboard, cases, loading, onSelectCase,
}: {
  dashboard?: DashboardT
  cases: CaseT[]
  loading: boolean
  onSelectCase: (id: string) => void
}) {
  if (loading && !dashboard) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    )
  }

  const totalCases = dashboard?.totals.cases ?? 0
  const conflicts = dashboard?.totals.conflicts ?? 0
  const pendingReview = dashboard?.totals.pendingReview ?? 0

  return (
    <div className="flex-1 overflow-y-auto scroll-sovereign pb-20 md:pb-4">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">

        {/* Hero — clean, minimal */}
        <div className="glass-panel-accent rounded-2xl p-6 hover-lift">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif-judicial text-2xl font-bold mb-1">غرفة العمليات القضائية</h1>
              <p className="font-kufi text-xs text-muted-foreground">منصة الذكاء القضائي المصري — المساعد الرقمي الكامل للقاضي</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="font-jetbrains text-3xl font-bold text-amber-500">{totalCases}</div>
                <div className="font-kufi text-[10px] text-muted-foreground">قضية نشطة</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className={cn(
                  "font-jetbrains text-3xl font-bold",
                  conflicts > 0 ? "text-orange-500" : "text-emerald-500"
                )}>
                  {conflicts > 0 ? "تعارض" : "سليم"}
                </div>
                <div className="font-kufi text-[10px] text-muted-foreground">حالة النظام</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats — 3 cards only */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={FolderOpen} label="قضايا" value={totalCases} color="amber" onClick={() => {}} />
          <StatCard icon={ShieldAlert} label="قيد المراجعة" value={pendingReview} color="blue" onClick={() => {}} />
          <StatCard icon={Swords} label="تعارضات" value={conflicts} color="orange" onClick={() => {}} />
        </div>

        {/* Recent cases — clean list */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-kufi text-sm font-semibold">أحدث القضايا</h2>
            {dashboard && dashboard.recentCases.length > 4 && (
              <button className="font-kufi text-[10px] text-amber-600 hover:underline flex items-center gap-1">
                عرض الكل <ChevronLeft className="h-3 w-3" />
              </button>
            )}
          </div>
          {dashboard && dashboard.recentCases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dashboard.recentCases.slice(0, 6).map((c) => {
                const stage = findConstant(PROCEDURAL_STAGES, c.proceduralStage)
                const risk = findConstant(RISK_LEVELS, c.riskLevel)
                const state = findConstant(OPERATING_STATES, c.operatingState)
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectCase(c.id)}
                    className="text-right rounded-xl border border-border/50 bg-background/40 p-3 hover:border-amber-500/40 hover:bg-card transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-jetbrains text-[10px] text-amber-500 truncate">{c.caseNumber}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-500 transition-colors shrink-0" />
                    </div>
                    <p className="font-kufi text-xs font-medium leading-snug line-clamp-2 mb-2">{c.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {stage && <StatusBadge label={stage.label} color="slate" size="sm" dot={false} />}
                      {risk && <StatusBadge label={risk.label} color={risk.color} size="sm" />}
                      {state && state.value !== "NOMINAL" && <StatusBadge label={state.label} color={state.color} size="sm" glow />}
                    </div>
                    <div className="font-kufi text-[9px] text-muted-foreground mt-1.5">{c.court} · {relativeTime(c.updatedAt)}</div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="font-kufi text-xs text-muted-foreground text-center py-6">لا توجد قضايا</p>
          )}
        </div>

        {/* Recent activity — judge-facing feed */}
        <ActivityFeed />

        {/* Corpus — compact */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <code className="font-jetbrains text-xs text-amber-500">{dashboard?.corpusVersion ?? "EJB-CORPUS-2026.08-R1"}</code>
                <p className="font-kufi text-[9px] text-muted-foreground">السجل القانوني الموقّع</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-center">
              <div>
                <div className="font-jetbrains text-base font-bold text-emerald-500">104</div>
                <div className="font-kufi text-[9px] text-muted-foreground">نص قانوني</div>
              </div>
              <div>
                <div className="font-jetbrains text-base font-bold text-blue-500">14</div>
                <div className="font-kufi text-[9px] text-muted-foreground">مصدر رسمي</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, onClick }: { icon: LucideIcon; label: string; value: number; color: string; onClick: () => void }) {
  const cc = colorClasses(color)
  return (
    <button
      onClick={onClick}
      className="glass-panel rounded-xl p-3 hover-lift active:scale-[0.98] text-right"
    >
      <div className="flex items-center gap-2.5">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", cc.bg, cc.text)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className={cn("font-jetbrains text-xl font-bold leading-tight", cc.text)}>{value}</div>
          <div className="font-kufi text-[10px] text-muted-foreground">{label}</div>
        </div>
      </div>
    </button>
  )
}

// ─── Judge-facing Activity Feed (from egycourt pattern) ─────────
const ACT_ICONS: Record<string, React.ReactNode> = {
  case: <FolderOpen className="h-3.5 w-3.5" />,
  source: <BookOpen className="h-3.5 w-3.5" />,
  review: <CheckCircle2 className="h-3.5 w-3.5" />,
  alert: <Bell className="h-3.5 w-3.5" />,
}
const ACT_COLORS: Record<string, string> = { case: "blue", source: "emerald", review: "violet", alert: "amber" }

function ActivityFeed() {
  const q = useQuery({
    queryKey: ["audit-global"],
    queryFn: () => api.listAudit() as Promise<any>,
    refetchInterval: 30000,
  })

  const activities = React.useMemo(() => {
    const raw = q.data?.data ?? q.data ?? []
    if (!Array.isArray(raw)) return []
    return raw.slice(0, 6).map((log: any) => {
      let type = "case"
      if (log.source === "judge_decision") type = "review"
      else if (log.action?.includes("cross_case") || log.action?.includes("contradiction")) type = "alert"
      else if (log.action?.includes("source") || log.action?.includes("corpus")) type = "source"
      return { id: log.id, type, title: log.action?.replace(/_/g, " ") || "إجراء", detail: log.details || "", time: log.timestamp }
    })
  }, [q.data])

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-kufi text-sm font-semibold flex items-center gap-1.5">
          <ActivityIcon className="h-4 w-4 text-amber-500" />
          النشاط الأخير
        </h2>
        <span className="font-kufi text-[10px] text-muted-foreground">{activities.length} عنصر</span>
      </div>
      {activities.length === 0 ? (
        <p className="font-kufi text-xs text-muted-foreground text-center py-4">لا يوجد نشاط حديث</p>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => {
            const cc = colorClasses(ACT_COLORS[a.type] ?? "slate")
            return (
              <div key={a.id} className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-background/30 p-2.5">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-md shrink-0", cc.bg, cc.text)}>
                  {ACT_ICONS[a.type] ?? <ActivityIcon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-kufi text-xs font-medium leading-snug">{a.title}</p>
                  {a.detail && <p className="font-kufi text-[10px] text-muted-foreground leading-relaxed truncate">{a.detail}</p>}
                </div>
                <span className="font-kufi text-[9px] text-muted-foreground/70 shrink-0">{relativeTime(a.time)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
