import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useProperty } from "@/context/PropertyContext";
import { useHrAuth } from "@/context/HrAuthContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  HeartPulse,
  DollarSign,
  Fingerprint,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Languages,
  Hotel,
  ShieldCheck,
  Home,
  Menu,
  X,
  CreditCard,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Lock,
  Receipt,
  Bus,
  ArrowRightLeft,
  Percent,
  Calculator,
  FileText
} from "lucide-react";
import { recordAppExit } from "@/lib/app-session";

interface HrSuiteLayoutProps {
  children: React.ReactNode;
  activeModule?: "hrms" | "payroll" | "attendance";
}

export function HrSuiteLayout({ children, activeModule }: HrSuiteLayoutProps) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const { propertySlug, properties, activePropertyId, setActivePropertyId } = useProperty();
  const { hrUser, propertyScope, logout: hrLogout } = useHrAuth();
  const auth = useAuth();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("hr_sidebar_collapsed") === "true";
  });
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("hr_sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const displayUser = hrUser || (auth.user ? {
    username: auth.user.username,
    fullName: auth.user.fullName || auth.user.username,
    role: auth.user.isSystemAdmin ? "super_admin" : "admin",
  } : null);

  const handleLogout = async () => {
    await recordAppExit();
    hrLogout();
    if (auth.isAuthenticated) auth.logout();
    setLocation("/apps");
  };

  // Determine current active domain
  const currentDomain: "payroll" | "attendance" | "hrms" = 
    activeModule ||
    (location.startsWith("/payroll") ? "payroll" :
     location.startsWith("/attendance") ? "attendance" : "hrms");

  // 1. DEDICATED PAYROLL STUDIO NAVIGATION (Exact SST 26.0 Legacy Architecture)
  const payrollNavGroups = [
    {
      title: ar ? "1. التعريفات الأساسية (Definitions)" : "1. Basic Definitions",
      items: [
        {
          label: ar ? "بنود المرتبات والبدلات (30 بند)" : "Salary Bands & Elements",
          icon: Receipt,
          href: "/payroll?tab=bands",
          tab: "bands",
          badge: "SST 1..30",
        },
        {
          label: ar ? "مراكز التكلفة والتوجيه المحاسبي" : "Cost Centers & GL Accounts",
          icon: Building2,
          href: "/payroll?tab=cost-centers",
          tab: "cost-centers",
          badge: null,
        },
      ],
    },
    {
      title: ar ? "2. الوظائف والعمليات (Functions)" : "2. Functions & Operations",
      items: [
        {
          label: ar ? "بيانات رواتب الموظفين" : "Employee Master & Salaries",
          icon: Users,
          href: "/payroll?tab=employees",
          tab: "employees",
          badge: null,
        },
        {
          label: ar ? "الحركات الشهرية المتغيرة" : "Monthly Transactions",
          icon: Receipt,
          href: "/payroll?tab=transactions",
          tab: "transactions",
          badge: ar ? "متغيرات" : "Variable",
        },
        {
          label: ar ? "السلف والأقساط الشهرية" : "Staff Loans & Advances",
          icon: CreditCard,
          href: "/payroll?tab=loans",
          tab: "loans",
          badge: null,
        },
        {
          label: ar ? "الجزاءات والخصومات المعتمدة" : "Disciplinary Penalties",
          icon: ShieldCheck,
          href: "/payroll?tab=penalties",
          tab: "penalties",
          badge: ar ? "قانون 12" : "Law 12",
        },
        {
          label: ar ? "أتوبيس العاملين - رحلات القاهرة" : "Staff Bus Travel Manifest",
          icon: Bus,
          href: "/payroll?tab=bus",
          tab: "bus",
          badge: ar ? "سفر" : "Travel",
        },
      ],
    },
    {
      title: ar ? "3. إقفال الفترة والاحتساب (End Period)" : "3. End Period & Runs",
      items: [
        {
          label: ar ? "مسير الرواتب الشهرية والاحتساب" : "Payroll Runs & Calculation",
          icon: Calculator,
          href: "/payroll?tab=runs",
          tab: "runs",
          badge: ar ? "شهري" : "Monthly",
        },
        {
          label: ar ? "توزيع نسبة الـ 12% خدمة (85/15)" : "12% Service Charge Distribution",
          icon: Percent,
          href: "/payroll?tab=service-charge",
          tab: "service-charge",
          badge: "85% / 15%",
        },
        {
          label: ar ? "شيتات البنوك WPS وقيود الـ GL" : "Bank WPS & GL Vouchers",
          icon: FileSpreadsheet,
          href: "/payroll?tab=wps",
          tab: "wps",
          badge: "WPS",
        },
      ],
    },
    {
      title: ar ? "4. التقارير والأدوات الخاصة (Tools)" : "4. Reports & Special Tools",
      items: [
        {
          label: ar ? "دليل تقارير الرواتب الـ 20" : "20 Reports Catalog Tree",
          icon: FileText,
          href: "/payroll?tab=reports",
          tab: "reports",
          badge: "20 Suites",
        },
        {
          label: ar ? "ترحيل أرصدة الإجازات السنوي" : "Yearly Vacations Rollover",
          icon: ArrowRightLeft,
          href: "/payroll?tab=rollover",
          tab: "rollover",
          badge: "4 Pools",
        },
      ],
    },
  ];

  // 2. DEDICATED ATTENDANCE NAVIGATION (Time Machine & Biometrics Architecture)
  const attendanceNavGroups = [
    {
      title: ar ? "ماكينة الحضور وتفريغ البصمة" : "Time Machine & Telemetry",
      items: [
        {
          label: ar ? "تفريغ البصمة المباشر" : "Live Biometric Punches",
          icon: Fingerprint,
          href: "/attendance?tab=roster",
          tab: "roster",
          badge: ar ? "لحظي" : "Live",
        },
        {
          label: ar ? "جدول الورديات والشفتات" : "Shift Roster Matrix",
          icon: Clock,
          href: "/attendance?tab=roster",
          tab: "roster",
          badge: null,
        },
      ],
    },
    {
      title: ar ? "إجازات الموظفين والأرصدة" : "Leaves & Exceptions",
      items: [
        {
          label: ar ? "طلبات وأرصدة الإجازات" : "Leaves & Balances",
          icon: Calendar,
          href: "/attendance?tab=leaves",
          tab: "leaves",
          badge: null,
        },
        {
          label: ar ? "إشعارات العودة من الإجازة" : "Return from Leave Notices",
          icon: Sparkles,
          href: "/attendance?tab=leaves",
          tab: "leaves",
          badge: ar ? "إشعار عودة" : "Return",
        },
      ],
    },
  ];

  // 3. DEDICATED HRMS NAVIGATION (Core Master Data & Talent Architecture)
  const hrmsNavGroups = [
    {
      title: ar ? "الموارد البشرية والشؤون الإدارية" : "Core HR & Master Data",
      items: [
        {
          label: ar ? "دليل الموظفين المركزي" : "Employee Master",
          icon: Users,
          href: "/hrms?tab=employees",
          tab: "employees",
          badge: null,
        },
        {
          label: ar ? "الهيكل الإداري ومراكز التكلفة" : "Org Hierarchy & Centers",
          icon: Building2,
          href: "/hrms?tab=org",
          tab: "org",
          badge: null,
        },
      ],
    },
    {
      title: ar ? "التوظيف والتطوير المهني" : "Talent & Development",
      items: [
        {
          label: ar ? "التوظيف واستقطاب الكفاءات" : "Recruitment & ATS",
          icon: Briefcase,
          href: "/hrms?tab=recruitment",
          tab: "recruitment",
          badge: ar ? "مباشر" : "Live",
        },
        {
          label: ar ? "التدريب وتقييم الأداء" : "Training & Appraisals",
          icon: GraduationCap,
          href: "/hrms?tab=learning",
          tab: "learning",
          badge: null,
        },
        {
          label: ar ? "الرعاية والخدمات الفندقية" : "Hospitality Welfare",
          icon: HeartPulse,
          href: "/hrms?tab=services",
          tab: "services",
          badge: null,
        },
      ],
    },
  ];

  // Select isolated navigation group based strictly on current domain
  const navGroups = 
    currentDomain === "payroll" ? payrollNavGroups :
    currentDomain === "attendance" ? attendanceNavGroups : hrmsNavGroups;

  const currentTab = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null;

  const isItemActive = (href: string, tab?: string) => {
    const basePath = href.split("?")[0];
    const pathMatches = location === basePath;
    if (!pathMatches) return false;
    if (tab && currentTab) {
      return currentTab === tab;
    }
    if (!currentTab && (!tab || tab === "employees" || tab === "runs" || tab === "roster")) {
      return true;
    }
    return false;
  };

  const collapseIcon = isCollapsed 
    ? (ar ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)
    : (ar ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col" dir={ar ? "rtl" : "ltr"}>
      {/* ─── 1. Top Enterprise Header & Standalone System Switcher ─────── */}
      <header className="border-b bg-white sticky top-0 z-40 px-3 sm:px-6 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo & Name */}
          <Link href="/apps">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#0f2942] text-[#c89332] flex items-center justify-center font-black font-serif text-sm shadow-xs">
                S
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#0f2942] tracking-wider">SUNRISE</span>
                  <span className="text-[10px] font-bold text-[#c89332] bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 rounded">
                    Enterprise Suite
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <div className="hidden md:block h-6 w-px bg-slate-200 mx-1"></div>

          {/* ─── ACTIVE APPLICATION ISOLATED IDENTITY BADGE ───────────────────────── */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              {currentDomain === "payroll" ? (
                <>
                  <DollarSign className="w-3.5 h-3.5 text-[#c89332]" />
                  <span>{ar ? "استوديو الرواتب والأجور (Payroll Studio)" : "Payroll & Compensation Studio"}</span>
                </>
              ) : currentDomain === "attendance" ? (
                <>
                  <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{ar ? "منظومة الحضور والانصراف والبصمة (Attendance)" : "Attendance & Biometrics Suite"}</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{ar ? "الموارد البشرية وشؤون العاملين (Core HRMS)" : "Core HRMS & Talent Suite"}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Icons: Property Picker, Language Toggle, User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Property Scope Locked Vault Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0d1320] text-[#dde2f5] border border-[#dfba73]/40 px-2 sm:px-3 py-1 rounded-xl text-xs shadow-xs">
            <Lock className="w-3.5 h-3.5 text-[#dfba73] shrink-0" />
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-white max-w-[100px] truncate sm:max-w-[180px]">
                {ar ? propertyScope?.nameAr : propertyScope?.nameEn}
              </span>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 h-4 ${
                  propertyScope?.category === "casuals"
                    ? "bg-amber-950/40 text-amber-300 border-amber-500/40"
                    : "bg-blue-950/40 text-blue-300 border-blue-500/40"
                }`}
              >
                {propertyScope?.code}
              </Badge>
            </div>
          </div>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="text-xs text-slate-600 hover:text-[#0f2942] hover:bg-slate-100 rounded-lg h-8 px-2 gap-1"
          >
            <Languages className="w-3.5 h-3.5 text-[#c89332]" />
            <span className="font-semibold">{ar ? "EN" : "عربي"}</span>
          </Button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* User Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0f2942] text-[#c89332] font-black flex items-center justify-center text-xs shadow-2xs">
              {displayUser?.username?.substring(0, 2).toUpperCase() || "HR"}
            </div>
            <div className="hidden md:block text-start">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {displayUser?.fullName || displayUser?.username}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {displayUser?.role?.replace("_", " ")}
              </div>
            </div>
          </div>

          {/* Prominent Sign Out Button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40 text-xs font-bold gap-1.5 rounded-xl h-8 px-3 shadow-2xs cursor-pointer"
            title={ar ? "تسجيل الخروج والعودة لبوابة التطبيقات" : "Sign Out & Return to Launcher"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{ar ? "تسجيل خروج" : "Sign Out"}</span>
          </Button>
        </div>
      </header>

      {/* ─── 2. Main Layout with Side Navigation Bar ─────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR (Desktop) */}
        <aside
          className={`hidden md:flex flex-col bg-white border-e border-slate-200 transition-all duration-200 shrink-0 z-30 select-none ${
            isCollapsed ? "w-16" : "w-64"
          }`}
        >
          {/* Sidebar Top: Collapse Toggle & Active Module Indicator */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c89332]"></span>
                <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                  {currentDomain === "payroll" ? (ar ? "استوديو الرواتب SST" : "Payroll Studio") :
                   currentDomain === "attendance" ? (ar ? "الحضور والبصمة" : "Attendance") : (ar ? "شؤون العاملين" : "Core HRMS")}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-md text-slate-400 hover:text-[#0f2942] hover:bg-slate-100 ms-auto cursor-pointer"
              title={isCollapsed ? (ar ? "توسيع" : "Expand") : (ar ? "طي" : "Collapse")}
            >
              {collapseIcon}
            </button>
          </div>

          {/* Sidebar Navigation Items */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-2 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </div>
                )}
                {group.items.map((item, iIdx) => {
                  const active = isItemActive(item.href, item.tab);
                  const Icon = item.icon;
                  return (
                    <Link key={iIdx} href={item.href}>
                      <button
                        onClick={() => {
                          if (item.href.includes("?tab=")) {
                            const newTab = item.tab;
                            const searchParams = new URLSearchParams(window.location.search);
                            searchParams.set("tab", newTab);
                            window.history.replaceState(null, "", `${window.location.pathname}?${searchParams.toString()}`);
                            window.dispatchEvent(new Event("popstate"));
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? "bg-[#0f2942] text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-50 hover:text-[#0f2942]"
                        } ${isCollapsed ? "justify-center px-0" : ""}`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#c89332]" : "text-slate-400"}`} />
                        {!isCollapsed && (
                          <span className="truncate flex-1 text-start">{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <Badge
                            className={`text-[9px] px-1.5 py-0 h-4 ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-amber-100 text-amber-900 border border-amber-200"
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer: System Status */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/60">
            {!isCollapsed ? (
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">
                  {currentDomain === "payroll" ? (ar ? "قاعدة بيانات الرواتب متصلة" : "Payroll DB Online") :
                   currentDomain === "attendance" ? (ar ? "سيرفر البصمة متصل" : "Biometrics Online") : (ar ? "HRMS متصل لحظياً" : "HRMS Online")}
                </span>
                <span className="ms-auto font-mono text-[9px] text-slate-400">SST 26.0</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
            )}
          </div>
        </aside>

        {/* MOBILE DRAWER */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-black/40" onClick={() => setIsMobileOpen(false)}></div>
            <div className="relative w-72 bg-white h-full flex flex-col p-4 shadow-xl z-10" dir={ar ? "rtl" : "ltr"}>
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="font-bold text-[#0f2942] text-sm">{ar ? "القائمة المركزية" : "Menu"}</span>
                <button onClick={() => setIsMobileOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
                      {group.title}
                    </div>
                    {group.items.map((item, iIdx) => {
                      const active = isItemActive(item.href, item.tab);
                      const Icon = item.icon;
                      return (
                        <Link key={iIdx} href={item.href}>
                          <button
                            onClick={() => setIsMobileOpen(false)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold ${
                              active ? "bg-[#0f2942] text-white" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? "text-[#c89332]" : "text-slate-400"}`} />
                            <span className="text-start">{item.label}</span>
                          </button>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. Content View Area ───────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default HrSuiteLayout;

