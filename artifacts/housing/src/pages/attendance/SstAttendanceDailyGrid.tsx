import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { AttendanceEmployee } from "./SstVacationsAndShiftsGrid";

interface SstAttendanceDailyGridProps {
  year: number;
  month: number;
  department: string;
  employees: AttendanceEmployee[];
  onCalculateAll: () => void;
  onCalculateTime: (empCode: string) => void;
  onUpdatePunchCell?: (empCode: string, day: number, field: "timeIn" | "timeOut" | "timeIn2" | "timeOut2", val: string) => void;
  isMonthClosed?: boolean;
}

export function SstAttendanceDailyGrid({
  year,
  month,
  department,
  employees,
  onCalculateAll,
  onCalculateTime,
  onUpdatePunchCell,
  isMonthClosed = false,
}: SstAttendanceDailyGridProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [selectedEmpCode, setSelectedEmpCode] = useState<string>(employees[0]?.code || "");
  const [isCalcAllPromptOpen, setIsCalcAllPromptOpen] = useState(false);

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayName = (day: number) => {
    const d = new Date(year, month - 1, day);
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return names[d.getDay()];
  };

  const occupancyMetrics = {
    occupancyPct: [88, 92, 95, 91, 89, 94, 96, 92, 90, 87, 85, 91, 93, 95, 97, 98, 95, 93, 90, 88, 89, 92, 94, 96, 95, 91, 88, 89, 90, 92, 94],
    guestCount: [680, 712, 735, 704, 688, 727, 742, 711, 696, 673, 658, 704, 720, 735, 750, 758, 735, 720, 696, 680, 688, 712, 727, 742, 735, 704, 680, 688, 696, 712, 727],
    childrenCount: [142, 155, 168, 150, 145, 162, 170, 158, 150, 138, 132, 150, 160, 168, 175, 180, 168, 160, 150, 142, 145, 155, 162, 170, 168, 150, 142, 145, 150, 155, 162],
    coversCount: [1360, 1424, 1470, 1408, 1376, 1454, 1484, 1422, 1392, 1346, 1316, 1408, 1440, 1470, 1500, 1516, 1470, 1440, 1392, 1360, 1376, 1424, 1454, 1484, 1470, 1408, 1360, 1376, 1392, 1424, 1454],
  };

  const handleConfirmCalculateAll = () => {
    setIsCalcAllPromptOpen(false);
    onCalculateAll();
    toast.success(ar ? "تم احتساب الدوام وساعات العمل بنجاح لجميع الموظفين" : "Calculated attendance and hours for all employees");
  };

  return (
    <div className="flex flex-col h-full bg-[#d4d0c8] select-none text-[11px] font-sans relative">
      {/* 1. Action Buttons Bar (SST Top Controls) */}
      <div className="bg-[#ece9d8] border-b border-[#7f9db9] p-1.5 flex items-center gap-2 shadow-xs">
        <button
          type="button"
          onClick={() => {
            if (selectedEmpCode) {
              onCalculateTime(selectedEmpCode);
              toast.success(ar ? `تم احتساب دوام الموظف ${selectedEmpCode}` : `Calculated time for employee ${selectedEmpCode}`);
            } else {
              toast.info(ar ? "يرجى تحديد موظف أولاً" : "Please select an employee first");
            }
          }}
          className="px-3 py-1 bg-[#ece9d8] hover:bg-[#dedbc9] active:bg-[#c0bdb0] text-xs font-bold text-gray-800 border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] active:border-t-[#716f64] active:border-l-[#716f64] active:border-b-white active:border-r-white cursor-pointer shadow-xs"
        >
          Calculate time
        </button>

        <button
          type="button"
          onClick={() => setIsCalcAllPromptOpen(true)}
          className="px-3 py-1 bg-[#ece9d8] hover:bg-[#dedbc9] active:bg-[#c0bdb0] text-xs font-bold text-gray-800 border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] active:border-t-[#716f64] active:border-l-[#716f64] active:border-b-white active:border-r-white cursor-pointer shadow-xs"
        >
          Calculate All
        </button>
      </div>

      {/* 2. Main Attendant Sheet Grid */}
      <div className="flex-1 overflow-auto bg-white border border-[#7f9db9]">
        <table className="border-collapse text-[10px] min-w-max w-full">
          <thead>
            {/* Day Number Header Row */}
            <tr className="bg-[#ece9d8] text-gray-800 font-bold border-b border-[#7f9db9]">
              <th className="w-[60px] p-1 border-r border-[#7f9db9] text-center sticky left-0 bg-[#ece9d8] z-20">E.N.</th>
              <th className="w-[180px] p-1 border-r border-[#7f9db9] text-left sticky left-[60px] bg-[#ece9d8] z-20">Employee Name</th>
              <th className="w-[90px] p-1 border-r border-[#7f9db9] text-left sticky left-[240px] bg-[#ece9d8] z-20">Metric</th>
              {daysArray.map((day) => (
                <th key={day} className="w-[32px] p-0.5 border-r border-[#7f9db9] text-center font-bold">
                  {day}
                </th>
              ))}
            </tr>

            {/* Hotel Occupancy Header Rows */}
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

          {/* Employee Records (6 Sub-rows per Employee) */}
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={daysInMonth + 3} className="text-center py-8 text-gray-500 font-bold">
                  No employee records found in department: {department}
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const isSelected = selectedEmpCode === emp.code;
                const rowBg = isSelected ? "bg-amber-50/70" : "bg-white";

                return (
                  <React.Fragment key={emp.code}>
                    {/* Row 1: Shift */}
                    <tr
                      onClick={() => setSelectedEmpCode(emp.code)}
                      className={`border-t border-[#7f9db9] ${rowBg} hover:bg-yellow-50`}
                    >
                      <td
                        rowSpan={6}
                        className="p-1 font-bold border-r border-[#7f9db9] text-center align-top sticky left-0 bg-inherit z-10 text-gray-900"
                      >
                        {emp.code}
                      </td>
                      <td
                        rowSpan={6}
                        className="p-1 font-medium border-r border-[#7f9db9] align-top sticky left-[60px] bg-inherit z-10 text-gray-800 max-w-[180px]"
                      >
                        <div className="font-bold text-[10px] text-blue-900 truncate">{emp.name}</div>
                        <div className="text-[9px] text-gray-500 truncate">{emp.position}</div>
                      </td>
                      <td className="p-0.5 font-bold border-r border-[#7f9db9] text-gray-700 bg-[#f0ede4] sticky left-[240px] z-10 pl-1">
                        Shift
                      </td>
                      {daysArray.map((day) => {
                        const punch = emp.dailyPunches[day];
                        const val = punch?.shift || emp.monthShifts[day] || "11";
                        return (
                          <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center font-bold text-blue-900 bg-blue-50/40">
                            {val}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 2: Time In */}
                    <tr onClick={() => setSelectedEmpCode(emp.code)} className={`${rowBg} hover:bg-yellow-50`}>
                      <td className="p-0.5 font-medium border-r border-[#7f9db9] text-gray-600 bg-[#f8f7f4] sticky left-[240px] z-10 pl-1">
                        Time In
                      </td>
                      {daysArray.map((day) => {
                        const punch = emp.dailyPunches[day];
                        const val = punch?.timeIn || "";
                        return (
                          <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center font-mono text-[9px] text-emerald-800">
                            {val}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 3: Time Out */}
                    <tr onClick={() => setSelectedEmpCode(emp.code)} className={`${rowBg} hover:bg-yellow-50`}>
                      <td className="p-0.5 font-medium border-r border-[#7f9db9] text-gray-600 bg-[#f8f7f4] sticky left-[240px] z-10 pl-1">
                        Time Out
                      </td>
                      {daysArray.map((day) => {
                        const punch = emp.dailyPunches[day];
                        const val = punch?.timeOut || "";
                        return (
                          <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center font-mono text-[9px] text-amber-800">
                            {val}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 4: Time In 2 */}
                    <tr onClick={() => setSelectedEmpCode(emp.code)} className={`${rowBg} hover:bg-yellow-50`}>
                      <td className="p-0.5 font-medium border-r border-[#7f9db9] text-gray-600 bg-[#f8f7f4] sticky left-[240px] z-10 pl-1">
                        Time In 2
                      </td>
                      {daysArray.map((day) => {
                        const punch = emp.dailyPunches[day];
                        const val = punch?.timeIn2 || "";
                        return (
                          <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center font-mono text-[9px] text-purple-800">
                            {val}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 5: Time out 2 */}
                    <tr onClick={() => setSelectedEmpCode(emp.code)} className={`${rowBg} hover:bg-yellow-50`}>
                      <td className="p-0.5 font-medium border-r border-[#7f9db9] text-gray-600 bg-[#f8f7f4] sticky left-[240px] z-10 pl-1">
                        Time out 2
                      </td>
                      {daysArray.map((day) => {
                        const punch = emp.dailyPunches[day];
                        const val = punch?.timeOut2 || "";
                        return (
                          <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center font-mono text-[9px] text-purple-800">
                            {val}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 6: WorkHours */}
                    <tr onClick={() => setSelectedEmpCode(emp.code)} className={`border-b-2 border-[#7f9db9] ${rowBg} hover:bg-yellow-50`}>
                      <td className="p-0.5 font-bold border-r border-[#7f9db9] text-gray-800 bg-[#e8e4d8] sticky left-[240px] z-10 pl-1">
                        WorkHours
                      </td>
                      {daysArray.map((day) => {
                        const punch = emp.dailyPunches[day];
                        const val = punch?.workHours ? `${punch.workHours}h` : "";
                        return (
                          <td key={day} className="p-0.5 border-r border-[#d0cfc5] text-center font-bold text-[9px] text-gray-900 bg-gray-50">
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Authentic Win32 Confirmation Dialog: "Are You sure You want Calculate All" */}
      {isCalcAllPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[320px] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] shadow-2xl rounded-xs select-none">
            {/* Dialog Header */}
            <div className="bg-gradient-to-r from-[#0055ea] via-[#0880f0] to-[#3a93ff] text-white px-2 py-0.5 flex items-center justify-between text-xs font-bold">
              <span>SST Department Interface</span>
              <button
                onClick={() => setIsCalcAllPromptOpen(false)}
                className="w-4 h-4 bg-[#d73a49] hover:bg-red-700 text-white flex items-center justify-center rounded-xs text-[10px] font-bold border border-white/40"
              >
                ×
              </button>
            </div>

            {/* Prompt Body */}
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
                  ?
                </div>
                <div className="text-xs font-bold text-gray-800">
                  Are You sure You want Calculate All
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-center gap-3 border-t border-[#d0cfc5]">
                <button
                  type="button"
                  onClick={handleConfirmCalculateAll}
                  className="min-w-[65px] px-3 py-1 bg-[#ece9d8] hover:bg-[#dedbc9] text-xs font-bold text-gray-800 border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] active:border-t-[#716f64] active:border-l-[#716f64] active:border-b-white active:border-r-white cursor-pointer shadow-xs"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalcAllPromptOpen(false)}
                  className="min-w-[65px] px-3 py-1 bg-[#ece9d8] hover:bg-[#dedbc9] text-xs font-medium text-gray-800 border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] active:border-t-[#716f64] active:border-l-[#716f64] active:border-b-white active:border-r-white cursor-pointer shadow-xs"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
