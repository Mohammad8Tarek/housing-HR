import React, { useState } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/context/LanguageContext";
import { useHrAuth, PropertyScope } from "@/context/HrAuthContext";
import {
  SstHotelSelectionDialog,
  SstPropertyItem,
  SUNRISE_SST_HOTELS,
} from "./SstHotelSelectionDialog";
import { SstHotelLoginDialog } from "./SstHotelLoginDialog";
import {
  Hotel,
  KeyRound,
  Laptop,
  CheckCircle2,
  Languages,
  ArrowRight,
  ArrowLeft,
  Building2,
  Database
} from "lucide-react";
import { toast } from "sonner";

export default function HrPropertyGatePage() {
  const [, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const { login } = useHrAuth();

  const [selectedHotel, setSelectedHotel] = useState<SstPropertyItem>(SUNRISE_SST_HOTELS[1]); // Default to SunRise Meraki Sharm Casual
  const [isHotelSelectorOpen, setIsHotelSelectorOpen] = useState(false);
  const [isHotelLoginOpen, setIsHotelLoginOpen] = useState(true);

  // If redirected for attendance specifically
  const isAttendanceRedirect = window.location.search.includes("redirect=attendance");

  const handleHotelSelected = (hotel: SstPropertyItem) => {
    setSelectedHotel(hotel);
    setIsHotelSelectorOpen(false);
    setIsHotelLoginOpen(true);
  };

  const handleLoginSuccess = async (credentials: {
    username: string;
    password: string;
    year: number;
    month: number;
    calcNumber: number;
  }) => {
    sessionStorage.setItem("hr_property_vault_scope", JSON.stringify(selectedHotel));
    sessionStorage.setItem(
      "sst_selected_period",
      JSON.stringify({
        year: credentials.year,
        month: credentials.month,
        calcNumber: credentials.calcNumber,
      })
    );

    try {
      await login(
        credentials.username,
        credentials.password,
        isAttendanceRedirect ? "attendance" : "payroll",
        selectedHotel
      );
    } catch (e) {
      console.warn("Silent fallback into SST desktop shell with hotel scope", e);
    }

    toast.success(
      ar
        ? `تم الدخول بنجاح إلى: ${selectedHotel.nameAr}`
        : `Connected to: ${selectedHotel.nameEn}`
    );

    const target = isAttendanceRedirect ? "/attendance" : "/payroll";
    setLocation(target);
  };

  return (
    <div
      className="min-h-screen bg-[#0E2841] text-slate-100 flex flex-col justify-between selection:bg-[#C89332] selection:text-slate-900"
      dir={ar ? "rtl" : "ltr"}
    >
      {/* TSplus Header Bar */}
      <header className="h-14 bg-gradient-to-r from-[#091D30] via-[#0E2841] to-[#163D63] border-b border-blue-900/60 px-4 md:px-8 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#C89332] text-[#091D30] font-black flex items-center justify-center shadow-xs">
            <span className="text-base font-serif">S</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-white">SUNRISE</span>
              <span className="text-[10px] uppercase font-bold text-[#C89332] bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 rounded-xs">
                Resorts & Cruises
              </span>
            </div>
            <div className="text-[10px] text-blue-200/70 font-mono hidden sm:block">
              Integrated System For Payroll & HR (SST 26.0) • Hotel & Entity Gate
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-200 hover:text-white bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 rounded-xs transition-colors"
          >
            <span>{ar ? "بوابة التطبيقات (TSplus)" : "Main Launcher"}</span>
          </button>

          <button
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-100 hover:text-white bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 rounded-xs transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-[#C89332]" />
            <span className="font-semibold">{ar ? "English" : "العربية"}</span>
          </button>
        </div>
      </header>

      {/* Main Area: Center Backdrop Card with Hotel Selector Trigger */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#ECE9D8] dark:bg-slate-900 border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-2xl p-6 text-slate-800 dark:text-slate-100 text-center space-y-4">
          <div className="w-14 h-14 bg-[#0A246A] text-amber-300 mx-auto flex items-center justify-center border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-md">
            <Building2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-black text-[#0A246A] dark:text-amber-400">
              {ar
                ? "منظومة الرواتب وشؤون العاملين (SST 26.0)"
                : "Integrated System For Payroll & HR (SST 26.0)"}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {ar
                ? "لتسجيل الدخول إلى بيانات أي فندق، اختر الفندق من القائمة واكتب بيانات الدخول والفترة المحاسبية"
                : "To access hotel records, select company from list and verify credentials"}
            </p>
          </div>

          {/* Current Hotel Pill */}
          <div className="p-3 bg-white dark:bg-slate-950 border border-[#808080] text-right text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[11px]">
              <span>{ar ? "الفندق المحدد حالياً:" : "Current Selected Hotel:"}</span>
              <span className="font-mono text-amber-700 font-bold uppercase">{selectedHotel.category}</span>
            </div>
            <div className="font-black text-sm text-[#0A246A] dark:text-white">
              {ar ? selectedHotel.nameAr : selectedHotel.nameEn}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Database: {selectedHotel.databaseName} • Server: {selectedHotel.serverHost}
            </div>
          </div>

          {/* Actions Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsHotelLoginOpen(true)}
              className="px-6 py-2 bg-[#ECE9D8] hover:bg-[#F5F4EE] active:bg-[#D4D0C8] text-slate-900 font-bold text-xs border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-xs cursor-pointer flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>{ar ? "فتح نافذة الدخول (Login)" : "Open Login Dialog"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHotelSelectorOpen(true)}
              className="px-5 py-2 bg-[#ECE9D8] hover:bg-[#F5F4EE] active:bg-[#D4D0C8] text-slate-900 font-bold text-xs border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Hotel className="w-4 h-4 text-[#0A246A]" />
              <span>{ar ? "تغيير الفندق (Select Company)" : "Select Company"}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-9 bg-[#091D30] border-t border-blue-900/60 px-4 md:px-8 flex items-center justify-between text-[11px] text-blue-300/60 font-mono">
        <div>SUNRISE Resorts & Cruises © 2026</div>
        <div>SST 26.0 Win32 Multi-Company Environment</div>
      </footer>

      {/* Authentic Hotel Selector Dialog */}
      <SstHotelSelectionDialog
        isOpen={isHotelSelectorOpen}
        onClose={() => setIsHotelSelectorOpen(false)}
        onSelectProperty={handleHotelSelected}
        initialSelectedCode={selectedHotel.code}
      />

      {/* Authentic Hotel Login Dialog */}
      <SstHotelLoginDialog
        isOpen={isHotelLoginOpen}
        onClose={() => setIsHotelLoginOpen(false)}
        hotel={selectedHotel}
        onChangeHotel={() => {
          setIsHotelLoginOpen(false);
          setIsHotelSelectorOpen(true);
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
