// Egyptian Judicial Brain V2.1 — Shared UI helpers (color palette + date formatting)
// `cn` re-exported here so judicial components can import from one module
export { cn } from "@/lib/utils"

// Map semantic color name → tailwind classes (judicial alert palette)
export const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string; dot: string; glow: string }> = {
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-500", glow: "alert-glow-green" },
  green: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "border-green-500/30", dot: "bg-green-500", glow: "alert-glow-green" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/30", dot: "bg-teal-500", glow: "" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30", dot: "bg-blue-500", glow: "alert-glow-blue" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/30", dot: "bg-violet-500", glow: "" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/30", dot: "bg-purple-500", glow: "" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/30", dot: "bg-cyan-500", glow: "" },
  rose: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/30", dot: "bg-rose-500", glow: "" },
  red: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/30", dot: "bg-red-500", glow: "alert-glow-red" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500", glow: "alert-glow-orange" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30", dot: "bg-amber-500", glow: "alert-glow-yellow" },
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-500", glow: "alert-glow-yellow" },
  slate: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-300", border: "border-slate-500/30", dot: "bg-slate-500", glow: "" },
  gold: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-300", border: "border-amber-500/40", dot: "bg-amber-400", glow: "" },
}

export function colorClasses(color: string) {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.slate
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return "—"
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch {
    return "—"
  }
}

export function toInputDate(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return ""
  }
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "الآن"
    if (mins < 60) return `منذ ${mins} دقيقة`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `منذ ${hours} ساعة`
    const days = Math.floor(hours / 24)
    if (days < 30) return `منذ ${days} يوم`
    return formatDate(iso)
  } catch {
    return "—"
  }
}
