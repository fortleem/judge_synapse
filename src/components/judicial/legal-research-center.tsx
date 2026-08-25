"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  BookMarked, Database, GitBranch, Download, Plus, Loader2, ExternalLink,
  Search, ShieldCheck, Crown, Newspaper, Landmark, Scale, Building, Building2,
  FileText, Quote, Hash, Calendar, CheckCircle2, XCircle, AlertTriangle, Clock,
} from "lucide-react"
import { api } from "@/lib/judicial/api-client"
import { cn, colorClasses, formatDate, toInputDate } from "@/lib/judicial/ui"
import {
  SOURCE_TYPES, ACCESS_STATUS, SOURCE_TIERS, LEGAL_TEXT_DOCUMENT_TYPES,
  CORPUS_SNAPSHOT_STATUS, IMPORT_JOB_STATUS, findConstant,
} from "@/lib/judicial/constants"
import type { LegalSourceT, LegalTextT, CorpusSnapshotT, ImportJobT } from "@/lib/judicial/schemas"
import { SovereignPanel, StatusBadge, StatTile, EmptyState } from "./ui/primitives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type SubView = "sources" | "texts" | "snapshots" | "import-queue" | "search"

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  constitution: <Crown className="h-4 w-4" />,
  official_gazette: <Newspaper className="h-4 w-4" />,
  statute: <BookMarked className="h-4 w-4" />,
  cassation: <Scale className="h-4 w-4" />,
  state_council: <Landmark className="h-4 w-4" />,
  constitutional_court: <Scale className="h-4 w-4" />,
  specialized_court: <Building className="h-4 w-4" />,
  ministry: <Building2 className="h-4 w-4" />,
}

export function LegalResearchCenter() {
  const [sub, setSub] = React.useState<SubView>("sources")

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Hero */}
      <div className="border-b border-border bg-card/40 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookMarked className="h-4 w-4 text-amber-400" />
              <span className="font-jetbrains text-[10px] tracking-widest text-amber-400">LEGAL RESEARCH CENTER</span>
            </div>
            <h2 className="font-serif-judicial text-xl font-bold mb-1">مركز البحث القانوني وسجل المصادر</h2>
            <p className="font-kufi text-xs text-muted-foreground leading-relaxed max-w-2xl">
              سجل مصادر رسمي + لقطات موثّقة + provenance + سياسة عدم اعتماد أي نص حتى يمر بالتحقق. النصوص منسوخة من البوابات الرسمية للدولة المصرية، ولا تُخلط مع مواقع تجارية أو نسخ مجهولة.
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <nav className="flex items-center gap-1 mt-4 overflow-x-auto scroll-sovereign">
          {([
            { key: "sources", label: "سجل المصادر", icon: <Database className="h-3.5 w-3.5" /> },
            { key: "texts", label: "النصوص القانونية", icon: <FileText className="h-3.5 w-3.5" /> },
            { key: "search", label: "البحث الهجين", icon: <Search className="h-3.5 w-3.5" /> },
            { key: "snapshots", label: "اللقطات الموقّعة", icon: <GitBranch className="h-3.5 w-3.5" /> },
            { key: "import-queue", label: "طابور الاستيراد", icon: <Download className="h-3.5 w-3.5" /> },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setSub(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 font-kufi text-xs border-b-2 transition-all whitespace-nowrap",
                sub === t.key
                  ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scroll-sovereign p-4">
        {sub === "sources" && <SourcesView />}
        {sub === "texts" && <TextViews />}
        {sub === "search" && <SearchView />}
        {sub === "snapshots" && <SnapshotsView />}
        {sub === "import-queue" && <ImportQueueView />}
      </div>
    </div>
  )
}

// ─── Sources View ────────────────────────────────────────────────
function SourcesView() {
  const [filter, setFilter] = React.useState<string>("all")
  const [search, setSearch] = React.useState("")

  const sourcesQ = useQuery({
    queryKey: ["corpus-sources", filter, search],
    queryFn: () => api.listSources({ sourceType: filter !== "all" ? filter : undefined, q: search || undefined }),
  })

  const sources = sourcesQ.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجهة…" className="font-kufi text-sm max-w-xs" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 font-kufi text-xs"><SelectValue placeholder="نوع المصدر" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-kufi text-xs">الكل</SelectItem>
            {SOURCE_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="font-kufi text-xs">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto font-kufi text-xs text-muted-foreground">{sources.length} مصدر رسمي مسجّل</div>
      </div>

      {sourcesQ.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : sources.length === 0 ? (
        <EmptyState title="لا توجد مصادر مسجّلة" icon={<Database className="h-8 w-8" />} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {sources.map((s) => <SourceCard key={s.id} source={s} />)}
        </div>
      )}
    </div>
  )
}

function SourceCard({ source: s }: { source: LegalSourceT }) {
  const typeMeta = findConstant(SOURCE_TYPES, s.sourceType)
  const accessMeta = findConstant(ACCESS_STATUS, s.accessStatus)
  const tierMeta = SOURCE_TIERS.find((t) => t.value === s.sourceTier)

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4 hover:border-amber-500/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-md shrink-0", colorClasses(typeMeta?.color ?? "slate").bg, colorClasses(typeMeta?.color ?? "slate").text)}>
          {SOURCE_ICONS[s.sourceType] ?? <Database className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-kufi text-sm font-semibold leading-snug">{s.name}</h4>
            {s.portalUrl && (
              <a href={s.portalUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-amber-500 transition-colors shrink-0" title="فتح البوابة">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          {s.nameEn && <p className="font-jetbrains text-[10px] text-muted-foreground mb-2">{s.nameEn}</p>}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {typeMeta && <StatusBadge label={typeMeta.label} color={typeMeta.color} size="sm" dot={false} />}
            {accessMeta && <StatusBadge label={accessMeta.label} color={accessMeta.color} size="sm" />}
            {s.verified && <StatusBadge label="متحقَّق" color="emerald" size="sm" />}
          </div>
          <div className="space-y-1 font-kufi text-[11px] text-muted-foreground">
            <div><span className="opacity-60">الجهة:</span> {s.issuingBody}</div>
            {s.jurisdiction && <div><span className="opacity-60">الاختصاص:</span> {s.jurisdiction}</div>}
            {tierMeta && <div className={colorClasses(tierMeta.color).text}><span className="opacity-60">الطبقة:</span> {tierMeta.label}</div>}
            {s.contentAvailable && <div className="leading-relaxed pt-1 border-t border-border/40"><span className="opacity-60">المحتوى المتاح:</span> {s.contentAvailable}</div>}
            {s.accessNotes && <div className="leading-relaxed text-muted-foreground/70">{s.accessNotes}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Texts View ──────────────────────────────────────────────────
function TextViews() {
  const [search, setSearch] = React.useState("")
  const [docType, setDocType] = React.useState<string>("all")

  const textsQ = useQuery({
    queryKey: ["corpus-texts", search, docType],
    queryFn: () => api.listTexts({ q: search || undefined, documentType: docType !== "all" ? docType : undefined }),
  })

  const texts = textsQ.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الاستشهاد، العنوان، النص…" className="font-kufi text-sm max-w-xs" />
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="w-40 font-kufi text-xs"><SelectValue placeholder="نوع الوثيقة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-kufi text-xs">الكل</SelectItem>
            {LEGAL_TEXT_DOCUMENT_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="font-kufi text-xs">{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="ml-auto font-kufi text-xs text-muted-foreground">{texts.length} نص قانوني موثَّق</div>
      </div>

      {textsQ.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : texts.length === 0 ? (
        <EmptyState title="لا توجد نصوص مسجّلة" icon={<FileText className="h-8 w-8" />} />
      ) : (
        <div className="space-y-3">
          {texts.map((t) => <TextCard key={t.id} text={t} />)}
        </div>
      )}
    </div>
  )
}

function TextCard({ text: t }: { text: LegalTextT & { source?: { name: string; portalUrl?: string | null } } }) {
  const docMeta = findConstant(LEGAL_TEXT_DOCUMENT_TYPES, t.documentType)
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4 hover:border-amber-500/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-kufi text-sm font-semibold leading-snug mb-1">{t.title}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="font-jetbrains text-xs text-amber-500 dark:text-amber-400">{t.citation}</code>
            {docMeta && <StatusBadge label={docMeta.label} color={docMeta.color} size="sm" dot={false} />}
            <StatusBadge label={t.verificationStatus === "verified" ? "متحقَّق" : t.verificationStatus} color={t.verificationStatus === "verified" ? "emerald" : "amber"} size="sm" />
            <StatusBadge label={t.temporalStatus === "current" ? "ساري" : t.temporalStatus === "historical" ? "تاريخي" : "انتقالي"} color={t.temporalStatus === "current" ? "emerald" : "slate"} size="sm" dot={false} />
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="font-kufi text-xs h-7">
          {expanded ? "إخفاء النص" : "عرض النص"}
        </Button>
      </div>

      {expanded && (
        <div className="rounded border-r-2 border-amber-500/50 bg-amber-500/5 px-3 py-2 mt-2 mb-2">
          <p className="font-serif-judicial text-sm leading-relaxed">{t.exactText}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-kufi text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> <span className="opacity-60">ساري من:</span> {formatDate(t.effectiveFrom)}</div>
        <div className="flex items-center gap-1"><Hash className="h-3 w-3" /> <span className="opacity-60">البصمة:</span> <span className="font-jetbrains truncate">{t.sourceHash.slice(0, 20)}…</span></div>
        {t.officialJournalRef && <div className="flex items-center gap-1 col-span-2"><Newspaper className="h-3 w-3" /> <span className="opacity-60">الجريدة الرسمية:</span> {t.officialJournalRef}</div>}
        {t.source && <div className="flex items-center gap-1 col-span-2"><Database className="h-3 w-3" /> <span className="opacity-60">المصدر:</span> {t.source.name}</div>}
      </div>
      {t.versionLabel && <div className="font-kufi text-[10px] text-amber-600 dark:text-amber-400 mt-2">{t.versionLabel}</div>}
    </div>
  )
}

// ─── Search View ─────────────────────────────────────────────────
function SearchView() {
  const [query, setQuery] = React.useState("")
  const [result, setResult] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const search = async () => {
    if (query.trim().length < 2) return
    setLoading(true)
    try {
      const r = await api.searchCorpus(query, { verificationFilter: true, temporalStatus: "current" })
      setResult(r)
    } catch {
      toast.error("فشل البحث")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <SovereignPanel title="البحث الهجين في السجل القانوني" icon={<Search className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground mb-3 leading-relaxed">
          استرجاع هجين: دقيق (استشهاد) + معجمي (عنوان/نص) + مرشح زمني (نسخة سارية) + مرشح سلطة (متحقَّق منه). في الوضع القضائي، تُستبعد النصوص غير المتحقَّق منها قبل إرجاع النتائج.
        </p>
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="مثال: القوة القاهرة، التقادم المكسب، الفصل التعسفي…" className="font-kufi text-sm" />
          <Button onClick={search} disabled={loading || query.trim().length < 2} className="font-kufi bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            بحث
          </Button>
        </div>
      </SovereignPanel>

      {result && (
        <SovereignPanel title={`نتائج البحث: ${result.found} نتيجة`} icon={<FileText className="h-4 w-4" />}>
          {result.results.length > 0 ? (
            <div className="space-y-3">
              {result.results.map((r: any) => <TextCard key={r.id} text={r} />)}
            </div>
          ) : (
            <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <p className="font-kufi text-xs text-emerald-700 dark:text-emerald-300">
                لم يُعثر على نصوص مطابقة — «لا توجد سلطة موثّقة محدَّدة» هي نتيجة ناجحة للنظام.
              </p>
            </div>
          )}
          {result.coverage && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-kufi text-xs font-semibold">تقرير التغطية</span>
                <span className="font-jetbrains text-[10px] text-muted-foreground">~{result.coverage.coveragePercent}% من السجل</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-kufi text-[10px] text-muted-foreground mb-2">
                <div>حجم السجل: {result.coverage.corpusSize}</div>
                <div>مطابقة: {result.coverage.matched}</div>
                <div>مرشح زمني: {result.coverage.temporalFilterApplied ? "نعم" : "لا"}</div>
                <div>مرشح تحقق: {result.coverage.verificationFilterApplied ? "نعم" : "لا"}</div>
              </div>
              <ul className="space-y-0.5">
                {result.coverage.limitations.map((l: string, i: number) => (
                  <li key={i} className="font-kufi text-[10px] text-muted-foreground/70 flex items-start gap-1">
                    <span className="text-amber-500">•</span> {l}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SovereignPanel>
      )}
    </div>
  )
}

// ─── Snapshots View ──────────────────────────────────────────────
function SnapshotsView() {
  const q = useQuery({ queryKey: ["corpus-snapshots"], queryFn: api.listSnapshots })
  const snapshots = q.data ?? []

  return (
    <div className="space-y-4">
      <SovereignPanel title="اللقطات الموقّعة — Corpus Snapshots" icon={<GitBranch className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
          كل تحليل قابل لإعادة الإنتاج ضد لقطة السجل القانوني المحدّدة. كل لقحة لها: نسخة، طابع زمني، manifest مصادر، بصمة كربتوغرافية، توقيع رقمي، حالة اعتماد. النسخة المنشورة «EJB-CORPUS-2026.08-R1» هي المعتمدة للوضع القضائي.
        </p>
      </SovereignPanel>

      {q.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : snapshots.length === 0 ? (
        <EmptyState title="لا توجد لقطات منشورة" icon={<GitBranch className="h-8 w-8" />} />
      ) : (
        <div className="space-y-3">
          {snapshots.map((s) => <SnapshotCard key={s.id} snapshot={s} />)}
        </div>
      )}
    </div>
  )
}

function SnapshotCard({ snapshot: s }: { snapshot: CorpusSnapshotT }) {
  const statusMeta = findConstant(CORPUS_SNAPSHOT_STATUS, s.approvalStatus)
  return (
    <div className={cn("rounded-lg border p-4", statusMeta?.color === "emerald" ? "border-emerald-500/40 bg-emerald-500/5 seal-frame" : "border-border/60 bg-background/40")}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <code className="font-jetbrains text-lg font-bold text-amber-500 dark:text-amber-400">{s.versionLabel}</code>
          {statusMeta && <div className="mt-1"><StatusBadge label={statusMeta.label} color={statusMeta.color} size="sm" /></div>}
        </div>
        <div className="text-left">
          <div className="font-kufi text-[10px] text-muted-foreground">{formatDate(s.createdAt)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatTile label="النصوص" value={s.textCount} color="blue" icon={<FileText className="h-3.5 w-3.5" />} />
        <StatTile label="المصادر" value={s.sourceCount} color="emerald" icon={<Database className="h-3.5 w-3.5" />} />
      </div>
      <div className="space-y-1 font-kufi text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1"><Hash className="h-3 w-3" /> <span className="opacity-60">البصمة:</span> <code className="font-jetbrains">{s.hash}</code></div>
        {s.signature && <div className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> <span className="opacity-60">التوقيع:</span> <code className="font-jetbrains">{s.signature}</code></div>}
        {s.notes && <div className="leading-relaxed pt-1 border-t border-border/40">{s.notes}</div>}
      </div>
    </div>
  )
}

// ─── Import Queue View ───────────────────────────────────────────
function ImportQueueView() {
  const q = useQuery({ queryKey: ["corpus-import-queue"], queryFn: api.listImportJobs })
  const qc = useQueryClient()
  const jobs = q.data ?? []

  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => api.updateImportJob(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["corpus-import-queue"] })
      toast.success("تم تحديث حالة الاستيراد")
    },
  })

  return (
    <div className="space-y-4">
      <SovereignPanel title="طابور الاستيراد المؤسسي" icon={<Download className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
          المصادر الرسمية متاحة لكن ليست في قاعدة واحدة قابلة للتنزيل دفعة واحدة، وبعض بوابات الأحكام تتطلب جلسات أو صلاحيات. لذلك نبنيها بالطريقة الصحيحة للمحكمة: سجل مصادر رسمي + لقطات موثّقة + provenance + سياسة عدم اعتماد أي نص حتى يمر بالتحقق.
        </p>
      </SovereignPanel>

      {q.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState title="لا توجد مهام في طابور الاستيراد" icon={<Download className="h-8 w-8" />} />
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => {
            const statusMeta = findConstant(IMPORT_JOB_STATUS, j.status)
            const typeMeta = findConstant(SOURCE_TYPES, j.sourceType)
            return (
              <div key={j.id} className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {typeMeta && SOURCE_ICONS[j.sourceType]}
                      <h4 className="font-kufi text-sm font-medium">{j.sourceName}</h4>
                    </div>
                    {j.sourceUrl && <a href={j.sourceUrl} target="_blank" rel="noreferrer" className="font-jetbrains text-[10px] text-amber-500 dark:text-amber-400 hover:underline block mb-1">{j.sourceUrl}</a>}
                    {j.contentScope && <p className="font-kufi text-[11px] text-muted-foreground leading-relaxed mb-1">{j.contentScope}</p>}
                    {j.notes && <p className="font-kufi text-[10px] text-muted-foreground/70">{j.notes}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {j.requiresAuth && <StatusBadge label="يتطلب اعتمادًا" color="orange" size="sm" dot={false} />}
                      {j.authType && <span className="font-kufi text-[10px] text-muted-foreground">نوع الاعتماد: {j.authType}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {statusMeta && <StatusBadge label={statusMeta.label} color={statusMeta.color} size="sm" />}
                    <Select value={j.status} onValueChange={(v) => updateMut.mutate({ id: j.id, patch: { status: v } })}>
                      <SelectTrigger className="w-32 h-7 text-[10px] font-kufi px-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {IMPORT_JOB_STATUS.map((s) => <SelectItem key={s.value} value={s.value} className="font-kufi text-xs">{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
