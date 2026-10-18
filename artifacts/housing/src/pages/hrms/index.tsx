import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { useProperty } from "@/context/PropertyContext";
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
  Users,
  Building2,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Search,
  Plus,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  Award,
  Bus,
  FileText,
  Filter,
  Eye,
  AlertCircle,
  FileCheck
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-utils";
import { useDebounce } from "@/hooks/use-debounce";

export default function HrmsSuitePage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("employees");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(2); // Meraki Sharm Default
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Detail Modal State
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // New Employee Modal State
  const [isNewEmpOpen, setIsNewEmpOpen] = useState<boolean>(false);
  const [newEmpForm, setNewEmpForm] = useState({
    employeeCode: "",
    firstName: "",
    secondName: "",
    thirdName: "",
    lastName: "",
    fullNameAr: "",
    nationalId: "",
    gender: "M",
    dateOfBirth: "1995-05-15",
    joiningDate: "2026-01-01",
    departmentId: "1",
    designationId: "1",
    baseSalary: "8500.00",
    bankName: "Banque Misr",
    bankAccountNumber: "240012345678",
    phone: "01012345678",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  // Queries
  const { data: propertiesData } = useQuery({
    queryKey: ["hrms-properties"],
    queryFn: async () => {
      const res = await fetch("/api/payroll/properties");
      return res.json();
    },
  });

  const { data: employeesData, isLoading: isEmpLoading } = useQuery({
    queryKey: ["hrms-employees", selectedPropertyId, page, pageSize, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        propertyId: String(selectedPropertyId),
        page: String(page),
        limit: String(pageSize),
        search: debouncedSearch,
      });
      const res = await fetch(`/api/hrms/employees?${params.toString()}`);
      return res.json();
    },
  });

  const { data: empDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ["hrms-employee-detail", selectedEmpId],
    queryFn: async () => {
      if (!selectedEmpId) return null;
      const res = await fetch(`/api/hrms/employees/${selectedEmpId}`);
      return res.json();
    },
    enabled: !!selectedEmpId && isDetailOpen,
  });

  const { data: orgTreeData } = useQuery({
    queryKey: ["hrms-org-tree", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/hrms/organization/tree?propertyId=${selectedPropertyId}`);
      return res.json();
    },
  });

  const { data: holidaysData } = useQuery({
    queryKey: ["hrms-holidays"],
    queryFn: async () => {
      const res = await fetch(`/api/hrms/holidays?year=2026`);
      return res.json();
    },
  });

  const { data: candidatesData } = useQuery({
    queryKey: ["hrms-candidates"],
    queryFn: async () => {
      const res = await fetch(`/api/hrms/recruitment/candidates`);
      return res.json();
    },
  });

  const { data: coursesData } = useQuery({
    queryKey: ["hrms-courses"],
    queryFn: async () => {
      const res = await fetch(`/api/hrms/learning/courses`);
      return res.json();
    },
  });

  const { data: medicalData } = useQuery({
    queryKey: ["hrms-medical"],
    queryFn: async () => {
      const res = await fetch(`/api/hrms/services/medical-records`);
      return res.json();
    },
  });

  // Create Employee Mutation
  const createEmpMutation = useMutation({
    mutationFn: async (formData: typeof newEmpForm) => {
      const res = await fetch("/api/hrms/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          propertyId: selectedPropertyId,
          departmentId: Number(formData.departmentId),
          designationId: Number(formData.designationId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create employee");
      return data;
    },
    onSuccess: () => {
      toast.success(ar ? "تم إضافة الموظف الجديد بنجاح" : "Employee master created successfully");
      setIsNewEmpOpen(false);
      queryClient.invalidateQueries({ queryKey: ["hrms-employees"] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const propertiesList = propertiesData?.properties || [];
  const employeesList = employeesData?.employees || [];
  const pagination = employeesData?.pagination || { totalPages: 1, totalRecords: 0 };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir={ar ? "rtl" : "ltr"}>
      {/* 1. Header & Property Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0f2942] text-[#c89332] flex items-center justify-center font-bold text-sm">
              S
            </span>
            <h1 className="text-2xl font-black text-[#0f2942] tracking-tight">
              {ar ? "منظومة الموارد البشرية وإدارة الكفاءات" : "SUNRISE HRMS & People Suite"}
            </h1>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
              {ar ? "سجل فندقي موحد" : "Enterprise Hotel Master"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {ar 
              ? "دليل الموظفين الشامل، الهيكل التنظيمي، التوظيف، التطوير المهني، والخدمات الفندقية"
              : "Comprehensive Employee Master, Org Hierarchy, Recruitment ATS, L&D, and Hospitality Services"}
          </p>
        </div>

        {/* Property Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">
            {ar ? "الفندق / المنتجع:" : "Hotel / Resort:"}
          </label>
          <select
            value={selectedPropertyId}
            onChange={(e) => {
              setSelectedPropertyId(Number(e.target.value));
              setPage(1);
            }}
            aria-label={ar ? "اختيار الفندق أو المنتجع" : "Select hotel or resort"}
            className="h-9 px-3 text-xs font-bold rounded-lg bg-slate-50 border border-slate-200 text-[#0f2942] focus:outline-hidden focus:ring-2 focus:ring-[#c89332]"
          >
            {propertiesList.map((p: any) => (
              <option key={p.id} value={p.id}>
                {ar ? p.nameAr : p.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 bg-slate-100 p-1 rounded-xl h-auto gap-1">
          <TabsTrigger value="employees" className="flex items-center gap-2 py-2.5 text-xs font-bold">
            <Users className="w-4 h-4 text-[#0f2942]" />
            {ar ? "دليل الموظفين المركزي" : "Employees Master"}
          </TabsTrigger>
          <TabsTrigger value="org" className="flex items-center gap-2 py-2.5 text-xs font-bold">
            <Building2 className="w-4 h-4 text-[#c89332]" />
            {ar ? "الهيكل التنظيمي والمراكز" : "Org & Cost Centers"}
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="flex items-center gap-2 py-2.5 text-xs font-bold">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            {ar ? "التوظيف والتعيين (ATS)" : "Recruitment & ATS"}
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2 py-2.5 text-xs font-bold">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            {ar ? "التدريب وتقييم الأداء" : "Training & Appraisals"}
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2 py-2.5 text-xs font-bold">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            {ar ? "الخدمات والرعاية الفندقية" : "Employee Welfare"}
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: EMPLOYEES DIRECTORY ──────────────────────────────── */}
        <TabsContent value="employees" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute top-2.5 start-3 text-slate-400" />
              <Input
                placeholder={ar ? "بحث بالاسم، الكود، الرقم القومي..." : "Search name, code, national ID..."}
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="ps-9 h-9 text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setIsNewEmpOpen(true)}
                className="bg-[#0f2942] hover:bg-[#163b5c] text-white text-xs font-bold h-9 gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#c89332]" />
                {ar ? "إضافة موظف جديد" : "New Employee Master"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">{ar ? "كود" : "Code"}</th>
                    <th className="p-3 text-start">{ar ? "اسم الموظف" : "Full Name"}</th>
                    <th className="p-3 text-start">{ar ? "القسم والمسمى" : "Dept & Role"}</th>
                    <th className="p-3 text-start">{ar ? "المستوى الوظيفي" : "Job Band"}</th>
                    <th className="p-3 text-start">{ar ? "تاريخ التعيين" : "Hire Date"}</th>
                    <th className="p-3 text-start">{ar ? "الراتب الأساسي" : "Base Salary"}</th>
                    <th className="p-3 text-start">{ar ? "الحالة" : "Status"}</th>
                    <th className="p-3 text-center">{ar ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isEmpLoading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        {ar ? "جاري تحميل سجلات الموظفين..." : "Loading employee records..."}
                      </td>
                    </tr>
                  ) : employeesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        {ar ? "لم يتم العثور على موظفين في هذا الفندق" : "No employees found in this property"}
                      </td>
                    </tr>
                  ) : (
                    employeesList.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#0f2942]">
                          {emp.employeeCode}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">
                            {ar ? emp.fullNameAr || emp.fullName : emp.fullName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {emp.nationalId ? `ID: ${emp.nationalId}` : emp.phone}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-700">
                            {ar ? emp.designationTitleAr || emp.designationTitle : emp.designationTitle}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ar ? emp.departmentNameAr : emp.departmentName}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] bg-slate-50">
                            {emp.jobGradeCode || "BAND-4"}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {formatDate(emp.joiningDate)}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700">
                          {Number(emp.baseSalary || 0).toLocaleString()} EGP
                        </td>
                        <td className="p-3">
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
                            {emp.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedEmpId(emp.id);
                              setIsDetailOpen(true);
                            }}
                            className="h-7 px-2 text-[#0f2942] hover:bg-slate-100"
                          >
                            <Eye className="w-3.5 h-3.5 me-1" />
                            {ar ? "الملف الكامل" : "View Dossier"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {ar 
                  ? `إجمالي السجلات: ${pagination.totalRecords} (صفحة ${page} من ${pagination.totalPages || 1})`
                  : `Total Records: ${pagination.totalRecords} (Page ${page} of ${pagination.totalPages || 1})`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 text-xs"
                >
                  {ar ? "السابق" : "Previous"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 text-xs"
                >
                  {ar ? "التالي" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: ORGANIZATION HIERARCHY ───────────────────────────── */}
        <TabsContent value="org" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Legal Entity Card */}
            <Card className="border-slate-200">
              <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#c89332]" />
                  {ar ? "الكيان القانوني والشركة الأم" : "Legal Entity"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="font-bold text-slate-800">
                  {ar ? "شركة صن رايز لإدارة المنتجعات والفنادق العائمة" : "SUNRISE Resorts & Cruises SAE"}
                </div>
                <div className="text-slate-500">س.ت: EG-CR-892110 | بطاقة ضريبية: TR-992-104-5</div>
                <div className="text-slate-500">{ar ? "مكتب تأمينات: جنوب سيناء" : "Office: South Sinai Insurance"}</div>
              </CardContent>
            </Card>

            {/* Job Grades Band Card */}
            <Card className="border-slate-200">
              <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#c89332]" />
                  {ar ? "المستويات الوظيفية الفندقية (Job Bands)" : "Hospitality Job Bands"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold">Band 1: ExCom & GM</span>
                  <Badge className="bg-amber-100 text-amber-900 text-[10px]">Points: 3.0</Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold">Band 2: Department Heads (HOD)</span>
                  <Badge className="bg-amber-100 text-amber-900 text-[10px]">Points: 2.0</Badge>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="font-bold">Band 3: Supervisors</span>
                  <Badge className="bg-amber-100 text-amber-900 text-[10px]">Points: 1.5</Badge>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold">Band 4/5: Line Associates</span>
                  <Badge className="bg-amber-100 text-amber-900 text-[10px]">Points: 1.0</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Official Holidays Card */}
            <Card className="border-slate-200">
              <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#c89332]" />
                  {ar ? "العطلات الرسمية 2026 (مصر)" : "2026 Official Egyptian Holidays"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs max-h-48 overflow-y-auto">
                {(holidaysData?.holidays || []).slice(0, 6).map((h: any) => (
                  <div key={h.id} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-700">{ar ? h.nameAr : h.nameEn}</span>
                    <span className="font-mono text-slate-500">{formatDate(h.holidayDate)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 3: RECRUITMENT & ATS ─────────────────────────────────── */}
        <TabsContent value="recruitment" className="space-y-4 mt-4">
          <Card className="border-slate-200">
            <CardHeader className="p-4 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#0f2942]">
                  {ar ? "خط سير المرشحين والمقابلات الفندقية (ATS Pipeline)" : "Candidate ATS Pipeline"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {ar ? "إدارة طلبات التعيين، المقابلات الفنية، وتحويل المرشح لموظف فندقي" : "Manage job applications, technical interviews, and new hire conversions"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {["applied", "interviewed", "offer_made", "hired"].map((stage) => {
                  const stageCandidates = (candidatesData?.candidates || []).filter((c: any) => c.stage === stage);
                  return (
                    <div key={stage} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black uppercase text-slate-700">{stage.replace("_", " ")}</span>
                        <Badge className="bg-slate-200 text-slate-800 text-[10px]">{stageCandidates.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {stageCandidates.map((c: any) => (
                          <div key={c.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-xs">
                            <div className="font-bold text-[#0f2942]">{c.fullName}</div>
                            <div className="text-[10px] text-slate-500">{c.currentPosition || "Hospitality Candidate"}</div>
                            <div className="text-[10px] font-mono text-emerald-700 mt-1">Exp: {c.expectedSalary || "8000"} EGP</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: TRAINING & APPRAISALS ────────────────────────────── */}
        <TabsContent value="learning" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mandatory Hospitality Courses */}
            <Card className="border-slate-200">
              <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  {ar ? "الدورات الفندقية والشهادات الإلزامية" : "Mandatory Training Catalog"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {(coursesData?.courses || []).map((crs: any) => (
                  <div key={crs.id} className="p-3 rounded-lg border border-slate-200 bg-white flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-[#0f2942]">{ar ? crs.nameAr : crs.nameEn}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Code: {crs.courseCode} | {crs.durationHours} Hours</div>
                    </div>
                    <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200 text-[10px]">
                      {crs.category}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Review Cycles */}
            <Card className="border-slate-200">
              <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  {ar ? "دورات تقييم الأداء السنوية (Appraisal Cycles)" : "Annual Performance Review Cycles"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800">2026 Annual Staff Appraisal (Q4 Evaluation)</div>
                  <div className="text-slate-500 text-[11px] mt-1">Status: Active | Applicable Year: 2026</div>
                  <div className="text-slate-500 text-[11px]">Formula: 30% Self-Review + 70% HOD Evaluation</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 5: WELFARE & HOTEL SERVICES ──────────────────────────── */}
        <TabsContent value="services" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medical Clinic Records */}
            <Card className="border-slate-200">
              <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  {ar ? "سجل العيادة الطبية والرعاية الصحية" : "Hotel Clinic & Occupational Health"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {(medicalData?.medicalRecords || []).length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    {ar ? "لا توجد سجلات زيارات عيادة حديثة" : "No recent clinic visits recorded"}
                  </div>
                ) : (
                  (medicalData?.medicalRecords || []).map((m: any) => (
                    <div key={m.id} className="p-2.5 rounded-lg border border-slate-200 text-xs bg-white">
                      <div className="font-bold text-slate-800">{m.diagnosis}</div>
                      <div className="text-[10px] text-slate-500">Dr. {m.doctorName} | Rest Days: {m.restDaysGranted}</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Staff Transport & Housing Integration */}
            <Card className="border-slate-200">
              <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-[#0f2942] flex items-center gap-2">
                  <Bus className="w-4 h-4 text-[#c89332]" />
                  {ar ? "حافلات نقل العاملين والربط مع السكن" : "Staff Transportation & Housing"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs space-y-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800">Sharm Old Town ⇄ Meraki Resort Route</div>
                  <div className="text-slate-500 text-[11px] mt-1">Bus Number: SH-9022 | Departure: 07:15 AM</div>
                  <div className="text-slate-500 text-[11px]">Capacity: 32 Seats | Dedicated Staff Service</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── MODAL 1: ADD NEW EMPLOYEE ───────────────────────────────── */}
      <Dialog open={isNewEmpOpen} onOpenChange={setIsNewEmpOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#0f2942]">
              {ar ? "إضافة ملف موظف جديد (Employee Master)" : "Add New Employee Master Record"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar 
                ? "إدخال الاسم الرباعي، كود الموظف، الرقم القومي، وبيانات التعيين والراتب"
                : "Enter 4-tier full name, employee code, national ID, and contractual details"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs py-3">
            <div>
              <label className="font-bold text-slate-700">{ar ? "كود الموظف" : "Employee Code"}</label>
              <Input
                value={newEmpForm.employeeCode}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, employeeCode: e.target.value })}
                placeholder="EMP-1005"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">{ar ? "الرقم القومي (14 رقم)" : "National ID"}</label>
              <Input
                value={newEmpForm.nationalId}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, nationalId: e.target.value })}
                placeholder="29505151234567"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">{ar ? "الاسم الأول (En)" : "First Name (En)"}</label>
              <Input
                value={newEmpForm.firstName}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, firstName: e.target.value })}
                placeholder="Ahmed"
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">{ar ? "الاسم الأخير (En)" : "Last Name (En)"}</label>
              <Input
                value={newEmpForm.lastName}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, lastName: e.target.value })}
                placeholder="Hassan"
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700">{ar ? "الاسم الرباعي باللغة العربية" : "Full Name (Arabic)"}</label>
              <Input
                value={newEmpForm.fullNameAr}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, fullNameAr: e.target.value })}
                placeholder="أحمد محمد علي حسن"
                className="mt-1 h-8 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">{ar ? "الراتب الأساسي (EGP)" : "Base Salary (EGP)"}</label>
              <Input
                type="number"
                value={newEmpForm.baseSalary}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, baseSalary: e.target.value })}
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">{ar ? "رقم الهاتف" : "Phone Number"}</label>
              <Input
                value={newEmpForm.phone}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                placeholder="01012345678"
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">{ar ? "اسم البنك" : "Bank Name"}</label>
              <Input
                value={newEmpForm.bankName}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, bankName: e.target.value })}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700">{ar ? "رقم الحساب البنكي" : "Bank Account Number"}</label>
              <Input
                value={newEmpForm.bankAccountNumber}
                onChange={(e) => setNewEmpForm({ ...newEmpForm, bankAccountNumber: e.target.value })}
                className="mt-1 h-8 text-xs font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsNewEmpOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              size="sm"
              onClick={() => createEmpMutation.mutate(newEmpForm)}
              disabled={createEmpMutation.isPending}
              className="bg-[#0f2942] hover:bg-[#163b5c] text-white font-bold"
            >
              {createEmpMutation.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ الموظف" : "Save Employee")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 2: VIEW COMPLETE EMPLOYEE DOSSIER ─────────────────── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#0f2942] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#c89332]" />
              {ar ? "الملف الوظيفي والتاريخ الكامل للموظف" : "Complete Employee Dossier & Career Record"}
            </DialogTitle>
          </DialogHeader>

          {isDetailLoading || !empDetailData?.employee ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              {ar ? "جاري جلب تفاصيل الملف..." : "Loading dossier..."}
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Header profile info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#0f2942]">
                    {ar ? empDetailData.employee.fullNameAr || empDetailData.employee.fullName : empDetailData.employee.fullName}
                  </h3>
                  <div className="text-slate-500 mt-0.5">
                    Code: <span className="font-mono font-bold">{empDetailData.employee.employeeCode}</span> | {empDetailData.employee.designationTitle}
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-mono font-black text-emerald-700 text-sm">
                    {Number(empDetailData.employee.baseSalary || 0).toLocaleString()} EGP
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[10px]">
                    {empDetailData.employee.status}
                  </Badge>
                </div>
              </div>

              {/* Sub-tabs: Documents, Career History, Leaves */}
              <Tabs defaultValue="career" className="w-full">
                <TabsList className="bg-slate-100 w-full grid grid-cols-3">
                  <TabsTrigger value="career" className="text-xs font-bold">{ar ? "المسار الوظيفي والترقيات" : "Career History"}</TabsTrigger>
                  <TabsTrigger value="docs" className="text-xs font-bold">{ar ? "المسوغات والمستندات" : "Documents"}</TabsTrigger>
                  <TabsTrigger value="clearance" className="text-xs font-bold">{ar ? "إخلاء الطرف ونهاية الخدمة" : "Exit Clearance"}</TabsTrigger>
                </TabsList>

                <TabsContent value="career" className="p-3 space-y-2 border border-slate-200 rounded-lg mt-2 bg-white">
                  {(empDetailData.employee.history || []).length === 0 ? (
                    <div className="text-center py-4 text-slate-400">
                      {ar ? "لا توجد ترقيات أو تنقلات مسجلة حتى الآن" : "No promotions or transfers recorded"}
                    </div>
                  ) : (
                    (empDetailData.employee.history || []).map((h: any) => (
                      <div key={h.id} className="p-2 border-b border-slate-100 last:border-0 flex justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{h.actionType}</div>
                          <div className="text-[10px] text-slate-500">{h.reason}</div>
                        </div>
                        <div className="text-end font-mono">
                          {formatDate(h.effectiveDate)}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="docs" className="p-3 space-y-2 border border-slate-200 rounded-lg mt-2 bg-white">
                  {(empDetailData.employee.documents || []).length === 0 ? (
                    <div className="text-center py-4 text-slate-400">
                      {ar ? "لا توجد مستندات مرفوعة" : "No documents uploaded"}
                    </div>
                  ) : (
                    (empDetailData.employee.documents || []).map((d: any) => (
                      <div key={d.id} className="p-2 border-b border-slate-100 last:border-0 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800">{d.documentType}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Doc No: {d.documentNumber}</div>
                        </div>
                        <Badge className="text-[10px] bg-slate-100 text-slate-700">Verified</Badge>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="clearance" className="p-3 border border-slate-200 rounded-lg mt-2 bg-white">
                  <div className="space-y-2">
                    <div className="font-bold text-slate-700">{ar ? "حالة إخلاء الطرف الفندقي" : "Hotel Exit Clearance Status"}</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-50 rounded-md">
                        {ar ? "إخلاء سكن العاملين:" : "Staff Housing Cleared:"} <Badge variant="outline">{ar ? "ساري" : "Active"}</Badge>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-md">
                        {ar ? "تسليم العهد والأصول:" : "Assets & Uniform:"} <Badge variant="outline">{ar ? "مكتمل" : "Returned"}</Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
