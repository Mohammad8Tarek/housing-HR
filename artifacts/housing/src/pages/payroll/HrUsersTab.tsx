import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Mail,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
  Clock,
  Sparkles,
  Layers,
  Coins,
  Fingerprint
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-utils";

export interface HrUserRecord {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  role: string;
  systemAccess: "payroll" | "attendance" | "both";
  propertyId?: number | null;
  permissions?: any;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function HrUsersTab() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [systemFilter, setSystemFilter] = useState<string>("all");

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "payroll_specialist",
    systemAccess: "both" as "payroll" | "attendance" | "both",
    permissions: {
      payroll: { view: true, create: true, edit: true, delete: false, approve: false, wps_export: false },
      attendance: { view: true, create: true, edit: false, delete: false, approve: false, sync_payroll: false },
    },
  });

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<HrUserRecord | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "officer",
    systemAccess: "both" as "payroll" | "attendance" | "both",
    password: "",
    permissions: {
      payroll: { view: true, create: false, edit: false, delete: false, approve: false, wps_export: false },
      attendance: { view: true, create: false, edit: false, delete: false, approve: false, sync_payroll: false },
    },
  });

  // Fetch HR Users directly from sunrise_payroll_attendance (Payroll DB)
  const { data: usersData, isLoading, refetch, isFetching } = useQuery<{ success: boolean; users: HrUserRecord[] }>({
    queryKey: ["hr-users-list"],
    queryFn: async () => {
      const res = await fetch("/api/hr-auth/users");
      if (!res.ok) throw new Error("Failed to load HR users");
      return res.json();
    },
    staleTime: 30_000,
  });

  const users = usersData?.users || [];

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof createForm) => {
      const res = await fetch("/api/hr-auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to create HR user");
      return json;
    },
    onSuccess: () => {
      toast.success(ar ? "تم إنشاء المستخدم بنجاح في قاعدة بيانات الرواتب" : "HR User created successfully in Payroll DB");
      setIsCreateOpen(false);
      setCreateForm({
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: "payroll_specialist",
        systemAccess: "both",
        permissions: {
          payroll: { view: true, create: true, edit: true, delete: false, approve: false, wps_export: false },
          attendance: { view: true, create: true, edit: false, delete: false, approve: false, sync_payroll: false },
        },
      });
      queryClient.invalidateQueries({ queryKey: ["hr-users-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || (ar ? "فشل إنشاء المستخدم" : "Failed to create user"));
    },
  });

  // Edit User Mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await fetch(`/api/hr-auth/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to update HR user");
      return json;
    },
    onSuccess: () => {
      toast.success(ar ? "تم تحديث بيانات وصلاحيات المستخدم بنجاح" : "User details & permissions updated successfully");
      setIsEditOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["hr-users-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || (ar ? "فشل تحديث المستخدم" : "Failed to update user"));
    },
  });

  // Toggle User Active Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/hr-auth/users/${id}/toggle`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to toggle status");
      return json;
    },
    onSuccess: (data) => {
      toast.success(
        data.isActive
          ? (ar ? "تم تفعيل الحساب بنجاح" : "Account activated successfully")
          : (ar ? "تم تعطيل الحساب بنجاح" : "Account deactivated successfully")
      );
      queryClient.invalidateQueries({ queryKey: ["hr-users-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle status");
    },
  });

  const handleOpenEdit = (user: HrUserRecord) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "officer",
      systemAccess: user.systemAccess || "both",
      password: "",
      permissions: user.permissions || {
        payroll: { view: true, create: false, edit: false, delete: false, approve: false, wps_export: false },
        attendance: { view: true, create: false, edit: false, delete: false, approve: false, sync_payroll: false },
      },
    });
    setIsEditOpen(true);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSystem = systemFilter === "all" || u.systemAccess === systemFilter;

    return matchesSearch && matchesRole && matchesSystem;
  });

  // Telemetry counts
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const payrollOnlyCount = users.filter((u) => u.systemAccess === "payroll").length;
  const attendanceOnlyCount = users.filter((u) => u.systemAccess === "attendance").length;
  const bothCount = users.filter((u) => u.systemAccess === "both").length;

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      {/* ─── 1. TOP HEADER & TELEMETRY KPI HUD ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border-border bg-card shadow-2xs hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                {ar ? "إجمالي مستخدمي المنظومة" : "Total HR Users"}
              </div>
              <div className="text-xl font-black text-foreground font-mono">
                {totalCount} <span className="text-xs text-muted-foreground font-normal">{ar ? "حساب" : "Users"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                {ar ? "الحسابات النشطة والمفعلة" : "Active Verified"}
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {activeCount} <span className="text-xs text-muted-foreground font-normal">{ar ? "نشط" : "Active"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                {ar ? "صلاحيات الرواتب فقط" : "Payroll System Only"}
              </div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {payrollOnlyCount} <span className="text-xs text-muted-foreground font-normal">{ar ? "مشغل" : "Officers"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground">
                {ar ? "صلاحيات البصمة فقط" : "Attendance System Only"}
              </div>
              <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {attendanceOnlyCount} <span className="text-xs text-muted-foreground font-normal">{ar ? "مشغل" : "Timekeepers"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. MAIN USER DIRECTORY CARD ─────────────────────────────────── */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-bold text-foreground">
                {ar ? "إدارة مستخدمي منظومة الرواتب والحضور (RBAC Master Directory)" : "Payroll & Attendance Users Directory"}
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
                sunrise_payroll_attendance.hr_users
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {ar
                ? "يتم تخزين وإدارة مستخدمي الرواتب والبصمة وصلاحياتهم وسجلاتهم كلياً في قاعدة بيانات الرواتب بمعزل عن نظام السكن."
                : "Users, roles, and granular permissions are isolated in the Payroll & Attendance DB."}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 text-xs rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{ar ? "تحديث" : "Refresh"}</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{ar ? "إضافة مستخدم جديد" : "Add HR User"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute top-2.5 right-3 text-muted-foreground pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ar ? "البحث بالاسم، اسم المستخدم، أو البريد الإلكتروني..." : "Search by username, full name, or email..."}
                className="text-xs rounded-xl pr-9 pl-3 h-9 bg-muted/40"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value)}
                className="text-xs rounded-xl h-9 px-3 bg-muted/40 border border-border text-foreground font-medium focus:outline-hidden"
              >
                <option value="all">{ar ? "كافة الأنظمة المصرحة" : "All Systems"}</option>
                <option value="both">{ar ? "الرواتب والحضور معاً" : "Both Payroll & Attendance"}</option>
                <option value="payroll">{ar ? "الرواتب فقط" : "Payroll Only"}</option>
                <option value="attendance">{ar ? "البصمة والحضور فقط" : "Attendance Only"}</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs rounded-xl h-9 px-3 bg-muted/40 border border-border text-foreground font-medium focus:outline-hidden"
              >
                <option value="all">{ar ? "كافة الأدوار الوظيفية" : "All Roles"}</option>
                <option value="super_admin">{ar ? "مدير النظام (Super Admin)" : "Super Admin"}</option>
                <option value="payroll_manager">{ar ? "مدير الرواتب (Payroll Manager)" : "Payroll Manager"}</option>
                <option value="attendance_supervisor">{ar ? "مشرف البصمة (Attendance Supervisor)" : "Attendance Supervisor"}</option>
                <option value="payroll_specialist">{ar ? "أخصائي أجور (Payroll Specialist)" : "Payroll Specialist"}</option>
                <option value="timekeeper">{ar ? "مسجل حضور (Timekeeper)" : "Timekeeper"}</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4 text-start">{ar ? "المستخدم" : "User"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "الدور الوظيفي" : "Role"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "النطاق المصرح به" : "System Access"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "صلاحيات الرواتب" : "Payroll Perms"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "صلاحيات البصمة" : "Attendance Perms"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "آخر تسجيل دخول" : "Last Login"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "الحالة" : "Status"}</th>
                    <th className="py-3 px-4 text-end">{ar ? "الإجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        <span>{ar ? "جارٍ تحميل سجل مستخدمي المنظومة..." : "Loading HR Users..."}</span>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <span>{ar ? "لا يوجد مستخدمون مطابقون لمعايير البحث" : "No users matched the criteria"}</span>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const p = u.permissions?.payroll || {};
                      const a = u.permissions?.attendance || {};

                      return (
                        <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                          {/* User info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center text-xs shrink-0 border border-primary/20">
                                {u.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-foreground flex items-center gap-1.5 font-mono">
                                  <span>{u.username}</span>
                                  {u.username === "admin" || u.username === "wh-hr" ? (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                      Core
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="text-[11px] text-muted-foreground">{u.fullName}</div>
                                {u.email && <div className="text-[10px] text-muted-foreground/75 font-mono">{u.email}</div>}
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                u.role === "super_admin"
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : u.role === "payroll_manager"
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                                  : u.role === "attendance_supervisor"
                                  ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30"
                                  : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {u.role}
                            </Badge>
                          </td>

                          {/* System Access */}
                          <td className="py-3 px-4">
                            {u.systemAccess === "both" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px]">
                                {ar ? "كلا المنظومتين (مرتبات وبصمة)" : "Both Suites"}
                              </Badge>
                            ) : u.systemAccess === "payroll" ? (
                              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px]">
                                {ar ? "الرواتب فقط" : "Payroll Only"}
                              </Badge>
                            ) : (
                              <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 text-[10px]">
                                {ar ? "البصمة والحضور فقط" : "Attendance Only"}
                              </Badge>
                            )}
                          </td>

                          {/* Payroll Perms */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {p.view && <span className="text-[9px] px-1 bg-muted rounded-sm">View</span>}
                              {p.create && <span className="text-[9px] px-1 bg-emerald-500/10 text-emerald-600 rounded-sm">Calc</span>}
                              {p.edit && <span className="text-[9px] px-1 bg-blue-500/10 text-blue-600 rounded-sm">Edit</span>}
                              {p.approve && <span className="text-[9px] px-1 bg-purple-500/10 text-purple-600 rounded-sm">Approve</span>}
                              {p.wps_export && <span className="text-[9px] px-1 bg-amber-500/10 text-amber-600 rounded-sm">WPS</span>}
                              {!p.view && !p.create && !p.approve && (
                                <span className="text-[10px] text-muted-foreground/60">—</span>
                              )}
                            </div>
                          </td>

                          {/* Attendance Perms */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {a.view && <span className="text-[9px] px-1 bg-muted rounded-sm">View</span>}
                              {a.create && <span className="text-[9px] px-1 bg-emerald-500/10 text-emerald-600 rounded-sm">Import</span>}
                              {a.approve && <span className="text-[9px] px-1 bg-purple-500/10 text-purple-600 rounded-sm">Leaves</span>}
                              {a.sync_payroll && <span className="text-[9px] px-1 bg-cyan-500/10 text-cyan-600 rounded-sm">Sync</span>}
                              {!a.view && !a.create && (
                                <span className="text-[10px] text-muted-foreground/60">—</span>
                              )}
                            </div>
                          </td>

                          {/* Last Login */}
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                            {u.lastLoginAt ? formatDate(u.lastLoginAt) : (ar ? "لم يسجل بعد" : "Never")}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => toggleStatusMutation.mutate(u.id)}
                              className="cursor-pointer"
                              title={ar ? "انقر للتبديل" : "Click to toggle"}
                            >
                              {u.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {ar ? "مفعل" : "Active"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  {ar ? "معطل" : "Disabled"}
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-end">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(u)}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                title={ar ? "تعديل الصلاحيات والمستخدم" : "Edit User & Permissions"}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStatusMutation.mutate(u.id)}
                                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-red-500 cursor-pointer"
                                title={u.isActive ? (ar ? "تعطيل الحساب" : "Deactivate") : (ar ? "تفعيل الحساب" : "Activate")}
                              >
                                <Power className={`w-3.5 h-3.5 ${u.isActive ? "text-emerald-500" : "text-red-500"}`} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 3. CREATE USER DIALOG ────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>{ar ? "إضافة مستخدم جديد لمنظومة الرواتب والحضور" : "Create New HR Operations User"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {ar
                ? "سيتم حفظ هذا المستخدم مباشرة في قاعدة بيانات sunrise_payroll_attendance وتعيين صلاحياته التفصيلية."
                : "Creates account directly inside the Payroll & Attendance database."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(createForm);
            }}
            className="space-y-4 py-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{ar ? "اسم المستخدم (Username):" : "Username:"}</label>
                <Input
                  required
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="e.g. ahmed.payroll"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{ar ? "كلمة المرور الأولية:" : "Password:"}</label>
                <Input
                  required
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{ar ? "الاسم الكامل:" : "Full Name:"}</label>
                <Input
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder={ar ? "أحمد مصطفى" : "Ahmed Mostafa"}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{ar ? "البريد الإلكتروني:" : "Email:"}</label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="ahmed@sunrise-resorts.com"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{ar ? "الدور الوظيفي (Role):" : "Role:"}</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full text-xs rounded-lg h-9 px-3 bg-muted/40 border border-border text-foreground font-medium focus:outline-hidden"
                >
                  <option value="payroll_specialist">{ar ? "أخصائي رواتب وأجور" : "Payroll Specialist"}</option>
                  <option value="payroll_manager">{ar ? "مدير الرواتب والأجور" : "Payroll Manager"}</option>
                  <option value="attendance_supervisor">{ar ? "مشرف وقت وحضور وبصمة" : "Attendance Supervisor"}</option>
                  <option value="timekeeper">{ar ? "مسجل وقت وحضور" : "Timekeeper"}</option>
                  <option value="financial_controller">{ar ? "مراقب مالي ومعتمد" : "Financial Controller"}</option>
                  <option value="super_admin">{ar ? "مدير نظام كامل (Super Admin)" : "Super Admin"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">{ar ? "نطاق الدخول المصرح (Access Scope):" : "Access Scope:"}</label>
                <select
                  value={createForm.systemAccess}
                  onChange={(e) => setCreateForm({ ...createForm, systemAccess: e.target.value as any })}
                  className="w-full text-xs rounded-lg h-9 px-3 bg-muted/40 border border-border text-foreground font-medium focus:outline-hidden"
                >
                  <option value="both">{ar ? "كلا المنظومتين (مرتبات وبصمة)" : "Both (Payroll & Attendance)"}</option>
                  <option value="payroll">{ar ? "الرواتب والأجور فقط" : "Payroll Only"}</option>
                  <option value="attendance">{ar ? "البصمة والحضور فقط" : "Attendance Only"}</option>
                </select>
              </div>
            </div>

            {/* Permissions Checkbox Grid */}
            <div className="pt-2 border-t border-border space-y-3">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-primary" />
                <span>{ar ? "الصلاحيات الدقيقة (Fine-Grained Permissions):" : "Granular Permissions:"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-xl border border-border">
                {/* Payroll Perms */}
                <div className="space-y-1.5">
                  <div className="font-bold text-amber-600 dark:text-amber-400 pb-1 border-b border-border/50">
                    {ar ? "صلاحيات الرواتب والأجور:" : "Payroll Suite:"}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.payroll.view}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: {
                            ...createForm.permissions,
                            payroll: { ...createForm.permissions.payroll, view: e.target.checked },
                          },
                        })
                      }
                      className="rounded-sm"
                    />
                    <span>{ar ? "عرض مسيرات الرواتب والشيتات" : "View Payroll Runs"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.payroll.create}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: {
                            ...createForm.permissions,
                            payroll: { ...createForm.permissions.payroll, create: e.target.checked },
                          },
                        })
                      }
                      className="rounded-sm"
                    />
                    <span>{ar ? "احتساب دورة الرواتب الشهرية" : "Calculate Payroll"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.payroll.approve}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: {
                            ...createForm.permissions,
                            payroll: { ...createForm.permissions.payroll, approve: e.target.checked },
                          },
                        })
                      }
                      className="rounded-sm"
                    />
                    <span>{ar ? "اعتماد مسيرات الرواتب (Approve)" : "Approve Runs"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.payroll.wps_export}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: {
                            ...createForm.permissions,
                            payroll: { ...createForm.permissions.payroll, wps_export: e.target.checked },
                          },
                        })
                      }
                      className="rounded-sm"
                    />
                    <span>{ar ? "تصدير شيتات البنوك WPS" : "Export WPS Files"}</span>
                  </label>
                </div>

                {/* Attendance Perms */}
                <div className="space-y-1.5">
                  <div className="font-bold text-cyan-600 dark:text-cyan-400 pb-1 border-b border-border/50">
                    {ar ? "صلاحيات البصمة والحضور:" : "Attendance Suite:"}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.attendance.view}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: {
                            ...createForm.permissions,
                            attendance: { ...createForm.permissions.attendance, view: e.target.checked },
                          },
                        })
                      }
                      className="rounded-sm"
                    />
                    <span>{ar ? "عرض حركات البصمة والنوباتجيات" : "View Punches & Roster"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.attendance.create}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: {
                            ...createForm.permissions,
                            attendance: { ...createForm.permissions.attendance, create: e.target.checked },
                          },
                        })
                      }
                      className="rounded-sm"
                    />
                    <span>{ar ? "معالجة واستيراد الحركات" : "Process Punches"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.attendance.approve}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: {
                            ...createForm.permissions,
                            attendance: { ...createForm.permissions.attendance, approve: e.target.checked },
                          },
                        })
                      }
                      className="rounded-sm"
                    />
                    <span>{ar ? "اعتماد طلبات الإجازات" : "Approve Leaves"}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.permissions.attendance.sync_payroll}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          permissions: {
                            ...createForm.permissions,
                            attendance: { ...createForm.permissions.attendance, sync_payroll: e.target.checked },
                          },
                        })
                      }
                      className="rounded-sm"
                    />
                    <span>{ar ? "ترحيل الساعات للرواتب (Sync)" : "Sync to Payroll"}</span>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {createMutation.isPending ? (
                  <span>{ar ? "جارٍ الحفظ..." : "Saving..."}</span>
                ) : (
                  <span>{ar ? "حفظ المستخدم" : "Save User"}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── 4. EDIT USER DIALOG ──────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Edit2 className="w-5 h-5 text-primary" />
              <span>
                {ar
                  ? `تعديل المستخدم والصلاحيات: [${editingUser?.username}]`
                  : `Edit HR User: [${editingUser?.username}]`}
              </span>
            </DialogTitle>
          </DialogHeader>

          {editingUser && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                editMutation.mutate({
                  id: editingUser.id,
                  payload: {
                    fullName: editForm.fullName,
                    email: editForm.email,
                    role: editForm.role,
                    systemAccess: editForm.systemAccess,
                    permissions: editForm.permissions,
                    ...(editForm.password ? { password: editForm.password } : {}),
                  },
                });
              }}
              className="space-y-4 py-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">{ar ? "الاسم الكامل:" : "Full Name:"}</label>
                  <Input
                    required
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">{ar ? "البريد الإلكتروني:" : "Email:"}</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">{ar ? "الدور الوظيفي:" : "Role:"}</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full text-xs rounded-lg h-9 px-3 bg-muted/40 border border-border text-foreground font-medium focus:outline-hidden"
                  >
                    <option value="payroll_specialist">{ar ? "أخصائي رواتب وأجور" : "Payroll Specialist"}</option>
                    <option value="payroll_manager">{ar ? "مدير الرواتب والأجور" : "Payroll Manager"}</option>
                    <option value="attendance_supervisor">{ar ? "مشرف وقت وحضور وبصمة" : "Attendance Supervisor"}</option>
                    <option value="timekeeper">{ar ? "مسجل وقت وحضور" : "Timekeeper"}</option>
                    <option value="financial_controller">{ar ? "مراقب مالي ومعتمد" : "Financial Controller"}</option>
                    <option value="super_admin">{ar ? "مدير نظام كامل (Super Admin)" : "Super Admin"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">{ar ? "نطاق الدخول المصرح به:" : "Access Scope:"}</label>
                  <select
                    value={editForm.systemAccess}
                    onChange={(e) => setEditForm({ ...editForm, systemAccess: e.target.value as any })}
                    className="w-full text-xs rounded-lg h-9 px-3 bg-muted/40 border border-border text-foreground font-medium focus:outline-hidden"
                  >
                    <option value="both">{ar ? "كلا المنظومتين (مرتبات وبصمة)" : "Both (Payroll & Attendance)"}</option>
                    <option value="payroll">{ar ? "الرواتب والأجور فقط" : "Payroll Only"}</option>
                    <option value="attendance">{ar ? "البصمة والحضور فقط" : "Attendance Only"}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {ar ? "تغيير كلمة المرور (اتركها فارغة للإبقاء على الحالية):" : "Reset Password (leave empty to keep current):"}
                </label>
                <Input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="text-xs font-mono"
                />
              </div>

              {/* Permissions Checkbox Grid */}
              <div className="pt-2 border-t border-border space-y-3">
                <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-primary" />
                  <span>{ar ? "تحديث الصلاحيات الدقيقة:" : "Update Granular Permissions:"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-xl border border-border">
                  {/* Payroll Perms */}
                  <div className="space-y-1.5">
                    <div className="font-bold text-amber-600 dark:text-amber-400 pb-1 border-b border-border/50">
                      {ar ? "صلاحيات الرواتب والأجور:" : "Payroll Suite:"}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.payroll?.view ?? true}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              payroll: { ...(editForm.permissions.payroll || {}), view: e.target.checked },
                            },
                          })
                        }
                        className="rounded-sm"
                      />
                      <span>{ar ? "عرض مسيرات الرواتب والشيتات" : "View Payroll Runs"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.payroll?.create ?? false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              payroll: { ...(editForm.permissions.payroll || {}), create: e.target.checked },
                            },
                          })
                        }
                        className="rounded-sm"
                      />
                      <span>{ar ? "احتساب دورة الرواتب الشهرية" : "Calculate Payroll"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.payroll?.approve ?? false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              payroll: { ...(editForm.permissions.payroll || {}), approve: e.target.checked },
                            },
                          })
                        }
                        className="rounded-sm"
                      />
                      <span>{ar ? "اعتماد مسيرات الرواتب (Approve)" : "Approve Runs"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.payroll?.wps_export ?? false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              payroll: { ...(editForm.permissions.payroll || {}), wps_export: e.target.checked },
                            },
                          })
                        }
                        className="rounded-sm"
                      />
                      <span>{ar ? "تصدير شيتات البنوك WPS" : "Export WPS Files"}</span>
                    </label>
                  </div>

                  {/* Attendance Perms */}
                  <div className="space-y-1.5">
                    <div className="font-bold text-cyan-600 dark:text-cyan-400 pb-1 border-b border-border/50">
                      {ar ? "صلاحيات البصمة والحضور:" : "Attendance Suite:"}
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.attendance?.view ?? true}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              attendance: { ...(editForm.permissions.attendance || {}), view: e.target.checked },
                            },
                          })
                        }
                        className="rounded-sm"
                      />
                      <span>{ar ? "عرض حركات البصمة والنوباتجيات" : "View Punches & Roster"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.attendance?.create ?? false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              attendance: { ...(editForm.permissions.attendance || {}), create: e.target.checked },
                            },
                          })
                        }
                        className="rounded-sm"
                      />
                      <span>{ar ? "معالجة واستيراد الحركات" : "Process Punches"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.attendance?.approve ?? false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              attendance: { ...(editForm.permissions.attendance || {}), approve: e.target.checked },
                            },
                          })
                        }
                        className="rounded-sm"
                      />
                      <span>{ar ? "اعتماد طلبات الإجازات" : "Approve Leaves"}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.permissions.attendance?.sync_payroll ?? false}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            permissions: {
                              ...editForm.permissions,
                              attendance: { ...(editForm.permissions.attendance || {}), sync_payroll: e.target.checked },
                            },
                          })
                        }
                        className="rounded-sm"
                      />
                      <span>{ar ? "ترحيل الساعات للرواتب (Sync)" : "Sync to Payroll"}</span>
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)}>
                  {ar ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={editMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white font-bold"
                >
                  {editMutation.isPending ? (
                    <span>{ar ? "جارٍ التحديث..." : "Updating..."}</span>
                  ) : (
                    <span>{ar ? "حفظ التغييرات" : "Save Changes"}</span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
