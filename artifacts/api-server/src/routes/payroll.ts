import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  properties, 
  departments, 
  designations, 
  employees, 
  salaryComponents, 
  payrollPeriods, 
  payrollRuns, 
  salarySlips, 
  salarySlipItems,
  attendanceRecords,
  penalties,
  loansAndAdvances,
} from "@workspace/db-payroll";
import { eq, and, or, ilike, desc, sql, inArray } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 1. Properties & Structure ───────────────────────────────────────
router.get("/payroll/properties", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(properties).where(eq(properties.isActive, true));
    res.json({ success: true, properties: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/payroll/departments", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(departments).where(eq(departments.propertyId, propertyId))
      : payrollDb.select().from(departments);
    const list = await query;
    res.json({ success: true, departments: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/payroll/designations", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    const query = departmentId
      ? payrollDb.select().from(designations).where(eq(designations.departmentId, departmentId))
      : payrollDb.select().from(designations);
    const list = await query;
    res.json({ success: true, designations: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Employees (Regular vs Casual) ────────────────────────────────
router.get("/payroll/employees", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const employmentType = (req.query.employmentType as string) || "regular";
    const search = ((req.query.search as string) || "").trim();

    const conditions: any[] = [eq(employees.isActive, true)];

    if (propertyId) {
      conditions.push(eq(employees.propertyId, propertyId));
    }
    if (employmentType && employmentType !== "all") {
      conditions.push(eq(employees.employmentType, employmentType));
    }
    if (search) {
      const term = `%${search}%`;
      conditions.push(or(
        ilike(employees.fullName, term),
        ilike(employees.fullNameAr, term),
        ilike(employees.employeeCode, term),
        ilike(employees.nationalId, term),
        ilike(employees.biometricId, term)
      ));
    }

    const whereClause = and(...conditions);

    const [totalRes] = await payrollDb
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(whereClause);

    const data = await payrollDb
      .select()
      .from(employees)
      .where(whereClause)
      .orderBy(desc(employees.id))
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      employees: data,
      pagination: {
        page,
        limit,
        total: totalRes?.count ?? 0,
        totalPages: Math.ceil((totalRes?.count ?? 0) / limit),
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/payroll/employees", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const fullName = `${body.firstName} ${body.secondName || ''} ${body.lastName}`.replace(/\s+/g, ' ').trim();
    
    const [created] = await payrollDb.insert(employees).values({
      propertyId: Number(body.propertyId),
      employeeCode: body.employeeCode,
      firstName: body.firstName,
      secondName: body.secondName || null,
      thirdName: body.thirdName || null,
      lastName: body.lastName,
      fullName: fullName,
      fullNameAr: body.fullNameAr || null,
      nationalId: body.nationalId || null,
      passportNumber: body.passportNumber || null,
      gender: body.gender || 'male',
      dateOfBirth: body.dateOfBirth || null,
      maritalStatus: body.maritalStatus || 'single',
      employmentType: body.employmentType || 'regular',
      departmentId: body.departmentId ? Number(body.departmentId) : null,
      designationId: body.designationId ? Number(body.designationId) : null,
      joiningDate: body.joiningDate || new Date().toISOString().split('T')[0],
      contractType: body.contractType || 'permanent',
      status: body.status || 'active',
      biometricId: body.biometricId || null,
      bankName: body.bankName || null,
      bankAccountNumber: body.bankAccountNumber || null,
      iban: body.iban || null,
      insuranceNumber: body.insuranceNumber || null,
      insuranceSalary: body.insuranceSalary || "0.00",
      isInsured: body.isInsured ?? true,
      baseSalary: body.baseSalary || "0.00",
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      notes: body.notes || null,
    }).returning();

    res.status(201).json({ success: true, employee: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put("/payroll/employees/:id", requirePermission("payroll", "edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    
    const [updated] = await payrollDb
      .update(employees)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();

    res.json({ success: true, employee: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── 3. Salary Components & Periods ─────────────────────────────────
router.get("/payroll/salary-components", requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  try {
    const components = await payrollDb.select().from(salaryComponents).where(eq(salaryComponents.isActive, true));
    res.json({ success: true, components });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/payroll/periods", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(payrollPeriods).where(eq(payrollPeriods.propertyId, propertyId)).orderBy(desc(payrollPeriods.id))
      : payrollDb.select().from(payrollPeriods).orderBy(desc(payrollPeriods.id));
    const periods = await query;
    res.json({ success: true, periods });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/payroll/periods", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, periodName, year, month, startDate, endDate, totalWorkingDays } = req.body;
    const [period] = await payrollDb.insert(payrollPeriods).values({
      propertyId: Number(propertyId),
      periodName,
      year: Number(year),
      month: Number(month),
      startDate,
      endDate,
      totalWorkingDays: Number(totalWorkingDays) || 30,
      status: "open",
    }).returning();
    res.status(201).json({ success: true, period });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── 4. Monthly Payroll Calculation Engine (End Period) ─────────────
router.get("/payroll/runs", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(payrollRuns).where(eq(payrollRuns.propertyId, propertyId)).orderBy(desc(payrollRuns.id))
      : payrollDb.select().from(payrollRuns).orderBy(desc(payrollRuns.id));
    const runs = await query;
    res.json({ success: true, runs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/payroll/calculate", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, payrollPeriodId, employmentType } = req.body;

    const [period] = await payrollDb
      .select()
      .from(payrollPeriods)
      .where(eq(payrollPeriods.id, Number(payrollPeriodId)));

    if (!period) {
      return res.status(404).json({ success: false, error: "Payroll period not found" });
    }

    // 1. Fetch eligible employees
    const empConditions = [
      eq(employees.propertyId, Number(propertyId)),
      eq(employees.status, "active"),
      eq(employees.isActive, true),
    ];
    if (employmentType && employmentType !== "all") {
      empConditions.push(eq(employees.employmentType, employmentType));
    }
    const staffList = await payrollDb.select().from(employees).where(and(...empConditions));

    if (staffList.length === 0) {
      return res.status(400).json({ success: false, error: "No active employees found for calculation" });
    }

    // 2. Create Payroll Run Batch Header
    const [run] = await payrollDb.insert(payrollRuns).values({
      payrollPeriodId: period.id,
      propertyId: Number(propertyId),
      employmentType: employmentType || "regular",
      totalEmployees: staffList.length,
      status: "calculated",
    }).returning();

    let grandGross = 0;
    let grandDeductions = 0;
    let grandNet = 0;

    // 3. Process each employee (integrating Attendance + Penalties + Loans + Egyptian Statutory)
    for (const emp of staffList) {
      const basicSalary = Number(emp.baseSalary) || 0;
      
      // Attendance audit for this period
      const attendance = await payrollDb
        .select()
        .from(attendanceRecords)
        .where(and(
          eq(attendanceRecords.employeeId, emp.id),
          sql`${attendanceRecords.attendanceDate} >= ${period.startDate} AND ${attendanceRecords.attendanceDate} <= ${period.endDate}`
        ));

      const totalDays = Number(period.totalWorkingDays) || 30;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const absentCount = attendance.filter(a => a.status === 'absent').length;
      const overtimeHours = attendance.reduce((acc, curr) => acc + (Number(curr.overtimeHours) || 0), 0);
      const lateMins = attendance.reduce((acc, curr) => acc + (Number(curr.lateMinutes) || 0), 0);
      const lateDays = lateMins > 60 ? Math.floor(lateMins / 60) * 0.25 : 0;

      // Penalties deduction
      const penaltiesList = await payrollDb
        .select()
        .from(penalties)
        .where(and(
          eq(penalties.employeeId, emp.id),
          eq(penalties.status, "approved"),
          sql`${penalties.incidentDate} >= ${period.startDate} AND ${penalties.incidentDate} <= ${period.endDate}`
        ));
      const penaltyAmount = penaltiesList.reduce((acc, p) => acc + (Number(p.deductionAmount) || 0), 0);

      // Loans installments deduction
      const loans = await payrollDb
        .select()
        .from(loansAndAdvances)
        .where(and(
          eq(loansAndAdvances.employeeId, emp.id),
          eq(loansAndAdvances.status, "active"),
          sql`${loansAndAdvances.remainingAmount} > 0`
        ));
      const loanDeduction = loans.reduce((acc, l) => acc + Math.min(Number(l.monthlyInstallment), Number(l.remainingAmount)), 0);

      // Earnings calculation
      const dayRate = basicSalary / 30;
      const overtimeRate = dayRate / 8 * 1.5;
      const overtimePay = overtimeHours * overtimeRate;
      const totalEarnings = basicSalary + overtimePay;

      // Egyptian Social Insurance calculation (11% employee, 18.75% company on insurance salary)
      const insSalary = Number(emp.insuranceSalary) || basicSalary;
      const socInsEmp = emp.isInsured ? Math.round(insSalary * 0.11 * 100) / 100 : 0;
      const socInsComp = emp.isInsured ? Math.round(insSalary * 0.1875 * 100) / 100 : 0;

      // Absence deduction
      const absenceDeduction = (absentCount + lateDays) * dayRate;

      // Total deductions
      const totalDeductions = socInsEmp + absenceDeduction + penaltyAmount + loanDeduction;
      const netSalary = Math.max(0, totalEarnings - totalDeductions);

      grandGross += totalEarnings;
      grandDeductions += totalDeductions;
      grandNet += netSalary;

      // Save Slip
      await payrollDb.insert(salarySlips).values({
        payrollRunId: run.id,
        employeeId: emp.id,
        propertyId: Number(propertyId),
        payrollPeriodId: period.id,
        totalWorkingDays: String(totalDays),
        presentDays: String(presentCount),
        absentDays: String(absentCount),
        leaveDays: "0",
        lateDeductionDays: String(lateDays),
        overtimeHours: String(overtimeHours),
        basicSalary: String(basicSalary),
        totalEarnings: String(totalEarnings),
        totalDeductions: String(totalDeductions),
        netSalary: String(netSalary),
        socialInsuranceEmployee: String(socInsEmp),
        socialInsuranceCompany: String(socInsComp),
        loanDeduction: String(loanDeduction),
        penaltyDeduction: String(penaltyAmount),
        absenceDeduction: String(absenceDeduction),
        bankAccountNumber: emp.bankAccountNumber || null,
        iban: emp.iban || null,
        status: "draft",
      });
    }

    // Update run totals
    await payrollDb
      .update(payrollRuns)
      .set({
        totalGross: String(grandGross),
        totalDeductions: String(grandDeductions),
        totalNet: String(grandNet),
      })
      .where(eq(payrollRuns.id, run.id));

    res.json({
      success: true,
      payrollRun: {
        id: run.id,
        totalEmployees: staffList.length,
        totalGross: grandGross,
        totalDeductions: grandDeductions,
        totalNet: grandNet,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. Slips & Bank WPS Export ─────────────────────────────────────
router.get("/payroll/runs/:id/slips", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.id);
    const slips = await payrollDb
      .select({
        slip: salarySlips,
        employee: employees,
      })
      .from(salarySlips)
      .innerJoin(employees, eq(salarySlips.employeeId, employees.id))
      .where(eq(salarySlips.payrollRunId, runId))
      .orderBy(desc(salarySlips.id));

    res.json({ success: true, slips });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/payroll/runs/:id/wps", requirePermission("payroll", "export"), async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.id);
    const slips = await payrollDb
      .select({
        slip: salarySlips,
        employee: employees,
      })
      .from(salarySlips)
      .innerJoin(employees, eq(salarySlips.employeeId, employees.id))
      .where(eq(salarySlips.payrollRunId, runId));

    // Generate Standard Bank WPS CSV/Text
    let csv = "EmployeeCode,EmployeeName,BankAccount,IBAN,NetSalary,Currency\n";
    for (const item of slips) {
      const net = Number(item.slip.netSalary).toFixed(2);
      csv += `"${item.employee.employeeCode}","${item.employee.fullName}","${item.slip.bankAccountNumber || ''}","${item.slip.iban || ''}",${net},EGP\n`;
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="Sunrise_Payroll_WPS_${runId}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
