import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useHrAuth } from "@/context/HrAuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, KeyRound, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DualKeyAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (auditStamp: string) => void | Promise<void>;
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  actionCode: string;
}

export function DualKeyAuthModal({
  isOpen,
  onClose,
  onSuccess,
  titleAr = "تفويض أمني مزدوج للعمليات الحرجة",
  titleEn = "Dual-Key Security Authorization",
  descriptionAr = "يتطلب هذا الإجراء الحرج إدخال رمز التحقق الأمني (Supervisor PIN) للتأكيد والتسجيل في سجل التدقيق المالي.",
  descriptionEn = "This critical action requires supervisor PIN verification to authorize and append to the immutable financial audit log.",
  actionCode,
}: DualKeyAuthModalProps) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const { propertyScope, verifyPin } = useHrAuth();

  const [pin, setPin] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg(ar ? "يرجى إدخال رمز الـ PIN المالي" : "Please enter your Security PIN");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      const result = await verifyPin(pin, actionCode, reason);
      toast.success(
        ar ? "تم التحقق الأمني المزدوج بنجاح وتفويض الإجراء" : "Dual-Key authorization confirmed successfully"
      );
      setPin("");
      setReason("");
      onClose();
      await onSuccess(result.auditStamp);
    } catch (err: any) {
      setErrorMsg(err.message || (ar ? "رمز التأكيد غير صحيح" : "Invalid PIN code"));
      toast.error(err.message || (ar ? "فشل التحقق الأمني" : "Authorization failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-[#0d1320] text-[#dde2f5] border border-[#dfba73]/30 shadow-2xl shadow-black/80 rounded-2xl p-6">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#dfba73] shadow-lg shadow-amber-500/10">
            <KeyRound className="w-7 h-7 text-[#dfba73]" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-[#fdd68c]">
            {ar ? titleAr : titleEn}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 leading-relaxed">
            {ar ? descriptionAr : descriptionEn}
          </DialogDescription>
        </DialogHeader>

        {/* Property & Ledger Scope Lock Callout */}
        <div className="rounded-xl p-3 bg-black/40 border border-slate-800 flex items-center justify-between text-xs my-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#dfba73]" />
            <span className="text-slate-300 font-medium">
              {ar ? propertyScope?.nameAr : propertyScope?.nameEn}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
            {propertyScope?.code} • {propertyScope?.category === "casuals" ? (ar ? "كاجوال" : "Casuals") : (ar ? "دائم" : "Perm")}
          </Badge>
        </div>

        <form onSubmit={handleAuthorize} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#dfba73] uppercase tracking-wider block">
              {ar ? "رمز الأمان المالي (Supervisor PIN)" : "Supervisor Security PIN"}
            </label>
            <Input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="••••"
              autoFocus
              className="text-center text-2xl tracking-[0.5em] font-mono h-12 bg-[#161b29] border-slate-700 focus:border-[#dfba73] text-amber-200 placeholder:text-slate-600 rounded-xl"
            />
            <p className="text-[11px] text-slate-500 text-center">
              {ar ? "الرمز الافتراضي للتجربة والمراجعة: 1234 أو 2026" : "Default authorized PIN: 1234 or 2026"}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 block">
              {ar ? "سبب الإجراء أو الملاحظة الرقابية (اختياري)" : "Operational Justification / Reason (Optional)"}
            </label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={ar ? "مثال: اعتماد المسير النهائي للشهر..." : "e.g. End of month payroll batch lock..."}
              className="bg-[#161b29] border-slate-800 text-xs text-slate-200 rounded-xl h-9"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800/50 rounded-xl h-11"
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !pin.trim()}
              className="flex-1 bg-gradient-to-r from-[#dfba73] to-[#c5a059] text-black font-semibold hover:brightness-110 shadow-lg shadow-amber-500/20 rounded-xl h-11"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-black" />
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{ar ? "تأكيد وتفويض" : "Confirm & Authorize"}</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
