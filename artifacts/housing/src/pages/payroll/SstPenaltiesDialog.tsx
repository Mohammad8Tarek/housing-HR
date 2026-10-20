import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { 
  X, 
  Minus, 
  Square, 
  FileText, 
  Edit3, 
  Trash2, 
  Save, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Scale,
  Calendar,
  AlertTriangle
} from "lucide-react";

export interface SstPenaltyRecord {
  s: number;
  penaltyCode: string;
  description: string;
  date: string;
  days: number;
  period: string;
  abate: string;
  addBy: string;
  addDate: string;
}

interface SstPenaltiesDialogProps {
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
  onSavePenalty?: (penaltyData: any) => Promise<void>;
  propertyName?: string;
}

export function SstPenaltiesDialog({
  isOpen,
  onClose,
  employees,
  currentIndex,
  onNavigate,
  onSavePenalty,
  propertyName = "SunRise Meraki Sharm Casual",
}: SstPenaltiesDialogProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const currentEmp = employees[currentIndex] || null;
  const totalCount = employees.length;
  const displayIndex = totalCount > 0 ? currentIndex + 1 : 0;

  // Penalty entry form
  const [penaltyCode, setPenaltyCode] = useState("01");
  const [penaltyDesc, setPenaltyDesc] = useState("تأخير عن مواعيد العمل الرسمية (15 - 30 دقيقة)");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expirationDate, setExpirationDate] = useState("2026-12-31");
  const [daysDeduction, setDaysDeduction] = useState("1.00");
  const [calcPeriod, setCalcPeriod] = useState("10");
  const [calcNumber, setCalcNumber] = useState("1");
  const [amountValue, setAmountValue] = useState("150.00");
  const [eventPlace, setEventPlace] = useState("Main Lobby / Reception");
  const [eventTime, setEventTime] = useState("08:35 AM");
  const [eventDescription, setEventDescription] = useState("Late arrival for morning briefing without prior authorization.");
  const [isSaving, setIsSaving] = useState(false);

  // Previous penalties grid
  const [penaltiesList, setPenaltiesList] = useState<SstPenaltyRecord[]>([
    {
      s: 1,
      penaltyCode: "01",
      description: "تأخير عن مواعيد العمل الرسمية",
      date: "2026-08-14",
      days: 0.5,
      period: "2026/08",
      abate: "No",
      addBy: "admin",
      addDate: "2026-08-15"
    },
    {
      s: 2,
      penaltyCode: "04",
      description: "مخالفة معايير الزي الفندقي الموحد Grooming",
      date: "2026-09-02",
      days: 1.0,
      period: "2026/09",
      abate: "No",
      addBy: "admin",
      addDate: "2026-09-03"
    }
  ]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!currentEmp) return;
    try {
      setIsSaving(true);
      const newPenalty: SstPenaltyRecord = {
        s: penaltiesList.length + 1,
        penaltyCode,
        description: penaltyDesc,
        date: eventDate,
        days: parseFloat(daysDeduction) || 1.0,
        period: `2026/${calcPeriod}`,
        abate: "No",
        addBy: "admin",
        addDate: new Date().toISOString().split("T")[0]
      };

      if (onSavePenalty) {
        await onSavePenalty({
          employeeId: currentEmp.id,
          employeeCode: currentEmp.employeeCode,
          penaltyCode,
          reason: eventDescription,
          daysDeducted: newPenalty.days,
          amountDeducted: parseFloat(amountValue) || 0,
          periodMonth: parseInt(calcPeriod),
          periodYear: 2026,
          eventDate,
          eventPlace,
        });
      }

      setPenaltiesList([...penaltiesList, newPenalty]);
      toast.success(ar ? "تم تسجيل الجزاء الإداري بنجاح" : "Penalty recorded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save penalty");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2 select-none overflow-y-auto">
      {/* WINDOW FRAME (MDI Authentic Windows 7 / XP Form) */}
      <div 
        className="w-full max-w-4xl bg-[#e6eef8] border-2 border-[#5b82a6] rounded-t-lg shadow-2xl flex flex-col overflow-hidden text-slate-800 font-sans"
        style={{ minHeight: "580px" }}
      >
        {/* ─── 1. WINDOW TITLE BAR ────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#20517f] via-[#3a75a7] to-[#1f4e79] text-white px-3 py-1 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-rose-600 rounded flex items-center justify-center text-[10px] font-black border border-white/50 text-white shadow-2xs">
              P
            </div>
            <span className="text-xs font-bold tracking-tight">
              Penalties — {propertyName}
            </span>
            <span className="text-[11px] text-blue-200 font-mono">
              [Labor Law 12 Disciplinary Form]
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
              <span>{isSaving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ الجزاء" : "Save Penalty")}</span>
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

        {/* ─── 3. TOP FORM FIELDS (Matching Live TSplus Penalties Window) ─── */}
        <div className="p-3 bg-[#e6eef8] border-b border-[#bdcadb] space-y-1.5 text-xs">
          {/* Employee Code & Name */}
          <div className="flex items-center gap-1">
            <label className="w-32 text-slate-700 font-bold shrink-0">Employee Code</label>
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
            <label className="w-32 text-slate-700 font-bold shrink-0">Position</label>
            <input 
              type="text" 
              value={currentEmp?.designation || "GUEST SERVICE AGENT"} 
              disabled
              className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-semibold text-slate-900"
            />
          </div>

          {/* Hiring Date */}
          <div className="flex items-center">
            <label className="w-32 text-slate-700 font-bold shrink-0">Hiring Date</label>
            <input 
              type="text" 
              value={currentEmp?.joiningDate || "2024-01-15"} 
              disabled
              className="w-40 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-mono font-semibold text-slate-900"
            />
          </div>

          {/* Penalty Code & Description */}
          <div className="flex items-center gap-1">
            <label className="w-32 text-slate-700 font-bold shrink-0">Penalty Code</label>
            <input 
              type="text" 
              value={penaltyCode}
              onChange={(e) => setPenaltyCode(e.target.value)}
              className="w-16 h-6 px-2 bg-white border border-[#8da4be] rounded-xs font-mono font-bold text-center"
            />
            <input 
              type="text" 
              value={penaltyDesc}
              onChange={(e) => setPenaltyDesc(e.target.value)}
              className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-semibold text-slate-900"
            />
          </div>

          {/* Event Date & Expiration Date */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 flex-1">
              <label className="w-32 text-slate-700 font-bold shrink-0">Event Date</label>
              <input 
                type="date" 
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-1 flex-1">
              <label className="text-slate-700 font-bold shrink-0">Expiration Date</label>
              <input 
                type="date" 
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
              />
            </div>
          </div>

          {/* Once, Day, Description */}
          <div className="flex items-center gap-2">
            <label className="w-32 text-slate-700 font-bold shrink-0">Once</label>
            <input 
              type="text" 
              defaultValue="1" 
              className="w-12 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
            />
            <span className="font-bold text-slate-700">Day</span>
            <input 
              type="text" 
              value={daysDeduction}
              onChange={(e) => setDaysDeduction(e.target.value)}
              className="w-14 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono font-bold text-rose-700"
            />
            <input 
              type="text" 
              value={`خصم ${daysDeduction} يوم من الراتب الأساسي`}
              disabled
              className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs font-semibold"
            />
          </div>

          {/* Calculation Period & Amount Value */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="w-32 text-slate-700 font-bold shrink-0">Calculation Period</label>
              <input 
                type="text" 
                value={calcPeriod}
                onChange={(e) => setCalcPeriod(e.target.value)}
                className="w-12 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
              />
              <input 
                type="text" 
                value={calcNumber}
                onChange={(e) => setCalcNumber(e.target.value)}
                className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
              />
            </div>
            <div className="flex items-center gap-1 flex-1">
              <label className="text-slate-700 font-bold shrink-0">Amount Value</label>
              <input 
                type="text" 
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                className="w-28 h-6 px-2 bg-white border border-[#8da4be] rounded-xs font-mono font-bold text-end text-rose-800"
              />
              <span className="font-bold text-slate-600">EGP</span>
            </div>
          </div>

          {/* Event Place & Event Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 flex-1">
              <label className="w-32 text-slate-700 font-bold shrink-0">Event Place</label>
              <input 
                type="text" 
                value={eventPlace}
                onChange={(e) => setEventPlace(e.target.value)}
                className="w-full h-6 px-2 bg-white border border-[#8da4be] rounded-xs"
              />
            </div>
            <div className="flex items-center gap-1 w-44">
              <label className="text-slate-700 font-bold shrink-0">Event Time</label>
              <input 
                type="text" 
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
              />
            </div>
          </div>

          {/* Event Description */}
          <div className="flex items-start">
            <label className="w-32 text-slate-700 font-bold shrink-0 pt-1">Event Description</label>
            <textarea 
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              rows={2}
              className="flex-1 p-1 bg-white border border-[#8da4be] rounded-xs text-xs"
            />
          </div>
        </div>

        {/* ─── 4. BOTTOM PREVIOUS PENALTIES GRID ───────────────────────── */}
        <div className="flex-1 bg-white p-2 overflow-y-auto">
          <div className="border border-[#8da4be] rounded shadow-2xs overflow-hidden">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-[#0f2942] text-white font-bold select-none text-[11px]">
                <tr>
                  <th className="p-1 border-e border-[#1a3f63] w-8 text-center">S.</th>
                  <th className="p-1 border-e border-[#1a3f63] w-20 text-center">Penalty Code</th>
                  <th className="p-1 border-e border-[#1a3f63]">Description</th>
                  <th className="p-1 border-e border-[#1a3f63] w-20 text-center">Date</th>
                  <th className="p-1 border-e border-[#1a3f63] w-14 text-center">Days</th>
                  <th className="p-1 border-e border-[#1a3f63] w-16 text-center">Period</th>
                  <th className="p-1 border-e border-[#1a3f63] w-14 text-center">Abate</th>
                  <th className="p-1 border-e border-[#1a3f63] w-20 text-center">Add By</th>
                  <th className="p-1 w-20 text-center">Add Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0dbe5] font-mono text-[11px]">
                {penaltiesList.map((p) => (
                  <tr key={p.s} className="hover:bg-rose-50/50 transition-colors">
                    <td className="p-1 text-center bg-slate-50 border-e border-[#d0dbe5] font-bold">{p.s}</td>
                    <td className="p-1 text-center font-bold text-rose-700 border-e border-[#d0dbe5]">{p.penaltyCode}</td>
                    <td className="p-1 font-sans font-semibold text-slate-800 border-e border-[#d0dbe5]">{p.description}</td>
                    <td className="p-1 text-center border-e border-[#d0dbe5]">{p.date}</td>
                    <td className="p-1 text-center font-bold text-rose-800 border-e border-[#d0dbe5]">{p.days}</td>
                    <td className="p-1 text-center border-e border-[#d0dbe5]">{p.period}</td>
                    <td className="p-1 text-center border-e border-[#d0dbe5]">{p.abate}</td>
                    <td className="p-1 text-center text-blue-900 font-bold border-e border-[#d0dbe5]">{p.addBy}</td>
                    <td className="p-1 text-center">{p.addDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── 5. FOOTER ──────────────────────────────────────────────── */}
        <div className="bg-[#e6eef8] border-t border-[#bdcadb] px-3 py-1.5 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-600">
            Penalties count for employee: {penaltiesList.length} records
          </div>
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
