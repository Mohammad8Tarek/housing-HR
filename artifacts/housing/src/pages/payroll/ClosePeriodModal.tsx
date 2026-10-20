import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";

interface ClosePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: any;
}

export function ClosePeriodModal({ isOpen, onClose, period }: ClosePeriodModalProps) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [confirmPunches, setConfirmPunches] = useState(false);
  const [confirmTransactions, setConfirmTransactions] = useState(false);
  const [confirmLoans, setConfirmLoans] = useState(false);
  const [confirmPenalties, setConfirmPenalties] = useState(false);

  const canClose = confirmPunches && confirmTransactions && confirmLoans && confirmPenalties;

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/payroll/periods/${period.id}/close-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTransactionClosed: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to close period");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || (ar ? "تم إقفال الحركات الشهرية للفترة بنجاح!" : "Transactions closed successfully!"));
      onClose();
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-800">
              {ar ? "إقفال حركات الفترة المالية (SST Pre-Calculation Lock)" : "Close Period Transactions"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {ar
              ? `قفل الحركات الشهرية لفترة: ${period?.periodName || "الشهر الحالي"}. بعد الإقفال لن يُسمح بإضافة بنود متغيرة إضافية.`
              : "Lock all variable monthly inputs prior to final payroll calculation batch"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              {ar
                ? "تأكيد إقفال الحركات هو إجراء رقابي إلزامي لضمان عدم تعديل سجلات البصمة أو البدلات بعد بدء الاحتساب المالي."
                : "Mandatory internal audit checkpoint to freeze variable adjustments prior to disbursement."}
            </span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={confirmPunches}
                onChange={(e) => setConfirmPunches(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">
                {ar ? "تم تفريغ ومطابقة سجلات البصمة والغياب والتأخير" : "Biometric punches, tardiness & absence reconciled"}
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={confirmTransactions}
                onChange={(e) => setConfirmTransactions(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">
                {ar ? "تم تسجيل واعتماد كافة الحركات الشهرية والبدلات المتغيرة" : "All monthly variable allowances & deductions recorded"}
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={confirmLoans}
                onChange={(e) => setConfirmLoans(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">
                {ar ? "تم ترحيل أقساط السلف والخصومات البنكية المستحقة" : "Loan installments & advances applied to active period"}
              </span>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={confirmPenalties}
                onChange={(e) => setConfirmPenalties(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">
                {ar ? "تم اعتماد جزاءات قانون العمل 12/2003 وقرارات الشؤون القانونية" : "Legal penalties (Labor Law 12/2003) verified"}
              </span>
            </label>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs rounded-xl">
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="button"
            disabled={!canClose || closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{closeMutation.isPending ? (ar ? "جاري الإقفال..." : "Closing...") : (ar ? "إقفال حركات الفترة رسمياً" : "Lock Transactions")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
