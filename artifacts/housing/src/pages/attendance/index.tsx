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
  Fingerprint,
  Radio,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Cpu,
  CalendarRange,
  FileText,
  UserCheck,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/ui/permission-gate";
import { formatDate, formatDateTime } from "@/lib/date-utils";

export default function AttendancePage() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(2); // Default Meraki Sharm
  const [activeTab, setActiveTab] = useState("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  // Modal States
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [isTestPunchOpen, setIsTestPunchOpen] = useState(false);

  // New Device Form
  const [deviceForm, setDeviceForm] = useState({
    name: "",
    ipAddress: "192.168.1.200",
    port: 4370,
    deviceModel: "ZKTeco uFace 800",
    terminalId: "TERM-01",
    location: "Main Staff Gate",
  });

  // New Shift Form
  const [shiftForm, setShiftForm] = useState({
    shiftCode: "MORNING",
    name: "Morning Shift (وردية صباحية)",
    startTime: "08:00",
    endTime: "16:00",
    lateGraceMinutes: 15,
    halfDayThresholdHours: 4,
  });

  // Test Punch Form
  const [punchForm, setPunchForm] = useState({
    employeeCode: "EMP-1001",
    punchType: "IN",
    verifyType: "fingerprint",
  });

  // Roster Matrix State
  const [rosterViewMode, setRosterViewMode] = useState<"matrix" | "shifts">("matrix");
  const [rosterYear, setRosterYear] = useState<number>(2026);
  const [rosterMonth, setRosterMonth] = useState<number>(10);

  // Leave Modal State
  const [isNewLeaveOpen, setIsNewLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    leaveTypeId: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    totalDays: 1,
    reason: "",
  });

  // 1. Fetch Properties
  const { data: propData } = useQuery({
    queryKey: ["attendance-properties"],
    queryFn: async () => {
      const res = await fetch("/api/attendance/properties");
      if (!res.ok) throw new Error("Failed to load properties");
      return res.json();
    },
  });

  // 2. Fetch Biometric Devices
  const { data: devicesData, isLoading: isLoadingDevices } = useQuery({
    queryKey: ["attendance-devices", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/devices?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load biometric devices");
      return res.json();
    },
  });

  // 3. Fetch Daily Records
  const { data: dailyRecordsData, isLoading: isLoadingDaily } = useQuery({
    queryKey: ["attendance-daily", selectedPropertyId, selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/daily-records?propertyId=${selectedPropertyId}&date=${selectedDate}`);
      if (!res.ok) throw new Error("Failed to load daily attendance");
      return res.json();
    },
  });

  // 4. Fetch Live Punches Feed
  const { data: punchesData, isLoading: isLoadingPunches } = useQuery({
    queryKey: ["attendance-punches", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/checkins?propertyId=${selectedPropertyId}&limit=50`);
      if (!res.ok) throw new Error("Failed to load punches");
      return res.json();
    },
    refetchInterval: 10000, // Live poll every 10s
  });

  // 5. Fetch Shifts
  const { data: shiftsData, isLoading: isLoadingShifts } = useQuery({
    queryKey: ["attendance-shifts", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/shifts?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load shifts");
      return res.json();
    },
  });

  // 6. Fetch Leaves & Operations
  const { data: leavesData, isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["attendance-leaves", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll-operations/leaves?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load leaves");
      return res.json();
    },
  });

  // 7. Fetch Monthly Roster Matrix
  const { data: rosterMatrixData, isLoading: isLoadingRosterMatrix } = useQuery({
    queryKey: ["attendance-roster-matrix", selectedPropertyId, rosterYear, rosterMonth],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/roster/matrix?propertyId=${selectedPropertyId}&year=${rosterYear}&month=${rosterMonth}`);
      if (!res.ok) throw new Error("Failed to load roster matrix");
      return res.json();
    },
  });

  // 8. Fetch Leave Types
  const { data: leaveTypesData } = useQuery({
    queryKey: ["attendance-leave-types"],
    queryFn: async () => {
      const res = await fetch("/api/payroll-operations/leave-types");
      if (!res.ok) return { leaveTypes: [] };
      return res.json();
    },
  });

  // 9. Fetch Staff List
  const { data: staffData } = useQuery({
    queryKey: ["attendance-staff-list", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/payroll/employees?propertyId=${selectedPropertyId}&limit=100`);
      if (!res.ok) return { employees: [] };
      return res.json();
    },
  });

  const staffList = staffData?.employees || [];
  const leaveTypesList = leaveTypesData?.leaveTypes || [];

  // Submit Leave Application Mutation
  const createLeaveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/payroll-operations/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit leave application");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم تقديم طلب الإجازة واعتماده بنجاح!" : "Leave application submitted successfully!");
      setIsNewLeaveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-leaves"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Update Leave Status Mutation
  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/payroll-operations/leaves/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم تحديث حالة طلب الإجازة بنجاح!" : "Leave status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["attendance-leaves"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Mutations
  const processPunchesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/process-punches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: selectedPropertyId, date: selectedDate }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process punches");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(
        ar
          ? `تمت معالجة حركات البصمة بنجاح! تم تقييم ${data.processedCount || 0} موظف`
          : `Punches evaluated successfully for ${data.processedCount || 0} employees!`,
      );
      queryClient.invalidateQueries({ queryKey: ["attendance-daily"] });
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const addDeviceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/attendance/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, propertyId: selectedPropertyId }),
      });
      if (!res.ok) throw new Error("Failed to register device");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم تسجيل جهاز البصمة بنجاح!" : "Biometric device registered successfully!");
      setIsAddDeviceOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-devices"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addShiftMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/attendance/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, propertyId: selectedPropertyId }),
      });
      if (!res.ok) throw new Error("Failed to create shift");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم إنشاء الوردية بنجاح!" : "Work shift created successfully!");
      setIsAddShiftOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-shifts"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Live Metrics Query
  const { data: metricsData } = useQuery({
    queryKey: ["attendance-metrics", selectedPropertyId],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/metrics?propertyId=${selectedPropertyId}`);
      if (!res.ok) throw new Error("Failed to load metrics");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const sendTestPunchMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          propertyId: selectedPropertyId,
          biometricId: payload.employeeCode,
          punchTime: new Date().toISOString(),
          logType: payload.punchType || "IN",
          syncSource: "web_simulator",
        }),
      });
      if (!res.ok) throw new Error("Failed to record test punch");
      return res.json();
    },
    onSuccess: () => {
      toast.success(ar ? "تم تسجيل حركة البصمة في السيرفر الحي بنجاح!" : "Test punch captured live successfully!");
      setIsTestPunchOpen(false);
      queryClient.invalidateQueries({ queryKey: ["attendance-punches"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-daily"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pingDeviceMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      const res = await fetch(`/api/attendance/devices/${deviceId}/ping`, { method: "POST" });
      if (!res.ok) throw new Error("Device ping failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(ar ? `الجهاز متصل ويعمل بكفاءة! زمن الاستجابة: ${data.device.latency}` : `Device online! Latency: ${data.device.latency}`);
      queryClient.invalidateQueries({ queryKey: ["attendance-devices"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-metrics"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const syncToPayrollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/sync-to-payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: selectedPropertyId, payrollPeriodId: 1 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to sync attendance to payroll");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(ar ? `تم ترحيل بيانات حضور ${data.syncedCount} موظف إلى مسير الرواتب بنجاح!` : `Synced ${data.syncedCount} employee attendance records to payroll!`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const properties = propData?.properties || propData?.data || [];
  const devices = devicesData?.devices || devicesData?.data || [];
  const dailyRecords = dailyRecordsData?.records || dailyRecordsData?.data || [];
  const punches = punchesData?.logs || punchesData?.punches || punchesData?.data || [];
  const shifts = shiftsData?.shifts || shiftsData?.data || [];
  const leaves = leavesData?.leaves || leavesData?.data || [];

  // Filter daily records by search
  const filteredDaily = dailyRecords.filter((rec: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (rec.employeeName && rec.employeeName.toLowerCase().includes(q)) ||
      (rec.employeeCode && rec.employeeCode.toLowerCase().includes(q)) ||
      (rec.department && rec.department.toLowerCase().includes(q))
    );
  });

  // Calculate live summary counts
  const presentCount = metricsData?.metrics?.presentCount ?? dailyRecords.filter((r: any) => r.status === "present" || r.status === "late").length;
  const lateCount = metricsData?.metrics?.lateCount ?? dailyRecords.filter((r: any) => r.status === "late" || (r.lateMinutes && r.lateMinutes > 0)).length;
  const absentCount = metricsData?.metrics?.absentCount ?? dailyRecords.filter((r: any) => r.status === "absent").length;
  const onlineDevicesCount = metricsData?.metrics?.activeDevices ?? devices.length;

  return (
    <div className="space-y-6 p-6">
      {/* Top Header & Property Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-md">
              <Fingerprint className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {ar ? "الحضور والانصراف وأجهزة البصمة" : "Attendance & Biometrics"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {ar
                  ? "إدارة أجهزة البصمة، تسجيل وتفريغ الحركات اليومية، الورديات، ومطابقة الحضور مع المرتبات"
                  : "Biometric machine telemetry, daily punch ingestion, shift rosters, and payroll synchronization"}
              </p>
            </div>
          </div>
        </div>

        {/* Property Selector & Quick Process */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border">
            <Building2 className="w-4 h-4 text-muted-foreground ml-1" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
            >
              {properties.map((p: any) => (
                <option key={p.id} value={p.id} className="bg-popover text-foreground">
                  {ar ? p.nameAr || p.name : p.name}
                </option>
              ))}
            </select>
          </div>

          <PermissionGate module="attendance" action="create">
            <Button
              onClick={() => processPunchesMutation.mutate()}
              disabled={processPunchesMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm font-bold text-xs rounded-xl"
            >
              <Play className={`w-4 h-4 ${processPunchesMutation.isPending ? "animate-spin" : ""}`} />
              {ar ? "معالجة حركات اليوم" : "Evaluate Today Punches"}
            </Button>
          </PermissionGate>

          <PermissionGate module="attendance" action="create">
            <Button
              onClick={() => syncToPayrollMutation.mutate()}
              disabled={syncToPayrollMutation.isPending}
              className="bg-[#0f2942] hover:bg-[#193a5c] text-white gap-2 shadow-sm font-bold text-xs rounded-xl"
            >
              <ArrowUpRight className={`w-4 h-4 text-[#c89332] ${syncToPayrollMutation.isPending ? "animate-spin" : ""}`} />
              {ar ? "ترحيل لرواتب الشهر" : "Sync to Payroll"}
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Devices */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {ar ? "أجهزة البصمة النشطة" : "Active Biometric Devices"}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">
                {onlineDevicesCount} / {devices.length}
              </h3>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {ar ? "متصلة بسيرفر البصمة" : "Syncing live via TCP/IP"}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl">
              <Cpu className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Today Punches */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {ar ? "إجمالي حركات البصمة" : "Punches Ingested Today"}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{punches.length}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {ar ? "حركات دخول وخروج فورية" : "Live raw punch buffer"}
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Present */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {ar ? "الحضور اليوم" : "Employees Present Today"}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{presentCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {ar ? "تم إثبات تواجدهم بالعمل" : "Verified against roster"}
              </p>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Delays & Absent */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {ar ? "تأخيرات وغياب" : "Lateness & Absenteeism"}
              </p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">
                {lateCount} <span className="text-sm font-normal text-muted-foreground">/ {absentCount} غائب</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {ar ? "محتسب وفق سياسة التسامح" : "Affecting payroll deductions"}
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-2">
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="daily" className="gap-2">
              <Calendar className="w-4 h-4" />
              {ar ? "سجل الحضور اليومي" : "Daily Attendance"}
            </TabsTrigger>
            <TabsTrigger value="punches" className="gap-2">
              <Radio className="w-4 h-4" />
              {ar ? "بث حركات البصمة" : "Live Punches Feed"}
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2">
              <Cpu className="w-4 h-4" />
              {ar ? "أجهزة وسيرفرات البصمة" : "Biometric Machines"}
            </TabsTrigger>
            <TabsTrigger value="shifts" className="gap-2">
              <Clock className="w-4 h-4" />
              {ar ? "الورديات ومواعيد العمل" : "Shifts & Rosters"}
            </TabsTrigger>
            <TabsTrigger value="leaves" className="gap-2">
              <CalendarRange className="w-4 h-4" />
              {ar ? "الإجازات والأذونات" : "Leaves & Permissions"}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === "daily" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-md border bg-background text-foreground"
                />
              </div>
            )}
            {activeTab === "devices" && (
              <PermissionGate module="attendance" action="create">
                <Button size="sm" onClick={() => setIsAddDeviceOpen(true)} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  {ar ? "إضافة جهاز بصمة" : "Add Device"}
                </Button>
              </PermissionGate>
            )}
            {activeTab === "shifts" && (
              <PermissionGate module="attendance" action="create">
                <Button size="sm" onClick={() => setIsAddShiftOpen(true)} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  {ar ? "إضافة وردية" : "Add Shift"}
                </Button>
              </PermissionGate>
            )}
            {activeTab === "leaves" && (
              <PermissionGate module="attendance" action="create">
                <Button size="sm" onClick={() => setIsNewLeaveOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4" />
                  {ar ? "طلب إجازة جديد" : "New Leave Request"}
                </Button>
              </PermissionGate>
            )}
            {activeTab === "punches" && (
              <Button size="sm" variant="outline" onClick={() => setIsTestPunchOpen(true)} className="gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-600" />
                {ar ? "محاكاة بصمة تجريبية" : "Simulate Punch"}
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: Daily Evaluated Records */}
        <TabsContent value="daily" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input
                placeholder={ar ? "بحث بالاسم أو كود الموظف..." : "Search employee..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9 text-sm"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {ar
                ? `عرض ${filteredDaily.length} موظف مسجل ليوم ${formatDate(selectedDate)}`
                : `Showing ${filteredDaily.length} records for ${formatDate(selectedDate)}`}
            </div>
          </div>

          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right rtl:text-right ltr:text-left">
                <thead className="bg-muted/60 text-muted-foreground text-xs uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">{ar ? "الموظف" : "Employee"}</th>
                    <th className="py-3 px-4">{ar ? "القسم / الإدارة" : "Department"}</th>
                    <th className="py-3 px-4">{ar ? "الوردية" : "Shift"}</th>
                    <th className="py-3 px-4">{ar ? "وقت الحضور" : "Check In"}</th>
                    <th className="py-3 px-4">{ar ? "وقت الانصراف" : "Check Out"}</th>
                    <th className="py-3 px-4 text-center">{ar ? "التأخير (دقيقة)" : "Late (mins)"}</th>
                    <th className="py-3 px-4 text-center">{ar ? "إضافي (ساعة)" : "Overtime"}</th>
                    <th className="py-3 px-4 text-center">{ar ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoadingDaily ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        {ar ? "جاري تحميل سجل الحضور..." : "Loading daily attendance..."}
                      </td>
                    </tr>
                  ) : filteredDaily.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">
                          {ar ? "لا توجد سجلات حضور مسجلة لهذا اليوم" : "No attendance records found for this date"}
                        </p>
                        <p className="text-xs mt-1">
                          {ar
                            ? "اضغط 'معالجة حركات اليوم' لمطابقة بصمات الأجهزة مع جدول الورديات"
                            : "Click 'Evaluate Today Punches' to process biometric check-ins"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredDaily.map((row: any) => (
                      <tr key={row.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 font-medium">
                          <div>{row.employeeName || "موظف"}</div>
                          <span className="text-xs text-muted-foreground">{row.employeeCode || row.employeeId}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{row.department || "العمليات الفندقية"}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="font-normal text-xs">
                            {row.shiftName || "صباحي (08:00 - 16:00)"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {row.firstCheckin ? (
                            <span className="text-emerald-600 font-semibold">{row.firstCheckin}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {row.lastCheckout ? (
                            <span className="text-blue-600 font-semibold">{row.lastCheckout}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.lateMinutes && row.lateMinutes > 0 ? (
                            <Badge variant="destructive" className="font-mono text-xs">
                              {row.lateMinutes} د
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.overtimeHours && row.overtimeHours > 0 ? (
                            <Badge className="bg-emerald-600 font-mono text-xs">
                              +{row.overtimeHours} س
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {row.status === "present" && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700">{ar ? "حاضر" : "Present"}</Badge>
                          )}
                          {row.status === "late" && (
                            <Badge className="bg-amber-600 hover:bg-amber-700">{ar ? "متأخر" : "Late"}</Badge>
                          )}
                          {row.status === "absent" && (
                            <Badge variant="destructive">{ar ? "غائب" : "Absent"}</Badge>
                          )}
                          {row.status === "half_day" && (
                            <Badge className="bg-purple-600">{ar ? "نصف يوم" : "Half Day"}</Badge>
                          )}
                          {row.status === "on_leave" && (
                            <Badge variant="secondary">{ar ? "إجازة" : "On Leave"}</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Live Punches Feed */}
        <TabsContent value="punches" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              {ar
                ? "بث حي ومباشر للبصمات الواردة من أجهزة البوابة والمطعم والإدارة"
                : "Live telemetry stream from gate, kitchen, and administrative biometric readers"}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["attendance-punches"] })}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {ar ? "تحديث البث" : "Refresh Stream"}
            </Button>
          </div>

          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right rtl:text-right ltr:text-left">
                <thead className="bg-muted/60 text-muted-foreground text-xs uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">{ar ? "وقت البصمة" : "Punch Timestamp"}</th>
                    <th className="py-3 px-4">{ar ? "كود الموظف" : "Employee Code"}</th>
                    <th className="py-3 px-4">{ar ? "نوع الحركة" : "Direction"}</th>
                    <th className="py-3 px-4">{ar ? "جهاز البصمة" : "Terminal / Machine"}</th>
                    <th className="py-3 px-4">{ar ? "طريقة التحقق" : "Verify Mode"}</th>
                    <th className="py-3 px-4">{ar ? "عنوان الـ IP" : "IP Address"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-xs">
                  {isLoadingPunches ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                        {ar ? "جاري استقبال حركات البصمة..." : "Listening for punches..."}
                      </td>
                    </tr>
                  ) : punches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        {ar ? "لم يتم استقبال بصمات حتى الآن" : "No live punches captured yet"}
                      </td>
                    </tr>
                  ) : (
                    punches.map((raw: any) => {
                      const p = raw.log || raw;
                      const emp = raw.employee;
                      const dev = raw.device;
                      const punchTime = p.punchTime || p.timestamp || p.createdAt;
                      const empCode = emp?.employeeCode || p.employeeCode || p.biometricId;
                      const empName = emp?.fullName;
                      const dir = (p.logType || p.punchType || "IN").toUpperCase();
                      const devName = dev?.deviceName || dev?.name || p.deviceName || "Gate Reader";
                      const ip = dev?.ipAddress || p.ipAddress || "192.168.1.201";

                      return (
                        <tr key={p.id || Math.random()} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {punchTime ? formatDateTime(punchTime) : "—"}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <span className="text-primary">{empCode}</span>
                            {empName && <span className="block text-[10px] text-muted-foreground font-sans font-normal">{empName}</span>}
                          </td>
                          <td className="py-3 px-4">
                            {dir === "IN" ? (
                              <Badge className="bg-emerald-600 gap-1 text-[11px]">
                                <ArrowDownLeft className="w-3 h-3" />
                                {ar ? "دخول IN" : "Check In"}
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-600 gap-1 text-[11px]">
                                <ArrowUpRight className="w-3 h-3" />
                                {ar ? "انصراف OUT" : "Check Out"}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground font-sans">{devName}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[11px] uppercase">
                              {p.verifyType || "FINGERPRINT"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{ip}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Biometric Machines */}
        <TabsContent value="devices" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((dev: any) => (
              <Card key={dev.id} className="border shadow-sm hover:border-emerald-500/50 transition-all">
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-xl">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{dev.name}</CardTitle>
                      <CardDescription className="text-xs">{dev.location || "البوابة الرئيسية"}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={dev.status === "online" ? "default" : "secondary"}
                    className={dev.status === "online" ? "bg-emerald-600" : ""}
                  >
                    {dev.status === "online" ? (ar ? "متصل Online" : "Online") : ar ? "غير متصل" : "Offline"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">{ar ? "موديل الجهاز" : "Model"}:</span>
                    <span className="font-semibold">{dev.deviceModel}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">{ar ? "عنوان الشبكة (IP & Port)" : "IP & Port"}:</span>
                    <span className="font-mono">
                      {dev.ipAddress}:{dev.port}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">{ar ? "كود المحطة (Terminal ID)" : "Terminal ID"}:</span>
                    <span className="font-mono">{dev.terminalId}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">{ar ? "آخر مزامنة" : "Last Sync"}:</span>
                    <span className="font-mono text-muted-foreground">
                      {dev.lastSyncAt ? formatDateTime(dev.lastSyncAt) : ar ? "الآن" : "Just now"}
                    </span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      disabled={pingDeviceMutation.isPending}
                      onClick={() => pingDeviceMutation.mutate(dev.id)}
                    >
                      {ar ? "فحص الاتصال Ping" : "Test Ping"}
                    </Button>
                    <Button
                      size="sm"
                      className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => toast.success(ar ? "تم تفريغ البصمات من ذاكرة الجهاز" : "Punches synced successfully")}
                    >
                      {ar ? "تفريغ البصمات" : "Sync Records"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 4: Shifts & Rosters */}
        <TabsContent value="shifts" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border">
            <div className="flex items-center gap-1.5 bg-muted/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRosterViewMode("matrix")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  rosterViewMode === "matrix" ? "bg-white text-primary shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ar ? "جدول نوباتجيات الشهر التفاعلي (Roster Matrix)" : "Duty Roster Matrix"}
              </button>
              <button
                type="button"
                onClick={() => setRosterViewMode("shifts")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  rosterViewMode === "shifts" ? "bg-white text-primary shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {ar ? "تعريف الورديات ومواعيد العمل" : "Shift Definitions"}
              </button>
            </div>

            {rosterViewMode === "matrix" && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground font-medium">{ar ? "الشهر:" : "Month:"}</span>
                  <select
                    value={rosterMonth}
                    onChange={(e) => setRosterMonth(Number(e.target.value))}
                    className="text-xs px-2.5 py-1 rounded-md border bg-background font-semibold cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {m} / {rosterYear}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] bg-background/80 px-2.5 py-1 rounded-lg border">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <span className="font-semibold">{ar ? "ص صباحي" : "M Morning"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span className="font-semibold">{ar ? "م مسائي" : "E Evening"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    <span className="font-semibold">{ar ? "ل ليلي" : "N Night"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    <span className="font-semibold">{ar ? "س سيرفيس" : "S Split"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="font-semibold">{ar ? "OFF راحة" : "OFF"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {rosterViewMode === "matrix" ? (
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[550px] relative">
                <table className="w-full text-xs text-right rtl:text-right ltr:text-left border-collapse">
                  <thead className="bg-muted/80 text-muted-foreground uppercase text-[11px] sticky top-0 z-20 border-b">
                    <tr>
                      <th className="py-2.5 px-3 sticky right-0 bg-muted/95 z-30 min-w-[170px] shadow-sm">
                        {ar ? "الموظف والوظيفة" : "Employee"}
                      </th>
                      <th className="py-2.5 px-3 min-w-[110px]">{ar ? "القسم" : "Dept"}</th>
                      {(rosterMatrixData?.days || []).map((day: any) => (
                        <th
                          key={day.dayNumber}
                          className={`py-2 px-1 text-center min-w-[34px] font-mono ${
                            day.isWeekend ? "bg-amber-500/10 text-amber-700 font-bold" : ""
                          }`}
                        >
                          <div>{day.dayNumber}</div>
                          <div className="text-[9px] font-normal opacity-80">{ar ? day.dayNameAr : day.dayName}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoadingRosterMatrix ? (
                      <tr>
                        <td colSpan={35} className="py-12 text-center text-muted-foreground">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                          {ar ? "جاري تحميل جدول نوباتجيات الشهر..." : "Loading monthly duty roster..."}
                        </td>
                      </tr>
                    ) : (rosterMatrixData?.roster || []).map((row: any) => (
                      <tr key={row.employeeId} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 sticky right-0 bg-background/95 z-10 border-l font-medium">
                          <div className="font-bold text-foreground truncate max-w-[160px]">
                            {ar ? row.fullNameAr || row.fullName : row.fullName}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                            <span>{row.employeeCode}</span>
                            <span>•</span>
                            <span className="truncate">{row.designation}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground font-medium text-xs">
                          {row.department}
                        </td>
                        {(rosterMatrixData?.days || []).map((day: any) => {
                          const sched = row.schedule?.[day.dayNumber] || { shiftCode: "OFF", name: "راحة", color: "#64748b" };
                          const isOff = sched.shiftCode === "OFF";
                          const isMorning = sched.shiftCode === "MORNING";
                          const isEvening = sched.shiftCode === "EVENING";
                          const isNight = sched.shiftCode === "NIGHT";
                          const isSplit = sched.shiftCode === "SPLIT";

                          return (
                            <td key={day.dayNumber} className="py-1.5 px-0.5 text-center">
                              <span
                                title={`${sched.name} - ${day.date}`}
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-black font-mono cursor-pointer transition-transform hover:scale-110 shadow-2xs ${
                                  isOff
                                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                    : isMorning
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40"
                                    : isEvening
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300/40"
                                    : isNight
                                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300/40"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40"
                                }`}
                              >
                                {isOff ? "OFF" : isMorning ? "ص" : isEvening ? "م" : isNight ? "ل" : "س"}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right rtl:text-right ltr:text-left">
                  <thead className="bg-muted/60 text-muted-foreground text-xs uppercase border-b">
                    <tr>
                      <th className="py-3 px-4">{ar ? "كود الوردية" : "Shift Code"}</th>
                      <th className="py-3 px-4">{ar ? "اسم الوردية" : "Shift Name"}</th>
                      <th className="py-3 px-4">{ar ? "بداية الدوام" : "Start Time"}</th>
                      <th className="py-3 px-4">{ar ? "نهاية الدوام" : "End Time"}</th>
                      <th className="py-3 px-4 text-center">{ar ? "فترة السماح للتأخير" : "Grace Period"}</th>
                      <th className="py-3 px-4 text-center">{ar ? "حد احتساب نصف يوم" : "Half-Day Threshold"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {shifts.map((s: any) => (
                      <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-primary">{s.shiftCode}</td>
                        <td className="py-3 px-4 font-medium">{s.name}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-600">{s.startTime}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-600">{s.endTime}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="font-mono text-xs">
                            {s.lateGraceMinutes} {ar ? "دقيقة" : "mins"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                          {s.halfDayThresholdHours} {ar ? "ساعات" : "hours"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Tab 5: Leaves & Permissions */}
        <TabsContent value="leaves" className="mt-4 space-y-4">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right rtl:text-right ltr:text-left">
                <thead className="bg-muted/60 text-muted-foreground text-xs uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">{ar ? "الموظف" : "Employee"}</th>
                    <th className="py-3 px-4">{ar ? "نوع الإجازة" : "Leave Type"}</th>
                    <th className="py-3 px-4">{ar ? "من تاريخ" : "From Date"}</th>
                    <th className="py-3 px-4">{ar ? "إلى تاريخ" : "To Date"}</th>
                    <th className="py-3 px-4 text-center">{ar ? "عدد الأيام" : "Total Days"}</th>
                    <th className="py-3 px-4 text-center">{ar ? "الحالة" : "Status"}</th>
                    <th className="py-3 px-4 text-center">{ar ? "إجراءات الاعتماد" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        <div className="font-semibold text-foreground">{l.employeeName || "موظف"}</div>
                        <span className="text-xs font-mono text-muted-foreground">{l.employeeCode}</span>
                      </td>
                      <td className="py-3 px-4 font-medium">{l.leaveTypeName || "إجازة اعتيادية سنوية"}</td>
                      <td className="py-3 px-4 font-mono text-xs">{formatDate(l.startDate)}</td>
                      <td className="py-3 px-4 font-mono text-xs">{formatDate(l.endDate)}</td>
                      <td className="py-3 px-4 text-center font-bold font-mono">{l.totalDays}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            l.status === "approved"
                              ? "bg-emerald-600 text-white"
                              : l.status === "rejected"
                              ? "bg-destructive text-white"
                              : "bg-amber-600 text-white"
                          }
                        >
                          {l.status === "approved"
                            ? ar
                              ? "معتمدة ومرحلة"
                              : "Approved"
                            : l.status === "rejected"
                            ? ar
                              ? "مرفوضة"
                              : "Rejected"
                            : ar
                            ? "قيد المراجعة"
                            : "Pending"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {l.status === "pending" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              disabled={updateLeaveStatusMutation.isPending}
                              onClick={() => updateLeaveStatusMutation.mutate({ id: l.id, status: "approved" })}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{ar ? "اعتماد" : "Approve"}</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                              disabled={updateLeaveStatusMutation.isPending}
                              onClick={() => updateLeaveStatusMutation.mutate({ id: l.id, status: "rejected" })}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{ar ? "رفض" : "Reject"}</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">
                            {l.status === "approved" ? "✓ معتمدة رسمي" : "✗ ملغاة"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Add Biometric Device */}
      <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "تسجيل جهاز بصمة جديد" : "Register Biometric Device"}</DialogTitle>
            <DialogDescription>
              {ar
                ? "إضافة ماكينة ZKTeco / Suprema للربط بسيرفر البصمة والتفريغ الآلي"
                : "Register a TCP/IP biometric device for automatic checkin telemetry"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{ar ? "اسم الجهاز" : "Device Name"}</label>
              <Input
                value={deviceForm.name}
                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                placeholder="Gate 1 Reader"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{ar ? "عنوان IP" : "IP Address"}</label>
                <Input
                  value={deviceForm.ipAddress}
                  onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                  placeholder="192.168.1.200"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{ar ? "منفذ الاتصال Port" : "Port"}</label>
                <Input
                  type="number"
                  value={deviceForm.port}
                  onChange={(e) => setDeviceForm({ ...deviceForm, port: Number(e.target.value) })}
                  placeholder="4370"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{ar ? "الموديل" : "Model"}</label>
              <Input
                value={deviceForm.deviceModel}
                onChange={(e) => setDeviceForm({ ...deviceForm, deviceModel: e.target.value })}
                placeholder="ZKTeco uFace 800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{ar ? "الموقع" : "Location"}</label>
              <Input
                value={deviceForm.location}
                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                placeholder="Main Gate"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDeviceOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => addDeviceMutation.mutate(deviceForm)}
              disabled={addDeviceMutation.isPending || !deviceForm.name}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {ar ? "حفظ وتفعيل" : "Save & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Shift */}
      <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{ar ? "إضافة وردية عمل جديدة" : "Add New Work Shift"}</DialogTitle>
            <DialogDescription>
              {ar ? "تحديد مواعيد البداية والنهاية وفترة السماح للتأخير" : "Configure shift start/end times and late grace period"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{ar ? "كود الوردية" : "Shift Code"}</label>
                <Input
                  value={shiftForm.shiftCode}
                  onChange={(e) => setShiftForm({ ...shiftForm, shiftCode: e.target.value })}
                  placeholder="NIGHT"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{ar ? "اسم الوردية" : "Shift Name"}</label>
                <Input
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  placeholder="وردية ليلية"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{ar ? "بداية الوردية" : "Start Time"}</label>
                <Input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{ar ? "نهاية الوردية" : "End Time"}</label>
                <Input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {ar ? "فترة السماح (دقيقة)" : "Grace Period (mins)"}
                </label>
                <Input
                  type="number"
                  value={shiftForm.lateGraceMinutes}
                  onChange={(e) => setShiftForm({ ...shiftForm, lateGraceMinutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {ar ? "حد نصف اليوم (ساعة)" : "Half Day Threshold"}
                </label>
                <Input
                  type="number"
                  value={shiftForm.halfDayThresholdHours}
                  onChange={(e) => setShiftForm({ ...shiftForm, halfDayThresholdHours: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddShiftOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => addShiftMutation.mutate(shiftForm)}
              disabled={addShiftMutation.isPending || !shiftForm.shiftCode}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {ar ? "حفظ الوردية" : "Save Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Simulate Punch */}
      <Dialog open={isTestPunchOpen} onOpenChange={setIsTestPunchOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{ar ? "محاكاة بصمة موظف" : "Simulate Biometric Punch"}</DialogTitle>
            <DialogDescription>
              {ar ? "اختبار وصول حركة البصمة للباك إند بدون جهاز فعلي" : "Simulate an IN/OUT punch event"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{ar ? "كود الموظف" : "Employee Code"}</label>
              <Input
                value={punchForm.employeeCode}
                onChange={(e) => setPunchForm({ ...punchForm, employeeCode: e.target.value })}
                placeholder="EMP-1001"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{ar ? "نوع الحركة" : "Punch Type"}</label>
                <select
                  value={punchForm.punchType}
                  onChange={(e) => setPunchForm({ ...punchForm, punchType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="IN">{ar ? "دخول IN" : "Check In"}</option>
                  <option value="OUT">{ar ? "انصراف OUT" : "Check Out"}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{ar ? "التحقق" : "Verify Type"}</label>
                <select
                  value={punchForm.verifyType}
                  onChange={(e) => setPunchForm({ ...punchForm, verifyType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-xs bg-background"
                >
                  <option value="fingerprint">{ar ? "بصمة إصبع" : "Fingerprint"}</option>
                  <option value="face">{ar ? "بصمة وجه" : "Face ID"}</option>
                  <option value="card">{ar ? "كارت RFID" : "RFID Card"}</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestPunchOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => sendTestPunchMutation.mutate(punchForm)}
              disabled={sendTestPunchMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {ar ? "إرسال البصمة" : "Send Punch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: New Leave Request */}
      <Dialog open={isNewLeaveOpen} onOpenChange={setIsNewLeaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-emerald-600" />
              <span>{ar ? "تقديم طلب إجازة رسمي" : "Submit Leave Application"}</span>
            </DialogTitle>
            <DialogDescription>
              {ar
                ? "تسجيل إجازة للموظف واحتسابها ضمن رصيد الإجازات السنوي ومسير الرواتب"
                : "Submit leave application with automatic balance deduction"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{ar ? "الموظف" : "Employee"}</label>
              <select
                value={leaveForm.employeeId}
                onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
              >
                <option value="">{ar ? "-- اختر الموظف --" : "-- Select Employee --"}</option>
                {staffList.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {ar ? emp.fullNameAr || emp.fullName : emp.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">{ar ? "نوع الإجازة" : "Leave Type"}</label>
              <select
                value={leaveForm.leaveTypeId}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-xs bg-background"
              >
                {leaveTypesList.map((lt: any) => (
                  <option key={lt.id} value={lt.id}>
                    {ar ? lt.nameAr : lt.nameEn} ({lt.maxDaysPerYear || 21} {ar ? "يوم/سنة" : "days/yr"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{ar ? "من تاريخ" : "From Date"}</label>
                <Input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => {
                    const s = e.target.value;
                    const days = Math.max(1, Math.round((new Date(leaveForm.endDate).getTime() - new Date(s).getTime()) / (1000 * 60 * 60 * 24)) + 1);
                    setLeaveForm({ ...leaveForm, startDate: s, totalDays: isNaN(days) ? 1 : days });
                  }}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">{ar ? "إلى تاريخ" : "To Date"}</label>
                <Input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => {
                    const end = e.target.value;
                    const days = Math.max(1, Math.round((new Date(end).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
                    setLeaveForm({ ...leaveForm, endDate: end, totalDays: isNaN(days) ? 1 : days });
                  }}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">{ar ? "إجمالي أيام الإجازة" : "Total Days"}</label>
              <Input
                type="number"
                value={leaveForm.totalDays}
                onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: Number(e.target.value) })}
                className="mt-1 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">{ar ? "سبب الإجازة والملاحظات" : "Reason & Notes"}</label>
              <Input
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                placeholder={ar ? "إجازة اعتيادية سنوية مجدولة" : "Annual scheduled vacation"}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewLeaveOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => {
                if (!leaveForm.employeeId) {
                  toast.error(ar ? "يرجى اختيار الموظف أولاً" : "Please select an employee first");
                  return;
                }
                createLeaveMutation.mutate({
                  ...leaveForm,
                  propertyId: selectedPropertyId,
                });
              }}
              disabled={createLeaveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {ar ? "اعتماد وتقديم الإجازة" : "Submit Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
