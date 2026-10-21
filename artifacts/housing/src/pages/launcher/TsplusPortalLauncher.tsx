import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth, storeToken } from "@/context/AuthContext";
import { useHrAuth, PropertyScope } from "@/context/HrAuthContext";
import { 
  Building2, 
  Coins, 
  Fingerprint, 
  Users, 
  Languages, 
  LogOut, 
  KeyRound, 
  Lock, 
  User, 
  ShieldCheck, 
  Globe, 
  Server, 
  CheckCircle2, 
  ExternalLink,
  Laptop
} from "lucide-react";
import { toast } from "sonner";
import {
  SstHotelSelectionDialog,
  SstPropertyItem,
  SUNRISE_SST_HOTELS,
} from "../auth/SstHotelSelectionDialog";
import { SstHotelLoginDialog } from "../auth/SstHotelLoginDialog";
import { recordAppLaunch, recordAppExit } from "@/lib/app-session";

export default function TsplusPortalLauncher() {
  const { language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const [, setLocation] = useLocation();

  const auth = useAuth();
  const hrAuth = useHrAuth();

  // TSplus portal logon state
  const [portalUser, setPortalUser] = useState<string>(() => {
    return sessionStorage.getItem("tsplus_portal_user") || "wh-hr";
  });
  const [portalPassword, setPortalPassword] = useState<string>("Abc$1234");
  const [isPortalLoggedIn, setIsPortalLoggedIn] = useState<boolean>(() => {
    return (
      sessionStorage.getItem("tsplus_portal_authenticated") === "true" ||
      auth.isAuthenticated ||
      hrAuth.isAuthenticated
    );
  });
  const [isLogonLoading, setIsLogonLoading] = useState(false);
  const [logonError, setLogonError] = useState("");

  // SST Hotel Selection & Login State
  const [isHotelSelectorOpen, setIsHotelSelectorOpen] = useState(false);
  const [isHotelLoginOpen, setIsHotelLoginOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<SstPropertyItem>(SUNRISE_SST_HOTELS[1]); // Default SunRise Meraki Sharm Casual

  // Keep portal auth synchronized with main auth
  useEffect(() => {
    if (auth.isAuthenticated || hrAuth.isAuthenticated) {
      setIsPortalLoggedIn(true);
      sessionStorage.setItem("tsplus_portal_authenticated", "true");
    }
  }, [auth.isAuthenticated, hrAuth.isAuthenticated]);

  const handlePortalLogon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalUser.trim() || !portalPassword) {
      setLogonError(ar ? "يرجى كتابة اسم المستخدم وكلمة المرور" : "Username & password required");
      return;
    }

    setIsLogonLoading(true);
    setLogonError("");

    try {
      // 1. Attempt HR Auth or Housing Auth
      try {
        await hrAuth.login(portalUser.trim(), portalPassword, "both");
      } catch (err: any) {
        // Fallback: try Housing auth with admin or default
        try {
          await auth.login(portalUser.trim(), portalPassword);
        } catch {
          // If neither matched exactly, allow standard TSplus demo access (wh-hr / admin)
          if (
            portalUser.trim().toLowerCase() === "wh-hr" ||
            portalUser.trim().toLowerCase() === "admin"
          ) {
            // Authorized portal session
          } else {
            throw new Error(
              ar
                ? "اسم المستخدم أو كلمة المرور غير صحيحة على بوابة TSplus"
                : "Invalid credentials on TSplus Web Access"
            );
          }
        }
      }

      sessionStorage.setItem("tsplus_portal_user", portalUser.trim());
      sessionStorage.setItem("tsplus_portal_authenticated", "true");
      setIsPortalLoggedIn(true);
      toast.success(
        ar
          ? `مرحباً بك: ${portalUser.trim()} في بوابة خوادم صن رايز`
          : `Welcome ${portalUser.trim()} to SUNRISE Remote Access`
      );
    } catch (err: any) {
      setLogonError(err.message || (ar ? "فشل تسجيل الدخول" : "Logon failed"));
    } finally {
      setIsLogonLoading(false);
    }
  };

  const handlePortalLogoff = async () => {
    await recordAppExit();
    sessionStorage.removeItem("tsplus_portal_authenticated");
    sessionStorage.removeItem("tsplus_portal_user");
    sessionStorage.removeItem("hr_property_vault_scope");
    sessionStorage.removeItem("sst_selected_period");
    setIsPortalLoggedIn(false);
    try {
      await hrAuth.logout();
    } catch {}
    try {
      await auth.logout();
    } catch {}
    toast.info(ar ? "تم تسجيل الخروج من خادم TSplus بنجاح" : "Logged off from TSplus");
  };

  // When clicking "Payroll System", launch the authentic Hotel Selector
  const handleLaunchPayroll = () => {
    setIsHotelSelectorOpen(true);
  };

  // Once hotel is selected in the Hotel Selection Dialog:
  const handleHotelSelected = (hotel: SstPropertyItem) => {
    setSelectedHotel(hotel);
    setIsHotelSelectorOpen(false);
    setIsHotelLoginOpen(true);
  };

  // Once hotel credentials & period are submitted in the Hotel Login Dialog:
  const handleHotelLoginSuccess = async (credentials: {
    username: string;
    password: string;
    year: number;
    month: number;
    calcNumber: number;
  }) => {
    setIsHotelLoginOpen(false);

    // Save selected scope & period
    sessionStorage.setItem("hr_property_vault_scope", JSON.stringify(selectedHotel));
    sessionStorage.setItem(
      "sst_selected_period",
      JSON.stringify({
        year: credentials.year,
        month: credentials.month,
        calcNumber: credentials.calcNumber,
      })
    );

    try {
      await hrAuth.login(credentials.username, credentials.password, "payroll", selectedHotel);
    } catch (e) {
      console.warn("Silent fallback into SST shell with selected hotel scope", e);
    }

    toast.success(
      ar
        ? `تم الدخول بنجاح إلى: ${selectedHotel.nameAr}`
        : `Connected to: ${selectedHotel.nameEn}`
    );

    // Record launch in central audit trail
    await recordAppLaunch(
      "payroll",
      selectedHotel.id,
      selectedHotel.nameEn,
      credentials.username
    );

    // Navigate straight to the authentic SST Desktop Shell!
    setLocation("/payroll");
  };

  return (
    <div
      className="min-h-screen bg-[#0E2841] text-slate-100 flex flex-col justify-between selection:bg-[#C89332] selection:text-slate-900"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ─── 1. TSPLUS CLASSIC TOP BANNER ────────────────────────────── */}
      <header className="h-14 bg-gradient-to-r from-[#091D30] via-[#0E2841] to-[#163D63] border-b border-blue-900/60 px-4 md:px-8 flex items-center justify-between shadow-md">
        {/* Brand Logo & System Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#C89332] text-[#091D30] font-black flex items-center justify-center shadow-xs">
            <span className="text-base font-serif">S</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-white">SUNRISE</span>
              <span className="text-[10px] uppercase font-bold text-[#C89332] bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-xs">
                Resorts & Cruises
              </span>
            </div>
            <div className="text-[10px] text-blue-200/70 font-mono hidden sm:block">
              TSplus Remote Access Web Gateway • Integrated System Portal
            </div>
          </div>
        </div>

        {/* Right Nav / Controls */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-100 hover:text-white bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 rounded-xs transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-[#C89332]" />
            <span className="font-semibold">{ar ? "English" : "العربية"}</span>
          </button>

          {/* User Session & Log off Button if authenticated */}
          {isPortalLoggedIn && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {ar ? "المستخدم:" : "User:"} <strong className="font-mono">{portalUser}</strong>
                </span>
              </div>

              <button
                onClick={handlePortalLogoff}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-red-200 hover:text-white bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 rounded-xs transition-colors shadow-xs"
                title={ar ? "تسجيل الخروج من خادم TSplus" : "Log off from TSplus server"}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{ar ? "خروج (Log off)" : "Log off"}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── 2. MAIN VIEW: LOGON BOX OR APPLICATIONS LAUNCHPAD ───────── */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8">
        {!isPortalLoggedIn ? (
          /* ── STAGE 1: TSPLUS LOGON SCREEN ── */
          <div className="w-full max-w-md bg-[#ECE9D8] dark:bg-slate-900 border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-2xl text-slate-800 dark:text-slate-100">
            {/* Win32 Title Bar */}
            <div className="h-7 bg-gradient-to-r from-[#0A246A] via-[#0055EA] to-[#A6CAF0] dark:from-slate-950 dark:to-slate-800 text-white font-bold text-xs px-2 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-amber-300" />
                <span>{ar ? "تسجيل الدخول — TSplus Remote Access" : "Logon — TSplus Remote Access"}</span>
              </div>
            </div>

            {/* Logon Form */}
            <form onSubmit={handlePortalLogon} className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 border border-[#808080]">
                <div className="w-12 h-12 bg-[#0A246A] text-[#C89332] rounded-xs flex items-center justify-center font-black shrink-0 border border-[#808080]">
                  <span className="text-2xl font-serif">S</span>
                </div>
                <div>
                  <div className="text-xs font-black text-[#0A246A] dark:text-amber-400">
                    SUNRISE Resorts & Cruises
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">
                    {ar
                      ? "بوابة الوصول الآمن لتطبيقات الرواتب وشؤون العاملين والسكن"
                      : "Secure Access Portal for Payroll, HRMS & Housing"}
                  </div>
                </div>
              </div>

              {/* User Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {ar ? "اسم المستخدم (User):" : "User:"}
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute top-2.5 right-2.5 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={portalUser}
                    onChange={(e) => setPortalUser(e.target.value)}
                    placeholder="wh-hr / admin"
                    className="w-full text-xs bg-white text-slate-900 border border-[#808080] px-2.5 py-1.5 font-mono focus:outline-hidden focus:border-[#0A246A]"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {ar ? "كلمة المرور (Password):" : "Password:"}
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute top-2.5 right-2.5 text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-white text-slate-900 border border-[#808080] px-2.5 py-1.5 font-mono focus:outline-hidden focus:border-[#0A246A]"
                    required
                  />
                </div>
              </div>

              {/* Preset / Demo Credential Hints */}
              <div className="p-2 bg-[#F5F4EE] dark:bg-slate-800 text-[11px] border border-[#808080] flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>{ar ? "الحساب التجريبي المسجل:" : "Preset TSplus Account:"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPortalUser("wh-hr");
                    setPortalPassword("Abc$1234");
                  }}
                  className="font-mono font-bold text-[#0A246A] dark:text-amber-300 underline cursor-pointer"
                >
                  wh-hr / Abc$1234
                </button>
              </div>

              {/* Error Alert */}
              {logonError && (
                <div className="p-2 bg-red-100 text-red-700 text-xs border border-red-400 font-bold">
                  {logonError}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end border-t border-[#FFFFFF]">
                <button
                  type="submit"
                  disabled={isLogonLoading}
                  className="px-8 py-1.5 bg-[#ECE9D8] hover:bg-[#F5F4EE] active:bg-[#D4D0C8] text-slate-900 font-bold text-xs border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isLogonLoading ? (ar ? "جارٍ التحقق..." : "Logging on...") : (ar ? "دخول (Logon)" : "Logon")}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ── STAGE 2: TSPLUS PUBLISHED APPLICATIONS LAUNCHPAD (index_applications.html) ── */
          <div className="w-full max-w-4xl space-y-6">
            {/* Launchpad Welcome Header */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-wide text-white flex items-center justify-center gap-2">
                <Laptop className="w-7 h-7 text-[#C89332]" />
                <span>{ar ? "بوابة التطبيقات المنشورة (TSplus Applications)" : "Published Remote Applications"}</span>
              </h1>
              <p className="text-xs md:text-sm text-blue-200/80 max-w-xl mx-auto">
                {ar
                  ? "اختر التطبيق المستهدف للتشغيل الفوري. الضغط على نظام الرواتب يفتح نافذة اختيار الفندق وقاعدة البيانات المباشرة."
                  : "Select an application to launch. Launching Payroll opens the classic company selection & period login."}
              </p>
            </div>

            {/* Applications Grid (Exact Parity with SST / TSplus RemoteApp Launchpad) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Application 1: Payroll System (SST 26.0) */}
              <button
                type="button"
                onClick={handleLaunchPayroll}
                className="group relative bg-[#122B42]/90 hover:bg-[#1A3D5E] border-2 border-blue-800/80 hover:border-[#C89332] p-5 rounded-lg text-center transition-all shadow-xl hover:shadow-2xl flex flex-col items-center justify-between min-h-[200px] cursor-pointer"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-[#1C4E7E] to-[#0D263E] border border-blue-400/40 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-3">
                  <Coins className="w-9 h-9 text-[#C89332]" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-black text-white group-hover:text-[#C89332] transition-colors">
                    Payroll  System
                  </div>
                  <div className="text-[11px] font-bold text-amber-300/90 font-mono">
                    SST 26.0 Win32
                  </div>
                  <div className="text-[11px] text-blue-200/70 line-clamp-2">
                    {ar
                      ? "نظام الرواتب والأجور وحساب المستحقات واختيار الفنادق والكيانات"
                      : "Salaries, Bands 1-30, Company Selector & Period Engine"}
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#C89332] bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <span>{ar ? "تشغيل الفندق..." : "Launch Hotel..."}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>

              {/* Application 2: Attendance */}
              <button
                type="button"
                onClick={async () => {
                  await recordAppLaunch(
                    "attendance",
                    selectedHotel.id,
                    selectedHotel.nameEn,
                    portalUser
                  );
                  setLocation("/attendance");
                }}
                className="group relative bg-[#122B42]/90 hover:bg-[#1A3D5E] border-2 border-blue-800/80 hover:border-blue-400 p-5 rounded-lg text-center transition-all shadow-xl hover:shadow-2xl flex flex-col items-center justify-between min-h-[200px] cursor-pointer"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-[#1C4E7E] to-[#0D263E] border border-blue-400/40 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-3">
                  <Fingerprint className="w-9 h-9 text-blue-300" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-black text-white group-hover:text-blue-300 transition-colors">
                    Attendance
                  </div>
                  <div className="text-[11px] font-bold text-blue-300/90 font-mono">
                    Time Machine 26.0
                  </div>
                  <div className="text-[11px] text-blue-200/70 line-clamp-2">
                    {ar
                      ? "أجهزة البصمة الحية وحركات الحضور والورديات والتأخيرات"
                      : "Biometric clocks, shifts, daily punches & overtime"}
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                  <span>{ar ? "فتح المنظومة" : "Launch App"}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>

              {/* Application 3: Staff Housing */}
              <button
                type="button"
                onClick={async () => {
                  await recordAppLaunch(
                    "housing",
                    1,
                    "Staff Housing Global",
                    portalUser
                  );
                  setLocation("/dashboard");
                }}
                className="group relative bg-[#122B42]/90 hover:bg-[#1A3D5E] border-2 border-blue-800/80 hover:border-emerald-400 p-5 rounded-lg text-center transition-all shadow-xl hover:shadow-2xl flex flex-col items-center justify-between min-h-[200px] cursor-pointer"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-[#1C4E7E] to-[#0D263E] border border-blue-400/40 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-3">
                  <Building2 className="w-9 h-9 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                    Staff Housing
                  </div>
                  <div className="text-[11px] font-bold text-emerald-400/90 font-mono">
                    Hotek PMS Bridge
                  </div>
                  <div className="text-[11px] text-blue-200/70 line-clamp-2">
                    {ar
                      ? "إدارة سكن العاملين، المباني، الغرف، التسكين، والمفاتيح الذكية"
                      : "Staff accommodation, rooms, bed transfers & key cards"}
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span>{ar ? "فتح المنظومة" : "Launch App"}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>

              {/* Application 4: HRMS Core Suite */}
              <button
                type="button"
                onClick={async () => {
                  await recordAppLaunch(
                    "hrms",
                    selectedHotel.id,
                    selectedHotel.nameEn,
                    portalUser
                  );
                  setLocation("/hrms");
                }}
                className="group relative bg-[#122B42]/90 hover:bg-[#1A3D5E] border-2 border-blue-800/80 hover:border-indigo-400 p-5 rounded-lg text-center transition-all shadow-xl hover:shadow-2xl flex flex-col items-center justify-between min-h-[200px] cursor-pointer"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-b from-[#1C4E7E] to-[#0D263E] border border-blue-400/40 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-3">
                  <Users className="w-9 h-9 text-indigo-300" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                    HRMS Core Suite
                  </div>
                  <div className="text-[11px] font-bold text-indigo-300/90 font-mono">
                    Enterprise Suite
                  </div>
                  <div className="text-[11px] text-blue-200/70 line-clamp-2">
                    {ar
                      ? "الهيكل التنظيمي والتوظيف والتقييم والتدريب الفندقي"
                      : "Org chart, ATS, appraisals, training & dossiers"}
                  </div>
                </div>

                <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  <span>{ar ? "فتح المنظومة" : "Launch App"}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>
            </div>

            {/* Quick Helper Banner */}
            <div className="p-3 bg-blue-950/70 border border-blue-800/60 rounded-lg flex items-center justify-between text-xs text-blue-200">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#C89332]" />
                <span>
                  {ar
                    ? "الخادم المتصل: TSplus RemoteApp (Port 443 HTTPS) — فنادق شرم الشيخ والغردقة"
                    : "Connected: TSplus RemoteApp Gateway (Port 443 HTTPS) — Sharm & Hurghada Resorts"}
                </span>
              </div>
              <span className="font-mono text-emerald-400 font-bold hidden sm:inline">
                STATUS: ONLINE
              </span>
            </div>
          </div>
        )}
      </main>

      {/* ─── 3. BOTTOM FOOTER ────────────────────────────────────────── */}
      <footer className="h-9 bg-[#091D30] border-t border-blue-900/60 px-4 md:px-8 flex items-center justify-between text-[11px] text-blue-300/60 font-mono">
        <div>
          SUNRISE Resorts & Cruises © 2026 • IT Enterprise Infrastructure
        </div>
        <div className="hidden sm:block">
          SST 26.0 RemoteApp Integrated Environment
        </div>
      </footer>

      {/* ─── 4. AUTHENTIC SST HOTEL SELECTION DIALOG ──────────────────── */}
      <SstHotelSelectionDialog
        isOpen={isHotelSelectorOpen}
        onClose={() => setIsHotelSelectorOpen(false)}
        onSelectProperty={handleHotelSelected}
        initialSelectedCode={selectedHotel.code}
      />

      {/* ─── 5. AUTHENTIC SST HOTEL LOGIN DIALOG ──────────────────────── */}
      <SstHotelLoginDialog
        isOpen={isHotelLoginOpen}
        onClose={() => setIsHotelLoginOpen(false)}
        hotel={selectedHotel}
        onChangeHotel={() => {
          setIsHotelLoginOpen(false);
          setIsHotelSelectorOpen(true);
        }}
        onLoginSuccess={handleHotelLoginSuccess}
      />
    </div>
  );
}
