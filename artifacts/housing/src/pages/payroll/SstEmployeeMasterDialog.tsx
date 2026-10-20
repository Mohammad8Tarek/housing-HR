import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { 
  X, 
  Minus, 
  Square, 
  FileText, 
  Edit3, 
  Trash2, 
  Printer, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Save,
  Plus,
  RefreshCw,
  Coins,
  Shield,
  HelpCircle
} from "lucide-react";
import { PermissionGate } from "@/components/ui/permission-gate";

export interface SstEmployee {
  id: number;
  employeeCode: string;
  fullName: string;
  fullNameAr?: string;
  baseSalary: string | number;
  insuranceSalary?: string | number;
  isInsured?: boolean;
  insuranceNumber?: string;
  departmentId?: number;
  department?: string;
  designationId?: number;
  designation?: string;
  employmentType?: string;
  contractType?: string;
  joiningDate?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  bankName?: string;
  bankAccountNumber?: string;
  iban?: string;
  biometricId?: string;
  probationEndDate?: string;
  salaryBands?: Record<number, number>;
}

interface SstEmployeeMasterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employees: SstEmployee[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onSaveEmployee: (employee: SstEmployee) => Promise<void>;
  onDeleteEmployee?: (id: number) => Promise<void>;
  onPrintSlip?: (employee: SstEmployee) => void;
  propertyName?: string;
}

// 30 Standard SST Payroll Bands (Solutions Software Technology)
export const SST_30_BANDS = [
  { s: 1, code: "01", descEn: "Basic Salary", descAr: "الراتب الأساسي", defaultPct: 1.0, insure: "Basic", tax: "Yes" },
  { s: 2, code: "02", descEn: "Cost of Living Allowance", descAr: "علاوة غلاء معيشة", defaultPct: 0.15, insure: "Variable", tax: "Yes" },
  { s: 3, code: "03", descEn: "Social Increase 2008", descAr: "علاوة اجتماعية 2008", defaultPct: 0.05, insure: "None", tax: "No" },
  { s: 4, code: "04", descEn: "Social Increase 2011", descAr: "علاوة اجتماعية 2011", defaultPct: 0.05, insure: "None", tax: "No" },
  { s: 5, code: "05", descEn: "Special Added Allowance", descAr: "علاوة خاصة إضافية", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 6, code: "06", descEn: "Nature of Work Allowance", descAr: "بدل طبيعة عمل فندقية", defaultPct: 0.10, insure: "Variable", tax: "Yes" },
  { s: 7, code: "07", descEn: "Housing Allowance Live-Out", descAr: "بدل سكن خارجي", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 8, code: "08", descEn: "Meal Allowance", descAr: "بدل وجبة غذائية", defaultPct: 0.08, insure: "Variable", tax: "No" },
  { s: 9, code: "09", descEn: "Uniform Allowance", descAr: "بدل ملابس وتشغيل", defaultPct: 0.0, insure: "None", tax: "No" },
  { s: 10, code: "10", descEn: "Labour Day Grant", descAr: "منحة عيد العمال", defaultPct: 0.0, insure: "None", tax: "No" },
  { s: 11, code: "11", descEn: "12% Tronc Guarantee", descAr: "ضمان نسبة الـ 12% خدمة", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 12, code: "12", descEn: "Overtime Base Allowance", descAr: "أجر ساعات إضافية مقطوعة", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 13, code: "13", descEn: "Representation Allowance", descAr: "بدل تمثيل وضيافة", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 14, code: "14", descEn: "Transportation Allowance", descAr: "بدل انتقالات وسفر", defaultPct: 0.0, insure: "None", tax: "No" },
  { s: 15, code: "15", descEn: "Mobile Allowance", descAr: "بدل اتصالات ومحمول", defaultPct: 0.0, insure: "None", tax: "No" },
  { s: 16, code: "16", descEn: "Remote Area Allowance (Sharm)", descAr: "بدل مناطق نائية شرم الشيخ", defaultPct: 0.12, insure: "Variable", tax: "Yes" },
  { s: 17, code: "17", descEn: "Night Shift Differential", descAr: "بدل نوبتجية ليلية", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 18, code: "18", descEn: "Cashier Custody Risk", descAr: "بدل عهدة ومخاطر خزينة", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 19, code: "19", descEn: "Foreign Language Allowance", descAr: "بدل لغات أجنبية", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 20, code: "20", descEn: "Executive Car Allowance", descAr: "بدل سيارة وانتقال قيادي", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 21, code: "21", descEn: "Hotel Monthly Incentive", descAr: "حافز أداء الفندق الشهري", defaultPct: 0.05, insure: "Variable", tax: "Yes" },
  { s: 22, code: "22", descEn: "Seniority Loyalty Increment", descAr: "علاوة أقدمية وولاء", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 23, code: "23", descEn: "Public Holiday Premium", descAr: "أجر عمل العطلات الرسمية", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 24, code: "24", descEn: "Day-Off Replacement Pay", descAr: "بدل راحة أسبوعية مستبدل", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 25, code: "25", descEn: "Punctuality Incentive", descAr: "حافز انتظام وعدم تأخير", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 26, code: "26", descEn: "Food Safety HACCP Bonus", descAr: "مكافأة معايير سلامة الأغذية", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 27, code: "27", descEn: "Quarterly Tronc Adjustment", descAr: "تسوية نسبة خدمة ربع سنوية", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
  { s: 28, code: "28", descEn: "Statutory 7% Annual Increment", descAr: "العلاوة الدورية السنوية 7%", defaultPct: 0.07, insure: "Basic", tax: "Yes" },
  { s: 29, code: "29", descEn: "Exceptional Merit Award", descAr: "مكافأة تشجيعية استثنائية", defaultPct: 0.0, insure: "None", tax: "Yes" },
  { s: 30, code: "30", descEn: "Other Fixed Allowances", descAr: "بدلات ثابتة أخرى", defaultPct: 0.0, insure: "Variable", tax: "Yes" },
];

export function SstEmployeeMasterDialog({
  isOpen,
  onClose,
  employees,
  currentIndex,
  onNavigate,
  onSaveEmployee,
  onDeleteEmployee,
  onPrintSlip,
  propertyName = "SunRise Meraki Sharm Casual",
}: SstEmployeeMasterDialogProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [activeSubTab, setActiveSubTab] = useState<"salary" | "social" | "comment" | "health">("salary");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active employee state
  const currentEmp = employees[currentIndex] || null;

  // Local editable form fields
  const [formData, setFormData] = useState<Partial<SstEmployee>>({});
  const [bandAmounts, setBandAmounts] = useState<Record<number, number>>({});
  const [isSeparate, setIsSeparate] = useState(false);

  // Comments state for Tab 3
  const [publicComments, setPublicComments] = useState<Array<{ s: number; comment: string; user: string; date: string }>>([
    { s: 1, comment: "Annual salary evaluation completed as per HR budget", user: "admin", date: "2026-09-15" }
  ]);
  const [privateComments, setPrivateComments] = useState<Array<{ s: number; comment: string; date: string }>>([
    { s: 1, comment: "Eligible for supervisor promotion review next cycle", date: "2026-08-01" }
  ]);

  // Sync formData whenever currentEmp changes
  useEffect(() => {
    if (currentEmp) {
      setFormData({
        ...currentEmp,
        baseSalary: currentEmp.baseSalary || 0,
        insuranceSalary: currentEmp.insuranceSalary || currentEmp.baseSalary || 0,
      });

      // Populate 30 bands based on base salary
      const base = Number(currentEmp.baseSalary) || 450;
      const initialBands: Record<number, number> = {};
      SST_30_BANDS.forEach(b => {
        if (b.s === 1) {
          initialBands[b.s] = Math.round(base * 0.70);
        } else if (b.s === 2) {
          initialBands[b.s] = Math.round(base * 0.15);
        } else if (b.s === 6) {
          initialBands[b.s] = Math.round(base * 0.10);
        } else if (b.s === 8) {
          initialBands[b.s] = Math.round(base * 0.05);
        } else {
          initialBands[b.s] = 0;
        }
      });
      setBandAmounts(initialBands);
      setIsEditing(false);
    }
  }, [currentIndex, currentEmp?.id]);

  // Dynamic Total Salary calculation from 30 bands
  const totalSalary = useMemo(() => {
    return Object.values(bandAmounts).reduce((acc, v) => acc + (Number(v) || 0), 0);
  }, [bandAmounts]);

  if (!isOpen) return null;

  const totalCount = employees.length;
  const displayIndex = totalCount > 0 ? currentIndex + 1 : 0;

  const handleBandChange = (serial: number, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    setBandAmounts(prev => ({ ...prev, [serial]: val }));
  };

  const handleSave = async () => {
    if (!currentEmp) return;
    try {
      setIsSaving(true);
      await onSaveEmployee({
        ...currentEmp,
        ...formData,
        baseSalary: totalSalary > 0 ? totalSalary : currentEmp.baseSalary,
        salaryBands: bandAmounts,
      } as SstEmployee);
      setIsEditing(false);
      toast.success(ar ? "تم حفظ بيانات الموظف بنجاح" : "Employee master record saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save employee");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-2 select-none overflow-y-auto">
      {/* WINDOW FRAME (MDI Authentic Windows 7 / XP Form) */}
      <div 
        className="w-full max-w-5xl bg-[#e6eef8] border-2 border-[#5b82a6] rounded-t-lg shadow-2xl flex flex-col overflow-hidden text-slate-800 font-sans"
        style={{ minHeight: "680px" }}
      >
        {/* ─── 1. WINDOW TITLE BAR ────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#20517f] via-[#3a75a7] to-[#1f4e79] text-white px-3 py-1 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            {/* SST ICON */}
            <div className="w-4 h-4 bg-emerald-600 rounded flex items-center justify-center text-[10px] font-black border border-white/50 text-white shadow-2xs">
              S
            </div>
            <span className="text-xs font-bold tracking-tight">
              Employee — {propertyName}
            </span>
            <span className="text-[11px] text-blue-200 font-mono">
              [SST 26.0 Master File]
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

        {/* ─── 2. TOP CLASSIC SST TOOLBAR ────────────────────────────── */}
        <div className="bg-[#f0f4f9] border-b border-[#bdcadb] px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
          {/* Action Buttons Left */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                setIsEditing(true);
                toast.info(ar ? "وضع إدخال موظف جديد" : "New employee entry mode");
              }}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-800 border border-[#b8c5d4] rounded shadow-2xs flex items-center gap-1 cursor-pointer font-semibold"
              title={ar ? "جديد (New)" : "New Record"}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>{ar ? "جديد" : "New"}</span>
            </button>

            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-2.5 py-1 text-slate-800 border border-[#b8c5d4] rounded shadow-2xs flex items-center gap-1 cursor-pointer font-semibold ${
                isEditing ? "bg-amber-100 border-amber-400 text-amber-900" : "bg-white hover:bg-amber-50"
              }`}
              title={ar ? "تعديل (Edit)" : "Edit Record"}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>{isEditing ? (ar ? "تعديل..." : "Editing...") : (ar ? "تعديل" : "Edit")}</span>
            </button>

            {isEditing && (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 rounded shadow-2xs flex items-center gap-1 cursor-pointer font-bold animate-pulse"
                title={ar ? "حفظ التغييرات" : "Save Changes"}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}</span>
              </button>
            )}

            <button 
              onClick={() => {
                if (currentEmp && onDeleteEmployee) {
                  if (confirm(ar ? `هل أنت متأكد من حذف الموظف ${currentEmp.fullName}؟` : `Delete employee ${currentEmp.fullName}?`)) {
                    onDeleteEmployee(currentEmp.id);
                  }
                }
              }}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-slate-800 border border-[#b8c5d4] rounded shadow-2xs flex items-center gap-1 cursor-pointer"
              title={ar ? "حذف (Delete)" : "Delete Record"}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{ar ? "حذف" : "Delete"}</span>
            </button>

            <button 
              onClick={() => currentEmp && onPrintSlip?.(currentEmp)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-[#b8c5d4] rounded shadow-2xs flex items-center gap-1 cursor-pointer"
              title={ar ? "طباعة مفردات المرتب" : "Print Salary Slip"}
            >
              <Printer className="w-3.5 h-3.5 text-slate-700" />
              <span>{ar ? "طباعة" : "Print"}</span>
            </button>

            <button 
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-[#b8c5d4] rounded shadow-2xs flex items-center gap-1 cursor-pointer"
              title={ar ? "بحث بالاسم أو الكود" : "Search Employee"}
            >
              <Search className="w-3.5 h-3.5 text-blue-700" />
              <span>{ar ? "بحث" : "Search"}</span>
            </button>
          </div>

          {/* Authentic Navigation Green Circles & Counter */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button 
              disabled={currentIndex <= 0}
              onClick={() => onNavigate(0)}
              className="w-7 h-7 bg-white hover:bg-emerald-50 border border-[#b8c5d4] rounded-full flex items-center justify-center text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              title={ar ? "الأول" : "First Record"}
            >
              <ChevronsLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button 
              disabled={currentIndex <= 0}
              onClick={() => onNavigate(currentIndex - 1)}
              className="w-7 h-7 bg-white hover:bg-emerald-50 border border-[#b8c5d4] rounded-full flex items-center justify-center text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              title={ar ? "السابق" : "Previous Record"}
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>

            {/* SST RECORD COUNTER (0 / 623) */}
            <div className="px-3 py-1 bg-white border border-[#b8c5d4] rounded text-slate-800 font-bold min-w-[70px] text-center shadow-inner">
              {displayIndex} / {totalCount}
            </div>

            <button 
              disabled={currentIndex >= totalCount - 1}
              onClick={() => onNavigate(currentIndex + 1)}
              className="w-7 h-7 bg-white hover:bg-emerald-50 border border-[#b8c5d4] rounded-full flex items-center justify-center text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              title={ar ? "التالي" : "Next Record"}
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>

            <button 
              disabled={currentIndex >= totalCount - 1}
              onClick={() => onNavigate(totalCount - 1)}
              className="w-7 h-7 bg-white hover:bg-emerald-50 border border-[#b8c5d4] rounded-full flex items-center justify-center text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              title={ar ? "الأخير" : "Last Record"}
            >
              <ChevronsRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* ─── 3. TOP FORM HEADER (Employee Profile Data) ─────────────── */}
        <div className="p-3 bg-[#e6eef8] border-b border-[#bdcadb]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {/* LEFT COLUMN */}
            <div className="space-y-1.5">
              {/* Employee Code */}
              <div className="flex items-center">
                <label className="w-28 text-slate-700 font-bold shrink-0">Employee Code</label>
                <input 
                  type="text" 
                  value={formData.employeeCode || currentEmp?.employeeCode || ""}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  disabled={!isEditing}
                  className="w-28 h-6 px-2 bg-white border border-[#8da4be] rounded-xs font-mono font-bold text-slate-900"
                />
              </div>

              {/* Name (English) */}
              <div className="flex items-center">
                <label className="w-28 text-slate-700 font-bold shrink-0">Name</label>
                <input 
                  type="text" 
                  value={formData.fullName || currentEmp?.fullName || ""}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1 h-6 px-2 bg-white border border-[#8da4be] rounded-xs font-semibold text-slate-900"
                />
              </div>

              {/* Arabic Name */}
              <div className="flex items-center">
                <label className="w-28 text-slate-700 font-bold shrink-0">Arabic Name</label>
                <input 
                  type="text" 
                  value={formData.fullNameAr || currentEmp?.fullNameAr || ""}
                  onChange={(e) => setFormData({ ...formData, fullNameAr: e.target.value })}
                  disabled={!isEditing}
                  dir="rtl"
                  className="flex-1 h-6 px-2 bg-white border border-[#8da4be] rounded-xs font-semibold text-slate-900"
                />
              </div>

              {/* Location [Code] [Yellow Desc] */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Location</label>
                <input 
                  type="text" 
                  defaultValue="01" 
                  disabled 
                  className="w-14 h-6 px-1.5 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  defaultValue="SHARM EL-SHEIKH RESORTS" 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Division [Code] [Yellow Desc] */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Division</label>
                <input 
                  type="text" 
                  defaultValue="02" 
                  disabled 
                  className="w-14 h-6 px-1.5 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  defaultValue="ROOMS & OPERATIONS" 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Department [Code] [Yellow Desc] */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Department</label>
                <input 
                  type="text" 
                  defaultValue="004" 
                  disabled 
                  className="w-14 h-6 px-1.5 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  value={currentEmp?.department || "FRONT OFFICE & GUEST EXP"} 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Section [Code] [Yellow Desc] */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Section</label>
                <input 
                  type="text" 
                  defaultValue="0010" 
                  disabled 
                  className="w-14 h-6 px-1.5 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  defaultValue="RECEPTION DESK" 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Position [Code] [Yellow Desc] */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Position</label>
                <input 
                  type="text" 
                  defaultValue="0105" 
                  disabled 
                  className="w-14 h-6 px-1.5 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  value={currentEmp?.designation || "GUEST SERVICE AGENT"} 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Level [Code] [Yellow Desc] */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Level</label>
                <input 
                  type="text" 
                  defaultValue="3" 
                  disabled 
                  className="w-14 h-6 px-1.5 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  defaultValue="Junior Associate / Operational" 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Gender & Security Level */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <label className="w-28 text-slate-700 font-bold shrink-0">Gender</label>
                  <select 
                    value={formData.gender || currentEmp?.gender || "male"}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    disabled={!isEditing}
                    className="w-24 h-6 px-1.5 bg-white border border-[#8da4be] rounded-xs font-semibold text-xs"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-slate-700 font-bold">Security Level</label>
                  <input 
                    type="text" 
                    defaultValue="1" 
                    disabled 
                    className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-1.5">
              {/* Marital Status */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Marital Status</label>
                <input 
                  type="text" 
                  defaultValue="01" 
                  disabled 
                  className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  value={currentEmp?.maritalStatus || "Single"} 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Currency */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Currency</label>
                <input 
                  type="text" 
                  defaultValue="EGP" 
                  disabled 
                  className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  defaultValue="Egyptian Pound (EGP)" 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Nationality */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Nationality</label>
                <input 
                  type="text" 
                  defaultValue="EGY" 
                  disabled 
                  className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  defaultValue="Egyptian (مصري)" 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Vacation Method */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Vacation Method</label>
                <input 
                  type="text" 
                  defaultValue="01" 
                  disabled 
                  className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  defaultValue="4-Bucket Rollover (Annual/Dayoff/Holiday/Comp)" 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Contract Code */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">Contract Code</label>
                <input 
                  type="text" 
                  defaultValue="001" 
                  disabled 
                  className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  value={currentEmp?.contractType || "Full-Time Hospitality (Labor Law 12)"} 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* General Type */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">General Type</label>
                <input 
                  type="text" 
                  defaultValue={currentEmp?.employmentType === "casual" ? "CAS" : "REG"} 
                  disabled 
                  className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  value={currentEmp?.employmentType === "casual" ? "Casual Daily Staff (يومية)" : "Regular Permanent Staff (مثبت)"} 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* 12% Tronc Weight */}
              <div className="flex items-center gap-1">
                <label className="w-28 text-slate-700 font-bold shrink-0">12 %</label>
                <input 
                  type="text" 
                  defaultValue="1.00" 
                  disabled 
                  className="w-10 h-6 px-1 bg-white border border-[#8da4be] rounded-xs text-center font-mono"
                />
                <input 
                  type="text" 
                  defaultValue="Full Service Charge Point (1.00 Tronc Unit)" 
                  disabled 
                  className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] rounded-xs text-slate-800 font-semibold truncate"
                />
              </div>

              {/* Hiring Date & Probation Date */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <label className="w-28 text-slate-700 font-bold shrink-0">Hiring Date</label>
                  <input 
                    type="date" 
                    value={formData.joiningDate || currentEmp?.joiningDate || "2024-01-15"} 
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    disabled={!isEditing}
                    className="w-full h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <label className="text-slate-700 font-bold shrink-0 text-[11px]">Probation</label>
                  <input 
                    type="date" 
                    value={formData.probationEndDate || currentEmp?.probationEndDate || "2024-04-15"} 
                    disabled={!isEditing}
                    className="w-full h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
                  />
                </div>
              </div>

              {/* Contract Date & Expire Date */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <label className="w-28 text-slate-700 font-bold shrink-0">Contract Date</label>
                  <input 
                    type="date" 
                    defaultValue="2024-01-15" 
                    disabled={!isEditing}
                    className="w-full h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 flex-1">
                  <label className="text-slate-700 font-bold shrink-0 text-[11px]">Expire Date</label>
                  <input 
                    type="date" 
                    defaultValue="2027-01-14" 
                    disabled={!isEditing}
                    className="w-full h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div className="flex items-center">
                <label className="w-28 text-slate-700 font-bold shrink-0">Birth Date</label>
                <input 
                  type="date" 
                  value={formData.dateOfBirth || currentEmp?.dateOfBirth || "1994-06-20"} 
                  disabled={!isEditing}
                  className="w-40 h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] rounded-xs font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. SUB-TABS NAVIGATION (4 SST Sub-Tabs) ────────────────── */}
        <div className="bg-[#d2dfea] border-b border-[#a9baca] px-3 pt-2 flex items-center gap-1 text-xs">
          <button 
            onClick={() => setActiveSubTab("salary")}
            className={`px-4 py-1.5 rounded-t-md font-bold transition-colors border-t border-x cursor-pointer ${
              activeSubTab === "salary"
                ? "bg-white border-[#a9baca] border-b-transparent text-[#0f2942] shadow-xs"
                : "bg-[#c0d4ec] hover:bg-[#d0e0f2] border-transparent text-slate-700"
            }`}
          >
            {ar ? "تفاصيل الراتب (Salary Details)" : "Salary Details"}
          </button>

          <button 
            onClick={() => setActiveSubTab("social")}
            className={`px-4 py-1.5 rounded-t-md font-bold transition-colors border-t border-x cursor-pointer ${
              activeSubTab === "social"
                ? "bg-white border-[#a9baca] border-b-transparent text-[#0f2942] shadow-xs"
                : "bg-[#c0d4ec] hover:bg-[#d0e0f2] border-transparent text-slate-700"
            }`}
          >
            {ar ? "التأمينات الاجتماعية (Social Insurance)" : "Social Insurance"}
          </button>

          <button 
            onClick={() => setActiveSubTab("comment")}
            className={`px-4 py-1.5 rounded-t-md font-bold transition-colors border-t border-x cursor-pointer ${
              activeSubTab === "comment"
                ? "bg-white border-[#a9baca] border-b-transparent text-[#0f2942] shadow-xs"
                : "bg-[#c0d4ec] hover:bg-[#d0e0f2] border-transparent text-slate-700"
            }`}
          >
            {ar ? "الملاحظات (Comment)" : "Comment"}
          </button>

          <button 
            onClick={() => setActiveSubTab("health")}
            className={`px-4 py-1.5 rounded-t-md font-bold transition-colors border-t border-x cursor-pointer ${
              activeSubTab === "health"
                ? "bg-white border-[#a9baca] border-b-transparent text-[#0f2942] shadow-xs"
                : "bg-[#c0d4ec] hover:bg-[#d0e0f2] border-transparent text-slate-700"
            }`}
          >
            {ar ? "التأمين الصحي الشامل (Comprehensive Health)" : "Comprehensive Health Insurance"}
          </button>
        </div>

        {/* ─── 5. SUB-TAB CONTENT WORKSPACE ───────────────────────────── */}
        <div className="flex-1 bg-white p-3 overflow-y-auto">
          {/* TAB 1: SALARY DETAILS (Authentic 30-Band SST Grid) */}
          {activeSubTab === "salary" && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                {/* 30-BANDS TABLE GRID */}
                <div className="flex-1 border border-[#8da4be] rounded shadow-2xs overflow-hidden max-h-[340px] overflow-y-auto">
                  <table className="w-full text-xs text-left rtl:text-right border-collapse">
                    <thead className="bg-[#1b7e3e] text-white font-bold sticky top-0 z-10 select-none">
                      <tr>
                        <th className="p-1.5 border-e border-[#145d2e] w-10 text-center">S.</th>
                        <th className="p-1.5 border-e border-[#145d2e] w-14 text-center">Band</th>
                        <th className="p-1.5 border-e border-[#145d2e]">{ar ? "اسم البند" : "Description"}</th>
                        <th className="p-1.5 border-e border-[#145d2e] w-28 text-center">{ar ? "القيمة" : "Amount"}</th>
                        <th className="p-1.5 border-e border-[#145d2e] w-20 text-center">Insure</th>
                        <th className="p-1.5 w-16 text-center">Taxes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#d0dbe5] font-mono text-[11px]">
                      {SST_30_BANDS.map((b) => {
                        const amount = bandAmounts[b.s] ?? 0;
                        return (
                          <tr key={b.s} className="hover:bg-blue-50/70 transition-colors">
                            <td className="p-1 text-center font-bold text-slate-600 bg-slate-50 border-e border-[#d0dbe5]">
                              {b.s}
                            </td>
                            <td className="p-1 text-center font-bold text-blue-800 border-e border-[#d0dbe5]">
                              {b.code}
                            </td>
                            <td className="p-1 font-sans font-semibold text-slate-800 bg-[#ffffd2] border-e border-[#d0dbe5]">
                              {ar ? b.descAr : b.descEn}
                            </td>
                            <td className="p-0 border-e border-[#d0dbe5] bg-white">
                              <input 
                                type="number"
                                step="0.01"
                                value={amount === 0 ? "" : amount}
                                onChange={(e) => handleBandChange(b.s, e.target.value)}
                                disabled={!isEditing}
                                placeholder="0.00"
                                className="w-full h-6 px-1.5 text-right font-mono font-bold text-slate-900 border-none outline-none focus:bg-amber-50"
                              />
                            </td>
                            <td className="p-1 text-center bg-[#ffffd2] font-semibold text-slate-700 border-e border-[#d0dbe5]">
                              {b.insure}
                            </td>
                            <td className="p-1 text-center bg-[#ffffd2] font-semibold text-slate-700">
                              {b.tax}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* RIGHT SUMMARY SIDEBAR (Separate & Total Salary) */}
                <div className="w-48 bg-[#f5f8fc] border border-[#bdcadb] p-3 rounded flex flex-col gap-3 shrink-0 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="separate-chk"
                      checked={isSeparate}
                      onChange={(e) => setIsSeparate(e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <label htmlFor="separate-chk" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Separate (منفصل)
                    </label>
                  </div>

                  <div className="pt-2 border-t border-[#bdcadb]">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Salary (إجمالي الراتب)
                    </label>
                    <div className="h-8 px-2 bg-[#ffffd2] border-2 border-emerald-600 rounded flex items-center justify-end font-mono font-black text-sm text-emerald-800 shadow-inner">
                      {totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#bdcadb] text-[11px] text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Bands With Values:</span>
                      <span className="font-mono font-bold">{Object.values(bandAmounts).filter(v => v > 0).length} / 30</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Statutory 7%:</span>
                      <span className="font-mono font-bold">{bandAmounts[28] || 0} EGP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOCIAL INSURANCE (Law 148/2019 Authentic Form) */}
          {activeSubTab === "social" && (
            <div className="p-2 space-y-4 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* LEFT SIDE */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <label className="w-36 text-slate-700 font-bold shrink-0">Type</label>
                    <input type="text" defaultValue="01" disabled className="w-12 h-6 px-1 bg-white border border-[#8da4be] text-center font-mono" />
                    <input type="text" defaultValue="Private Sector (قطاع خاص فندقي)" disabled className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] font-semibold" />
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="w-36 text-slate-700 font-bold shrink-0">Insurer</label>
                    <input type="text" defaultValue="05" disabled className="w-12 h-6 px-1 bg-white border border-[#8da4be] text-center font-mono" />
                    <input type="text" defaultValue="Social Insurance Sharm El-Sheikh Office" disabled className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] font-semibold" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Employee Share (11%)</label>
                      <input 
                        type="text" 
                        value={((Number(formData.insuranceSalary || currentEmp?.insuranceSalary || 0) * 0.11)).toFixed(2) + " EGP"} 
                        disabled 
                        className="w-full h-7 px-2 bg-[#ffffd2] border border-[#8da4be] font-mono font-bold text-rose-800 text-end"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Company Share (18.75%)</label>
                      <input 
                        type="text" 
                        value={((Number(formData.insuranceSalary || currentEmp?.insuranceSalary || 0) * 0.1875)).toFixed(2) + " EGP"} 
                        disabled 
                        className="w-full h-7 px-2 bg-[#ffffd2] border border-[#8da4be] font-mono font-bold text-blue-900 text-end"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-slate-700 font-bold mb-1">Insurance Basic Salary</label>
                    <input 
                      type="text" 
                      value={(Number(formData.insuranceSalary || currentEmp?.insuranceSalary || 0) * 0.65).toFixed(2) + " EGP"} 
                      disabled 
                      className="w-full h-7 px-2 bg-[#ffffd2] border border-[#8da4be] font-mono font-bold text-slate-800 text-end"
                    />
                  </div>

                  <div>
                    <label className="block text-blue-900 font-black mb-1">Insurance Salary (Comprehensive Cap)</label>
                    <input 
                      type="text" 
                      value={Number(formData.insuranceSalary || currentEmp?.insuranceSalary || 0).toFixed(2) + " EGP"} 
                      disabled={!isEditing}
                      onChange={(e) => setFormData({ ...formData, insuranceSalary: e.target.value })}
                      className="w-full h-7 px-2 bg-[#ffffd2] border-2 border-blue-500 font-mono font-black text-blue-900 text-end"
                    />
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label className="w-36 text-slate-700 font-bold shrink-0">Insurance Date</label>
                    <input 
                      type="date" 
                      defaultValue="2024-02-01" 
                      disabled={!isEditing}
                      className="flex-1 h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-36 text-slate-700 font-bold shrink-0">Insurance Number</label>
                    <input 
                      type="text" 
                      value={formData.insuranceNumber || currentEmp?.insuranceNumber || "987456123"} 
                      onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                      disabled={!isEditing}
                      className="flex-1 h-6 px-2 bg-white border border-[#8da4be] font-mono font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <label className="w-36 text-slate-700 font-bold shrink-0">Job Code</label>
                    <input type="text" defaultValue="5120" disabled className="w-12 h-6 px-1 bg-white border border-[#8da4be] text-center font-mono" />
                    <input type="text" defaultValue="Hotel Desk Receptionist" disabled className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] font-semibold" />
                  </div>

                  <div className="flex items-center">
                    <label className="w-36 text-slate-700 font-bold shrink-0">Hire Form Number (س1)</label>
                    <input type="text" defaultValue="10442/2024" disabled={!isEditing} className="flex-1 h-6 px-2 bg-white border border-[#8da4be] font-mono" />
                  </div>

                  <div className="flex items-center">
                    <label className="w-36 text-slate-700 font-bold shrink-0">Hire Form Date</label>
                    <input type="date" defaultValue="2024-02-05" disabled={!isEditing} className="flex-1 h-6 px-1 bg-[#ffffd2] border border-[#8da4be] font-mono text-xs" />
                  </div>

                  <div className="flex items-center">
                    <label className="w-36 text-slate-700 font-bold shrink-0">Terminate Form (س6)</label>
                    <input type="text" defaultValue="—" disabled className="flex-1 h-6 px-2 bg-white border border-[#8da4be] font-mono text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMENT (Public & Private Grids) */}
          {activeSubTab === "comment" && (
            <div className="space-y-4 max-w-4xl text-xs">
              <div>
                <div className="bg-[#5ea7e2] text-white px-2 py-1 font-bold rounded-t flex justify-between items-center">
                  <span>Public Comment (ملاحظات عامة معلنة)</span>
                  <button 
                    disabled={!isEditing}
                    onClick={() => {
                      const text = prompt(ar ? "أدخل الملاحظة العامة:" : "Enter public comment:");
                      if (text) setPublicComments([...publicComments, { s: publicComments.length + 1, comment: text, user: "admin", date: new Date().toISOString().split("T")[0] }]);
                    }}
                    className="px-2 py-0.5 bg-white text-blue-900 rounded font-bold hover:bg-blue-50 text-[10px] disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
                <table className="w-full border border-[#8da4be] border-t-0">
                  <thead className="bg-[#e9f2fa] font-bold text-slate-700 border-b">
                    <tr>
                      <th className="p-1 w-10 text-center">S.</th>
                      <th className="p-1 text-left rtl:text-right">Public Comment</th>
                      <th className="p-1 w-28 text-center">User Name</th>
                      <th className="p-1 w-24 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {publicComments.map((c) => (
                      <tr key={c.s}>
                        <td className="p-1 text-center bg-slate-50">{c.s}</td>
                        <td className="p-1 font-sans">{c.comment}</td>
                        <td className="p-1 text-center text-blue-800 font-bold">{c.user}</td>
                        <td className="p-1 text-center">{c.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="bg-[#00c5cd] text-white px-2 py-1 font-bold rounded-t flex justify-between items-center">
                  <span>Private Comment (ملاحظات سرية للإدارة)</span>
                  <button 
                    disabled={!isEditing}
                    onClick={() => {
                      const text = prompt(ar ? "أدخل الملاحظة السرية:" : "Enter private comment:");
                      if (text) setPrivateComments([...privateComments, { s: privateComments.length + 1, comment: text, date: new Date().toISOString().split("T")[0] }]);
                    }}
                    className="px-2 py-0.5 bg-white text-teal-900 rounded font-bold hover:bg-teal-50 text-[10px] disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
                <table className="w-full border border-[#8da4be] border-t-0">
                  <thead className="bg-[#e9f2fa] font-bold text-slate-700 border-b">
                    <tr>
                      <th className="p-1 w-10 text-center">S.</th>
                      <th className="p-1 text-left rtl:text-right">Private Comment</th>
                      <th className="p-1 w-24 text-center">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {privateComments.map((c) => (
                      <tr key={c.s}>
                        <td className="p-1 text-center bg-slate-50">{c.s}</td>
                        <td className="p-1 font-sans">{c.comment}</td>
                        <td className="p-1 text-center">{c.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COMPREHENSIVE HEALTH INSURANCE (Law 2/2018) */}
          {activeSubTab === "health" && (
            <div className="p-2 space-y-4 max-w-4xl text-xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-40 text-slate-800 font-bold shrink-0">Comprehensive Type</label>
                  <input type="text" defaultValue="03" disabled className="w-12 h-6 px-1 bg-white border border-[#8da4be] text-center font-mono" />
                  <input type="text" defaultValue="South Sinai Governorate (محافظة جنوب سيناء - شرم الشيخ)" disabled className="flex-1 h-6 px-2 bg-[#ffffd2] border border-[#8da4be] font-semibold" />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="w-40 text-emerald-800 font-black shrink-0">Comprehensive Salary</label>
                    <input 
                      type="text" 
                      value={Number(formData.baseSalary || currentEmp?.baseSalary || 0).toFixed(2) + " EGP"} 
                      disabled 
                      className="flex-1 h-7 px-2 bg-[#ffffd2] border-2 border-emerald-600 font-mono font-black text-emerald-900 text-end"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-slate-700 font-bold shrink-0">Issue Date</label>
                    <input 
                      type="date" 
                      defaultValue="2024-03-01" 
                      disabled={!isEditing}
                      className="flex-1 h-6 px-1 bg-[#d7f3fe] border border-[#8da4be] font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Company Share (4.00%)</label>
                      <input 
                        type="text" 
                        value={(Number(formData.baseSalary || currentEmp?.baseSalary || 0) * 0.04).toFixed(2) + " EGP"} 
                        disabled 
                        className="w-full h-7 px-2 bg-slate-50 border border-[#8da4be] font-mono font-bold text-slate-800 text-end"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Employee Share (1.00%)</label>
                      <input 
                        type="text" 
                        value={(Number(formData.baseSalary || currentEmp?.baseSalary || 0) * 0.01).toFixed(2) + " EGP"} 
                        disabled 
                        className="w-full h-7 px-2 bg-slate-50 border border-[#8da4be] font-mono font-bold text-rose-800 text-end"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Wife Share (3.00% if Non-Working)</label>
                      <input 
                        type="text" 
                        value="0.00 EGP" 
                        disabled 
                        className="w-full h-7 px-2 bg-slate-50 border border-[#8da4be] font-mono font-bold text-slate-600 text-end"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Dependents & Children Share (0.75% / child)</label>
                      <input 
                        type="text" 
                        value="0.00 EGP" 
                        disabled 
                        className="w-full h-7 px-2 bg-slate-50 border border-[#8da4be] font-mono font-bold text-slate-600 text-end"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 6. FOOTER ACTIONS ──────────────────────────────────────── */}
        <div className="bg-[#e6eef8] border-t border-[#bdcadb] px-3 py-1.5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-600">
            <span>SST Record ID: #{currentEmp?.id || "—"}</span>
            <span>|</span>
            <span className="font-sans font-semibold text-slate-800">{currentEmp?.fullName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-4 py-1 bg-white hover:bg-slate-100 border border-[#8da4be] rounded text-slate-700 font-bold font-sans cursor-pointer"
            >
              {ar ? "إغلاق" : "Close"}
            </button>
            {isEditing && (
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold font-sans rounded shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{ar ? "حفظ التعديلات" : "Save Changes"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
