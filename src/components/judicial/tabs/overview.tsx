"use client"

import * as React from "react"
import {
  FileText, Scale, FolderOpen, CalendarClock, GitBranch, Bot, Gavel,
  ShieldCheck, Users, Building2, Quote, AlertTriangle, Swords,
} from "lucide-react"
import { formatDate } from "@/lib/judicial/ui"
import {
  INDICATOR_TYPES, OPERATING_STATES, AUTHORITY_STANCES, findConstant,
} from "@/lib/judicial/constants"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { SovereignPanel, StatTile, StatusBadge, IndicatorRing } from "../ui/primitives"
import { colorClasses } from "@/lib/judicial/ui"
import { cn } from "@/lib/utils"

export function OverviewTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const supportingCount = c.authorities.filter((a) => a.stance === "supporting").length
  const contraryCount = c.authorities.filter((a) => a.stance === "contrary" || a.stance === "opposing").length
  const provenFacts = c.facts.filter((f) => f.status === "judicially_established" || f.status === "undisputed").length
  const disputedFacts = c.facts.filter((f) => f.status === "denied" || f.status === "contradicted").length
  const unresolvedFacts = c.facts.filter((f) => f.status === "unresolved" || f.status === "alleged").length
  const openIssues = c.issues.filter((i) => i.status === "open" || i.status === "unresolved").length
  const avgScore = c.indicators.length
    ? Math.round(c.indicators.reduce((a, b) => a + b.score, 0) / c.indicators.length)
    : 0

  return (
    <div className="space-y-4">
      {/* Parties + subject */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SovereignPanel title="أطراف النزاع" icon={<Users className="h-4 w-4" />} className="lg:col-span-2">
          <div className="space-y-3">
            <div>
              <div className="font-kufi text-[10px] text-muted-foreground mb-1">الأطراف</div>
              <p className="font-kufi text-sm leading-relaxed">{c.parties}</p>
            </div>
            <div className="gold-rule opacity-30" />
            <div>
              <div className="font-kufi text-[10px] text-muted-foreground mb-1">موضوع الدعوى</div>
              <p className="font-kufi text-sm leading-relaxed">{c.subjectMatter}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <div className="font-kufi text-[10px] text-muted-foreground">المحكمة</div>
                <p className="font-kufi text-xs">{c.court}</p>
              </div>
              <div>
                <div className="font-kufi text-[10px] text-muted-foreground">الدائرة</div>
                <p className="font-kufi text-xs">{c.circuit}</p>
              </div>
              <div>
                <div className="font-kufi text-[10px] text-muted-foreground">تاريخ الإيداع</div>
                <p className="font-jetbrains text-xs">{formatDate(c.filedDate)}</p>
              </div>
              <div>
                <div className="font-kufi text-[10px] text-muted-foreground">الجلسة القادمة</div>
                <p className="font-jetbrains text-xs">{formatDate(c.nextHearing)}</p>
              </div>
            </div>
          </div>
        </SovereignPanel>

        <SovereignPanel title="مؤشر السلامة الإجمالي" icon={<ShieldCheck className="h-4 w-4" />} accent>
          <div className="flex flex-col items-center py-2">
            <IndicatorRing score={avgScore} status={avgScore >= 75 ? "pass" : avgScore >= 50 ? "warn" : "fail"} size={96} />
            <p className="font-kufi text-xs text-muted-foreground mt-2">متوسط مؤشرات السلامة</p>
            <div className="grid grid-cols-2 gap-1.5 w-full mt-3">
              {c.indicators.map((ind) => {
                const meta = findConstant(INDICATOR_TYPES, ind.indicatorType)
                return (
                  <div key={ind.id} className={cn("rounded border px-2 py-1.5 text-center", colorClasses(
                    ind.status === "pass" ? "emerald" : ind.status === "warn" ? "amber" : ind.status === "fail" ? "red" : "slate"
                  ).border)}>
                    <div className="font-jetbrains text-sm font-semibold">{ind.score}</div>
                    <div className="font-kufi text-[9px] text-muted-foreground leading-tight">{meta?.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </SovereignPanel>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="الوقائع المثبتة" value={provenFacts} sub="من إجمالي الوقائع" color="emerald" icon={<FileText className="h-4 w-4" />} />
        <StatTile label="الوقائع المتنازع عليها" value={disputedFacts} sub="تحتاج فحص" color="orange" icon={<Swords className="h-4 w-4" />} />
        <StatTile label="الوقائع غير المحسومة" value={unresolvedFacts} sub="بحاجة لإثبات" color="amber" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatTile label="المسائل المفتوحة" value={openIssues} sub="من المسائل القانونية" color="violet" icon={<GitBranch className="h-4 w-4" />} />
        <StatTile label="السلطات المؤيِّدة" value={supportingCount} sub="من السلطات" color="emerald" icon={<Scale className="h-4 w-4" />} />
        <StatTile label="السلطات المخالِفة" value={contraryCount} sub="بحث نشط مطلوب" color="red" icon={<Scale className="h-4 w-4" />} />
        <StatTile label="الأدلة" value={c.evidence.length} sub="مستندات وأدلة رقمية" color="blue" icon={<FolderOpen className="h-4 w-4" />} />
        <StatTile label="تحليلات AI" value={c.aiAnalyses.length} sub="غير ملزمة — مراجعة القاضي" color="gold" icon={<Bot className="h-4 w-4" />} />
      </div>

      {/* Key facts summary */}
      <SovereignPanel title="أبرز الوقائع" icon={<FileText className="h-4 w-4" />}>
        <div className="space-y-2">
          {c.facts.slice(0, 5).map((f) => (
            <div key={f.id} className="flex items-start gap-2.5 rounded border border-border/40 bg-background/40 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="font-kufi text-xs leading-relaxed">{f.statement}</p>
                {f.party && <span className="font-kufi text-[10px] text-muted-foreground">— {f.party}</span>}
              </div>
              <FactStatusMini status={f.status} />
            </div>
          ))}
        </div>
      </SovereignPanel>
    </div>
  )
}

function FactStatusMini({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    judicially_established: { label: "مثبتة", color: "emerald" },
    undisputed: { label: "غير متنازع", color: "blue" },
    admitted: { label: "مُقَرّ", color: "blue" },
    denied: { label: "منكَرة", color: "red" },
    contradicted: { label: "معارَضة", color: "orange" },
    supported: { label: "مؤيّدة", color: "teal" },
    alleged: { label: "مدّعى", color: "slate" },
    unresolved: { label: "غير محسومة", color: "amber" },
  }
  const m = map[status] ?? { label: status, color: "slate" }
  return <StatusBadge label={m.label} color={m.color} size="sm" />
}
