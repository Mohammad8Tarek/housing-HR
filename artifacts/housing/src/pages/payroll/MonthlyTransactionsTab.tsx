import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowUpDown,
  Building2,
  Calendar,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/ui/permission-gate";

interface MonthlyTransactionsTabProps {
  propertyId: number;
  periodId?: number;
  employees: any[];
}

export function MonthlyTransactionsTab({ propertyId, periodId, employees }: MonthlyTransactionsTabProps) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCalcNumber, setSelectedCalcNumber] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    bandCode: "101",
    bandName: "بدل وجبة إضافية",
    calculateBy: "amount",
    calculateValue: "150.00",
    calculationNumber: 1,
    costCenterCode: "CC-FNB",
    notes: "حركة شهرية استثنائية",
  });

  const { data: transData, isLoading } = useQuery({
    queryKey: ["monthly-transactions", propertyId, periodId],
    queryFn: async () => {
      const url = periodId
        ? `/api/payroll/monthly-transactions?propertyId=${propertyId}&periodId=${periodId}`
        : `/api/payroll/monthly-transactions?propertyId=${propertyId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load transactions");
      return res.json();
    },
  });

  const transactionsList: any[] = transData?.transactions || [];

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/payroll/monthly-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم تسجيل الحركة الشهرية المتغيرة بنجاح وفق بنود SST!" : "Monthly variable transaction registered successfully!");
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["monthly-transactions"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/payroll/monthly-transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete transaction");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم حذف الحركة الشهرية" : "Transaction deleted");
      queryClient.invalidateQueries({ queryKey: ["monthly-transactions"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredTransactions = transactionsList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bandCode?.includes(searchQuery);

    const matchesCalc =
      selectedCalcNumber === "all" ||
      String(item.calculationNumber) === selectedCalcNumber;

    return matchesSearch && matchesCalc;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) {
      toast.error(ar ? "يرجى اختيار الموظف" : "Please select an employee");
      return;
    }
    createMutation.mutate({
      ...form,
      propertyId,
      payrollPeriodId: periodId || null,
      calculateValue: String(form.calculateValue),
      calculationNumber: Number(form.calculationNumber),
    });
  };

  const bandPresets = [
    { code: "101", name: ar ? "بدل وجبة إضافية" : "Extra Meal Allowance", type: "amount" },
    { code: "102", name: ar ? "مكافأة تشجيعية فورية" : "Incentive Bonus", type: "amount" },
    { code: "105", name: ar ? "ساعات إضافية معتمدة" : "Approved Overtime", type: "hours" },
    { code: "110", name: ar ? "بدل طبيعة عمل فندقي" : "Hazard / Work Allowance", type: "amount" },
    { code: "201", name: ar ? "خصم تأخير متكرر" : "Tardiness Deduction", type: "days" },
    { code: "205", name: ar ? "اشتراك صندوق العاملين" : "Staff Fund Contribution", type: "amount" },
    { code: "210", name: ar ? "تلفيات ومهمات عهدة" : "Damages & Broken Assets", type: "amount" },
  ];

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h3 className="text-base font-bold text-slate-800">
              {ar ? "الحركات الشهرية المتغيرة (Monthly Transactions)" : "Monthly Variable Transactions"}
            </h3>
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
              SST 26.0 Legacy Parity
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ar
              ? "تسجيل البنود المتغيرة للمرتبات (أيام / ساعات / مبالغ / نسب) وربطها بأرقام الاحتساب (Calc.# 1, 2, 3)"
              : "Variable salary inputs (days/hours/amounts/percent) tied to calculation batches"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate module="payroll" action="create">
            <Button
              onClick={() => {
                if (employees.length > 0 && !form.employeeId) {
                  setForm({ ...form, employeeId: String(employees[0].id) });
                }
                setIsAddModalOpen(true);
              }}
              className="gap-1.5 bg-[#0f2942] hover:bg-[#1a3f63] text-white rounded-xl text-xs font-bold h-10 px-4 shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#c89332]" />
              <span>{ar ? "إضافة حركة شهرية جديدة" : "Add Variable Transaction"}</span>
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ar ? "بحث بكود الموظف، الاسم، كود أو اسم البند..." : "Search by code, name, band..."}
            className="ps-9 bg-white text-xs rounded-lg border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">{ar ? "رقم الاحتساب:" : "Calc.#:"}</span>
          <select
            value={selectedCalcNumber}
            onChange={(e) => setSelectedCalcNumber(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700"
          >
            <option value="all">{ar ? "كافة أرقام الاحتساب (All)" : "All Batches"}</option>
            <option value="1">{ar ? "احتساب رقم 1 (Calc.# 1)" : "Batch 1"}</option>
            <option value="2">{ar ? "احتساب رقم 2 (Calc.# 2)" : "Batch 2"}</option>
            <option value="3">{ar ? "احتساب رقم 3 (Calc.# 3)" : "Batch 3"}</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-start">{ar ? "كود الموظف" : "Emp Code"}</th>
                <th className="py-3 px-3 text-start">{ar ? "اسم الموظف" : "Employee Name"}</th>
                <th className="py-3 px-3 text-start">{ar ? "كود البند" : "Band Code"}</th>
                <th className="py-3 px-3 text-start">{ar ? "اسم البند" : "Band Description"}</th>
                <th className="py-3 px-3 text-start">{ar ? "طريقة الاحتساب" : "Calc By"}</th>
                <th className="py-3 px-3 text-start">{ar ? "القيمة / الكمية" : "Value"}</th>
                <th className="py-3 px-3 text-start">{ar ? "رقم الاحتساب" : "Calc.#"}</th>
                <th className="py-3 px-3 text-start">{ar ? "مركز التكلفة" : "Cost Center"}</th>
                <th className="py-3 px-3 text-start">{ar ? "ملاحظات" : "Notes"}</th>
                <th className="py-3 px-3 text-center">{ar ? "إجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 animate-spin text-[#c89332]" />
                      <span>{ar ? "جاري تحميل الحركات الشهرية..." : "Loading variable transactions..."}</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    {ar ? "لا توجد حركات شهرية مسجلة لهذه الفترة حتى الآن" : "No variable transactions recorded for this period"}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{tx.employeeCode}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{tx.employeeName}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 border-slate-300">
                        {tx.bandCode}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{tx.bandName}</td>
                    <td className="py-2.5 px-3">
                      <span className="capitalize text-slate-600 font-semibold">
                        {tx.calculateBy === "amount" ? (ar ? "مبلغ نقدي" : "Amount") :
                         tx.calculateBy === "days" ? (ar ? "أيام" : "Days") :
                         tx.calculateBy === "hours" ? (ar ? "ساعات" : "Hours") : (ar ? "نسبة %" : "Percent")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {tx.calculateValue} {tx.calculateBy === "amount" ? "EGP" : tx.calculateBy === "hours" ? "Hrs" : tx.calculateBy === "days" ? "Days" : "%"}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge className="bg-slate-800 text-white text-[10px] px-2 py-0.5">
                        Calc #{tx.calculationNumber}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{tx.costCenterCode || "—"}</td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate">{tx.notes || "—"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <PermissionGate module="payroll" action="delete">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(ar ? "هل أنت متأكد من حذف هذه الحركة؟" : "Are you sure you want to delete this transaction?")) {
                              deleteMutation.mutate(tx.id);
                            }
                          }}
                          className="w-7 h-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              {ar ? "تسجيل حركة شهرية متغيرة (SST Variable Transaction)" : "Add Monthly Variable Transaction"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar ? "إدخال بند استحقاق أو استقطاع استثنائي للموظف قبل احتساب المسير" : "Record variable salary addition or deduction before running payroll"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {ar ? "الموظف المستهدف" : "Target Employee"}
              </label>
              <select
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium"
                required
              >
                <option value="">{ar ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    [{emp.employeeCode}] {emp.fullName} - {emp.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "بند الراتب المحدد" : "Salary Band Preset"}
                </label>
                <select
                  value={form.bandCode}
                  onChange={(e) => {
                    const preset = bandPresets.find((p) => p.code === e.target.value);
                    if (preset) {
                      setForm({
                        ...form,
                        bandCode: preset.code,
                        bandName: preset.name,
                        calculateBy: preset.type,
                      });
                    }
                  }}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  {bandPresets.map((b) => (
                    <option key={b.code} value={b.code}>
                      [{b.code}] {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "طريقة الاحتساب" : "Calculate By"}
                </label>
                <select
                  value={form.calculateBy}
                  onChange={(e) => setForm({ ...form, calculateBy: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="amount">{ar ? "مبلغ نقدي (Amount EGP)" : "Amount (EGP)"}</option>
                  <option value="days">{ar ? "أيام عمل (Days)" : "Days"}</option>
                  <option value="hours">{ar ? "ساعات عمل (Hours)" : "Hours"}</option>
                  <option value="percent">{ar ? "نسبة مئوية (%)" : "Percent (%)"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "القيمة / الكمية" : "Calculate Value"}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.calculateValue}
                  onChange={(e) => setForm({ ...form, calculateValue: e.target.value })}
                  className="text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "رقم دورة الاحتساب (Calc.#)" : "Calc.# Batch"}
                </label>
                <select
                  value={form.calculationNumber}
                  onChange={(e) => setForm({ ...form, calculationNumber: Number(e.target.value) })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value={1}>{ar ? "احتساب رقم 1 (Calc.# 1)" : "Batch 1"}</option>
                  <option value={2}>{ar ? "احتساب رقم 2 (Calc.# 2)" : "Batch 2"}</option>
                  <option value={3}>{ar ? "احتساب رقم 3 (Calc.# 3)" : "Batch 3"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "مركز التكلفة المحاسبي" : "Cost Center"}
                </label>
                <Input
                  value={form.costCenterCode}
                  onChange={(e) => setForm({ ...form, costCenterCode: e.target.value })}
                  placeholder="CC-FNB"
                  className="text-xs rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "ملاحظات الحركة" : "Notes"}
                </label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder={ar ? "إذن صرف، قرار إداري..." : "Authorization ref..."}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs rounded-xl"
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-[#0f2942] hover:bg-[#1a3f63] text-white text-xs font-bold rounded-xl"
              >
                {createMutation.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ الحركة الشهرية" : "Save Transaction")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
