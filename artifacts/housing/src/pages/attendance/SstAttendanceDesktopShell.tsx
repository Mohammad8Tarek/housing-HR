import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Calendar,
  Clock,
  Users,
  FileSpreadsheet,
  FileText,
  Briefcase,
  Coins,
  GraduationCap,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Printer,
  Save,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Hotel,
} from "lucide-react";
import { SstMonthSelectModal } from "./SstMonthSelectModal";
import { SstVacationRequestModal } from "./SstVacationRequestModal";
import { SstVacationSignatureModal } from "./SstVacationSignatureModal";

interface SstAttendanceDesktopShellProps {
  children: React.ReactNode;
  activeTab: "shifts" | "daily" | "hours" | "punches";
  onTabChange: (tab: "shifts" | "daily" | "hours" | "punches") => void;
  propertyName?: string;
  year: number;
  month: number;
  userName?: string;
  onYearMonthChange: (year: number, month: number) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  availableDepartments: string[];
  onChangeCompany?: () => void;
  onSwitchTheme?: () => void;
}

export function SstAttendanceDesktopShell({
  children,
  activeTab,
  onTabChange,
  propertyName = "SunRise Meraki Sharm Casual",
  year,
  month,
  userName = "admin",
  onYearMonthChange,
  selectedDepartment,
  onDepartmentChange,
  availableDepartments,
  onChangeCompany,
  onSwitchTheme,
}: SstAttendanceDesktopShellProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  // Modal states
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isVacationRequestOpen, setIsVacationRequestOpen] = useState(false);
  const [isVacationSignatureOpen, setIsVacationSignatureOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Department navigation
  const currentDeptIdx = availableDepartments.indexOf(selectedDepartment);
  const handlePrevDept = () => {
    if (currentDeptIdx > 0) {
      onDepartmentChange(availableDepartments[currentDeptIdx - 1]);
    } else {
      onDepartmentChange(availableDepartments[availableDepartments.length - 1]);
    }
  };
  const handleNextDept = () => {
    if (currentDeptIdx < availableDepartments.length - 1) {
      onDepartmentChange(availableDepartments[currentDeptIdx + 1]);
    } else {
      onDepartmentChange(availableDepartments[0]);
    }
  };

  const isClosedMonth = month <= 10 && year === 2026;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#3a6ea5] select-none font-sans overflow-hidden">
      {/* 1. Main SST Win32 Window Container */}
      <div className="flex-1 flex flex-col bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] shadow-2xl m-1 overflow-hidden">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#0880f0] to-[#3a93ff] text-white px-2 py-0.5 flex items-center justify-between text-xs font-bold tracking-wide shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-white/20 border border-white/50 flex items-center justify-center text-[10px]">▦</span>
            <span>
              SST HR Departments Interface - [{activeTab === "daily" ? "Attendant Sheet" : activeTab === "shifts" ? "Attendance Time" : activeTab === "hours" ? "Hours Details" : "Time Original Data"}]
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onSwitchTheme && (
              <button
                type="button"
                onClick={onSwitchTheme}
                className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-[10px] font-bold text-white rounded-xs border border-white/40 cursor-pointer transition-colors"
                title="Switch between Classic SST and Modern Sunrise UI"
              >
                {ar ? "الواجهة الحديثة ✦" : "Modern UI ✦"}
              </button>
            )}
            {onChangeCompany && (
              <button
                type="button"
                onClick={onChangeCompany}
                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-[10px] font-bold text-gray-900 rounded-xs border border-amber-300 cursor-pointer transition-colors flex items-center gap-1"
                title="Change Hotel Property"
              >
                <Hotel className="w-3 h-3" />
                <span>{ar ? "تبديل الفندق" : "Change Hotel"}</span>
              </button>
            )}
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 bg-white/20 text-center text-[10px] flex items-center justify-center">_</span>
              <span className="w-3.5 h-3.5 bg-white/20 text-center text-[10px] flex items-center justify-center">□</span>
              <span className="w-3.5 h-3.5 bg-[#d73a49] text-center text-[10px] flex items-center justify-center font-bold">×</span>
            </div>
          </div>
        </div>

        {/* Menu Bar (File, Save, Change Month, View, Approval, Reports) */}
        <div className="bg-[#ece9d8] border-b border-[#a09e95] px-1 py-0.5 flex items-center gap-3 text-xs text-gray-800 relative shrink-0">
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "file" ? null : "file")}
              className={`px-2 py-0.5 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer ${
                activeMenu === "file" ? "bg-[#316ac5] text-white" : ""
              }`}
            >
              File
            </button>
            {activeMenu === "file" && (
              <div className="absolute top-full left-0 w-36 bg-[#ece9d8] border border-[#716f64] shadow-md z-50 text-xs py-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    navigator.clipboard.writeText("Attendance Data");
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Copy Data
                </button>
                <div className="border-t border-[#d0cfc5] my-1" />
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    if (onChangeCompany) onChangeCompany();
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Select Property...
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
          >
            Save
          </button>

          <button
            type="button"
            onClick={() => setIsMonthModalOpen(true)}
            className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer font-bold text-blue-900"
          >
            Change Month
          </button>

          <button
            type="button"
            className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
          >
            View
          </button>

          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === "approval" ? null : "approval")}
              className={`px-2 py-0.5 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer ${
                activeMenu === "approval" ? "bg-[#316ac5] text-white" : ""
              }`}
            >
              Approval
            </button>
            {activeMenu === "approval" && (
              <div className="absolute top-full left-0 w-44 bg-[#ece9d8] border border-[#716f64] shadow-md z-50 text-xs py-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    setIsVacationSignatureOpen(true);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer font-bold"
                >
                  Approval (Signatures)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMenu(null);
                    setIsVacationRequestOpen(true);
                  }}
                  className="w-full text-left px-3 py-1 hover:bg-[#316ac5] hover:text-white cursor-pointer"
                >
                  Add New Request
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="px-2 py-0.5 hover:bg-[#316ac5] hover:text-white rounded-xs cursor-pointer"
          >
            Reports
          </button>

          <span className="text-[10px] text-gray-500 ml-auto font-mono">
            Version : 26.00625.1500
          </span>
        </div>

        {/* Main Work Area: Left Sidebar + Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* 2. Left Sidebar (Authentic Win32 SST 9 Icons Strip) */}
          <div className="w-[68px] bg-[#d4d0c8] border-r border-[#7f9db9] p-1 flex flex-col items-center gap-2 overflow-y-auto shrink-0 select-none shadow-xs">
            {/* Icon 1: Calendar (April) -> Attendant Sheet */}
            <button
              type="button"
              onClick={() => onTabChange("daily")}
              title="Attendance Time Sheet"
              className={`w-14 h-12 flex flex-col items-center justify-center rounded-xs transition-transform cursor-pointer ${
                activeTab === "daily" || activeTab === "shifts"
                  ? "bg-white border-2 border-[#0055ea] shadow-md scale-105"
                  : "hover:bg-white/60 border border-transparent"
              }`}
            >
              <div className="w-8 h-8 rounded-xs bg-red-600 border border-red-700 flex flex-col items-center justify-center text-white shadow-xs">
                <span className="text-[7px] font-black uppercase tracking-tighter leading-none bg-red-800 w-full text-center py-0.5">APRIL</span>
                <span className="text-[10px] font-black leading-none mt-0.5">📅</span>
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Sheet</span>
            </button>

            {/* Icon 2: Orange Businessman -> Personnel / Employee Profiles */}
            <button
              type="button"
              onClick={() => setIsVacationRequestOpen(true)}
              title="Employee Personnel & Requests"
              className="w-14 h-12 flex flex-col items-center justify-center rounded-xs hover:bg-white/60 border border-transparent cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-base shadow-xs">
                👤
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Profiles</span>
            </button>

            {/* Icon 3: Scroll & Quill -> Contracts & Hierarchy */}
            <button
              type="button"
              title="Contracts & Department Hierarchy"
              className="w-14 h-12 flex flex-col items-center justify-center rounded-xs hover:bg-white/60 border border-transparent cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xs bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 text-base shadow-xs">
                📜
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Contracts</span>
            </button>

            {/* Icon 4: Envelope + Clock -> Vacations Request Signature */}
            <button
              type="button"
              onClick={() => setIsVacationSignatureOpen(true)}
              title="Vacations Request Signature"
              className="w-14 h-12 flex flex-col items-center justify-center rounded-xs hover:bg-white/60 border border-transparent cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xs bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-800 text-base shadow-xs relative">
                ✉️
                <span className="absolute -bottom-1 -right-1 text-[10px]">⏰</span>
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Signatures</span>
            </button>

            {/* Icon 5: Notepad + Folders -> Add New Request */}
            <button
              type="button"
              onClick={() => setIsVacationRequestOpen(true)}
              title="Add New Request"
              className="w-14 h-12 flex flex-col items-center justify-center rounded-xs hover:bg-white/60 border border-transparent cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xs bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-800 text-base shadow-xs">
                📝
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Requests</span>
            </button>

            {/* Icon 6: 3D Hiring figure -> Recruitment */}
            <button
              type="button"
              title="Recruitment & Hiring"
              className="w-14 h-12 flex flex-col items-center justify-center rounded-xs hover:bg-white/60 border border-transparent cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xs bg-rose-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                HIRING
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Recruit</span>
            </button>

            {/* Icon 7: Gold Coins -> Payroll */}
            <a
              href="/payroll"
              title="Open Payroll System"
              className="w-14 h-12 flex flex-col items-center justify-center rounded-xs hover:bg-white/60 border border-transparent cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xs bg-yellow-100 border border-yellow-300 flex items-center justify-center text-yellow-800 text-base shadow-xs">
                💰
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Payroll</span>
            </a>

            {/* Icon 8: Podium Figure -> Training */}
            <button
              type="button"
              title="Training & Appraisals"
              className="w-14 h-12 flex flex-col items-center justify-center rounded-xs hover:bg-white/60 border border-transparent cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xs bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-800 text-base shadow-xs">
                🏛️
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Training</span>
            </button>

            {/* Icon 9: Stethoscope -> Clinic & Health */}
            <button
              type="button"
              title="Medical & Clinic"
              className="w-14 h-12 flex flex-col items-center justify-center rounded-xs hover:bg-white/60 border border-transparent cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xs bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 text-base shadow-xs">
                🩺
              </div>
              <span className="text-[8px] font-bold text-gray-800 leading-none mt-0.5">Medical</span>
            </button>
          </div>

          {/* 3. Center Workspace: Header + Tabs + Grid */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Header: Department Name & Closed Month Alert & Dropdown Navigation */}
            <div className="bg-[#ece9d8] border-b border-[#7f9db9] p-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <h1 className="text-sm font-black text-gray-900 tracking-wide">
                  {selectedDepartment}
                </h1>
                {isClosedMonth && (
                  <span className="text-red-600 font-black text-xs tracking-wider animate-pulse">
                    Closed Month
                  </span>
                )}
              </div>

              {/* Department Dropdown with navigation buttons (. and ..) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevDept}
                  title="Previous Department"
                  className="w-6 h-5 bg-[#ece9d8] hover:bg-[#dedbc9] text-gray-800 font-black text-[10px] border border-[#7f9db9] flex items-center justify-center cursor-pointer shadow-xs"
                >
                  ..
                </button>
                <button
                  type="button"
                  onClick={handleNextDept}
                  title="Next Department"
                  className="w-6 h-5 bg-[#ece9d8] hover:bg-[#dedbc9] text-gray-800 font-black text-[10px] border border-[#7f9db9] flex items-center justify-center cursor-pointer shadow-xs"
                >
                  .
                </button>
                <select
                  value={selectedDepartment}
                  onChange={(e) => onDepartmentChange(e.target.value)}
                  className="bg-white border border-[#7f9db9] px-2 py-0.5 text-xs font-bold text-gray-900 focus:outline-none min-w-[200px]"
                >
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4 Core SST Tabs */}
            <div className="bg-[#ece9d8] border-b border-[#7f9db9] px-2 pt-1.5 flex items-end gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onTabChange("shifts")}
                className={`px-3 py-1 text-xs font-bold rounded-t-xs border-t-2 border-l-2 border-r-2 cursor-pointer transition-colors ${
                  activeTab === "shifts"
                    ? "bg-white text-blue-900 border-[#0055ea] z-10 shadow-xs"
                    : "bg-[#d4d0c8] text-gray-700 border-t-white border-l-white border-r-[#716f64] hover:bg-[#e4e0d8]"
                }`}
              >
                Vacations & Shifts
              </button>

              <button
                type="button"
                onClick={() => onTabChange("daily")}
                className={`px-3 py-1 text-xs font-bold rounded-t-xs border-t-2 border-l-2 border-r-2 cursor-pointer transition-colors ${
                  activeTab === "daily"
                    ? "bg-white text-blue-900 border-[#0055ea] z-10 shadow-xs"
                    : "bg-[#d4d0c8] text-gray-700 border-t-white border-l-white border-r-[#716f64] hover:bg-[#e4e0d8]"
                }`}
              >
                Time Attendance
              </button>

              <button
                type="button"
                onClick={() => onTabChange("hours")}
                className={`px-3 py-1 text-xs font-bold rounded-t-xs border-t-2 border-l-2 border-r-2 cursor-pointer transition-colors ${
                  activeTab === "hours"
                    ? "bg-white text-blue-900 border-[#0055ea] z-10 shadow-xs"
                    : "bg-[#d4d0c8] text-gray-700 border-t-white border-l-white border-r-[#716f64] hover:bg-[#e4e0d8]"
                }`}
              >
                Hours Details
              </button>

              <button
                type="button"
                onClick={() => onTabChange("punches")}
                className={`px-3 py-1 text-xs font-bold rounded-t-xs border-t-2 border-l-2 border-r-2 cursor-pointer transition-colors ${
                  activeTab === "punches"
                    ? "bg-white text-blue-900 border-[#0055ea] z-10 shadow-xs"
                    : "bg-[#d4d0c8] text-gray-700 border-t-white border-l-white border-r-[#716f64] hover:bg-[#e4e0d8]"
                }`}
              >
                Time Original Data
              </button>
            </div>

            {/* Active Content Grid */}
            <div className="flex-1 overflow-hidden">{children}</div>
          </div>
        </div>

        {/* 4. SST Authentic Footer Status Bar */}
        <div className="bg-[#ece9d8] border-t border-[#a09e95] px-2 py-0.5 flex items-center justify-between text-xs text-gray-800 font-medium shrink-0">
          <div className="flex items-center gap-3">
            <div>
              Year = <span className="font-bold text-gray-900">{year}</span> Month ={" "}
              <span className="font-bold text-gray-900">{month}</span> User Name :{" "}
              <span className="font-bold text-emerald-800">{userName}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="bg-red-600 text-white px-1 font-bold">100%</span>
              <span className="text-gray-600 font-mono">S_T</span>
            </div>
          </div>

          <div className="text-blue-900 font-black text-sm tracking-wide">
            {propertyName}
          </div>
        </div>
      </div>

      {/* Month Selection Modal */}
      <SstMonthSelectModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        selectedYear={year}
        selectedMonth={month}
        onSelect={onYearMonthChange}
      />

      {/* Add New Request Modal */}
      <SstVacationRequestModal
        isOpen={isVacationRequestOpen}
        onClose={() => setIsVacationRequestOpen(false)}
        year={year}
        month={month}
        userName={userName}
        propertyName={propertyName}
      />

      {/* Vacations Request Signature Modal */}
      <SstVacationSignatureModal
        isOpen={isVacationSignatureOpen}
        onClose={() => setIsVacationSignatureOpen(false)}
        year={year}
        month={month}
        userName={userName}
        propertyName={propertyName}
      />
    </div>
  );
}
