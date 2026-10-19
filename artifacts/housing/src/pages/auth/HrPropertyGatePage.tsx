import React, { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useHrAuth, PropertyScope } from "@/context/HrAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  Building2,
  Users,
  Palmtree,
  Sparkles,
  Languages,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  Loader2,
  Hotel
} from "lucide-react";
import { toast } from "sonner";

interface VaultOption extends PropertyScope {
  descriptionAr: string;
  descriptionEn: string;
  locationAr: string;
  locationEn: string;
}

const VAULT_OPTIONS: VaultOption[] = [
  {
    id: 1,
    code: "MRK-01",
    nameEn: "Meraki Resort Sharm El Sheikh (Permanent Staff)",
    nameAr: "منتجع ميراكي شرم الشيخ (العمالة الدائمة)",
    category: "permanent",
    ledgerCode: "PERM-EXEC-FY2025",
    badge: "MRK-01 • Sharm El Sheikh",
    locationAr: "شرم الشيخ • خليج القرش",
    locationEn: "Sharm El Sheikh • Sharks Bay",
    descriptionAr: "العمالة الدائمة والعقود السنوية ومسير الرواتب المعتمد والتأمينات",
    descriptionEn: "Permanent Staff, annual contracts & approved salary ledger",
  },
  {
    id: 2,
    code: "MRK-02",
    nameEn: "Meraki Resort (Casuals & Daily Wages)",
    nameAr: "منتجع ميراكي (العمالة اليومية والكاجوال)",
    category: "casuals",
    ledgerCode: "CASUAL-SHIFT-2025",
    badge: "MRK-02 • Banquets & Operations",
    locationAr: "شرم الشيخ • قطاع التشغيل والحفلات",
    locationEn: "Sharm El Sheikh • Banquets & Events",
    descriptionAr: "عمالة الحفلات والأفراح والورديات اليومية ومستحقات الصرف الأسبوعي",
    descriptionEn: "Banquets crew, daily shift rates & weekly disbursements",
  },
  {
    id: 3,
    code: "SCB-01",
    nameEn: "Sunrise Crystal Bay Resort (Permanent Staff)",
    nameAr: "صن رايز كريستال باي (العمالة الدائمة)",
    category: "permanent",
    ledgerCode: "SCB-PERM-2025",
    badge: "SCB-01 • Hurghada Grand",
    locationAr: "الغردقة • طريق القرى",
    locationEn: "Hurghada • Village Road",
    descriptionAr: "الكوادر والعمالة المنتظمة لمنتجع كريستال باي الغردقة",
    descriptionEn: "Crystal Bay Hurghada regular staff & management ledger",
  },
  {
    id: 4,
    code: "SCB-02",
    nameEn: "Sunrise Crystal Bay (Casuals & Seasonal)",
    nameAr: "صن رايز كريستال باي (كاجوال وموسمي)",
    category: "casuals",
    ledgerCode: "SCB-CAS-2025",
    badge: "SCB-02 • Seasonal Workforce",
    locationAr: "الغردقة • التشغيل الموسمي",
    locationEn: "Hurghada • Seasonal Workforce",
    descriptionAr: "عمالة المواسم والأغذية والمشروبات والمطابخ بنظام اليومية",
    descriptionEn: "High-season daily rate workers & F&B casual pool",
  },
  {
    id: 5,
    code: "MSM-01",
    nameEn: "Sunrise Montemare Resort (Permanent Staff)",
    nameAr: "صن رايز مونتيماري (العمالة الدائمة)",
    category: "permanent",
    ledgerCode: "MSM-PERM-2025",
    badge: "MSM-01 • Sharm El Sheikh Luxury",
    locationAr: "شرم الشيخ • رأس أم سيد",
    locationEn: "Sharm El Sheikh • Hadaba",
    descriptionAr: "العمالة الدائمة لمنتجع مونتيماري الفاخر المخصص للبالغين",
    descriptionEn: "Montemare Grand Select luxury permanent hospitality staff",
  },
  {
    id: 6,
    code: "SRO-01",
    nameEn: "Sunrise Romance Resort Sahl Hasheesh",
    nameAr: "صن رايز رومانس سهل حشيش (العمالة الدائمة)",
    category: "permanent",
    ledgerCode: "SRO-PERM-2025",
    badge: "SRO-01 • Sahl Hasheesh",
    locationAr: "الغردقة • سهل حشيش",
    locationEn: "Hurghada • Sahl Hasheesh",
    descriptionAr: "العمالة الدائمة لمنتجع رومانس الفاخر",
    descriptionEn: "Romance Resort Sahl Hasheesh permanent workforce",
  },
];

export default function HrPropertyGatePage() {
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const { login } = useHrAuth();

  const [selectedVault, setSelectedVault] = useState<VaultOption>(VAULT_OPTIONS[0]);
  const [username, setUsername] = useState<string>("hr_super_admin");
  const [password, setPassword] = useState<string>("SunriseHR@2026");
  const [pin, setPin] = useState<string>("1234");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg(ar ? "يرجى إدخال اسم المستخدم وكلمة المرور" : "Username and password required");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg("");
      await login(username.trim(), password, "both", selectedVault);
      toast.success(
        ar
          ? `تم الدخول بنجاح إلى نطاق: ${selectedVault.nameAr}`
          : `Successfully connected to: ${selectedVault.nameEn}`
      );
      // Navigate to payroll or attendance
      const target = window.location.search.includes("redirect=attendance") ? "/attendance" : "/payroll";
      setLocation(target);
    } catch (err: any) {
      setErrorMsg(err.message || (ar ? "فشل تسجيل الدخول أو الحساب غير مفعّل" : "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      className="min-h-screen bg-[#080e1b] text-[#dde2f5] flex flex-col justify-between selection:bg-[#dfba73] selection:text-black font-sans relative overflow-hidden"
    >
      {/* Background luxury gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#1a2b4c]/30 via-[#dfba73]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-[#0d1320]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfba73] to-[#9a7b38] flex items-center justify-center text-black font-serif font-bold text-lg shadow-lg shadow-amber-500/20">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold tracking-wider text-base text-[#fdd68c]">
                SUNRISE RESORTS & CRUISES
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
                ENTERPRISE HR VAULT
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              {ar ? "بوابة اختيار الفندق وقاعدة البيانات المعزولة" : "Isolated Hotel Property & Database Gateway"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="text-xs text-slate-300 hover:text-white border border-slate-700/60 rounded-xl px-3 py-1.5 h-8 gap-1.5"
          >
            <Languages className="w-3.5 h-3.5 text-[#dfba73]" />
            <span>{ar ? "English" : "العربية"}</span>
          </Button>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ISO 27001 • TLS 1.3 Vault</span>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="relative z-10 max-w-7xl mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <Badge className="bg-[#dfba73]/15 text-[#dfba73] border border-[#dfba73]/30 px-3 py-1 text-xs rounded-full">
            {ar ? "الخطوة الأولى: تحديد الفندق وفئة التشغيل" : "Step 1: Select Property & Operational Vault"}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white">
            {ar ? "منظومة الرواتب والبصمة الفندقية المعزولة" : "Isolated Hotel Payroll & Biometrics Gateway"}
          </h1>
          <p className="text-sm text-slate-400">
            {ar
              ? "طبقاً للمعايير الفندقية، يتم قفل جلسة العمل على قاعدة بيانات ودفتر رواتب الفندق المختار لمنع التداخل وحفظ سرية الأجور."
              : "Per hospitality compliance standards, access is cryptographically restricted to the chosen property ledger to prevent cross-hotel contention."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Property & Category Selector Tiles (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#dfba73] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{ar ? "اختر الفندق وقاعدة البيانات المخصصة" : "Select Property & Database Ledger"}</span>
              </h2>
              <span className="text-xs text-slate-400">
                {ar ? `${VAULT_OPTIONS.length} فنادق متاحة` : `${VAULT_OPTIONS.length} Available Vaults`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {VAULT_OPTIONS.map((vault) => {
                const isSelected = selectedVault.code === vault.code;
                const isCasual = vault.category === "casuals";

                return (
                  <div
                    key={vault.code}
                    onClick={() => setSelectedVault(vault)}
                    className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border text-start relative ${
                      isSelected
                        ? "bg-[#161f36] border-[#dfba73] shadow-lg shadow-amber-500/10 ring-1 ring-[#dfba73]"
                        : "bg-[#0d1320]/80 border-slate-800 hover:border-slate-700 hover:bg-[#121929]"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 end-3 text-[#dfba73]">
                        <CheckCircle2 className="w-5 h-5 fill-[#dfba73]/20" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isCasual ? "bg-amber-500/10 text-amber-300" : "bg-blue-500/10 text-blue-300"
                        }`}
                      >
                        {isCasual ? <Users className="w-4 h-4" /> : <Hotel className="w-4 h-4" />}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isCasual
                            ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                            : "bg-blue-950/40 border-blue-500/40 text-blue-300"
                        }`}
                      >
                        {vault.badge}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-semibold text-white leading-snug line-clamp-1">
                      {ar ? vault.nameAr : vault.nameEn}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {ar ? vault.descriptionAr : vault.descriptionEn}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{vault.ledgerCode}</span>
                      <span className="text-[#dfba73] font-medium">
                        {isCasual ? (ar ? "تشغيل يومي" : "Daily Shift") : (ar ? "أجور شهرية" : "Monthly Wages")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Scoped Authentication Card (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-[#0d1320] border border-[#dfba73]/30 p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
                    {ar ? "مصادقة مقيدة بالفندق" : "Scoped Authorization"}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400">{selectedVault.code}</span>
                </div>
                <h2 className="text-xl font-bold font-serif text-[#fdd68c]">
                  {ar ? "بيانات الدخول للكيان المختار" : "Hotel Vault Authentication"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {ar ? selectedVault.nameAr : selectedVault.nameEn}
                </p>
              </div>

              {/* Scope Lock Security Callout */}
              <div className="rounded-2xl p-3.5 bg-black/50 border border-amber-500/20 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                  <Lock className="w-4 h-4 shrink-0 text-[#dfba73]" />
                  <span>{ar ? "تنبيه إغلاق النطاق التشغيلي:" : "Data Isolation Protocol:"}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {ar
                    ? "بمجرد الدخول، سيتم تقييد الجلسة على دفتر رواتب وبصمات هذا الفندق فقط. لا يمكن التبديل العشوائي من الداخل لحماية الأداء وسرية البيانات."
                    : "Session is bound strictly to this property ledger. In-app switching is locked to maintain confidentiality and peak performance."}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#dfba73] uppercase tracking-wider block">
                    {ar ? "اسم المستخدم (Staff Username)" : "Staff Username"}
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. hr_super_admin"
                    className="bg-[#161b29] border-slate-700 focus:border-[#dfba73] text-sm text-white rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#dfba73] uppercase tracking-wider block">
                    {ar ? "كلمة المرور (Password)" : "Password"}
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-[#161b29] border-slate-700 focus:border-[#dfba73] text-sm text-white rounded-xl h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      {ar ? "رمز الأمان المالي (Supervisor PIN)" : "Supervisor Security PIN"}
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Default: 1234</span>
                  </div>
                  <Input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="1234"
                    className="text-center font-mono tracking-widest text-lg bg-[#161b29] border-slate-700 focus:border-[#dfba73] text-amber-300 rounded-xl h-11"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#dfba73] via-[#fdd68c] to-[#c5a059] text-black font-semibold hover:brightness-110 shadow-lg shadow-amber-500/20 rounded-xl h-12 text-sm mt-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-black" />
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      <span>
                        {ar
                          ? `دخول منظومة أجور: ${selectedVault.code}`
                          : `Authorize & Connect to ${selectedVault.code}`}
                      </span>
                      {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                  )}
                </Button>
              </form>

              {/* Quick Preset Credentials Hint for Testing */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{ar ? "الحساب الرئيسي المعتمد:" : "Demo Master Account:"}</span>
                <span className="font-mono text-[#dfba73]">hr_super_admin / SunriseHR@2026</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#0d1320]/80 backdrop-blur-md px-6 py-3.5 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          © 2026 SUNRISE Resorts & Cruises • Multi-Tenant Property Vault Isolation v4.8
        </p>
        <p className="font-mono text-[11px] text-slate-400">
          CBE Wages Protection System (WPS) & Egyptian Labor Law 12/2003 Compliant
        </p>
      </footer>
    </div>
  );
}
