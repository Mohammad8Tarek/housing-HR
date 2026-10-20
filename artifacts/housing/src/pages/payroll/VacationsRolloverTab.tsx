import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Clock,
  ShieldCheck,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/ui/permission-gate";

interface VacationsRolloverTabProps {
  propertyId: number;
}

export function VacationsRolloverTab({ propertyId }: VacationsRolloverTabProps) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [maxPostingCap, setMaxPostingCap] = useState<number>(30);
  const [previewRecords, setPreviewRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Preview Mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payroll/leaves/rollover-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          year: currentYear,
          maxCap: maxPostingCap,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to preview rollover");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPreviewRecords(data.records || []);
      toast.success(ar ? `تم احتساب معاينة الترحيل لـ ${data.count} موظف!` : `Preview calculated for ${data.count} staff!`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // 2. Post / Commit Mutation
  const postMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payroll/leaves/rollover-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          year: currentYear,
          maxCap: maxPostingCap,
          records: previewRecords,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to commit rollover");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || (ar ? "تم ترحيل أرصدة الإجازات بنجاح!" : "Rollover posted successfully!"));
      setPreviewRecords([]);
      queryClient.invalidateQueries({ queryKey: ["attendance-leaves"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = previewRecords.filter((r) => {
    return (
      !searchQuery ||
      r.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <h3 className="text-base font-bold text-slate-800">
              {ar ? "ترحيل أرصدة الإجازات السنوي (Yearly Vacations Rollover)" : "Yearly Vacations Rollover"}
            </h3>
            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
              SST 26.0 Legacy Parity
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ar
              ? "ترحيل الأرصدة المتبقية عبر الأوعية الأربعة (سنوية، راحات، أعياد، أخرى) بحد أقصى ترحيلي (Max Posting Cap)"
              : "Post remaining leave balances across 4 buckets (Annual, Dayoff, Holiday, Fourth) with maximum posting cap"}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
            className="gap-1.5 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 rounded-xl text-xs font-semibold h-10 px-3"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{previewMutation.isPending ? (ar ? "جاري الاحتساب..." : "Calculating...") : (ar ? "معاينة أرصدة الترحيل" : "Preview Rollover")}</span>
          </Button>

          {previewRecords.length > 0 && (
            <PermissionGate module="payroll" action="create">
              <Button
                onClick={() => {
                  if (window.confirm(ar ? `هل أنت متأكد من ترحيل أرصدة ${previewRecords.length} موظف للسنة المالية القادمة؟ لا يمكن التراجع عن هذا الإجراء.` : `Are you sure you want to commit leave rollover for ${previewRecords.length} employees?`)) {
                    postMutation.mutate();
                  }
                }}
                disabled={postMutation.isPending}
                className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-10 px-4 shadow-xs"
              >
                <ArrowRightLeft className="w-4 h-4 text-white" />
                <span>{postMutation.isPending ? (ar ? "جاري الترحيل..." : "Posting...") : (ar ? "اعتماد وترحيل الأرصدة رسمياً" : "Commit Rollover")}</span>
              </Button>
            </PermissionGate>
          )}
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {ar ? "سنة الترحيل المالية (Fiscal Year)" : "Fiscal Year"}
          </label>
          <Input
            type="number"
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="text-xs rounded-xl bg-white font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {ar ? "الحد الأقصى للترحيل بالأيام (Max Posting Cap)" : "Max Posting Cap (Days)"}
          </label>
          <Input
            type="number"
            value={maxPostingCap}
            onChange={(e) => setMaxPostingCap(Number(e.target.value))}
            className="text-xs rounded-xl bg-white font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            {ar ? "فلترة البحث" : "Search Filter"}
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ar ? "بحث بالاسم أو الكود..." : "Search..."}
              className="text-xs rounded-xl bg-white ps-8"
            />
          </div>
        </div>
      </div>

      {/* 4-Bucket Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-xl border-slate-200 shadow-2xs p-3">
          <div className="text-[11px] text-muted-foreground font-semibold">{ar ? "1. وعاء السنوي (Annual)" : "1. Annual Leave"}</div>
          <div className="text-lg font-black text-slate-800 mt-1">21 - 30 {ar ? "يوم" : "days"}</div>
          <div className="text-[10px] text-slate-400">{ar ? "الرصيد الأساسي وفقاً لقانون العمل" : "Statutory base leave"}</div>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-2xs p-3">
          <div className="text-[11px] text-muted-foreground font-semibold">{ar ? "2. وعاء الراحات (Day Off)" : "2. Day Off Pool"}</div>
          <div className="text-lg font-black text-blue-700 mt-1">{ar ? "راحات مجمعة" : "Compensated"}</div>
          <div className="text-[10px] text-slate-400">{ar ? "أيام الراحات الأسبوعية المؤجلة" : "Accumulated weekly days off"}</div>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-2xs p-3">
          <div className="text-[11px] text-muted-foreground font-semibold">{ar ? "3. وعاء الأعياد (Holidays)" : "3. Official Holidays"}</div>
          <div className="text-lg font-black text-amber-700 mt-1">{ar ? "رصيد الأعياد" : "Holiday Credit"}</div>
          <div className="text-[10px] text-slate-400">{ar ? "أيام العمل خلال المناسبات القومية" : "Work done on statutory holidays"}</div>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-2xs p-3">
          <div className="text-[11px] text-muted-foreground font-semibold">{ar ? "4. الوعاء الرابع (Fourth)" : "4. Fourth Bucket"}</div>
          <div className="text-lg font-black text-purple-700 mt-1">{ar ? "أخرى واستثنائية" : "Special Extra"}</div>
          <div className="text-[10px] text-slate-400">{ar ? "بدل مأموريات وساعات إضافية محولة" : "Special mission & converted balance"}</div>
        </Card>
      </div>

      {/* Preview Table */}
      <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-start">{ar ? "كود الموظف" : "Emp Code"}</th>
                <th className="py-3 px-3 text-start">{ar ? "اسم الموظف" : "Staff Name"}</th>
                <th className="py-3 px-3 text-start">{ar ? "القسم" : "Department"}</th>
                <th className="py-3 px-3 text-center">{ar ? "رصيد سنوي" : "Annual"}</th>
                <th className="py-3 px-3 text-center">{ar ? "رصيد راحات" : "Day Off"}</th>
                <th className="py-3 px-3 text-center">{ar ? "رصيد أعياد" : "Holiday"}</th>
                <th className="py-3 px-3 text-center">{ar ? "الوعاء الرابع" : "Fourth"}</th>
                <th className="py-3 px-3 text-center">{ar ? "المجموع الفعلي" : "Total Active"}</th>
                <th className="py-3 px-3 text-center">{ar ? "المرحل المعتمد (Capped)" : "Carried Over"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewMutation.isPending ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin text-[#c89332]" />
                      <span>{ar ? "جاري احتساب معاينة الترحيل السنوي..." : "Calculating rollover preview..."}</span>
                    </div>
                  </td>
                </tr>
              ) : previewRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <div className="space-y-1">
                      <p>{ar ? "اضغط على زر 'معاينة أرصدة الترحيل' لعرض استحقاقات الموظفين قبل الترحيل" : "Click 'Preview Rollover' to inspect balances before posting"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r: any) => {
                  const total = Number(r.annualCarried || 0) + Number(r.dayoffCarried || 0) + Number(r.holidayCarried || 0) + Number(r.fourthCarried || 0);
                  const capped = Math.min(total, maxPostingCap);
                  return (
                    <tr key={r.employeeId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{r.employeeCode}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{r.fullName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{r.department}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{r.annualCarried}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-blue-700">{r.dayoffCarried}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-700">{r.holidayCarried}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-purple-700">{r.fourthCarried}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{total}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge className="bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border-emerald-300">
                          {capped} {ar ? "يوم" : "days"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
