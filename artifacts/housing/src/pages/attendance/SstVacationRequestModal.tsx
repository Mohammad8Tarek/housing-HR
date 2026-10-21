import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import {
  FileText,
  Printer,
  Trash2,
  RotateCcw,
  User,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export interface VacationRequestItem {
  id: number;
  empCode: string;
  empName: string;
  vacationCode: string;
  vacationType: string;
  fromDate: string;
  toDate: string;
  days: number;
  comment: string;
  addBy: string;
  addDate: string;
  toSigner: string;
  deptApproval: "Pending" | "Approved" | "Refused";
  deptSignerName: string;
  deptDate: string;
  deptComment: string;
  hrApproval: "Pending" | "Approved" | "Refused";
  hrSignerName: string;
  hrDate: string;
  hrComment: string;
  replacementName?: string;
}

interface SstVacationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  year?: number;
  month?: number;
  userName?: string;
  propertyName?: string;
}

const SAMPLE_REQUESTS: VacationRequestItem[] = [
  {
    id: 1,
    empCode: "200001",
    empName: "Noor Eldin Mohamed Keder",
    vacationCode: "V",
    vacationType: "Annual Vacation (اعتيادي)",
    fromDate: "2026-10-15",
    toDate: "2026-10-20",
    days: 6,
    comment: "Travel back to Cairo for family occasion",
    addBy: "admin",
    addDate: "2026-10-10",
    toSigner: "H.R. Director",
    deptApproval: "Approved",
    deptSignerName: "Hassan Mahmoud (Workshop Mgr)",
    deptDate: "2026-10-11",
    deptComment: "Approved with replacement covered",
    hrApproval: "Approved",
    hrSignerName: "Mostafa Kamel (HR Mgr)",
    hrDate: "2026-10-12",
    hrComment: "Approved - 14 balance remaining",
    replacementName: "Azmy Elsayed (200004)",
  },
  {
    id: 2,
    empCode: "200005",
    empName: "Abd Elmonaem Moustafa Mohamed",
    vacationCode: "C",
    vacationType: "Casual Leave (عارضة)",
    fromDate: "2026-10-22",
    toDate: "2026-10-23",
    days: 2,
    comment: "Emergency personal errand",
    addBy: "admin",
    addDate: "2026-10-21",
    toSigner: "General Manager",
    deptApproval: "Pending",
    deptSignerName: "Hassan Mahmoud",
    deptDate: "",
    deptComment: "",
    hrApproval: "Pending",
    hrSignerName: "",
    hrDate: "",
    hrComment: "",
    replacementName: "Khaled Abd Elwahab (200007)",
  },
  {
    id: 3,
    empCode: "60000",
    empName: "Nabeel Nyazy Mohamed Yousef",
    vacationCode: "B",
    vacationType: "Business Mission (مأمورية عمل)",
    fromDate: "2026-10-25",
    toDate: "2026-10-27",
    days: 3,
    comment: "Audit check at SunRise Crystal Bay",
    addBy: "admin",
    addDate: "2026-10-18",
    toSigner: "Area Financial Controller",
    deptApproval: "Approved",
    deptSignerName: "Finance Director",
    deptDate: "2026-10-19",
    deptComment: "Company transportation arranged",
    hrApproval: "Approved",
    hrSignerName: "HR Director",
    hrDate: "2026-10-20",
    hrComment: "Authorized business mission",
  },
];

export function SstVacationRequestModal({
  isOpen,
  onClose,
  year = 2026,
  month = 11,
  userName = "admin",
  propertyName = "SunRise Meraki Sharm Casual",
}: SstVacationRequestModalProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [requestsList, setRequestsList] = useState<VacationRequestItem[]>(SAMPLE_REQUESTS);
  const [filterCode, setFilterCode] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);

  // Form states
  const [empCode, setEmpCode] = useState("200004");
  const [empName, setEmpName] = useState("Azmy Elsayed Alamam Mwafy");
  const [vacCode, setVacCode] = useState("V");
  const [vacType, setVacType] = useState("Annual Vacation (اعتيادي)");
  const [fromDate, setFromDate] = useState("2026-11-01");
  const [toDate, setToDate] = useState("2026-11-06");
  const [days, setDays] = useState(6);
  const [comment, setComment] = useState("");
  const [toSigner, setToSigner] = useState("H.R. Manager");
  const [replacement, setReplacement] = useState("Ahmed Elsayed (200009)");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!empCode || !empName) {
      toast.error(ar ? "يرجى إدخال كود واسم الموظف" : "Please enter employee code and name");
      return;
    }
    const newReq: VacationRequestItem = {
      id: Date.now(),
      empCode,
      empName,
      vacationCode: vacCode,
      vacationType: vacType,
      fromDate,
      toDate,
      days,
      comment,
      addBy: userName,
      addDate: new Date().toISOString().split("T")[0],
      toSigner,
      deptApproval: "Pending",
      deptSignerName: "",
      deptDate: "",
      deptComment: "",
      hrApproval: "Pending",
      hrSignerName: "",
      hrDate: "",
      hrComment: "",
      replacementName: replacement,
    };
    setRequestsList([newReq, ...requestsList]);
    toast.success(ar ? "تم إرسال طلب الإجازة للاعتماد بنجاح" : "Vacation request submitted successfully");
    setComment("");
  };

  const filtered = requestsList.filter((r) => {
    if (filterCode && !r.empCode.includes(filterCode)) return false;
    if (pendingOnly && r.deptApproval !== "Pending" && r.hrApproval !== "Pending") return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs select-none font-sans">
      <div className="w-[1100px] max-w-[95vw] h-[85vh] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] shadow-2xl flex flex-col rounded-xs">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#0880f0] to-[#3a93ff] text-white px-2 py-1 flex items-center justify-between text-xs font-bold tracking-wide">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-white/20 border border-white/50 flex items-center justify-center text-[10px]">▦</span>
            <span>SST HR Departments Interface - [Add New Request]</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="w-4 h-4 bg-[#d73a49] hover:bg-red-700 text-white flex items-center justify-center rounded-xs text-[10px] font-bold border border-white/40 cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Toolbar Row */}
        <div className="bg-[#ece9d8] border-b border-[#7f9db9] p-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEmpCode("");
              setEmpName("");
              setComment("");
            }}
            title="New Request"
            className="w-7 h-7 flex items-center justify-center bg-white border border-[#7f9db9] hover:bg-[#dedbc9] text-gray-800 shadow-xs cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-700" />
          </button>

          <button
            type="button"
            onClick={handleSave}
            title="Save Request"
            className="w-7 h-7 flex items-center justify-center bg-white border border-[#7f9db9] hover:bg-[#dedbc9] text-gray-800 shadow-xs cursor-pointer"
          >
            <span className="text-emerald-700 font-black text-sm">💾</span>
          </button>

          <button
            type="button"
            onClick={() => toast.info(ar ? "تم تحديث البيانات" : "Data refreshed")}
            title="Refresh"
            className="w-7 h-7 flex items-center justify-center bg-white border border-[#7f9db9] hover:bg-[#dedbc9] text-gray-800 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-emerald-700" />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            title="Print"
            className="w-7 h-7 flex items-center justify-center bg-white border border-[#7f9db9] hover:bg-[#dedbc9] text-gray-800 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-3 bg-[#ece9d8] border-b border-[#7f9db9] grid grid-cols-12 gap-3 text-xs">
          {/* Left Form Controls */}
          <div className="col-span-9 space-y-2">
            {/* Employee Code & Name */}
            <div className="flex items-center gap-2">
              <label className="w-28 text-gray-700 font-bold shrink-0">Employee Code</label>
              <input
                type="text"
                value={empCode}
                onChange={(e) => setEmpCode(e.target.value)}
                className="w-24 bg-white border border-[#7f9db9] px-2 py-0.5 font-bold text-gray-900 focus:outline-none"
              />
              <input
                type="text"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="flex-1 bg-[#ffffd8] border border-[#7f9db9] px-2 py-0.5 font-bold text-gray-900 focus:outline-none"
              />
            </div>

            {/* Vacation Code & Type */}
            <div className="flex items-center gap-2">
              <label className="w-28 text-gray-700 font-bold shrink-0">Vacation Code</label>
              <input
                type="text"
                value={vacCode}
                onChange={(e) => setVacCode(e.target.value)}
                className="w-24 bg-white border border-[#7f9db9] px-2 py-0.5 font-bold text-gray-900 focus:outline-none"
              />
              <select
                value={vacType}
                onChange={(e) => setVacType(e.target.value)}
                className="flex-1 bg-[#ffffd8] border border-[#7f9db9] px-2 py-0.5 font-bold text-gray-900 focus:outline-none"
              >
                <option value="Annual Vacation (اعتيادي)">Annual Vacation (اعتيادي)</option>
                <option value="Casual Leave (عارضة)">Casual Leave (عارضة)</option>
                <option value="Sick Leave (مرضي)">Sick Leave (مرضي)</option>
                <option value="Business Mission (مأمورية عمل)">Business Mission (مأمورية عمل)</option>
                <option value="Unpaid Leave (بدون أجر)">Unpaid Leave (بدون أجر)</option>
                <option value="Rest Day Comp (بدل راحة)">Rest Day Comp (بدل راحة)</option>
              </select>
            </div>

            {/* Dates: From / To / Days */}
            <div className="flex items-center gap-2">
              <label className="w-28 text-gray-700 font-bold shrink-0">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-36 bg-[#e0ffff] border border-[#7f9db9] px-2 py-0.5 font-bold text-gray-900 focus:outline-none"
              />
              <label className="text-gray-700 font-bold mx-2">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-36 bg-[#e0ffff] border border-[#7f9db9] px-2 py-0.5 font-bold text-gray-900 focus:outline-none"
              />
              <label className="text-gray-700 font-bold mx-2">Days</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-16 bg-white border border-[#7f9db9] px-2 py-0.5 font-bold text-center text-gray-900 focus:outline-none"
              />
            </div>

            {/* Comment */}
            <div className="flex items-center gap-2">
              <label className="w-28 text-gray-700 font-bold shrink-0">Comment</label>
              <input
                type="text"
                value={comment}
                placeholder="Reason / Notes..."
                onChange={(e) => setComment(e.target.value)}
                className="flex-1 bg-white border border-[#7f9db9] px-2 py-0.5 font-medium text-gray-900 focus:outline-none"
              />
            </div>

            {/* To Signer */}
            <div className="flex items-center gap-2">
              <label className="w-28 text-gray-700 font-bold shrink-0">To Signer</label>
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value=">>"
                  readOnly
                  className="w-8 text-center bg-[#f0ede4] border border-[#7f9db9] py-0.5 text-blue-800 font-bold"
                />
                <input
                  type="text"
                  value={toSigner}
                  onChange={(e) => setToSigner(e.target.value)}
                  className="flex-1 bg-[#ffffd8] border border-[#7f9db9] px-2 py-0.5 font-bold text-gray-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Replacement */}
            <div className="flex items-center gap-2">
              <label className="w-28 text-gray-700 font-bold shrink-0">Replacement</label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                className="flex-1 bg-[#ffffd8] border border-[#7f9db9] px-2 py-0.5 font-bold text-gray-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Photo Preview Box */}
          <div className="col-span-3 flex flex-col items-center justify-center p-2 border border-[#7f9db9] bg-white rounded-xs">
            <div className="w-28 h-32 bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
              <User className="w-12 h-12 text-gray-300" />
              <span className="text-[10px] text-gray-400 mt-1">Employee Photo</span>
            </div>
            <span className="text-[10px] font-bold text-blue-900 mt-2">{empCode}</span>
          </div>
        </div>

        {/* Search Tools Row */}
        <div className="bg-[#ece9d8] border-b border-[#7f9db9] px-3 py-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-900">Search Tools</span>
            <div className="flex items-center gap-1">
              <label className="font-bold text-gray-700">Code</label>
              <input
                type="text"
                value={filterCode}
                onChange={(e) => setFilterCode(e.target.value)}
                placeholder="Search code..."
                className="w-24 bg-white border border-[#7f9db9] px-2 py-0.5 font-mono text-xs focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-1 font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={pendingOnly}
                onChange={(e) => setPendingOnly(e.target.checked)}
                className="accent-blue-600"
              />
              Pending Only
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              setFilterCode("");
              setPendingOnly(false);
            }}
            className="px-3 py-0.5 bg-[#ece9d8] hover:bg-[#dedbc9] border border-[#7f9db9] font-bold text-gray-800 text-xs shadow-xs cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {/* Requests Table */}
        <div className="flex-1 overflow-auto bg-white border-b border-[#7f9db9]">
          <table className="w-full border-collapse text-[10px] min-w-max">
            <thead className="bg-[#ece9d8] text-gray-800 font-bold sticky top-0 border-b border-[#7f9db9]">
              <tr>
                <th className="p-1 border-r border-[#7f9db9] text-center w-8">S.</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-16">Emplo Code</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-36">Employee Name</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-28">Vacation Type</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">From</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">To</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-12">Days</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-40">Comment</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-20">Add By</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">Add Date</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-28">To Signer</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-24">Dept Approval</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-28">Signer Name</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-24">H.R. Approval</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-28">Signer Name</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.id} className={`border-b border-[#d0cfc5] ${idx % 2 === 0 ? "bg-white" : "bg-[#f9f8f5]"} hover:bg-yellow-50`}>
                  <td className="p-1 text-center font-bold border-r border-[#d0cfc5]">{idx + 1}</td>
                  <td className="p-1 text-center font-bold text-blue-900 border-r border-[#d0cfc5]">{item.empCode}</td>
                  <td className="p-1 font-medium border-r border-[#d0cfc5] truncate max-w-[150px]">{item.empName}</td>
                  <td className="p-1 border-r border-[#d0cfc5] font-semibold">{item.vacationType}</td>
                  <td className="p-1 text-center border-r border-[#d0cfc5] font-mono">{item.fromDate}</td>
                  <td className="p-1 text-center border-r border-[#d0cfc5] font-mono">{item.toDate}</td>
                  <td className="p-1 text-center font-bold border-r border-[#d0cfc5]">{item.days}</td>
                  <td className="p-1 border-r border-[#d0cfc5] truncate max-w-[160px] text-gray-600">{item.comment}</td>
                  <td className="p-1 border-r border-[#d0cfc5]">{item.addBy}</td>
                  <td className="p-1 text-center border-r border-[#d0cfc5] font-mono">{item.addDate}</td>
                  <td className="p-1 border-r border-[#d0cfc5] text-blue-800 font-semibold">{item.toSigner}</td>
                  <td className="p-1 text-center border-r border-[#d0cfc5]">
                    <span
                      className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${
                        item.deptApproval === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.deptApproval === "Refused"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.deptApproval}
                    </span>
                  </td>
                  <td className="p-1 border-r border-[#d0cfc5] text-gray-700 truncate max-w-[120px]">{item.deptSignerName || "-"}</td>
                  <td className="p-1 text-center border-r border-[#d0cfc5]">
                    <span
                      className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${
                        item.hrApproval === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.hrApproval === "Refused"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.hrApproval}
                    </span>
                  </td>
                  <td className="p-1 border-r border-[#d0cfc5] text-gray-700 truncate max-w-[120px]">{item.hrSignerName || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Win32 Status Bar */}
        <div className="bg-[#ece9d8] border-t border-white px-2 py-0.5 flex items-center justify-between text-[10px] text-gray-700 font-medium">
          <div>
            Year = <span className="font-bold text-gray-900">{year}</span> Month ={" "}
            <span className="font-bold text-gray-900">{month}</span> User Name :{" "}
            <span className="font-bold text-emerald-800">{userName}</span>
          </div>
          <div className="font-bold text-blue-900">{propertyName}</div>
        </div>
      </div>
    </div>
  );
}
