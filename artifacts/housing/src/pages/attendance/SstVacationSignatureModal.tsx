import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { Printer, Save, CheckCircle, XCircle } from "lucide-react";
import { VacationRequestItem } from "./SstVacationRequestModal";

interface SstVacationSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  year?: number;
  month?: number;
  userName?: string;
  propertyName?: string;
}

const INITIAL_SIGNATURE_ITEMS: VacationRequestItem[] = [
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
    empCode: "200004",
    empName: "Azmy Elsayed Alamam Mwafy",
    vacationCode: "V",
    vacationType: "Annual Vacation (اعتيادي)",
    fromDate: "2026-11-01",
    toDate: "2026-11-06",
    days: 6,
    comment: "Mid-season annual vacation",
    addBy: "admin",
    addDate: "2026-10-20",
    toSigner: "H.R. Director",
    deptApproval: "Pending",
    deptSignerName: "",
    deptDate: "",
    deptComment: "",
    hrApproval: "Pending",
    hrSignerName: "",
    hrDate: "",
    hrComment: "",
    replacementName: "Ahmed Elsayed (200009)",
  },
  {
    id: 3,
    empCode: "200005",
    empName: "Abd Elmonaem Moustafa Mohamed Anany",
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
    deptSignerName: "",
    deptDate: "",
    deptComment: "",
    hrApproval: "Pending",
    hrSignerName: "",
    hrDate: "",
    hrComment: "",
    replacementName: "Khaled Abd Elwahab (200007)",
  },
];

export function SstVacationSignatureModal({
  isOpen,
  onClose,
  year = 2026,
  month = 11,
  userName = "admin",
  propertyName = "SunRise Meraki Sharm Casual",
}: SstVacationSignatureModalProps) {
  const { language } = useLanguage();
  const ar = language === "ar";

  const [items, setItems] = useState<VacationRequestItem[]>(INITIAL_SIGNATURE_ITEMS);
  const [selectedId, setSelectedId] = useState<number | null>(items[1]?.id || null);

  // Search Filters
  const [codeQuery, setCodeQuery] = useState("");
  const [deptPending, setDeptPending] = useState(true);
  const [deptApproved, setDeptApproved] = useState(false);
  const [deptRefused, setDeptRefused] = useState(false);

  const [hrPending, setHrPending] = useState(true);
  const [hrApproved, setHrApproved] = useState(false);
  const [hrRefused, setHrRefused] = useState(false);

  if (!isOpen) return null;

  const handleApprove = (id: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            deptApproval: "Approved",
            deptSignerName: userName,
            deptDate: new Date().toISOString().split("T")[0],
            hrApproval: "Approved",
            hrSignerName: userName,
            hrDate: new Date().toISOString().split("T")[0],
          };
        }
        return it;
      })
    );
    toast.success(ar ? "تم اعتماد توقيع الإجازة بنجاح" : "Vacation signature approved successfully");
  };

  const handleRefuse = (id: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          return {
            ...it,
            deptApproval: "Refused",
            deptSignerName: userName,
            deptDate: new Date().toISOString().split("T")[0],
            hrApproval: "Refused",
            hrSignerName: userName,
            hrDate: new Date().toISOString().split("T")[0],
          };
        }
        return it;
      })
    );
    toast.error(ar ? "تم رفض طلب الإجازة" : "Vacation request refused");
  };

  const filteredItems = items.filter((it) => {
    if (codeQuery && !it.empCode.includes(codeQuery)) return false;
    // Dept status check
    const matchesDept =
      (deptPending && it.deptApproval === "Pending") ||
      (deptApproved && it.deptApproval === "Approved") ||
      (deptRefused && it.deptApproval === "Refused");
    if (!matchesDept && (deptPending || deptApproved || deptRefused)) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs select-none font-sans">
      <div className="w-[1200px] max-w-[96vw] h-[86vh] bg-[#ece9d8] border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] shadow-2xl flex flex-col rounded-xs">
        {/* Win32 Title Bar */}
        <div className="bg-gradient-to-r from-[#0055ea] via-[#0880f0] to-[#3a93ff] text-white px-2 py-1 flex items-center justify-between text-xs font-bold tracking-wide">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 bg-white/20 border border-white/50 flex items-center justify-center text-[10px]">▦</span>
            <span>SST HR Departments Interface - [Vacations Request Signature]</span>
          </div>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#d73a49] hover:bg-red-700 text-white flex items-center justify-center rounded-xs text-[10px] font-bold border border-white/40 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Toolbar Row */}
        <div className="bg-[#ece9d8] border-b border-[#7f9db9] p-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toast.success(ar ? "تم حفظ التوقيعات والاعتمادات" : "Signatures saved")}
              title="Save (Floppy Disk)"
              className="w-8 h-8 flex items-center justify-center bg-white border border-[#7f9db9] hover:bg-[#dedbc9] shadow-xs cursor-pointer"
            >
              <Save className="w-5 h-5 text-blue-800" />
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              title="Print"
              className="w-8 h-8 flex items-center justify-center bg-white border border-[#7f9db9] hover:bg-[#dedbc9] shadow-xs cursor-pointer"
            >
              <Printer className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <h2 className="text-xl font-black text-gray-800 tracking-wide">
            Vacations Request Signature
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => selectedId && handleApprove(selectedId)}
              className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-800 rounded-xs shadow-xs cursor-pointer"
            >
              Approved
            </button>
            <button
              type="button"
              onClick={() => selectedId && handleRefuse(selectedId)}
              className="px-4 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs border border-rose-800 rounded-xs shadow-xs cursor-pointer"
            >
              Refused
            </button>
          </div>
        </div>

        {/* Search Tools Row */}
        <div className="bg-[#ece9d8] border-b border-[#7f9db9] p-2 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-blue-900">Search Tools</span>

            {/* Code */}
            <div className="flex items-center gap-1">
              <label className="font-bold text-gray-700">Code</label>
              <input
                type="text"
                value={codeQuery}
                onChange={(e) => setCodeQuery(e.target.value)}
                className="w-20 bg-white border border-[#7f9db9] px-2 py-0.5 text-xs font-mono focus:outline-none"
              />
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-1">
              <label className="font-bold text-gray-700">Sort By</label>
              <select className="bg-white border border-[#7f9db9] px-2 py-0.5 text-xs focus:outline-none">
                <option value="code">Employee Code</option>
                <option value="name">Employee Name</option>
                <option value="date">Date</option>
              </select>
            </div>

            {/* Department Checkboxes */}
            <div className="flex items-center gap-2 border-l border-r border-[#a09e95] px-2">
              <label className="flex items-center gap-1 font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deptPending}
                  onChange={(e) => setDeptPending(e.target.checked)}
                  className="accent-blue-600"
                />
                Pending
              </label>
              <label className="flex items-center gap-1 font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deptApproved}
                  onChange={(e) => setDeptApproved(e.target.checked)}
                  className="accent-emerald-600"
                />
                Approved
              </label>
              <label className="flex items-center gap-1 font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deptRefused}
                  onChange={(e) => setDeptRefused(e.target.checked)}
                  className="accent-rose-600"
                />
                Refused
              </label>
            </div>

            {/* H.R Checkboxes */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800">H.R</span>
              <label className="flex items-center gap-1 font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hrPending}
                  onChange={(e) => setHrPending(e.target.checked)}
                  className="accent-blue-600"
                />
                Pending
              </label>
              <label className="flex items-center gap-1 font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hrApproved}
                  onChange={(e) => setHrApproved(e.target.checked)}
                  className="accent-emerald-600"
                />
                Approved
              </label>
              <label className="flex items-center gap-1 font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hrRefused}
                  onChange={(e) => setHrRefused(e.target.checked)}
                  className="accent-rose-600"
                />
                Refused
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCodeQuery("");
              setDeptPending(true);
              setDeptApproved(false);
              setDeptRefused(false);
            }}
            className="px-3 py-1 bg-[#ece9d8] hover:bg-[#dedbc9] text-xs font-bold text-gray-800 border-2 border-t-white border-l-white border-b-[#716f64] border-r-[#716f64] shadow-xs cursor-pointer"
          >
            Refresh
          </button>
        </div>

        {/* Table Grid */}
        <div className="flex-1 overflow-auto bg-white border-b border-[#7f9db9]">
          <table className="w-full border-collapse text-[10px] min-w-max">
            <thead className="bg-[#ece9d8] text-gray-800 font-bold sticky top-0 border-b border-[#7f9db9]">
              <tr>
                <th className="p-1 border-r border-[#7f9db9] text-center w-8">S.</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-16">Emplo Code</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-36">Employee Name</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-28">Vacation Type</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">From</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">From Hijri</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">To</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">To Hijri</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-12">Days</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-36">Comment</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-20">Add By</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">Add Date</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-24">To Signer</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-24">Dept Approval</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-28">Signer Name</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">Date</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-32">Dept Comment</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-24">H.R. Approval</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-28">Signer Name</th>
                <th className="p-1 border-r border-[#7f9db9] text-center w-20">Date</th>
                <th className="p-1 border-r border-[#7f9db9] text-left w-32">H.R. Comment</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((it, idx) => {
                const isSelected = selectedId === it.id;
                return (
                  <tr
                    key={it.id}
                    onClick={() => setSelectedId(it.id)}
                    className={`border-b border-[#d0cfc5] cursor-pointer ${
                      isSelected ? "bg-amber-100 font-semibold" : idx % 2 === 0 ? "bg-white" : "bg-[#f9f8f5]"
                    } hover:bg-yellow-50`}
                  >
                    <td className="p-1 text-center font-bold border-r border-[#d0cfc5]">{idx + 1}</td>
                    <td className="p-1 text-center font-bold text-blue-900 border-r border-[#d0cfc5]">{it.empCode}</td>
                    <td className="p-1 font-medium border-r border-[#d0cfc5] truncate max-w-[150px]">{it.empName}</td>
                    <td className="p-1 border-r border-[#d0cfc5] font-semibold">{it.vacationType}</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5] font-mono">{it.fromDate}</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5] font-mono text-gray-500">-</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5] font-mono">{it.toDate}</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5] font-mono text-gray-500">-</td>
                    <td className="p-1 text-center font-bold border-r border-[#d0cfc5]">{it.days}</td>
                    <td className="p-1 border-r border-[#d0cfc5] truncate max-w-[150px] text-gray-600">{it.comment}</td>
                    <td className="p-1 border-r border-[#d0cfc5]">{it.addBy}</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5] font-mono">{it.addDate}</td>
                    <td className="p-1 border-r border-[#d0cfc5] text-blue-800">{it.toSigner}</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5]">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${
                          it.deptApproval === "Approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : it.deptApproval === "Refused"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {it.deptApproval}
                      </span>
                    </td>
                    <td className="p-1 border-r border-[#d0cfc5] text-gray-700 truncate max-w-[120px]">{it.deptSignerName || "-"}</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5] font-mono">{it.deptDate || "-"}</td>
                    <td className="p-1 border-r border-[#d0cfc5] truncate max-w-[120px]">{it.deptComment || "-"}</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5]">
                      <span
                        className={`px-1.5 py-0.5 rounded-xs font-bold text-[9px] ${
                          it.hrApproval === "Approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : it.hrApproval === "Refused"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {it.hrApproval}
                      </span>
                    </td>
                    <td className="p-1 border-r border-[#d0cfc5] text-gray-700 truncate max-w-[120px]">{it.hrSignerName || "-"}</td>
                    <td className="p-1 text-center border-r border-[#d0cfc5] font-mono">{it.hrDate || "-"}</td>
                    <td className="p-1 border-r border-[#d0cfc5] truncate max-w-[120px]">{it.hrComment || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Status Bar */}
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
