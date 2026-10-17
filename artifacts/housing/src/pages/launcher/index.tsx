import React from "react";
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
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SystemLauncher() {
  const { user, logout } = useAuth();
  const { propertySlug, activeProperty } = useProperty();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [, setLocation] = useLocation();

  const ar = language === "ar";
  const slug = propertySlug || "all";
  const ArrowIcon = ar ? ArrowLeft : ArrowRight;

  const systems = [
    {
      id: "housing",
      title: ar ? "نظام إدارة سكن العاملين" : "Staff Housing Management",
      subtitle: ar ? "إدارة المباني والغرف والتسكين" : "Accommodations & Resident Operations",
      description: ar
        ? "مخططات المباني، التسكين الذكي، سجل النزلاء المقيمين، الحجوزات، الهاوس كيبنج، الصيانة والأقفال الذكية."
        : "Building layouts, room assignments, active in-house residents, advance reservations, housekeeping, and Hotek locks.",
      icon: Building2,
      href: `/${slug}/dashboard`,
      color: "from-blue-600 to-indigo-700",
      accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      borderHover: "hover:border-blue-500/50",
      badge: ar ? "قاعدة بيانات السكن (Isolated)" : "Isolated Housing DB",
      metrics: [
        { label: ar ? "المباني والغرف" : "Rooms & Layouts", value: "Rooms" },
        { label: ar ? "التسكين الذكي" : "Smart Booking", value: "Resident" },
        { label: ar ? "الأقفال الذكية" : "Locks & RFID", value: "Hotek" },
      ],
    },
    {
      id: "payroll",
      title: ar ? "نظام المرتبات والأجور" : "Payroll & Salaries System",
      subtitle: ar ? "مسير الرواتب والاستقطاعات والبنوك" : "Salaries, WPS Export & SST Compliance",
      description: ar
        ? "احتساب الرواتب الشهرية للعمالة المثبتة واليومية، مفردات المرتب، السلف والجزاءات، وتصدير شيتات البنوك WPS."
        : "End-to-end salary processing for regular and casual staff, salary slips, advances, penalties, and Egyptian bank WPS files.",
      icon: DollarSign,
      href: "/payroll",
      color: "from-emerald-600 to-teal-700",
      accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      borderHover: "hover:border-emerald-500/50",
      badge: ar ? "قاعدة بيانات المرتبات المنفصلة" : "sunrise_payroll_attendance",
      metrics: [
        { label: ar ? "العمالة المثبتة" : "Regular Staff", value: "SST" },
        { label: ar ? "العمالة اليومية" : "Casual Workers", value: "WPS" },
        { label: ar ? "السلف والجزاءات" : "Loans & Fines", value: "Active" },
      ],
    },
    {
      id: "attendance",
      title: ar ? "الحضور والانصراف وأجهزة البصمة" : "Attendance & Biometrics",
      subtitle: ar ? "تفريغ البصمات الحية والورديات" : "Biometric Machine Telemetry & Shifts",
      description: ar
        ? "الربط المباشر مع أجهزة وسيرفرات البصمة، تسجيل وتفريغ الحركات اللحظية، الورديات، ومطابقة الحضور والتأخيرات."
        : "Direct integration with biometric machines, real-time punch ingestion, shift scheduling, and lateness evaluation.",
      icon: Fingerprint,
      href: "/attendance",
      color: "from-purple-600 to-fuchsia-700",
      accentBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      borderHover: "hover:border-purple-500/50",
      badge: ar ? "بث البصمات اللحظي TCP/IP" : "Live Biometric Telemetry",
      metrics: [
        { label: ar ? "أجهزة البصمة" : "Terminals", value: "ZKTeco" },
        { label: ar ? "بث الحركات" : "Punch Feed", value: "Live" },
        { label: ar ? "الورديات" : "Shifts", value: "Rosters" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-200/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-between" dir={ar ? "rtl" : "ltr"}>
      {/* Top Navbar */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
                <span>SUNRISE</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  Enterprise Suite
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {ar ? "بوابة اختيار الأنظمة المتكاملة" : "Unified Enterprise Systems Portal"}
              </p>
            </div>
          </div>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="text-xs gap-1.5"
          >
            <Languages className="w-4 h-4" />
            <span>{ar ? "English" : "العربية"}</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 rounded-lg"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </Button>

          <div className="h-5 w-px bg-border mx-1"></div>

          <div className="flex items-center gap-2 text-xs">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
              {user?.username?.substring(0, 2).toUpperCase() || "SU"}
            </div>
            <div className="hidden sm:block text-right rtl:text-right ltr:text-left">
              <div className="font-semibold text-foreground">{user?.username}</div>
              <div className="text-[11px] text-muted-foreground capitalize">
                {user?.isSystemAdmin ? "Super Admin" : "User"}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="w-8 h-8 text-destructive hover:bg-destructive/10"
            title={ar ? "تسجيل الخروج" : "Logout"}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        <div className="text-center space-y-3 mb-10">
          <Badge variant="outline" className="px-3 py-1 text-xs gap-1.5 border-primary/30 text-primary bg-primary/5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {ar ? "اختر النظام للبدء في العمل" : "Select System to Launch Workspace"}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {ar ? "أنظمة مجموعة فنادق صن رايز" : "Sunrise Resorts & Cruises Systems"}
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            {ar
              ? "أنظمة معزولة بقواعد بيانات مستقلة لضمان أمان البيانات والأداء الفندقي المتفوق."
              : "Dedicated, decoupled enterprise applications operating on isolated PostgreSQL databases for zero data risk."}
          </p>
        </div>

        {/* 3 Main Systems Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systems.map((sys) => {
            const Icon = sys.icon;
            return (
              <Card
                key={sys.id}
                className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${sys.borderHover} group flex flex-col justify-between`}
              >
                <div>
                  <div className={`h-2.5 w-full bg-gradient-to-r ${sys.color}`}></div>
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className={`p-3.5 rounded-2xl ${sys.accentBg} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <Badge variant="secondary" className="text-[11px] font-mono">
                        {sys.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight text-foreground">
                      {sys.title}
                    </CardTitle>
                    <p className="text-xs font-semibold text-primary mt-1">
                      {sys.subtitle}
                    </p>
                    <CardDescription className="text-xs text-muted-foreground mt-2.5 leading-relaxed">
                      {sys.description}
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardContent className="p-6 pt-0 space-y-5">
                  <div className="grid grid-cols-3 gap-2 py-3 border-y text-center">
                    {sys.metrics.map((m, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="text-[11px] text-muted-foreground">{m.label}</div>
                        <div className="text-xs font-bold text-foreground">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => setLocation(sys.href)}
                    className="w-full justify-between group-hover:bg-primary transition-all duration-300 shadow-sm"
                  >
                    <span>{ar ? "دخول النظام الآن" : "Launch System"}</span>
                    <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-6 bg-background/50 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} Sunrise Resorts & Cruises. All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {ar ? "قواعد البيانات متصلة وجاهزة" : "All Databases Online & Healthy"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
