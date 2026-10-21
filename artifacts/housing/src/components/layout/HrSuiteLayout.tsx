import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useProperty } from "@/context/PropertyContext";
import { useHrAuth } from "@/context/HrAuthContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  FileText,
  Sun,
  Moon,
  Laptop
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
  const { theme, setTheme } = useTheme();

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
    <div className="flex h-screen h-[100dvh] w-full bg-background text-foreground overflow-hidden font-sans" dir={ar ? "rtl" : "ltr"}>
      {/* ─── 1. Left Sidebar: Interactive Sunrise Housing Architecture ────────── */}
      <aside
        className={`hidden md:flex flex-col bg-sidebar backdrop-blur-xl text-sidebar-foreground border-e border-sidebar-border transition-all duration-300 shrink-0 z-30 select-none shadow-[4px_0_24px_-10px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_24px_-10px_rgba(0,0,0,0.5)] ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 flex flex-col items-center gap-2.5 border-b border-sidebar-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />
          <Link href="/apps">
            <div className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <span className="font-serif font-black text-xl text-primary-foreground">S</span>
              </div>
              {!isCollapsed && (
                <div className="text-center">
                  <span className="text-base font-extrabold tracking-tight leading-none block text-sidebar-foreground">
                    SUNRISE
                  </span>
                  <span className="text-[10px] font-semibold text-primary tracking-widest uppercase mt-1 block">
                    {currentDomain === "payroll" ? (ar ? "استوديو الرواتب" : "Payroll Studio") :
                     currentDomain === "attendance" ? (ar ? "الحضور والبصمة" : "Attendance Suite") : (ar ? "شؤون العاملين" : "Core HRMS")}
                  </span>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Sidebar Navigation Items with Interactive Motion Graphics */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 flex flex-col gap-3 no-scrollbar">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest px-3 py-1">
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                        active
                          ? "bg-gradient-to-r from-primary to-amber-600 text-white font-bold shadow-md shadow-primary/25 scale-[1.02]"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:scale-[1.01]"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${active ? "bg-white/20 text-white" : "text-sidebar-foreground/70"}`}>
                        <Icon className="h-4 w-4 flex-shrink-0" />
                      </div>
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-start font-medium">{item.label}</span>
                      )}
                      {!isCollapsed && active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                      )}
                      {!isCollapsed && item.badge && !active && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground/80">
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

        {/* Sidebar Footer: System Status & Collapse Toggle */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/20 flex items-center justify-between">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2 text-[10px] text-sidebar-foreground/70">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold">
                  {currentDomain === "payroll" ? (ar ? "قاعدة الرواتب متصلة" : "Payroll DB Online") :
                   currentDomain === "attendance" ? (ar ? "سيرفر البصمة متصل" : "Biometrics Online") : (ar ? "HRMS متصل" : "HRMS Online")}
                </span>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors"
                title={ar ? "طي القائمة" : "Collapse"}
              >
                {collapseIcon}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex justify-center p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors"
              title={ar ? "توسيع القائمة" : "Expand"}
            >
              {collapseIcon}
            </button>
          )}
        </div>
      </aside>

      {/* ─── 2. Main Content Wrapper: Topbar + Page View ─────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header: Matching Sunrise Housing Style */}
        <header className="sticky top-0 z-40 h-14 border-b border-border bg-card/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Toggle Navigation"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Active Application Isolated Identity Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-xl border border-primary/20 shadow-2xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                {currentDomain === "payroll" ? (
                  <>
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    <span>{ar ? "استوديو الرواتب والأجور (Payroll Studio)" : "Payroll & Compensation Studio"}</span>
                  </>
                ) : currentDomain === "attendance" ? (
                  <>
                    <Fingerprint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{ar ? "منظومة الحضور والانصراف والبصمة (Attendance)" : "Attendance & Biometrics Suite"}</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>{ar ? "الموارد البشرية وشؤون العاملين (Core HRMS)" : "Core HRMS & Talent Suite"}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Icons: Property Scope, Theme Toggle, Language Toggle, User, Sign Out */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Property Scope Locked Vault Indicator */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-muted/80 dark:bg-card text-foreground border border-border px-2.5 sm:px-3 py-1.5 rounded-xl text-xs shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
              <div className="flex items-center gap-1.5 font-bold">
                <span className="truncate max-w-[100px] sm:max-w-[180px]">
                  {ar ? propertyScope?.nameAr : propertyScope?.nameEn}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 h-4 ${
                    propertyScope?.category === "casuals"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                  }`}
                >
                  {propertyScope?.code}
                </Badge>
              </div>
            </div>

            {/* Theme Toggle (Light / Dark / System) Matching AppLayout */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Theme"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>{ar ? "فاتح (الأبيض)" : "Light"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <span>{ar ? "داكن (Dark)" : "Dark"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
                  <Laptop className="h-4 w-4 text-muted-foreground" />
                  <span>{ar ? "تلقائي (النظام)" : "System"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(ar ? "en" : "ar")}
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg h-8 px-2 gap-1"
            >
              <Languages className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold">{ar ? "EN" : "عربي"}</span>
            </Button>

            <div className="h-4 w-px bg-border hidden sm:block"></div>

            {/* User Badge */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-black border border-primary/20 flex items-center justify-center text-xs shadow-2xs">
                {displayUser?.username?.substring(0, 2).toUpperCase() || "HR"}
              </div>
              <div className="hidden md:block text-start">
                <div className="text-xs font-bold text-foreground leading-tight">
                  {displayUser?.fullName || displayUser?.username}
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {displayUser?.role?.replace("_", " ")}
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold gap-1.5 rounded-xl h-8 px-3 shadow-2xs cursor-pointer"
              title={ar ? "تسجيل الخروج والعودة لبوابة التطبيقات" : "Sign Out & Return to Launcher"}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{ar ? "خروج" : "Sign Out"}</span>
            </Button>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsMobileOpen(false)}></div>
            <div className="relative w-72 bg-sidebar border-e border-sidebar-border text-sidebar-foreground h-full flex flex-col p-4 shadow-2xl z-10" dir={ar ? "rtl" : "ltr"}>
              <div className="flex items-center justify-between pb-3 border-b border-sidebar-border">
                <span className="font-bold text-sidebar-foreground text-sm">{ar ? "القائمة المركزية" : "Menu"}</span>
                <button onClick={() => setIsMobileOpen(false)} className="p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-3 space-y-4 no-scrollbar">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <div className="text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-widest px-2">
                      {group.title}
                    </div>
                    {group.items.map((item, iIdx) => {
                      const active = isItemActive(item.href, item.tab);
                      const Icon = item.icon;
                      return (
                        <Link key={iIdx} href={item.href}>
                          <button
                            onClick={() => setIsMobileOpen(false)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                              active ? "bg-gradient-to-r from-primary to-amber-600 text-white font-bold" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${active ? "text-white" : "text-sidebar-foreground/70"}`} />
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
        <main className="flex-1 overflow-y-auto bg-background text-foreground">
          {children}
        </main>
      </div>
    </div>
  );
}

export default HrSuiteLayout;

