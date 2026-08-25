"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Settings2, Shield, BookMarked, FileText, Cpu, Loader2, Save, Plus,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/judicial/api-client"
import { SETTING_CATEGORIES, findConstant } from "@/lib/judicial/constants"
import type { SettingT } from "@/lib/judicial/schemas"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SovereignPanel, StatusBadge } from "../ui/primitives"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const CATEGORY_META: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
  governance: {
    icon: <Shield className="h-4 w-4" />,
    title: "الحوكمة المؤسسية",
    desc: "سلطة القضاء/المؤسسة تتحكم في القضاة المعتمدين، المصادر، السياسات، الاحتجاز، المراجعة، إيقاف النظام.",
  },
  law_sources: {
    icon: <BookMarked className="h-4 w-4" />,
    title: "مصادر القانون",
    desc: "السجل القانوني الموثّق — نسخة موقّعة رقميًا. لا تتجاوز أيّ تمثيل مشتق المصدر الأصلي.",
  },
  templates: {
    icon: <FileText className="h-4 w-4" />,
    title: "النماذج",
    desc: "قوالب التسبيب ومراجعة السلامة — كود الإنتاج، ليست مجرد نصوص.",
  },
  model_policy: {
    icon: <Cpu className="h-4 w-4" />,
    title: "سياسة النماذج",
    desc: "التوجيه السيادي للنماذج — تقييم مستمر، لا تعلّم ذاتي. لا توجيه ثابت لمزوّد بعينه.",
  },
}

export function SettingsTab() {
  const q = useQuery({
    queryKey: ["settings"],
    queryFn: api.listSettings,
  })

  if (q.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
      </div>
    )
  }

  const settings = q.data ?? []
  const grouped = SETTING_CATEGORIES.map((cat) => ({
    ...cat,
    items: settings.filter((s) => s.category === cat.value),
  }))

  return (
    <div className="p-4 space-y-4">
      <SovereignPanel title="الإعدادات — الحوكمة ومصادر القانون والنماذج" icon={<Settings2 className="h-4 w-4" />} accent>
        <p className="font-kufi text-xs text-muted-foreground leading-relaxed">
          السياسة ككود — القواعد الحرجة حتمية وقابلة للضبط: قواعد السلطة، توجيه البيانات، سياسات الوصول، طبقات المصادر، المرشحات الزمنية، أهلية النماذج، حظر المخرجات، عتبات المخاطر. لا تُترك قواعد السلامة في موجّهات لغوية طبيعية فقط.
        </p>
      </SovereignPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {grouped.map((cat) => {
          const meta = CATEGORY_META[cat.value] ?? { icon: <Settings2 className="h-4 w-4" />, title: cat.label, desc: "" }
          return (
            <SovereignPanel
              key={cat.value}
              title={meta.title}
              icon={meta.icon}
              action={<AddSettingDialog category={cat.value} />}
            >
              <p className="font-kufi text-[11px] text-muted-foreground leading-relaxed mb-3">{meta.desc}</p>

              {cat.items.length === 0 ? (
                <p className="font-kufi text-xs text-muted-foreground/70 text-center py-4">لا توجد إعدادات في هذا القسم</p>
              ) : (
                <div className="space-y-2">
                  {cat.items.map((s) => <SettingRow key={s.id} setting={s} />)}
                </div>
              )}
            </SovereignPanel>
          )
        })}
      </div>
    </div>
  )
}

function SettingRow({ setting }: { setting: SettingT }) {
  const qc = useQueryClient()
  const [value, setValue] = React.useState(setting.value)
  const [editing, setEditing] = React.useState(false)

  React.useEffect(() => {
    if (!editing) setValue(setting.value)
  }, [setting.value, editing])

  const mut = useMutation({
    mutationFn: () => api.upsertSetting(setting.category, setting.key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] })
      setEditing(false)
      toast.success("تم تحديث الإعداد")
    },
    onError: () => toast.error("فشل التحديث"),
  })

  const isLong = setting.value.length > 80

  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <code className="font-jetbrains text-[11px] text-amber-600 dark:text-amber-400 truncate">{setting.key}</code>
        <StatusBadge label={setting.category} color="slate" size="sm" dot={false} />
      </div>
      {editing ? (
        isLong ? (
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} className="font-kufi text-xs min-h-16" />
        ) : (
          <Input value={value} onChange={(e) => setValue(e.target.value)} className="font-kufi text-xs h-8" />
        )
      ) : (
        <p className="font-kufi text-xs leading-relaxed text-foreground/90">{setting.value}</p>
      )}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        {editing ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setValue(setting.value) }} className="font-kufi text-xs h-7">إلغاء</Button>
            <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending} className="font-kufi text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white">
              {mut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              حفظ
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="font-kufi text-xs h-7">
            تعديل
          </Button>
        )}
      </div>
    </div>
  )
}

function AddSettingDialog({ category }: { category: string }) {
  const [open, setOpen] = React.useState(false)
  const [key, setKey] = React.useState("")
  const [value, setValue] = React.useState("")
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => api.upsertSetting(category, key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] })
      toast.success("تمت إضافة الإعداد")
      setOpen(false)
      setKey(""); setValue("")
    },
    onError: () => toast.error("فشل الإضافة"),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="font-kufi text-xs h-8 border-amber-500/40 text-amber-600 dark:text-amber-400">
          <Plus className="h-3.5 w-3.5" /> إضافة
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-kufi">إعداد جديد — {findConstant(SETTING_CATEGORIES, category)?.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="المفتاح (بالإنجليزية)" className="font-jetbrains text-sm" />
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} placeholder="القيمة" className="font-kufi text-sm min-h-20" />
        </div>
        <DialogFooter>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !key.trim() || !value.trim()} className="font-kufi">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إضافة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
