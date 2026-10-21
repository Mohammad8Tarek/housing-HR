import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut, ArrowRight, Lock } from "lucide-react";
import { ActiveAppSession, APP_METADATA, AppDomain } from "@/lib/app-session";

interface SessionConflictModalProps {
  isOpen: boolean;
  activeSession: ActiveAppSession | null;
  targetApp: AppDomain;
  onConfirmSwitch: () => void | Promise<void>;
  onStayInCurrent: () => void;
}

export function SessionConflictModal({
  isOpen,
  activeSession,
  targetApp,
  onConfirmSwitch,
  onStayInCurrent,
}: SessionConflictModalProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  if (!activeSession) return null;

  const currentMeta = APP_METADATA[activeSession.app] || { ar: activeSession.app, en: activeSession.app };
  const targetMeta = APP_METADATA[targetApp] || { ar: targetApp, en: targetApp };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onStayInCurrent(); }}>
      <DialogContent className="max-w-md p-6 bg-card border-border shadow-2xl rounded-2xl" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader className="space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <DialogTitle className="text-xl font-bold text-center tracking-tight text-foreground">
            {ar ? "تنبيه أمان: جلسة عمل نشطة بالفعل" : "Security Notice: Active Session Detected"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground leading-relaxed">
            {ar
              ? "وفقاً لسياسات الأمان والحوكمة المعتمدة في مجموعة صن رايز، تم عزل الأنظمة لمنع تداخل الصلاحيات. لا يمكن التبديل بين التطبيقات المفتوحة إلا بعد تسجيل الخروج وإنهاء الجلسة النشطة."
              : "In accordance with SUNRISE security governance policies, application domains are strictly isolated. Switching between modules requires explicit sign-out and session termination."}
          </DialogDescription>
        </DialogHeader>

        {/* Visual Domain Comparison */}
        <div className="my-4 p-4 rounded-xl bg-muted/50 border border-border space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">
              {ar ? "الجلسة المفتوحة حالياً:" : "Current Active Session:"}
            </span>
            <span className="font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
              {ar ? currentMeta.ar : currentMeta.en}
            </span>
          </div>

          <div className="flex items-center justify-center text-muted-foreground">
            <ArrowRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">
              {ar ? "النظام المطلوب الانتقال إليه:" : "Requested Application:"}
            </span>
            <span className="font-bold text-foreground bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/20">
              {ar ? targetMeta.ar : targetMeta.en}
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onStayInCurrent}
            className="w-full sm:w-auto text-xs font-semibold rounded-xl"
          >
            {ar ? `البقاء في ${currentMeta.ar}` : `Stay in ${currentMeta.en}`}
          </Button>

          <Button
            type="button"
            onClick={onConfirmSwitch}
            className="w-full sm:w-auto text-xs font-bold bg-destructive hover:bg-destructive/90 text-white gap-2 rounded-xl shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>
              {ar
                ? "تسجيل الخروج وإنهاء الجلسة للتبديل"
                : "Sign Out & Switch Application"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
