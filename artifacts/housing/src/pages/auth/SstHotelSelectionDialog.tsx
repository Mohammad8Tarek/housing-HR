import React, { useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { PropertyScope } from "@/context/HrAuthContext";
import { Search, Hotel, Building2, Check, X, Shield, Database } from "lucide-react";

export interface SstPropertyItem extends PropertyScope {
  databaseName: string;
  serverHost: string;
  cityAr: string;
  cityEn: string;
}

export const SUNRISE_SST_HOTELS: SstPropertyItem[] = [
  {
    id: 1,
    code: "MRK-01",
    nameEn: "SunRise Meraki Sharm (Permanent Staff)",
    nameAr: "منتجع ميراكي شرم الشيخ (العمالة الدائمة)",
    category: "permanent",
    databaseName: "DB_MERAKI_PERM",
    serverHost: "192.168.10.12",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "MRK-PERM-FY2026",
    badge: "MRK-01 • Permanent",
  },
  {
    id: 2,
    code: "MRK-02",
    nameEn: "SunRise Meraki Sharm Casual",
    nameAr: "منتجع ميراكي شرم الشيخ (كاجوال وعمالة يومية)",
    category: "casuals",
    databaseName: "DB_MERAKI_CASUAL",
    serverHost: "192.168.10.12",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "MRK-CAS-FY2026",
    badge: "MRK-02 • Casuals",
  },
  {
    id: 3,
    code: "WH-01",
    nameEn: "SunRise White Hills (Permanent Staff)",
    nameAr: "منتجع وايت هيلز شرم الشيخ (العمالة الدائمة)",
    category: "permanent",
    databaseName: "DB_WHITEHILLS_PERM",
    serverHost: "192.168.10.14",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "WH-PERM-FY2026",
    badge: "WH-01 • Permanent",
  },
  {
    id: 4,
    code: "WH-02",
    nameEn: "SunRise White Hills Casual",
    nameAr: "منتجع وايت هيلز شرم الشيخ (كاجوال وعمالة يومية)",
    category: "casuals",
    databaseName: "DB_WHITEHILLS_CASUAL",
    serverHost: "192.168.10.14",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "WH-CAS-FY2026",
    badge: "WH-02 • Casuals",
  },
  {
    id: 5,
    code: "RML-01",
    nameEn: "SunRise Remal Beach Permanent",
    nameAr: "منتجع ريمال بيتش (العمالة الدائمة)",
    category: "permanent",
    databaseName: "DB_REMAL_PERM",
    serverHost: "192.168.10.16",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "RML-PERM-FY2026",
    badge: "RML-01 • Permanent",
  },
  {
    id: 6,
    code: "RML-02",
    nameEn: "SunRise Remal Beach Casual",
    nameAr: "منتجع ريمال بيتش (كاجوال)",
    category: "casuals",
    databaseName: "DB_REMAL_CASUAL",
    serverHost: "192.168.10.16",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "RML-CAS-FY2026",
    badge: "RML-02 • Casuals",
  },
  {
    id: 7,
    code: "RMR-01",
    nameEn: "SunRise Remal Resort Casual",
    nameAr: "منتجع ريمال ريزورت (كاجوال)",
    category: "casuals",
    databaseName: "DB_REMALRES_CASUAL",
    serverHost: "192.168.10.18",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "RMR-CAS-FY2026",
    badge: "RMR-01 • Casuals",
  },
  {
    id: 8,
    code: "DMD-01",
    nameEn: "SunRise Diamond Beach Resort (Permanent)",
    nameAr: "منتجع دايموند بيتش شرم الشيخ (عمالة دائمة)",
    category: "permanent",
    databaseName: "DB_DIAMOND_PERM",
    serverHost: "192.168.10.20",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "DMD-PERM-FY2026",
    badge: "DMD-01 • Permanent",
  },
  {
    id: 9,
    code: "DMD-02",
    nameEn: "SunRise Diamond Beach Casual",
    nameAr: "منتجع دايموند بيتش (كاجوال)",
    category: "casuals",
    databaseName: "DB_DIAMOND_CASUAL",
    serverHost: "192.168.10.20",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "DMD-CAS-FY2026",
    badge: "DMD-02 • Casuals",
  },
  {
    id: 10,
    code: "ARB-01",
    nameEn: "SunRise Arabian Beach Resort",
    nameAr: "منتجع أرابيان بيتش شرم الشيخ (عمالة دائمة)",
    category: "permanent",
    databaseName: "DB_ARABIAN_PERM",
    serverHost: "192.168.10.22",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "ARB-PERM-FY2026",
    badge: "ARB-01 • Permanent",
  },
  {
    id: 11,
    code: "MSM-01",
    nameEn: "SunRise Montemare Resort",
    nameAr: "منتجع مونتيماري جراند سيلكت شرم الشيخ",
    category: "permanent",
    databaseName: "DB_MONTEMARE_PERM",
    serverHost: "192.168.10.24",
    cityAr: "شرم الشيخ",
    cityEn: "Sharm El Sheikh",
    ledgerCode: "MSM-PERM-FY2026",
    badge: "MSM-01 • Permanent",
  },
  {
    id: 12,
    code: "SCB-01",
    nameEn: "SunRise Crystal Bay Resort (Permanent)",
    nameAr: "منتجع كريستال باي الغردقة (العمالة الدائمة)",
    category: "permanent",
    databaseName: "DB_CRYSTAL_PERM",
    serverHost: "192.168.20.10",
    cityAr: "الغردقة",
    cityEn: "Hurghada",
    ledgerCode: "SCB-PERM-FY2026",
    badge: "SCB-01 • Permanent",
  },
  {
    id: 13,
    code: "SCB-02",
    nameEn: "SunRise Crystal Bay Casual",
    nameAr: "منتجع كريستال باي الغردقة (كاجوال وموسمي)",
    category: "casuals",
    databaseName: "DB_CRYSTAL_CASUAL",
    serverHost: "192.168.20.10",
    cityAr: "الغردقة",
    cityEn: "Hurghada",
    ledgerCode: "SCB-CAS-FY2026",
    badge: "SCB-02 • Casuals",
  },
  {
    id: 14,
    code: "TUC-01",
    nameEn: "SunRise Tucana Resort Makadi",
    nameAr: "منتجع توكانا مكادي الغردقة (عمالة دائمة)",
    category: "permanent",
    databaseName: "DB_TUCANA_PERM",
    serverHost: "192.168.20.14",
    cityAr: "مكادي باي",
    cityEn: "Makadi Bay",
    ledgerCode: "TUC-PERM-FY2026",
    badge: "TUC-01 • Permanent",
  },
  {
    id: 15,
    code: "ROH-01",
    nameEn: "SunRise Romance Resort Sahl Hasheesh",
    nameAr: "منتجع رومانس سهل حشيش الغردقة",
    category: "permanent",
    databaseName: "DB_ROMANCE_PERM",
    serverHost: "192.168.20.16",
    cityAr: "سهل حشيش",
    cityEn: "Sahl Hasheesh",
    ledgerCode: "ROH-PERM-FY2026",
    badge: "ROH-01 • Permanent",
  },
  {
    id: 16,
    code: "GDB-01",
    nameEn: "SunRise Garden Beach Resort",
    nameAr: "منتجع جاردن بيتش الغردقة",
    category: "permanent",
    databaseName: "DB_GARDEN_PERM",
    serverHost: "192.168.20.18",
    cityAr: "الغردقة",
    cityEn: "Hurghada",
    ledgerCode: "GDB-PERM-FY2026",
    badge: "GDB-01 • Permanent",
  },
  {
    id: 17,
    code: "MLK-01",
    nameEn: "SunRise Mamlouk Palace Resort",
    nameAr: "منتجع مملوك بالاس الغردقة",
    category: "permanent",
    databaseName: "DB_MAMLOUK_PERM",
    serverHost: "192.168.20.20",
    cityAr: "الغردقة",
    cityEn: "Hurghada",
    ledgerCode: "MLK-PERM-FY2026",
    badge: "MLK-01 • Permanent",
  },
  {
    id: 18,
    code: "AQJ-01",
    nameEn: "SunRise Aqua Joy Resort",
    nameAr: "منتجع أكوا جوي الغردقة",
    category: "permanent",
    databaseName: "DB_AQUAJOY_PERM",
    serverHost: "192.168.20.22",
    cityAr: "الغردقة",
    cityEn: "Hurghada",
    ledgerCode: "AQJ-PERM-FY2026",
    badge: "AQJ-01 • Permanent",
  },
];

interface SstHotelSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty: (property: SstPropertyItem) => void;
  initialSelectedCode?: string;
}

export function SstHotelSelectionDialog({
  isOpen,
  onClose,
  onSelectProperty,
  initialSelectedCode = "MRK-02",
}: SstHotelSelectionDialogProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "permanent" | "casuals">("all");
  const [selectedItem, setSelectedItem] = useState<SstPropertyItem>(() => {
    return (
      SUNRISE_SST_HOTELS.find((h) => h.code === initialSelectedCode) ||
      SUNRISE_SST_HOTELS[1] // Default to SunRise Meraki Sharm Casual
    );
  });

  const filteredHotels = useMemo(() => {
    return SUNRISE_SST_HOTELS.filter((hotel) => {
      if (categoryFilter !== "all" && hotel.category !== categoryFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        hotel.code.toLowerCase().includes(q) ||
        hotel.nameAr.toLowerCase().includes(q) ||
        hotel.nameEn.toLowerCase().includes(q) ||
        hotel.databaseName.toLowerCase().includes(q) ||
        hotel.cityAr.toLowerCase().includes(q) ||
        hotel.cityEn.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, searchQuery]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedItem) {
      onSelectProperty(selectedItem);
    }
  };

  const handleRowDoubleClick = (hotel: SstPropertyItem) => {
    setSelectedItem(hotel);
    onSelectProperty(hotel);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 select-none"
      dir={ar ? "rtl" : "ltr"}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && selectedItem) handleConfirm();
      }}
    >
      {/* Authentic Win32 Dialog Window Frame */}
      <div className="w-full max-w-4xl bg-[#ECE9D8] dark:bg-slate-900 border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-2xl flex flex-col max-h-[85vh]">
        {/* Win32 Classical Gradient Title Bar */}
        <div className="h-7 bg-gradient-to-r from-[#0A246A] via-[#0055EA] to-[#A6CAF0] dark:from-slate-950 dark:to-slate-800 text-white font-bold text-xs px-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5">
            <Hotel className="w-3.5 h-3.5 text-amber-300" />
            <span className="tracking-wide">
              {ar
                ? "اختيار المنشأة والفندق — Integrated System For Payroll & HR (SST 26.0)"
                : "Select Company / Hotel — Integrated System For Payroll & HR (SST 26.0)"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              title={ar ? "إغلاق" : "Close"}
              className="w-4 h-4 bg-[#ECE9D8] text-slate-800 hover:bg-red-600 hover:text-white flex items-center justify-center text-[10px] font-black border border-[#808080] rounded-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Dialog Sub-header & Filter Bar */}
        <div className="p-3 bg-[#F0EFE6] dark:bg-slate-900/90 border-b border-[#D4D0C8] dark:border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {ar ? "فنادق وشركات مجموعة صن رايز:" : "Sunrise Resorts & Companies:"}
              </span>
              <span className="text-[11px] text-slate-500 font-mono bg-white dark:bg-slate-800 px-2 py-0.5 border border-[#808080] rounded-xs">
                {filteredHotels.length} / {SUNRISE_SST_HOTELS.length} {ar ? "منشأة مسجلة" : "Entities"}
              </span>
            </div>

            {/* Classification Toggle Buttons (Permanent vs Casuals) */}
            <div className="flex items-center gap-1 bg-[#D4D0C8] dark:bg-slate-800 p-0.5 border border-[#808080] rounded-xs text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-3 py-1 font-semibold rounded-xs transition-colors ${
                  categoryFilter === "all"
                    ? "bg-[#0A246A] text-white shadow-xs"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/60"
                }`}
              >
                {ar ? "الكل (All)" : "All (الكل)"}
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("permanent")}
                className={`px-3 py-1 font-semibold rounded-xs transition-colors ${
                  categoryFilter === "permanent"
                    ? "bg-[#0A246A] text-white shadow-xs"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/60"
                }`}
              >
                {ar ? "عمالة دائمة (Permanent)" : "Permanent Staff"}
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("casuals")}
                className={`px-3 py-1 font-semibold rounded-xs transition-colors ${
                  categoryFilter === "casuals"
                    ? "bg-[#0A246A] text-white shadow-xs"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/60"
                }`}
              >
                {ar ? "عمالة كاجوال ويومية (Casuals)" : "Casual Workers"}
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute top-2.5 right-2.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                ar
                  ? "بحث بكود الفندق أو اسم الفندق (مثال: Meraki, Casual, White Hills, 02)..."
                  : "Search hotel code, name, database (e.g. Meraki, Casual)..."
              }
              className="w-full text-xs bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-[#808080] px-2.5 py-1.5 focus:outline-hidden focus:border-[#0A246A]"
              autoFocus
            />
          </div>
        </div>

        {/* Windows DataGrid Table */}
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 p-1 border border-[#808080] m-2 min-h-[300px]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#ECE9D8] dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-[#808080] sticky top-0 text-right">
                <th className="p-1.5 border-r border-[#D4D0C8] font-bold text-center w-16">
                  {ar ? "الكود" : "Code"}
                </th>
                <th className="p-1.5 border-r border-[#D4D0C8] font-bold">
                  {ar ? "اسم المنشأة / الفندق" : "Company / Hotel Name"}
                </th>
                <th className="p-1.5 border-r border-[#D4D0C8] font-bold text-center w-28">
                  {ar ? "تصنيف العمالة" : "Staff Type"}
                </th>
                <th className="p-1.5 border-r border-[#D4D0C8] font-bold text-center w-36">
                  {ar ? "قاعدة البيانات" : "Database"}
                </th>
                <th className="p-1.5 font-bold text-center w-28">
                  {ar ? "المدينة / الموقع" : "Location"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    {ar ? "لا توجد منشأة مطابقة لبحثك" : "No matching hotels found"}
                  </td>
                </tr>
              ) : (
                filteredHotels.map((hotel) => {
                  const isSelected = selectedItem?.code === hotel.code;
                  return (
                    <tr
                      key={hotel.code}
                      onClick={() => setSelectedItem(hotel)}
                      onDoubleClick={() => handleRowDoubleClick(hotel)}
                      className={`cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/50 ${
                        isSelected
                          ? "bg-[#0A246A] text-white font-semibold"
                          : "hover:bg-blue-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200 odd:bg-slate-50/50 dark:odd:bg-slate-900/30"
                      }`}
                    >
                      <td className="p-1.5 text-center font-mono text-[11px] border-r border-slate-200 dark:border-slate-800">
                        {hotel.code}
                      </td>
                      <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Building2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? "text-amber-300" : "text-slate-500"
                            }`}
                          />
                          <span className="font-bold">{ar ? hotel.nameAr : hotel.nameEn}</span>
                        </div>
                      </td>
                      <td className="p-1.5 text-center border-r border-slate-200 dark:border-slate-800">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-xs font-bold ${
                            hotel.category === "casuals"
                              ? isSelected
                                ? "bg-amber-400 text-slate-950"
                                : "bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300"
                              : isSelected
                              ? "bg-blue-400 text-slate-950"
                              : "bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300"
                          }`}
                        >
                          {hotel.category === "casuals"
                            ? ar
                              ? "عمالة كاجوال"
                              : "Casuals"
                            : ar
                            ? "عمالة دائمة"
                            : "Permanent"}
                        </span>
                      </td>
                      <td className="p-1.5 text-center font-mono text-[11px] border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-center gap-1">
                          <Database className="w-3 h-3 opacity-70" />
                          <span>{hotel.databaseName}</span>
                        </div>
                      </td>
                      <td className="p-1.5 text-center text-[11px]">
                        {ar ? hotel.cityAr : hotel.cityEn}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Hotel Preview Banner */}
        {selectedItem && (
          <div className="px-3 py-1.5 bg-[#E1DEC7] dark:bg-slate-900 text-xs flex items-center justify-between border-t border-[#808080]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {ar ? "المنشأة المحددة:" : "Selected Property:"}
              </span>
              <span className="font-black text-[#0A246A] dark:text-amber-400 font-mono">
                [{selectedItem.code}] {ar ? selectedItem.nameAr : selectedItem.nameEn}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
              Server: {selectedItem.serverHost} ({selectedItem.databaseName})
            </div>
          </div>
        )}

        {/* Dialog Actions Footer */}
        <div className="p-2.5 bg-[#ECE9D8] dark:bg-slate-900 border-t border-[#FFFFFF] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedItem}
            className="px-6 py-1 bg-[#ECE9D8] hover:bg-[#F5F4EE] active:bg-[#D4D0C8] text-slate-900 font-bold text-xs border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>{ar ? "موافق / اختيار (Enter)" : "OK / Select (Enter)"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1 bg-[#ECE9D8] hover:bg-[#F5F4EE] active:bg-[#D4D0C8] text-slate-900 font-bold text-xs border-2 border-t-[#FFFFFF] border-l-[#FFFFFF] border-r-[#808080] border-b-[#808080] shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5 text-red-600" />
            <span>{ar ? "إلغاء الأمر (Esc)" : "Cancel (Esc)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
