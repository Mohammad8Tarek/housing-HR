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
  Sparkles
} from "lucide-react";

interface HrSuiteLayoutProps {
  children: React.ReactNode;
  activeModule?: "hrms" | "payroll" | "attendance";
}

export function HrSuiteLayout({ children, activeModule }: HrSuiteLayoutProps) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const { propertySlug, properties, activePropertyId, setActivePropertyId } = useProperty();
  const { hrUser, logout: hrLogout } = useHrAuth();
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

  const handleLogout = () => {
    hrLogout();
    if (auth.isAuthenticated) auth.logout();
  };

  // Grouped Navigation for the Enterprise HRMS, Payroll & Attendance Suite
  const navGroups = [
    {
      title: ar ? "الموارد البشرية والكفاءات" : "Core HR & Master Data",
      items: [
        {
          label: ar ? "دليل الموظفين المركزي" : "Employee Master",
          icon: Users,
          href: "/hrms",
          tab: "employees",
          badge: null,
        },
        {
          label: ar ? "الهيكل ومراكز التكلفة" : "Org & Cost Centers",
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
    {
      title: ar ? "المرتبات والمستحقات" : "Payroll & Finance",
      items: [
        {
          label: ar ? "مسير الرواتب والاستحقاقات" : "Payroll Processing",
          icon: DollarSign,
          href: "/payroll",
          tab: "runs",
          badge: ar ? "شهري" : "Monthly",
        },
        {
          label: ar ? "السلف والجزاءات وWPS" : "Advances, Loans & WPS",
          icon: CreditCard,
          href: "/payroll?tab=loans",
          tab: "loans",
          badge: null,
        },
      ],
    },
    {
      title: ar ? "الحضور وأجهزة البصمة" : "Biometrics & Attendance",
      items: [
        {
          label: ar ? "تفريغ البصمة وجدول الورديات" : "Biometrics & Roster",
          icon: Fingerprint,
          href: "/attendance",
          tab: "roster",
          badge: ar ? "لحظي" : "Sync",
        },
        {
          label: ar ? "إجازات الموظفين والأرصدة" : "Leaves & Balances",
          icon: Calendar,
          href: "/attendance?tab=leaves",
          tab: "leaves",
          badge: null,
        },
      ],
    },
  ];

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
      {/* ─── 1. Top Enterprise Header ─────────────────────────────────── */}
      <header className="border-b bg-white sticky top-0 z-40 px-4 sm:px-6 h-14 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
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
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#0f2942] tracking-wider">SUNRISE</span>
                  <span className="text-[10px] font-bold text-[#c89332] bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 rounded">
                    People Suite
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-medium">
                  {ar ? "منظومة العمليات الفندقية والموارد البشرية" : "Enterprise Workforce & HR Operations"}
                </div>
              </div>
            </div>
          </Link>

          <div className="hidden md:block h-5 w-px bg-slate-200 mx-1"></div>

          {/* Quick Switch to Staff Housing */}
          <Link href={`/${propertySlug || "all"}/dashboard`}>
            <button className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/80 hover:bg-blue-100 text-[#0f2942] text-xs font-semibold transition-all border border-blue-200/60 cursor-pointer">
              <Home className="w-3.5 h-3.5 text-blue-600" />
              <span>{ar ? "سكن العاملين" : "Staff Housing"}</span>
            </button>
          </Link>

          {/* Central Apps Switcher */}
          <Link href="/apps">
            <button className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer">
              <Layers className="w-3.5 h-3.5 text-[#c89332]" />
              <span>{ar ? "بوابة الأنظمة" : "Launcher"}</span>
            </button>
          </Link>
        </div>

        {/* Right Action Icons: Property Picker, Language Toggle, User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Hotel Property Selector */}
          {properties.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs">
              <Hotel className="w-3.5 h-3.5 text-[#c89332]" />
              <select
                value={activePropertyId || ""}
                onChange={(e) => setActivePropertyId(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-700 text-xs focus:outline-hidden cursor-pointer"
                aria-label="Select Hotel"
              >
                {properties.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {ar ? p.nameAr || p.name : p.nameEn || p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          <div className="h-4 w-px bg-slate-200"></div>

          {/* User Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0f2942] text-[#c89332] font-black flex items-center justify-center text-xs shadow-2xs">
              {displayUser?.username?.substring(0, 2).toUpperCase() || "HR"}
            </div>
            <div className="hidden sm:block text-start">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {displayUser?.fullName || displayUser?.username}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {displayUser?.role?.replace("_", " ")}
              </div>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title={ar ? "تسجيل الخروج" : "Logout"}
          >
            <LogOut className="w-3.5 h-3.5" />
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
          {/* Sidebar Top: Collapse Toggle */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            {!isCollapsed && (
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                {ar ? "لوحة الإبحار الفندقي" : "HR Navigation"}
              </span>
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
                          // If current page is same, trigger URL replace smoothly
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
                <span className="font-semibold">{ar ? "النظام متصل لحظياً" : "Suite Connected"}</span>
                <span className="ms-auto font-mono text-[9px] text-slate-400">v2026.4</span>
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
