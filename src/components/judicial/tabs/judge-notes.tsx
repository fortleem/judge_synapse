"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Plus, Trash2, Loader2, StickyNote, Pin, PinOff, FileText, Scale,
  GitBranch, FolderOpen, Swords,
} from "lucide-react"
import { cn, colorClasses, relativeTime } from "@/lib/judicial/ui"
import { NOTE_ITEM_TYPES, findConstant } from "@/lib/judicial/constants"
import type { CaseDetailT, JudgeNoteT } from "@/lib/judicial/schemas"
import { api } from "@/lib/judicial/api-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SovereignPanel, StatusBadge, EmptyState } from "../ui/primitives"

const ITEM_ICONS: Record<string, React.ReactNode> = {
  general: <StickyNote className="h-3.5 w-3.5" />,
  fact: <FileText className="h-3.5 w-3.5" />,
  evidence: <FolderOpen className="h-3.5 w-3.5" />,
  authority: <Scale className="h-3.5 w-3.5" />,
  issue: <GitBranch className="h-3.5 w-3.5" />,
  adversary: <Swords className="h-3.5 w-3.5" />,
}

export function JudgeNotesTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const qc = useQueryClient()
  const [content, setContent] = React.useState("")
  const [itemType, setItemType] = React.useState("general")

  const createMut = useMutation({
    mutationFn: () => api.createNote(c.id, content, itemType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      toast.success("تمت إضافة الملاحظة")
      setContent("")
    },
    onError: () => toast.error("فشل الإضافة"),
  })

  const pinned = c.notes.filter((n) => n.pinned)
  const others = c.notes.filter((n) => !n.pinned)

  return (
    <div className="space-y-4">
      <SovereignPanel title="ملاحظات القاضي" icon={<StickyNote className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground mb-3 leading-relaxed">
          ملاحظات حرّة للقاضي — قابلة للتثبيت والربط بعناصر القضية. كل ملاحظة مُسجَّلة في سجل التدقيق بمصدر «judge_decision» — منفصلة عن اقتراحات النظام.
        </p>

        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب ملاحظتك هنا…"
            className="font-kufi text-sm min-h-16"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-kufi text-xs text-muted-foreground">النوع:</span>
            {NOTE_ITEM_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setItemType(t.value)}
                className={cn(
                  "flex items-center gap-1 rounded border px-2 py-0.5 font-kufi text-[10px] transition-colors",
                  itemType === t.value ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400" : "border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {ITEM_ICONS[t.value]}
                {t.label}
              </button>
            ))}
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !content.trim()}
              className="font-kufi ml-auto bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
            >
              {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              إضافة
            </Button>
          </div>
        </div>
      </SovereignPanel>

      {c.notes.length === 0 ? (
        <EmptyState title="لا توجد ملاحظات بعد" hint="أضف ملاحظة للبدء" icon={<StickyNote className="h-8 w-8" />} />
      ) : (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Pin className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-kufi text-xs font-semibold text-amber-500 dark:text-amber-400">مثبّتة</span>
                <div className="flex-1 h-px border-t border-amber-500/30" />
              </div>
              <div className="space-y-2">
                {pinned.map((n) => <NoteCard key={n.id} note={n} caseId={c.id} />)}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div className="flex items-center gap-2 mb-2 mt-3">
                  <span className="font-kufi text-xs font-semibold text-muted-foreground">أخرى</span>
                  <div className="flex-1 h-px border-t border-border/40" />
                </div>
              )}
              <div className="space-y-2">
                {others.map((n) => <NoteCard key={n.id} note={n} caseId={c.id} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NoteCard({ note: n, caseId }: { note: JudgeNoteT; caseId: string }) {
  const qc = useQueryClient()
  const typeMeta = findConstant(NOTE_ITEM_TYPES, n.itemType)

  const togglePin = useMutation({
    mutationFn: () => api.updateNote(caseId, n.id, { pinned: !n.pinned }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["case", caseId] }),
  })

  const delMut = useMutation({
    mutationFn: () => api.deleteNote(caseId, n.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["case", caseId] })
      toast.success("تم حذف الملاحظة")
    },
  })

  return (
    <div className={cn("rounded-md border bg-background/40 p-3", n.pinned ? "border-amber-500/40 bg-amber-500/5" : "border-border/60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {ITEM_ICONS[n.itemType] ?? <StickyNote className="h-3.5 w-3.5" />}
            {typeMeta && <span className="font-kufi text-[10px] text-muted-foreground">{typeMeta.label}</span>}
            <span className="font-kufi text-[9px] text-muted-foreground/70">{relativeTime(n.createdAt)}</span>
          </div>
          <p className="font-kufi text-sm leading-relaxed">{n.content}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => togglePin.mutate()}
            className={cn("transition-colors", n.pinned ? "text-amber-500" : "text-muted-foreground hover:text-amber-500")}
            title={n.pinned ? "إلغاء التثبيت" : "تثبيت"}
          >
            {n.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => delMut.mutate()}
            className="text-muted-foreground hover:text-red-500 transition-colors"
            title="حذف"
          >
            {delMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
