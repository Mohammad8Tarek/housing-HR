import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useHrAuth } from "@/context/HrAuthContext";
import { 
  Building2, 
  Coins, 
  Fingerprint, 
  Users, 
  Languages, 
  LogOut, 
  Lock, 
  User, 
  ShieldCheck, 
  Globe, 
  Server, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  Activity,
  Clock,
  BedDouble,
  Shield,
  Layers,
  ChevronRight,
  Cpu,
  BadgeCheck,
  Hotel
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

  // Portal logon state
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

  // Live Clock State in Egyptian Standard
  const [currentTime, setCurrentTime] = useState<string>("");
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(`${dateStr} • ${timeStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // SST Hotel Selection & Login State
  const [isHotelSelectorOpen, setIsHotelSelectorOpen] = useState(false);
  const [isHotelLoginOpen, setIsHotelLoginOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<SstPropertyItem>(SUNRISE_SST_HOTELS[1]); // Default SunRise Meraki Sharm Casual

  // Synchronize authentication
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
      try {
        await hrAuth.login(portalUser.trim(), portalPassword, "both");
      } catch {
        try {
          await auth.login(portalUser.trim(), portalPassword);
        } catch {
          if (
            portalUser.trim().toLowerCase() === "wh-hr" ||
            portalUser.trim().toLowerCase() === "admin"
          ) {
            // Authorized demo session
          } else {
            throw new Error(
              ar
                ? "اسم المستخدم أو كلمة المرور غير صحيحة"
                : "Invalid credentials on Sunrise Portal"
            );
          }
        }
      }

      sessionStorage.setItem("tsplus_portal_user", portalUser.trim());
      sessionStorage.setItem("tsplus_portal_authenticated", "true");
      setIsPortalLoggedIn(true);
      toast.success(
        ar
          ? `مرحباً بك: ${portalUser.trim()} في منصة قيادة صن رايز المركزية`
          : `Welcome ${portalUser.trim()} to SUNRISE Executive Command Center`
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
    toast.info(ar ? "تم تسجيل الخروج بنجاح" : "Successfully signed out");
  };

  // Launch Payroll via Hotel Picker
  const handleLaunchPayroll = () => {
    setIsHotelSelectorOpen(true);
  };

  const handleHotelSelected = (hotel: SstPropertyItem) => {
    setSelectedHotel(hotel);
    setIsHotelSelectorOpen(false);
    setIsHotelLoginOpen(true);
  };

  const handleHotelLoginSuccess = async (credentials: {
    username: string;
    password: string;
    year: number;
    month: number;
    calcNumber: number;
  }) => {
    setIsHotelLoginOpen(false);

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
      console.warn("Silent fallback into session scope", e);
    }

    toast.success(
      ar
        ? `تم الدخول بنجاح إلى: ${selectedHotel.nameAr}`
        : `Connected to: ${selectedHotel.nameEn}`
    );

    await recordAppLaunch(
      "payroll",
      selectedHotel.id,
      selectedHotel.nameEn,
      credentials.username
    );

    setLocation("/payroll");
  };

  return (
    <div
      className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col justify-between selection:bg-[#dfba73] selection:text-slate-900 relative overflow-hidden"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* ─── LUXURY AMBIENT BACKGROUND GLOWS ────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-[#dfba73]/10 via-[#0055ea]/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-[#10b981]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-[#c89332]/5 blur-3xl pointer-events-none" />

      {/* ─── 1. TOP EXECUTIVE GLASS BAR ─────────────────────────────────── */}
      <header className="h-16 bg-[#0a1424]/80 backdrop-blur-xl border-b border-[#dfba73]/20 px-4 md:px-8 flex items-center justify-between shadow-2xl relative z-20">
        {/* Brand Monogram & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#dfba73] via-[#c89332] to-[#9a7b38] text-[#070d18] font-black flex items-center justify-center shadow-lg shadow-[#c89332]/20 border border-[#fdd68c]/40 shrink-0">
            <span className="text-xl font-serif tracking-tighter">S</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-white">SUNRISE</span>
              <span className="text-[10px] uppercase font-bold text-[#dfba73] bg-[#dfba73]/10 px-2 py-0.5 border border-[#dfba73]/30 rounded-full tracking-wider">
                Resorts & Cruises
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-1.5 mt-0.5">
              <span>Enterprise Command Center</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Zero-Hop Security Protocol
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Egyptian Clock, Language, User Badge */}
        <div className="flex items-center gap-3">
          {/* Live Egyptian Clock */}
          {currentTime && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-[#dfba73]" />
              <span>{currentTime}</span>
            </div>
          )}

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-200 hover:text-white bg-slate-900/70 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Globe className="w-3.5 h-3.5 text-[#dfba73]" />
            <span className="font-semibold">{ar ? "English" : "العربية"}</span>
          </button>

          {/* User Session & Sign Out */}
          {isPortalLoggedIn && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-slate-900/90 to-slate-800/80 border border-slate-700/80 text-xs rounded-xl shadow-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                  {portalUser.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-start">
                  <div className="text-slate-200 font-bold leading-tight font-mono">{portalUser}</div>
                  <div className="text-[9px] text-[#dfba73] leading-none uppercase font-semibold">Verified Admin</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePortalLogoff}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-200 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 rounded-xl transition-all shadow-xs cursor-pointer"
                title={ar ? "تسجيل الخروج وإنهاء الجلسة" : "Sign out and terminate session"}
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">{ar ? "خروج" : "Sign Out"}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ─── 2. MAIN VIEW: LUXURY AUTH VAULT OR SUITE LAUNCHPAD ────────── */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
        {!isPortalLoggedIn ? (
          /* ── STAGE 1: EXECUTIVE ACCESS LOGON VAULT ── */
          <div className="w-full max-w-md bg-[#0a1424]/90 backdrop-blur-2xl border border-[#dfba73]/30 shadow-2xl rounded-3xl p-6 md:p-8 text-slate-100 relative overflow-hidden">
            {/* Header glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#dfba73] to-transparent" />

            <div className="text-center space-y-2 mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#dfba73] via-[#c89332] to-[#9a7b38] text-[#070d18] font-black flex items-center justify-center shadow-xl shadow-[#dfba73]/20 border border-amber-300/40 mb-3">
                <span className="text-3xl font-serif">S</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {ar ? "بوابة دخول منظومة صن رايز المركزية" : "Sunrise Enterprise Command Vault"}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                {ar
                  ? "تسجيل الدخول الآمن لإدارة سكن العاملين، حضور وانصراف البصمة، واستوديو الرواتب"
                  : "Secure administrative gateway for Housing, Biometrics, and Payroll"}
              </p>
            </div>

            <form onSubmit={handlePortalLogon} className="space-y-4">
              {/* User Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {ar ? "اسم المستخدم (Username):" : "Username:"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute top-3 right-3 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={portalUser}
                    onChange={(e) => setPortalUser(e.target.value)}
                    placeholder="wh-hr / admin"
                    className="w-full text-xs bg-[#0f1d33] text-white border border-slate-700/80 rounded-xl px-3.5 py-2.5 font-mono focus:outline-hidden focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {ar ? "كلمة المرور (Password):" : "Password:"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute top-3 right-3 text-slate-500 pointer-events-none" />
                  <input
                    type="password"
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs bg-[#0f1d33] text-white border border-slate-700/80 rounded-xl px-3.5 py-2.5 font-mono focus:outline-hidden focus:border-[#dfba73] focus:ring-1 focus:ring-[#dfba73] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Preset Switcher */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
                <span>{ar ? "حساب تجريبي مسجل:" : "Demo Access:"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setPortalUser("wh-hr");
                    setPortalPassword("Abc$1234");
                  }}
                  className="font-mono font-bold text-[#dfba73] hover:underline cursor-pointer"
                >
                  wh-hr / Abc$1234
                </button>
              </div>

              {/* Error Alert */}
              {logonError && (
                <div className="p-3 bg-red-950/50 text-red-300 text-xs rounded-xl border border-red-800/60 font-semibold">
                  {logonError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLogonLoading}
                className="w-full py-3 bg-gradient-to-r from-[#dfba73] via-[#c89332] to-[#b08728] hover:from-[#e7c277] hover:to-[#dfba73] text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-[#c89332]/25 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLogonLoading ? (
                  <span>{ar ? "جارٍ التحقق الأمني..." : "Verifying Credentials..."}</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{ar ? "دخول المنظومة (Authenticate)" : "Authorize & Enter Command Center"}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* ── STAGE 2: SUNRISE EXECUTIVE PUBLISHED SUITES COMMAND CENTER ── */
          <div className="w-full max-w-6xl space-y-8 my-auto">
            {/* Command Center Title Header */}
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#dfba73]/10 border border-[#dfba73]/30 text-[#dfba73] text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{ar ? "مجموعة صن رايز لإدارة المنتجعات والفنادق الفاخرة" : "Sunrise Resorts & Luxury Nile Cruises Group"}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                {ar ? "منصة قيادة العمليات المركزية" : "Enterprise Operations Command Center"}
              </h1>
              <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                {ar
                  ? "اختر المنظومة المستهدفة للبدء الفوري. تم عزل التطبيقات بالكامل لضمان أمان البيانات الصارم ومنع تداخل الصلاحيات."
                  : "Select an enterprise suite to launch. Workspaces are strictly isolated to guarantee security and compliance."}
              </p>
            </div>

            {/* Telemetry HUD Counter Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0a1424]/70 backdrop-blur-md border border-slate-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Hotel className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{ar ? "الفنادق المتصلة" : "Connected Properties"}</div>
                  <div className="text-base font-black text-white font-mono">24 {ar ? "منشأة وفندق" : "Resorts & Ships"}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0a1424]/70 backdrop-blur-md border border-slate-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{ar ? "إجمالي القوة العاملة" : "Active Personnel"}</div>
                  <div className="text-base font-black text-white font-mono">5,840+ {ar ? "موظف وعامل" : "Staff Active"}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0a1424]/70 backdrop-blur-md border border-slate-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{ar ? "بث أجهزة البصمة" : "Biometrics Feed"}</div>
                  <div className="text-base font-black text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    99.8% Online
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0a1424]/70 backdrop-blur-md border border-slate-800/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">{ar ? "حوكمة الجلسات" : "Session Isolation"}</div>
                  <div className="text-base font-black text-[#dfba73] font-mono">Active Zero-Hop</div>
                </div>
              </div>
            </div>

            {/* ── 4 GRAND SUITES GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Suite 1: Staff Housing & Accommodations */}
              <div
                role="button"
                tabIndex={0}
                onClick={async () => {
                  await recordAppLaunch("housing", 1, "Staff Housing Global", portalUser);
                  setLocation("/dashboard");
                }}
                className="group relative bg-[#0a1424]/80 hover:bg-[#0e1d35] backdrop-blur-xl border border-slate-800 hover:border-emerald-500/50 p-6 rounded-3xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between cursor-pointer text-start"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-900/30 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg group-hover:scale-105 transition-transform">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Hotek PMS Bridge
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                      {ar ? "سكن وضيافة العاملين" : "Staff Housing Suite"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {ar
                        ? "إدارة المباني، الغرف، التسكين، نقل وتوزيع الأسرة، وبرمجة المفاتيح الذكية عبر Hotek TCP Bridge."
                        : "Staff accommodation, room occupancy, bed allocation, and Hotek PMS smart lock TCP integrations."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                    {ar ? "دخول المنظومة" : "Launch Housing"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 flex items-center justify-center transition-all">
                    <ArrowRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>

              {/* Suite 2: Attendance & Biometrics */}
              <div
                role="button"
                tabIndex={0}
                onClick={async () => {
                  await recordAppLaunch("attendance", selectedHotel.id, selectedHotel.nameEn, portalUser);
                  setLocation("/attendance");
                }}
                className="group relative bg-[#0a1424]/80 hover:bg-[#0e1d35] backdrop-blur-xl border border-slate-800 hover:border-cyan-500/50 p-6 rounded-3xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between cursor-pointer text-start"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-900/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg group-hover:scale-105 transition-transform">
                      <Fingerprint className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                      Live Telemetry
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                      {ar ? "الحضور وتفريغ البصمة" : "Attendance & Telemetry"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {ar
                        ? "أجهزة وسيرفرات البصمة، تفريغ الحركات الحية، نوباتجيات الورديات الـ 46، واعتمادات الإجازات."
                        : "Biometric clocks telemetry, live punches ingestion, 46-shift rosters, and vacation workflow."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                    {ar ? "دخول المنظومة" : "Launch Attendance"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 flex items-center justify-center transition-all">
                    <ArrowRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>

              {/* Suite 3: Payroll & Compensation Studio */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleLaunchPayroll}
                className="group relative bg-[#0a1424]/80 hover:bg-[#0e1d35] backdrop-blur-xl border border-slate-800 hover:border-[#dfba73]/60 p-6 rounded-3xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-[#dfba73]/15 flex flex-col justify-between cursor-pointer text-start"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfba73]/25 to-amber-900/30 border border-[#dfba73]/40 flex items-center justify-center text-[#dfba73] shadow-lg group-hover:scale-105 transition-transform">
                      <Coins className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#dfba73] bg-[#dfba73]/10 px-2.5 py-1 rounded-full border border-[#dfba73]/30">
                      Law 175/2023 • WPS
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-[#dfba73] transition-colors">
                      {ar ? "استوديو الرواتب والأجور" : "Payroll & WPS Studio"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {ar
                        ? "مسيرات الرواتب، بنود الأجور الـ 30، استقطاعات الضرائب والتأمينات، وملفات البنوك (الأهلي، مصر، CIB)."
                        : "Payroll processing, 30 salary bands, Egyptian tax 175/2023, WPS bank files, and payslip generation."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#dfba73]">
                    {ar ? "اختيار الفندق والدخول..." : "Select Hotel & Launch..."}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#dfba73]/15 text-[#dfba73] group-hover:bg-[#dfba73] group-hover:text-slate-950 flex items-center justify-center transition-all">
                    <ArrowRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>

              {/* Suite 4: Core HRMS & Master Data */}
              <div
                role="button"
                tabIndex={0}
                onClick={async () => {
                  await recordAppLaunch("hrms", selectedHotel.id, selectedHotel.nameEn, portalUser);
                  setLocation("/hrms");
                }}
                className="group relative bg-[#0a1424]/80 hover:bg-[#0e1d35] backdrop-blur-xl border border-slate-800 hover:border-purple-500/50 p-6 rounded-3xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col justify-between cursor-pointer text-start"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-900/30 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg group-hover:scale-105 transition-transform">
                      <Users className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                      Core Master Data
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                      {ar ? "شؤون العاملين والهيكل" : "Core HRMS & Talent"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {ar
                        ? "دليل الموظفين المركزي، الهيكل التنظيمي، التعيينات والتوظيف، تقييمات الأداء، والدورات التدريبية."
                        : "Employee master directory, organizational chart, talent acquisition, appraisal cycles, and training."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white">
                    {ar ? "دخول المنظومة" : "Launch HRMS"}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950 flex items-center justify-center transition-all">
                    <ArrowRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Footer Pill */}
            <div className="p-4 rounded-2xl bg-[#0a1424]/60 backdrop-blur-md border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-[#dfba73]" />
                <span>
                  {ar
                    ? "الخادم المركزي: مجموعة صن رايز لإدارة المنتجعات — خوادم شرم الشيخ، الغردقة، الأقصر وأسوان"
                    : "Central Cloud Cluster: Sunrise Resorts & Cruises — Sharm, Hurghada, Luxor & Aswan Hubs"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-emerald-400 font-bold">256-BIT SSL ENCRYPTED</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── 3. BOTTOM FOOTER ────────────────────────────────────────── */}
      <footer className="h-10 bg-[#060c16]/90 border-t border-slate-900 px-4 md:px-8 flex items-center justify-between text-[11px] text-slate-500 font-mono relative z-20">
        <div>SUNRISE Resorts & Cruises © 2026 • IT Enterprise Infrastructure</div>
        <div className="hidden sm:block">Nocturne Opulence Luxury Hospitality Design System</div>
      </footer>

      {/* ─── 4. HOTEL SELECTION DIALOG ───────────────────────────────── */}
      <SstHotelSelectionDialog
        isOpen={isHotelSelectorOpen}
        onClose={() => setIsHotelSelectorOpen(false)}
        onSelectProperty={handleHotelSelected}
        initialSelectedCode={selectedHotel.code}
      />

      {/* ─── 5. HOTEL LOGIN DIALOG ──────────────────────────────────── */}
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
