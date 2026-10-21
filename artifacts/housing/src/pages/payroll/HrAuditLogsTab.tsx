import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Search,
  RefreshCw,
  Clock,
  Eye,
  User,
  Filter,
  CheckCircle2,
  XCircle,
  Database,
  Terminal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export interface HrAuditRecord {
  id: number;
  propertyId?: number | null;
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: any;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  } | null;
}

export function HrAuditLogsTab() {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const [selectedLog, setSelectedLog] = useState<HrAuditRecord | null>(null);

  // Query HR Audit Logs strictly from sunrise_payroll_attendance (Payroll DB)
  const { data, isLoading, refetch, isFetching } = useQuery<{
    success: boolean;
    logs: HrAuditRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    queryKey: ["hr-audit-logs", page, limit, search, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search.trim()) params.set("search", search.trim());
      if (actionFilter && actionFilter !== "all") params.set("action", actionFilter);

      const res = await fetch(`/api/hr-auth/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load HR audit logs");
      return res.json();
    },
    staleTime: 15_000,
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">LOGIN</Badge>;
      case "LOGOUT":
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30">LOGOUT</Badge>;
      case "LOGIN_FAILED":
        return <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30">FAILED</Badge>;
      case "PAYROLL_RUN":
      case "PAYROLL_APPROVE":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold">{action}</Badge>;
      case "WPS_EXPORT":
        return <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold">WPS_EXPORT</Badge>;
      case "HR_USER_CREATE":
      case "HR_USER_UPDATE":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">{action}</Badge>;
      case "SUPERVISOR_PIN_VERIFIED":
        return <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30 font-mono">PIN_VERIFIED</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground border-border">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      {/* ─── 1. TOP HEADER & TELEMETRY HUD ───────────────────────────────── */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-5 pb-3 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-bold text-foreground">
                {ar ? "سجل الرقابة والتدقيق الأمني لمنظومة الرواتب والحضور" : "Payroll & Attendance Operations Audit Log"}
              </CardTitle>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
                sunrise_payroll_attendance.hrms_audit_logs
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              {ar
                ? "سجل أمني غير قابل للتعديل يوثق جميع عمليات تسجيل الدخول، الاحتسابات المالية، اعتمادات المشرف، وتصدير شيتات البنوك."
                : "Immutable operations log capturing all authentication, payroll calculations, authorizations, and WPS exports."}
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
              <span className="hidden sm:inline">{ar ? "تحديث السجل" : "Refresh"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute top-2.5 right-3 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={ar ? "البحث بنوع العملية، الكيان، عنوان IP، أو التفاصيل..." : "Search by action, entity, IP, or details..."}
                className="text-xs rounded-xl pr-9 pl-3 h-9 bg-muted/40"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-xl h-9 px-3 bg-muted/40 border border-border text-foreground font-medium focus:outline-hidden"
              >
                <option value="all">{ar ? "كافة الإجراءات المسجلة" : "All Actions"}</option>
                <option value="LOGIN">{ar ? "تسجيل دخول (LOGIN)" : "LOGIN"}</option>
                <option value="LOGOUT">{ar ? "تسجيل خروج (LOGOUT)" : "LOGOUT"}</option>
                <option value="LOGIN_FAILED">{ar ? "محاولة فاشلة (LOGIN_FAILED)" : "LOGIN_FAILED"}</option>
                <option value="PAYROLL_RUN">{ar ? "احتساب مسير رواتب" : "PAYROLL_RUN"}</option>
                <option value="PAYROLL_APPROVE">{ar ? "اعتماد مسير رواتب" : "PAYROLL_APPROVE"}</option>
                <option value="WPS_EXPORT">{ar ? "تصدير شيت بنك WPS" : "WPS_EXPORT"}</option>
                <option value="SUPERVISOR_PIN_VERIFIED">{ar ? "تفويض PIN المشرف" : "PIN_VERIFIED"}</option>
                <option value="HR_USER_CREATE">{ar ? "إنشاء مستخدم HR" : "HR_USER_CREATE"}</option>
                <option value="HR_USER_UPDATE">{ar ? "تحديث مستخدم HR" : "HR_USER_UPDATE"}</option>
              </select>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="text-xs rounded-xl h-9 px-3 bg-muted/40 border border-border text-foreground font-medium focus:outline-hidden"
              >
                <option value={10}>10 / {ar ? "صفحة" : "page"}</option>
                <option value={20}>20 / {ar ? "صفحة" : "page"}</option>
                <option value={50}>50 / {ar ? "صفحة" : "page"}</option>
                <option value={100}>100 / {ar ? "صفحة" : "page"}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3 px-4 text-start">#</th>
                    <th className="py-3 px-4 text-start">{ar ? "توقيت العملية (مصر)" : "Timestamp"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "المشغل / المستخدم" : "HR Actor"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "نوع الإجراء (Action)" : "Action"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "الكيان المستهدف" : "Entity Target"}</th>
                    <th className="py-3 px-4 text-start">{ar ? "عنوان IP" : "IP Address"}</th>
                    <th className="py-3 px-4 text-end">{ar ? "تفاصيل العملية" : "Details"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        <span>{ar ? "جارٍ استرجاع سجلات الرقابة الأمنية..." : "Loading audit log records..."}</span>
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <span>{ar ? "لا توجد سجلات مطابقة للبحث المحدد" : "No audit records found matching criteria"}</span>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const user = log.user;

                      return (
                        <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                            #{log.id}
                          </td>

                          {/* Timestamp */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{formatDate(log.createdAt)}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour12: true })}
                            </div>
                          </td>

                          {/* Actor */}
                          <td className="py-3 px-4">
                            {user ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center text-[10px] shrink-0 border border-primary/20">
                                  {user.username.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-foreground font-mono">{user.username}</div>
                                  <div className="text-[10px] text-muted-foreground">{user.fullName}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground font-mono text-[11px]">
                                {log.details?.username || (ar ? "النظام الآلي" : "System / Anonymous")}
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3 px-4">
                            {getActionBadge(log.action)}
                          </td>

                          {/* Target */}
                          <td className="py-3 px-4 font-mono text-[11px] text-foreground">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground font-semibold">{log.entityType}</span>
                              {log.entityId && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-border">
                                  #{log.entityId}
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* IP Address */}
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                            {log.ipAddress || "127.0.0.1"}
                          </td>

                          {/* Details Button */}
                          <td className="py-3 px-4 text-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                              className="h-7 px-2 text-xs rounded-lg gap-1 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{ar ? "معاينة" : "Inspect"}</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-3 bg-muted/40 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div>
                {ar ? (
                  <span>
                    عرض السجلات من <span className="font-bold text-foreground font-mono">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> إلى{" "}
                    <span className="font-bold text-foreground font-mono">{Math.min(page * limit, pagination.total)}</span> من إجمالي{" "}
                    <span className="font-bold text-foreground font-mono">{pagination.total}</span> عملية مسجلة
                  </span>
                ) : (
                  <span>
                    Showing <span className="font-bold text-foreground font-mono">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
                    <span className="font-bold text-foreground font-mono">{Math.min(page * limit, pagination.total)}</span> of{" "}
                    <span className="font-bold text-foreground font-mono">{pagination.total}</span> records
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className={`w-4 h-4 ${ar ? "" : "rotate-180"}`} />
                </Button>
                <span className="px-2 font-mono font-bold text-foreground">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className={`w-4 h-4 ${ar ? "" : "rotate-180"}`} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── DETAILS INSPECTION MODAL ─────────────────────────────────────── */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-lg" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Terminal className="w-5 h-5 text-primary" />
              <span>{ar ? `تفاصيل السجل الرقابي #${selectedLog?.id}` : `Audit Record Details #${selectedLog?.id}`}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {ar
                ? "محتوى المعاملة التفصيلي المخزن في قاعدة بيانات الرواتب والأجور."
                : "Exact audit transaction payload stored in the database."}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground font-bold">{ar ? "نوع العملية:" : "Action:"}</span>
                  <div className="mt-0.5">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">{ar ? "المشغل:" : "Operator:"}</span>
                  <div className="font-mono font-bold text-foreground mt-0.5">
                    {selectedLog.user?.username || selectedLog.details?.username || "System"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">{ar ? "التوقيت:" : "Timestamp:"}</span>
                  <div className="font-mono text-foreground mt-0.5">{formatDate(selectedLog.createdAt)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground font-bold">{ar ? "عنوان IP:" : "IP Address:"}</span>
                  <div className="font-mono text-foreground mt-0.5">{selectedLog.ipAddress || "127.0.0.1"}</div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-foreground">{ar ? "بيانات الحمولة (JSON Payload):" : "JSON Payload:"}</span>
                <pre className="mt-1 p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-60 border border-slate-800">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              {selectedLog.userAgent && (
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  User-Agent: {selectedLog.userAgent}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
