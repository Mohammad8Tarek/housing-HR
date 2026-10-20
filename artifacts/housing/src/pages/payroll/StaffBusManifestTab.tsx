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
  Bus,
  Plus,
  Users,
  Search,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-utils";
import { PermissionGate } from "@/components/ui/permission-gate";

interface StaffBusManifestTabProps {
  propertyId: number;
}

export function StaffBusManifestTab({ propertyId }: StaffBusManifestTabProps) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const queryClient = useQueryClient();

  const [selectedManifestId, setSelectedManifestId] = useState<number | null>(null);
  const [isNewManifestOpen, setIsNewManifestOpen] = useState(false);
  const [isAddPassengerOpen, setIsAddPassengerOpen] = useState(false);

  // New Manifest Form
  const [manifestForm, setManifestForm] = useState({
    tripDirection: "to_cairo",
    tripNameAr: "رحلة أتوبيس القاهرة الدورية",
    travelDate: new Date().toISOString().split("T")[0],
    departureTime: "07:00",
    busNumber: "ط أ س 4921",
    driverName: "عماد عبد المنعم",
    driverPhone: "01098765432",
    totalSeats: 50,
    costCenterCode: "CC-TRANS-01",
  });

  // Passenger Form
  const [passengerForm, setPassengerForm] = useState({
    employeeId: "",
    seatNumber: 1,
    pickupLocation: "بوابة سكن العاملين الرئيسية",
    dropoffLocation: "ميدان رمسيس - القاهرة",
    luggageCount: 2,
    notes: "",
  });

  // 1. Fetch Manifests
  const { data: manifestsData, isLoading: isLoadingManifests } = useQuery({
    queryKey: ["staff-bus-manifests", propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/hrms/services/transport/manifests?propertyId=${propertyId}`);
      if (!res.ok) throw new Error("Failed to load manifests");
      return res.json();
    },
  });

  const manifestsList: any[] = manifestsData?.manifests || [];

  // 2. Fetch Passengers for selected manifest
  const { data: passengersData, isLoading: isLoadingPassengers } = useQuery({
    queryKey: ["staff-bus-passengers", selectedManifestId],
    queryFn: async () => {
      if (!selectedManifestId) return { passengers: [] };
      const res = await fetch(`/api/hrms/services/transport/manifests/${selectedManifestId}/passengers`);
      if (!res.ok) throw new Error("Failed to load passengers");
      return res.json();
    },
    enabled: !!selectedManifestId,
  });

  const passengersList: any[] = passengersData?.passengers || [];

  // Create Manifest Mutation
  const createManifestMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/hrms/services/transport/manifests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create manifest");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(ar ? "تم إنشاء مانيوال رحلة الأتوبيس بنجاح!" : "Staff bus manifest created!");
      setIsNewManifestOpen(false);
      queryClient.invalidateQueries({ queryKey: ["staff-bus-manifests"] });
      if (data?.manifest?.id) setSelectedManifestId(data.manifest.id);
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Auto-populate Expected Travelers Mutation (Legacy SST Button)
  const autoPopulateMutation = useMutation({
    mutationFn: async (manifestId: number) => {
      const res = await fetch(`/api/hrms/services/transport/manifests/${manifestId}/auto-populate-expected`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to auto-populate");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(ar ? `تم تسجيل المسافرين المتوقعين تلقائياً: تم تسكين ${data.addedCount} مسافر من واقع الإجازات المعتمدة!` : `Auto-populated ${data.addedCount} travelers from approved leaves!`);
      queryClient.invalidateQueries({ queryKey: ["staff-bus-passengers", selectedManifestId] });
      queryClient.invalidateQueries({ queryKey: ["staff-bus-manifests"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const selectedManifest = manifestsList.find((m) => m.id === selectedManifestId) || manifestsList[0];

  React.useEffect(() => {
    if (!selectedManifestId && manifestsList.length > 0) {
      setSelectedManifestId(manifestsList[0].id);
    }
  }, [manifestsList, selectedManifestId]);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <h3 className="text-base font-bold text-slate-800">
              {ar ? "أتوبيس العاملين ورحلات القاهرة (Staff Bus Manifest)" : "Staff Bus Travel Manifest"}
            </h3>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              SST 26.0 Legacy Parity
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ar
              ? "إدارة رحلات سفر الموظفين (إلى / من القاهرة) مع مطابقة فورية لأرصدة وإجازات العاملين"
              : "Manage employee Cairo bus schedules with auto-population from approved leave departures"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate module="payroll" action="create">
            <Button
              onClick={() => setIsNewManifestOpen(true)}
              className="gap-1.5 bg-[#0f2942] hover:bg-[#1a3f63] text-white rounded-xl text-xs font-bold h-10 px-4 shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#c89332]" />
              <span>{ar ? "إنشاء كشف رحلة جديدة" : "New Bus Manifest"}</span>
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Grid: Left Trips List, Right Passenger Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Manifests Selection List */}
        <Card className="rounded-2xl border-slate-200 shadow-xs lg:col-span-1">
          <CardHeader className="p-3.5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>{ar ? "الرحلات المسجلة" : "Scheduled Trips"}</span>
              <Badge className="bg-slate-200 text-slate-700 font-mono text-[10px]">
                {manifestsList.length} {ar ? "رحلة" : "trips"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
            {isLoadingManifests ? (
              <div className="p-4 text-center text-xs text-slate-400">{ar ? "جاري التحميل..." : "Loading..."}</div>
            ) : manifestsList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {ar ? "لا توجد رحلات مسجلة. اضغط 'إنشاء كشف رحلة جديدة'" : "No bus manifests found."}
              </div>
            ) : (
              manifestsList.map((m: any) => {
                const isSelected = m.id === selectedManifest?.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedManifestId(m.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-300 shadow-xs"
                        : "bg-white border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-800">{m.tripNameAr}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          m.tripDirection === "to_cairo"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {m.tripDirection === "to_cairo" ? (ar ? "إلى القاهرة" : "To Cairo") : (ar ? "من القاهرة" : "From Cairo")}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-[#c89332]" />
                        {m.travelDate}
                      </span>
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                        <Users className="w-3 h-3 text-blue-600" />
                        {m.bookedSeats || 0} / {m.totalSeats} {ar ? "مقعد" : "seats"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Selected Manifest Detail & Passenger Manifest */}
        <Card className="rounded-2xl border-slate-200 shadow-xs lg:col-span-2">
          {selectedManifest ? (
            <div>
              <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-black text-slate-800">
                      {selectedManifest.tripNameAr}
                    </CardTitle>
                    <Badge className="bg-[#0f2942] text-white text-[10px]">
                      {selectedManifest.busNumber}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#c89332]" />
                      {selectedManifest.travelDate} - {selectedManifest.departureTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedManifest.driverName} ({selectedManifest.driverPhone})
                    </span>
                  </CardDescription>
                </div>

                {/* THE SST LEGACY ACTION: Auto-populate expected travelers from approved leaves */}
                <div className="flex items-center gap-2">
                  <PermissionGate module="payroll" action="create">
                    <Button
                      onClick={() => autoPopulateMutation.mutate(selectedManifest.id)}
                      disabled={autoPopulateMutation.isPending}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-3 shadow-xs"
                      title={ar ? "استيراد الموظفين الحاصلين على إجازة مطابقة لتاريخ السفر" : "Auto-populate from approved leave applications"}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
                      <span>
                        {autoPopulateMutation.isPending
                          ? (ar ? "جاري المطابقة..." : "Matching...")
                          : (ar ? "تسجيل المسافرون المتوقعون" : "Auto-Populate Expected")}
                      </span>
                    </Button>
                  </PermissionGate>
                </div>
              </CardHeader>

              {/* Passengers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-start">{ar ? "المقعد" : "Seat #"}</th>
                      <th className="py-2.5 px-3 text-start">{ar ? "كود الموظف" : "Emp Code"}</th>
                      <th className="py-2.5 px-3 text-start">{ar ? "اسم الموظف" : "Passenger Name"}</th>
                      <th className="py-2.5 px-3 text-start">{ar ? "القسم" : "Department"}</th>
                      <th className="py-2.5 px-3 text-start">{ar ? "محطة الصعود" : "Pickup Point"}</th>
                      <th className="py-2.5 px-3 text-start">{ar ? "الوصول" : "Destination"}</th>
                      <th className="py-2.5 px-3 text-center">{ar ? "الحقائب" : "Bags"}</th>
                      <th className="py-2.5 px-3 text-center">{ar ? "الحالة" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingPassengers ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          {ar ? "جاري تحميل قائمة الركاب..." : "Loading passengers..."}
                        </td>
                      </tr>
                    ) : passengersList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          <div className="space-y-2">
                            <p>{ar ? "لا يوجد ركاب مسجلون في هذه الرحلة حتى الآن" : "No passengers recorded in this manifest."}</p>
                            <p className="text-[11px] text-emerald-600 font-semibold">
                              {ar ? "اضغط على زر 'تسجيل المسافرون المتوقعون' لجلب أصحاب الإجازات المعتمدة تلقائياً!" : "Click 'Auto-Populate Expected' to sync approved leaves!"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      passengersList.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">#{p.seatNumber}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{p.employeeCode}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{p.employeeName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.department}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{p.pickupLocation || "—"}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{p.dropoffLocation || "—"}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{p.luggageCount || 1}</td>
                          <td className="py-2.5 px-3 text-center">
                            <Badge className="bg-emerald-100 text-emerald-800 text-[9px] border-emerald-200">
                              {ar ? "مؤكد" : "Confirmed"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              {ar ? "يرجى اختيار رحلة لعرض تفاصيلها" : "Select a trip to view manifest"}
            </div>
          )}
        </Card>
      </div>

      {/* New Manifest Modal */}
      <Dialog open={isNewManifestOpen} onOpenChange={setIsNewManifestOpen}>
        <DialogContent className="max-w-lg rounded-2xl" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">
              {ar ? "إنشاء كشف رحلة أتوبيس العاملين (Bus Manifest)" : "New Staff Bus Manifest"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {ar ? "جدولة رحلة سفر دورية بين الفندق والقاهرة" : "Schedule regular hotel shuttle between resort and Cairo"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createManifestMutation.mutate({
                ...manifestForm,
                propertyId,
              });
            }}
            className="space-y-3 pt-2"
          >
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {ar ? "عنوان الرحلة" : "Trip Title"}
              </label>
              <Input
                value={manifestForm.tripNameAr}
                onChange={(e) => setManifestForm({ ...manifestForm, tripNameAr: e.target.value })}
                className="text-xs rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "اتجاه الرحلة" : "Direction"}
                </label>
                <select
                  value={manifestForm.tripDirection}
                  onChange={(e) => setManifestForm({ ...manifestForm, tripDirection: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="to_cairo">{ar ? "إلى القاهرة (To Cairo)" : "To Cairo"}</option>
                  <option value="from_cairo">{ar ? "من القاهرة إلى الفندق (From Cairo)" : "From Cairo"}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "تاريخ السفر" : "Travel Date"}
                </label>
                <Input
                  type="date"
                  value={manifestForm.travelDate}
                  onChange={(e) => setManifestForm({ ...manifestForm, travelDate: e.target.value })}
                  className="text-xs rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "وقت التحرك" : "Departure Time"}
                </label>
                <Input
                  type="time"
                  value={manifestForm.departureTime}
                  onChange={(e) => setManifestForm({ ...manifestForm, departureTime: e.target.value })}
                  className="text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "رقم الأتوبيس / اللوحة" : "Bus Plate Number"}
                </label>
                <Input
                  value={manifestForm.busNumber}
                  onChange={(e) => setManifestForm({ ...manifestForm, busNumber: e.target.value })}
                  className="text-xs rounded-xl font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "اسم السائق" : "Driver Name"}
                </label>
                <Input
                  value={manifestForm.driverName}
                  onChange={(e) => setManifestForm({ ...manifestForm, driverName: e.target.value })}
                  className="text-xs rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "هاتف السائق" : "Driver Phone"}
                </label>
                <Input
                  value={manifestForm.driverPhone}
                  onChange={(e) => setManifestForm({ ...manifestForm, driverPhone: e.target.value })}
                  className="text-xs rounded-xl font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "سعة الأتوبيس (عدد المقاعد)" : "Total Seats"}
                </label>
                <Input
                  type="number"
                  value={manifestForm.totalSeats}
                  onChange={(e) => setManifestForm({ ...manifestForm, totalSeats: Number(e.target.value) })}
                  className="text-xs rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {ar ? "مركز التكلفة المحاسبي" : "Cost Center"}
                </label>
                <Input
                  value={manifestForm.costCenterCode}
                  onChange={(e) => setManifestForm({ ...manifestForm, costCenterCode: e.target.value })}
                  className="text-xs rounded-xl font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewManifestOpen(false)}
                className="text-xs rounded-xl"
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={createManifestMutation.isPending}
                className="bg-[#0f2942] hover:bg-[#1a3f63] text-white text-xs font-bold rounded-xl"
              >
                {createManifestMutation.isPending ? (ar ? "جاري الحفظ..." : "Creating...") : (ar ? "إنشاء كشف الرحلة" : "Create Manifest")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
