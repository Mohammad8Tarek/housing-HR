import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useProperty } from "@/context/PropertyContext";
import { useLanguage } from "@/context/LanguageContext";
import { 
  Building2, 
  Coins, 
  Fingerprint, 
  ArrowRight, 
  ArrowLeft, 
  Languages, 
  LogOut, 
  LogIn, 
  Hotel,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SystemLauncher() {
  const { user, isAuthenticated, logout } = useAuth();
  const { propertySlug, properties, activePropertyId, setActivePropertyId } = useProperty();
  const { language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();

  const ar = language === "ar";
  const slug = propertySlug || "all";
  const ArrowIcon = ar ? ArrowLeft : ArrowRight;

  const handleLaunch = (targetPath: string) => {
    setLocation(targetPath);
  };

  const systems = [
    {
      id: "housing",
      title: ar ? "سكن العاملين" : "Staff Housing",
      subtitle: ar ? "منظومة تسكين النزلاء والعمليات الفندقية" : "Accommodation & Operations",
      description: ar
        ? "مخطط المباني والغرف، التسكين الذكي، حركات النزلاء، الصيانة، وأقفال الغرف الإلكترونية."
        : "Building layouts, room allocations, in-house residents, housekeeping, and door locks.",
      icon: Building2,
      target: `/${slug}/dashboard`,
      iconBg: "bg-blue-50 text-[#0f2942] border border-blue-100",
    },
    {
      id: "payroll",
      title: ar ? "المرتبات والمستحقات" : "Payroll & Benefits",
      subtitle: ar ? "مسير الرواتب والاستحقاقات البنكية" : "Salary Processing & Bank WPS",
      description: ar
        ? "حساب الرواتب للعمالة المثبتة واليومية، البدلات والاستقطاعات، السلف، وتصدير شيتات البنوك."
        : "Salary calculations for permanent and casual staff, allowances, deductions, and bank WPS files.",
      icon: Coins,
      target: "/payroll",
      iconBg: "bg-amber-50 text-[#c89332] border border-amber-200/60",
    },
    {
      id: "attendance",
      title: ar ? "الحضور وأجهزة البصمة" : "Biometric Attendance",
      subtitle: ar ? "الربط اللحظي بماكينات البصمة والورديات" : "Live Biometric Telemetry & Shifts",
      description: ar
        ? "ربط أجهزة الحضور والانصراف، تفريغ حركات البصمة الفورية، واحتساب ساعات العمل والورديات."
        : "Direct biometric reader integration, real-time punch ingestion, shifts, and overtime tracking.",
      icon: Fingerprint,
      target: "/attendance",
      iconBg: "bg-slate-100 text-[#0f2942] border border-slate-200",
    },
  ];

  return (
    <div 
      className="h-screen max-h-screen overflow-hidden bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-[#0f2942] selection:text-white"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* 1. Clean Top Navbar */}
      <header className="h-16 px-6 lg:px-12 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0f2942] text-[#c89332] flex items-center justify-center font-black shadow-xs">
            <span className="text-base font-serif">S</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[#0f2942] tracking-wider">SUNRISE</span>
              <span className="text-[11px] font-semibold text-[#c89332] bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md">
                Resorts & Cruises
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {ar ? "بوابة الأنظمة المركزية" : "Central Enterprise Portal"}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Property Selector (When authenticated) */}
          {isAuthenticated && properties.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <Hotel className="w-3.5 h-3.5 text-[#c89332]" />
              <select
                value={activePropertyId}
                onChange={(e) => setActivePropertyId(Number(e.target.value))}
                className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {ar ? p.displayName || p.name : p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="text-xs text-slate-600 hover:text-[#0f2942] hover:bg-slate-100 rounded-lg h-9 gap-1.5"
          >
            <Languages className="w-4 h-4 text-[#c89332]" />
            <span className="font-medium">{ar ? "English" : "العربية"}</span>
          </Button>

          {/* User state */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5 pl-2 rtl:pl-0 rtl:pr-2 border-l rtl:border-l-0 rtl:border-r border-slate-200">
              <div className="text-right rtl:text-right ltr:text-left hidden md:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">{user?.username}</div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {user?.isSystemAdmin ? (ar ? "مسؤول نظام" : "Admin") : (ar ? "مستخدم" : "User")}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                className="w-8 h-8 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                title={ar ? "تسجيل الخروج" : "Logout"}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/login")}
              className="text-xs border-[#0f2942]/20 text-[#0f2942] hover:bg-slate-100 rounded-lg h-9 gap-1.5 font-medium"
            >
              <LogIn className="w-3.5 h-3.5 text-[#c89332]" />
              <span>{ar ? "تسجيل الدخول" : "Sign In"}</span>
            </Button>
          )}
        </div>
      </header>

      {/* 2. Main Content (Centered, No Scroll) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 flex flex-col justify-center items-center">
        
        {/* Simple Clean Title */}
        <div className="text-center max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-[#0f2942] font-semibold mb-3 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c89332]"></span>
            <span>{ar ? "بوابة الأنظمة والتشغيل" : "Operations Gateway"}</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#0f2942] tracking-tight">
            {ar ? "اختر المنظومة للبدء" : "Select System to Continue"}
          </h1>
          
          <p className="text-xs md:text-sm text-slate-500 mt-2 leading-relaxed">
            {ar 
              ? "أنظمة مؤسسية معزولة ومخصصة لإدارة العمليات اليومية، المرتبات، والحضور والانصراف."
              : "Isolated enterprise systems engineered for hotel accommodations, payroll processing, and attendance."}
          </p>
        </div>

        {/* 3 Simple, Elegant Cards (Side by Side) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {systems.map((sys) => {
            const Icon = sys.icon;

            return (
              <div
                key={sys.id}
                onClick={() => handleLaunch(sys.target)}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col justify-between hover:border-[#c89332] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer relative"
              >
                {/* Subtle top accent bar */}
                <div className="absolute top-0 left-6 right-6 h-0.5 bg-[#0f2942]/10 group-hover:bg-[#c89332] transition-colors rounded-full" />

                <div>
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${sys.iconBg} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Title & Subtitle */}
                  <h2 className="text-lg font-bold text-[#0f2942] group-hover:text-[#c89332] transition-colors">
                    {sys.title}
                  </h2>
                  <p className="text-xs font-medium text-[#c89332] mt-0.5">
                    {sys.subtitle}
                  </p>

                  {/* Concise Description */}
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    {sys.description}
                  </p>
                </div>

                {/* Bottom Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0f2942] group-hover:text-[#c89332] transition-colors">
                    {ar ? "دخول المنظومة" : "Launch System"}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-[#0f2942] group-hover:text-white flex items-center justify-center text-slate-600 transition-colors">
                    <ArrowIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* 3. Single-line Crisp Footer */}
      <footer className="h-12 px-6 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#c89332]" />
          <span>{ar ? "قواعد بيانات معزولة ومحمية بالكامل" : "Isolated Databases & Role-Based Access"}</span>
        </div>
        <div>
          <span>{ar ? "مجموعة صن رايز للفنادق والمنتجعات © 2026" : "© 2026 SUNRISE Resorts & Cruises"}</span>
        </div>
      </footer>
    </div>
  );
}
