"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  User, Users, Building2, Plus, Trash2, Loader2, AlertTriangle,
  Search, ArrowRightLeft, ShieldAlert, MapPin, Phone, Mail,
} from "lucide-react"
import { cn, colorClasses } from "@/lib/judicial/ui"
import type { CaseDetailT } from "@/lib/judicial/schemas"
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

const ROLE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  plaintiff: { label: "مدّعي", color: "emerald", icon: <User className="h-3.5 w-3.5" /> },
  defendant: { label: "مدّعى عليه", color: "rose", icon: <User className="h-3.5 w-3.5" /> },
  witness: { label: "شاهد", color: "blue", icon: <Users className="h-3.5 w-3.5" /> },
  expert: { label: "خبير", color: "violet", icon: <Search className="h-3.5 w-3.5" /> },
  representative: { label: "ممثل", color: "amber", icon: <ArrowRightLeft className="h-3.5 w-3.5" /> },
  other: { label: "أخرى", color: "slate", icon: <User className="h-3.5 w-3.5" /> },
}

export function PartiesTab({ caseDetail: c }: { caseDetail: CaseDetailT }) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = React.useState(false)
  const [crossCheckResult, setCrossCheckResult] = React.useState<any>(null)

  const partiesQ = useQuery({
    queryKey: ["parties", c.id],
    queryFn: () => api.listParties(c.id) as Promise<any>,
  })

  const addMut = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.addParty(c.id, data) as Promise<any>,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["parties", c.id] })
      qc.invalidateQueries({ queryKey: ["case", c.id] })
      toast.success("تم إضافة الطرف")
      if (result?.crossCaseAlert?.found) {
        setCrossCheckResult(result.crossCaseAlert)
        toast.warning(`⚠ تم اكتشاف ${result.crossCaseAlert.otherCases.length} قضية أخرى لنفس الطرف!`)
      }
      setShowAdd(false)
    },
    onError: () => toast.error("فشل الإضافة"),
  })

  const delMut = useMutation({
    mutationFn: (partyId: string) => api.deleteParty(c.id, partyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parties", c.id] })
      toast.success("تم حذف الطرف")
    },
  })

  const checkMut = useMutation({
    mutationFn: ({ nationalId, companyReg }: { nationalId?: string; companyReg?: string }) =>
      api.crossCaseCheck(nationalId, companyReg, c.id) as Promise<any>,
    onSuccess: (result) => {
      setCrossCheckResult(result)
      if (result?.found) {
        toast.warning(`تم العثور على ${result.count} قضية أخرى`)
      } else {
        toast.success("لا توجد قضايا أخرى لنفس الطرف")
      }
    },
  })

  const parties = partiesQ.data?.data ?? partiesQ.data ?? []

  return (
    <div className="space-y-4">
      {/* Cross-case alert */}
      {crossCheckResult?.found && (
        <div className="rounded-lg border-2 border-orange-500/40 bg-orange-500/5 p-4 seal-frame animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-kufi text-sm font-bold text-orange-700 mb-1">
                تنبيه: هذا الطرف له قضايا أخرى في محاكم أخرى
              </h3>
              <p className="font-kufi text-xs text-muted-foreground mb-3">
                تم العثور على {crossCheckResult.otherCases.length} قضية أخرى لنفس الطرف (بالرقم القومي أو السجل التجاري) في محاكم مختلفة. قد يؤثر هذا على الإجراءات أو الاختصاص.
              </p>
              <div className="space-y-2">
                {crossCheckResult.otherCases.map((oc: any, i: number) => (
                  <div key={i} className="rounded-md border border-orange-500/30 bg-background/40 p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-jetbrains text-[10px] text-orange-600">{oc.caseNumber}</span>
                      <StatusBadge label={oc.role === "plaintiff" ? "مدّعي" : oc.role === "defendant" ? "مدّعى عليه" : oc.role} color={oc.role === "plaintiff" ? "emerald" : "rose"} size="sm" />
                    </div>
                    <p className="font-kufi text-xs font-medium leading-snug">{oc.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-kufi text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> {oc.court}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parties list */}
      <SovereignPanel
        title="أطراف القضية"
        icon={<Users className="h-4 w-4" />}
        action={
          <Button onClick={() => setShowAdd(true)} size="sm" className="font-kufi bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-3.5 w-3.5" /> إضافة طرف
          </Button>
        }
      >
        <p className="font-kufi text-xs text-muted-foreground mb-3 leading-relaxed">
          أضف أطراف القضية بالرقم القومي (للأفراد) أو رقم السجل التجاري (للشركات). سيقوم النظام تلقائياً بالبحث في كل القضايا الأخرى لاكتشاف ما إذا كان نفس الطرف له قضايا في محاكم أخرى — وتنبيه القاضي.
        </p>

        {partiesQ.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-amber-400" /></div>
        ) : parties.length === 0 ? (
          <EmptyState title="لا توجد أطراف مسجّلة" hint="أضف الأطراف للبحث عن قضايا متقاطعة" icon={<Users className="h-8 w-8" />} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {parties.map((p: any) => {
              const roleMeta = ROLE_META[p.role] ?? ROLE_META.other
              const cc = colorClasses(roleMeta.color)
              return (
                <div key={p.id} className={cn("rounded-lg border p-3", cc.border)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", cc.bg, cc.text)}>
                        {p.type === "company" ? <Building2 className="h-4 w-4" /> : roleMeta.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-kufi text-sm font-medium leading-snug truncate">{p.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <StatusBadge label={roleMeta.label} color={roleMeta.color} size="sm" dot={false} />
                          {p.nationalId && <span className="font-jetbrains text-[9px] text-muted-foreground">قومي: {p.nationalId}</span>}
                          {p.companyReg && <span className="font-jetbrains text-[9px] text-muted-foreground">سجل: {p.companyReg}</span>}
                        </div>
                        {(p.address || p.phone || p.email) && (
                          <div className="flex items-center gap-2 mt-1 font-kufi text-[9px] text-muted-foreground">
                            {p.address && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" /> {p.address}</span>}
                            {p.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" /> {p.phone}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => delMut.mutate(p.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {/* Cross-case check button */}
                  {(p.nationalId || p.companyReg) && (
                    <button
                      onClick={() => checkMut.mutate({ nationalId: p.nationalId ?? undefined, companyReg: p.companyReg ?? undefined })}
                      disabled={checkMut.isPending}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-md border border-orange-500/30 bg-orange-500/5 py-1.5 font-kufi text-[10px] text-orange-700 hover:bg-orange-500/10 transition-colors"
                    >
                      {checkMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRightLeft className="h-3 w-3" />}
                      البحث عن قضايا أخرى لهذا الطرف
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SovereignPanel>

      {/* Add party dialog */}
      {showAdd && (
        <AddPartyDialog
          onAdd={(data) => addMut.mutate(data)}
          onClose={() => setShowAdd(false)}
          pending={addMut.isPending}
        />
      )}
    </div>
  )
}

function AddPartyDialog({
  onAdd, onClose, pending,
}: {
  onAdd: (data: Record<string, unknown>) => void
  onClose: () => void
  pending: boolean
}) {
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<"person" | "company">("person")
  const [role, setRole] = React.useState("plaintiff")
  const [nationalId, setNationalId] = React.useState("")
  const [companyReg, setCompanyReg] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [phone, setPhone] = React.useState("")

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-kufi">إضافة طرف جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">الاسم</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الطرف" className="font-kufi text-sm" />
            </div>
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">النوع</label>
              <Select value={type} onValueChange={(v) => setType(v as "person" | "company")}>
                <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="person" className="font-kufi text-xs">فرد</SelectItem>
                  <SelectItem value="company" className="font-kufi text-xs">شركة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="font-kufi text-xs text-muted-foreground mb-1 block">الصفة</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="font-kufi text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_META).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="font-kufi text-xs">{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === "person" ? (
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">الرقم القومي (14 رقماً)</label>
              <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="29XXXXXXXXXXXX" className="font-jetbrains text-sm" maxLength={14} />
            </div>
          ) : (
            <div>
              <label className="font-kufi text-xs text-muted-foreground mb-1 block">رقم السجل التجاري</label>
              <Input value={companyReg} onChange={(e) => setCompanyReg(e.target.value)} placeholder="XXXXX" className="font-jetbrains text-sm" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان (اختياري)" className="font-kufi text-sm" />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="الهاتف (اختياري)" className="font-kufi text-sm" />
          </div>
          <p className="font-kufi text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
            ⚠ سيقوم النظام تلقائياً بالبحث عن قضايا أخرى لنفس الطرف (بالرقم القومي أو السجل التجاري) في محاكم مختلفة فور إضافته.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="font-kufi">إلغاء</Button>
          <Button
            onClick={() => onAdd({ name, type, role, nationalId: nationalId || null, companyReg: companyReg || null, address: address || null, phone: phone || null })}
            disabled={pending || !name.trim()}
            className="font-kufi bg-amber-600 hover:bg-amber-700 text-white"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            إضافة + بحث متقاطع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
