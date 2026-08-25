"use client"

import * as React from "react"
import { cn, colorClasses } from "@/lib/judicial/ui"

// ─── Status badge — colored pill with dot ───────────────────────
export function StatusBadge({
  label, color, size = "md", className, dot = true, glow = false,
}: {
  label: string
  color: string
  size?: "sm" | "md"
  className?: string
  dot?: boolean
  glow?: boolean
}) {
  const c = colorClasses(color)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-kufi font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        c.bg, c.text, c.border, glow && c.glow, className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />}
      {label}
    </span>
  )
}

// ─── Indicator ring — circular score gauge ──────────────────────
export function IndicatorRing({
  score, status, size = 64, label,
}: {
  score: number
  status: string
  size?: number
  label?: string
}) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference
  const colorMap: Record<string, string> = {
    pass: "#10b981",
    warn: "#f59e0b",
    fail: "#ef4444",
    pending: "#94a3b8",
  }
  const stroke = colorMap[status] ?? "#94a3b8"
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={stroke} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-jetbrains text-sm font-semibold" style={{ color: stroke }}>{score}</span>
        {label && <span className="font-kufi text-[8px] text-muted-foreground leading-tight mt-0.5 px-1 text-center">{label}</span>}
      </div>
    </div>
  )
}

// ─── Sovereign section panel ────────────────────────────────────
export function SovereignPanel({
  children, className, title, icon, accent, action,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  icon?: React.ReactNode
  accent?: boolean
  action?: React.ReactNode
}) {
  return (
    <div className={cn("sovereign-panel rounded-lg", accent && "seal-frame", className)}>
      {title && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/60">
          <div className="flex items-center gap-2">
            {icon && <span className="gold-text">{icon}</span>}
            <h3 className="font-kufi text-sm font-semibold tracking-tight">{title}</h3>
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

// ─── Empty state ────────────────────────────────────────────────
export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {icon && <div className="mb-3 text-muted-foreground/40">{icon}</div>}
      <p className="font-kufi text-sm text-muted-foreground">{title}</p>
      {hint && <p className="font-kufi text-xs text-muted-foreground/70 mt-1 max-w-xs">{hint}</p>}
    </div>
  )
}

// ─── Stat tile ──────────────────────────────────────────────────
export function StatTile({
  label, value, sub, color = "gold", icon,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  color?: string
  icon?: React.ReactNode
}) {
  const c = colorClasses(color)
  return (
    <div className={cn("sovereign-panel rounded-lg p-3 flex items-center gap-3", c.border)}>
      {icon && <div className={cn("flex h-9 w-9 items-center justify-center rounded-md shrink-0", c.bg, c.text)}>{icon}</div>}
      <div className="min-w-0 flex-1">
        <div className="font-kufi text-[11px] text-muted-foreground truncate">{label}</div>
        <div className="font-jetbrains text-lg font-semibold leading-tight">{value}</div>
        {sub && <div className={cn("font-kufi text-[10px] truncate", c.text)}>{sub}</div>}
      </div>
    </div>
  )
}

// ─── Labeled field ──────────────────────────────────────────────
export function Labeled({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label className="font-kufi text-[11px] font-medium text-muted-foreground">{label}</label>
        {hint && <span className="font-kufi text-[10px] text-muted-foreground/70">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
