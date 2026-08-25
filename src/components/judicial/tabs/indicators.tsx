"use client"

import * as React from "react"
import {
  Quote, GitBranch, Shield, Puzzle, ShieldCheck, AlertTriangle, XCircle, Clock,
} from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import { INDICATOR_TYPES, INDICATOR_STATUS, findConstant } from "@/lib/judicial/constants"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { SovereignPanel, IndicatorRing, StatusBadge } from "../ui/primitives"

const ICONS: Record<string, React.ReactNode> = {
  citation_soundness: <Quote className="h-4 w-4" />,
  legal_version: <GitBranch className="h-4 w-4" />,
  defense_coverage: <Shield className="h-4 w-4" />,
  evidence_consistency: <Puzzle className="h-4 w-4" />,
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pass: <ShieldCheck className="h-3.5 w-3.5" />,
  warn: <AlertTriangle className="h-3.5 w-3.5" />,
  fail: <XCircle className="h-3.5 w-3.5" />,
  pending: <Clock className="h-3.5 w-3.5" />,
}

export function IndicatorsTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const avg = c.indicators.length
    ? Math.round(c.indicators.reduce((a, b) => a + b.score, 0) / c.indicators.length)
    : 0
  const overallStatus = avg >= 75 ? "pass" : avg >= 50 ? "warn" : avg > 0 ? "fail" : "pending"

  return (
    <div className="space-y-4">
      <SovereignPanel title="مؤشرات سلامة الحكم" icon={<ShieldCheck className="h-4 w-4" />} accent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="flex flex-col items-center md:col-span-1">
            <IndicatorRing score={avg} status={overallStatus} size={110} />
            <span className="font-kufi text-xs text-muted-foreground mt-2">المتوسط الإجمالي</span>
            <StatusBadge
              label={findConstant(INDICATOR_STATUS, overallStatus)?.label ?? "قيد الانتظار"}
              color={findConstant(INDICATOR_STATUS, overallStatus)?.color ?? "slate"}
              size="sm"
              glow={overallStatus === "warn" || overallStatus === "fail"}
            />
          </div>

          <div className="md:col-span-4 space-y-2">
            <p className="font-kufi text-xs text-muted-foreground leading-relaxed mb-2">
              لا يعرض النظام «درجة ثقة 97%» عامة. بدلًا من ذلك، مؤشرات مُنمَّطة: سلامة الاستشهادات، النسخة القانونية السارية، تغطية الدفوع، اتساق الأدلة. يعرف القاضي <span className="text-amber-600 dark:text-amber-400 font-medium">ما الذي يُشكَل فيه</span>، لا رقمًا معتمًا.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INDICATOR_TYPES.map((t) => {
                const ind = c.indicators.find((i) => i.indicatorType === t.value)
                const score = ind?.score ?? 0
                const status = ind?.status ?? "pending"
                const sm = findConstant(INDICATOR_STATUS, status)
                const cc = colorClasses(sm?.color ?? "slate")
                return (
                  <div key={t.value} className={cn("rounded-md border p-2.5 flex items-center gap-2.5", cc.border)}>
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-md shrink-0", cc.bg, cc.text)}>
                      {ICONS[t.value]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-kufi text-xs font-medium truncate">{t.label}</span>
                        <span className="font-jetbrains text-sm font-semibold">{score}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {STATUS_ICON[status]}
                        <span className={cn("font-kufi text-[10px]", cc.text)}>{sm?.label}</span>
                      </div>
                      {ind?.details && <p className="font-kufi text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{ind.details}</p>}
                    </div>
                    {/* mini bar */}
                    <div className="w-1.5 h-8 rounded-full bg-muted/40 overflow-hidden shrink-0">
                      <div
                        className={cn("w-full transition-all", cc.dot)}
                        style={{ height: `${score}%`, marginTop: `${100 - score}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </SovereignPanel>

      {/* Detailed checklist */}
      <SovereignPanel title="قائمة فحص سلامة الحكم" icon={<ShieldCheck className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {CHECKLIST.map((item) => {
            const ind = c.indicators.find((i) => i.indicatorType === item.indicator)
            const status = ind?.status ?? "pending"
            const sm = findConstant(INDICATOR_STATUS, status)
            const cc = colorClasses(sm?.color ?? "slate")
            return (
              <div key={item.label} className={cn("rounded-md border p-2.5 flex items-start gap-2", cc.border)}>
                <div className={cn("flex h-6 w-6 items-center justify-center rounded shrink-0 mt-0.5", cc.bg, cc.text)}>
                  {STATUS_ICON[status]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-kufi text-xs font-medium">{item.label}</p>
                  <p className="font-kufi text-[10px] text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </SovereignPanel>
    </div>
  )
}

const CHECKLIST = [
  { indicator: "citation_soundness" as const, label: "فحص الاستشهادات", desc: "كل استشهاد متحقَّق منه ضدّ المصدر القانوني الأصلي — لا ضدّ فهرس المتجهات" },
  { indicator: "legal_version" as const, label: "النسخة القانونية السارية", desc: "كل نص قانوني في نسخته المُحدَّدة زمنيًا — لا تُدمَج النسخ التاريخية مع السارية" },
  { indicator: "defense_coverage" as const, label: "تغطية الدفوع", desc: "كل دفع جوهري معالج في التسبيب — لا دفع جوهري مهجور" },
  { indicator: "evidence_consistency" as const, label: "اتساق الأدلة", desc: "الأدلة لا تتناقض داخليًا ولا مع الوقائع المثبتة" },
]
