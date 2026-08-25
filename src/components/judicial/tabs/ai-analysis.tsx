"use client"

import * as React from "react"
import { Bot, Sparkles, AlertTriangle, ShieldAlert, Ban, Info, Loader2 } from "lucide-react"
import { cn, colorClasses, formatDateTime } from "@/lib/judicial/ui"
import { AI_RESPONSE_STATUS, findConstant } from "@/lib/judicial/constants"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"

const STATUS_ICONS: Record<string, React.ReactNode> = {
  verified: <Sparkles className="h-4 w-4" />,
  partially_verified: <Info className="h-4 w-4" />,
  conflicted: <AlertTriangle className="h-4 w-4" />,
  insufficient: <ShieldAlert className="h-4 w-4" />,
  unverified: <Info className="h-4 w-4" />,
  blocked: <Ban className="h-4 w-4" />,
}

export function AIAnalysisTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  return (
    <div className="space-y-4">
      {/* Separation banner */}
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-500/15 text-amber-500 dark:text-amber-400 shrink-0">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-kufi text-sm font-semibold text-amber-700 dark:text-amber-300 mb-0.5">
            مساحة تحليل الذكاء الاصطناعي — منفصلة عن نتائج القاضي
          </h3>
          <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
            مخرجات الذكاء الاصطناعي <span className="text-amber-600 dark:text-amber-400 font-medium">لا تصبح تلقائيًا محتوى قضائيًا</span>. كل نتيجة تحمل حالة تحقّق صريحة ووسم «غير مُلزِم». يجب أن يراجعها القاضي ويعتمدها أو يرفضها قبل أي ترقية. الذكاء الاصطناعي يُساعد — القاضي يُمارس السلطة القضائية.
          </p>
        </div>
      </div>

      {c.aiAnalyses.length === 0 ? (
        <SovereignPanel title="تحليلات الذكاء الاصطناعي" icon={<Bot className="h-4 w-4" />}>
          <EmptyState title="لا توجد تحليلات AI متاحة" hint="سيظهر هنا تحليل أوّلي ومراجعة خصومية عند توفّرها" icon={<Bot className="h-8 w-8" />} />
        </SovereignPanel>
      ) : (
        <div className="space-y-3">
          {c.aiAnalyses.map((a) => {
            const statusMeta = findConstant(AI_RESPONSE_STATUS, a.responseStatus)
            const cc = colorClasses(statusMeta?.color ?? "slate")
            return (
              <SovereignPanel key={a.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
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
                      <span className="font-kufi text-[9px] text-amber-600 dark:text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 shrink-0">
                        غير مُلزِم
                      </span>
                    )}
                  </div>

                  <div className={cn("rounded-md border p-3 font-kufi text-sm leading-relaxed", cc.border, cc.bg)}>
                    {a.content}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-jetbrains">النموذج: {a.modelId}</span>
                    {a.provenance && <span className="font-kufi">{a.provenance}</span>}
                  </div>
                </div>
              </SovereignPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}
