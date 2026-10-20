import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Printer,
  Search,
  Folder,
  FileText,
  Star,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface ReportsCatalogTabProps {
  propertyId: number;
}

export function ReportsCatalogTab({ propertyId }: ReportsCatalogTabProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("favorite");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ["payroll-reports-catalog"],
    queryFn: async () => {
      const res = await fetch("/api/payroll/reports/catalog");
      if (!res.ok) throw new Error("Failed to load catalog");
      return res.json();
    },
  });

  const categories: any[] = catalogData?.categories || [];

  // Report items mapped by category
  const reportsDictionary: Record<string, any[]> = {
    favorite: [
      { id: "fav-1", titleAr: "مسير الرواتب الشهري المعتمد (Payroll Sheet)", format: "PDF / Excel", code: "SST-PAY-01" },
      { id: "fav-2", titleAr: "شيت تحويل المرتبات للبنوك بنظام WPS", format: "Excel / TXT", code: "SST-WPS-01" },
      { id: "fav-3", titleAr: "توزيع حصيلة خدمة الـ 12% (Tronc Pool 85/15)", format: "PDF", code: "SST-SC-01" },
      { id: "fav-4", titleAr: "كشف الحركات الشهرية المتغيرة والبدلات", format: "Excel", code: "SST-TRX-01" },
      { id: "fav-5", titleAr: "كشف أقساط السلف والخصومات البنكية", format: "PDF / Excel", code: "SST-LOAN-01" },
      { id: "fav-6", titleAr: "أرصدة إجازات العاملين والأوعية الأربعة", format: "PDF", code: "SST-VAC-01" },
      { id: "fav-7", titleAr: "مانيفست أتوبيس القاهرة للمسافرين", format: "PDF / Print", code: "SST-BUS-01" },
      { id: "fav-8", titleAr: "قيد اليومية العام للرواتب (GL Journal Voucher)", format: "Excel", code: "SST-GL-01" },
    ],
    payroll: [
      { id: "pay-1", titleAr: "مسير الرواتب الإجمالي المفصل بالأقسام", format: "PDF / Excel", code: "SST-PAY-01" },
      { id: "pay-2", titleAr: "مفردات مرتب الموظف (Individual Payslip)", format: "PDF", code: "SST-PAY-02" },
      { id: "pay-3", titleAr: "تقرير استقطاعات التأمينات الاجتماعية (حصة العامل والمنشأة)", format: "Excel", code: "SST-INS-01" },
      { id: "pay-4", titleAr: "تقرير ضريبة كسب العمل والوعاء الخاضع للضريبة", format: "Excel", code: "SST-TAX-01" },
      { id: "pay-5", titleAr: "كشف توزيع الأرباح السنوية ومكافأة الأداء", format: "PDF", code: "SST-PAY-05" },
      { id: "pay-6", titleAr: "شيت مقارنة الرواتب بين الشهر الحالي والسابق", format: "Excel", code: "SST-PAY-06" },
    ],
    official: [
      { id: "off-1", titleAr: "استمارة 1 تأمينات اجتماعية (الاشتراك لأول مرة)", format: "Gov Print", code: "GOV-F1" },
      { id: "off-2", titleAr: "استمارة 2 تأمينات اجتماعية (الأجور السنوية)", format: "Gov Print", code: "GOV-F2" },
      { id: "off-3", titleAr: "استمارة 6 تأمينات اجتماعية (إنهاء الاشتراك والخدمة)", format: "Gov Print", code: "GOV-F6" },
      { id: "off-4", titleAr: "تقرير نسبة الـ 5% لذوي الاحتياجات الخاصة (قوى عاملة)", format: "PDF", code: "GOV-DIS" },
      { id: "off-5", titleAr: "سجل قيد العاملين طبقاً للمادة 12 من قانون العمل", format: "Gov Registry", code: "GOV-REG" },
    ],
    leaves: [
      { id: "lv-1", titleAr: "تقرير أرصدة الإجازات السنوية المستحقة والمستهلكة", format: "PDF / Excel", code: "SST-LV-01" },
      { id: "lv-2", titleAr: "كشف الراحات الأسبوعية المؤجلة ورصيد الأعياد", format: "Excel", code: "SST-LV-02" },
      { id: "lv-3", titleAr: "سجل الإجازات المرضية المعتمدة من القومسيون الطبي", format: "PDF", code: "SST-LV-03" },
      { id: "lv-4", titleAr: "كشف إخطارات العودة من الإجازة المعتمدة", format: "PDF", code: "SST-LV-04" },
    ],
    time_machine: [
      { id: "tm-1", titleAr: "تقرير حركات البصمة الخام اليومية (Raw Punch Telemetry)", format: "Excel", code: "SST-TM-01" },
      { id: "tm-2", titleAr: "تقرير التأخيرات وساعات الانصراف المبكر", format: "PDF / Excel", code: "SST-TM-02" },
      { id: "tm-3", titleAr: "كشف ساعات العمل الإضافي المعتمدة (Approved Overtime)", format: "Excel", code: "SST-TM-03" },
      { id: "tm-4", titleAr: "مصفوفة الورديات وجدول التشغيل الشهري (Roster Matrix)", format: "Excel", code: "SST-TM-04" },
    ],
    housing: [
      { id: "hs-1", titleAr: "تقرير نسب إشغال سكن العاملين وتوزيع الغرف", format: "PDF / Excel", code: "SST-HS-01" },
      { id: "hs-2", titleAr: "كشف مانيفست رحلات أتوبيس القاهرة ومقاعد السفر", format: "Print / PDF", code: "SST-BUS-01" },
      { id: "hs-3", titleAr: "بيان استهلاك الكهرباء والمرافق بالسكن الإداري", format: "Excel", code: "SST-HS-03" },
    ],
  };

  const currentReports = reportsDictionary[selectedCategoryId] || reportsDictionary.payroll;

  const filteredReports = currentReports.filter((r) => {
    return (
      !searchQuery ||
      r.titleAr.includes(searchQuery) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse"></span>
            <h3 className="text-base font-bold text-slate-800">
              {ar ? "دليل تقارير الرواتب والأجور (SST 26.0 Reports Catalog)" : "SST Payroll Reports Catalog"}
            </h3>
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
              20 Core Suites
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ar
              ? "فهرس التقارير الفندقية المتكامل المصنف وفق النظام الأصلي (شؤون العاملين، البصمة، الرواتب، الأتوبيس، التأمينات)"
              : "Comprehensive hospitality reports index matching legacy SST classifications"}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ar ? "بحث سريع في التقارير..." : "Search reports..."}
            className="text-xs rounded-xl bg-slate-50 ps-8"
          />
        </div>
      </div>

      {/* Grid: 20 Categories on Left, Report List on Right */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Left Category Browser */}
        <Card className="rounded-2xl border-slate-200 shadow-xs md:col-span-1 p-2">
          <div className="p-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            {ar ? "أقسام ودليل التقارير الـ 20" : "20 Report Suites"}
          </div>
          <div className="space-y-1 max-h-[640px] overflow-y-auto">
            {categories.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-start cursor-pointer ${
                    isSelected
                      ? "bg-[#0f2942] text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {cat.id === "favorite" ? (
                      <Star className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-amber-400" : "text-amber-500"}`} />
                    ) : (
                      <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#c89332]" : "text-slate-400"}`} />
                    )}
                    <span className="truncate">{ar ? cat.titleAr : cat.titleEn}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 h-4 ${
                      isSelected
                        ? "bg-white/20 text-white border-white/30"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {cat.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right Report Templates */}
        <Card className="rounded-2xl border-slate-200 shadow-xs md:col-span-3">
          <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black text-slate-800">
                {ar ? selectedCategory?.titleAr : selectedCategory?.titleEn}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {ar ? "التقارير المعتمدة الجاهزة للطباعة والتصدير المحاسبي" : "Approved reports ready for print and accounting export"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-3">
            <div className="space-y-2">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{report.titleAr}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] font-mono bg-slate-50 text-slate-600">
                          {report.code}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-medium">{report.format}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.success(ar ? `جاري إعداد تقرير: ${report.titleAr}` : `Preparing report: ${report.titleAr}`);
                      }}
                      className="gap-1 text-xs h-8 px-2.5 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#0f2942]" />
                      <span>{ar ? "معاينة وطباعة" : "Print"}</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        toast.success(ar ? `تم تصدير ملف الإكسيل لـ: ${report.titleAr}` : `Excel export generated for ${report.titleAr}`);
                      }}
                      className="gap-1 text-xs h-8 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{ar ? "تصدير Excel" : "Export"}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
