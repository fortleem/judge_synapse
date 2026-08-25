"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, Trash2, Loader2, Scale, Search, ExternalLink, Quote,
  CheckCircle2, XCircle, AlertTriangle, GitCompare, ShieldAlert, Sparkles,
} from "lucide-react"
import { cn, colorClasses, formatDate } from "@/lib/judicial/ui"
import {
  AUTHORITY_STANCES, LEGAL_FORCE, AUTHORITY_VERIFICATION, findConstant,
} from "@/lib/judicial/constants"
import type { CaseDetailT, AuthorityT, ContrarySearchResult } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"

const STANCE_GROUPS = [
  { key: "supporting", title: "السلطات المؤيِّدة", color: "emerald", icon: <CheckCircle2 className="h-4 w-4" /> },
  { key: "opposing", title: "السلطات المعارِضة", color: "rose", icon: <XCircle className="h-4 w-4" /> },
  { key: "contrary", title: "السلطات المخالِفة", color: "red", icon: <ShieldAlert className="h-4 w-4" /> },
  { key: "distinguishing", title: "السلطات المميِّزة", color: "amber", icon: <GitCompare className="h-4 w-4" /> },
  { key: "neutral", title: "السلطات المحايدة", color: "slate", icon: <Scale className="h-4 w-4" /> },
] as const

export function AuthoritiesTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  return (
    <div className="space-y-4">
      {/* Active contrary search */}
      <ContrarySearchPanel caseId={c.id} />

      <SovereignPanel
        title="النصوص والمبادئ القضائية والسلطات"
        icon={<Scale className="h-4 w-4" />}
        action={<AddAuthorityDialog caseId={c.id} />}
      >
        <p className="font-kufi text-xs text-muted-foreground mb-4 leading-relaxed">
          عرض النصوص والمبادئ القضائية والسلطات المؤيِّدة والمعارِضة. لكل سلطة ملف سلطة منظّم: الجهة المُصدِرة، الهيئة القضائية، نوع الوثيقة، النطاق الزمني، حالة التحقّق. لا يُحوَّل أيّ تقرير أو تعليق إلى سلطة قانونية ملزمة.
        </p>

        {c.authorities.length === 0 ? (
          <EmptyState title="لا توجد سلطات مسجّلة" hint="أضف سلطة قانونية أو قضائية" icon={<Scale className="h-8 w-8" />} />
        ) : (
          <div className="space-y-4">
            {STANCE_GROUPS.map((g) => {
              const items = c.authorities.filter((a) => a.stance === g.key)
              if (items.length === 0) return null
              return (
                <div key={g.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("flex items-center gap-1.5 font-kufi text-xs font-semibold", colorClasses(g.color).text)}>
                      {g.icon}
                      {g.title}
                    </span>
                    <span className="font-jetbrains text-[10px] text-muted-foreground">({items.length})</span>
                    <div className={cn("flex-1 h-px border-t", colorClasses(g.color).border)} />
                  </div>
                  <div className="space-y-2">
                    {items.map((a) => <AuthorityCard key={a.id} authority={a} caseId={c.id} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SovereignPanel>
    </div>
  )
}

function AuthorityCard({ authority: a, caseId }: { authority: AuthorityT; caseId: string }) {
  const qc = useQueryClient()
  const forceMeta = findConstant(LEGAL_FORCE, a.legalForce)
  const verMeta = findConstant(AUTHORITY_VERIFICATION, a.verificationStatus)
  const delMut = useMutation({
    mutationFn: () => api.deleteAuthority(caseId, a.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تم حذف السلطة")
    },
  })

  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-kufi text-sm font-semibold leading-snug mb-1">{a.title}</h4>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {a.citation && <span className="font-jetbrains text-[10px] text-amber-500 dark:text-amber-400">{a.citation}</span>}
            {forceMeta && <StatusBadge label={forceMeta.label} color="violet" size="sm" dot={false} />}
            {verMeta && <StatusBadge label={verMeta.label} color={verMeta.color} size="sm" />}
            <StatusBadge label={a.temporalStatus === "current" ? "سارية" : a.temporalStatus === "historical" ? "تاريخية" : "انتقالية"} color={a.temporalStatus === "current" ? "emerald" : "slate"} size="sm" dot={false} />
            <StatusBadge label={`الطبقة ${a.sourceTier}`} color="slate" size="sm" dot={false} />
          </div>
          {(a.issuingAuthority || a.court || a.legalDomain) && (
            <div className="flex items-center gap-3 flex-wrap font-kufi text-[10px] text-muted-foreground mb-2">
              {a.issuingAuthority && <span>الجهة: {a.issuingAuthority}</span>}
              {a.court && <span>المحكمة: {a.court}</span>}
              {a.chamber && <span>الدائرة: {a.chamber}</span>}
              {a.legalDomain && <span>المجال: {a.legalDomain}</span>}
              {a.referenceDate && <span className="font-jetbrains">التاريخ: {formatDate(a.referenceDate)}</span>}
            </div>
          )}
          {a.exactPassage && (
            <div className="rounded border-r-2 border-amber-500/50 bg-amber-500/5 px-3 py-2 my-2">
              <div className="flex items-start gap-2">
                <Quote className="h-3 w-3 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="font-serif-judicial text-sm leading-relaxed italic">{a.exactPassage}</p>
              </div>
            </div>
          )}
          {a.relationNote && (
            <p className="font-kufi text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-amber-600 dark:text-amber-400 font-medium">العلاقة: </span>
              {a.relationNote}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {a.contrarySearched && (
            <StatusBadge label="تم البحث المخالف" color="blue" size="sm" dot={false} />
          )}
          {a.sourceUrl && (
            <a href={a.sourceUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-amber-500 transition-colors" title="فتح المصدر الأصلي">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button onClick={() => delMut.mutate()} className="text-muted-foreground hover:text-red-500 transition-colors">
            {delMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Active contrary-authority search (§31, §36) ───────────────
function ContrarySearchPanel({ caseId }: { caseId: string }) {
  const [proposition, setProposition] = React.useState("")
  const [result, setResult] = React.useState<ContrarySearchResult | null>(null)
  const qc = useQueryClient()

  const searchMut = useMutation({
    mutationFn: () => api.searchContraryAuthorities(caseId, proposition),
    onSuccess: (data) => {
      setResult(data)
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      if (data.found > 0) {
        toast.success(`تم العثور على ${data.found} سلطة مخالفة محقَّق منها`)
      } else {
        toast.info("لم يُعثر على سلطات مخالفة في السجل المسجّل")
      }
    },
    onError: () => toast.error("فشل البحث"),
  })

  return (
    <SovereignPanel title="البحث النشط عن السلطات المخالفة أو المضادة" icon={<Search className="h-4 w-4" />} accent>
      <div className="space-y-3">
        <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
          لكل م proposition قانوني: ابحث عن السلطة المؤيِّدة، والسلطة المخالِفة، والسلطة المميِّزة، والسلطة الأحدث الناقضة. لا يُنشئ النظام استشهادات — كل نتيجة محقَّق منها مسبقًا من السجل القضائي المُسجّل.
        </p>

        <div className="flex gap-2">
          <Textarea
            value={proposition}
            onChange={(e) => setProposition(e.target.value)}
            placeholder="أدخل القضية القانونية أو النص المراد البحث عن مخالفته… مثال: «القوة القاهرة تعفي المدين من التعويض»"
            className="font-kufi text-sm min-h-16 flex-1"
          />
          <Button
            onClick={() => searchMut.mutate()}
            disabled={searchMut.isPending || proposition.trim().length < 3}
            className="font-kufi bg-amber-600 hover:bg-amber-700 text-white"
          >
            {searchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            بحث مخالف
          </Button>
        </div>

        {result && (
          <div className="rounded-md border border-border bg-background/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-kufi text-xs font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                نتائج البحث: {result.found} سلطة مخالفة محتملة
              </span>
              <span className="font-jetbrains text-[10px] text-muted-foreground">
                تغطية ~{result.coverage.coveragePercent}%
              </span>
            </div>

            {result.results.length > 0 ? (
              <div className="space-y-2">
                {result.results.map((r, i) => (
                  <div key={i} className="rounded border border-red-500/30 bg-red-500/5 p-2.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h5 className="font-kufi text-xs font-semibold">{r.title}</h5>
                      <StatusBadge label="مخالِفة" color="red" size="sm" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-jetbrains text-[10px] text-amber-500 dark:text-amber-400">{r.citation}</span>
                      <span className="font-kufi text-[10px] text-muted-foreground">{r.court}</span>
                    </div>
                    <div className="rounded border-r-2 border-red-500/50 px-2 py-1.5 mb-1.5">
                      <p className="font-serif-judicial text-xs italic leading-relaxed">{r.exactPassage}</p>
                    </div>
                    <p className="font-kufi text-[10px] text-muted-foreground leading-relaxed">{r.relationNote}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-center">
                <p className="font-kufi text-xs text-emerald-700 dark:text-emerald-300">
                  لم يُعثر على سلطات مخالفة في السجل المسجّل — «لا توجد سلطة موثّقة محدَّدة» هو نتيجة ناجحة للنظام.
                </p>
              </div>
            )}

            <div className="border-t border-border pt-2">
              <p className="font-kufi text-[10px] text-muted-foreground mb-1">قيود التغطية:</p>
              <ul className="space-y-0.5">
                {result.coverage.limitations.map((l, i) => (
                  <li key={i} className="font-kufi text-[10px] text-muted-foreground/80 leading-relaxed flex items-start gap-1">
                    <span className="text-amber-500">•</span> {l}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </SovereignPanel>
  )
}

function AddAuthorityDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [stance, setStance] = React.useState("supporting")
  const [legalForce, setLegalForce] = React.useState("court_judgment")
  const [citation, setCitation] = React.useState("")
  const [court, setCourt] = React.useState("")
  const [exactPassage, setExactPassage] = React.useState("")
  const [relationNote, setRelationNote] = React.useState("")
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.createAuthority(caseId, {
      title, stance, legalForce,
      citation: citation || null,
      court: court || null,
      exactPassage: exactPassage || null,
      relationNote: relationNote || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تمت إضافة السلطة")
      setOpen(false)
      setTitle(""); setCitation(""); setCourt(""); setExactPassage(""); setRelationNote("")
    },
    onError: () => toast.error("فشل الإضافة"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-kufi text-xs h-8 border-amber-500/40 text-amber-600 dark:text-amber-400">
          <Plus className="h-3.5 w-3.5" /> إضافة سلطة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-kufi">إضافة سلطة قانونية / قضائية</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان السلطة" className="font-kufi text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">الموقف</label>
              <Select value={stance} onValueChange={setStance}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUTHORITY_STANCES.map((s) => <SelectItem key={s.value} value={s.value} className="font-kufi text-xs">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">القوة القانونية</label>
              <Select value={legalForce} onValueChange={setLegalForce}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEGAL_FORCE.map((f) => <SelectItem key={f.value} value={f.value} className="font-kufi text-xs">{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={citation} onChange={(e) => setCitation(e.target.value)} placeholder="الاستشهاد (مثال: مدني — 147)" className="font-kufi text-sm" />
            <Input value={court} onChange={(e) => setCourt(e.target.value)} placeholder="المحكمة / الجهة" className="font-kufi text-sm" />
          </div>
          <Textarea value={exactPassage} onChange={(e) => setExactPassage(e.target.value)} placeholder="النص الحرفي (إن وُجد)" className="font-kufi text-sm min-h-20" />
          <Input value={relationNote} onChange={(e) => setRelationNote(e.target.value)} placeholder="ملاحظة العلاقة بالقضية" className="font-kufi text-sm" />
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !title.trim()} className="font-kufi">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
