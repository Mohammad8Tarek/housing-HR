import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SstPropertyItem } from "./SstHotelSelectionDialog";
import { KeyRound, Lock, Eye, EyeOff, Building2, Check, X, Calendar, RotateCcw } from "lucide-react";

interface SstHotelLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hotel: SstPropertyItem;
  onChangeHotel: () => void;
  onLoginSuccess: (credentials: {
    username: string;
    password: string;
    year: number;
    month: number;
    calcNumber: number;
  }) => void;
}

export function SstHotelLoginDialog({
  isOpen,
  onClose,
  hotel,
  onChangeHotel,
  onLoginSuccess,
}: SstHotelLoginDialogProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("MY@mkwh1001");
  const [showPassword, setShowPassword] = useState(false);
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(10);
  const [calcNumber, setCalcNumber] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg(ar ? "يرجى إدخال اسم المستخدم وكلمة المرور" : "Username & password required");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      onLoginSuccess({
        username: username.trim(),
        password,
        year,
        month,
        calcNumber,
      });
    } catch (err: any) {
      setErrorMsg(err.message || (ar ? "فشل تسجيل الدخول للفندق" : "Hotel login failed"));
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none"
      dir={ar ? "rtl" : "ltr"}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      {/* Authentic Win32 MDI Login Dialog */}
      <div className="w-full max-w-lg bg-[#ECE9D8] dark:bg-slate-900 border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-2xl flex flex-col">
        {/* Win32 Classical Gradient Title Bar */}
        <div className="h-7 bg-gradient-to-r from-[#0A246A] via-[#0055EA] to-[#A6CAF0] dark:from-slate-950 dark:to-slate-800 text-white font-bold text-xs px-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5 truncate">
            <KeyRound className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="tracking-wide truncate">
              {ar
                ? `تسجيل الدخول — [${hotel.nameAr}]`
                : `Login — [${hotel.nameEn}]`}
            </span>
          </div>

          <button
            onClick={onClose}
            title={ar ? "إغلاق" : "Close"}
            className="w-4 h-4 bg-[#ECE9D8] text-slate-800 hover:bg-red-600 hover:text-white flex items-center justify-center text-[10px] font-black border border-[#808080] rounded-xs shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Dialog Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Top Company Display Box */}
          <div className="flex items-start gap-3 p-2 bg-[#F5F4EE] dark:bg-slate-800/80 border border-[#808080]">
            <div className="w-12 h-12 bg-[#0A246A] text-amber-300 flex items-center justify-center border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shrink-0 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {ar ? "المنشأة المحددة (Company):" : "Selected Property:"}
                </span>
                <button
                  type="button"
                  onClick={onChangeHotel}
                  className="text-[11px] text-[#0A246A] dark:text-amber-400 underline hover:font-bold cursor-pointer"
                >
                  {ar ? "تغيير الفندق..." : "Change..."}
                </button>
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                {ar ? hotel.nameAr : hotel.nameEn}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                <span>Code: {hotel.code}</span>
                <span>•</span>
                <span>DB: {hotel.databaseName}</span>
                <span>•</span>
                <span className="text-amber-700 dark:text-amber-300 font-bold uppercase">
                  {hotel.category}
                </span>
              </div>
            </div>
          </div>

          {/* Credentials Inputs */}
          <div className="space-y-2 p-3 bg-white dark:bg-slate-950 border border-[#808080]">
            {/* User Name */}
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                {ar ? "اسم المستخدم:" : "User Name:"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 text-xs bg-[#FFFFFF] text-slate-900 border border-[#808080] px-2 py-1 font-mono focus:outline-hidden focus:border-[#0A246A]"
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-2">
              <label className="w-28 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                {ar ? "كلمة المرور:" : "Password:"}
              </label>
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs bg-[#FFFFFF] text-slate-900 border border-[#808080] px-2 py-1 font-mono focus:outline-hidden focus:border-[#0A246A]"
                  required
                />
              </div>
            </div>

            {/* Show Password Checkbox (Exactly matching screenshot 285) */}
            <div className="flex items-center gap-2 pt-1 ps-28">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded-xs border-[#808080]"
                />
                <span>{ar ? "إظهار كلمة المرور (Show Password)" : "Show Password"}</span>
              </label>
            </div>
          </div>

          {/* Accounting Period Group Box */}
          <fieldset className="p-2.5 bg-white dark:bg-slate-950 border border-[#808080]">
            <legend className="text-xs font-bold px-1.5 text-slate-700 dark:text-slate-300">
              {ar ? "فترة الحساب والتشغيل (Accounting Period)" : "Accounting Period"}
            </legend>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                  {ar ? "السنة (Year)" : "Year"}
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full text-xs bg-[#FFFFFF] text-slate-900 border border-[#808080] px-1.5 py-1 font-mono"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                  {ar ? "الشهر (Month)" : "Month"}
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full text-xs bg-[#FFFFFF] text-slate-900 border border-[#808080] px-1.5 py-1 font-mono"
                >
                  <option value={10}>10 - October (أكتوبر)</option>
                  <option value={9}>09 - September (سبتمبر)</option>
                  <option value={8}>08 - August (أغسطس)</option>
                  <option value={11}>11 - November (نوفمبر)</option>
                  <option value={12}>12 - December (ديسمبر)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                  {ar ? "رقم الحسبة (Calc.#)" : "Calc.#"}
                </label>
                <select
                  value={calcNumber}
                  onChange={(e) => setCalcNumber(Number(e.target.value))}
                  className="w-full text-xs bg-[#FFFFFF] text-slate-900 border border-[#808080] px-1.5 py-1 font-mono"
                >
                  <option value={1}>1 - Regular (الأساسية)</option>
                  <option value={2}>2 - Casuals (الكاجوال)</option>
                  <option value={3}>3 - Bonus/Adjustment (التسويات)</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2 bg-red-100 text-red-700 text-xs border border-red-400 font-bold">
              {errorMsg}
            </div>
          )}

          {/* Dialog Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#FFFFFF]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-1.5 bg-[#ECE9D8] hover:bg-[#F5F4EE] active:bg-[#D4D0C8] text-slate-900 font-bold text-xs border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isSubmitting ? (ar ? "جارٍ الدخول..." : "Entering...") : (ar ? "موافق (OK)" : "OK (Enter)")}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-1.5 bg-[#ECE9D8] hover:bg-[#F5F4EE] active:bg-[#D4D0C8] text-slate-900 font-bold text-xs border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5 text-red-600" />
              <span>{ar ? "إلغاء الأمر (Cancel)" : "Cancel"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
