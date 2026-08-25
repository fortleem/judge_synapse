"use client"

import * as React from "react"
import {
  FolderOpen, FileText, Scale, ShieldAlert, Swords, Loader2, Activity,
  TrendingUp, ChevronLeft, Database,
} from "lucide-react"
import { cn, colorClasses, relativeTime } from "@/lib/judicial/ui"
import {
  PROCEDURAL_STAGES, RISK_LEVELS, OPERATING_STATES, findConstant,
} from "@/lib/judicial/constants"
import type { DashboardT, CaseT } from "@/lib/judicial/schemas"
import { SovereignPanel, StatTile, StatusBadge } from "./ui/primitives"

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

  return (
    <div className="p-4 space-y-4 overflow-y-auto scroll-sovereign">
      {/* Hero */}
      <div className="rounded-lg border border-amber-500/30 bg-gradient-to-l from-emerald-900/40 via-card to-card p-5 seal-frame">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-amber-400" />
              <span className="font-jetbrains text-[10px] tracking-widest text-amber-400">SOVEREIGN OPERATIONS CENTER</span>
            </div>
            <h2 className="font-serif-judicial text-2xl font-bold mb-1">غرفة عمليات قضائية سيادية</h2>
            <p className="font-kufi text-xs text-muted-foreground leading-relaxed max-w-2xl">
              منصة ذكاء قضائي سيادية لتنظيم الأدلة والبحث القانوني ودعم التسبيب. الذكاء الاصطناعي يُساعد العمل القضائي — القاضي يمارس السلطة القضائية. كل م proposition قانوني قابل للتتبّع إلى مصدره الأصلي.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="font-jetbrains text-2xl font-bold text-amber-400">{dashboard?.totals.cases ?? 0}</div>
              <div className="font-kufi text-[10px] text-muted-foreground">قضية نشطة</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <div className={cn("font-jetbrains text-2xl font-bold", dashboard?.systemState === "NOMINAL" ? "text-emerald-400" : "text-amber-400")}>
                {dashboard?.systemState === "NOMINAL" ? "سليم" : dashboard?.systemState === "CONFLICT" ? "تعارض" : dashboard?.systemState === "SYSTEM_DEGRADED" ? "متدهور" : "مراجعة"}
              </div>
              <div className="font-kufi text-[10px] text-muted-foreground">حالة النظام</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="إجمالي القضايا" value={dashboard?.totals.cases ?? 0} color="gold" icon={<FolderOpen className="h-4 w-4" />} />
        <StatTile label="الوقائع" value={dashboard?.totals.facts ?? 0} color="blue" icon={<FileText className="h-4 w-4" />} />
        <StatTile label="الأدلة" value={dashboard?.totals.evidence ?? 0} color="emerald" icon={<FileText className="h-4 w-4" />} />
        <StatTile label="السلطات" value={dashboard?.totals.authorities ?? 0} color="violet" icon={<Scale className="h-4 w-4" />} />
        <StatTile label="قيد المراجعة" value={dashboard?.totals.pendingReview ?? 0} color="blue" icon={<ShieldAlert className="h-4 w-4" />} />
        <StatTile label="حالات التعارض" value={dashboard?.totals.conflicts ?? 0} color="orange" icon={<Swords className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* By stage */}
        <SovereignPanel title="القضايا حسب المرحلة الإجرائية" icon={<TrendingUp className="h-4 w-4" />}>
          <div className="space-y-1.5">
            {dashboard?.byStage.filter((s) => s.count > 0).map((s) => {
              const meta = findConstant(PROCEDURAL_STAGES, s.stage)
              const max = Math.max(...(dashboard.byStage.map((x) => x.count) || [1]), 1)
              const pct = (s.count / max) * 100
              return (
                <div key={s.stage} className="flex items-center gap-2">
                  <span className="font-kufi text-[11px] w-20 truncate">{meta?.label ?? s.stage}</span>
                  <div className="flex-1 h-5 rounded bg-muted/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-l from-amber-500 to-amber-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-jetbrains text-[11px] w-5 text-left">{s.count}</span>
                </div>
              )
            })}
            {(!dashboard || dashboard.byStage.filter((s) => s.count > 0).length === 0) && (
              <p className="font-kufi text-xs text-muted-foreground text-center py-3">لا توجد بيانات</p>
            )}
          </div>
        </SovereignPanel>

        {/* By risk */}
        <SovereignPanel title="القضايا حسب مستوى المخاطر" icon={<ShieldAlert className="h-4 w-4" />}>
          <div className="space-y-1.5">
            {dashboard?.byRisk.map((r) => {
              const meta = findConstant(RISK_LEVELS, r.risk)
              const cc = colorClasses(meta?.color ?? "slate")
              return (
                <div key={r.risk} className="flex items-center gap-2">
                  <span className="font-kufi text-[11px] w-20 truncate">{meta?.label ?? r.risk}</span>
                  <div className="flex-1 h-5 rounded bg-muted/40 overflow-hidden">
                    <div className={cn("h-full transition-all", cc.dot)} style={{ width: `${(r.count / Math.max(dashboard.totals.cases, 1)) * 100}%` }} />
                  </div>
                  <span className="font-jetbrains text-[11px] w-5 text-left">{r.count}</span>
                </div>
              )
            })}
          </div>
        </SovereignPanel>

        {/* By operating state */}
        <SovereignPanel title="القضايا حسب حالة التشغيل" icon={<Activity className="h-4 w-4" />}>
          <div className="space-y-1.5">
            {dashboard?.byOperatingState.map((o) => {
              const meta = findConstant(OPERATING_STATES, o.state)
              const cc = colorClasses(meta?.color ?? "slate")
              return (
                <div key={o.state} className="flex items-center gap-2">
                  <span className="font-kufi text-[11px] w-28 truncate">{meta?.label ?? o.state}</span>
                  <div className="flex-1 h-5 rounded bg-muted/40 overflow-hidden">
                    <div className={cn("h-full transition-all", cc.dot)} style={{ width: `${(o.count / Math.max(dashboard.totals.cases, 1)) * 100}%` }} />
                  </div>
                  <span className="font-jetbrains text-[11px] w-5 text-left">{o.count}</span>
                </div>
              )
            })}
          </div>
        </SovereignPanel>
      </div>

      {/* Recent cases */}
      <SovereignPanel title="أحدث القضايا" icon={<FolderOpen className="h-4 w-4" />}>
        {dashboard && dashboard.recentCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {dashboard.recentCases.map((c) => {
              const stage = findConstant(PROCEDURAL_STAGES, c.proceduralStage)
              const risk = findConstant(RISK_LEVELS, c.riskLevel)
              const state = findConstant(OPERATING_STATES, c.operatingState)
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCase(c.id)}
                  className="text-right rounded-md border border-border/60 bg-background/40 p-3 hover:border-amber-500/40 hover:bg-card transition-all group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-jetbrains text-[10px] text-amber-500 dark:text-amber-400 truncate">{c.caseNumber}</span>
                    <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-500 transition-colors shrink-0" />
                  </div>
                  <p className="font-kufi text-xs font-medium leading-snug line-clamp-2 mb-2">{c.title}</p>
                  <div className="flex items-center gap-1 flex-wrap">
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
          <p className="font-kufi text-xs text-muted-foreground text-center py-4">لا توجد قضايا</p>
        )}
      </SovereignPanel>

      {/* Corpus info */}
      <SovereignPanel title="نسخة السجل القانوني" icon={<Database className="h-4 w-4" />}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <code className="font-jetbrains text-sm text-amber-500 dark:text-amber-400">{dashboard?.corpusVersion ?? "EJB-CORPUS-2026.08-R1"}</code>
            <p className="font-kufi text-[11px] text-muted-foreground mt-1">نسخة موقّعة رقميًا — قابلة لإعادة الإنتاج ضد اللقطة المحدّدة</p>
          </div>
          <StatusBadge label="موقّعة" color="emerald" />
        </div>
      </SovereignPanel>
    </div>
  )
}
