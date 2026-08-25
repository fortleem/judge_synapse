"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Bot, Sparkles, AlertTriangle, ShieldAlert, Ban, Info, Loader2, Send, Cpu, Zap } from "lucide-react"
import { cn, colorClasses, formatDateTime } from "@/lib/judicial/ui"
import { AI_RESPONSE_STATUS, findConstant } from "@/lib/judicial/constants"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"

const STATUS_ICONS: Record<string, React.ReactNode> = {
  verified: <Sparkles className="h-4 w-4" />,
  partially_verified: <Info className="h-4 w-4" />,
  conflicted: <AlertTriangle className="h-4 w-4" />,
  insufficient: <ShieldAlert className="h-4 w-4" />,
  unverified: <Info className="h-4 w-4" />,
  blocked: <Ban className="h-4 w-4" />,
}

const TASK_TYPES = [
  { value: "summary", label: "ملخّص تحليلي", desc: "ملخص وقائع وأسس قانونية محتملة", icon: <Bot className="h-3.5 w-3.5" /> },
  { value: "adversarial", label: "مراجعة خصومية", desc: "اختبر النتيجة من زوايا مضادة", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  { value: "research", label: "بحث قانوني", desc: "ابحث عن مبادئ قضائية ذات صلة", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { value: "drafting", label: "مسودة تسبيب", desc: "صياغة أوّلية للتسبيب (غير مُلزِمة)", icon: <Cpu className="h-3.5 w-3.5" /> },
  { value: "extraction", label: "استخراج وقائع", desc: "استخراج وقائع وأدلة من السياق", icon: <Zap className="h-3.5 w-3.5" /> },
] as const

export function AIAnalysisTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const qc = useQueryClient()
  const [task, setTask] = React.useState<string>("summary")
  const [prompt, setPrompt] = React.useState("")
  const [lastResult, setLastResult] = React.useState<{
    ok: boolean
    provider: string
    modelId: string
    content: string
    nonAuthoritative: boolean
    provenance: string
    responseStatus: string
    policyNote: string
    tokensUsed?: number
    latencyMs: number
    error?: string
  } | null>(null)

  const assistMut = useMutation({
    mutationFn: () => api.aiAssist(c.id, task, prompt) as Promise<any>,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      setLastResult(result)
      if (result.ok) {
        toast.success(`تم التحليل عبر ${result.provider} — غير مُلزِم`)
      } else {
        toast.warning("محظور بالسياسة — راجع ملاحظة التوجيه")
      }
    },
    onError: () => toast.error("فشل الاستدعاء — تحقّق من الاتصال بالمزوّد"),
  })

  const quickPrompts: Record<string, string> = {
    summary: "قدّم ملخّصاً تحليلياً للقضية يربط الوقائع بالأسس القانونية المحتملة، مع ذكر أيّ ثغرات أو نقاط تحتاج توضيحاً.",
    adversarial: "اختبر النتيجة المحتملة من زاوية الخصم: ما الدفوع التي لم تُعالَج؟ ما السلطات المخالفة المحتملة؟ ما الثغرات الإجرائية؟",
    research: "ما المبادئ القضائية والمواد القانونية ذات الصلة بهذه القضية؟ (لا تخترع استشهادات — اذكر المبادئ العامة فقط)",
    drafting: "صُغ مسودة أوّلية للتسبيب القضائي تربط الوقائع بالنصوص القانونية بالمبادئ بالنتيجة. (مسودة غير مُلزِمة)",
    extraction: "استخرج من سياق القضية: الوقائع المثبتة، الوقائع المتنازع عليها، الأدلة الأساسية، المسائل القانونية المفتوحة.",
  }

  return (
    <div className="space-y-4">
      {/* Separation banner */}
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 shrink-0">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-kufi text-sm font-semibold text-amber-700 mb-0.5">
            مساحة تحليل الذكاء الاصطناعي — منفصلة عن نتائج القاضي
          </h3>
          <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
            مخرجات الذكاء الاصطناعي <span className="text-amber-600 font-medium">لا تصبح تلقائيًا محتوى قضائيًا</span>. كل نتيجة تحمل حالة تحقّق صريحة ووسم «غير مُلزِم». يجب أن يراجعها القاضي ويعتمدها أو يرفضها قبل أي ترقية. الذكاء الاصطناعي يُساعد — القاضي يُمارس السلطة القضائية.
          </p>
        </div>
      </div>

      {/* Sphinx AI Assist Panel */}
      <SovereignPanel title="بوابة Sphinx — مساعدة الذكاء الاصطناعي" icon={<Cpu className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground mb-3 leading-relaxed">
          توجيه سيادي للنماذج الخارجية (Groq / Gemini / HuggingFace) بسياسة صارمة §50. القضايا الحرجة المتعارِضة تُوجَّه للنموذج السيادي المحلي. كل استدعاء يُسجَّل في سجل التدقيق. المخرجات غير مُلزِمة ومراجعة القاضي إلزامية.
        </p>

        {/* Task selector */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {TASK_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTask(t.value); setPrompt(quickPrompts[t.value]) }}
              className={cn(
                "flex items-center gap-1.5 rounded border px-2.5 py-1.5 font-kufi text-[11px] transition-colors",
                task === t.value
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-700"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
              title={t.desc}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="اكتب طلب التحليل هنا… مثال: «حلّل مدى انطباق المادة 147 مدني على هذه القضية»"
          className="font-kufi text-sm min-h-24 mb-2"
        />

        <div className="flex items-center justify-between gap-2">
          <p className="font-kufi text-[10px] text-muted-foreground">
            سياق القضية يُضمَّن تلقائياً في الطلب — لا حاجة لإعادة كتابته
          </p>
          <Button
            onClick={() => assistMut.mutate()}
            disabled={assistMut.isPending || prompt.trim().length < 5}
            className="font-kufi bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            {assistMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            استدعاء التحليل
          </Button>
        </div>

        {/* Result */}
        {lastResult && (
          <div className={cn(
            "mt-3 rounded-md border p-3",
            lastResult.ok ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5"
          )}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-kufi text-xs font-semibold">
                  {lastResult.ok ? `نتيجة التحليل — ${lastResult.provider}/${lastResult.modelId}` : "محظور بالسياسة"}
                </span>
                {lastResult.ok && (
                  <StatusBadge
                    label={lastResult.responseStatus === "verified" ? "متحقَّق" : lastResult.responseStatus === "partially_verified" ? "جزئي" : "غير متحقَّق"}
                    color={lastResult.responseStatus === "verified" ? "emerald" : lastResult.responseStatus === "partially_verified" ? "amber" : "slate"}
                    size="sm"
                  />
                )}
              </div>
              {lastResult.latencyMs && (
                <span className="font-jetbrains text-[9px] text-muted-foreground">
                  {lastResult.tokensUsed} رمز · {(lastResult.latencyMs / 1000).toFixed(1)} ث
                </span>
              )}
            </div>

            {lastResult.ok && lastResult.content && (
              <div className="font-serif-judicial text-sm leading-relaxed whitespace-pre-wrap mb-2">
                {lastResult.content}
              </div>
            )}

            {lastResult.provenance && (
              <p className="font-kufi text-[10px] text-amber-600 border-t border-amber-500/20 pt-1.5 mt-2">
                {lastResult.provenance}
              </p>
            )}
            {lastResult.policyNote && (
              <p className="font-kufi text-[10px] text-muted-foreground mt-1 leading-relaxed">
                <span className="opacity-60">ملاحظة السياسة:</span> {lastResult.policyNote}
              </p>
            )}
            {!lastResult.ok && lastResult.error && (
              <p className="font-kufi text-[10px] text-red-500 mt-1">{lastResult.error}</p>
            )}
          </div>
        )}
      </SovereignPanel>

      {/* Existing analyses */}
      {c.aiAnalyses.length === 0 ? (
        <SovereignPanel title="التحليلات السابقة" icon={<Bot className="h-4 w-4" />}>
          <EmptyState title="لا توجد تحليلات سابقة" hint="استدعِ تحليلاً جديداً عبر بوابة Sphinx أعلاه" icon={<Bot className="h-8 w-8" />} />
        </SovereignPanel>
      ) : (
        <SovereignPanel title={`التحليلات السابقة (${c.aiAnalyses.length})`} icon={<Bot className="h-4 w-4" />}>
          <div className="space-y-3">
            {c.aiAnalyses.map((a) => {
              const statusMeta = findConstant(AI_RESPONSE_STATUS, a.responseStatus)
              const cc = colorClasses(statusMeta?.color ?? "slate")
              return (
                <div key={a.id} className={cn("rounded-md border p-3", cc.border)}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-md shrink-0", cc.bg, cc.text)}>
                        {STATUS_ICONS[a.responseStatus] ?? <Bot className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="font-kufi text-sm font-semibold leading-snug">{a.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {statusMeta && <StatusBadge label={statusMeta.label} color={statusMeta.color} size="sm" glow={a.responseStatus === "conflicted" || a.responseStatus === "insufficient"} />}
                          <StatusBadge label={a.analysisType} color="violet" size="sm" dot={false} />
                          <span className="font-jetbrains text-[9px] text-muted-foreground">{formatDateTime(a.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    {a.nonAuthoritative && (
                      <span className="font-kufi text-[9px] text-amber-600 border border-amber-500/40 rounded px-1.5 py-0.5 shrink-0">
                        غير مُلزِم
                      </span>
                    )}
                  </div>
                  <div className={cn("rounded border p-3 font-kufi text-sm leading-relaxed", cc.border, cc.bg)}>
                    {a.content}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                    <span className="font-jetbrains">النموذج: {a.modelId}</span>
                    {a.provenance && <span className="font-kufi text-right">{a.provenance}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </SovereignPanel>
      )}
    </div>
  )
}
