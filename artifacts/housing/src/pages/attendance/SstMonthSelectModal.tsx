import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

interface SstMonthSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  selectedMonth: number;
  onSelect: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  { num: 1, nameEn: "1 January", nameAr: "1 يناير" },
  { num: 2, nameEn: "2 February", nameAr: "2 فبراير" },
  { num: 3, nameEn: "3 March", nameAr: "3 مارس" },
  { num: 4, nameEn: "4 April", nameAr: "4 أبريل" },
  { num: 5, nameEn: "5 May", nameAr: "5 مايو" },
  { num: 6, nameEn: "6 June", nameAr: "6 يونيو" },
  { num: 7, nameEn: "7 July", nameAr: "7 يوليو" },
  { num: 8, nameEn: "8 August", nameAr: "8 أغسطس" },
  { num: 9, nameEn: "9 September", nameAr: "9 سبتمبر" },
  { num: 10, nameEn: "10 October", nameAr: "10 أكتوبر" },
  { num: 11, nameEn: "11 November", nameAr: "11 نوفمبر" },
  { num: 12, nameEn: "12 December", nameAr: "12 ديسمبر" },
];

const YEARS = [2023, 2024, 2025, 2026, 2027, 2028];

export function SstMonthSelectModal({
  isOpen,
  onClose,
  selectedYear,
  selectedMonth,
  onSelect,
}: SstMonthSelectModalProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [year, setYear] = useState<number>(selectedYear);
  const [month, setMonth] = useState<number>(selectedMonth);

  if (!isOpen) return null;

  const handlePrev = () => {
    if (month > 1) {
      setMonth(month - 1);
    } else {
      setMonth(12);
      setYear(year - 1);
    }
  };

  const handleNext = () => {
    if (month < 12) {
      setMonth(month + 1);
    } else {
      setMonth(1);
      setYear(year + 1);
    }
  };

  const handleOk = () => {
    onSelect(year, month);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs font-sans">
      <div className="w-[360px] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] shadow-2xl rounded-xs select-none">
        {/* Win32 Window Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#0880f0] to-[#3a93ff] text-white px-2 py-1 flex items-center justify-between text-xs font-bold tracking-wide">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-white/20 border border-white/50 flex items-center justify-center text-[10px]">▦</span>
            <span>Select Month</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d73a49] hover:bg-red-700 text-white flex items-center justify-center rounded-xs text-[10px] font-bold border border-white/40"
          >
            ×
          </button>
        </div>

        {/* Dialog Content */}
        <div className="p-4 space-y-4">
          {/* Header & Year Selector */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Select Month</h3>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white border border-[#7f9db9] px-2 py-0.5 text-xs font-medium text-gray-800 focus:outline-none"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector Box */}
          <div className="space-y-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-[#0055ea] text-white border border-[#7f9db9] px-3 py-1.5 text-xs font-bold focus:outline-none"
            >
              {MONTH_NAMES.map((m) => (
                <option key={m.num} value={m.num} className="bg-white text-gray-900 font-medium">
                  {ar ? m.nameAr : m.nameEn}
                </option>
              ))}
            </select>

            {/* Previous / Next Quick Controls */}
            <div className="flex items-center justify-between text-xs text-blue-700 px-1 pt-1 font-medium">
              <button
                type="button"
                onClick={handlePrev}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Win32 Ok / Cancel Action Buttons */}
          <div className="pt-2 border-t border-[#d0cfc5] flex justify-center gap-4">
            <button
              type="button"
              onClick={handleOk}
              className="min-w-[75px] px-3 py-1 bg-[#ece9d8] hover:bg-[#dedbc9] text-xs font-bold text-gray-800 border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] active:border-t-[#716f64] active:border-l-[#716f64] active:border-b-white active:border-r-white cursor-pointer shadow-xs"
            >
              Ok
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[75px] px-3 py-1 bg-[#ece9d8] hover:bg-[#dedbc9] text-xs font-medium text-gray-800 border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] active:border-t-[#716f64] active:border-l-[#716f64] active:border-b-white active:border-r-white cursor-pointer shadow-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
