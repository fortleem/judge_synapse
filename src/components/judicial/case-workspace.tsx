"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Gavel, FileText, FolderOpen, CalendarClock, GitBranch, BookOpen,
  Bot, Scale, ShieldCheck, Loader2, AlertTriangle, Swords, Eye, ServerOff,
  CalendarDays,
} from "lucide-react"
import { cn, colorClasses, formatDate } from "@/lib/judicial/ui"
import {
  PROCEDURAL_STAGES, RISK_LEVELS, OPERATING_STATES, findConstant,
} from "@/lib/judicial/constants"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { StatusBadge, SovereignPanel } from "./ui/primitives"
import { OverviewTab } from "./tabs/overview"
import { FactsTab } from "./tabs/facts"
import { EvidenceTab } from "./tabs/evidence"
import { TimelineTab } from "./tabs/timeline"
import { IssuesTab } from "./tabs/issues"
import { AuthoritiesTab } from "./tabs/authorities"
import { AIAnalysisTab } from "./tabs/ai-analysis"
import { JudgeFieldsTab } from "./tabs/judge-fields"
import { IndicatorsTab } from "./tabs/indicators"
import { AdversaryReviewTab } from "./tabs/adversary-review"
import { JudgeNotesTab } from "./tabs/judge-notes"
import { DeadlinesTab } from "./tabs/deadlines"

type TabKey = "overview" | "facts" | "evidence" | "timeline" | "issues" | "authorities" | "ai" | "adversary" | "judge" | "indicators" | "notes" | "deadlines"

const TABS: { key: TabKey; label: string; icon: React.ReactNode; badge?: (c: CaseDetailT) => number }[] = [
  { key: "overview", label: "نظرة عامة", icon: <FileText className="h-4 w-4" /> },
  { key: "facts", label: "الوقائع", icon: <BookOpen className="h-4 w-4" />, badge: (c) => c.facts.length },
  { key: "evidence", label: "الأدلة", icon: <FolderOpen className="h-4 w-4" />, badge: (c) => c.evidence.length },
  { key: "timeline", label: "الخط الزمني", icon: <CalendarClock className="h-4 w-4" />, badge: (c) => c.timeline.length },
  { key: "deadlines", label: "المواعيد القانونية", icon: <CalendarDays className="h-4 w-4" />, badge: (c) => c.deadlines.length },
  { key: "issues", label: "المسائل القانونية", icon: <GitBranch className="h-4 w-4" />, badge: (c) => c.issues.length },
  { key: "authorities", label: "السلطات", icon: <Scale className="h-4 w-4" />, badge: (c) => c.authorities.length },
  { key: "ai", label: "تحليل AI", icon: <Bot className="h-4 w-4" /> },
  { key: "adversary", label: "المراجعة الخصومية", icon: <Swords className="h-4 w-4" />, badge: (c) => c.adversaryReviews.length },
  { key: "judge", label: "القاضي", icon: <Gavel className="h-4 w-4" /> },
  { key: "indicators", label: "المؤشرات", icon: <ShieldCheck className="h-4 w-4" /> },
  { key: "notes", label: "الملاحظات", icon: <FileText className="h-4 w-4" />, badge: (c) => c.notes.length },
]

export function CaseWorkspace({ caseDetail, loading }: { caseDetail: CaseDetailT; loading: boolean }) {
  const [tab, setTab] = React.useState<TabKey>("overview")
  const qc = useQueryClient()
  const c = caseDetail

  const stage = findConstant(PROCEDURAL_STAGES, c.proceduralStage)
  const risk = findConstant(RISK_LEVELS, c.riskLevel)
  const state = findConstant(OPERATING_STATES, c.operatingState)

  const updateCase = async (patch: Record<string, unknown>, msg: string) => {
    try {
      await api.updateCase(c.id, patch)
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      qc.invalidateQueries({ queryKey: ["cases"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
      toast.success(msg)
    } catch {
      toast.error("فشل التحديث")
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Case header */}
      <div className="border-b border-border bg-card/40">
        <div className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="font-jetbrains text-xs text-amber-500 dark:text-amber-400">{c.caseNumber}</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-kufi text-xs text-muted-foreground">{c.court} — {c.circuit}</span>
              </div>
              <h2 className="font-serif-judicial text-xl font-bold leading-tight mb-1.5">{c.title}</h2>
              <p className="font-kufi text-xs text-muted-foreground leading-relaxed line-clamp-2">{c.summary}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <Select value={c.proceduralStage} onValueChange={(v) => updateCase({ proceduralStage: v }, "تم تحديث المرحلة")}>
                <SelectTrigger className="w-32 h-8 text-xs font-kufi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROCEDURAL_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="font-kufi text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={c.riskLevel} onValueChange={(v) => updateCase({ riskLevel: v }, "تم تحديث مستوى المخاطر")}>
                <SelectTrigger className="w-28 h-8 text-xs font-kufi">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="font-kufi text-xs">{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-3">
            {stage && <StatusBadge label={`المرحلة: ${stage.label}`} color="slate" />}
            {risk && <StatusBadge label={`المخاطر: ${risk.label}`} color={risk.color} glow={risk.value === "CRITICAL"} />}
            <StatusBadge label={c.caseType} color="violet" dot={false} />
            {c.nextHearing && (
              <StatusBadge label={`الجلسة القادمة: ${formatDate(c.nextHearing)}`} color="blue" />
            )}
          </div>
        </div>

        {/* Operating states banner */}
        <OperatingStatesBanner caseDetail={c} onUpdate={updateCase} />
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background/60 px-3">
        <nav className="flex items-center gap-1 overflow-x-auto scroll-sovereign">
          {TABS.map((t) => {
            const badge = t.badge?.(c)
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 font-kufi text-xs border-b-2 transition-all whitespace-nowrap",
                  tab === t.key
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.icon}
                {t.label}
                {badge !== undefined && badge > 0 && (
                  <span className={cn(
                    "font-jetbrains text-[9px] px-1.5 py-0.5 rounded-full",
                    tab === t.key ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground"
                  )}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scroll-sovereign p-4 min-h-0">
        {tab === "overview" && <OverviewTab caseDetail={c} />}
        {tab === "facts" && <FactsTab caseDetail={c} />}
        {tab === "evidence" && <EvidenceTab caseDetail={c} />}
        {tab === "timeline" && <TimelineTab caseDetail={c} />}
        {tab === "deadlines" && <DeadlinesTab caseDetail={c} />}
        {tab === "issues" && <IssuesTab caseDetail={c} />}
        {tab === "authorities" && <AuthoritiesTab caseDetail={c} />}
        {tab === "ai" && <AIAnalysisTab caseDetail={c} />}
        {tab === "adversary" && <AdversaryReviewTab caseDetail={c} />}
        {tab === "judge" && <JudgeFieldsTab caseDetail={c} />}
        {tab === "indicators" && <IndicatorsTab caseDetail={c} />}
        {tab === "notes" && <JudgeNotesTab caseDetail={c} />}
      </div>
    </div>
  )
}

function OperatingStatesBanner({
  caseDetail, onUpdate,
}: {
  caseDetail: CaseDetailT
  onUpdate: (patch: Record<string, unknown>, msg: string) => void
}) {
  const c = caseDetail
  const state = findConstant(OPERATING_STATES, c.operatingState)

  const icons: Record<string, React.ReactNode> = {
    NOMINAL: <Eye className="h-3.5 w-3.5" />,
    REVIEW: <Eye className="h-3.5 w-3.5" />,
    INSUFFICIENT_EVIDENCE: <AlertTriangle className="h-3.5 w-3.5" />,
    CONFLICT: <Swords className="h-3.5 w-3.5" />,
    SYSTEM_DEGRADED: <ServerOff className="h-3.5 w-3.5" />,
  }

  return (
    <div className="px-5 py-2 border-t border-border bg-background/40">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-kufi text-[10px] text-muted-foreground">حالة التشغيل:</span>
        {OPERATING_STATES.map((s) => {
          const active = c.operatingState === s.value
          const cc = colorClasses(s.color)
          return (
            <button
              key={s.value}
              onClick={() => onUpdate({ operatingState: s.value }, `تم تحديث حالة التشغيل: ${s.label}`)}
              className={cn(
                "flex items-center gap-1.5 rounded border px-2 py-1 font-kufi text-[10px] transition-all",
                active ? cn(cc.bg, cc.text, cc.border, cc.glow) : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              {icons[s.value]}
              {s.label}
            </button>
          )
        })}
      </div>
      {state && state.value !== "NOMINAL" && (
        <div className="mt-1.5 font-kufi text-[10px] text-muted-foreground">
          الحالة الحالية: <span className={colorClasses(state.color).text}>{state.label}</span>
          {" — "}
          {state.value === "INSUFFICIENT_EVIDENCE" && "الأدلة المتاحة غير كافية لإثبات النتيجة — يلزم تكليف الخصوم بمستندات إضافية"}
          {state.value === "CONFLICT" && "يوجد تعارض بين السلطات القضائية — مراجعة القاضي إلزامية قبل البتّ"}
          {state.value === "REVIEW" && "القضية قيد المراجعة القضائية — يُرجى استكمال الفحص"}
          {state.value === "SYSTEM_DEGRADED" && "النظام في وضع متدهور — يلزم التحقق من التكامل قبل الاعتماد"}
        </div>
      )}
    </div>
  )
}
