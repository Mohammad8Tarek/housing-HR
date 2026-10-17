import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  Users, 
  Calendar, 
  Download, 
  Calculator, 
  ShieldAlert, 
  FileSpreadsheet, 
  Landmark, 
  Clock, 
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/ui/permission-gate";

export default function PayrollPage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(2); // Default to Meraki Sharm
  const [employmentType, setEmploymentType] = useState<"regular" | "casual">("regular");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("runs");

  // 1. Fetch Properties from sunrise_payroll_attendance
  const { data: propData } = useQuery({
    queryKey: ["payroll-properties"],
    queryFn: async () => {
      const res = await fetch("/api/payroll/properties");
      if (!res.ok) throw new Error("Failed to load properties");
      return res.json();
    }
  });

  // 2. Fetch Employees (Regular vs Casual)
  const { data: empData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["payroll-employees", selectedPropertyId, employmentType, searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/employees?propertyId=${selectedPropertyId}&employmentType=${employmentType}&search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to load employees");
      return res.json();
    }
  });

  // 3. Fetch Payroll Periods & Runs
  const { data: periodData } = useQuery({
    queryKey: ["payroll-periods", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/periods?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load periods");
      return res.json();
    }
  });

  const { data: runData, isLoading: isLoadingRuns } = useQuery({
    queryKey: ["payroll-runs", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/runs?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load payroll runs");
      return res.json();
    }
  });

  // 4. Run Calculation Mutation
  const calculateMutation = useMutation({
    mutationFn: async (payload: { propertyId: number; payrollPeriodId: number; employmentType: string }) => {
      const res = await fetch("/api/payroll/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Calculation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم احتساب مسير الرواتب بنجاح!" : "Payroll calculated successfully!");
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const propertiesList = propData?.properties || [];
  const employeesList = empData?.employees || [];
  const runsList = runData?.runs || [];
  const periodsList = periodData?.periods || [];

  return (
    <div className="space-y-6 p-4 md:p-6" dir={ar ? "rtl" : "ltr"}>
      {/* Top Header & Property Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {ar ? "نظام الرواتب والأجور (Payroll System)" : "Payroll & Salaries System"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {ar 
                  ? "إدارة مسير المرتبات، الاستقطاعات، السلف، وشيتات البنوك المتوافقة مع قانون العمل والتأمينات المصرية"
                  : "End-to-end salary processing, Egyptian statutory compliance, deductions, and bank WPS"}
              </p>
            </div>
          </div>
        </div>

        {/* Hotel & Employment Type Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedPropertyId} 
            onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
            className="h-10 px-3 rounded-lg border bg-background font-medium text-sm focus:ring-2 focus:ring-emerald-500"
          >
            {propertiesList.map((p: any) => (
              <option key={p.id} value={p.id}>
                {ar ? p.nameAr : p.nameEn}
              </option>
            ))}
          </select>

          {/* Toggle Regular vs Casual */}
          <div className="inline-flex rounded-lg border bg-muted p-1">
            <button
              onClick={() => setEmploymentType("regular")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                employmentType === "regular" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ar ? "العمالة المثبتة (Regular)" : "Regular Staff"}
            </button>
            <button
              onClick={() => setEmploymentType("casual")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                employmentType === "casual" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ar ? "العمالة اليومية (Casual)" : "Casual Workers"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs matching SST Menus */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap items-center gap-1.5 w-full h-auto p-1.5 bg-muted/60 rounded-xl">
          <TabsTrigger value="runs" className="py-2.5 gap-2">
            <Calculator className="w-4 h-4" />
            <span>{ar ? "مسير الرواتب (End Period)" : "Payroll Runs"}</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="py-2.5 gap-2">
            <Users className="w-4 h-4" />
            <span>{ar ? "ملفات الموظفين (Employees)" : "Employees & Salaries"}</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="py-2.5 gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>{ar ? "العمليات والسلف (Functions)" : "Operations & Loans"}</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="py-2.5 gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{ar ? "التقارير وشيتات البنوك (WPS)" : "Reports & Bank WPS"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Payroll Runs */}
        <TabsContent value="runs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {ar ? "سجل دورات الرواتب الشهرية" : "Monthly Payroll Runs"}
            </h3>
            <PermissionGate module="payroll" action="create">
              <Button 
                onClick={() => {
                  if (periodsList.length === 0) {
                    toast.error(ar ? "يرجى إنشاء فترة مالية أولاً" : "Please create a payroll period first");
                    return;
                  }
                  calculateMutation.mutate({
                    propertyId: selectedPropertyId,
                    payrollPeriodId: periodsList[0].id,
                    employmentType,
                  });
                }}
                disabled={calculateMutation.isPending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Calculator className="w-4 h-4" />
                <span>{calculateMutation.isPending ? (ar ? "جاري الاحتساب..." : "Calculating...") : (ar ? "احتساب مسير الشهر" : "Calculate Payroll")}</span>
              </Button>
            </PermissionGate>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{ar ? "إجمالي صافي الرواتب المحتسبة" : "Total Net Payroll"}</CardDescription>
                <CardTitle className="text-2xl text-emerald-600">
                  {runsList[0]?.totalNet ? `${Number(runsList[0].totalNet).toLocaleString()} EGP` : "0.00 EGP"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{ar ? "للفترة الحالية المعتمدة" : "For active payroll period"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{ar ? "إجمالي الاستقطاعات والضرائب" : "Total Deductions & Taxes"}</CardDescription>
                <CardTitle className="text-2xl text-rose-600">
                  {runsList[0]?.totalDeductions ? `${Number(runsList[0].totalDeductions).toLocaleString()} EGP` : "0.00 EGP"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{ar ? "تأمينات، كسب عمل، سلف، وجزاءات" : "Insurance, tax, loans, penalties"}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{ar ? "عدد الموظفين في المسير" : "Processed Employees"}</CardDescription>
                <CardTitle className="text-2xl text-blue-600">
                  {runsList[0]?.totalEmployees || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{employmentType === "regular" ? (ar ? "عمالة مثبتة" : "Regular Staff") : (ar ? "عمالة يوميات" : "Casual Workers")}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted text-muted-foreground border-b text-xs font-semibold uppercase">
                    <tr>
                      <th className="p-3 text-center">#</th>
                      <th className="p-3">{ar ? "الفندق" : "Property"}</th>
                      <th className="p-3">{ar ? "نوع العمالة" : "Entity"}</th>
                      <th className="p-3 text-center">{ar ? "الموظفين" : "Staff"}</th>
                      <th className="p-3">{ar ? "إجمالي الاستحقاقات" : "Total Gross"}</th>
                      <th className="p-3">{ar ? "إجمالي الاستقطاعات" : "Deductions"}</th>
                      <th className="p-3">{ar ? "صافي المرتبات" : "Net Salary"}</th>
                      <th className="p-3 text-center">{ar ? "الحالة" : "Status"}</th>
                      <th className="p-3 text-center">{ar ? "الإجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {runsList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                          {ar ? "لا توجد مسيرات رواتب محتسبة حتى الآن. اضغط 'احتساب مسير الشهر' للبدء." : "No payroll runs yet. Click 'Calculate Payroll' to begin."}
                        </td>
                      </tr>
                    ) : (
                      runsList.map((run: any) => (
                        <tr key={run.id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-3 text-center font-mono">{run.id}</td>
                          <td className="p-3 font-medium">
                            {propertiesList.find((p: any) => p.id === run.propertyId)?.nameAr || `Property #${run.propertyId}`}
                          </td>
                          <td className="p-3">
                            <Badge variant={run.employmentType === "casual" ? "secondary" : "default"}>
                              {run.employmentType === "casual" ? (ar ? "يوميات" : "Casual") : (ar ? "أساسي" : "Regular")}
                            </Badge>
                          </td>
                          <td className="p-3 text-center font-mono">{run.totalEmployees}</td>
                          <td className="p-3 font-mono">{Number(run.totalGross).toLocaleString()} EGP</td>
                          <td className="p-3 font-mono text-rose-600">-{Number(run.totalDeductions).toLocaleString()} EGP</td>
                          <td className="p-3 font-mono font-bold text-emerald-600">{Number(run.totalNet).toLocaleString()} EGP</td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50">
                              {run.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <a 
                              href={`/api/payroll/runs/${run.id}/wps`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent text-accent-foreground"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{ar ? "ملف البنك WPS" : "Bank WPS"}</span>
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Employees Directory */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input 
                placeholder={ar ? "بحث بالاسم، كود الموظف، البصمة..." : "Search name, code, biometric ID..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {ar ? `إجمالي الموظفين: ${employeesList.length}` : `Total Employees: ${employeesList.length}`}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted text-muted-foreground border-b text-xs font-semibold uppercase">
                    <tr>
                      <th className="p-3">{ar ? "الكود" : "Code"}</th>
                      <th className="p-3">{ar ? "اسم الموظف" : "Employee Name"}</th>
                      <th className="p-3">{ar ? "النوع" : "Entity"}</th>
                      <th className="p-3">{ar ? "رقم البصمة" : "Biometric ID"}</th>
                      <th className="p-3">{ar ? "الراتب الأساسي" : "Base Salary"}</th>
                      <th className="p-3">{ar ? "التأمينات" : "Insurance"}</th>
                      <th className="p-3">{ar ? "الحساب البنكي" : "Bank Account"}</th>
                      <th className="p-3 text-center">{ar ? "الحالة" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {employeesList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          {ar ? "لا يوجد موظفون مطابقون لشروط البحث." : "No employees match the filter criteria."}
                        </td>
                      </tr>
                    ) : (
                      employeesList.map((emp: any) => (
                        <tr key={emp.id} className="hover:bg-muted/50">
                          <td className="p-3 font-mono font-bold text-xs">{emp.employeeCode}</td>
                          <td className="p-3">
                            <div className="font-medium">{emp.fullName}</div>
                            {emp.fullNameAr && <div className="text-xs text-muted-foreground">{emp.fullNameAr}</div>}
                          </td>
                          <td className="p-3">
                            <Badge variant={emp.employmentType === "casual" ? "secondary" : "default"}>
                              {emp.employmentType === "casual" ? (ar ? "يومية" : "Casual") : (ar ? "مثبت" : "Regular")}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-xs">{emp.biometricId || "-"}</td>
                          <td className="p-3 font-mono font-medium">{Number(emp.baseSalary).toLocaleString()} EGP</td>
                          <td className="p-3">
                            {emp.isInsured ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50 text-[10px]">
                                {ar ? "مؤمن عليه" : "Insured"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 text-[10px]">
                                {ar ? "غير مؤمن" : "Not Insured"}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">
                            {emp.bankAccountNumber || emp.iban || (ar ? "نقدي" : "Cash")}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50 text-xs">
                              {emp.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Operations & Functions */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-base">{ar ? "السلف والقروض الشهرية" : "Loans & Monthly Advances"}</CardTitle>
                </div>
                <CardDescription>
                  {ar ? "تسجيل ومتابعة سلف العاملين وجدول الاستقطاع التلقائي من مسير الرواتب" : "Track salary advances and automatic monthly installment deductions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {ar ? "يتم خصم الأقساط الشهرية آلياً عند تشغيل زر 'احتساب مسير الشهر' لحماية أموال الفندق." : "Installments are automatically deducted upon monthly payroll calculation."}
                </p>
                <div className="p-4 bg-muted/40 rounded-lg border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>{ar ? "الحد الأقصى للسلفة:" : "Max Advance Limit:"}</span>
                    <span className="font-bold">50% {ar ? "من الراتب الأساسي" : "of base salary"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{ar ? "طريقة التحصيل:" : "Recovery Method:"}</span>
                    <span className="font-bold">{ar ? "استقطاع شهري مباشر" : "Direct monthly slip deduction"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <CardTitle className="text-base">{ar ? "الجزاءات والتحقيقات الإدارية" : "Disciplinary Actions & Penalties"}</CardTitle>
                </div>
                <CardDescription>
                  {ar ? "تطبيق لائحة الجزاءات المعتمدة وقرارات الشؤون القانونية" : "Legal investigations and statutory salary penalty deductions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {ar ? "تُخصم أيام الجزاءات من قيمة أجر اليوم تلقائياً مع تسجيل رقم التحقيق وتفاصيل القرار." : "Penalty days are converted to day-rate deductions automatically with audit logs."}
                </p>
                <div className="p-4 bg-muted/40 rounded-lg border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>{ar ? "التوافق القانوني:" : "Legal Compliance:"}</span>
                    <span className="font-bold text-emerald-600">{ar ? "متوافق مع قانون العمل المصري" : "Egyptian Labor Law Compliant"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{ar ? "الحد الأقصى للخصم:" : "Max Monthly Deduction:"}</span>
                    <span className="font-bold">5 {ar ? "أيام شهرياً" : "days per month"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Bank WPS & Reports */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <CardTitle>{ar ? "ملفات البنوك المعتمدة ومسيرات الرواتب (Bank WPS)" : "Approved Bank WPS Files & Reports"}</CardTitle>
              </div>
              <CardDescription>
                {ar ? "توليد ملفات التحويل البنكي الإلكتروني المتوافقة مع البنوك المصرية (CIB, NBE, QNB, Banque Misr)" : "Export certified WPS payment files for Egyptian commercial banks"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 border rounded-lg bg-card">
                  <h4 className="font-bold text-sm mb-1">{ar ? "البنك الأهلي المصري (NBE)" : "National Bank of Egypt"}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{ar ? "صيغة WPS القياسية لرواتب الموظفين" : "Standard WPS payroll format"}</p>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    <span>{ar ? "تحميل كشف NBE" : "Export NBE Sheet"}</span>
                  </Button>
                </div>

                <div className="p-4 border rounded-lg bg-card">
                  <h4 className="font-bold text-sm mb-1">{ar ? "البنك التجاري الدولي (CIB)" : "Commercial International Bank"}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{ar ? "كشف الرواتب الإلكتروني المعتمد" : "Certified electronic payroll format"}</p>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    <span>{ar ? "تحميل كشف CIB" : "Export CIB Sheet"}</span>
                  </Button>
                </div>

                <div className="p-4 border rounded-lg bg-card">
                  <h4 className="font-bold text-sm mb-1">{ar ? "كشف مسير الرواتب العام (Excel)" : "Comprehensive Excel Sheet"}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{ar ? "تقرير تفصيلي بجميع الاستحقاقات والاستقطاعات" : "Full audit report with all components"}</p>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    <span>{ar ? "تصدير شيت إكسيل كامل" : "Export Full Excel"}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
