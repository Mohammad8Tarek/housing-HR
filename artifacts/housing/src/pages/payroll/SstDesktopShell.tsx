import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  DollarSign,
  Users,
  Calendar,
  Percent,
  Landmark,
  ShieldCheck,
  Bus,
  ArrowRightLeft,
  Lock,
  Printer,
  Search,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  FileSpreadsheet,
  Calculator,
  Laptop,
  Coins,
  Scale,
  Briefcase
} from "lucide-react";

interface SstDesktopShellProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  propertyName?: string;
  propertyCode?: string;
  year?: number;
  month?: number;
  calcNumber?: number;
  userName?: string;
  onNewAction?: () => void;
  onPrintAction?: () => void;
  onSearchAction?: () => void;
  onSecurityAction?: () => void;
}

export function SstDesktopShell({
  children,
  activeTab,
  onTabChange,
  propertyName = "SunRise Meraki Sharm Casual",
  propertyCode = "MRK-CASUAL",
  year = 2026,
  month = 10,
  calcNumber = 1,
  userName = "admin",
  onNewAction,
  onPrintAction,
  onSearchAction,
  onSecurityAction,
}: SstDesktopShellProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Quick navigation items for SST Right Dock (Functions)
  const rightDockItems = [
    {
      id: "employees",
      titleAr: "بيانات رواتب الموظفين (0/623)",
      titleEn: "Employee Master (623)",
      icon: Users,
      bgColor: "bg-blue-600 hover:bg-blue-700",
      accent: "from-blue-500 to-indigo-600",
      badge: "Master",
    },
    {
      id: "transactions",
      titleAr: "الحركات الشهرية المتغيرة (0/177)",
      titleEn: "Monthly Transactions (177)",
      icon: FileSpreadsheet,
      bgColor: "bg-amber-600 hover:bg-amber-700",
      accent: "from-amber-500 to-orange-600",
      badge: "SST",
    },
    {
      id: "operations",
      titleAr: "الجزاءات والشؤون القانونية",
      titleEn: "Penalties (Law 12)",
      icon: Scale,
      bgColor: "bg-rose-600 hover:bg-rose-700",
      accent: "from-rose-500 to-red-600",
      badge: "Law 12",
    },
    {
      id: "loans",
      titleAr: "السلف والأقساط الشهرية",
      titleEn: "Loans & Installments",
      icon: Landmark,
      bgColor: "bg-emerald-600 hover:bg-emerald-700",
      accent: "from-emerald-500 to-teal-600",
      badge: "Loans",
      tab: "operations",
    },
    {
      id: "bus",
      titleAr: "أتوبيس العاملين - رحلات القاهرة",
      titleEn: "Staff Bus Cairo Logistics",
      icon: Bus,
      bgColor: "bg-red-700 hover:bg-red-800",
      accent: "from-red-600 to-rose-700",
      badge: "Bus",
    },
  ];

  // Quick navigation items for SST Left Dock (Financial & Outputs)
  const leftDockItems = [
    {
      id: "service-charge",
      titleAr: "توزيع نسبة الـ 12% خدمة",
      titleEn: "12% Tronc Service Charge",
      icon: Coins,
      bgColor: "bg-amber-500 hover:bg-amber-600",
      accent: "from-yellow-500 to-amber-600",
      badge: "12%",
    },
    {
      id: "runs",
      titleAr: "احتساب مسير الرواتب",
      titleEn: "Payroll Calculation Engine",
      icon: Calculator,
      bgColor: "bg-[#0f2942] hover:bg-[#1a3f63]",
      accent: "from-slate-700 to-slate-900",
      badge: "Calc",
    },
    {
      id: "wps",
      titleAr: "شيتات البنوك WPS وملفات Excel",
      titleEn: "Bank WPS & Excel Exports",
      icon: CreditCard,
      bgColor: "bg-green-700 hover:bg-green-800",
      accent: "from-green-600 to-emerald-700",
      badge: "WPS",
    },
    {
      id: "rollover",
      titleAr: "ترحيل رصيد الإجازات السنوي",
      titleEn: "4-Bucket Vacations Rollover",
      icon: ArrowRightLeft,
      bgColor: "bg-indigo-600 hover:bg-indigo-700",
      accent: "from-indigo-500 to-purple-600",
      badge: "4 Pools",
    },
    {
      id: "reports",
      titleAr: "دليل تقارير الرواتب الـ 20",
      titleEn: "20 SST Reports Catalog",
      icon: FileText,
      bgColor: "bg-sky-700 hover:bg-sky-800",
      accent: "from-sky-600 to-blue-700",
      badge: "20 Tree",
    },
  ];

  return (
    <div className="flex flex-col bg-[#d4dce6] min-h-screen text-slate-800 font-sans select-none" dir="ltr">
      {/* ─── 1. SST MDI TITLE BAR (Exact Windows Styling) ────────────────── */}
      <div className="bg-gradient-to-r from-[#00387a] via-[#1b5ea3] to-[#00387a] text-white px-3 py-1 flex items-center justify-between shadow-xs select-none border-b border-[#00224d]">
        <div className="flex items-center gap-2">
          {/* SST Green 3D Logo */}
          <div className="w-5 h-5 rounded bg-emerald-600 border border-emerald-300 flex items-center justify-center font-black text-[10px] text-white shadow-2xs">
            SST
          </div>
          <span className="font-bold text-xs tracking-wide">
            Integrated System For Payroll And Human Resources ({propertyName})
          </span>
          <Badge className="bg-amber-400 text-slate-950 font-black text-[9px] px-1 py-0 h-4 border-amber-300">
            SST 26.0
          </Badge>
        </div>

        {/* Windows Control Box */}
        <div className="flex items-center gap-1">
          <button className="w-6 h-5 bg-[#1b5ea3] hover:bg-[#2b72be] flex items-center justify-center text-xs font-bold rounded-xs border border-white/20 text-white cursor-pointer">
            _
          </button>
          <button className="w-6 h-5 bg-[#1b5ea3] hover:bg-[#2b72be] flex items-center justify-center text-[10px] font-bold rounded-xs border border-white/20 text-white cursor-pointer">
            □
          </button>
          <button className="w-6 h-5 bg-rose-600 hover:bg-rose-700 flex items-center justify-center text-xs font-bold rounded-xs border border-white/20 text-white cursor-pointer">
            ✕
          </button>
        </div>
      </div>

      {/* ─── 2. SST CLASSIC DESKTOP MENU BAR ────────────────────────────── */}
      <div className="bg-[#f0f2f5] border-b border-[#c0c7d2] px-2 py-0.5 flex items-center gap-1 text-xs text-slate-800 font-medium relative shadow-2xs">
        {/* Menu: File */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
            className={`px-2.5 py-1 hover:bg-[#d8e2ee] rounded cursor-pointer ${activeMenu === "file" ? "bg-[#c0d4ec]" : ""}`}
          >
            File
          </button>
          {activeMenu === "file" && (
            <div className="absolute top-full start-0 mt-0.5 w-48 bg-white border border-slate-300 rounded shadow-lg py-1 z-50 text-xs">
              <button
                onClick={() => { onNewAction?.(); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
              >
                <span>New Calculation Period</span>
                <span className="text-[10px] text-slate-400">Ctrl+N</span>
              </button>
              <button
                onClick={() => { onPrintAction?.(); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
              >
                <span>Print Active Payslip</span>
                <span className="text-[10px] text-slate-400">Ctrl+P</span>
              </button>
              <div className="h-px bg-slate-200 my-1"></div>
              <button
                onClick={() => { onSecurityAction?.(); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 text-amber-700 font-semibold"
              >
                Supervisor PIN Auth...
              </button>
            </div>
          )}
        </div>

        {/* Menu: Basic Definitions */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "defs" ? null : "defs")}
            className={`px-2.5 py-1 hover:bg-[#d8e2ee] rounded cursor-pointer ${activeMenu === "defs" ? "bg-[#c0d4ec]" : ""}`}
          >
            Basic Definitions
          </button>
          {activeMenu === "defs" && (
            <div className="absolute top-full start-0 mt-0.5 w-56 bg-white border border-slate-300 rounded shadow-lg py-1 z-50 text-xs">
              <button
                onClick={() => { onTabChange("employees"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                Payroll Bands (Bands 1..30)
              </button>
              <button
                onClick={() => { onTabChange("employees"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                Cost Centers & GL Accounts
              </button>
              <button
                onClick={() => { onTabChange("service-charge"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                12% Service Charge Rules (85/15)
              </button>
            </div>
          )}
        </div>

        {/* Menu: Functions */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "funcs" ? null : "funcs")}
            className={`px-2.5 py-1 hover:bg-[#d8e2ee] rounded cursor-pointer font-bold ${activeMenu === "funcs" ? "bg-[#c0d4ec]" : ""}`}
          >
            Functions
          </button>
          {activeMenu === "funcs" && (
            <div className="absolute top-full start-0 mt-0.5 w-60 bg-white border border-slate-300 rounded shadow-lg py-1 z-50 text-xs">
              <button
                onClick={() => { onTabChange("employees"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
              >
                <span>Employee Master (0/623)</span>
                <Badge className="bg-blue-100 text-blue-800 text-[9px]">Master</Badge>
              </button>
              <button
                onClick={() => { onTabChange("transactions"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
              >
                <span>Monthly Transactions (0/177)</span>
                <Badge className="bg-amber-100 text-amber-800 text-[9px]">Calc.#</Badge>
              </button>
              <button
                onClick={() => { onTabChange("operations"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                Staff Loans & Installments
              </button>
              <button
                onClick={() => { onTabChange("operations"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                Disciplinary Penalties (Law 12)
              </button>
              <button
                onClick={() => { onTabChange("bus"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 text-red-700 font-bold"
              >
                Staff Bus Travel Manifests (Cairo)
              </button>
            </div>
          )}
        </div>

        {/* Menu: End Period */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "endp" ? null : "endp")}
            className={`px-2.5 py-1 hover:bg-[#d8e2ee] rounded cursor-pointer ${activeMenu === "endp" ? "bg-[#c0d4ec]" : ""}`}
          >
            End Period
          </button>
          {activeMenu === "endp" && (
            <div className="absolute top-full start-0 mt-0.5 w-60 bg-white border border-slate-300 rounded shadow-lg py-1 z-50 text-xs">
              <button
                onClick={() => { onTabChange("runs"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 font-bold"
              >
                Calculate Salaries (Runs Engine)
              </button>
              <button
                onClick={() => { onTabChange("service-charge"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                12% Service Charge Distribution
              </button>
              <button
                onClick={() => { onTabChange("wps"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                Bank WPS Files (NBE, CIB, Misr)
              </button>
            </div>
          )}
        </div>

        {/* Menu: Reports */}
        <button
          onClick={() => { onTabChange("reports"); setActiveMenu(null); }}
          className="px-2.5 py-1 hover:bg-[#d8e2ee] rounded cursor-pointer"
        >
          Reports (20 Suites)
        </button>

        {/* Menu: Special Tools */}
        <div className="relative">
          <button
            onClick={() => setActiveMenu(activeMenu === "tools" ? null : "tools")}
            className={`px-2.5 py-1 hover:bg-[#d8e2ee] rounded cursor-pointer ${activeMenu === "tools" ? "bg-[#c0d4ec]" : ""}`}
          >
            Special Tools
          </button>
          {activeMenu === "tools" && (
            <div className="absolute top-full start-0 mt-0.5 w-60 bg-white border border-slate-300 rounded shadow-lg py-1 z-50 text-xs">
              <button
                onClick={() => { onTabChange("rollover"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 font-bold text-indigo-700"
              >
                Yearly Vacations Rollover (4 Pools)
              </button>
              <button
                onClick={() => { onTabChange("runs"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                Egyptian Tax Calculator Simulator
              </button>
              <button
                onClick={() => { onTabChange("runs"); setActiveMenu(null); }}
                className="w-full text-start px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700"
              >
                End of Service Gratuity Settlement
              </button>
            </div>
          )}
        </div>

        {/* Menu: System Manager */}
        <button
          onClick={() => { onSecurityAction?.(); setActiveMenu(null); }}
          className="px-2.5 py-1 hover:bg-[#d8e2ee] rounded cursor-pointer text-slate-700"
        >
          System Manager
        </button>

        {/* Menu: Help */}
        <button
          onClick={() => alert(`SUNRISE HRMS & Payroll Studio (SST 26.0 Parity)\nHotel Scope: ${propertyName}\nPeriod: ${year}/${month} | Calc.# ${calcNumber}`)}
          className="px-2.5 py-1 hover:bg-[#d8e2ee] rounded cursor-pointer text-slate-700"
        >
          Help
        </button>
      </div>

      {/* ─── 3. SST ICON TOOLBAR (Exact Icons from Screenshot) ──────────── */}
      <div className="bg-[#e4ebf3] border-b border-[#b5c2d1] px-3 py-1.5 flex items-center justify-between shadow-xs">
        {/* Left Toolbar Icons */}
        <div className="flex items-center gap-1.5">
          {/* New Document Button (White page) */}
          <button
            onClick={onNewAction}
            className="w-8 h-8 rounded bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shadow-xs cursor-pointer transition-transform hover:scale-105"
            title="New Record / New Period"
          >
            <Plus className="w-4 h-4 text-emerald-700" />
          </button>

          {/* Edit Button (Pencil & colors) */}
          <button
            onClick={() => onTabChange("employees")}
            className="w-8 h-8 rounded bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shadow-xs cursor-pointer transition-transform hover:scale-105"
            title="Edit Active Employee"
          >
            <Edit3 className="w-4 h-4 text-blue-700" />
          </button>

          {/* Delete Button (Green Recycle Bin) */}
          <button
            onClick={() => alert("Please select an item from grid to delete")}
            className="w-8 h-8 rounded bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shadow-xs cursor-pointer transition-transform hover:scale-105"
            title="Delete Selected Record"
          >
            <Trash2 className="w-4 h-4 text-emerald-600" />
          </button>

          {/* Print Button (Laser Printer) */}
          <button
            onClick={onPrintAction}
            className="w-8 h-8 rounded bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shadow-xs cursor-pointer transition-transform hover:scale-105"
            title="Print Current Report / Slip"
          >
            <Printer className="w-4 h-4 text-slate-800" />
          </button>

          {/* Search Button (Magnifying Glass) */}
          <button
            onClick={onSearchAction}
            className="w-8 h-8 rounded bg-white hover:bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 shadow-xs cursor-pointer transition-transform hover:scale-105"
            title="Search Records"
          >
            <Search className="w-4 h-4 text-[#c89332]" />
          </button>

          <div className="h-6 w-px bg-slate-300 mx-1"></div>

          {/* Navigation Controls: Green Circles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTabChange("runs")}
              className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs cursor-pointer"
              title="Previous Batch"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onTabChange("employees")}
              className="w-7 h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs cursor-pointer"
              title="Next Batch"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Active Context Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-600">
            {propertyName} [{propertyCode}]
          </span>
          <Badge className="bg-[#0f2942] text-amber-300 font-mono text-[10px]">
            {year}/{String(month).padStart(2, "0")} (Calc #{calcNumber})
          </Badge>
        </div>
      </div>

      {/* ─── 4. MAIN WORKSPACE WITH DOCKED QUICK LAUNCHERS ─────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT DOCKED VERTICAL LAUNCHER (Financial & Banking Modules) */}
        <aside className="w-16 bg-[#e0e7f1] border-e border-[#bdcadb] p-1.5 flex flex-col items-center gap-2.5 shrink-0 select-none shadow-xs">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-tighter text-center">
            Finance
          </div>
          {leftDockItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#0f2942] text-amber-300 shadow-md ring-2 ring-amber-400 scale-105"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:shadow-xs"
                }`}
                title={ar ? item.titleAr : item.titleEn}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-slate-700"}`} />
                <span className="text-[9px] font-bold tracking-tighter truncate max-w-[44px]">
                  {item.badge}
                </span>
              </button>
            );
          })}
        </aside>

        {/* CENTER MDI CANVAS / CONTENT WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-3 bg-slate-100/60" dir={ar ? "rtl" : "ltr"}>
          {children}
        </main>

        {/* RIGHT DOCKED VERTICAL LAUNCHER (Operational HR & Bus Modules) */}
        <aside className="w-16 bg-[#e0e7f1] border-s border-[#bdcadb] p-1.5 flex flex-col items-center gap-2.5 shrink-0 select-none shadow-xs">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-tighter text-center">
            Modules
          </div>
          {rightDockItems.map((item) => {
            const isActive = activeTab === item.id || (item.id === "loans" && activeTab === "operations");
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.tab || item.id)}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#0f2942] text-amber-300 shadow-md ring-2 ring-amber-400 scale-105"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 hover:shadow-xs"
                }`}
                title={ar ? item.titleAr : item.titleEn}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-slate-700"}`} />
                <span className="text-[9px] font-bold tracking-tighter truncate max-w-[44px]">
                  {item.badge}
                </span>
              </button>
            );
          })}
        </aside>
      </div>

      {/* ─── 5. SST CLASSIC BOTTOM STATUS BAR (Exact Telemetry) ─────────── */}
      <footer className="bg-white border-t border-[#b8c5d4] px-3 py-1 flex flex-wrap items-center justify-between text-xs font-mono text-slate-800 shadow-2xs select-none">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900">#116 User Name :{userName}</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-slate-700">Year = {year} Month = {month} Calc.# ={calcNumber}</span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-rose-700">{propertyName}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-600">{new Date().toISOString().split("T")[0]} [{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-800 font-bold">Version: 26.00714-1600 (SST Studio)</span>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ms-1" title="Connected"></div>
        </div>
      </footer>
    </div>
  );
}
