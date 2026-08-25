"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Upload, FileText, Trash2, Loader2, Sparkles, CheckCircle2, XCircle,
  AlertTriangle, FileSearch, Bot, User, ArrowRightLeft, Clock, FileImage,
  FileType2, HardDriveDownload,
} from "lucide-react"
import { cn, colorClasses, formatDate, formatDateTime } from "@/lib/judicial/ui"
import type { CaseDetailT, StoredDocumentT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const FILE_ICONS: Record<string, React.ReactNode> = {
  "application/pdf": <FileType2 className="h-4 w-4" />,
  "image/": <FileImage className="h-4 w-4" />,
  "text/": <FileText className="h-4 w-4" />,
}

const OCR_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "بانتظار OCR", color: "slate" },
  processing: { label: "جاري المعالجة", color: "blue" },
  completed: { label: "اكتمل النص", color: "emerald" },
  failed: { label: "فشل OCR", color: "red" },
  not_needed: { label: "لا حاجة", color: "slate" },
}

const EXTRACTION_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "بانتظار الاستخراج", color: "slate" },
  processing: { label: "جاري الاستخراج", color: "blue" },
  completed: { label: "اكتمل الاستخراج", color: "emerald" },
  failed: { label: "فشل الاستخراج", color: "red" },
  partial: { label: "استخراج جزئي", color: "amber" },
}

const UPLOADER_ROLES = [
  { value: "rapporteur", label: "المُقرّر", color: "amber", icon: <User className="h-3 w-3" /> },
  { value: "judge", label: "القاضي", color: "emerald", icon: <User className="h-3 w-3" /> },
  { value: "administrator", label: "المدير", color: "violet", icon: <User className="h-3 w-3" /> },
]

const SOURCE_TYPES = [
  { value: "case_file", label: "ملف القضية" },
  { value: "contract", label: "عقد" },
  { value: "judgment", label: "حكم" },
  { value: "evidence", label: "دليل" },
  { value: "correspondence", label: "مراسلات" },
  { value: "other", label: "أخرى" },
]

export function DocumentsTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const qc = useQueryClient()
  const [uploadedBy, setUploadedBy] = React.useState("rapporteur")
  const [sourceType, setSourceType] = React.useState("case_file")
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const uploadMut = useMutation({
    mutationFn: (file: File) => api.uploadDocument(c.id, file, uploadedBy, sourceType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      toast.success("تم رفع المستند بنجاح")
    },
    onError: (err) => toast.error(`فشل الرفع: ${err instanceof Error ? err.message : "خطأ"}`),
  })

  const handleFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("حجم الملف يتجاوز 20 ميجابايت")
      return
    }
    uploadMut.mutate(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-4">
      {/* Workflow banner */}
      <div className="rounded-lg border border-blue-500/40 bg-blue-500/5 p-3 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/15 text-blue-600 shrink-0">
          <ArrowRightLeft className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-kufi text-sm font-semibold text-blue-700 mb-0.5">
            سير عمل إدخال البيانات — من يُدخل ماذا؟
          </h3>
          <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
            <span className="text-amber-600 font-medium">المُقرّر</span> يرفع المستندات ويُراجع الاستخراج الآلي.
            <span className="text-emerald-600 font-medium"> النظام</span> يستخرج الوقائع والخط الزمني والاستشهادات آليًا — كلها «مرشّحة» حتى يُتحقَّق منها.
            <span className="text-violet-600 font-medium"> القاضي</span> يراجع ويُعتمد أو يرفض قبل أي ترقية لحقوله.
          </p>
        </div>
      </div>

      {/* Upload panel */}
      <SovereignPanel title="رفع مستندات القضية" icon={<Upload className="h-4 w-4" />} accent>
        <div className="space-y-3">
          {/* Role + source type selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">رافع المستند</label>
              <Select value={uploadedBy} onValueChange={setUploadedBy}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UPLOADER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="font-kufi text-xs">
                      <span className="flex items-center gap-1.5">{r.icon} {r.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">نوع المصدر</label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((s) => <SelectItem key={s.value} value={s.value} className="font-kufi text-xs">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              dragOver ? "border-amber-500 bg-amber-500/10" : "border-border hover:border-amber-500/50 hover:bg-muted/30"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ""
              }}
              accept=".pdf,.txt,.json,.csv,.md,.doc,.docx,image/*"
            />
            {uploadMut.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="font-kufi text-sm text-muted-foreground">جاري رفع المستند…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                  <HardDriveDownload className="h-6 w-6" />
                </div>
                <p className="font-kufi text-sm font-medium">اسحب وأفلت المستند هنا أو اضغط للاختيار</p>
                <p className="font-kufi text-[10px] text-muted-foreground">PDF، TXT، CSV، MD، صور — بحد أقصى 20 ميجابايت</p>
              </div>
            )}
          </div>
        </div>
      </SovereignPanel>

      {/* Documents list */}
      {c.documents.length === 0 ? (
        <EmptyState title="لا توجد مستندات مرفوعة" hint="ارفع أول مستند لبدء الاستخراج الآلي" icon={<FileText className="h-8 w-8" />} />
      ) : (
        <div className="space-y-3">
          {c.documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} caseId={c.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentCard({ document: d, caseId }: { document: StoredDocumentT; caseId: string }) {
  const qc = useQueryClient()
  const [showExtracted, setShowExtracted] = React.useState(false)
  const [manualText, setManualText] = React.useState("")

  const extractMut = useMutation({
    mutationFn: () => api.extractDocument(caseId, d.id, manualText || undefined) as Promise<any>,
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      if (result.ok) {
        toast.success("تم الاستخراج الآلي — راجع النتائج")
        setShowExtracted(true)
      } else {
        toast.warning("الاستخراج اكتمل جزئياً — تحقّق من النتائج")
        setShowExtracted(true)
      }
      setManualText("")
    },
    onError: () => toast.error("فشل الاستخراج"),
  })

  const deleteMut = useMutation({
    mutationFn: () => api.deleteDocument(caseId, d.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تم حذف المستند")
    },
  })

  const ocrMeta = OCR_STATUS_META[d.ocrStatus] ?? OCR_STATUS_META.pending
  const extMeta = EXTRACTION_STATUS_META[d.extractionStatus] ?? EXTRACTION_STATUS_META.pending
  const uploader = UPLOADER_ROLES.find((r) => r.value === d.uploadedBy)

  // Parse extracted data
  const extracted = d.extractedData ? (() => {
    try { return JSON.parse(d.extractedData) } catch { return null }
  })() : null

  return (
    <SovereignPanel
      title=""
      action={
        <div className="flex items-center gap-1.5">
          {uploader && <StatusBadge label={uploader.label} color={uploader.color} size="sm" dot={false} />}
          <button onClick={() => deleteMut.mutate()} className="text-muted-foreground hover:text-red-500 transition-colors" title="حذف">
            {deleteMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 shrink-0">
            {FILE_ICONS[d.mimeType] ?? <FileText className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-kufi text-sm font-semibold leading-snug mb-1">{d.originalName}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge label={ocrMeta.label} color={ocrMeta.color} size="sm" />
              <StatusBadge label={extMeta.label} color={extMeta.color} size="sm" />
              {d.verified && <StatusBadge label="تمت المراجعة" color="emerald" size="sm" />}
              <span className="font-jetbrains text-[9px] text-muted-foreground">{(d.fileSize / 1024).toFixed(1)} KB</span>
              <span className="font-kufi text-[9px] text-muted-foreground">{formatDateTime(d.createdAt)}</span>
            </div>
            {d.notes && <p className="font-kufi text-[10px] text-muted-foreground mt-1">{d.notes}</p>}
          </div>
        </div>

        {/* Extraction summary */}
        {d.extractionSummary && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
            <div className="flex items-start gap-1.5">
              <Bot className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
              <p className="font-kufi text-xs leading-relaxed">{d.extractionSummary}</p>
            </div>
          </div>
        )}

        {/* Manual text paste (when OCR needed) */}
        {d.ocrStatus !== "completed" && !d.extractedData && (
          <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-2.5">
            <label className="font-kufi text-[11px] text-blue-700 font-medium mb-1 block">
              لصق نص المستند يدوياً (للمستندات الممسوحة أو غير القابلة للقراءة المباشرة):
            </label>
            <Textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="الصق هنا نص المستند…"
              className="font-kufi text-sm min-h-20 mb-2"
            />
            <Button
              onClick={() => extractMut.mutate()}
              disabled={extractMut.isPending || (!manualText.trim() && !d.ocrText)}
              className="font-kufi bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {extractMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              استخراج آلي
            </Button>
          </div>
        )}

        {/* Extract button (when text available but not extracted) */}
        {d.ocrStatus === "completed" && d.extractionStatus === "pending" && (
          <Button
            onClick={() => extractMut.mutate()}
            disabled={extractMut.isPending}
            className="font-kufi bg-amber-600 hover:bg-amber-700 text-white"
            size="sm"
          >
            {extractMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            استخراج آلي للبيانات
          </Button>
        )}

        {/* Extracted data review */}
        {extracted && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-kufi text-xs font-semibold flex items-center gap-1.5">
                <FileSearch className="h-3.5 w-3.5 text-amber-600" />
                البيانات المستخرجة — مرشّحة للمراجعة
              </span>
              <button onClick={() => setShowExtracted(!showExtracted)} className="font-kufi text-[10px] text-amber-600 hover:underline">
                {showExtracted ? "إخفاء" : "عرض الكل"}
              </button>
            </div>

            {showExtracted && (
              <ExtractionReview extracted={extracted} caseId={caseId} docId={d.id} docName={d.originalName} />
            )}
          </div>
        )}
      </div>
    </SovereignPanel>
  )
}

function ExtractionReview({ extracted, caseId, docId, docName }: {
  extracted: any
  caseId: string
  docId: string
  docName: string
}) {
  const qc = useQueryClient()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const promoteMut = useMutation({
    mutationFn: () => {
      const items: Array<{ type: string; data: Record<string, unknown> }> = []
      selected.forEach((key) => {
        const [type, idx] = key.split(":")
        const arr = extracted[type] as any[]
        if (arr && arr[Number(idx)]) {
          items.push({ type, data: arr[Number(idx)] })
        }
      })
      return api.promoteExtractions(caseId, docId, items) as Promise<any>
    },
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success(`تمت ترقية ${result.data.count} عنصر إلى بيانات القضية`)
      setSelected(new Set())
    },
    onError: () => toast.error("فشلت الترقية"),
  })

  const toggle = (key: string) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelected(next)
  }

  const sections = [
    { key: "facts", label: "الوقائع المستخرجة", icon: <FileText className="h-3.5 w-3.5" />, items: extracted.facts as any[] },
    { key: "timeline", label: "الأحداث الزمنية", icon: <Clock className="h-3.5 w-3.5" />, items: extracted.timeline as any[] },
    { key: "citations", label: "الاستشهادات القانونية", icon: <FileText className="h-3.5 w-3.5" />, items: extracted.citations as any[] },
    { key: "evidence", label: "الأدلة", icon: <FileSearch className="h-3.5 w-3.5" />, items: extracted.evidence as any[] },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-violet-500/30 bg-violet-500/5 p-2.5">
        <p className="font-kufi text-[10px] text-violet-700 dark:text-violet-400 leading-relaxed">
          ⚠ كل البيانات المستخرجة «مرشّحة» — اختر ما تريد ترقيته إلى بيانات القضية. الوقائع المُرقّاة تحمل حالة «مدّعى» حتى يثبتها القاضي. الاستشهادات المُرقّاة تحمل حالة «غير متحقَّق منها» حتى تمر ببوابة التحقق.
        </p>
      </div>

      {sections.map((section) => {
        if (!section.items || section.items.length === 0) return null
        return (
          <div key={section.key} className="rounded-md border border-border/60 bg-background/30 p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-amber-600">{section.icon}</span>
              <span className="font-kufi text-xs font-semibold">{section.label}</span>
              <span className="font-jetbrains text-[10px] text-muted-foreground">({section.items.length})</span>
            </div>
            <div className="space-y-1.5">
              {section.items.map((item, idx) => {
                const key = `${section.key}:${idx}`
                const isSelected = selected.has(key)
                return (
                  <label key={key} className={cn(
                    "flex items-start gap-2 rounded border p-2 cursor-pointer transition-colors",
                    isSelected ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/40 hover:bg-muted/20"
                  )}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(key)}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div className="flex-1 min-w-0 font-kufi text-xs leading-relaxed">
                      {section.key === "facts" && (
                        <>
                          <p>{item.statement}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-muted-foreground">
                            <span>الحالة: {item.status}</span>
                            {item.party && <span>الطرف: {item.party}</span>}
                          </div>
                        </>
                      )}
                      {section.key === "timeline" && (
                        <>
                          <p className="font-medium">{item.title}</p>
                          <div className="text-[9px] text-muted-foreground mt-0.5">
                            <span className="font-jetbrains">{item.eventDate}</span> — {item.eventType}
                          </div>
                          {item.description && <p className="text-muted-foreground mt-0.5">{item.description}</p>}
                        </>
                      )}
                      {section.key === "citations" && (
                        <>
                          <p className="font-medium">{item.title}</p>
                          <code className="font-jetbrains text-[10px] text-amber-600">{item.citation}</code>
                          {item.legalDomain && <span className="font-kufi text-[9px] text-muted-foreground mr-2">{item.legalDomain}</span>}
                        </>
                      )}
                      {section.key === "evidence" && (
                        <>
                          <p className="font-medium">{item.title}</p>
                          <div className="text-[9px] text-muted-foreground mt-0.5">{item.evidenceType}{item.relevance && ` — ${item.relevance}`}</div>
                        </>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Promote button */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-emerald-500/40 bg-emerald-500/5 p-2.5">
          <span className="font-kufi text-xs text-emerald-700 dark:text-emerald-400">
            {selected.size} عنصر محدَّد للترقية
          </span>
          <Button
            onClick={() => promoteMut.mutate()}
            disabled={promoteMut.isPending}
            className="font-kufi bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
          >
            {promoteMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            ترقية إلى بيانات القضية
          </Button>
        </div>
      )}
    </div>
  )
}
