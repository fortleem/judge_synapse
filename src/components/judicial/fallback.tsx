"use client"

import * as React from "react"
import {
  WifiOff, ServerOff, Scale, AlertTriangle, ShieldCheck, Database, FileText,
  Bot, Gavel, BookOpen, CalendarClock, GitBranch,
} from "lucide-react"
import { SovereignPanel, StatusBadge } from "./ui/primitives"

// Fallback demo UI shown when the server is unreachable (§98 Degrade-Safely)
// The judicial record, documents, audit and legal search remain available.
export function FallbackDemoMode() {
  return (
    <div className="flex-1 overflow-y-auto scroll-sovereign p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Big alert */}
        <div className="rounded-lg border-2 border-red-500/40 bg-red-500/5 p-6 seal-frame">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-500/15 text-red-500 shrink-0">
              <ServerOff className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif-judicial text-xl font-bold text-red-600 dark:text-red-400">
                  وضع تجريبي — تعذّر الوصول إلى الخادم
                </h2>
                <StatusBadge label="DEGRADED MODE" color="red" glow />
              </div>
              <p className="font-kufi text-sm text-muted-foreground leading-relaxed">
                لا يمكن الاتصال بالخادم القضائي الآن. يعمل النظام في وضع التجربة الآمن. وفقًا لمبدأ التدهور الآمن: يبقى السجل القضائي، والبحث القانوني، والمستندات، وسجل التدقيق متاحة — لكن التحليل المتقدّم والذكاء الاصطناعي معطّل مؤقتًا.
              </p>
            </div>
          </div>
        </div>

        {/* Sovereign principle */}
        <SovereignPanel title="مبدأ التدهور الآمن" icon={<ShieldCheck className="h-4 w-4" />} accent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <h4 className="font-kufi text-xs font-semibold text-emerald-600 dark:text-emerald-400">ما يبقى متاحًا</h4>
              {[
                { icon: <BookOpen className="h-3.5 w-3.5" />, label: "السجل القضائي الرسمي" },
                { icon: <FileText className="h-3.5 w-3.5" />, label: "المستندات والأدلة" },
                { icon: <Scale className="h-3.5 w-3.5" />, label: "البحث القانوني الأساسي" },
                { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "سجل التدقيق غير القابل للتعديل" },
                { icon: <Gavel className="h-3.5 w-3.5" />, label: "حقول القاضي المحفوظة محليًا" },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">{x.icon}</span>
                  <span className="font-kufi text-xs">{x.label}</span>
                  <ShieldCheck className="h-3 w-3 text-emerald-500 mr-auto" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="font-kufi text-xs font-semibold text-amber-600 dark:text-amber-400">ما هو معطّل مؤقتًا</h4>
              {[
                { icon: <Bot className="h-3.5 w-3.5" />, label: "تحليل الذكاء الاصطناعي" },
                { icon: <Scale className="h-3.5 w-3.5" />, label: "البحث النشط عن السلطات المخالفة" },
                { icon: <GitBranch className="h-3.5 w-3.5" />, label: "استخراج الوقائع الآلي" },
                { icon: <CalendarClock className="h-3.5 w-3.5" />, label: "تحليل الخط الزمني" },
                { icon: <Database className="h-3.5 w-3.5" />, label: "مزامنة السجل القانوني" },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
                  <span className="text-amber-600 dark:text-amber-400">{x.icon}</span>
                  <span className="font-kufi text-xs">{x.label}</span>
                  <AlertTriangle className="h-3 w-3 text-amber-500 mr-auto" />
                </div>
              ))}
            </div>
          </div>
        </SovereignPanel>

        {/* Demo data */}
        <SovereignPanel title="بيانات تجريبية للعرض" icon={<Database className="h-4 w-4" />}>
          <p className="font-kufi text-xs text-muted-foreground mb-3 leading-relaxed">
            تعرض هذه الواجهة بنية المنصة وقدراتها. عند استعادة الاتصال بالخادم، تُحمَّل القضايا الفعلية والسجل القانوني المُوقّع تلقائيًا.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "القضايا النموذجية", value: "4", icon: <FileText className="h-4 w-4" /> },
              { label: "نسخة السجل", value: "2026.08", icon: <Database className="h-4 w-4" /> },
              { label: "حقول القاضي", value: "4", icon: <Gavel className="h-4 w-4" /> },
              { label: "مؤشرات السلامة", value: "4", icon: <ShieldCheck className="h-4 w-4" /> },
            ].map((s, i) => (
              <div key={i} className="rounded-md border border-border/60 bg-background/40 p-2.5 text-center">
                <div className="flex justify-center text-amber-500 dark:text-amber-400 mb-1">{s.icon}</div>
                <div className="font-jetbrains text-lg font-semibold">{s.value}</div>
                <div className="font-kufi text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </SovereignPanel>

        {/* Retry hint */}
        <div className="text-center py-2">
          <p className="font-kufi text-xs text-muted-foreground">
            <WifiOff className="inline h-3 w-3 mr-1" />
            يحاول النظام إعادة الاتصال تلقائيًا كل 30 ثانية. تحقّق من حالة الخادم أو أعد تحميل الصفحة.
          </p>
        </div>
      </div>
    </div>
  )
}
