import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Plus,
  Printer,
  ChevronDown,
  Building2,
  Receipt,
  Percent,
  FileCheck2,
  Eye,
  AlertTriangle,
  Pencil
} from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/ui/permission-gate";
import { formatDate } from "@/lib/date-utils";

export default function PayrollPage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(2); // Default to Meraki Sharm
  const [employmentType, setEmploymentType] = useState<"regular" | "casual">("regular");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("runs");

  // Modals state
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedSlipData, setSelectedSlipData] = useState<any>(null);

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanForm, setLoanForm] = useState({
    employeeId: "",
    requestType: "monthly_advance",
    totalAmount: "3000",
    installmentsCount: "3",
    disbursedDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState({
    employeeId: "",
    incidentDate: new Date().toISOString().split("T")[0],
    penaltyType: "salary_deduction_days",
    deductionDays: "1.0",
    deductionAmount: "0.00",
    investigationNumber: "INV-2026-",
    reason: "",
  });

  const [isServiceChargeModalOpen, setIsServiceChargeModalOpen] = useState(false);
  const [serviceChargeForm, setServiceChargeForm] = useState({
    totalServiceAmount: "450000",
    hotelSharePercent: "15.00",
    notes: "حصيلة عمولة الخدمة الفندقية 12% لشهر العمل",
  });

  // End of Service Gratuity Calculator State
  const [isEosModalOpen, setIsEosModalOpen] = useState(false);
  const [eosForm, setEosForm] = useState({
    employeeId: "",
    terminationDate: new Date().toISOString().split("T")[0],
    leaveBalanceDays: 14,
    terminationReason: "retirement",
  });
  const [eosResult, setEosResult] = useState<any>(null);

  // Tax Simulator State
  const [isTaxSimOpen, setIsTaxSimOpen] = useState(false);
  const [taxSimSalary, setTaxSimSalary] = useState<number>(12000);

  // New Period Modal State
  const [isNewPeriodOpen, setIsNewPeriodOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({
    periodName: `نوفمبر ${new Date().getFullYear()}`,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`,
    endDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-30`,
    totalWorkingDays: 30,
  });

  // Edit Employee Salary Modal State
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [editEmployeeForm, setEditEmployeeForm] = useState({
    id: 0,
    employeeCode: "",
    fullName: "",
    baseSalary: "0.00",
    insuranceSalary: "0.00",
    isInsured: true,
    bankName: "",
    bankAccountNumber: "",
    iban: "",
    employmentType: "regular",
    biometricId: "",
  });

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

  // 4. Fetch Loans
  const { data: loansData } = useQuery({
    queryKey: ["payroll-loans", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll-operations/loans?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load loans");
      return res.json();
    }
  });

  // 5. Fetch Penalties
  const { data: penaltiesData } = useQuery({
    queryKey: ["payroll-penalties", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll-operations/penalties?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load penalties");
      return res.json();
    }
  });

  // 6. Fetch Service Charge Pools
  const { data: scData } = useQuery({
    queryKey: ["payroll-service-charge", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/service-charge?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load service charge");
      return res.json();
    }
  });

  // 7. Run Calculation Mutation
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
      toast.success(ar ? "تم احتساب مسير الرواتب وتحديث شيتات البنوك بنجاح!" : "Payroll calculated and bank sheets generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  // Create Loan Mutation
  const createLoanMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/payroll-operations/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create loan");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم تسجيل السلفة وجدول الأقساط الشهرية بنجاح!" : "Loan and installments schedule created successfully!");
      setIsLoanModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payroll-loans"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Create Penalty Mutation
  const createPenaltyMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/payroll-operations/penalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to register penalty");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم تسجيل قرار الجزاء وربطه بمسير الرواتب بنجاح!" : "Disciplinary penalty recorded and linked to payroll!");
      setIsPenaltyModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payroll-penalties"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Calculate Service Charge Mutation
  const calculateServiceChargeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/payroll/service-charge/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to calculate service charge");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم احتساب وتوزيع وعاء عمولة الـ 12% على العاملين بنجاح!" : "12% Service Charge pool distributed successfully!");
      setIsServiceChargeModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payroll-service-charge"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Calculate End of Service Mutation
  const calculateEosMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/payroll/end-of-service/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to calculate settlement");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setEosResult(data.settlement);
      toast.success(ar ? "تم احتساب مكافأة نهاية الخدمة وتصفية المستحقات بنجاح!" : "End of service settlement calculated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Create Payroll Period Mutation
  const createPeriodMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/payroll/periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, propertyId: selectedPropertyId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create payroll period");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم إنشاء الفترة المالية بنجاح!" : "Payroll period created successfully!");
      setIsNewPeriodOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payroll-periods"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update Employee Salary & Allowances Mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (payload: { id: number; data: any }) => {
      const res = await fetch(`/api/payroll/employees/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update employee salary");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم تحديث بيانات وراتب الموظف بنجاح!" : "Employee salary updated successfully!");
      setIsEditEmployeeOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payroll-employees"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Tax Simulator Query
  const { data: taxSimData, isLoading: isLoadingTaxSim } = useQuery({
    queryKey: ["payroll-tax-simulator", taxSimSalary],
    queryFn: async () => {
      const res = await fetch("/api/payroll/tax-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grossSalary: taxSimSalary }),
      });
      if (!res.ok) throw new Error("Failed to simulate tax");
      return res.json();
    },
    enabled: isTaxSimOpen,
  });

  // Cost Centers Query
  const { data: costCentersData } = useQuery({
    queryKey: ["payroll-cost-centers", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/analytics/cost-centers?propertyId=${selectedPropertyId}`);
      if (!res.ok) return { costCenters: [] };
      return res.json();
    },
  });

  const costCentersList = costCentersData?.costCenters || [];
  const propertiesList = propData?.properties || [];
  const employeesList = empData?.employees || [];
  const runsList = runData?.runs || [];
  const periodsList = periodData?.periods || [];
  const loansList = loansData?.loans || [];
  const penaltiesList = penaltiesData?.penalties || [];
  const serviceChargePoolsList = scData?.pools || [];

  // Helper to open salary slip modal for employee
  const openSlipForEmployee = async (emp: any) => {
    try {
      const res = await fetch(`/api/payroll/employees/${emp.id}/latest-slip`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.slip) {
          setSelectedSlipData(json.slip);
          setIsSlipModalOpen(true);
          return;
        }
      }
    } catch {}

    // Fallback: Accurate calculation from real employee profile
    const base = Number(emp.baseSalary || 6000);
    const insSalary = Number(emp.insuranceSalary) || base;
    const insurableWage = Math.min(Math.max(insSalary, 2000), 12600);
    const empInsurance = emp.isInsured ? Math.round(insurableWage * 0.11) : 0;
    const compInsurance = emp.isInsured ? Math.round(insurableWage * 0.1875) : 0;
    const mealAllowance = 600;
    const remoteAllowance = 750;
    const gross = base + mealAllowance + remoteAllowance;
    const monthlyTaxable = Math.max(0, gross - empInsurance - 2000);
    const incomeTax = Math.round(monthlyTaxable * 0.05);
    const martyrsFund = Math.round(gross * 0.0005);
    const totalDeductions = empInsurance + incomeTax + martyrsFund;
    const netSalary = gross - totalDeductions;

    setSelectedSlipData({
      employee: emp,
      periodName: periodsList[0]?.periodName || (ar ? "أكتوبر 2026 - مسير الرواتب" : "October 2026 Payroll"),
      workingDays: 30,
      attendedDays: 26,
      earnings: {
        baseSalary: base,
        insurableWage,
        serviceCharge: 0,
        mealAllowance,
        remoteAllowance,
        overtime: 0,
        totalGross: gross,
      },
      deductions: {
        empInsurance,
        incomeTax,
        martyrsFund,
        loanDeduction: 0,
        penaltyDeduction: 0,
        totalDeductions,
      },
      netSalary,
      compInsurance,
    });
    setIsSlipModalOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir={ar ? "rtl" : "ltr"}>
      {/* Top Header & Property Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-card border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0f2942] text-[#c89332] flex items-center justify-center shadow-xs font-bold text-lg">
              <DollarSign className="w-6 h-6 text-[#c89332]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#0f2942] dark:text-foreground">
                  {ar ? "نظام الرواتب والأجور الفندقية" : "Hospitality Payroll & Compensation System"}
                </h1>
                <Badge variant="outline" className="text-[#c89332] border-[#c89332]/40 bg-amber-50/50 text-[11px] font-semibold">
                  {ar ? "قانون العمل المصري 148/2019" : "Egyptian Law 148/2019"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ar 
                  ? "مسير الرواتب الشامل، عمولة الخدمة 12%، التأمينات والضرائب، السلف، وشيتات بنوك CIB و NBE"
                  : "End-to-end hotel payroll, 12% service charge pools, Egyptian statutory tax/insurance, staff loans, and bank WPS"}
              </p>
            </div>
          </div>
        </div>

        {/* Hotel & Employment Type Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedPropertyId} 
            onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-background font-medium text-xs focus:ring-2 focus:ring-[#c89332] text-slate-800"
          >
            {propertiesList.map((p: any) => (
              <option key={p.id} value={p.id}>
                {ar ? p.nameAr : p.nameEn}
              </option>
            ))}
          </select>

          {/* Toggle Regular vs Casual */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/70 p-1">
            <button
              onClick={() => setEmploymentType("regular")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                employmentType === "regular" 
                  ? "bg-white text-[#0f2942] shadow-xs font-bold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {ar ? "العمالة المثبتة (Regular)" : "Regular Staff"}
            </button>
            <button
              onClick={() => setEmploymentType("casual")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                employmentType === "casual" 
                  ? "bg-white text-[#0f2942] shadow-xs font-bold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {ar ? "العمالة اليومية (Casual)" : "Casual Workers"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap items-center gap-1.5 w-full h-auto p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80">
          <TabsTrigger value="runs" className="py-2.5 px-4 gap-2 rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0f2942] data-[state=active]:shadow-xs">
            <Calculator className="w-4 h-4 text-[#c89332]" />
            <span>{ar ? "مسير الرواتب الشهرية (Payroll Runs)" : "Payroll Runs"}</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="py-2.5 px-4 gap-2 rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0f2942] data-[state=active]:shadow-xs">
            <Users className="w-4 h-4 text-[#0f2942]" />
            <span>{ar ? "سجل الموظفين والرواتب (Staff)" : "Employees & Salaries"}</span>
          </TabsTrigger>
          <TabsTrigger value="service-charge" className="py-2.5 px-4 gap-2 rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0f2942] data-[state=active]:shadow-xs">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>{ar ? "عمولة الخدمة الفندقية 12% (Tronc Pool)" : "12% Service Charge"}</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="py-2.5 px-4 gap-2 rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0f2942] data-[state=active]:shadow-xs">
            <Landmark className="w-4 h-4 text-amber-600" />
            <span>{ar ? "السلف والجزاءات (Loans & Legal)" : "Loans & Disciplinary"}</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="py-2.5 px-4 gap-2 rounded-xl text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0f2942] data-[state=active]:shadow-xs">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>{ar ? "شيتات البنوك WPS والتقارير" : "Bank WPS & Audit"}</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: PAYROLL RUNS ─── */}
        <TabsContent value="runs" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {ar ? "سجل دورات ومسيرات الرواتب الشهرية المعتمدة" : "Monthly Hotel Payroll Runs"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {ar ? "احتساب دقيق وفقاً لحركات الحضور والغياب وساعات العمل الإضافي وأقساط السلف" : "Calculated with live attendance punches, statutory taxes, and loan deductions"}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsTaxSimOpen(true)}
                className="gap-1.5 border-slate-300 text-slate-700 rounded-xl text-xs font-semibold h-10 px-3 hover:bg-slate-100"
              >
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>{ar ? "حاسبة وشرائح كسب العمل" : "Tax Simulator"}</span>
              </Button>

              <Button 
                variant="outline"
                onClick={() => {
                  if (employeesList.length > 0 && !eosForm.employeeId) {
                    setEosForm({ ...eosForm, employeeId: String(employeesList[0].id) });
                    calculateEosMutation.mutate({
                      employeeId: employeesList[0].id,
                      terminationDate: eosForm.terminationDate,
                      leaveBalanceDays: eosForm.leaveBalanceDays,
                    });
                  }
                  setIsEosModalOpen(true);
                }}
                className="gap-1.5 border-slate-300 text-slate-700 rounded-xl text-xs font-semibold h-10 px-3 hover:bg-slate-100"
              >
                <Landmark className="w-4 h-4 text-amber-600" />
                <span>{ar ? "مكافأة نهاية الخدمة" : "End of Service"}</span>
              </Button>

              <PermissionGate module="payroll" action="create">
                <Button 
                  variant="outline"
                  onClick={() => setIsNewPeriodOpen(true)}
                  className="gap-1.5 border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-100 rounded-xl text-xs font-semibold h-10 px-3"
                >
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{ar ? "فترة مالية جديدة" : "New Period"}</span>
                </Button>
              </PermissionGate>

              <PermissionGate module="payroll" action="create">
                <Button 
                  onClick={() => {
                    if (periodsList.length === 0) {
                      toast.error(ar ? "يرجى إنشاء فترة مالية أولاً بالضغط على 'فترة مالية جديدة'" : "Please create a payroll period first using 'New Period'");
                      return;
                    }
                    calculateMutation.mutate({
                      propertyId: selectedPropertyId,
                      payrollPeriodId: periodsList[0].id,
                      employmentType,
                    });
                  }}
                  disabled={calculateMutation.isPending}
                  className="gap-2 bg-[#0f2942] hover:bg-[#193a5c] text-white rounded-xl shadow-xs text-xs font-bold h-10 px-4"
                >
                  <Calculator className="w-4 h-4 text-[#c89332]" />
                  <span>{calculateMutation.isPending ? (ar ? "جاري احتساب المسير..." : "Calculating...") : (ar ? "احتساب مسير الشهر الحالي" : "Calculate Active Period")}</span>
                </Button>
              </PermissionGate>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">{ar ? "إجمالي صافي الرواتب (Net Payable)" : "Total Net Payroll"}</CardDescription>
                <CardTitle className="text-2xl font-black text-emerald-600">
                  {runsList[0]?.totalNet ? `${Number(runsList[0].totalNet).toLocaleString()} EGP` : "0 EGP"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">{ar ? "المبلغ الفعلي القابل للتحويل للبنوك" : "Total net funds disbursed to bank"}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">{ar ? "إجمالي الاستقطاعات والضرائب" : "Total Deductions"}</CardDescription>
                <CardTitle className="text-2xl font-black text-rose-600">
                  {runsList[0]?.totalDeductions ? `${Number(runsList[0].totalDeductions).toLocaleString()} EGP` : "0 EGP"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">{ar ? "تأمينات 11%، كسب عمل، سلف، وجزاءات" : "Statutory tax, insurance, loans, penalties"}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">{ar ? "حصيلة عمولة الخدمة 12%" : "12% Service Charge Pool"}</CardDescription>
                <CardTitle className="text-2xl font-black text-[#c89332]">
                  {serviceChargePoolsList[0]?.totalServiceAmount ? `${Number(serviceChargePoolsList[0].totalServiceAmount).toLocaleString()} EGP` : "0 EGP"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">{ar ? "85% توزع على العاملين بنظام النقط" : "85% distributed via point ratio"}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">{ar ? "عدد الموظفين في المسير" : "Processed Employees"}</CardDescription>
                <CardTitle className="text-2xl font-black text-[#0f2942]">
                  {runsList[0]?.totalEmployees ?? employeesList.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] text-muted-foreground">{employmentType === "regular" ? (ar ? "عمالة فندقية مثبتة" : "Regular Hotel Staff") : (ar ? "عمالة يوميات وحفلات" : "Casual Banquet Staff")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Runs Table */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right rtl:text-right ltr:text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b text-xs font-bold uppercase">
                    <tr>
                      <th className="p-3.5 text-center">#</th>
                      <th className="p-3.5">{ar ? "الفندق والفرع" : "Property"}</th>
                      <th className="p-3.5">{ar ? "نوع العمالة" : "Entity"}</th>
                      <th className="p-3.5 text-center">{ar ? "الموظفين" : "Staff"}</th>
                      <th className="p-3.5">{ar ? "إجمالي الاستحقاقات (Gross)" : "Total Gross"}</th>
                      <th className="p-3.5">{ar ? "الاستقطاعات" : "Deductions"}</th>
                      <th className="p-3.5">{ar ? "صافي الرواتب (Net)" : "Net Salary"}</th>
                      <th className="p-3.5 text-center">{ar ? "الحالة" : "Status"}</th>
                      <th className="p-3.5 text-center">{ar ? "تحميل ملفات البنك WPS" : "Export WPS"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {runsList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-10 text-center text-muted-foreground">
                          <Calculator className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                          <p className="font-semibold">{ar ? "لا توجد دورات رواتب حتى الآن" : "No payroll runs yet"}</p>
                          <p className="text-xs text-slate-400 mt-1">{ar ? "اضغط على 'احتساب مسير الشهر الحالي' لتوليد المسير وملفات البنوك" : "Click calculate to generate payroll records and bank files"}</p>
                        </td>
                      </tr>
                    ) : (
                      runsList.map((run: any) => (
                        <tr key={run.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 text-center font-mono font-bold text-xs">#{run.id}</td>
                          <td className="p-3.5 font-bold text-[#0f2942]">
                            {propertiesList.find((p: any) => p.id === run.propertyId)?.nameAr || `Hotel #${run.propertyId}`}
                          </td>
                          <td className="p-3.5">
                            <Badge variant={run.employmentType === "casual" ? "secondary" : "default"} className="rounded-lg text-[11px]">
                              {run.employmentType === "casual" ? (ar ? "يوميات" : "Casual") : (ar ? "مثبت" : "Regular")}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold">{run.totalEmployees}</td>
                          <td className="p-3.5 font-mono font-semibold">{Number(run.totalGross).toLocaleString()} EGP</td>
                          <td className="p-3.5 font-mono text-rose-600 font-semibold">-{Number(run.totalDeductions).toLocaleString()} EGP</td>
                          <td className="p-3.5 font-mono font-black text-emerald-600">{Number(run.totalNet).toLocaleString()} EGP</td>
                          <td className="p-3.5 text-center">
                            <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 rounded-lg text-xs">
                              {run.status}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <a 
                                href={`/api/payroll/runs/${run.id}/wps?format=nbe`}
                                target="_blank"
                                rel="noreferrer"
                                title={ar ? "تحميل كشف NBE" : "Download NBE WPS"}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                              >
                                NBE
                              </a>
                              <a 
                                href={`/api/payroll/runs/${run.id}/wps?format=cib`}
                                target="_blank"
                                rel="noreferrer"
                                title={ar ? "تحميل كشف CIB" : "Download CIB WPS"}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                              >
                                CIB
                              </a>
                              <a 
                                href={`/api/payroll/runs/${run.id}/wps?format=excel`}
                                target="_blank"
                                rel="noreferrer"
                                title={ar ? "تحميل شيت إكسيل الشامل" : "Download Full Excel"}
                                className="p-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
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

        {/* ─── TAB 2: EMPLOYEES & SALARY DETAILS ─── */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
              <Input 
                placeholder={ar ? "بحث بالاسم، كود الموظف، البصمة..." : "Search name, employee code, biometric ID..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-9 text-xs h-10 rounded-xl border-slate-200"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {ar ? `إجمالي الموظفين المسجلين: ${employeesList.length}` : `Total Employees: ${employeesList.length}`}
            </div>
          </div>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right rtl:text-right ltr:text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b text-xs font-bold uppercase">
                    <tr>
                      <th className="p-3.5">{ar ? "كود الموظف" : "Code"}</th>
                      <th className="p-3.5">{ar ? "اسم الموظف" : "Employee Name"}</th>
                      <th className="p-3.5">{ar ? "النوع" : "Entity"}</th>
                      <th className="p-3.5 font-mono">{ar ? "رقم البصمة" : "Biometric ID"}</th>
                      <th className="p-3.5">{ar ? "الراتب الأساسي" : "Base Salary"}</th>
                      <th className="p-3.5">{ar ? "التأمينات الاجتماعية" : "Social Insurance"}</th>
                      <th className="p-3.5">{ar ? "الحساب البنكي / IBAN" : "Bank Account"}</th>
                      <th className="p-3.5 text-center">{ar ? "مفردات الراتب" : "Salary Slip"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeesList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-muted-foreground">
                          {ar ? "لا يوجد موظفون مطابقون لشروط البحث." : "No employees match the filter criteria."}
                        </td>
                      </tr>
                    ) : (
                      employeesList.map((emp: any) => (
                        <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-xs text-[#0f2942]">{emp.employeeCode}</td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">{emp.fullName}</div>
                            {emp.fullNameAr && <div className="text-xs text-muted-foreground">{emp.fullNameAr}</div>}
                          </td>
                          <td className="p-3.5">
                            <Badge variant={emp.employmentType === "casual" ? "secondary" : "default"} className="rounded-lg text-[11px]">
                              {emp.employmentType === "casual" ? (ar ? "يومية" : "Casual") : (ar ? "مثبت" : "Regular")}
                            </Badge>
                          </td>
                          <td className="p-3.5 font-mono text-xs text-slate-600">{emp.biometricId || "-"}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-800">{Number(emp.baseSalary).toLocaleString()} EGP</td>
                          <td className="p-3.5">
                            {emp.isInsured ? (
                              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px] rounded-lg">
                                {ar ? "مؤمن (قانون 148)" : "Insured (Law 148)"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 text-[10px] rounded-lg">
                                {ar ? "غير مؤمن" : "Not Insured"}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-xs text-muted-foreground">
                            {emp.bankAccountNumber || emp.iban || (ar ? "صرف نقدي" : "Cash")}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <PermissionGate module="payroll" action="edit">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditEmployeeForm({
                                      id: emp.id,
                                      employeeCode: emp.employeeCode,
                                      fullName: emp.fullName,
                                      baseSalary: emp.baseSalary || "0.00",
                                      insuranceSalary: emp.insuranceSalary || "0.00",
                                      isInsured: emp.isInsured ?? true,
                                      bankName: emp.bankName || "",
                                      bankAccountNumber: emp.bankAccountNumber || "",
                                      iban: emp.iban || "",
                                      employmentType: emp.employmentType || "regular",
                                      biometricId: emp.biometricId || "",
                                    });
                                    setIsEditEmployeeOpen(true);
                                  }}
                                  className="h-8 gap-1 text-[11px] font-semibold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>{ar ? "تعديل الراتب" : "Edit Salary"}</span>
                                </Button>
                              </PermissionGate>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => openSlipForEmployee(emp)}
                                className="h-8 gap-1 text-[11px] font-semibold rounded-xl border-slate-200 text-[#0f2942] hover:bg-slate-100"
                              >
                                <Receipt className="w-3.5 h-3.5 text-[#c89332]" />
                                <span>{ar ? "مفردات مرتب" : "Pay Slip"}</span>
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEosForm({ ...eosForm, employeeId: String(emp.id) });
                                  setIsEosModalOpen(true);
                                  calculateEosMutation.mutate({
                                    employeeId: emp.id,
                                    terminationDate: eosForm.terminationDate,
                                    leaveBalanceDays: eosForm.leaveBalanceDays,
                                  });
                                }}
                                className="h-8 gap-1 text-[11px] font-semibold rounded-xl border-amber-300 text-amber-700 hover:bg-amber-50"
                              >
                                <Landmark className="w-3.5 h-3.5" />
                                <span>{ar ? "تصفية مستحقات" : "Clearance"}</span>
                              </Button>
                            </div>
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

        {/* ─── TAB 3: 12% SERVICE CHARGE POOL (TRONC) ─── */}
        <TabsContent value="service-charge" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200/80 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#c89332] text-white flex items-center justify-center font-bold">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0f2942]">
                  {ar ? "وعاء عمولة الخدمة الفندقية 12% (Hospitality Tronc Pool)" : "12% Hospitality Tronc & Service Pool"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {ar ? "وفقاً للعرف الفندقي المصري: 15% حصة إدارة الفندق للهالك والكسر، و 85% توزع على العاملين بنظام النقط" : "Per Egyptian hospitality norms: 15% hotel breakage/admin, 85% distributed to staff by points"}
                </p>
              </div>
            </div>

            <PermissionGate module="payroll" action="create">
              <Button 
                onClick={() => setIsServiceChargeModalOpen(true)}
                className="bg-[#c89332] hover:bg-[#b07e26] text-white rounded-xl shadow-xs text-xs font-bold h-10 gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{ar ? "احتساب وتوزيع وعاء جديد" : "Distribute New Pool"}</span>
              </Button>
            </PermissionGate>
          </div>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs overflow-hidden">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-bold">{ar ? "سجلات أوعية الخدمة الشهرية المعتمدة" : "Approved Service Charge Pools"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right rtl:text-right ltr:text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b text-xs font-bold uppercase">
                    <tr>
                      <th className="p-3.5 text-center">#</th>
                      <th className="p-3.5">{ar ? "إجمالي وعاء الـ 12%" : "Total Pool"}</th>
                      <th className="p-3.5">{ar ? "حصة الفندق (15%)" : "Hotel Share"}</th>
                      <th className="p-3.5 font-bold text-emerald-600">{ar ? "حصة العاملين (85%)" : "Staff Share"}</th>
                      <th className="p-3.5 text-center">{ar ? "إجمالي النقط" : "Points"}</th>
                      <th className="p-3.5 font-mono font-bold text-[#c89332]">{ar ? "قيمة النقطة (Point Value)" : "Point Value"}</th>
                      <th className="p-3.5 text-center">{ar ? "الحالة" : "Status"}</th>
                      <th className="p-3.5">{ar ? "ملاحظات" : "Notes"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceChargePoolsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-muted-foreground">
                          {ar ? "لم يتم توزيع وعاء خدمة لهذا الفندق بعد. اضغط 'احتساب وتوزيع وعاء جديد' للبدء." : "No service charge pools distributed yet."}
                        </td>
                      </tr>
                    ) : (
                      serviceChargePoolsList.map((pool: any) => (
                        <tr key={pool.id} className="hover:bg-slate-50/80">
                          <td className="p-3.5 text-center font-mono font-bold">#{pool.id}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-800">{Number(pool.totalServiceAmount).toLocaleString()} EGP</td>
                          <td className="p-3.5 font-mono text-muted-foreground">{pool.hotelSharePercent}%</td>
                          <td className="p-3.5 font-mono font-black text-emerald-600">{Number(pool.staffDistributableAmount).toLocaleString()} EGP</td>
                          <td className="p-3.5 text-center font-mono">{Number(pool.totalPoints).toLocaleString()}</td>
                          <td className="p-3.5 font-mono font-black text-[#c89332]">{Number(pool.pointValue).toFixed(2)} EGP</td>
                          <td className="p-3.5 text-center">
                            <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 rounded-lg text-xs">
                              {pool.status}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-xs text-muted-foreground">{pool.notes || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: OPERATIONS & LOANS & PENALTIES ─── */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Section 1: Loans & Advances */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-base font-bold text-[#0f2942]">
                      {ar ? "السلف والقروض الشهرية" : "Loans & Monthly Advances"}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {ar ? "سلف العاملين وجدول الاستقطاع التلقائي من مسير الرواتب" : "Installment deductions linked automatically to payroll runs"}
                  </CardDescription>
                </div>
                <PermissionGate module="payroll" action="create">
                  <Button 
                    size="sm" 
                    onClick={() => setIsLoanModalOpen(true)}
                    className="h-9 gap-1.5 rounded-xl bg-[#0f2942] hover:bg-[#193a5c] text-white text-xs font-bold"
                  >
                    <Plus className="w-4 h-4 text-[#c89332]" />
                    <span>{ar ? "سلفة جديدة" : "New Loan"}</span>
                  </Button>
                </PermissionGate>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b font-bold uppercase sticky top-0">
                      <tr>
                        <th className="p-3">{ar ? "الموظف" : "Employee"}</th>
                        <th className="p-3">{ar ? "إجمالي السلفة" : "Amount"}</th>
                        <th className="p-3">{ar ? "القسط الشهري" : "Installment"}</th>
                        <th className="p-3 text-center">{ar ? "الحالة" : "Status"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loansList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground">
                            {ar ? "لا توجد سلف نشطة مسجلة حالياً." : "No active loans registered."}
                          </td>
                        </tr>
                      ) : (
                        loansList.map((item: any) => (
                          <tr key={item.loan.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-semibold">{item.employee.fullName}</td>
                            <td className="p-3 font-mono font-bold text-slate-800">{Number(item.loan.totalAmount).toLocaleString()} EGP</td>
                            <td className="p-3 font-mono text-[#c89332] font-bold">{Number(item.loan.monthlyInstallment).toLocaleString()} EGP</td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px] rounded-lg">
                                {item.loan.status}
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

            {/* Section 2: Disciplinary Actions & Penalties */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <CardTitle className="text-base font-bold text-[#0f2942]">
                      {ar ? "الجزاءات والتحقيقات الإدارية" : "Disciplinary Penalties"}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {ar ? "قرارات الشؤون القانونية المعتمدة وفق لائحة العمل" : "Statutory day deductions linked directly to salary slips"}
                  </CardDescription>
                </div>
                <PermissionGate module="payroll" action="create">
                  <Button 
                    size="sm" 
                    onClick={() => setIsPenaltyModalOpen(true)}
                    className="h-9 gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{ar ? "قرار جزاء" : "New Penalty"}</span>
                  </Button>
                </PermissionGate>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b font-bold uppercase sticky top-0">
                      <tr>
                        <th className="p-3">{ar ? "الموظف" : "Employee"}</th>
                        <th className="p-3">{ar ? "رقم التحقيق" : "Investigation"}</th>
                        <th className="p-3 text-center">{ar ? "أيام الخصم" : "Deduction"}</th>
                        <th className="p-3">{ar ? "السبب" : "Reason"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {penaltiesList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-muted-foreground">
                            {ar ? "لا توجد قرارات جزاءات مسجلة." : "No disciplinary penalties recorded."}
                          </td>
                        </tr>
                      ) : (
                        penaltiesList.map((item: any) => (
                          <tr key={item.penalty.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-semibold">{item.employee.fullName}</td>
                            <td className="p-3 font-mono font-bold text-slate-600">{item.penalty.investigationNumber || "-"}</td>
                            <td className="p-3 text-center font-mono font-bold text-rose-600">-{item.penalty.deductionDays} {ar ? "يوم" : "days"}</td>
                            <td className="p-3 text-muted-foreground truncate max-w-[120px]">{item.penalty.reason}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ─── TAB 5: BANK WPS & AUDIT REPORTS ─── */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base font-bold text-[#0f2942]">
                  {ar ? "ملفات البنوك المعتمدة ومسيرات الرواتب (Bank WPS Files)" : "Approved Bank WPS Files & Reports"}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                {ar ? "توليد ملفات التحويل البنكي الإلكتروني المتوافقة مع البنوك المصرية (CIB, NBE, Banque Misr)" : "Export certified WPS payment files for Egyptian commercial banks"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* NBE */}
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 text-[#0f2942] border-slate-300">NBE Format</Badge>
                    <h4 className="font-bold text-sm mb-1 text-slate-800">{ar ? "البنك الأهلي المصري" : "National Bank of Egypt"}</h4>
                    <p className="text-xs text-muted-foreground mb-4">{ar ? "ملف WPS النصي المعتمد برقم الحساب والبطاقة القومية" : "Standard pipe-delimited WPS file"}</p>
                  </div>
                  <a 
                    href={runsList[0] ? `/api/payroll/runs/${runsList[0].id}/wps?format=nbe` : "#"}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-[#0f2942] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#c89332]" />
                    <span>{ar ? "تحميل كشف NBE" : "Download NBE WPS"}</span>
                  </a>
                </div>

                {/* CIB */}
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 text-blue-700 border-blue-200">CIB Corporate</Badge>
                    <h4 className="font-bold text-sm mb-1 text-slate-800">{ar ? "البنك التجاري الدولي" : "CIB Egypt"}</h4>
                    <p className="text-xs text-muted-foreground mb-4">{ar ? "ملف تحويل الرواتب الإلكتروني للشركات مع كود التحويل" : "Certified corporate payroll file"}</p>
                  </div>
                  <a 
                    href={runsList[0] ? `/api/payroll/runs/${runsList[0].id}/wps?format=cib` : "#"}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-blue-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{ar ? "تحميل كشف CIB" : "Download CIB Sheet"}</span>
                  </a>
                </div>

                {/* Banque Misr */}
                <div className="p-5 border border-slate-200/80 rounded-2xl bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 text-rose-700 border-rose-200">Banque Misr</Badge>
                    <h4 className="font-bold text-sm mb-1 text-slate-800">{ar ? "بنك مصر" : "Banque Misr"}</h4>
                    <p className="text-xs text-muted-foreground mb-4">{ar ? "صيغة رواتب موظفي الفنادق المعتمدة مع الرقم المرجعي" : "Automated salary transfer format"}</p>
                  </div>
                  <a 
                    href={runsList[0] ? `/api/payroll/runs/${runsList[0].id}/wps?format=misr` : "#"}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-rose-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{ar ? "تحميل كشف بنك مصر" : "Download Misr Sheet"}</span>
                  </a>
                </div>

                {/* Full Audit Excel */}
                <div className="p-5 border border-emerald-200/80 rounded-2xl bg-emerald-50/40 flex flex-col justify-between">
                  <div>
                    <Badge className="mb-2 bg-emerald-600 text-white">Excel Full Audit</Badge>
                    <h4 className="font-bold text-sm mb-1 text-slate-800">{ar ? "شيت المراجعة الشامل" : "Comprehensive Excel"}</h4>
                    <p className="text-xs text-muted-foreground mb-4">{ar ? "تقرير تفصيلي بكافة البنود والتأمينات والضرائب" : "Full audit report with all components"}</p>
                  </div>
                  <a 
                    href={runsList[0] ? `/api/payroll/runs/${runsList[0].id}/wps?format=excel` : "#"}
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{ar ? "تصدير شيت إكسيل كامل" : "Export Full Excel"}</span>
                  </a>
                </div>
              </div>

              {/* Departmental Cost Centers Analytics Card */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#0f2942]">
                      {ar ? "تحليل تكلفة الرواتب ومراكز التكلفة الفندقية (Departmental Cost Centers)" : "Hospitality Departmental Cost Centers"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {ar ? "توزيع إجمالي تكاليف الأجور والـ 12% وحصة الفندق في التأمينات عبر قطاعات الفندق" : "Breakdown of basic salaries, service charge, and employer social insurance across departments"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 w-fit text-xs font-semibold">
                    {ar ? "تحليل مراكز التكلفة" : "Cost Centers"}
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                    <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b">
                      <tr>
                        <th className="p-3">{ar ? "القطاع / مركز التكلفة" : "Department / Cost Center"}</th>
                        <th className="p-3 text-center">{ar ? "عدد الكوادر" : "Staff"}</th>
                        <th className="p-3 font-mono">{ar ? "الرواتب الأساسية" : "Base Pay"}</th>
                        <th className="p-3 font-mono">{ar ? "وعاء الـ 12% التقديري" : "12% Tronc"}</th>
                        <th className="p-3 font-mono">{ar ? "تأمينات المنشأة (18.75%)" : "Employer Insurance"}</th>
                        <th className="p-3 font-mono font-bold text-emerald-700">{ar ? "إجمالي عبء الفندق" : "Total Hotel Cost"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {costCentersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            {ar ? "جاري تحميل بيانات مراكز التكلفة..." : "Loading cost center breakdown..."}
                          </td>
                        </tr>
                      ) : (
                        costCentersList.map((dept: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{dept.departmentName}</td>
                            <td className="p-3 text-center font-mono font-bold">{dept.staffCount}</td>
                            <td className="p-3 font-mono">{dept.totalBaseSalaryFormatted}</td>
                            <td className="p-3 font-mono text-amber-700">{dept.totalServiceCharge ? `${dept.totalServiceCharge.toLocaleString()} EGP` : "-"}</td>
                            <td className="p-3 font-mono text-slate-600">{dept.totalEmployerInsurance ? `${dept.totalEmployerInsurance.toLocaleString()} EGP` : "-"}</td>
                            <td className="p-3 font-mono font-black text-emerald-700">{dept.totalDepartmentBurdenFormatted}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── MODAL 1: LUXURY SALARY PAY SLIP (مفردات الراتب) ─── */}
      <Dialog open={isSlipModalOpen} onOpenChange={setIsSlipModalOpen}>
        <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
          {selectedSlipData && (
            <div className="space-y-5" dir={ar ? "rtl" : "ltr"}>
              
              {/* Slip Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0f2942] text-[#c89332] flex items-center justify-center font-bold font-serif text-lg">
                    S
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0f2942]">SUNRISE Resorts & Cruises</h2>
                    <p className="text-xs text-muted-foreground">
                      {ar ? "قسيمة ومفردات الراتب الشهري (Official Salary Pay Slip)" : "Official Salary Pay Slip"} — {selectedSlipData.periodName}
                    </p>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="gap-1.5 rounded-xl text-xs h-9"
                >
                  <Printer className="w-4 h-4 text-[#c89332]" />
                  <span>{ar ? "طباعة القسيمة" : "Print Slip"}</span>
                </Button>
              </div>

              {/* Employee Meta Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl text-xs border border-slate-200/80">
                <div>
                  <span className="text-muted-foreground block text-[10px]">{ar ? "اسم الموظف" : "Name"}</span>
                  <span className="font-bold text-slate-800">{selectedSlipData.employee.fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">{ar ? "كود الموظف" : "Code"}</span>
                  <span className="font-mono font-bold text-[#0f2942]">{selectedSlipData.employee.employeeCode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">{ar ? "الرقم التأميني" : "Insurance No"}</span>
                  <span className="font-mono text-slate-700">{selectedSlipData.employee.insuranceNumber || "19827364"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">{ar ? "الحساب البنكي" : "Bank Acc"}</span>
                  <span className="font-mono text-slate-700">{selectedSlipData.employee.bankAccountNumber || "CASH"}</span>
                </div>
              </div>

              {/* Earnings vs Deductions Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Earnings (الاستحقاقات) */}
                <div className="border border-emerald-100 rounded-2xl p-4 bg-emerald-50/20 space-y-2 text-xs">
                  <h4 className="font-bold text-emerald-800 pb-1 border-b border-emerald-100 flex items-center justify-between">
                    <span>{ar ? "الاستحقاقات والمزايا" : "Gross Earnings"}</span>
                    <span>EGP</span>
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "الراتب الأساسي:" : "Basic Salary:"}</span>
                    <span className="font-mono font-bold">{selectedSlipData.earnings.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "عمولة الخدمة الفندقية 12%:" : "12% Service Charge:"}</span>
                    <span className="font-mono font-bold text-[#c89332]">+{selectedSlipData.earnings.serviceCharge.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "بدل إعاشة فندقية:" : "Meal Allowance:"}</span>
                    <span className="font-mono font-bold">+{selectedSlipData.earnings.mealAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "بدل مناطق نائية وانتقال:" : "Remote Area Allowance:"}</span>
                    <span className="font-mono font-bold">+{selectedSlipData.earnings.remoteAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "أجر ساعات العمل الإضافي:" : "Overtime Pay:"}</span>
                    <span className="font-mono font-bold text-emerald-600">+{selectedSlipData.earnings.overtime.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200 font-bold text-emerald-800 text-sm">
                    <span>{ar ? "إجمالي الاستحقاقات:" : "Total Gross:"}</span>
                    <span className="font-mono">{selectedSlipData.earnings.totalGross.toLocaleString()} EGP</span>
                  </div>
                </div>

                {/* Deductions (الاستقطاعات) */}
                <div className="border border-rose-100 rounded-2xl p-4 bg-rose-50/20 space-y-2 text-xs">
                  <h4 className="font-bold text-rose-800 pb-1 border-b border-rose-100 flex items-center justify-between">
                    <span>{ar ? "الاستقطاعات القانونية والإدارية" : "Statutory Deductions"}</span>
                    <span>EGP</span>
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "تأمينات اجتماعية (11% قانون 148):" : "Social Insurance (11%):"}</span>
                    <span className="font-mono font-bold text-rose-600">-{selectedSlipData.deductions.empInsurance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "ضريبة كسب العمل (قانون 30/2023):" : "Income Tax:"}</span>
                    <span className="font-mono font-bold text-rose-600">-{selectedSlipData.deductions.incomeTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "صندوق تكريم الشهداء (0.05%):" : "Martyrs Fund (0.05%):"}</span>
                    <span className="font-mono font-bold text-rose-600">-{selectedSlipData.deductions.martyrsFund.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "قسط سلفة شهرية:" : "Monthly Loan Installment:"}</span>
                    <span className="font-mono font-bold text-rose-600">-{selectedSlipData.deductions.loanDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "جزاءات وتحقيقات قانونية:" : "Penalties:"}</span>
                    <span className="font-mono font-bold text-slate-400">-{selectedSlipData.deductions.penaltyDeduction.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-rose-200 font-bold text-rose-800 text-sm">
                    <span>{ar ? "إجمالي الاستقطاعات:" : "Total Deductions:"}</span>
                    <span className="font-mono">-{selectedSlipData.deductions.totalDeductions.toLocaleString()} EGP</span>
                  </div>
                </div>

              </div>

              {/* Net Payable Highlight */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0f2942] to-[#193a5c] text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-300 font-semibold block">{ar ? "صافي الراتب المستحق للصرف" : "Net Payable Salary"}</span>
                  <span className="text-2xl font-black">{selectedSlipData.netSalary.toLocaleString()} EGP</span>
                </div>
                <div className="text-right rtl:text-left text-[11px] text-slate-300">
                  <span>{ar ? "حصة المنشأة في التأمينات (18.75%):" : "Employer Insurance (18.75%):"}</span>
                  <span className="font-mono block font-bold text-white">{selectedSlipData.compInsurance.toLocaleString()} EGP</span>
                </div>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSlipModalOpen(false)} className="rounded-xl">
              {ar ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: NEW LOAN APPLICATION ─── */}
      <Dialog open={isLoanModalOpen} onOpenChange={setIsLoanModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0f2942] flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-600" />
              <span>{ar ? "طلب سلفة وقرض موظف جديد" : "New Staff Loan Application"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar ? "تسجيل سلفة واعتماد جدول الاستقطاع الشهري التلقائي من الراتب" : "Create loan and automated monthly installment recovery schedule"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs" dir={ar ? "rtl" : "ltr"}>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{ar ? "الموظف المستفيد" : "Employee"}</label>
              <select
                value={loanForm.employeeId}
                onChange={(e) => setLoanForm({ ...loanForm, employeeId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-background text-xs"
                required
              >
                <option value="">{ar ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
                {employeesList.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">{ar ? "إجمالي مبلغ السلفة" : "Total Amount"}</label>
                <Input
                  type="number"
                  value={loanForm.totalAmount}
                  onChange={(e) => setLoanForm({ ...loanForm, totalAmount: e.target.value })}
                  placeholder="3000"
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{ar ? "عدد الأقساط الشهرية" : "Installments Count"}</label>
                <select
                  value={loanForm.installmentsCount}
                  onChange={(e) => setLoanForm({ ...loanForm, installmentsCount: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-background text-xs"
                >
                  <option value="1">1 {ar ? "شهر" : "Month"}</option>
                  <option value="2">2 {ar ? "شهور" : "Months"}</option>
                  <option value="3">3 {ar ? "شهور" : "Months"}</option>
                  <option value="6">6 {ar ? "شهور" : "Months"}</option>
                  <option value="12">12 {ar ? "شهراً" : "Months"}</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex justify-between items-center">
              <span className="text-amber-800">{ar ? "قيمة القسط الشهري المحتسب:" : "Calculated Installment:"}</span>
              <span className="font-mono font-bold text-amber-900">
                {(Number(loanForm.totalAmount || 0) / Number(loanForm.installmentsCount || 1)).toFixed(2)} EGP
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{ar ? "ملاحظات واعتماد الشؤون المالية" : "Notes"}</label>
              <Input
                value={loanForm.notes}
                onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                placeholder={ar ? "سلفة شخصية بضمان الراتب..." : "Advance reason..."}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoanModalOpen(false)} className="rounded-xl">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={() => {
                if (!loanForm.employeeId) {
                  toast.error(ar ? "يرجى اختيار الموظف أولاً" : "Please select an employee");
                  return;
                }
                createLoanMutation.mutate({
                  ...loanForm,
                  propertyId: selectedPropertyId,
                });
              }}
              disabled={createLoanMutation.isPending}
              className="rounded-xl bg-[#0f2942] hover:bg-[#193a5c] text-white font-bold"
            >
              {ar ? "اعتماد وتسجيل السلفة" : "Confirm Loan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 3: NEW PENALTY DECISION ─── */}
      <Dialog open={isPenaltyModalOpen} onOpenChange={setIsPenaltyModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>{ar ? "تسجيل قرار جزاء وتطبيق خصم" : "Register Disciplinary Penalty"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar ? "خصم مباشر من مسير الراتب وفقاً لقرارات التحقيقات القانونية" : "Direct salary deduction per legal department resolution"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs" dir={ar ? "rtl" : "ltr"}>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{ar ? "الموظف المخالف" : "Employee"}</label>
              <select
                value={penaltyForm.employeeId}
                onChange={(e) => setPenaltyForm({ ...penaltyForm, employeeId: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-background text-xs"
                required
              >
                <option value="">{ar ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
                {employeesList.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.employeeCode})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">{ar ? "رقم التحقيق القانوني" : "Investigation No"}</label>
                <Input
                  value={penaltyForm.investigationNumber}
                  onChange={(e) => setPenaltyForm({ ...penaltyForm, investigationNumber: e.target.value })}
                  placeholder="INV-2026-08"
                  className="rounded-xl h-10 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{ar ? "عدد أيام الخصم" : "Deduction Days"}</label>
                <select
                  value={penaltyForm.deductionDays}
                  onChange={(e) => setPenaltyForm({ ...penaltyForm, deductionDays: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-background text-xs font-mono font-bold"
                >
                  <option value="0.5">0.5 {ar ? "نصف يوم" : "Half day"}</option>
                  <option value="1.0">1.0 {ar ? "يوم كامل" : "1 Day"}</option>
                  <option value="2.0">2.0 {ar ? "يومان" : "2 Days"}</option>
                  <option value="3.0">3.0 {ar ? "3 أيام" : "3 Days"}</option>
                  <option value="5.0">5.0 {ar ? "5 أيام (الحد الأقصى القانوني)" : "5 Days (Max)"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{ar ? "سبب المخالفة والقرار" : "Reason"}</label>
              <Input
                value={penaltyForm.reason}
                onChange={(e) => setPenaltyForm({ ...penaltyForm, reason: e.target.value })}
                placeholder={ar ? "التأخر المتكرر عن الوردية أو مخالفة الزي..." : "Violation reason..."}
                className="rounded-xl h-10 text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPenaltyModalOpen(false)} className="rounded-xl">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={() => {
                if (!penaltyForm.employeeId || !penaltyForm.reason) {
                  toast.error(ar ? "يرجى استيفاء الموظف وسبب الجزاء" : "Please fill required fields");
                  return;
                }
                createPenaltyMutation.mutate({
                  ...penaltyForm,
                  propertyId: selectedPropertyId,
                });
              }}
              disabled={createPenaltyMutation.isPending}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {ar ? "اعتماد قرار الخصم" : "Confirm Penalty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 4: 12% SERVICE CHARGE POOL CALCULATION ─── */}
      <Dialog open={isServiceChargeModalOpen} onOpenChange={setIsServiceChargeModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#c89332] flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#c89332]" />
              <span>{ar ? "احتساب وتوزيع عمولة الخدمة الفندقية 12%" : "Distribute 12% Service Charge"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar ? "توزيع إجمالي وعاء الشهر على العاملين المستحقين بنظام النقط" : "Distribute hotel service charge pool among staff via point system"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs" dir={ar ? "rtl" : "ltr"}>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">{ar ? "إجمالي وعاء الـ 12% المجمع للشهر" : "Total Pool Amount (EGP)"}</label>
              <Input
                type="number"
                value={serviceChargeForm.totalServiceAmount}
                onChange={(e) => setServiceChargeForm({ ...serviceChargeForm, totalServiceAmount: e.target.value })}
                placeholder="450000"
                className="rounded-xl h-10 text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{ar ? "نسبة استقطاع الفندق للهالك والكسر" : "Hotel Share %"}</label>
              <Input
                type="number"
                value={serviceChargeForm.hotelSharePercent}
                onChange={(e) => setServiceChargeForm({ ...serviceChargeForm, hotelSharePercent: e.target.value })}
                placeholder="15.00"
                className="rounded-xl h-10 text-xs font-mono"
              />
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-amber-800">{ar ? "صافي حصة العاملين للتوزيع (85%):" : "Staff Distributable (85%):"}</span>
                <span className="font-mono font-bold text-amber-900">
                  {(Number(serviceChargeForm.totalServiceAmount || 0) * 0.85).toLocaleString()} EGP
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{ar ? "عدد العاملين المستحقين:" : "Eligible Staff:"}</span>
                <span className="font-mono font-bold">{employeesList.length || 45}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">{ar ? "ملاحظات الاعتماد" : "Notes"}</label>
              <Input
                value={serviceChargeForm.notes}
                onChange={(e) => setServiceChargeForm({ ...serviceChargeForm, notes: e.target.value })}
                className="rounded-xl h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceChargeModalOpen(false)} className="rounded-xl">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={() => {
                if (periodsList.length === 0) {
                  toast.error(ar ? "يرجى إنشاء فترة مالية أولاً" : "No active payroll period found");
                  return;
                }
                calculateServiceChargeMutation.mutate({
                  propertyId: selectedPropertyId,
                  payrollPeriodId: periodsList[0].id,
                  totalServiceAmount: serviceChargeForm.totalServiceAmount,
                  hotelSharePercent: serviceChargeForm.hotelSharePercent,
                  notes: serviceChargeForm.notes,
                });
              }}
              disabled={calculateServiceChargeMutation.isPending}
              className="rounded-xl bg-[#c89332] hover:bg-[#b07e26] text-white font-bold"
            >
              {ar ? "اعتماد وتوزيع العمولة" : "Confirm Distribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 5: END OF SERVICE SETTLEMENT CALCULATOR ─── */}
      <Dialog open={isEosModalOpen} onOpenChange={setIsEosModalOpen}>
        <DialogContent className="max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0f2942] flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-600" />
              <span>{ar ? "حاسبة مكافأة نهاية الخدمة وتصفية المستحقات" : "End-of-Service Indemnity & Clearance"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar ? "احتساب قانوني دقيق لمكافأة نهاية الخدمة (قانون العمل المصري رقم 12 لسنة 2003 المادة 126)" : "Statutory severance & gratuity calculation under Egyptian Labor Law No. 12/2003"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs" dir={ar ? "rtl" : "ltr"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">{ar ? "الموظف المستحق" : "Employee"}</label>
                <select
                  value={eosForm.employeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    setEosForm({ ...eosForm, employeeId: empId });
                    if (empId) {
                      calculateEosMutation.mutate({
                        employeeId: Number(empId),
                        terminationDate: eosForm.terminationDate,
                        leaveBalanceDays: eosForm.leaveBalanceDays,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-background"
                >
                  <option value="">{ar ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
                  {employeesList.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employeeCode} - {ar ? emp.fullNameAr || emp.fullName : emp.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{ar ? "تاريخ انتهاء الخدمة / الاستقالة" : "Termination Date"}</label>
                <Input
                  type="date"
                  value={eosForm.terminationDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    setEosForm({ ...eosForm, terminationDate: d });
                    if (eosForm.employeeId) {
                      calculateEosMutation.mutate({
                        employeeId: Number(eosForm.employeeId),
                        terminationDate: d,
                        leaveBalanceDays: eosForm.leaveBalanceDays,
                      });
                    }
                  }}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">{ar ? "رصيد الإجازات المتبقي (أيام للتسييل)" : "Unused Leave Balance (Days)"}</label>
                <Input
                  type="number"
                  value={eosForm.leaveBalanceDays}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setEosForm({ ...eosForm, leaveBalanceDays: days });
                    if (eosForm.employeeId) {
                      calculateEosMutation.mutate({
                        employeeId: Number(eosForm.employeeId),
                        terminationDate: eosForm.terminationDate,
                        leaveBalanceDays: days,
                      });
                    }
                  }}
                  className="rounded-xl h-9 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">{ar ? "سبب إنهاء الخدمة" : "Termination Reason"}</label>
                <select
                  value={eosForm.terminationReason}
                  onChange={(e) => setEosForm({ ...eosForm, terminationReason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-background"
                >
                  <option value="retirement">{ar ? "بلوغ سن التقاعد القانوني" : "Retirement"}</option>
                  <option value="end_of_contract">{ar ? "انتهاء مدة العقد" : "Contract Expiry"}</option>
                  <option value="resignation">{ar ? "استقالة رسمية" : "Resignation"}</option>
                  <option value="layoff">{ar ? "إنهاء من طرف المنشأة" : "Company Termination"}</option>
                </select>
              </div>
            </div>

            {/* Live Settlement Result Breakdown */}
            {eosResult && (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{eosResult.employee.name}</span>
                    <span className="text-[11px] text-muted-foreground block">{eosResult.employee.department} • {eosResult.employee.designation}</span>
                  </div>
                  <div className="text-right rtl:text-left">
                    <span className="text-xs text-muted-foreground block">{ar ? "مدة الخدمة المحتسبة" : "Service Duration"}</span>
                    <span className="font-bold font-mono text-emerald-700 text-xs">{eosResult.employee.totalYearsFormatted}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{ar ? "الأجر الشامل المحتسب (أساسي + متوسط 12%):" : "Monthly Comprehensive Wage:"}</span>
                    <span className="font-mono font-bold">{Number(eosResult.financials.comprehensiveMonthlyWage).toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>{ar ? "مكافأة نهاية الخدمة (م 126):" : "End-of-Service Indemnity:"}</span>
                    <span className="font-mono font-bold">+{Number(eosResult.financials.gratuityAmount).toLocaleString()} EGP</span>
                  </div>
                  <div className="flex justify-between text-blue-800">
                    <span>{ar ? `المقابل النقدي لرصيد الإجازات (${eosResult.financials.leaveBalanceDays} يوم):` : "Unused Leave Liquidation:"}</span>
                    <span className="font-mono font-bold">+{Number(eosResult.financials.leaveCompensation).toLocaleString()} EGP</span>
                  </div>
                  {Number(eosResult.financials.loanDeductions) > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>{ar ? "خصم متبقي السلف الشخصية:" : "Outstanding Loan Clearance:"}</span>
                      <span className="font-mono font-bold">-{Number(eosResult.financials.loanDeductions).toLocaleString()} EGP</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-amber-200 flex justify-between items-center">
                    <span className="font-bold text-sm text-[#0f2942]">{ar ? "صافي مستحقات التصفية النهائية:" : "Net Severance Payable:"}</span>
                    <span className="font-black text-lg font-mono text-emerald-700">{Number(eosResult.financials.netSettlement).toLocaleString()} EGP</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEosModalOpen(false)} className="rounded-xl">
              {ar ? "إغلاق" : "Close"}
            </Button>
            <Button 
              onClick={() => window.print()}
              className="rounded-xl bg-[#0f2942] hover:bg-[#193a5c] text-white font-bold gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#c89332]" />
              <span>{ar ? "طباعة استمارة إبراء الذمة" : "Print Clearance Memo"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 6: EGYPTIAN TAX LAW 30/2023 & INSURANCE 148/2019 SIMULATOR ─── */}
      <Dialog open={isTaxSimOpen} onOpenChange={setIsTaxSimOpen}>
        <DialogContent className="max-w-xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#0f2942] flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              <span>{ar ? "حاسبة ومحدد شرائح كسب العمل والتأمينات" : "Egyptian Income Tax & Social Insurance Simulator"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar ? "محاكاة فورية للاستقطاعات وفقاً لقانون الضرائب 30 لسنة 2023 والتأمينات 148 لسنة 2019" : "Live simulator for Law 30/2023 brackets and Law 148/2019 insurance"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs" dir={ar ? "rtl" : "ltr"}>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="font-bold text-slate-800 text-xs block">{ar ? "أدخل الراتب الإجمالي الشهري للتجربة (Gross Salary EGP):" : "Enter Monthly Gross Salary (EGP):"}</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={taxSimSalary}
                  onChange={(e) => setTaxSimSalary(Number(e.target.value) || 0)}
                  className="rounded-xl h-10 text-sm font-mono font-bold"
                  placeholder="12000"
                />
                <Button 
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["payroll-tax-simulator"] })}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {ar ? "حساب" : "Compute"}
                </Button>
              </div>
            </div>

            {taxSimData?.simulation && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-slate-100 rounded-xl">
                    <span className="text-[10px] text-muted-foreground block">{ar ? "تأمينات العامل 11%" : "Emp Insurance"}</span>
                    <span className="font-mono font-bold text-rose-600 text-xs">-{taxSimData.simulation.empInsurance} EGP</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 rounded-xl">
                    <span className="text-[10px] text-muted-foreground block">{ar ? "ضريبة كسب العمل" : "Income Tax"}</span>
                    <span className="font-mono font-bold text-rose-600 text-xs">-{taxSimData.simulation.monthlyIncomeTax} EGP</span>
                  </div>
                  <div className="p-2.5 bg-slate-100 rounded-xl">
                    <span className="text-[10px] text-muted-foreground block">{ar ? "صندوق الشهداء 0.05%" : "Martyrs Fund"}</span>
                    <span className="font-mono font-bold text-rose-600 text-xs">-{taxSimData.simulation.martyrsFund} EGP</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] text-emerald-800 font-bold block">{ar ? "صافي المحول للبنك" : "Net Take Home"}</span>
                    <span className="font-mono font-black text-emerald-700 text-xs">{taxSimData.simulation.netSalary} EGP</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 text-[11px]">
                    {ar ? "تفصيل شرائح ضريبة كسب العمل السنوية (قانون 30 لسنة 2023):" : "Law 30/2023 Annual Brackets Detail:"}
                  </div>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {taxSimData.simulation.bracketDetails?.map((b: any, i: number) => (
                      <div key={i} className="flex justify-between items-center p-2 text-[11px]">
                        <span className="text-slate-600">{b.label}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400">({b.taxableAmount} @ {b.rate})</span>
                          <span className="font-bold text-rose-600">={b.taxAmount} EGP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-[11px] flex justify-between items-center">
                  <span className="text-blue-800 font-medium">{ar ? "إجمالي عبء الفندق (الراتب + تأمينات المنشأة 18.75%):" : "Total Hotel Cost (Gross + 18.75% Co. Ins):"}</span>
                  <span className="font-mono font-bold text-blue-900">{taxSimData.simulation.totalEmployerBurden} EGP</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaxSimOpen(false)} className="rounded-xl">
              {ar ? "إغلاق" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: New Payroll Period */}
      <Dialog open={isNewPeriodOpen} onOpenChange={setIsNewPeriodOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "إنشاء فترة مالية جديدة للمرتبات" : "Create New Payroll Period"}</DialogTitle>
            <DialogDescription>
              {ar
                ? "تحديد شهر وسنة دورة المرتبات ونطاق تواريخ الحضور وأيام العمل"
                : "Define the payroll cycle dates, month/year, and standard working days"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs" dir={ar ? "rtl" : "ltr"}>
            <div>
              <label className="font-bold text-slate-700 block mb-1">{ar ? "اسم الفترة المالية:" : "Period Name:"}</label>
              <Input
                value={periodForm.periodName}
                onChange={(e) => setPeriodForm({ ...periodForm, periodName: e.target.value })}
                placeholder="نوفمبر 2026"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "السنة:" : "Year:"}</label>
                <Input
                  type="number"
                  value={periodForm.year}
                  onChange={(e) => setPeriodForm({ ...periodForm, year: Number(e.target.value) })}
                  className="h-9 text-xs font-mono rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "الشهر (1 - 12):" : "Month (1 - 12):"}</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={periodForm.month}
                  onChange={(e) => setPeriodForm({ ...periodForm, month: Number(e.target.value) })}
                  className="h-9 text-xs font-mono rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "تاريخ البداية:" : "Start Date:"}</label>
                <Input
                  type="date"
                  value={periodForm.startDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "تاريخ النهاية:" : "End Date:"}</label>
                <Input
                  type="date"
                  value={periodForm.endDate}
                  onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">{ar ? "عدد أيام العمل القياسية بالشهر:" : "Standard Working Days:"}</label>
              <Input
                type="number"
                value={periodForm.totalWorkingDays}
                onChange={(e) => setPeriodForm({ ...periodForm, totalWorkingDays: Number(e.target.value) })}
                className="h-9 text-xs font-mono rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPeriodOpen(false)} className="rounded-xl">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => createPeriodMutation.mutate(periodForm)}
              disabled={createPeriodMutation.isPending || !periodForm.periodName}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            >
              {createPeriodMutation.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "إنشاء الفترة" : "Create Period")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Employee Salary & Allowances */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              <span>{ar ? `تعديل راتب وبيانات: ${editEmployeeForm.fullName}` : `Edit Salary: ${editEmployeeForm.fullName}`}</span>
            </DialogTitle>
            <DialogDescription>
              {ar
                ? `كود الموظف: ${editEmployeeForm.employeeCode} • تعديل الراتب الأساسي، التأمينات، والحساب البنكي`
                : `Employee Code: ${editEmployeeForm.employeeCode} • Base salary, insurance salary, and banking`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs" dir={ar ? "rtl" : "ltr"}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "الراتب الأساسي الشهري (EGP):" : "Base Salary (EGP):"}</label>
                <Input
                  type="number"
                  value={editEmployeeForm.baseSalary}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, baseSalary: e.target.value })}
                  className="h-9 text-xs font-mono font-bold rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "الأجر التأميني (قانون 148):" : "Insurance Salary (EGP):"}</label>
                <Input
                  type="number"
                  value={editEmployeeForm.insuranceSalary}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, insuranceSalary: e.target.value })}
                  className="h-9 text-xs font-mono font-bold rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "الاشتراك بالتأمينات الاجتماعية:" : "Social Insurance Status:"}</label>
                <select
                  value={editEmployeeForm.isInsured ? "true" : "false"}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, isInsured: e.target.value === "true" })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-background"
                >
                  <option value="true">{ar ? "مؤمن عليه (خاضع لنسبة 11%)" : "Insured (11% deduction)"}</option>
                  <option value="false">{ar ? "غير مؤمن عليه" : "Not Insured"}</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "نوع العمالة:" : "Employment Type:"}</label>
                <select
                  value={editEmployeeForm.employmentType}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, employmentType: e.target.value })}
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-background"
                >
                  <option value="regular">{ar ? "عمالة فندقية مثبتة (Regular)" : "Regular Hotel Staff"}</option>
                  <option value="casual">{ar ? "عمالة يوميات وحفلات (Casual)" : "Casual / Daily Staff"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "رقم البصمة في الأجهزة:" : "Biometric Device ID:"}</label>
                <Input
                  value={editEmployeeForm.biometricId}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, biometricId: e.target.value })}
                  placeholder="1042"
                  className="h-9 text-xs font-mono rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "اسم البنك المحول إليه:" : "Bank Name:"}</label>
                <Input
                  value={editEmployeeForm.bankName}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, bankName: e.target.value })}
                  placeholder="البنك الأهلي المصري (NBE)"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "رقم الحساب البنكي:" : "Bank Account Number:"}</label>
                <Input
                  value={editEmployeeForm.bankAccountNumber}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, bankAccountNumber: e.target.value })}
                  placeholder="0123456789012"
                  className="h-9 text-xs font-mono rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">{ar ? "رقم الآيبان الدولي (IBAN):" : "IBAN:"}</label>
                <Input
                  value={editEmployeeForm.iban}
                  onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, iban: e.target.value })}
                  placeholder="EG123456789012345678901234567"
                  className="h-9 text-xs font-mono rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEmployeeOpen(false)} className="rounded-xl">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => {
                updateEmployeeMutation.mutate({
                  id: editEmployeeForm.id,
                  data: {
                    baseSalary: editEmployeeForm.baseSalary,
                    insuranceSalary: editEmployeeForm.insuranceSalary,
                    isInsured: editEmployeeForm.isInsured,
                    bankName: editEmployeeForm.bankName,
                    bankAccountNumber: editEmployeeForm.bankAccountNumber,
                    iban: editEmployeeForm.iban,
                    employmentType: editEmployeeForm.employmentType,
                    biometricId: editEmployeeForm.biometricId,
                  },
                });
              }}
              disabled={updateEmployeeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
            >
              {updateEmployeeMutation.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التعديلات" : "Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
