"use client"

import * as React from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  Search, Scale, AlertTriangle, ShieldAlert, Info, Loader2, ExternalLink,
  CheckCircle2, XCircle, Zap, TrendingUp, TrendingDown, Minus,
  Globe, FileText, Sparkles, Brain,
} from "lucide-react"
import { cn, colorClasses, formatDate } from "@/lib/judicial/ui"
import { COURT_TYPES } from "@/lib/judicial/court-types"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type SubTab = "law-check" | "contradictions" | "strength"

export function InsightsTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const [sub, setSub] = React.useState<SubTab>("contradictions")

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1">
        {([
          { key: "contradictions", label: "تنبيهات التعارض", icon: <AlertTriangle className="h-3.5 w-3.5" />, badge: true },
          { key: "law-check", label: "فحص رقم القانون", icon: <Search className="h-3.5 w-3.5" /> },
          { key: "strength", label: "مقياس القوة", icon: <Scale className="h-3.5 w-3.5" /> },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setSub(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-md font-kufi text-xs transition-colors",
              sub === t.key
                ? "bg-amber-500/15 text-amber-700 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {sub === "contradictions" && <ContradictionPanel caseId={c.id} caseTitle={c.title} />}
      {sub === "law-check" && <LawCheckPanel caseId={c.id} court={c.court} />}
      {sub === "strength" && <StrengthPanel caseId={c.id} />}
    </div>
  )
}

// ─── Contradiction Alerts Panel ─────────────────────────────────
function ContradictionPanel({ caseId, caseTitle }: { caseId: string; caseTitle: string }) {
  const scanQ = useQuery({
    queryKey: ["contradictions", caseId],
    queryFn: () => api.scanContradictions(caseId) as Promise<any>,
    enabled: !!caseId,
  })

  const report = scanQ.data?.data ?? scanQ.data

  if (scanQ.isLoading) {
    return (
      <SovereignPanel title="مسح التعارضات" icon={<AlertTriangle className="h-4 w-4" />}>
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
      </SovereignPanel>
    )
  }

  if (!report) return null

  const severityMeta: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    critical: { color: "red", icon: <ShieldAlert className="h-4 w-4" />, label: "حرج" },
    warning: { color: "amber", icon: <AlertTriangle className="h-4 w-4" />, label: "تحذير" },
    info: { color: "blue", icon: <Info className="h-4 w-4" />, label: "إخطار" },
  }

  return (
    <div className="space-y-4">
      {/* Summary banner */}
      <div className={cn(
        "rounded-lg border-2 p-4 seal-frame",
        report.criticalCount > 0 ? "border-red-500/40 bg-red-500/5"
          : report.warningCount > 0 ? "border-amber-500/40 bg-amber-500/5"
          : "border-emerald-500/40 bg-emerald-500/5"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg shrink-0",
            report.criticalCount > 0 ? "bg-red-500/15 text-red-600"
              : report.warningCount > 0 ? "bg-amber-500/15 text-amber-600"
              : "bg-emerald-500/15 text-emerald-600"
          )}>
            {report.criticalCount > 0 ? <ShieldAlert className="h-6 w-6" /> : report.warningCount > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <h3 className="font-serif-judicial text-lg font-bold mb-1">
              {report.totalAlerts === 0 ? "لا توجد تعارضات" : `${report.totalAlerts} تنبيه مُكتشَف`}
            </h3>
            <p className="font-kufi text-xs text-muted-foreground leading-relaxed">{report.summary}</p>
            <div className="flex items-center gap-3 mt-2">
              {report.criticalCount > 0 && <StatusBadge label={`${report.criticalCount} حرج`} color="red" size="sm" glow />}
              {report.warningCount > 0 && <StatusBadge label={`${report.warningCount} تحذير`} color="amber" size="sm" />}
              {report.infoCount > 0 && <StatusBadge label={`${report.infoCount} إخطار`} color="blue" size="sm" />}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts list */}
      {report.alerts.length === 0 ? (
        <SovereignPanel title="كل شيء سليم" icon={<CheckCircle2 className="h-4 w-4" />}>
          <EmptyState title="لا توجد تعارضات أو تنبيهات" hint="القضية سليمة ظاهرياً — لا تعارضات وقائعية أو قانونية أو إجرائية" icon={<CheckCircle2 className="h-8 w-8" />} />
        </SovereignPanel>
      ) : (
        <div className="space-y-3">
          {report.alerts.map((alert: any, i: number) => {
            const meta = severityMeta[alert.severity] ?? severityMeta.warning
            const cc = colorClasses(meta.color)
            return (
              <div key={alert.id ?? i} className={cn("rounded-lg border p-4", cc.border, cc.bg)}>
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-md shrink-0", cc.bg, cc.text)}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-kufi text-sm font-semibold">{alert.title}</h4>
                      <StatusBadge label={meta.label} color={meta.color} size="sm" glow={alert.severity === "critical"} />
                      <span className="font-kufi text-[9px] text-muted-foreground">{alert.category}</span>
                    </div>
                    <p className="font-kufi text-xs text-muted-foreground leading-relaxed mb-2">{alert.description}</p>
                    <div className={cn("rounded border-r-2 px-2 py-1.5 bg-background/50", `border-${meta.color}-500/40`)}>
                      <p className="font-kufi text-[11px] leading-relaxed">
                        <span className="font-medium text-amber-700">التوصية: </span>
                        {alert.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Law Number Check Panel ─────────────────────────────────────
function LawCheckPanel({ caseId, court }: { caseId: string; court: string }) {
  const [lawNumber, setLawNumber] = React.useState("مدني — 147")
  const [courtType, setCourtType] = React.useState("civil_court")
  const [result, setResult] = React.useState<any>(null)

  const checkMut = useMutation({
    mutationFn: () => api.checkLaw(caseId, lawNumber, courtType) as Promise<any>,
    onSuccess: (data) => {
      const r = data.data ?? data
      setResult(r)
      if (r.lawVerified) {
        toast.success("تم التحقق من القانون — موجود في السجل الموثَّق")
      } else {
        toast.warning("القانون غير موجود في السجل — راجع النتائج")
      }
    },
    onError: () => toast.error("فشل الفحص"),
  })

  return (
    <div className="space-y-4">
      <SovereignPanel title="فحص رقم القانون حسب المحكمة" icon={<Search className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground mb-3 leading-relaxed">
          تحقّق من رقم القانون + نوع المحكمة → تطابق الاختصاص + ابحث عن قضايا سابقة مشابهة من الويب + اكتشف التعارضات. مدعوم بالذكاء الاصطناعي.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="md:col-span-2">
            <label className="font-kufi text-xs text-muted-foreground mb-1 block">رقم القانون / الاستشهاد</label>
            <Input value={lawNumber} onChange={(e) => setLawNumber(e.target.value)} placeholder="مثال: مدني — 147، دستوري — 184، مرافعات — 215" className="font-kufi text-sm" />
          </div>
          <div>
            <label className="font-kufi text-xs text-muted-foreground mb-1 block">نوع المحكمة</label>
            <Select value={courtType} onValueChange={setCourtType}>
              <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {COURT_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value} className="font-kufi text-xs">{ct.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={() => checkMut.mutate()}
          disabled={checkMut.isPending || lawNumber.trim().length < 2}
          className="font-kufi bg-amber-600 hover:bg-amber-700 text-white"
        >
          {checkMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          فحص القانون + بحث القضايا السابقة
        </Button>
      </SovereignPanel>

      {/* Results */}
      {result && <LawCheckResult result={result} />}
    </div>
  )
}

function LawCheckResult({ result: r }: { result: any }) {
  return (
    <div className="space-y-3">
      {/* 1. Law verification */}
      <SovereignPanel
        title="1. التحقق من القانون"
        icon={<CheckCircle2 className="h-4 w-4" />}
        action={<StatusBadge label={r.lawVerified ? "متحقَّق" : "غير متحقَّق"} color={r.lawVerified ? "emerald" : "red"} size="sm" glow />}
      >
        {r.legalText ? (
          <div className="space-y-2">
            <h4 className="font-kufi text-sm font-semibold">{r.legalText.title}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="font-jetbrains text-xs text-amber-600">{r.legalText.citation}</code>
              <StatusBadge label={r.legalText.temporalStatus === "current" ? "ساري" : "تاريخي"} color={r.legalText.temporalStatus === "current" ? "emerald" : "amber"} size="sm" dot={false} />
              <StatusBadge label={r.legalText.verificationStatus === "verified" ? "متحقَّق منه" : "جزئي"} color={r.legalText.verificationStatus === "verified" ? "emerald" : "amber"} size="sm" dot={false} />
              <span className="font-kufi text-[10px] text-muted-foreground">ساري من: {formatDate(r.legalText.effectiveFrom)}</span>
            </div>
            <div className="rounded border-r-2 border-amber-500/50 bg-amber-500/5 px-3 py-2">
              <p className="font-serif-judicial text-sm leading-relaxed italic">{r.legalText.exactText}</p>
            </div>
            <p className="font-kufi text-[10px] text-muted-foreground">المصدر: {r.legalText.legalBasis}</p>
          </div>
        ) : (
          <div className="rounded border border-red-500/30 bg-red-500/5 p-3 text-center">
            <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="font-kufi text-xs text-red-600">لم يُعثر على القانون في السجل القانوني الموثَّق — لا يجوز استخدامه حتى يُتحقَّق منه</p>
          </div>
        )}
      </SovereignPanel>

      {/* 2. Jurisdiction check */}
      <SovereignPanel
        title="2. فحص الاختصاص القضائي"
        icon={<Scale className="h-4 w-4" />}
        action={<StatusBadge label={r.jurisdictionApplicable ? "ينطبق" : "لا ينطبق"} color={r.jurisdictionApplicable ? "emerald" : "red"} size="sm" glow={!r.jurisdictionApplicable} />}
      >
        <div className={cn(
          "rounded-md border p-3",
          r.jurisdictionApplicable ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
        )}>
          <p className="font-kufi text-xs leading-relaxed">{r.jurisdictionNote}</p>
        </div>
      </SovereignPanel>

      {/* 3. Similar cases from web */}
      <SovereignPanel
        title="3. قضايا سابقة مشابهة من الويب"
        icon={<Globe className="h-4 w-4" />}
        action={<StatusBadge label={`${r.similarCases.length} نتيجة`} color="blue" size="sm" dot={false} />}
      >
        <p className="font-kufi text-[10px] text-muted-foreground mb-2">
          ⚠ القضايا من الويب غير موثَّقة — للبحث والاكتشاف فقط. تحقّق من المصدر الأصلي قبل الاعتماد.
        </p>
        {r.similarCases.length === 0 ? (
          <EmptyState title="لا توجد قضايا مشابهة" hint="لم يُعثر على نتائج ويب — جرّب رقماً آخر" icon={<Globe className="h-8 w-8" />} />
        ) : (
          <div className="space-y-2">
            {r.similarCases.map((sc: any, i: number) => (
              <a
                key={i}
                href={sc.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-border/60 bg-background/40 p-2.5 hover:border-amber-500/40 hover:bg-card transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h5 className="font-kufi text-xs font-medium leading-snug group-hover:text-amber-600 transition-colors">{sc.title}</h5>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-amber-500 shrink-0" />
                </div>
                <p className="font-kufi text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-1">{sc.snippet}</p>
                <div className="flex items-center gap-2">
                  <span className="font-jetbrains text-[9px] text-amber-600">{sc.source}</span>
                  {sc.date && <span className="font-kufi text-[9px] text-muted-foreground">{sc.date}</span>}
                </div>
              </a>
            ))}
          </div>
        )}
      </SovereignPanel>

      {/* 4. Contradictions */}
      {r.contradictions.length > 0 && (
        <SovereignPanel title="4. تعارضات مُكتشَفة" icon={<AlertTriangle className="h-4 w-4" />} accent>
          <div className="space-y-2">
            {r.contradictions.map((cd: string, i: number) => (
              <div key={i} className="flex items-start gap-2 rounded border border-amber-500/30 bg-amber-500/5 p-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="font-kufi text-xs leading-relaxed">{cd}</p>
              </div>
            ))}
          </div>
        </SovereignPanel>
      )}

      {/* 5. AI Analysis */}
      {r.aiAnalysis && (
        <SovereignPanel
          title="5. تحليل ذكاء اصطناعي"
          icon={<Sparkles className="h-4 w-4" />}
          action={<StatusBadge label="غير مُلزِم" color="amber" size="sm" />}
        >
          <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="font-serif-judicial text-sm leading-relaxed">{r.aiAnalysis}</p>
          </div>
        </SovereignPanel>
      )}
    </div>
  )
}

// ─── Legal Strength Panel ───────────────────────────────────────
function StrengthPanel({ caseId }: { caseId: string }) {
  const strengthQ = useQuery({
    queryKey: ["strength", caseId],
    queryFn: () => api.analyzeStrength(caseId) as Promise<any>,
    enabled: !!caseId,
  })

  const s = strengthQ.data?.data ?? strengthQ.data

  if (strengthQ.isLoading) {
    return (
      <SovereignPanel title="مقياس القوة القانونية" icon={<Scale className="h-4 w-4" />}>
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
      </SovereignPanel>
    )
  }

  if (!s) return null

  const balanceIcon = s.balance === "plaintiff" ? <TrendingUp className="h-5 w-5" />
    : s.balance === "defendant" ? <TrendingDown className="h-5 w-5" />
    : <Minus className="h-5 w-5" />

  const balanceLabel = s.balance === "plaintiff" ? "الميزان يميل للمدّعي"
    : s.balance === "defendant" ? "الميزان يميل للمدّعى عليه"
    : "الميزان متوازن"

  return (
    <div className="space-y-4">
      <SovereignPanel title="مقياس القوة القانونية — توازن الأطراف" icon={<Scale className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground mb-4 leading-relaxed">
          تحليل آلي لتوازن القوة القانونية بين المدّعي والمدّعى عليه — مبني على الوقائع المثبتة، السلطات المؤيِّدة، الأدلة المقبولة، والمسائل المحلولة. هذا تحليل استرشادي غير مُلزِم.
        </p>

        {/* Balance visualization */}
        <div className="rounded-lg border border-border bg-card/40 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <div className="font-kufi text-xs text-muted-foreground mb-1">المدّعي</div>
              <div className="font-jetbrains text-3xl font-bold text-emerald-600">{s.plaintiffScore}</div>
            </div>
            <div className="flex-1 mx-4">
              <div className="relative h-8 rounded-full bg-muted overflow-hidden">
                <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-600 transition-all" style={{ width: `${s.plaintiffScore}%` }} />
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 to-rose-600 transition-all" style={{ width: `${s.defendantScore}%` }} />
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {balanceIcon}
                <span className="font-kufi text-xs font-semibold text-amber-700">{balanceLabel}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="font-kufi text-xs text-muted-foreground mb-1">المدّعى عليه</div>
              <div className="font-jetbrains text-3xl font-bold text-rose-600">{s.defendantScore}</div>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 mb-4">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="font-kufi text-xs leading-relaxed">{s.recommendation}</p>
          </div>
        </div>

        {/* Factors breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <h5 className="font-kufi text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" /> عوامل المدّعي
            </h5>
            <div className="space-y-1.5">
              {s.factors.plaintiff.map((f: any, i: number) => (
                <div key={i} className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-kufi text-xs">{f.label}</span>
                    <span className="font-jetbrains text-xs font-semibold text-emerald-600">+{f.score}</span>
                  </div>
                  <div className="font-kufi text-[9px] text-muted-foreground">{f.weight}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="font-kufi text-xs font-semibold text-rose-700 mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" /> عوامل المدّعى عليه
            </h5>
            <div className="space-y-1.5">
              {s.factors.defendant.map((f: any, i: number) => (
                <div key={i} className="rounded border border-rose-500/30 bg-rose-500/5 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-kufi text-xs">{f.label}</span>
                    <span className="font-jetbrains text-xs font-semibold text-rose-600">+{f.score}</span>
                  </div>
                  <div className="font-kufi text-[9px] text-muted-foreground">{f.weight}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SovereignPanel>
    </div>
  )
}
