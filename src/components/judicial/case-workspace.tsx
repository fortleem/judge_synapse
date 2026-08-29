"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  LayoutDashboard, FolderOpen, Scale, Bot, Gavel, Loader2,
  AlertTriangle,
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
import { StatusBadge } from "./ui/primitives"

// ─── 5 Consolidated Tabs ────────────────────────────────────────
type TabKey = "overview" | "facts-evidence" | "law" | "analysis" | "decision"

const TABS: { key: TabKey; label: string; icon: React.ReactNode; badge?: (c: CaseDetailT) => number }[] = [
  { key: "overview", label: "نظرة عامة", icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "facts-evidence", label: "الوقائع والأدلة", icon: <FolderOpen className="h-4 w-4" />, badge: (c) => c.facts.length + c.evidence.length + c.documents.length },
  { key: "law", label: "القانون", icon: <Scale className="h-4 w-4" />, badge: (c) => c.authorities.length },
  { key: "analysis", label: "التحليل", icon: <Bot className="h-4 w-4" /> },
  { key: "decision", label: "القرار", icon: <Gavel className="h-4 w-4" /> },
]

export function CaseWorkspace({ caseDetail, loading }: { caseDetail: CaseDetailT; loading: boolean }) {
  const [tab, setTab] = React.useState<TabKey>("overview")
  const qc = useQueryClient()
  const c = caseDetail

  const stage = findConstant(PROCEDURAL_STAGES, c.proceduralStage)
  const risk = findConstant(RISK_LEVELS, c.riskLevel)
  const state = findConstant(OPERATING_STATES, c.operatingState)

  // Proactive contradiction scan
  const contradictionsQ = useQuery({
    queryKey: ["contradictions", c.id],
    queryFn: () => api.scanContradictions(c.id) as Promise<any>,
    enabled: !!c.id,
    refetchInterval: 60000,
  })
  const contradictionReport = contradictionsQ.data?.data ?? contradictionsQ.data
  const criticalCount = contradictionReport?.criticalCount ?? 0

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
      {/* Clean case header */}
      <div className="border-b border-border bg-card/40 px-4 py-3">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-jetbrains text-xs text-amber-500">{c.caseNumber}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-kufi text-xs text-muted-foreground">{c.court}</span>
            </div>
            <h2 className="font-serif-judicial text-lg font-bold leading-tight mb-1">{c.title}</h2>
            <p className="font-kufi text-xs text-muted-foreground leading-relaxed line-clamp-2">{c.summary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select value={c.proceduralStage} onValueChange={(v) => updateCase({ proceduralStage: v }, "تم تحديث المرحلة")}>
              <SelectTrigger className="w-28 h-8 text-xs font-kufi"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROCEDURAL_STAGES.map((s) => <SelectItem key={s.value} value={s.value} className="font-kufi text-xs">{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={c.riskLevel} onValueChange={(v) => updateCase({ riskLevel: v }, "تم تحديث المخاطر")}>
              <SelectTrigger className="w-24 h-8 text-xs font-kufi"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((r) => <SelectItem key={r.value} value={r.value} className="font-kufi text-xs">{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Single-line status bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {stage && <StatusBadge label={stage.label} color="slate" size="sm" dot={false} />}
          {risk && <StatusBadge label={risk.label} color={risk.color} size="sm" glow={risk.value === "CRITICAL"} />}
          {state && state.value !== "NOMINAL" && <StatusBadge label={state.label} color={state.color} size="sm" glow />}
          {c.nextHearing && <StatusBadge label={`الجلسة: ${formatDate(c.nextHearing)}`} color="blue" size="sm" />}
          {criticalCount > 0 && (
            <button onClick={() => setTab("analysis")} className="ml-auto">
              <StatusBadge label={`${criticalCount} تعارض حرج`} color="red" size="sm" glow />
            </button>
          )}
        </div>
      </div>

      {/* 5 tabs — pills on mobile, underline on desktop */}
      <div className="border-b border-border bg-background/60">
        {/* Mobile: horizontal scroll pills */}
        <div className="scroll-snap-x overflow-x-auto scroll-sovereign flex gap-1.5 px-3 py-2 md:hidden">
          {TABS.map((t) => {
            const badge = t.badge?.(c)
            const isActive = tab === t.key
            const cc = colorClasses(isActive ? "amber" : "slate")
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "scroll-snap-item flex items-center gap-1.5 rounded-full px-3.5 py-2 font-kufi text-xs whitespace-nowrap transition-all active:scale-95",
                  isActive ? cn(cc.bg, cc.text, "font-semibold") : "bg-muted/50 text-muted-foreground"
                )}
              >
                {t.icon}
                {t.label}
                {badge !== undefined && badge > 0 && (
                  <span className={cn(
                    "font-jetbrains text-[9px] px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-amber-500/30" : "bg-muted"
                  )}>{badge}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Desktop: underline tabs */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto scroll-sovereign px-3">
          {TABS.map((t) => {
            const badge = t.badge?.(c)
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 font-kufi text-xs border-b-2 transition-all whitespace-nowrap",
                  tab === t.key
                    ? "border-amber-500 text-amber-600 font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.icon}
                {t.label}
                {badge !== undefined && badge > 0 && (
                  <span className={cn(
                    "font-jetbrains text-[9px] px-1.5 py-0.5 rounded-full",
                    tab === t.key ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"
                  )}>{badge}</span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scroll-sovereign p-4 min-h-0">
        {tab === "overview" && <OverviewTab caseDetail={c} onNavigateTab={setTab} />}
        {tab === "facts-evidence" && <FactsEvidenceTab caseDetail={c} />}
        {tab === "law" && <LawTab caseDetail={c} />}
        {tab === "analysis" && <AnalysisTab caseDetail={c} />}
        {tab === "decision" && <DecisionTab caseDetail={c} />}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW — case summary + timeline + deadlines + issues + verdict
// ═══════════════════════════════════════════════════════════════════
function OverviewTab({ caseDetail: c, onNavigateTab }: { caseDetail: CaseDetailT; onNavigateTab: (t: TabKey) => void }) {
  const provenFacts = c.facts.filter((f) => ["judicially_established", "undisputed", "admitted", "supported"].includes(f.status)).length
  const disputedFacts = c.facts.filter((f) => ["denied", "contradicted"].includes(f.status)).length
  const supportingCount = c.authorities.filter((a) => a.stance === "supporting").length
  const contraryCount = c.authorities.filter((a) => a.stance === "contrary" || a.stance === "opposing").length
  const openIssues = c.issues.filter((i) => i.status !== "resolved").length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: parties + subject */}
      <div className="glass-panel rounded-xl p-4 lg:col-span-1">
        <h3 className="font-kufi text-sm font-semibold mb-3 flex items-center gap-1.5">
          <FolderOpen className="h-4 w-4 text-amber-500" />
          أطراف النزاع
        </h3>
        <div className="space-y-2 font-kufi text-xs">
          <div>
            <span className="text-muted-foreground">الأطراف:</span>
            <p className="leading-relaxed mt-0.5">{c.parties}</p>
          </div>
          <div className="gold-rule opacity-30 my-2" />
          <div>
            <span className="text-muted-foreground">الموضوع:</span>
            <p className="leading-relaxed mt-0.5">{c.subjectMatter}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div><span className="text-muted-foreground">الإيداع:</span> <span className="font-jetbrains">{formatDate(c.filedDate)}</span></div>
            <div><span className="text-muted-foreground">الجلسة:</span> <span className="font-jetbrains">{formatDate(c.nextHearing)}</span></div>
          </div>
        </div>
      </div>

      {/* Middle: key stats */}
      <div className="glass-panel rounded-xl p-4 lg:col-span-2">
        <h3 className="font-kufi text-sm font-semibold mb-3 flex items-center gap-1.5">
          <LayoutDashboard className="h-4 w-4 text-amber-500" />
          ملخّص سريع
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button onClick={() => onNavigateTab("facts-evidence")} className="text-right">
            <MiniStat label="وقائع مثبتة" value={provenFacts} color="emerald" />
          </button>
          <button onClick={() => onNavigateTab("facts-evidence")} className="text-right">
            <MiniStat label="وقائع متنازع" value={disputedFacts} color="orange" />
          </button>
          <button onClick={() => onNavigateTab("law")} className="text-right">
            <MiniStat label="سلطات مؤيِّدة" value={supportingCount} color="emerald" />
          </button>
          <button onClick={() => onNavigateTab("law")} className="text-right">
            <MiniStat label="سلطات مخالفة" value={contraryCount} color="red" />
          </button>
          <button onClick={() => onNavigateTab("facts-evidence")} className="text-right">
            <MiniStat label="أدلة" value={c.evidence.length} color="blue" />
          </button>
          <button onClick={() => onNavigateTab("facts-evidence")} className="text-right">
            <MiniStat label="مستندات" value={c.documents.length} color="violet" />
          </button>
          <button onClick={() => onNavigateTab("analysis")} className="text-right">
            <MiniStat label="مواعيد" value={c.deadlines.length} color="amber" />
          </button>
          <button onClick={() => onNavigateTab("decision")} className="text-right">
            <MiniStat label="ملاحظات" value={c.notes.length} color="slate" />
          </button>
        </div>
        {openIssues > 0 && (
          <button
            onClick={() => onNavigateTab("analysis")}
            className="mt-3 w-full flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-2.5 text-right hover:bg-amber-500/10 transition-colors"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="font-kufi text-xs">{openIssues} مسائل قانونية مفتوحة — اضغط للمراجعة</span>
          </button>
        )}
      </div>

      {/* Timeline — full inline */}
      <div className="glass-panel rounded-xl p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-kufi text-sm font-semibold">الخط الزمني</h3>
          <button onClick={() => onNavigateTab("facts-evidence")} className="font-kufi text-[10px] text-amber-600 hover:underline">
            عرض الوقائع والأدلة ←
          </button>
        </div>
        <TimelineInline caseDetail={c} />
      </div>

      {/* Deadlines — full inline */}
      <div className="glass-panel rounded-xl p-4 lg:col-span-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-kufi text-sm font-semibold">المواعيد القانونية</h3>
          <button onClick={() => onNavigateTab("analysis")} className="font-kufi text-[10px] text-amber-600 hover:underline">
            حساب جديد ←
          </button>
        </div>
        <DeadlinesInline caseDetail={c} />
      </div>

      {/* Verdict Draft Quick Access */}
      <div className="glass-panel rounded-xl p-4 lg:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="font-kufi text-sm font-semibold flex items-center gap-1.5">
            <Gavel className="h-4 w-4 text-amber-500" />
            مسودة الحكم
          </h3>
          <button
            onClick={() => onNavigateTab("decision")}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-kufi text-xs text-amber-700 hover:bg-amber-500/20 transition-colors"
          >
            <Gavel className="h-3.5 w-3.5" />
            صياغة الحكم
          </button>
        </div>
        <p className="font-kufi text-xs text-muted-foreground mt-2 leading-relaxed">
          ابدأ صياغة الحكم من القوالب الجاهزة — الوقائع، الدفوع، الأدلة، النصوص، المبادئ، التطبيق، التسبيب، المنطوق. مرتبط بكل بيانات القضية.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: FACTS & EVIDENCE — facts + evidence + documents combined
// ═══════════════════════════════════════════════════════════════════
function FactsEvidenceTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const [sub, setSub] = React.useState<"facts" | "evidence" | "documents">("facts")

  return (
    <div className="space-y-4">
      {/* Sub-toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1 w-fit">
        {([
          { key: "facts", label: `الوقائع (${c.facts.length})` },
          { key: "evidence", label: `الأدلة (${c.evidence.length})` },
          { key: "documents", label: `المستندات (${c.documents.length})` },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-md font-kufi text-xs transition-colors",
              sub === t.key ? "bg-amber-500/15 text-amber-700 font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >{t.label}</button>
        ))}
      </div>

      {/* Lazy render existing tabs */}
      {sub === "facts" && <FactsInline caseDetail={c} />}
      {sub === "evidence" && <EvidenceInline caseDetail={c} />}
      {sub === "documents" && <DocumentsInline caseDetail={c} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: LAW — authorities + law check + citation verification
// ═══════════════════════════════════════════════════════════════════
function LawTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  return (
    <div className="space-y-4">
      <LawInline caseDetail={c} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4: ANALYSIS — AI + adversary + contradictions + strength
// ═══════════════════════════════════════════════════════════════════
function AnalysisTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const [sub, setSub] = React.useState<"insights" | "ai" | "adversary">("insights")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1 w-fit">
        {([
          { key: "insights", label: "الرؤى والتعارضات" },
          { key: "ai", label: "تحليل AI" },
          { key: "adversary", label: `المراجعة الخصومية (${c.adversaryReviews.length})` },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-md font-kufi text-xs transition-colors",
              sub === t.key ? "bg-amber-500/15 text-amber-700 font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >{t.label}</button>
        ))}
      </div>

      {sub === "insights" && <InsightsInline caseDetail={c} />}
      {sub === "ai" && <AIInline caseDetail={c} />}
      {sub === "adversary" && <AdversaryInline caseDetail={c} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TAB 5: DECISION — judge fields + notes + indicators
// ═══════════════════════════════════════════════════════════════════
function DecisionTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const [sub, setSub] = React.useState<"judge" | "notes" | "indicators">("judge")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1 w-fit">
        {([
          { key: "judge", label: "حقول القاضي" },
          { key: "notes", label: `الملاحظات (${c.notes.length})` },
          { key: "indicators", label: "المؤشرات" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={cn(
              "px-3 py-1.5 rounded-md font-kufi text-xs transition-colors",
              sub === t.key ? "bg-amber-500/15 text-amber-700 font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >{t.label}</button>
        ))}
      </div>

      {sub === "judge" && <JudgeInline caseDetail={c} />}
      {sub === "notes" && <NotesInline caseDetail={c} />}
      {sub === "indicators" && <IndicatorsInline caseDetail={c} />}
    </div>
  )
}

// ─── Mini stat ───────────────────────────────────────────────────
function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  const cc = colorClasses(color)
  return (
    <div className={cn("rounded-lg border p-2", cc.border, cc.bg)}>
      <div className={cn("font-jetbrains text-lg font-bold leading-tight", cc.text)}>{value}</div>
      <div className="font-kufi text-[9px] text-muted-foreground truncate">{label}</div>
    </div>
  )
}

// ─── Inline wrappers for existing tabs ───────────────────────────
// These import and render the existing tab components without modification
import { FactsTab } from "./tabs/facts"
import { EvidenceTab } from "./tabs/evidence"
import { DocumentsTab } from "./tabs/documents"
import { AuthoritiesTab } from "./tabs/authorities"
import { InsightsTab } from "./tabs/insights"
import { AIAnalysisTab } from "./tabs/ai-analysis"
import { AdversaryReviewTab } from "./tabs/adversary-review"
import { JudgeFieldsTab } from "./tabs/judge-fields"
import { JudgeNotesTab } from "./tabs/judge-notes"
import { IndicatorsTab } from "./tabs/indicators"
import { TimelineTab } from "./tabs/timeline"
import { DeadlinesTab } from "./tabs/deadlines"

function FactsInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <FactsTab caseDetail={c} /> }
function EvidenceInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <EvidenceTab caseDetail={c} /> }
function DocumentsInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <DocumentsTab caseDetail={c} /> }
function LawInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <AuthoritiesTab caseDetail={c} /> }
function InsightsInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <InsightsTab caseDetail={c} /> }
function AIInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <AIAnalysisTab caseDetail={c} /> }
function AdversaryInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <AdversaryReviewTab caseDetail={c} /> }
function JudgeInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <JudgeFieldsTab caseDetail={c} /> }
function NotesInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <JudgeNotesTab caseDetail={c} /> }
function IndicatorsInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <IndicatorsTab caseDetail={c} /> }
function TimelineInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <TimelineTab caseDetail={c} /> }
function DeadlinesInline({ caseDetail: c }: { caseDetail: CaseDetailT }) { return <DeadlinesTab caseDetail={c} /> }
