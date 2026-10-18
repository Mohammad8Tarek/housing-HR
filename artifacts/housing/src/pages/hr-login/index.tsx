import React, { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useHrAuth } from "@/context/HrAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Fingerprint, 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Languages, 
  ShieldCheck, 
  Sparkles,
  KeyRound,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";

interface HrLoginPageProps {
  system: "payroll" | "attendance";
}

export default function HrLoginPage({ system }: HrLoginPageProps) {
  const { language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const { login } = useHrAuth();
  const [, setLocation] = useLocation();

  const isPayroll = system === "payroll";
  const [username, setUsername] = useState(isPayroll ? "payroll_manager" : "attendance_officer");
  const [password, setPassword] = useState(isPayroll ? "SunrisePay@2026" : "SunriseAtt@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ArrowIcon = ar ? ArrowLeft : ArrowRight;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error(ar ? "يرجى إدخال اسم المستخدم وكلمة المرور" : "Please enter username and password");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(username.trim(), password, system);
      toast.success(
        ar 
          ? `تم تسجيل الدخول بنجاح إلى ${isPayroll ? "منظومة الرواتب" : "منظومة الحضور والبصمة"}` 
          : `Successfully logged into ${isPayroll ? "Payroll" : "Attendance"} workspace`
      );
      setLocation(isPayroll ? "/payroll" : "/attendance");
    } catch (err: any) {
      toast.error(err.message || (ar ? "فشل تسجيل الدخول، تأكد من صحة البيانات والصلاحيات" : "Login failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const setPresetUser = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div 
      className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-[#0f2942] selection:text-white"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* Top Navbar */}
      <header className="h-16 px-6 lg:px-12 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0f2942] transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <div className="w-7 h-7 rounded-lg bg-[#0f2942] text-[#c89332] flex items-center justify-center font-black">
              <span className="text-sm font-serif">S</span>
            </div>
            <span>{ar ? "بوابة الأنظمة الرئيسية" : "Back to Main Portal"}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="text-xs text-slate-600 hover:text-[#0f2942] hover:bg-slate-100 rounded-lg h-9 gap-1.5"
          >
            <Languages className="w-4 h-4 text-[#c89332]" />
            <span className="font-medium">{ar ? "English" : "العربية"}</span>
          </Button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative">
          
          {/* Top Accent Line */}
          <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-[#0f2942] via-[#c89332] to-[#0f2942] rounded-full" />

          {/* System Badge & Icon */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-sm bg-slate-50 border border-slate-200">
              {isPayroll ? (
                <DollarSign className="w-7 h-7 text-[#c89332]" />
              ) : (
                <Fingerprint className="w-7 h-7 text-[#0f2942]" />
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-amber-50 text-[#c89332] border border-amber-200/80">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isPayroll ? (ar ? "حماية مسير الرواتب المشددة" : "Statutory Payroll Security") : (ar ? "حماية أجهزة البصمة والورديات" : "Biometric Telemetry Security")}</span>
            </div>

            <h1 className="text-2xl font-bold text-[#0f2942] tracking-tight">
              {isPayroll 
                ? (ar ? "تسجيل دخول مسير الرواتب" : "Payroll System Login") 
                : (ar ? "تسجيل دخول الحضور والبصمة" : "Attendance System Login")}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {ar ? "أدخل بيانات الدخول المخصصة والمحمية بنظام الصلاحيات المستقل" : "Enter dedicated credentials for isolated workspace"}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {ar ? "اسم المستخدم" : "Username"}
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400 rtl:right-3 rtl:left-auto" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={ar ? "اسم المستخدم..." : "Username..."}
                  className="px-9 text-xs h-10 border-slate-200 focus:border-[#c89332] rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                {ar ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400 rtl:right-3 rtl:left-auto" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="px-9 text-xs h-10 border-slate-200 focus:border-[#c89332] rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 rtl:left-3 rtl:right-auto"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-[#0f2942] hover:bg-[#193a5c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>{isSubmitting ? (ar ? "جاري التحقق..." : "Authenticating...") : (ar ? "دخول مساحة العمل" : "Sign In to Workspace")}</span>
              <ArrowIcon className="w-4 h-4 text-[#c89332]" />
            </Button>
          </form>

          {/* Quick Preset Selector for Fast Verification */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#c89332]" />
              <span>{ar ? "حسابات تجريبية سريعة للاختبار:" : "Quick Demo Accounts:"}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {isPayroll ? (
                <>
                  <button
                    type="button"
                    onClick={() => setPresetUser("payroll_manager", "SunrisePay@2026")}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left rtl:text-right transition-colors"
                  >
                    <div className="font-bold text-[#0f2942]">payroll_manager</div>
                    <div className="text-[10px] text-slate-400">SunrisePay@2026</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetUser("hr_super_admin", "SunriseHR@2026")}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left rtl:text-right transition-colors"
                  >
                    <div className="font-bold text-[#0f2942]">hr_super_admin</div>
                    <div className="text-[10px] text-slate-400">SunriseHR@2026</div>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setPresetUser("attendance_officer", "SunriseAtt@2026")}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left rtl:text-right transition-colors"
                  >
                    <div className="font-bold text-[#0f2942]">attendance_officer</div>
                    <div className="text-[10px] text-slate-400">SunriseAtt@2026</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetUser("hr_super_admin", "SunriseHR@2026")}
                    className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left rtl:text-right transition-colors"
                  >
                    <div className="font-bold text-[#0f2942]">hr_super_admin</div>
                    <div className="text-[10px] text-slate-400">SunriseHR@2026</div>
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-12 px-6 bg-white border-t border-slate-200 flex items-center justify-center text-xs text-slate-400 shrink-0">
        <span>{ar ? "مجموعة صن رايز للفنادق والمنتجعات © 2026 — حماية مشددة وعزل تام" : "© 2026 SUNRISE Resorts & Cruises — High-Security Isolation"}</span>
      </footer>
    </div>
  );
}
