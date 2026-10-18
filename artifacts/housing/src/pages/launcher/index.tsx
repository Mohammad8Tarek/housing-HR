import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useProperty } from "@/context/PropertyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { 
  Building2, 
  DollarSign, 
  Fingerprint, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  LogOut, 
  Moon, 
  Sun, 
  Languages,
  Sparkles,
  Users,
  Clock,
  ExternalLink,
  Layers,
  CheckCircle2,
  Hotel,
  Key,
  Wrench,
  Sparkle,
  FileSpreadsheet,
  Coins,
  Cpu,
  Radio,
  CalendarCheck,
  Search,
  ChevronRight,
  ChevronDown,
  Activity,
  Zap,
  Globe2,
  Lock,
  Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";

export default function SystemLauncher() {
  const { user, logout } = useAuth();
  const { propertySlug, activeProperty, activePropertyId, properties, setActivePropertyId } = useProperty();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  const ar = language === "ar";
  const slug = propertySlug || "all";
  const ArrowIcon = ar ? ArrowLeft : ArrowRight;

  // Live Digital Clock (Egyptian Standard Time)
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const formattedTime = currentTime.toLocaleTimeString(ar ? "ar-EG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedDate = formatDate(currentTime);

  const systems = [
    {
      id: "housing",
      title: ar ? "إدارة سكن العاملين" : "Staff Housing Management",
      subtitle: ar ? "منظومة تسكين النزلاء والعمليات اليومية" : "Accommodation & Operations Engine",
      description: ar
        ? "مخططات المباني، التسكين الذكي، المقيمون، الحجوزات المسبقة، الهاوس كيبنج، الصيانة والأقفال الذكية."
        : "Building layouts, smart room assignments, in-house residents, reservations, housekeeping, work orders, and Hotek PMS locks.",
      icon: Building2,
      href: `/${slug}/dashboard`,
      badge: ar ? "منظومة السكن والإعاشة" : "Accommodation Core",
      databaseName: "staff-housing",
      databaseStatus: ar ? "قاعدة بيانات معزولة بنسبة 100%" : "Isolated Housing DB",
      themeColor: "from-blue-600 via-indigo-600 to-sky-500",
      accentBorder: "hover:border-blue-500/60 dark:hover:border-blue-400/60",
      glowColor: "rgba(59, 130, 246, 0.15)",
      bgGradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
      iconBg: "bg-blue-600 text-white shadow-blue-500/25",
      btnClass: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20",
      features: [
        { icon: Hotel, text: ar ? "مخطط الغرف والأسرة" : "Rooms & Bed Layouts" },
        { icon: Users, text: ar ? "تسكين ذكي وتتبع الإشغال" : "Smart Booking & In-House" },
        { icon: Key, text: ar ? "أقفال Hotek وكروت RFID" : "Hotek Electronic Locks" },
        { icon: Wrench, text: ar ? "نظافة الغرف وبلاغات الصيانة" : "Housekeeping & Work Orders" },
      ],
      stats: [
        { label: ar ? "السعة التشغيلية" : "Capacity", value: ar ? "كاملة" : "Full" },
        { label: ar ? "الأقفال الذكية" : "Door Locks", value: "Hotek V2" },
        { label: ar ? "نوع العزل" : "Isolation", value: "Schema" },
      ],
    },
    {
      id: "payroll",
      title: ar ? "المرتبات وشؤون العاملين" : "Payroll & Statutory Compensation",
      subtitle: ar ? "مسير الرواتب والاستحقاقات البنكية WPS" : "SST Payroll, Slips & WPS Engine",
      description: ar
        ? "احتساب الرواتب للعمالة المثبتة واليومية، البدلات والاستقطاعات، السلف والجزاءات، وتصدير ملفات البنوك الرسمية."
        : "End-to-end salary processing for regular staff and casual workers, allowances, deductions, loans, penalties, and Egyptian bank WPS files.",
      icon: DollarSign,
      href: "/payroll",
      badge: ar ? "الرواتب والاستحقاقات البنكية" : "SST Financial & WPS",
      databaseName: "sunrise_payroll_attendance",
      databaseStatus: ar ? "قاعدة بيانات مالية مستقلة" : "Isolated Payroll DB",
      themeColor: "from-emerald-600 via-teal-600 to-amber-500",
      accentBorder: "hover:border-emerald-500/60 dark:hover:border-emerald-400/60",
      glowColor: "rgba(16, 185, 129, 0.15)",
      bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      iconBg: "bg-emerald-600 text-white shadow-emerald-500/25",
      btnClass: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/20",
      features: [
        { icon: Users, text: ar ? "عمالة مثبتة (Regular) وعمالة يومية (Casual)" : "Regular & Casual Workforces" },
        { icon: Coins, text: ar ? "احتساب البدلات والاستقطاعات والتأمينات" : "Allowances, Deductions & Social Ins." },
        { icon: FileSpreadsheet, text: ar ? "تصدير شيتات البنوك WPS وملفات الصرف" : "Bank WPS Export & Salary Slips" },
        { icon: ScaleIcon, text: ar ? "السلف النقدية والتحقيقات والجزاءات" : "Loans, Advances & Legal Penalties" },
      ],
      stats: [
        { label: ar ? "تصنيف العمالة" : "Staff Types", value: ar ? "مثبتين / يوميات" : "Dual-Track" },
        { label: ar ? "ملفات البنوك" : "Bank Files", value: "WPS .XLS" },
        { label: ar ? "قانون العمل" : "Compliance", value: "Egypt Lab." },
      ],
    },
    {
      id: "attendance",
      title: ar ? "الحضور والانصراف وأجهزة البصمة" : "Biometric Attendance & Telemetry",
      subtitle: ar ? "الربط اللحظي بماكينات البصمة والورديات" : "Live Reader Network & Shift Engine",
      description: ar
        ? "الربط المباشر مع أجهزة وسيرفرات البصمة، تفريغ الحركات اللحظية، الورديات، واحتساب التأخيرات وساعات الإضافي."
        : "Live TCP/IP telemetry from biometric readers, real-time punch ingestion, shift rosters, delay calculations, and overtime evaluation.",
      icon: Fingerprint,
      href: "/attendance",
      badge: ar ? "شبكة البصمة الرقمية" : "Biometric Telemetry",
      databaseName: "sunrise_payroll_attendance",
      databaseStatus: ar ? "بث فوري عبر بروتوكول البصمة" : "Live Socket Push",
      themeColor: "from-purple-600 via-violet-600 to-fuchsia-500",
      accentBorder: "hover:border-purple-500/60 dark:hover:border-purple-400/60",
      glowColor: "rgba(147, 51, 234, 0.15)",
      bgGradient: "from-purple-500/10 via-violet-500/5 to-transparent",
      iconBg: "bg-purple-600 text-white shadow-purple-500/25",
      btnClass: "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-purple-500/20",
      features: [
        { icon: Cpu, text: ar ? "ربط ماكينات ZKTeco و Suprema و Hikvision" : "TCP/IP ZKTeco & Suprema Readers" },
        { icon: Radio, text: ar ? "بث وتفريغ لحظي لحركات البصمة IN / OUT" : "Live Raw Check-in Ingestion Stream" },
        { icon: Clock, text: ar ? "جداول الورديات وسياسات فترات السماح" : "Shift Rostering & Grace Periods" },
        { icon: CalendarCheck, text: ar ? "تقييم الحضور والتأخير والإضافي للمرتبات" : "Automated Lateness & Overtime Sync" },
      ],
      stats: [
        { label: ar ? "بروتوكول الربط" : "Protocol", value: "TCP/IP 4370" },
        { label: ar ? "تزامن البصمات" : "Sync Mode", value: ar ? "فوري لحظي" : "Real-Time" },
        { label: ar ? "ربط المرتبات" : "Payroll Link", value: ar ? "مباشر" : "Integrated" },
      ],
    },
  ];

  // Filter systems by search
  const filteredSystems = systems.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q);
  });

  return (
    <div 
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-primary selection:text-white"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* Dynamic Background Glows & Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] bg-emerald-600/15 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
      </div>

      {/* Top Luxury Navbar */}
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl sticky top-0 z-50 px-6 lg:px-12 py-3.5 flex items-center justify-between shadow-2xl">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500 via-blue-500 to-purple-500 opacity-70 blur-sm group-hover:opacity-100 transition duration-500" />
            <div className="relative w-11 h-11 rounded-xl bg-slate-900 border border-white/20 flex items-center justify-center text-white shadow-xl">
              <Layers className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-300 via-white to-amber-200 bg-clip-text text-transparent">
                SUNRISE
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Enterprise Suite
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {ar ? "بوابة الأنظمة الفندقية والمؤسسية الموحدة" : "Unified Hospitality & Corporate Operations Hub"}
            </p>
          </div>
        </div>

        {/* Center: Live Egyptian Clock & System Status */}
        <div className="hidden lg:flex items-center gap-6 px-5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{formattedTime}</span>
            <span className="text-slate-500">|</span>
            <span>{formattedDate}</span>
          </div>
          <div className="h-3 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold text-[11px]">
              {ar ? "جميع الأنظمة تعمل بكفاءة" : "Systems Operational"}
            </span>
          </div>
        </div>

        {/* Right: User Profile, Hotel Switcher, Language & Logout */}
        <div className="flex items-center gap-3">
          {/* Property Selector */}
          <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-xl transition-colors">
            <Hotel className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={activePropertyId}
              onChange={(e) => setActivePropertyId(Number(e.target.value))}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100">
                  {ar ? p.displayName || p.name : p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="text-xs gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl"
          >
            <Languages className="w-4 h-4 text-amber-400" />
            <span>{ar ? "English" : "العربية"}</span>
          </Button>

          {/* User Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md">
              {user?.username?.substring(0, 2).toUpperCase() || "SU"}
            </div>
            <div className="hidden sm:block text-right rtl:text-right ltr:text-left">
              <div className="text-xs font-bold text-white leading-tight">{user?.username}</div>
              <div className="text-[10px] text-amber-400/90 font-medium">
                {user?.isSystemAdmin ? "👑 Super Admin" : "User"}
              </div>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="w-9 h-9 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
            title={ar ? "تسجيل الخروج" : "Logout"}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-12 flex flex-col justify-center relative z-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 border border-white/15 text-xs text-slate-300 backdrop-blur-md shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span className="font-semibold text-white">
              {ar ? "بوابة تشغيل الفنادق المركزية" : "Central Enterprise Operations Gateway"}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-300">
              {ar ? "بيئة عمل منفصلة وآمنة" : "Isolated DB Architecture"}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            {ar ? (
              <>
                اختر المنظومة <span className="bg-gradient-to-r from-amber-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">لبدء العمل</span>
              </>
            ) : (
              <>
                Select Enterprise <span className="bg-gradient-to-r from-amber-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">Workspace</span>
              </>
            )}
          </h1>

          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {ar
              ? "أنظمة متخصصة معزولة بالكامل تضمن كفاءة التشغيل، دقة مسير المرتبات، والربط الفوري مع أجهزة البصمة بدون أي تداخل في قواعد البيانات."
              : "Decoupled enterprise solutions engineered for maximum operational reliability, precise statutory payroll runs, and instant biometric synchronization."}
          </p>

          {/* Quick Search */}
          <div className="pt-2 max-w-md mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400 rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ar ? "ابحث عن منظومة أو موديول..." : "Search enterprise system..."}
                className="w-full bg-white/[0.05] border border-white/10 focus:border-amber-400/50 rounded-2xl py-2.5 px-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/20 backdrop-blur-xl transition-all"
              />
            </div>
          </div>
        </div>

        {/* 3 Master Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredSystems.map((sys) => {
            const Icon = sys.icon;
            const isHovered = hoveredCard === sys.id;

            return (
              <div
                key={sys.id}
                onMouseEnter={() => setHoveredCard(sys.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`relative rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-7 flex flex-col justify-between transition-all duration-500 group hover:-translate-y-2 hover:shadow-2xl ${sys.accentBorder}`}
                style={{
                  boxShadow: isHovered ? `0 20px 40px -15px ${sys.glowColor}` : undefined,
                }}
              >
                {/* Top Ambient Glow Line */}
                <div className={`absolute top-0 left-8 right-8 h-1 bg-gradient-to-r ${sys.themeColor} rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Header Information */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    {/* Icon with Glowing Gradient */}
                    <div className={`w-14 h-14 rounded-2xl ${sys.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* System Badge */}
                    <Badge variant="outline" className="border-white/15 bg-white/[0.04] text-[11px] font-semibold text-slate-300 px-2.5 py-1">
                      {sys.badge}
                    </Badge>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors duration-300">
                    {sys.title}
                  </h3>
                  <p className="text-xs font-semibold text-amber-400/90 mt-1">
                    {sys.subtitle}
                  </p>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {sys.description}
                  </p>

                  {/* Feature Highlights Grid */}
                  <div className="mt-6 space-y-2.5">
                    {sys.features.map((feat, fIdx) => {
                      const FeatIcon = feat.icon;
                      return (
                        <div 
                          key={fIdx}
                          className="flex items-center gap-2.5 text-xs text-slate-300 bg-white/[0.03] border border-white/5 p-2 rounded-xl group-hover:border-white/10 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                            <FeatIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-[11.5px] truncate">{feat.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Section: Stats & Action CTA */}
                <div className="mt-8 pt-5 border-t border-white/10 space-y-5">
                  {/* Database Isolation Status Tag */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Database className="w-3.5 h-3.5" />
                      <span>{sys.databaseName}</span>
                    </span>
                    <span className="text-slate-500 font-sans">{sys.databaseStatus}</span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setLocation(sys.href)}
                    className={`w-full py-3.5 px-5 rounded-2xl font-bold text-xs flex items-center justify-between transition-all duration-300 ${sys.btnClass} group/btn shadow-lg cursor-pointer`}
                  >
                    <span className="text-sm font-black">
                      {sys.id === "housing"
                        ? (ar ? "دخول سكن العاملين" : "Launch Housing Workspace")
                        : sys.id === "payroll"
                        ? (ar ? "دخول نظام المرتبات" : "Launch Payroll Workspace")
                        : (ar ? "دخول الحضور والبصمة" : "Launch Attendance Workspace")}
                    </span>
                    <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center group-hover/btn:translate-x-1 rtl:group-hover/btn:-translate-x-1 transition-transform">
                      <ArrowIcon className="w-4 h-4 text-white" />
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Governance Bottom Banner */}
        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {ar ? "الحماية والحوكمة الفندقية الفائقة (Enterprise Isolation)" : "Hospitality Grade Isolation & Dual-Layer RBAC"}
              </div>
              <p className="text-[11px] text-slate-400">
                {ar 
                  ? "كل قاعدة بيانات معزولة ومحمية بالكامل لضمان عدم حدوث أي تداخل في البيانات المالية أو بيانات السكن."
                  : "Strict PostgreSQL schema & database level boundaries preventing cross-contamination between HR and Housing."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 font-mono text-[11px] border border-white/10">
              PostgreSQL 18 Multi-Tenant
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-emerald-400 font-mono text-[11px] border border-emerald-500/20">
              Zero Data Loss Invariant
            </Badge>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 px-6 lg:px-12 bg-slate-950/80 backdrop-blur-md text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} <span className="text-slate-300 font-semibold">SUNRISE Resorts & Cruises</span>. All Rights Reserved.
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {ar ? "خادم الـ API متصل (Port 4000)" : "API Gateway Active (Port 4000)"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              {ar ? "سيرفر البصمة جاهز (Port 10006)" : "Biometric TCP Bridge Ready"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Fallback Scale Icon for legal / statutory compliance
function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  );
}
