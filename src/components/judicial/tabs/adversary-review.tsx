"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Swords, Loader2, Sparkles, AlertTriangle, Shield, BookOpen, GitBranch,
  FileSearch, ArrowRightLeft, Check, X, Lock, Ban, ShieldAlert,
} from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import {
  ADVERSARY_ANGLES, ADVERSARY_TARGET_TYPES, ADVERSARY_TRANSFER_STATUS, findConstant,
} from "@/lib/judicial/constants"
import type { CaseDetailT, AdversaryReviewT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

const ANGLE_ICONS: Record<string, React.ReactNode> = {
  factsAngle: <FileSearch className="h-4 w-4" />,
  textAngle: <BookOpen className="h-4 w-4" />,
  defenseAngle: <Shield className="h-4 w-4" />,
  proceduralAngle: <GitBranch className="h-4 w-4" />,
}

export function AdversaryReviewTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const [proposition, setProposition] = React.useState("")
  const [targetType, setTargetType] = React.useState("proposition")
  const [showConfirm, setShowConfirm] = React.useState<AdversaryReviewT | null>(null)
  const [judgeNote, setJudgeNote] = React.useState("")
  const qc = useQueryClient()

  const generateMut = useMutation({
    mutationFn: () => api.generateAdversaryReview(c.id, proposition, targetType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      toast.success("تم توليد المراجعة الخصومية")
      setProposition("")
    },
    onError: () => toast.error("فشل التوليد"),
  })

  const transferMut = useMutation({
    mutationFn: ({ reviewId, status }: { reviewId: string; status: string }) =>
      api.transferAdversaryReview(c.id, reviewId, status, judgeNote || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      toast.success("تم نقل المراجعة لمساحة القاضي")
      setShowConfirm(null)
      setJudgeNote("")
    },
    onError: () => toast.error("فشل النقل"),
  })

  // Quick propositions from AI analyses
  const quickProps = c.aiAnalyses.map((a) => a.content.slice(0, 200))

  return (
    <div className="space-y-4">
      {/* Doctrine banner */}
      <div className="rounded-lg border-2 border-violet-500/40 bg-violet-500/5 p-4 seal-frame">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 shrink-0">
            <Swords className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif-judicial text-lg font-bold text-violet-700 dark:text-violet-300 mb-1">
              المراجعة الخصومية — الظل القضائي
            </h3>
            <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
              تختبر كل نتيجة من زاوية الوقائع، النص، الدفع المضاد، والاتساق الإجرائي. <span className="text-violet-600 dark:text-violet-400 font-medium">لا تصدر حكماً ولا تعطي نسبة ثقة</span> — بل تكتشف الثغرات المحتملة. أي اقتراح يُنقل لمساحة القاضي فقط بعد مراجعة صريحة وتأكيد. هذا يترجم جوهر «الظل القضائي» بشكل آمن وقابل للتدقيق.
            </p>
          </div>
        </div>
      </div>

      {/* Generate panel */}
      <SovereignPanel title="توليد مراجعة خصومية جديدة" icon={<Sparkles className="h-4 w-4" />} accent>
        <div className="space-y-3">
          <Textarea
            value={proposition}
            onChange={(e) => setProposition(e.target.value)}
            placeholder="أدخل القضية القانونية أو النتيجة المراد اختبارها خصوميًا… مثال: «ثبوت إخلال المدّعى عليه يلزمه بالتعويض»"
            className="font-kufi text-sm min-h-20"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-kufi text-xs text-muted-foreground">نوع الهدف:</span>
            {ADVERSARY_TARGET_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTargetType(t.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded border px-2 py-1 font-kufi text-[10px] transition-colors",
                  targetType === t.value
                    ? cn(colorClasses(t.color).bg, colorClasses(t.color).text, colorClasses(t.color).border)
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
            <Button
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending || proposition.trim().length < 5}
              className="font-kufi ml-auto bg-violet-600 hover:bg-violet-700 text-white"
            >
              {generateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
              اختبار خصومي
            </Button>
          </div>

          {quickProps.length > 0 && !proposition && (
            <div className="pt-2 border-t border-border/40">
              <p className="font-kufi text-[10px] text-muted-foreground mb-1">اقتراحات سريعة من تحليلات AI:</p>
              <div className="flex flex-wrap gap-1.5">
                {quickProps.slice(0, 3).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setProposition(p)}
                    className="font-kufi text-[10px] text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded px-2 py-1 hover:bg-amber-500/10 transition-colors truncate max-w-xs"
                  >
                    {p.slice(0, 80)}…
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SovereignPanel>

      {/* Existing reviews */}
      {c.adversaryReviews.length === 0 ? (
        <EmptyState title="لا توجد مراجعات خصومية بعد" hint="أدخل قضية قانونية واضغط «اختبار خصومي» لتوليد المراجعة" icon={<Swords className="h-8 w-8" />} />
      ) : (
        <div className="space-y-3">
          {c.adversaryReviews.map((r) => (
            <AdversaryReviewCard
              key={r.id}
              review={r}
              onTransfer={(review) => { setShowConfirm(review); setJudgeNote("") }}
            />
          ))}
        </div>
      )}

      {/* Transfer confirmation dialog */}
      {showConfirm && (
        <Dialog open={!!showConfirm} onOpenChange={(o) => !o && setShowConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-kufi flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                تأكيد النقل لمساحة القاضي
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="font-kufi text-xs font-semibold mb-1">القضية المختارة:</p>
                <p className="font-kufi text-sm leading-relaxed">{showConfirm.proposition}</p>
              </div>
              <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
                هل تؤكد نقل هذه المراجعة الخصومية إلى مساحة القاضي؟ سيتم تسجيل النقل في سجل التدقيق كمصدر «adversary_transfer» — منفصل عن قرارات القاضي المباشرة. يمكنك إضافة ملاحظة قبل النقل.
              </p>
              <Textarea
                value={judgeNote}
                onChange={(e) => setJudgeNote(e.target.value)}
                placeholder="ملاحظة القاضي (اختياري)…"
                className="font-kufi text-sm min-h-16"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => transferMut.mutate({ reviewId: showConfirm.id, status: "rejected" })}
                className="font-kufi border-red-500/40 text-red-500 hover:bg-red-500/10"
              >
                <X className="h-4 w-4" /> رفض النقل
              </Button>
              <Button
                onClick={() => transferMut.mutate({ reviewId: showConfirm.id, status: "transferred" })}
                disabled={transferMut.isPending}
                className="font-kufi bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {transferMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                نقل واعتماد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function AdversaryReviewCard({ review: r, onTransfer }: { review: AdversaryReviewT; onTransfer: (r: AdversaryReviewT) => void }) {
  const transferMeta = findConstant(ADVERSARY_TRANSFER_STATUS, r.transferStatus)
  const targetMeta = findConstant(ADVERSARY_TARGET_TYPES, r.targetType)
  const hasVulns = r.vulnerabilities && !r.vulnerabilities.includes("لم تُرصد ثغرات")

  return (
    <SovereignPanel
      title=""
      action={
        <div className="flex items-center gap-2">
          {targetMeta && <StatusBadge label={targetMeta.label} color={targetMeta.color} size="sm" dot={false} />}
          {transferMeta && <StatusBadge label={transferMeta.label} color={transferMeta.color} size="sm" />}
        </div>
      }
    >
      <div className="space-y-3">
        {/* Proposition */}
        <div className="rounded border border-border/60 bg-background/40 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-kufi text-[10px] text-muted-foreground mb-1">القضية المُختارة:</p>
              <p className="font-kufi text-sm font-medium leading-relaxed">{r.proposition}</p>
            </div>
          </div>
        </div>

        {/* 4 angles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ADVERSARY_ANGLES.map((angle) => {
            const content = r[angle.key as keyof AdversaryReviewT] as string
            const hasIssue = content.includes("⚠") || content.includes("تنبيه")
            return (
              <div
                key={angle.key}
                className={cn(
                  "rounded-md border p-3",
                  hasIssue ? "border-amber-500/40 bg-amber-500/5" : "border-border/40 bg-background/30"
                )}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={cn("flex items-center gap-1.5 font-kufi text-xs font-semibold", hasIssue ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                    {ANGLE_ICONS[angle.key]}
                    {angle.label}
                  </span>
                  {hasIssue && <AlertTriangle className="h-3 w-3 text-amber-500 mr-auto" />}
                </div>
                <p className="font-kufi text-[11px] text-muted-foreground leading-relaxed">{content}</p>
              </div>
            )
          })}
        </div>

        {/* Vulnerabilities summary */}
        {r.vulnerabilities && (
          <div className={cn("rounded-md border p-3", hasVulns ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/40 bg-emerald-500/5")}>
            <div className="flex items-start gap-2">
              {hasVulns ? <ShieldAlert className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" /> : <Shield className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />}
              <div>
                <p className={cn("font-kufi text-xs font-semibold mb-1", hasVulns ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                  {hasVulns ? "ثغرات محتملة مُكتشَفة" : "لا ثغرات ظاهرة"}
                </p>
                <p className="font-kufi text-[11px] text-muted-foreground leading-relaxed">{r.vulnerabilities}</p>
                <p className="font-kufi text-[10px] text-muted-foreground/70 mt-1 italic">
                  هذا ليس حكماً على النتيجة بل دعوة لمراجعة القاضي — «ثغرة محتملة» لا تعني «خطأ».
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transfer button */}
        {r.transferStatus === "none" && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              onClick={() => onTransfer(r)}
              className="font-kufi bg-violet-600 hover:bg-violet-700 text-white"
              size="sm"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              نقل لمساحة القاضي
            </Button>
          </div>
        )}

        {r.transferStatus === "transferred" && r.transferredAt && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-kufi text-[10px] text-emerald-600 dark:text-emerald-400">
              نُقلت لمساحة القاضي بتاريخ {new Date(r.transferredAt).toLocaleString("ar-EG")}
            </span>
            {r.judgeNote && <span className="font-kufi text-[10px] text-muted-foreground mr-auto">ملاحظة: {r.judgeNote}</span>}
          </div>
        )}

        {r.transferStatus === "rejected" && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Ban className="h-3.5 w-3.5 text-red-500" />
            <span className="font-kufi text-[10px] text-red-500">رُفض النقل</span>
            {r.judgeNote && <span className="font-kufi text-[10px] text-muted-foreground mr-auto">السبب: {r.judgeNote}</span>}
          </div>
        )}
      </div>
    </SovereignPanel>
  )
}
