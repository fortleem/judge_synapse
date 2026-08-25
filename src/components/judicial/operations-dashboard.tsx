"use client"

import * as React from "react"
import {
  FolderOpen, FileText, Scale, ShieldAlert, Swords, Loader2, Activity,
  TrendingUp, ChevronLeft, Database, Clock, AlertTriangle, Bot,
  CalendarDays, Lightbulb, ArrowUpRight, Upload, ShieldCheck, type LucideIcon,
} from "lucide-react"
import { cn, colorClasses, relativeTime } from "@/lib/judicial/ui"
import {
  PROCEDURAL_STAGES, RISK_LEVELS, OPERATING_STATES, findConstant,
} from "@/lib/judicial/constants"
import type { DashboardT, CaseT } from "@/lib/judicial/schemas"
import { StatusBadge } from "./ui/primitives"
import { StatTile } from "./ui/primitives"

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
    <div className="flex-1 overflow-y-auto scroll-sovereign">
      {/* Bento grid — simplified */}
      <div className="bento-grid p-4">
        {/* Hero bento — system state + welcome + quick actions */}
        <div className="bento-col-8 glass-panel-accent rounded-xl p-5 hover-lift animate-slide-up">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-amber-500" />
                <span className="font-jetbrains text-[10px] tracking-widest text-amber-500">SOVEREIGN OPERATIONS</span>
              </div>
              <h2 className="font-serif-judicial text-2xl font-bold mb-1">غرفة العمليات القضائية</h2>
              <p className="font-kufi text-xs text-muted-foreground leading-relaxed max-w-xl">
                منصة الذكاء القضائي المصري — المساعد الرقمي الكامل للقاضي.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="font-jetbrains text-3xl font-bold text-amber-500">{dashboard?.totals.cases ?? 0}</div>
                <div className="font-kufi text-[10px] text-muted-foreground">قضية نشطة</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className={cn("font-jetbrains text-3xl font-bold", dashboard?.systemState === "NOMINAL" ? "text-emerald-500" : "text-amber-500")}>
                  {dashboard?.systemState === "NOMINAL" ? "سليم" : "تعارض"}
                </div>
                <div className="font-kufi text-[10px] text-muted-foreground">حالة النظام</div>
              </div>
            </div>
          </div>
          {/* Quick actions */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <QuickAction icon={FolderOpen} label="قضية جديدة" color="amber" onClick={() => window.dispatchEvent(new CustomEvent("navigate-case"))} />
            <QuickAction icon={Database} label="السجل القانوني" color="emerald" onClick={() => window.dispatchEvent(new CustomEvent("navigate", { detail: "research" }))} />
            <QuickAction icon={ShieldCheck} label="سجل التدقيق" color="blue" onClick={() => window.dispatchEvent(new CustomEvent("navigate", { detail: "audit" }))} />
          </div>
        </div>

        {/* Critical alerts bento */}
        <div className="bento-col-4 glass-panel rounded-xl p-4 hover-lift animate-slide-up">
          <h3 className="font-kufi text-sm font-semibold flex items-center gap-1.5 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            تنبيهات
          </h3>
          <div className="space-y-2">
            <AlertRow icon={Swords} label="حالات التعارض" count={dashboard?.totals.conflicts ?? 0} color="orange" />
            <AlertRow icon={ShieldAlert} label="قيد المراجعة" count={dashboard?.totals.pendingReview ?? 0} color="blue" />
          </div>
        </div>

        {/* Recent cases — large */}
        <div className="bento-col-8 glass-panel rounded-xl p-4 hover-lift animate-slide-up">
          <h3 className="font-kufi text-sm font-semibold mb-3">أحدث القضايا</h3>
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
                    className="text-right rounded-lg border border-border/60 bg-background/40 p-3 hover:border-amber-500/40 hover:bg-card transition-all group press-feedback"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-jetbrains text-[10px] text-amber-500 truncate">{c.caseNumber}</span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-amber-500 transition-colors shrink-0" />
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
        </div>

        {/* Corpus bento */}
        <div className="bento-col-4 glass-panel rounded-xl p-4 hover-lift animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <code className="font-jetbrains text-xs text-amber-500">{dashboard?.corpusVersion ?? "EJB-CORPUS-2026.08-R1"}</code>
              <p className="font-kufi text-[10px] text-muted-foreground">السجل القانوني الموقّع</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-jetbrains text-lg font-bold text-emerald-500">39</div>
              <div className="font-kufi text-[9px] text-muted-foreground">نص قانوني</div>
            </div>
            <div>
              <div className="font-jetbrains text-lg font-bold text-blue-500">14</div>
              <div className="font-kufi text-[9px] text-muted-foreground">مصدر رسمي</div>
            </div>
            <div>
              <div className="font-jetbrains text-lg font-bold text-violet-500">15</div>
              <div className="font-kufi text-[9px] text-muted-foreground">نوع محكمة</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: LucideIcon; label: string; color: string; onClick: () => void }) {
  const cc = colorClasses(color)
  return (
    <button
      onClick={onClick}
      className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-kufi text-[11px] transition-all press-feedback hover-lift", cc.border, cc.bg, cc.text, "hover:shadow-md")}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function StatBento({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number; color: string }) {
  const cc = colorClasses(color)
  return (
    <div className="glass-panel rounded-xl p-4 hover-lift animate-slide-up">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", cc.bg, cc.text)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-jetbrains text-2xl font-bold leading-tight">{value}</div>
          <div className="font-kufi text-[10px] text-muted-foreground truncate">{label}</div>
        </div>
      </div>
    </div>
  )
}

function AlertRow({ icon: Icon, label, count, color }: { icon: LucideIcon; label: string; count: number; color: string }) {
  const cc = colorClasses(color)
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/40 bg-background/30 p-2">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", cc.text)} />
      <span className="font-kufi text-xs flex-1">{label}</span>
      <span className={cn("font-jetbrains text-sm font-bold", cc.text)}>{count}</span>
    </div>
  )
}
