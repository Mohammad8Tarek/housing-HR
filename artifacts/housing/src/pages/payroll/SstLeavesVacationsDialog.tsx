import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { 
  X, 
  Minus, 
  Square, 
  Save, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Calendar,
  CheckCircle2
} from "lucide-react";

interface SstLeavesVacationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Array<{
    id: number;
    employeeCode: string;
    fullName: string;
    designation?: string;
    joiningDate?: string;
  }>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSaveLeave?: (leaveData: any) => Promise<void>;
  propertyName?: string;
}

export function SstLeavesVacationsDialog({
  isOpen,
  onClose,
  employees,
  currentIndex,
  onNavigate,
  onSaveLeave,
  propertyName = "SunRise Meraki Sharm Casual",
}: SstLeavesVacationsDialogProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const currentEmp = employees[currentIndex] || null;
  const totalCount = employees.length;
  const displayIndex = totalCount > 0 ? currentIndex + 1 : 0;

  // Form State
  const [leaveCode, setLeaveCode] = useState("01");
  const [leaveDesc, setLeaveDesc] = useState("إجازة سنوية اعتيادية (Annual Leave)");
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  });
  const [daysCount, setDaysCount] = useState("7");
  const [isRequiredReturnNotification, setIsRequiredReturnNotification] = useState(true);
  const [comment, setComment] = useState("Regular approved leave rotation to home governorate.");
  const [isSaving, setIsSaving] = useState(false);

  // Balances Telemetry
  const [balanceConsumed, setBalanceConsumed] = useState("14");
  const [balanceMonth, setBalanceMonth] = useState("21");
  const [balanceYearEnd, setBalanceYearEnd] = useState("28");

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!currentEmp) return;
    try {
      setIsSaving(true);
      if (onSaveLeave) {
        await onSaveLeave({
          employeeId: currentEmp.id,
          employeeCode: currentEmp.employeeCode,
          leaveCode,
          fromDate,
          toDate,
          daysCount: parseInt(daysCount) || 1,
          comment,
        });
      }
      toast.success(ar ? "تم تسجيل الإجازة بنجاح" : "Leave registered successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save leave");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2 select-none overflow-y-auto">
      {/* WINDOW FRAME (MDI Authentic Windows 7 / XP Form) */}
      <div 
        className="w-full max-w-3xl bg-[#e6eef8] border-2 border-[#5b82a6] rounded-t-lg shadow-2xl flex flex-col overflow-hidden text-slate-800 font-sans"
        style={{ minHeight: "520px" }}
      >
        {/* ─── 1. WINDOW TITLE BAR ────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#20517f] via-[#3a75a7] to-[#1f4e79] text-white px-3 py-1 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-600 rounded flex items-center justify-center text-[10px] font-black border border-white/50 text-white shadow-2xs">
              L
            </div>
            <span className="text-xs font-bold tracking-tight">
              leaves and Vacations — {propertyName}
            </span>
            <span className="text-[11px] text-blue-200 font-mono">
              [SST 26.0 Operational Leave Form]
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button className="w-5 h-5 bg-[#3a75a7] hover:bg-[#4b8ac2] border border-white/30 rounded text-[10px] flex items-center justify-center text-white">
              <Minus className="w-3 h-3" />
            </button>
            <button className="w-5 h-5 bg-[#3a75a7] hover:bg-[#4b8ac2] border border-white/30 rounded text-[10px] flex items-center justify-center text-white">
              <Square className="w-2.5 h-2.5" />
            </button>
            <button 
              onClick={onClose}
              className="w-5 h-5 bg-rose-600 hover:bg-rose-700 border border-white/30 rounded text-[10px] flex items-center justify-center text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ─── 2. TOP TOOLBAR ─────────────────────────────────────────── */}
        <div className="bg-[#f0f4f9] border-b border-[#bdcadb] px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded shadow-2xs flex items-center gap-1 cursor-pointer font-bold"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ الإجازة" : "Save Leave")}</span>
            </button>
          </div>

          {/* Authentic Navigation Green Circles & Counter */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button 
              disabled={currentIndex <= 0}
              onClick={() => onNavigate(0)}
              className="w-7 h-7 bg-white hover:bg-emerald-50 border border-[#b8c5d4] rounded-full flex items-center justify-center text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronsLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button 
              disabled={currentIndex <= 0}
              onClick={() => onNavigate(currentIndex - 1)}
              className="w-7 h-7 bg-white hover:bg-emerald-50 border border-[#b8c5d4] rounded-full flex items-center justify-center text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            <div className="px-3 py-1 bg-white border border-[#b8c5d4] rounded text-slate-800 font-bold min-w-[70px] text-center shadow-inner">
              {displayIndex} / {totalCount}
            </div>

            <button 
              disabled={currentIndex >= totalCount - 1}
              onClick={() => onNavigate(currentIndex + 1)}
              className="w-7 h-7 bg-white hover:bg-emerald-50 border border-[#b8c5d4] rounded-full flex items-center justify-center text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button 
              disabled={currentIndex >= totalCount - 1}
              onClick={() => onNavigate(totalCount - 1)}
              className="w-7 h-7 bg-white hover:bg-emerald-50 border border-[#b8c5d4] rounded-full flex items-center justify-center text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <ChevronsRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* ─── 3. FORM BODY (Matching Authentic TSplus leaves and Vacations) ─ */}
        <div className="p-4 bg-[#e6eef8] space-y-2 text-xs flex-1">
          {/* Employee Code & Name */}
          <div className="flex items-center gap-1">
            <label className="w-36 text-slate-700 font-bold shrink-0">Employee Code</label>
            <input 
              type="text" 
              value={currentEmp?.employeeCode || ""}
              disabled
              className="w-24 h-6 px-2 bg-white border border-[#8da4be] rounded-xs font-mono font-bold"
            />
            <input 
              type="text" 
              value={currentEmp?.fullName || ""}
              disabled
              className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-semibold text-slate-900"
            />
          </div>

          {/* Position */}
          <div className="flex items-center">
            <label className="w-36 text-slate-700 font-bold shrink-0">Position</label>
            <input 
              type="text" 
              value={currentEmp?.designation || "GUEST SERVICE AGENT"} 
              disabled
              className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-semibold text-slate-900"
            />
          </div>

          {/* Hiring Date */}
          <div className="flex items-center">
            <label className="w-36 text-slate-700 font-bold shrink-0">Hiring Date</label>
            <input 
              type="text" 
              value={currentEmp?.joiningDate || "2024-01-15"} 
              disabled
              className="w-40 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-mono font-semibold"
            />
          </div>

          {/* Leave Code & Description */}
          <div className="flex items-center gap-1">
            <label className="w-36 text-slate-700 font-bold shrink-0">Leave Code</label>
            <input 
              type="text" 
              value={leaveCode}
              onChange={(e) => setLeaveCode(e.target.value)}
              className="w-16 h-6 px-2 bg-white border border-[#8da4be] rounded-xs font-mono font-bold text-center"
            />
            <input 
              type="text" 
              value={leaveDesc}
              onChange={(e) => setLeaveDesc(e.target.value)}
              className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-semibold text-slate-900"
            />
          </div>

          {/* From, To, Days Count, Checkbox */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 flex-1">
              <label className="w-36 text-slate-700 font-bold shrink-0">From</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-1 flex-1">
              <label className="text-slate-700 font-bold shrink-0">To</label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <label className="w-36 text-slate-700 font-bold shrink-0">Days Count</label>
              <input 
                type="text" 
                value={daysCount}
                onChange={(e) => setDaysCount(e.target.value)}
                className="w-20 h-6 px-2 bg-white border border-[#8da4be] rounded-xs font-mono font-bold text-center text-blue-900"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <input 
                type="checkbox" 
                id="req-return"
                checked={isRequiredReturnNotification}
                onChange={(e) => setIsRequiredReturnNotification(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <label htmlFor="req-return" className="text-slate-700 font-bold cursor-pointer">
                Required Return Notification (إخطار عودة للعمل)
              </label>
            </div>
          </div>

          {/* Comment */}
          <div className="flex items-center">
            <label className="w-36 text-slate-700 font-bold shrink-0">Comment</label>
            <input 
              type="text" 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="flex-1 h-6 px-2 bg-white border border-[#8da4be] rounded-xs"
            />
          </div>

          {/* Telemetry Balances Section (3 Yellow Boxes) */}
          <div className="pt-4 border-t border-[#bdcadb] space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label className="text-slate-700 font-bold">Balance Until End of 2026/October with All Consumption</label>
              <input 
                type="text" 
                value={balanceConsumed} 
                disabled 
                className="w-20 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-mono font-bold text-center text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-slate-700 font-bold">Balance Until End of 2026/October</label>
              <input 
                type="text" 
                value={balanceMonth} 
                disabled 
                className="w-20 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-mono font-bold text-center text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-slate-700 font-bold">Actual Balance until End of Year</label>
              <input 
                type="text" 
                value={balanceYearEnd} 
                disabled 
                className="w-20 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-mono font-bold text-center text-emerald-800"
              />
            </div>
          </div>
        </div>

        {/* ─── 4. FOOTER ──────────────────────────────────────────────── */}
        <div className="bg-[#e6eef8] border-t border-[#bdcadb] px-3 py-1.5 flex items-center justify-end text-xs font-mono">
          <button 
            onClick={onClose}
            className="px-4 py-1 bg-white hover:bg-slate-100 border border-[#8da4be] rounded text-slate-700 font-bold font-sans cursor-pointer"
          >
            {ar ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
