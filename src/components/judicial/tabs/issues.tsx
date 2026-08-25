"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Loader2, GitBranch, ChevronLeft } from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import { ISSUE_TYPES, findConstant } from "@/lib/judicial/constants"
import type { CaseDetailT, LegalIssueT } from "@/lib/judicial/schemas"
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

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: "مفتوحة", color: "amber" },
  resolved: { label: "محسومة", color: "emerald" },
  unresolved: { label: "غير محسومة", color: "orange" },
  blocked: { label: "محظورة", color: "red" },
}

export function IssuesTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  // Build tree (top-level + children)
  const roots = c.issues.filter((i) => !i.parentId).sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-4">
      <SovereignPanel
        title="شجرة المسائل القانونية"
        icon={<GitBranch className="h-4 w-4" />}
        action={<AddIssueDialog caseId={c.id} parentId={null} />}
      >
        <p className="font-kufi text-xs text-muted-foreground mb-4 leading-relaxed">
          تتحول القضية إلى شجرة مسائل قانونية هرمية: الاختصاص، القبول، المسائل الإجرائية، المسألة الأصلية وعناصرها، الدفوع، الدعاوى الفرعية، الأسئلة الدستورية، الطلبات. الاعتماديات صريحة.
        </p>

        {roots.length === 0 ? (
          <EmptyState title="لا توجد مسائل قانونية" hint="أضف مسألة للبدء" icon={<GitBranch className="h-8 w-8" />} />
        ) : (
          <div className="space-y-2">
            {roots.map((issue) => (
              <IssueNode key={issue.id} issue={issue} caseId={c.id} allIssues={c.issues} depth={0} />
            ))}
          </div>
        )}
      </SovereignPanel>
    </div>
  )
}

function IssueNode({ issue, caseId, allIssues, depth }: {
  issue: LegalIssueT; caseId: string; allIssues: LegalIssueT[]; depth: number
}) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = React.useState(true)
  const children = allIssues.filter((i) => i.parentId === issue.id).sort((a, b) => a.sortOrder - b.sortOrder)
  const typeMeta = findConstant(ISSUE_TYPES, issue.issueType)
  const statusMeta = STATUS_META[issue.status] ?? { label: issue.status, color: "slate" }

  const delMut = useMutation({
    mutationFn: () => api.deleteIssue(caseId, issue.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تم حذف المسألة")
    },
  })

  return (
    <div>
      <div
        className="rounded-md border border-border/60 bg-background/40 p-2.5"
        style={{ marginRight: depth * 16 }}
      >
        <div className="flex items-start gap-2">
          {children.length > 0 ? (
            <button onClick={() => setExpanded(!expanded)} className="mt-0.5 text-muted-foreground hover:text-foreground">
              <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", expanded && "-rotate-90")} />
            </button>
          ) : (
            <span className="w-3.5 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-kufi text-sm leading-snug mb-1">{issue.title}</p>
            {issue.description && <p className="font-kufi text-[11px] text-muted-foreground leading-relaxed mb-1">{issue.description}</p>}
            <div className="flex items-center gap-1.5 flex-wrap">
              {typeMeta && <StatusBadge label={typeMeta.label} color={typeMeta.color} size="sm" dot={false} />}
              <StatusBadge label={statusMeta.label} color={statusMeta.color} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <AddIssueDialog caseId={caseId} parentId={issue.id} compact />
            <button onClick={() => delMut.mutate()} className="text-muted-foreground hover:text-red-500 transition-colors">
              {delMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div className="mt-1.5 space-y-1.5">
          {children.map((ch) => <IssueNode key={ch.id} issue={ch} caseId={caseId} allIssues={allIssues} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

function AddIssueDialog({ caseId, parentId, compact }: { caseId: string; parentId: string | null; compact?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [issueType, setIssueType] = React.useState("primary")
  const [status, setStatus] = React.useState("open")
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.createIssue(caseId, {
      title, description: description || null,
      issueType, status, parentId,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تمت إضافة المسألة")
      setOpen(false)
      setTitle(""); setDescription("")
    },
    onError: () => toast.error("فشل الإضافة"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <button className="text-muted-foreground hover:text-amber-500 transition-colors" title="إضافة مسألة فرعية">
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Button variant="outline" size="sm" className="font-kufi text-xs h-8 border-amber-500/40 text-amber-600 dark:text-amber-400">
            <Plus className="h-3.5 w-3.5" /> إضافة مسألة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-kufi">{parentId ? "إضافة مسألة فرعية" : "إضافة مسألة قانونية"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان المسألة" className="font-kufi text-sm" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="الوصف (اختياري)" className="font-kufi text-sm min-h-16" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">النوع</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="font-kufi text-xs">{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">الحالة</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open" className="font-kufi text-xs">مفتوحة</SelectItem>
                  <SelectItem value="resolved" className="font-kufi text-xs">محسومة</SelectItem>
                  <SelectItem value="unresolved" className="font-kufi text-xs">غير محسومة</SelectItem>
                  <SelectItem value="blocked" className="font-kufi text-xs">محظورة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
