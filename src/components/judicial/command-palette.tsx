"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  Search, FolderOpen, BookOpen, Scale, Bot, Gavel, ShieldCheck, CalendarDays,
  FileText, Settings2, Home, Lightbulb, Database, Clock, Upload,
  ArrowRight, Command, type LucideIcon,
} from "lucide-react"
import { api } from "@/lib/judicial/api-client"
import type { CaseT, LegalTextT } from "@/lib/judicial/schemas"
import { cn } from "@/lib/judicial/ui"

interface CommandItem {
  id: string
  label: string
  hint?: string
  icon: LucideIcon
  action: () => void
  group: string
  keywords?: string
}

export function CommandPalette({
  open, onOpenChange, onSelectCase,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelectCase: (caseId: string) => void
}) {
  const [query, setQuery] = React.useState("")
  const [selectedIdx, setSelectedIdx] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Fetch cases + legal texts for search
  const casesQ = useQuery({
    queryKey: ["cases"],
    queryFn: () => api.listCases(),
    enabled: open,
  })
  const textsQ = useQuery({
    queryKey: ["corpus-texts-cmdk"],
    queryFn: () => api.listTexts(),
    enabled: open,
  })

  const cases = casesQ.data ?? []
  const texts = textsQ.data ?? []

  // Navigation actions
  const goHome = () => { window.location.href = "/" }
  const goResearch = () => { onOpenChange(false); setTimeout(() => window.dispatchEvent(new CustomEvent("navigate", { detail: "research" })), 100) }
  const goAudit = () => { onOpenChange(false); setTimeout(() => window.dispatchEvent(new CustomEvent("navigate", { detail: "audit" })), 100) }
  const goSettings = () => { onOpenChange(false); setTimeout(() => window.dispatchEvent(new CustomEvent("navigate", { detail: "settings" })), 100) }

  // Build command items
  const items: CommandItem[] = React.useMemo(() => {
    const result: CommandItem[] = []

    // Quick navigation
    result.push(
      { id: "nav-home", label: "الصفحة الرئيسية", hint: "لوحة التحكم", icon: Home, action: goHome, group: "تنقل" },
      { id: "nav-research", label: "مركز البحث القانوني", hint: "السجل القانوني", icon: Database, action: goResearch, group: "تنقل" },
      { id: "nav-audit", label: "سجل التدقيق", hint: "سجل النظام والقاضي", icon: ShieldCheck, action: goAudit, group: "تنقل" },
      { id: "nav-settings", label: "الإعدادات", hint: "الحوكمة والمصادر", icon: Settings2, action: goSettings, group: "تنقل" },
    )

    // Cases
    for (const c of cases) {
      result.push({
        id: `case-${c.id}`,
        label: c.title.slice(0, 80),
        hint: c.caseNumber,
        icon: FolderOpen,
        action: () => { onSelectCase(c.id); onOpenChange(false) },
        group: "القضايا",
        keywords: `${c.caseNumber} ${c.court} ${c.parties} ${c.caseType}`,
      })
    }

    // Legal texts
    for (const t of texts.slice(0, 30)) {
      result.push({
        id: `text-${t.id}`,
        label: t.title.slice(0, 80),
        hint: t.citation,
        icon: BookOpen,
        action: () => { goResearch(); onOpenChange(false) },
        group: "النصوص القانونية",
        keywords: `${t.citation} ${t.legalDomain ?? ""}`,
      })
    }

    return result
  }, [cases, texts, onSelectCase, onOpenChange])

  // Filter by query
  const filtered = React.useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase().trim()
    return items.filter((item) => {
      const text = `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`.toLowerCase()
      return text.includes(q)
    })
  }, [items, query])

  // Group filtered items
  const grouped = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = []
      groups[item.group].push(item)
    }
    return groups
  }, [filtered])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const item = filtered[selectedIdx]
      if (item) item.action()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onOpenChange(false)
    }
  }

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Scroll selected into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIdx])

  if (!open) return null

  // Flatten for index tracking
  const flatItems: { item: CommandItem; group: string; groupIdx: number }[] = []
  Object.entries(grouped).forEach(([group, groupItems], gi) => {
    groupItems.forEach((item) => flatItems.push({ item, group, groupIdx: gi }))
  })

  let runningIdx = 0

  return (
    <div className="cmdk-overlay" onClick={() => onOpenChange(false)}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن قضية، نص قانوني، أو إجراء…"
            className="flex-1 bg-transparent font-kufi text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="font-jetbrains text-[9px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto scroll-sovereign p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="font-kufi text-sm text-muted-foreground">لا توجد نتائج لـ «{query}»</p>
            </div>
          ) : (
            Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group} className="mb-2">
                <div className="font-kufi text-[10px] text-muted-foreground px-2 py-1 sticky top-0 bg-card/80 backdrop-blur">
                  {group}
                </div>
                {groupItems.map((item) => {
                  const idx = runningIdx++
                  const isSelected = idx === selectedIdx
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors text-right",
                        isSelected ? "bg-amber-500/10" : "hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-amber-600" : "text-muted-foreground")} />
                      <div className="flex-1 min-w-0">
                        <div className="font-kufi text-xs truncate">{item.label}</div>
                        {item.hint && <div className="font-jetbrains text-[9px] text-muted-foreground truncate">{item.hint}</div>}
                      </div>
                      {isSelected && <ArrowRight className="h-3 w-3 text-amber-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="font-jetbrains px-1 py-0.5 rounded border border-border bg-muted">↑↓</kbd>
            <span className="font-kufi">تنقّل</span>
            <kbd className="font-jetbrains px-1 py-0.5 rounded border border-border bg-muted">↵</kbd>
            <span className="font-kufi">اختيار</span>
          </div>
          <div className="flex items-center gap-1 font-kufi">
            <Command className="h-3 w-3" />
            <span>+</span>
            <kbd className="font-jetbrains px-1 py-0.5 rounded border border-border bg-muted">K</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
