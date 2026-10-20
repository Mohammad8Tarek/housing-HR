import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  leaveTypes, 
  leaveApplications, 
  penalties,
  loansAndAdvances, 
  loanInstallments,
  employees,
} from "@workspace/db-payroll";
import { eq, desc, and, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();
const replacementEmp = alias(employees, "replacement_employee");

// ─── 1. Leaves Management ───────────────────────────────────────────
router.get(["/payroll-ops/leave-types", "/payroll-operations/leave-types"], requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(leaveTypes).where(eq(leaveTypes.isActive, true));
    res.json({ success: true, leaveTypes: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get(["/payroll-ops/leaves", "/payroll-operations/leaves"], requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = payrollDb
      .select({
        application: leaveApplications,
        employee: employees,
        leaveType: leaveTypes,
        replacement: {
          id: replacementEmp.id,
          fullName: replacementEmp.fullName,
          fullNameAr: replacementEmp.fullNameAr,
          employeeCode: replacementEmp.employeeCode,
        },
      })
      .from(leaveApplications)
      .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
      .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
      .leftJoin(replacementEmp, eq(leaveApplications.replacementEmployeeId, replacementEmp.id))
      .where(propertyId ? eq(leaveApplications.propertyId, propertyId) : undefined)
      .orderBy(desc(leaveApplications.id))
      .limit(100);

    const leaves = await query;
    res.json({ success: true, leaves });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(["/payroll-ops/leaves", "/payroll-operations/leaves"], requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, employeeId, leaveTypeId, startDate, endDate, totalDays, reason, replacementEmployeeId } = req.body;

    if (!propertyId || !employeeId || !leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "الموظف ونوع الإجازة وتواريخ البداية والنهاية مطلوبة" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return res.status(400).json({ success: false, error: "تاريخ بداية الإجازة يجب أن يكون مساوياً أو سابقاً لتاريخ النهاية" });
    }

    // Check for conflicting overlapping leave applications for this employee
    const [existingOverlap] = await payrollDb
      .select()
      .from(leaveApplications)
      .where(and(
        eq(leaveApplications.employeeId, Number(employeeId)),
        ne(leaveApplications.status, "rejected"),
        sql`${leaveApplications.startDate} <= ${endDate} AND ${leaveApplications.endDate} >= ${startDate}`
      ))
      .limit(1);

    if (existingOverlap) {
      return res.status(400).json({
        success: false,
        error: "يوجد طلب إجازة مسجل مسبقاً لنفس الموظف يتعارض مع هذه الفترة الزمنية المحددة",
      });
    }

    const [leave] = await payrollDb.insert(leaveApplications).values({
      propertyId: Number(propertyId),
      employeeId: Number(employeeId),
      leaveTypeId: Number(leaveTypeId),
      startDate,
      endDate,
      totalDays: String(totalDays || 1),
      reason,
      replacementEmployeeId: replacementEmployeeId ? Number(replacementEmployeeId) : null,
      deptApprovalStatus: "pending",
      hrApprovalStatus: "pending",
      status: "pending",
    }).returning();
    res.status(201).json({ success: true, leave });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.patch(["/payroll-ops/leaves/:id/approve", "/payroll-operations/leaves/:id/approve", "/payroll-ops/leaves/:id/status", "/payroll-operations/leaves/:id/status"], requirePermission("payroll", "edit"), async (req: Request, res: Response) => {
  try {
    const leaveId = Number(req.params.id);
    const { level, status, approverName, comment } = req.body;
    const updateData: any = {};
    const now = new Date();
    const actor = approverName || (req as any).user?.fullName || (req as any).user?.username || "Admin";

    if (level === "dept") {
      updateData.deptApprovalStatus = status; // 'approved' or 'rejected'
      updateData.deptApprovedBy = actor;
      updateData.deptApprovedAt = now;
      if (comment) updateData.deptComment = comment;
      if (status === "rejected") {
        updateData.status = "rejected";
      }
    } else if (level === "hr") {
      updateData.hrApprovalStatus = status; // 'approved' or 'rejected'
      updateData.hrApprovedBy = actor;
      updateData.hrApprovedAt = now;
      if (comment) updateData.hrComment = comment;
      updateData.status = status;
      updateData.approvedBy = actor;
      updateData.approvedAt = now;
    } else {
      updateData.status = status;
      updateData.approvedBy = actor;
      updateData.approvedAt = now;
      if (status === "approved") {
        updateData.deptApprovalStatus = "approved";
        updateData.hrApprovalStatus = "approved";
      } else if (status === "rejected") {
        updateData.deptApprovalStatus = "rejected";
        updateData.hrApprovalStatus = "rejected";
      }
    }

    const [updated] = await payrollDb
      .update(leaveApplications)
      .set(updateData)
      .where(eq(leaveApplications.id, leaveId))
      .returning();

    res.json({ success: true, leave: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get(["/payroll-ops/leave-balances", "/payroll-operations/leave-balances"], requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const year = Number(req.query.year) || new Date().getFullYear();

    const staff = await payrollDb
      .select()
      .from(employees)
      .where(and(
        propertyId ? eq(employees.propertyId, propertyId) : undefined,
        eq(employees.status, "active")
      ));

    const leaves = await payrollDb
      .select()
      .from(leaveApplications)
      .where(and(
        propertyId ? eq(leaveApplications.propertyId, propertyId) : undefined,
        eq(leaveApplications.status, "approved"),
        sql`extract(year from ${leaveApplications.startDate}) = ${year}`
      ));

    const balances = staff.map(emp => {
      const empLeaves = leaves.filter(l => l.employeeId === emp.id);
      const usedDays = empLeaves.reduce((acc, curr) => acc + (Number(curr.totalDays) || 0), 0);

      // Egyptian Labor Law 12/2003: 21 days annual leave, 30 days if age >= 50 or service >= 10 years
      let totalEntitlement = 21;
      if (emp.joiningDate) {
        const joinYear = new Date(emp.joiningDate).getFullYear();
        if (year - joinYear >= 10) totalEntitlement = 30;
      }
      if (emp.dateOfBirth) {
        const birthYear = new Date(emp.dateOfBirth).getFullYear();
        if (year - birthYear >= 50) totalEntitlement = 30;
      }

      const remainingDays = Math.max(0, totalEntitlement - usedDays);

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        fullNameAr: emp.fullNameAr,
        totalEntitlement,
        usedDays,
        remainingDays,
      };
    });

    res.json({ success: true, year, balances });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Penalties & Disciplinary Actions (SST Legal & Penalties) ─────
router.get(["/payroll-ops/penalties", "/payroll-operations/penalties"], requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const list = await payrollDb
      .select({
        penalty: penalties,
        employee: employees,
      })
      .from(penalties)
      .innerJoin(employees, eq(penalties.employeeId, employees.id))
      .where(propertyId ? eq(penalties.propertyId, propertyId) : undefined)
      .orderBy(desc(penalties.id))
      .limit(100);

    res.json({ success: true, penalties: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(["/payroll-ops/penalties", "/payroll-operations/penalties"], requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, employeeId, incidentDate, penaltyType, deductionDays, deductionAmount, reason, investigationNumber } = req.body;
    const [penalty] = await payrollDb.insert(penalties).values({
      propertyId: Number(propertyId),
      employeeId: Number(employeeId),
      incidentDate,
      penaltyType: penaltyType || "salary_deduction_days",
      deductionDays: String(deductionDays || "1.0"),
      deductionAmount: String(deductionAmount || "0.00"),
      reason,
      investigationNumber,
      status: "approved",
    }).returning();
    res.status(201).json({ success: true, penalty });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── 3. Loans & Cash Advances (SST Loans) ───────────────────────────
router.get(["/payroll-ops/loans", "/payroll-operations/loans"], requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const list = await payrollDb
      .select({
        loan: loansAndAdvances,
        employee: employees,
      })
      .from(loansAndAdvances)
      .innerJoin(employees, eq(loansAndAdvances.employeeId, employees.id))
      .where(propertyId ? eq(loansAndAdvances.propertyId, propertyId) : undefined)
      .orderBy(desc(loansAndAdvances.id))
      .limit(100);

    res.json({ success: true, loans: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(["/payroll-ops/loans", "/payroll-operations/loans"], requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, employeeId, requestType, totalAmount, monthlyInstallment, disbursedDate, notes, installmentsCount } = req.body;
    const total = Number(totalAmount);
    const installment = Number(monthlyInstallment || (total / (Number(installmentsCount) || 1)));

    const [loan] = await payrollDb.insert(loansAndAdvances).values({
      propertyId: Number(propertyId),
      employeeId: Number(employeeId),
      requestType: requestType || "monthly_advance",
      totalAmount: String(total.toFixed(2)),
      monthlyInstallment: String(installment.toFixed(2)),
      remainingAmount: String(total.toFixed(2)),
      disbursedDate: disbursedDate || new Date().toISOString().split('T')[0],
      status: "active",
      notes,
    }).returning();

    // Auto-generate installments schedule
    const count = Number(installmentsCount) || Math.max(1, Math.round(total / installment));
    const baseDate = new Date(disbursedDate || Date.now());

    for (let i = 1; i <= count; i++) {
      const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 25);
      await payrollDb.insert(loanInstallments).values({
        loanId: loan.id,
        installmentNumber: i,
        dueDate: dueDate.toISOString().split("T")[0],
        amount: String(installment.toFixed(2)),
        isPaid: false,
      });
    }

    res.status(201).json({ success: true, loan });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// View installments for a specific loan
router.get(["/payroll-ops/loans/:id/installments", "/payroll-operations/loans/:id/installments"], requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const loanId = Number(req.params.id);
    const items = await payrollDb
      .select()
      .from(loanInstallments)
      .where(eq(loanInstallments.loanId, loanId))
      .orderBy(loanInstallments.installmentNumber);

    res.json({ success: true, installments: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
