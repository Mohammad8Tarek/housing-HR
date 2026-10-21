import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

export interface AttendanceEmployee {
  code: string;
  name: string;
  position: string;
  department: string;
  monthShifts: Record<number, string>;
  dailyPunches: Record<
    number,
    {
      shift: string;
      timeIn?: string;
      timeOut?: string;
      timeIn2?: string;
      timeOut2?: string;
      workHours?: number;
    }
  >;
}

interface SstVacationsAndShiftsGridProps {
  year: number;
  month: number;
  department: string;
  employees: AttendanceEmployee[];
  onUpdateRosterCell: (empCode: string, day: number, stampCode: string) => void;
  isMonthClosed?: boolean;
}

// 22 SST Leave / Attendance status codes with exact colors from live app
export const SST_STATUS_BADGES = [
  { code: "V", labelEn: "Vacation", labelAr: "إجازة سنوية", bg: "bg-[#00a800] text-white" },
  { code: "O", labelEn: "Off Day", labelAr: "راحة أسبوعية", bg: "bg-[#00a800] text-white" },
  { code: "H", labelEn: "Holiday", labelAr: "عطلة رسمية", bg: "bg-[#00a800] text-white" },
  { code: "S", labelEn: "Sick Leave", labelAr: "مرضي", bg: "bg-[#00a800] text-white" },
  { code: "U", labelEn: "Unpaid", labelAr: "بدون أجر", bg: "bg-[#e50000] text-white" },
  { code: "A", labelEn: "Absence", labelAr: "غياب", bg: "bg-[#e50000] text-white" },
  { code: "X", labelEn: "Penalty", labelAr: "عقوبة / جزاء", bg: "bg-[#e50000] text-white" },
  { code: "B", labelEn: "Business Mission", labelAr: "مأمورية عمل", bg: "bg-[#b05800] text-white" },
  { code: "C", labelEn: "Casual", labelAr: "عارضة", bg: "bg-[#d83c9a] text-white" },
  { code: "L", labelEn: "Late", labelAr: "تأخير", bg: "bg-[#9a0082] text-white" },
  { code: "D", labelEn: "Deduction", labelAr: "خصم", bg: "bg-[#64009a] text-white" },
  { code: "R", labelEn: "Rest Comp", labelAr: "بدل راحة", bg: "bg-[#0038b8] text-white" },
  { code: "M", labelEn: "Morning Shift", labelAr: "صباحي", bg: "bg-[#008000] text-white" },
  { code: "G", labelEn: "General Shift", labelAr: "عام", bg: "bg-[#333333] text-white" },
  { code: "F", labelEn: "First Half", labelAr: "فترة أولى", bg: "bg-[#d83c9a] text-white" },
  { code: "T", labelEn: "Training", labelAr: "تدريب", bg: "bg-[#0092c8] text-white" },
  { code: "I", labelEn: "Illness Half", labelAr: "مرضي نصف يوم", bg: "bg-[#9a00b8] text-white" },
  { code: "E", labelEn: "Evening Shift", labelAr: "مسائي", bg: "bg-[#d83c9a] text-white" },
  { code: "K", labelEn: "Kitchen Shift", labelAr: "مطبخ", bg: "bg-[#e50000] text-white" },
  { code: "W", labelEn: "Workshop", labelAr: "ورشة", bg: "bg-[#007070] text-white" },
  { code: "N", labelEn: "Night Shift", labelAr: "ليلي", bg: "bg-[#000000] text-white" },
  { code: "WH", labelEn: "Work Hours", labelAr: "ساعات عمل", bg: "bg-[#009b9b] text-white" },
];

// 46 SST Numbered Shifts Palette with authentic background styling
export const SST_NUMBERED_SHIFTS = [
  { num: 1, bg: "bg-[#0044cc] text-white" },
  { num: 2, bg: "bg-[#cc0000] text-white" },
  { num: 3, bg: "bg-[#d86000] text-white" },
  { num: 4, bg: "bg-[#d86000] text-white" },
  { num: 5, bg: "bg-[#008080] text-white" },
  { num: 6, bg: "bg-[#cc0000] text-white" },
  { num: 7, bg: "bg-[#009900] text-white" },
  { num: 8, bg: "bg-[#009900] text-white" },
  { num: 9, bg: "bg-[#111111] text-white" },
  { num: 10, bg: "bg-[#0088cc] text-white" },
  { num: 11, bg: "bg-[#0044cc] text-white" },
  { num: 12, bg: "bg-[#0044cc] text-white" },
  { num: 13, bg: "bg-[#994d00] text-white" },
  { num: 14, bg: "bg-[#cc0000] text-white" },
  { num: 15, bg: "bg-[#0044cc] text-white" },
  { num: 16, bg: "bg-[#111111] text-white" },
  { num: 17, bg: "bg-[#d86000] text-white" },
  { num: 18, bg: "bg-[#0044cc] text-white" },
  { num: 19, bg: "bg-[#111111] text-white" },
  { num: 20, bg: "bg-[#d86000] text-white" },
  { num: 21, bg: "bg-[#008080] text-white" },
  { num: 22, bg: "bg-[#009900] text-white" },
  { num: 23, bg: "bg-[#0044cc] text-white" },
  { num: 24, bg: "bg-[#002288] text-white" },
  { num: 25, bg: "bg-[#cc0000] text-white" },
  { num: 26, bg: "bg-[#111111] text-white" },
  { num: 27, bg: "bg-[#009900] text-white" },
  { num: 28, bg: "bg-[#002288] text-white" },
  { num: 29, bg: "bg-[#d86000] text-white" },
  { num: 30, bg: "bg-[#009900] text-white" },
  { num: 31, bg: "bg-[#002288] text-white" },
  { num: 32, bg: "bg-[#cc0000] text-white" },
  { num: 33, bg: "bg-[#cc0000] text-white" },
  { num: 34, bg: "bg-[#002288] text-white" },
  { num: 35, bg: "bg-[#009900] text-white" },
  { num: 36, bg: "bg-[#cc0000] text-white" },
  { num: 37, bg: "bg-[#d86000] text-white" },
  { num: 38, bg: "bg-[#cca300] text-white" },
  { num: 39, bg: "bg-[#009900] text-white" },
  { num: 40, bg: "bg-[#009900] text-white" },
  { num: 41, bg: "bg-[#0044cc] text-white" },
  { num: 42, bg: "bg-[#cc0000] text-white" },
  { num: 43, bg: "bg-[#002288] text-white" },
  { num: 44, bg: "bg-[#002288] text-white" },
  { num: 45, bg: "bg-[#0044cc] text-white" },
  { num: 46, bg: "bg-[#002288] text-white" },
];

export function SstVacationsAndShiftsGrid({
  year,
  month,
  department,
  employees,
  onUpdateRosterCell,
  isMonthClosed = false,
}: SstVacationsAndShiftsGridProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [activeStamp, setActiveStamp] = useState<string>("11");

  // Calculate days in selected month
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Day names abbreviation
  const getDayName = (day: number) => {
    const d = new Date(year, month - 1, day);
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return names[d.getDay()];
  };

  // Occupancy metrics per day (Hotel live metrics)
  const occupancyMetrics = {
    occupancyPct: [88, 92, 95, 91, 89, 94, 96, 92, 90, 87, 85, 91, 93, 95, 97, 98, 95, 93, 90, 88, 89, 92, 94, 96, 95, 91, 88, 89, 90, 92, 94],
    guestCount: [680, 712, 735, 704, 688, 727, 742, 711, 696, 673, 658, 704, 720, 735, 750, 758, 735, 720, 696, 680, 688, 712, 727, 742, 735, 704, 680, 688, 696, 712, 727],
    childrenCount: [142, 155, 168, 150, 145, 162, 170, 158, 150, 138, 132, 150, 160, 168, 175, 180, 168, 160, 150, 142, 145, 155, 162, 170, 168, 150, 142, 145, 150, 155, 162],
    coversCount: [1360, 1424, 1470, 1408, 1376, 1454, 1484, 1422, 1392, 1346, 1316, 1408, 1440, 1470, 1500, 1516, 1470, 1440, 1392, 1360, 1376, 1424, 1454, 1484, 1470, 1408, 1360, 1376, 1392, 1424, 1454],
  };

  return (
    <div className="flex flex-col h-full bg-[#d4d0c8] select-none text-[11px] font-sans">
      {/* 1. Palette Toolbar (SST Authentic Leave & Shift Buttons) */}
      <div className="bg-[#ece9d8] border-b border-[#7f9db9] p-1 flex items-center gap-1 overflow-x-auto shadow-xs">
        {/* Undo button */}
        <button
          type="button"
          onClick={() => setActiveStamp("O")}
          title="Clear / Undo"
          className="w-5 h-5 flex items-center justify-center bg-white border border-[#7f9db9] hover:bg-[#dedbc9] active:bg-[#c0bdb0] text-gray-700 font-bold shrink-0"
        >
          <RotateCcw className="w-3 h-3 text-blue-700" />
        </button>

        {/* Leave Status Badges */}
        <div className="flex items-center gap-0.5 shrink-0 border-r border-[#a09e95] pr-1">
          {SST_STATUS_BADGES.map((b) => {
            const isSelected = activeStamp === b.code;
            return (
              <button
                key={b.code}
                type="button"
                onClick={() => setActiveStamp(b.code)}
                title={`${b.labelEn} (${b.labelAr})`}
                className={`min-w-[17px] h-5 px-0.5 text-[10px] font-black flex items-center justify-center cursor-pointer transition-transform ${b.bg} ${
                  isSelected ? "ring-2 ring-yellow-300 ring-offset-1 scale-110 z-10 shadow-md" : "opacity-95 hover:opacity-100"
                }`}
              >
                {b.code}
              </button>
            );
          })}
        </div>

        {/* Numbered Shift Badges */}
        <div className="flex items-center gap-0.5 shrink-0 overflow-x-auto">
          {SST_NUMBERED_SHIFTS.map((s) => {
            const isSelected = activeStamp === String(s.num);
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStamp(String(s.num))}
                title={`Shift ${s.num}`}
                className={`min-w-[17px] h-5 px-0.5 text-[10px] font-bold flex items-center justify-center cursor-pointer ${s.bg} ${
                  isSelected ? "ring-2 ring-yellow-300 ring-offset-1 scale-110 z-10 shadow-md" : "opacity-95 hover:opacity-100"
                }`}
              >
                {s.num}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Roster Table Grid */}
      <div className="flex-1 overflow-auto bg-white border border-[#7f9db9]">
        <table className="border-collapse text-[10px] min-w-max w-full">
          <thead>
            {/* Day Number Header Row */}
            <tr className="bg-[#ece9d8] text-gray-800 font-bold border-b border-[#7f9db9]">
              <th className="w-[60px] p-1 border-r border-[#7f9db9] text-center sticky left-0 bg-[#ece9d8] z-20">E.N.</th>
              <th className="w-[180px] p-1 border-r border-[#7f9db9] text-left sticky left-[60px] bg-[#ece9d8] z-20">Employee Name</th>
              <th className="w-[110px] p-1 border-r border-[#7f9db9] text-left sticky left-[240px] bg-[#ece9d8] z-20">Position</th>
              {daysArray.map((day) => (
                <th key={day} className="w-[28px] p-0.5 border-r border-[#7f9db9] text-center font-bold">
                  {day}
                </th>
              ))}
            </tr>

            {/* Hotel Occupancy Metrics Header Rows */}
            <tr className="bg-[#f0ede4] text-gray-700 border-b border-[#d0cfc5]">
              <td colSpan={3} className="p-0.5 font-bold border-r border-[#7f9db9] sticky left-0 bg-[#f0ede4] z-20 text-gray-800 pl-2">
                Day Name
              </td>
              {daysArray.map((day) => (
                <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center font-semibold text-blue-900 bg-[#e8e4d8]">
                  {getDayName(day)}
                </td>
              ))}
            </tr>

            <tr className="bg-white text-gray-700 border-b border-[#d0cfc5]">
              <td colSpan={3} className="p-0.5 font-bold border-r border-[#7f9db9] sticky left-0 bg-white z-20 text-gray-800 pl-2">
                Occupancy %
              </td>
              {daysArray.map((day) => (
                <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center text-[9px] text-emerald-800 font-bold">
                  {occupancyMetrics.occupancyPct[(day - 1) % 31]}%
                </td>
              ))}
            </tr>

            <tr className="bg-[#f9f8f5] text-gray-700 border-b border-[#d0cfc5]">
              <td colSpan={3} className="p-0.5 font-bold border-r border-[#7f9db9] sticky left-0 bg-[#f9f8f5] z-20 text-gray-800 pl-2">
                Guest Count
              </td>
              {daysArray.map((day) => (
                <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center text-[9px]">
                  {occupancyMetrics.guestCount[(day - 1) % 31]}
                </td>
              ))}
            </tr>

            <tr className="bg-white text-gray-700 border-b border-[#7f9db9]">
              <td colSpan={3} className="p-0.5 font-bold border-r border-[#7f9db9] sticky left-0 bg-white z-20 text-gray-800 pl-2">
                Children Count
              </td>
              {daysArray.map((day) => (
                <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center text-[9px]">
                  {occupancyMetrics.childrenCount[(day - 1) % 31]}
                </td>
              ))}
            </tr>

            <tr className="bg-[#f0ede4] text-gray-700 border-b border-[#7f9db9]">
              <td colSpan={3} className="p-0.5 font-bold border-r border-[#7f9db9] sticky left-0 bg-[#f0ede4] z-20 text-gray-800 pl-2">
                Actual Covers Count
              </td>
              {daysArray.map((day) => (
                <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center text-[9px]">
                  {occupancyMetrics.coversCount[(day - 1) % 31]}
                </td>
              ))}
            </tr>
          </thead>

          {/* Employee Roster Rows */}
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 3} className="text-center py-8 text-gray-500 font-bold">
                  No employee records found in department: {department}
                </td>
              </tr>
            ) : (
              employees.map((emp, empIdx) => (
                <tr key={emp.code} className={`border-b border-[#d0cfc5] ${empIdx % 2 === 0 ? "bg-white" : "bg-[#f9f8f5]"} hover:bg-yellow-50/50`}>
                  <td className="p-1 font-bold border-r border-[#7f9db9] text-center sticky left-0 bg-inherit z-10 text-gray-900">
                    {emp.code}
                  </td>
                  <td className="p-1 font-medium border-r border-[#7f9db9] sticky left-[60px] bg-inherit z-10 text-gray-800 truncate max-w-[180px]">
                    {emp.name}
                  </td>
                  <td className="p-1 border-r border-[#7f9db9] sticky left-[240px] bg-inherit z-10 text-gray-600 truncate max-w-[110px]">
                    {emp.position}
                  </td>

                  {/* Days 1..31 Cells */}
                  {daysArray.map((day) => {
                    const shiftVal = emp.monthShifts[day] || "11";
                    const isOff = shiftVal === "O" || shiftVal === "R";
                    const isVac = shiftVal === "V" || shiftVal === "C" || shiftVal === "S";
                    const isAbs = shiftVal === "A" || shiftVal === "U" || shiftVal === "X";

                    let badgeColor = "bg-blue-50 text-blue-900 border-[#b0c4de]";
                    if (isOff) badgeColor = "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold";
                    else if (isVac) badgeColor = "bg-green-100 text-green-900 border-green-300 font-bold";
                    else if (isAbs) badgeColor = "bg-rose-100 text-rose-900 border-rose-300 font-bold";

                    return (
                      <td
                        key={day}
                        onClick={() => {
                          if (!isMonthClosed) {
                            onUpdateRosterCell(emp.code, day, activeStamp);
                          }
                        }}
                        className={`p-0.5 border-r border-[#d0cfc5] text-center cursor-pointer transition-colors hover:bg-yellow-200 select-none ${badgeColor}`}
                        title={`Click to stamp [${activeStamp}] on Day ${day}`}
                      >
                        <span className="font-bold">{shiftVal}</span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
