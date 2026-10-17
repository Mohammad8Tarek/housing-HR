import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  leaveTypes, 
  leaveApplications, 
  penalties,
  loansAndAdvances, 
  employees,
} from "@workspace/db-payroll";
import { eq, desc } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 1. Leaves Management ───────────────────────────────────────────
router.get("/payroll-ops/leave-types", requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(leaveTypes).where(eq(leaveTypes.isActive, true));
    res.json({ success: true, leaveTypes: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/payroll-ops/leaves", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = payrollDb
      .select({
        application: leaveApplications,
        employee: employees,
        leaveType: leaveTypes,
      })
      .from(leaveApplications)
      .innerJoin(employees, eq(leaveApplications.employeeId, employees.id))
      .innerJoin(leaveTypes, eq(leaveApplications.leaveTypeId, leaveTypes.id))
      .where(propertyId ? eq(leaveApplications.propertyId, propertyId) : undefined)
      .orderBy(desc(leaveApplications.id))
      .limit(100);

    const leaves = await query;
    res.json({ success: true, leaves });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/payroll-ops/leaves", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, employeeId, leaveTypeId, startDate, endDate, totalDays, reason } = req.body;
    const [leave] = await payrollDb.insert(leaveApplications).values({
      propertyId: Number(propertyId),
      employeeId: Number(employeeId),
      leaveTypeId: Number(leaveTypeId),
      startDate,
      endDate,
      totalDays: String(totalDays || 1),
      reason,
      status: "approved",
    }).returning();
    res.status(201).json({ success: true, leave });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── 2. Penalties & Disciplinary Actions (SST Legal & Penalties) ─────
router.get("/payroll-ops/penalties", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
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

router.post("/payroll-ops/penalties", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
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
router.get("/payroll-ops/loans", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
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

router.post("/payroll-ops/loans", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, employeeId, requestType, totalAmount, monthlyInstallment, disbursedDate, notes } = req.body;
    const [loan] = await payrollDb.insert(loansAndAdvances).values({
      propertyId: Number(propertyId),
      employeeId: Number(employeeId),
      requestType: requestType || "monthly_advance",
      totalAmount: String(totalAmount),
      monthlyInstallment: String(monthlyInstallment),
      remainingAmount: String(totalAmount),
      disbursedDate: disbursedDate || new Date().toISOString().split('T')[0],
      status: "active",
      notes,
    }).returning();
    res.status(201).json({ success: true, loan });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
