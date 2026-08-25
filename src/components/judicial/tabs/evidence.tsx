"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, Trash2, Loader2, FolderOpen, FileText, Mail, MessageSquare,
  Image as ImageIcon, Video, AudioLines, PenTool, Scan, Table2, Landmark, File,
} from "lucide-react"
import { cn, colorClasses, formatDate } from "@/lib/judicial/ui"
import { EVIDENCE_TYPES, EVIDENCE_ADMISSIBILITY, findConstant } from "@/lib/judicial/constants"
import type { CaseDetailT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"

const EVIDENCE_ICONS: Record<string, React.ReactNode> = {
  contract: <FileText className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  pdf: <File className="h-4 w-4" />,
  spreadsheet: <Table2 className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  audio: <AudioLines className="h-4 w-4" />,
  signature: <PenTool className="h-4 w-4" />,
  scan: <Scan className="h-4 w-4" />,
  official_record: <Landmark className="h-4 w-4" />,
}

export function EvidenceTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const docs = c.evidence.filter((e) => e.type === "document")
  const digital = c.evidence.filter((e) => e.type === "digital")

  return (
    <div className="space-y-4">
      <SovereignPanel
        title="إدارة الأدلة والمستندات والأدلة الرقمية"
        icon={<FolderOpen className="h-4 w-4" />}
        action={<AddEvidenceDialog caseId={c.id} />}
      >
        <p className="font-kufi text-xs text-muted-foreground mb-4 leading-relaxed">
          يتميّز النظام بين: وجود الدليل ← قبول الدليل ← إثبات الدليل لواقعة. كل دليل له بصمة تكامل وحالة قبول ومعالجة قضائية. لا يُصادِق الذكاء الاصطناعي على الأصالة إلا بإجراء تحقّق معتمد.
        </p>

        {c.evidence.length === 0 ? (
          <EmptyState title="لا توجد أدلة مسجّلة" hint="أضف مستندًا أو دليلًا رقميًا" icon={<FolderOpen className="h-8 w-8" />} />
        ) : (
          <div className="space-y-4">
            {docs.length > 0 && (
              <EvidenceGroup title="المستندات" count={docs.length} evidence={docs} caseId={c.id} />
            )}
            {digital.length > 0 && (
              <EvidenceGroup title="الأدلة الرقمية" count={digital.length} evidence={digital} caseId={c.id} />
            )}
          </div>
        )}
      </SovereignPanel>
    </div>
  )
}

function EvidenceGroup({ title, count, evidence, caseId }: {
  title: string; count: number; evidence: CaseDetailT["evidence"]; caseId: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-kufi text-xs font-semibold text-amber-500 dark:text-amber-400">{title}</span>
        <span className="font-jetbrains text-[10px] text-muted-foreground">({count})</span>
        <div className="flex-1 h-px border-t border-amber-500/30" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {evidence.map((e) => <EvidenceCard key={e.id} evidence={e} caseId={caseId} />)}
      </div>
    </div>
  )
}

function EvidenceCard({ evidence: e, caseId }: { evidence: CaseDetailT["evidence"][number]; caseId: string }) {
  const qc = useQueryClient()
  const typeMeta = findConstant(EVIDENCE_TYPES, e.evidenceType)
  const admMeta = findConstant(EVIDENCE_ADMISSIBILITY, e.admissibility)

  const delMut = useMutation({
    mutationFn: () => api.deleteEvidence(caseId, e.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تم حذف الدليل")
    },
  })

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3 hover:border-amber-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-500 dark:text-amber-400 shrink-0">
          {EVIDENCE_ICONS[e.evidenceType] ?? <File className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-kufi text-sm font-medium leading-snug mb-1">{e.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge label={typeMeta?.label ?? e.evidenceType} color="slate" size="sm" dot={false} />
            {admMeta && <StatusBadge label={admMeta.label} color={admMeta.color} size="sm" />}
            <StatusBadge label={e.judicialTreatment === "accepted" ? "مقبول قضائيًا" : e.judicialTreatment === "rejected" ? "مرفوض" : e.judicialTreatment === "weighed" ? "موُزون" : "غير فاحص"} color={
              e.judicialTreatment === "accepted" ? "emerald" : e.judicialTreatment === "rejected" ? "red" : "amber"
            } size="sm" dot={false} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-kufi text-[10px] text-muted-foreground">
            {e.date && <div><span className="opacity-60">التاريخ:</span> {formatDate(e.date)}</div>}
            {e.origin && <div><span className="opacity-60">المصدر:</span> {e.origin}</div>}
            {e.relevance && <div className="col-span-2"><span className="opacity-60">الصلة:</span> {e.relevance}</div>}
            {e.integrityHash && (
              <div className="col-span-2 font-jetbrains text-[9px] truncate" title={e.integrityHash}>
                <span className="opacity-60">بصمة التكامل:</span> {e.integrityHash}
              </div>
            )}
          </div>
        </div>
        <button onClick={() => delMut.mutate()} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0" title="حذف">
          {delMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

function AddEvidenceDialog({ caseId }: { caseId: string }) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [type, setType] = React.useState<"document" | "digital">("document")
  const [evidenceType, setEvidenceType] = React.useState("contract")
  const [origin, setOrigin] = React.useState("")
  const [date, setDate] = React.useState("")
  const [relevance, setRelevance] = React.useState("")
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.createEvidence(caseId, {
      title, type, evidenceType,
      origin: origin || null,
      date: date || null,
      relevance: relevance || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تمت إضافة الدليل")
      setOpen(false)
      setTitle(""); setOrigin(""); setDate(""); setRelevance("")
    },
    onError: () => toast.error("فشل الإضافة"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-kufi text-xs h-8 border-amber-500/40 text-amber-600 dark:text-amber-400">
          <Plus className="h-3.5 w-3.5" /> إضافة دليل
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-kufi">إضافة دليل جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان الدليل" className="font-kufi text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">النوع</label>
              <Select value={type} onValueChange={(v) => setType(v as "document" | "digital")}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="document" className="font-kufi text-xs">مستند</SelectItem>
                  <SelectItem value="digital" className="font-kufi text-xs">رقمي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">صنف الدليل</label>
              <Select value={evidenceType} onValueChange={setEvidenceType}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="font-kufi text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="المصدر" className="font-kufi text-sm" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="font-jetbrains text-sm" />
          </div>
          <Input value={relevance} onChange={(e) => setRelevance(e.target.value)} placeholder="الصلة بالقضية" className="font-kufi text-sm" />
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
