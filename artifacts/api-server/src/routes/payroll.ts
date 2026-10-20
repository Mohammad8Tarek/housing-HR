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
  serviceChargePools,
  serviceChargeItems,
  bankWpsConfigs,
  bankWpsBatches,
  supervisorAuthorizations,
  hrmsAuditLogs,
  monthlyTransactions,
  leaveRolloverPostings,
  costCenters,
  leaveApplications,
} from "@workspace/db-payroll";
import { eq, and, or, ilike, desc, asc, sql, inArray, gt, ne } from "drizzle-orm";
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
    const { propertyId, payrollPeriodId, employmentType, forceRecalculate } = req.body;

    const [period] = await payrollDb
      .select()
      .from(payrollPeriods)
      .where(eq(payrollPeriods.id, Number(payrollPeriodId)));

    if (!period) {
      return res.status(404).json({ success: false, error: "Payroll period not found" });
    }

    if (period.status === "closed") {
      return res.status(400).json({ success: false, error: "لا يمكن إعادة احتساب مسير رواتب لفترة مغلقة ومقفلة محاسبياً" });
    }

    // Check for existing runs on the same period and property
    const existingRuns = await payrollDb
      .select()
      .from(payrollRuns)
      .where(and(
        eq(payrollRuns.payrollPeriodId, period.id),
        eq(payrollRuns.propertyId, Number(propertyId)),
        ne(payrollRuns.status, "rejected")
      ));

    if (existingRuns.length > 0) {
      const hasApprovedOrClosed = existingRuns.some(r => r.status === "approved" || r.status === "closed");
      if (hasApprovedOrClosed) {
        return res.status(400).json({
          success: false,
          error: "لا يمكن إعادة احتساب مسير رواتب تم اعتماده أو إقفاله نهائياً",
        });
      }

      if (!forceRecalculate) {
        return res.status(409).json({
          success: false,
          error: "يوجد مسير رواتب محسوب مسبقاً لهذه الفترة. يرجى تفعيل خيار إعادة الاحتساب الصريح (forceRecalculate: true) للاستبدال",
          existingRunId: existingRuns[0].id,
        });
      }
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

    // Execute atomic calculation in a single PostgreSQL transaction
    const calculationResult = await payrollDb.transaction(async (tx) => {
      // If force recalculating, clean up existing draft/calculated runs and slips
      if (existingRuns.length > 0) {
        for (const oldRun of existingRuns) {
          if (oldRun.status === "calculated" || oldRun.status === "draft") {
            await tx.delete(salarySlips).where(eq(salarySlips.payrollRunId, oldRun.id));
            await tx.delete(payrollRuns).where(eq(payrollRuns.id, oldRun.id));
          }
        }
      }

      // 2. Create Payroll Run Batch Header
      const [run] = await tx.insert(payrollRuns).values({
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
        const attendance = await tx
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
        const penaltiesList = await tx
          .select()
          .from(penalties)
          .where(and(
            eq(penalties.employeeId, emp.id),
            eq(penalties.status, "approved"),
            sql`${penalties.incidentDate} >= ${period.startDate} AND ${penalties.incidentDate} <= ${period.endDate}`
          ));
        const penaltyAmount = penaltiesList.reduce((acc, p) => acc + (Number(p.deductionAmount) || 0), 0);

        // Loans installments deduction
        const loans = await tx
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

        // Egyptian Income Tax (Law 30/2023) with personal exemption (24,000 EGP annual / 2,000 monthly)
        const monthlyTaxable = Math.max(0, totalEarnings - socInsEmp - 2000);
        const annualTaxable = monthlyTaxable * 12;
        let annualTax = 0;
        if (annualTaxable <= 40000) {
          annualTax = 0;
        } else if (annualTaxable <= 55000) {
          annualTax = (annualTaxable - 40000) * 0.10;
        } else if (annualTaxable <= 70000) {
          annualTax = (15000 * 0.10) + (annualTaxable - 55000) * 0.15;
        } else if (annualTaxable <= 200000) {
          annualTax = (15000 * 0.10) + (15000 * 0.15) + (annualTaxable - 70000) * 0.20;
        } else if (annualTaxable <= 400000) {
          annualTax = (15000 * 0.10) + (15000 * 0.15) + (130000 * 0.20) + (annualTaxable - 200000) * 0.225;
        } else {
          annualTax = (15000 * 0.10) + (15000 * 0.15) + (130000 * 0.20) + (200000 * 0.225) + (annualTaxable - 400000) * 0.25;
        }
        const incomeTaxAmount = Math.round((annualTax / 12) * 100) / 100;
        const martyrsFundAmount = Math.round(totalEarnings * 0.0005 * 100) / 100;

        // Absence deduction
        const absenceDeduction = (absentCount + lateDays) * dayRate;

        // Total deductions (including social insurance, income tax, martyrs fund, loans, and penalties)
        const totalDeductions = socInsEmp + incomeTaxAmount + martyrsFundAmount + absenceDeduction + penaltyAmount + loanDeduction;
        const netSalary = Math.max(0, totalEarnings - totalDeductions);

        grandGross += totalEarnings;
        grandDeductions += totalDeductions;
        grandNet += netSalary;

        // Save Slip
        await tx.insert(salarySlips).values({
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
          incomeTax: String(incomeTaxAmount),
          loanDeduction: String(loanDeduction),
          penaltyDeduction: String(penaltyAmount),
          absenceDeduction: String(absenceDeduction),
          bankAccountNumber: emp.bankAccountNumber || null,
          iban: emp.iban || null,
          status: "draft",
        });
      }

      // Update run totals
      await tx
        .update(payrollRuns)
        .set({
          totalGross: String(grandGross),
          totalDeductions: String(grandDeductions),
          totalNet: String(grandNet),
        })
        .where(eq(payrollRuns.id, run.id));

      return {
        runId: run.id,
        totalEmployees: staffList.length,
        totalGross: grandGross,
        totalDeductions: grandDeductions,
        totalNet: grandNet,
      };
    });

    res.json({
      success: true,
      payrollRun: {
        id: calculationResult.runId,
        totalEmployees: calculationResult.totalEmployees,
        totalGross: calculationResult.totalGross,
        totalDeductions: calculationResult.totalDeductions,
        totalNet: calculationResult.totalNet,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. Slips & Bank WPS Export ─────────────────────────────────────
router.post("/payroll/runs/:id/approve", requirePermission("payroll", "approve"), async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.id);
    const session = req.session as any;
    const currentUserId = session?.hrUserId || session?.user?.id || session?.userId;
    const currentUsername = session?.hrUser?.username || session?.user?.username || session?.username || "authorized_supervisor";

    // Supervisor financial PIN secondary authorization token is strictly required
    const authToken = (req.headers["x-authorization-token"] as string) || req.body?.authorizationToken;
    if (!authToken || typeof authToken !== "string") {
      return res.status(403).json({
        success: false,
        error: "رمز التفويض المالي للمشرف مطلوب لإتمام الاعتماد (Missing supervisor authorization token)",
      });
    }

    const [run] = await payrollDb.select().from(payrollRuns).where(eq(payrollRuns.id, runId));
    if (!run) {
      return res.status(404).json({ success: false, error: "مسير الرواتب غير موجود" });
    }

    if (run.status === "approved" || run.status === "closed") {
      return res.status(400).json({ success: false, error: "مسير الرواتب معتمد بالفعل مسبقاً" });
    }

    // Atomically validate and consume authorization token in transaction
    const updated = await payrollDb.transaction(async (tx) => {
      // Find valid token
      const [authRecord] = await tx
        .select()
        .from(supervisorAuthorizations)
        .where(and(
          eq(supervisorAuthorizations.token, authToken),
          eq(supervisorAuthorizations.isConsumed, false),
          sql`${supervisorAuthorizations.expiresAt} > NOW()`,
          eq(supervisorAuthorizations.action, "payroll_approve")
        ))
        .limit(1);

      if (!authRecord) {
        throw new Error("AUTH_TOKEN_INVALID_OR_EXPIRED");
      }

      // Check user binding if currentUserId exists
      if (currentUserId && authRecord.userId !== currentUserId) {
        throw new Error("AUTH_TOKEN_USER_MISMATCH");
      }

      // Check property binding if specified
      if (authRecord.propertyId && authRecord.propertyId !== run.propertyId) {
        throw new Error("AUTH_TOKEN_PROPERTY_MISMATCH");
      }

      // Atomically consume token
      await tx
        .update(supervisorAuthorizations)
        .set({
          isConsumed: true,
          consumedAt: new Date(),
          entityType: "payroll_runs",
          entityId: runId,
        })
        .where(eq(supervisorAuthorizations.id, authRecord.id));

      // Approve run
      const [approvedRun] = await tx
        .update(payrollRuns)
        .set({
          status: "approved",
          approvedBy: currentUsername,
          approvedAt: new Date(),
        })
        .where(eq(payrollRuns.id, runId))
        .returning();

      // Approve all slips
      await tx
        .update(salarySlips)
        .set({ status: "approved" })
        .where(eq(salarySlips.payrollRunId, runId));

      // Write audit log
      await tx.insert(hrmsAuditLogs).values({
        userId: currentUserId || 1,
        action: "PAYROLL_APPROVE",
        entityType: "payroll_runs",
        entityId: runId,
        details: { approvedBy: currentUsername, runId, propertyId: run.propertyId },
      });

      return approvedRun;
    });

    res.json({
      success: true,
      payrollRun: updated,
      message: "تم اعتماد مسير الرواتب رسمياً وتفويضه للتصدير البنكي ومطابقة قيود اليومية العامة",
    });
  } catch (err: any) {
    if (err.message === "AUTH_TOKEN_INVALID_OR_EXPIRED") {
      return res.status(403).json({
        success: false,
        error: "رمز التفويض المالي غير صالح، أو منتهي الصلاحية، أو تم استخدامه مسبقاً (Invalid or expired authorization token)",
      });
    }
    if (err.message === "AUTH_TOKEN_USER_MISMATCH" || err.message === "AUTH_TOKEN_PROPERTY_MISMATCH") {
      return res.status(403).json({
        success: false,
        error: "رمز التفويض غير مطابق للمستخدم المصرح له أو المنشأة المحددة",
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

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

router.get("/payroll/slips/:id", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const slipId = Number(req.params.id);
    const [row] = await payrollDb
      .select({
        slip: salarySlips,
        employee: employees,
      })
      .from(salarySlips)
      .innerJoin(employees, eq(salarySlips.employeeId, employees.id))
      .where(eq(salarySlips.id, slipId))
      .limit(1);

    if (!row) {
      return res.status(404).json({ success: false, error: "Salary slip not found" });
    }

    const items = await payrollDb
      .select()
      .from(salarySlipItems)
      .where(eq(salarySlipItems.salarySlipId, slipId));

    res.json({
      success: true,
      slip: row.slip,
      employee: row.employee,
      items,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/payroll/employees/:id/latest-slip", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);
    const [emp] = await payrollDb
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!emp) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    // Check if employee has a calculated slip in database
    const [existingSlip] = await payrollDb
      .select({
        slip: salarySlips,
        period: payrollPeriods,
      })
      .from(salarySlips)
      .leftJoin(payrollPeriods, eq(salarySlips.payrollPeriodId, payrollPeriods.id))
      .where(eq(salarySlips.employeeId, employeeId))
      .orderBy(desc(salarySlips.id))
      .limit(1);

    if (existingSlip) {
      const basic = Number(existingSlip.slip.basicSalary) || Number(emp.baseSalary) || 0;
      const gross = Number(existingSlip.slip.totalEarnings) || basic;
      const overtime = (Number(existingSlip.slip.overtimeHours) || 0) * ((basic / 30) / 8 * 1.5);
      const empInsurance = Number(existingSlip.slip.socialInsuranceEmployee) || 0;
      const compInsurance = Number(existingSlip.slip.socialInsuranceCompany) || 0;
      const incomeTax = Number(existingSlip.slip.incomeTax) || 0;
      const loanDeduction = Number(existingSlip.slip.loanDeduction) || 0;
      const penaltyDeduction = Number(existingSlip.slip.penaltyDeduction) || 0;
      const absenceDeduction = Number(existingSlip.slip.absenceDeduction) || 0;
      const totalDeductions = Number(existingSlip.slip.totalDeductions) || (empInsurance + incomeTax + loanDeduction + penaltyDeduction + absenceDeduction);
      const netSalary = Number(existingSlip.slip.netSalary) || (gross - totalDeductions);

      return res.json({
        success: true,
        source: "database",
        slip: {
          employee: emp,
          periodName: existingSlip.period?.periodName || "مسير الرواتب المعتمد",
          workingDays: Number(existingSlip.slip.totalWorkingDays) || 30,
          attendedDays: Number(existingSlip.slip.presentDays) || 26,
          earnings: {
            baseSalary: basic,
            insurableWage: Number(emp.insuranceSalary) || basic,
            serviceCharge: 0,
            mealAllowance: 600,
            remoteAllowance: 750,
            overtime: Math.round(overtime),
            totalGross: gross,
          },
          deductions: {
            empInsurance,
            incomeTax,
            martyrsFund: Math.round(gross * 0.0005),
            loanDeduction,
            penaltyDeduction,
            absenceDeduction,
            totalDeductions,
          },
          netSalary,
          compInsurance,
        }
      });
    }

    // Dynamic live computation based on real employee profile
    const base = Number(emp.baseSalary) || 6000;
    const insSalary = Number(emp.insuranceSalary) || base;
    const mealAllowance = 600;
    const remoteAllowance = 750;
    const gross = base + mealAllowance + remoteAllowance;
    const insurableWage = Math.min(Math.max(insSalary, 2000), 12600);
    const empInsurance = emp.isInsured ? Math.round(insurableWage * 0.11) : 0;
    const compInsurance = emp.isInsured ? Math.round(insurableWage * 0.1875) : 0;
    const monthlyTaxable = Math.max(0, gross - empInsurance - 2000);
    const incomeTax = Math.round(monthlyTaxable * 0.05);
    const martyrsFund = Math.round(gross * 0.0005);
    const totalDeductions = empInsurance + incomeTax + martyrsFund;
    const netSalary = gross - totalDeductions;

    res.json({
      success: true,
      source: "calculated",
      slip: {
        employee: emp,
        periodName: "تقدير الشهر الحالي - 2026",
        workingDays: 30,
        attendedDays: 26,
        earnings: {
          baseSalary: base,
          insurableWage,
          serviceCharge: 0,
          mealAllowance,
          remoteAllowance,
          overtime: 0,
          totalGross: gross,
        },
        deductions: {
          empInsurance,
          incomeTax,
          martyrsFund,
          loanDeduction: 0,
          penaltyDeduction: 0,
          totalDeductions,
        },
        netSalary,
        compInsurance,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/payroll/runs/:id/wps", requirePermission("payroll", "export"), async (req: Request, res: Response) => {
  try {
    const runId = Number(req.params.id);
    const format = ((req.query.format as string) || "standard").toLowerCase();
    const isPreview = req.query.preview === "true";

    const [run] = await payrollDb
      .select()
      .from(payrollRuns)
      .where(eq(payrollRuns.id, runId));

    if (!run) {
      return res.status(404).json({ success: false, error: "مسير الرواتب غير موجود" });
    }

    const slips = await payrollDb
      .select({
        slip: salarySlips,
        employee: employees,
      })
      .from(salarySlips)
      .innerJoin(employees, eq(salarySlips.employeeId, employees.id))
      .where(eq(salarySlips.payrollRunId, runId));

    // PREVIEW MODE: Only return sanitized, redacted JSON preview with strict watermark.
    // NEVER emit genuine bank transfer text/csv transmission files for unapproved runs!
    if (isPreview) {
      const maskedRecords = slips.map((s) => {
        const rawAcc = s.slip.bankAccountNumber || "";
        const maskedAcc = rawAcc.length > 4 ? `****${rawAcc.slice(-4)}` : (rawAcc ? "****" : "CASH");
        return {
          employeeCode: s.employee.employeeCode,
          employeeName: s.employee.fullName,
          bankName: s.employee.bankName || "Unknown",
          bankAccountMasked: maskedAcc,
          netSalary: Number(s.slip.netSalary),
        };
      });

      return res.json({
        success: true,
        isPreview: true,
        watermark: "UNAPPROVED DRAFT PREVIEW — STRICTLY NOT FOR BANK TRANSMISSION",
        payrollRunId: run.id,
        runStatus: run.status,
        summary: {
          totalEmployees: slips.length,
          totalNet: slips.reduce((sum, s) => sum + (Number(s.slip.netSalary) || 0), 0),
        },
        records: maskedRecords,
      });
    }

    // REAL BANK EXPORT MODE: Strict approval enforcement!
    if (run.status !== "approved" && run.status !== "closed") {
      return res.status(400).json({
        success: false,
        error: "لا يمكن استخراج ملفات الرواتب المصرفية (WPS) إلا بعد الاعتماد المالي والنهائي للمسير (Approved / Closed)",
      });
    }

    let output = "";
    let contentType = "text/csv; charset=utf-8";
    let filename = `Sunrise_Payroll_WPS_${runId}.csv`;

    if (format === "nbe") {
      // National Bank of Egypt (NBE) WPS Pipe-delimited Format
      output = "RECORD_TYPE|EMP_ID|NAT_ID|EMP_NAME|BANK_ACC|AMOUNT|CURRENCY|VALUE_DATE\n";
      for (const item of slips) {
        const net = Number(item.slip.netSalary).toFixed(2);
        output += `PAY|${item.employee.employeeCode}|${item.employee.nationalId || '00000000000000'}|${item.employee.fullName}|${item.slip.bankAccountNumber || 'CASH'}|${net}|EGP|${new Date().toISOString().split('T')[0]}\n`;
      }
      filename = `Sunrise_NBE_WPS_Run_${runId}.txt`;
    } else if (format === "cib") {
      // Commercial International Bank (CIB) Corporate Electronic Payroll
      output = "Seq,EmployeeCode,EmployeeName,BankCode,AccountNumber,IBAN,Amount,Currency,Narration\n";
      let seq = 1;
      for (const item of slips) {
        const net = Number(item.slip.netSalary).toFixed(2);
        output += `${seq++},${item.employee.employeeCode},"${item.employee.fullName}",CIBEG,"${item.slip.bankAccountNumber || ''}","${item.slip.iban || ''}",${net},EGP,"Salary Payroll Run #${runId}"\n`;
      }
      filename = `Sunrise_CIB_Payroll_Run_${runId}.csv`;
    } else if (format === "misr") {
      // Banque Misr Payroll Layout
      output = "TransactionType,EmployeeNumber,BeneficiaryName,AccountNumber,Amount,TransactionDetails\n";
      for (const item of slips) {
        const net = Number(item.slip.netSalary).toFixed(2);
        output += `SALARY,${item.employee.employeeCode},"${item.employee.fullName}","${item.slip.bankAccountNumber || ''}",${net},"Monthly Salaries Run #${runId}"\n`;
      }
      filename = `Sunrise_Banque_Misr_Run_${runId}.csv`;
    } else {
      // Comprehensive Egyptian Enterprise Payroll Sheet
      output = "EmployeeCode,EmployeeName,Department,BaseSalary,ServiceCharge12,Allowances,GrossSalary,SocialInsurance11,IncomeTax,Loans,Penalties,Absence,TotalDeductions,NetSalary,BankAccount,IBAN\n";
      for (const item of slips) {
        const gross = Number(item.slip.totalEarnings).toFixed(2);
        const net = Number(item.slip.netSalary).toFixed(2);
        const ded = Number(item.slip.totalDeductions).toFixed(2);
        const ins = Number(item.slip.socialInsuranceEmployee).toFixed(2);
        const tax = Number(item.slip.incomeTax).toFixed(2);
        const loan = Number(item.slip.loanDeduction).toFixed(2);
        const pen = Number(item.slip.penaltyDeduction).toFixed(2);
        const abs = Number(item.slip.absenceDeduction).toFixed(2);

        output += `"${item.employee.employeeCode}","${item.employee.fullName}","Hospitality",${item.slip.basicSalary},0.00,0.00,${gross},${ins},${tax},${loan},${pen},${abs},${ded},${net},"${item.slip.bankAccountNumber || ''}","${item.slip.iban || ''}"\n`;
      }
      filename = `Sunrise_Comprehensive_Payroll_Run_${runId}.csv`;
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(output);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 6. Service Charge Pool (وعاء عمولة الخدمة الفندقية 12%) ─────────
router.get("/payroll/service-charge", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(serviceChargePools).where(eq(serviceChargePools.propertyId, propertyId)).orderBy(desc(serviceChargePools.id))
      : payrollDb.select().from(serviceChargePools).orderBy(desc(serviceChargePools.id));
    const pools = await query;
    res.json({ success: true, pools });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/payroll/service-charge/calculate", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, payrollPeriodId, totalServiceAmount, hotelSharePercent, notes } = req.body;
    if (!propertyId || !payrollPeriodId || !totalServiceAmount) {
      return res.status(400).json({ success: false, error: "propertyId, payrollPeriodId, and totalServiceAmount required" });
    }

    const totalAmt = Number(totalServiceAmount);
    const hotelPct = Number(hotelSharePercent || 15.00); // 15% hotel breakage/admin share, 85% staff share per Egyptian Hotel custom
    const staffShare = totalAmt * ((100 - hotelPct) / 100);

    // Fetch active employees
    const staff = await payrollDb
      .select()
      .from(employees)
      .where(and(
        eq(employees.propertyId, Number(propertyId)),
        eq(employees.status, "active"),
        eq(employees.isActive, true)
      ));

    if (staff.length === 0) {
      return res.status(400).json({ success: false, error: "No active employees found to distribute service charge" });
    }

    // Default 1 point per employee, total points = staff.length
    const totalPoints = staff.length;
    const pointValue = staffShare / totalPoints;

    const [pool] = await payrollDb.insert(serviceChargePools).values({
      propertyId: Number(propertyId),
      payrollPeriodId: Number(payrollPeriodId),
      totalServiceAmount: String(totalAmt.toFixed(2)),
      hotelSharePercent: String(hotelPct.toFixed(2)),
      staffDistributableAmount: String(staffShare.toFixed(2)),
      totalPoints: String(totalPoints.toFixed(2)),
      pointValue: String(pointValue.toFixed(4)),
      status: "approved",
      notes: notes || "Distributed per Egyptian 12% Hospitality standard",
    }).returning();

    // Insert item for each employee
    for (const emp of staff) {
      await payrollDb.insert(serviceChargeItems).values({
        poolId: pool.id,
        employeeId: emp.id,
        designationPoints: "1.00",
        workedDaysRatio: "1.0000",
        finalPoints: "1.0000",
        amount: String(pointValue.toFixed(2)),
      });
    }

    res.status(201).json({
      success: true,
      pool: {
        id: pool.id,
        totalServiceAmount: totalAmt,
        staffDistributableAmount: staffShare,
        totalEmployees: staff.length,
        pointValue: pointValue.toFixed(2),
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/payroll/service-charge/:poolId/items", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const poolId = Number(req.params.poolId);
    const items = await payrollDb
      .select({
        item: serviceChargeItems,
        employee: employees,
      })
      .from(serviceChargeItems)
      .innerJoin(employees, eq(serviceChargeItems.employeeId, employees.id))
      .where(eq(serviceChargeItems.poolId, poolId));

    res.json({ success: true, items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 8. Egyptian Labor Law End-of-Service Indemnity Calculator ────────
router.post("/payroll/end-of-service/calculate", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const { employeeId, terminationDate, leaveBalanceDays = 0, terminationReason = "retirement" } = req.body;
    
    const [emp] = await payrollDb
      .select({
        employee: employees,
        department: departments,
        designation: designations,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .where(eq(employees.id, Number(employeeId)))
      .limit(1);

    if (!emp) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    const joinDate = new Date(emp.employee.joiningDate);
    const endDate = terminationDate ? new Date(terminationDate) : new Date();
    
    // Calculate total days and exact years of service
    const diffTime = Math.max(0, endDate.getTime() - joinDate.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalYears = totalDays / 365.25;
    const roundedYears = Math.floor(totalYears);
    const remainingMonths = Math.floor((totalYears - roundedYears) * 12);

    const baseSalary = Number(emp.employee.baseSalary) || 0;
    const avgServiceCharge = 1850; // Average 12% Tronche for hospitality
    const comprehensiveMonthlyWage = baseSalary + avgServiceCharge;
    const dayRate = comprehensiveMonthlyWage / 30;

    // Egyptian Labor Law Article 126:
    // Half month wage for each of first 5 years, full month wage for each subsequent year
    let gratuityAmount = 0;
    if (totalYears <= 5) {
      gratuityAmount = totalYears * (comprehensiveMonthlyWage * 0.5);
    } else {
      gratuityAmount = (5 * comprehensiveMonthlyWage * 0.5) + ((totalYears - 5) * comprehensiveMonthlyWage);
    }

    // Unused leave liquidation
    const leaveCompensation = Number(leaveBalanceDays) * dayRate;

    // Remaining loans check
    const activeLoans = await payrollDb
      .select()
      .from(loansAndAdvances)
      .where(and(
        eq(loansAndAdvances.employeeId, emp.employee.id),
        eq(loansAndAdvances.status, "active")
      ));
    const loanBalance = activeLoans.reduce((acc, l) => acc + Number(l.remainingAmount || 0), 0);

    const grossSettlement = gratuityAmount + leaveCompensation;
    const netSettlement = Math.max(0, grossSettlement - loanBalance);

    res.json({
      success: true,
      settlement: {
        employee: {
          id: emp.employee.id,
          name: emp.employee.fullName,
          nameAr: emp.employee.fullNameAr,
          code: emp.employee.employeeCode,
          nationalId: emp.employee.nationalId,
          department: emp.department?.nameAr || emp.department?.nameEn || "Hospitality",
          designation: emp.designation?.titleAr || emp.designation?.titleEn || "Staff",
          joiningDate: emp.employee.joiningDate,
          terminationDate: endDate.toISOString().split("T")[0],
          yearsOfService: roundedYears,
          monthsOfService: remainingMonths,
          totalYearsFormatted: `${roundedYears} سنة و ${remainingMonths} شهر`,
        },
        financials: {
          baseSalary: baseSalary.toFixed(2),
          avgServiceCharge: avgServiceCharge.toFixed(2),
          comprehensiveMonthlyWage: comprehensiveMonthlyWage.toFixed(2),
          gratuityAmount: gratuityAmount.toFixed(2),
          leaveBalanceDays: Number(leaveBalanceDays),
          leaveCompensation: leaveCompensation.toFixed(2),
          loanDeductions: loanBalance.toFixed(2),
          grossSettlement: grossSettlement.toFixed(2),
          netSettlement: netSettlement.toFixed(2),
          legalBasis: "قانون العمل المصري رقم 12 لسنة 2003 المادة 126 (نصف شهر عن أول 5 سنوات وشهر عن كل سنة تالية)",
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 9. Egyptian Tax Law 30/2023 & Insurance 148/2019 Simulator ───────
router.post("/payroll/tax-simulator", async (req: Request, res: Response) => {
  try {
    const grossSalary = Number(req.body.grossSalary) || 10000;
    const insuranceWage = Math.min(12600, Math.max(2000, Number(req.body.insuranceSalary) || grossSalary));

    // 1. Social Insurance Law 148/2019
    const empInsurance = Math.round(insuranceWage * 0.11 * 100) / 100;
    const compInsurance = Math.round(insuranceWage * 0.1875 * 100) / 100;

    // 2. Personal Exemption (24,000 EGP annually = 2,000 monthly)
    const annualPersonalExemption = 24000;
    const monthlyPersonalExemption = 2000;

    // 3. Taxable Net Base
    const monthlyTaxableBase = Math.max(0, grossSalary - empInsurance - monthlyPersonalExemption);
    const annualTaxableBase = monthlyTaxableBase * 12;

    // 4. Tax Brackets calculation (Law 30 of 2023)
    let annualTax = 0;
    const brackets = [
      { limit: 21000, rate: 0.00, label: "الشريحة 1 (0 إلى 21,000 ج.م معفاة 0%)" },
      { limit: 9000, rate: 0.025, label: "الشريحة 2 (21,001 إلى 30,000 ج.م بنسبة 2.5%)" },
      { limit: 15000, rate: 0.10, label: "الشريحة 3 (30,001 إلى 45,000 ج.م بنسبة 10%)" },
      { limit: 15000, rate: 0.15, label: "الشريحة 4 (45,001 إلى 60,000 ج.م بنسبة 15%)" },
      { limit: 140000, rate: 0.20, label: "الشريحة 5 (60,001 إلى 200,000 ج.م بنسبة 20%)" },
      { limit: 200000, rate: 0.225, label: "الشريحة 6 (200,001 إلى 400,000 ج.م بنسبة 22.5%)" },
      { limit: Infinity, rate: 0.25, label: "الشريحة 7 (أكثر من 400,000 ج.م بنسبة 25%)" },
    ];

    let rem = annualTaxableBase;
    const bracketDetails = [];

    for (const b of brackets) {
      if (rem <= 0) break;
      const taxableInBracket = Math.min(rem, b.limit);
      const taxForBracket = taxableInBracket * b.rate;
      annualTax += taxForBracket;
      bracketDetails.push({
        label: b.label,
        taxableAmount: taxableInBracket.toFixed(2),
        rate: `${b.rate * 100}%`,
        taxAmount: taxForBracket.toFixed(2),
      });
      rem -= taxableInBracket;
    }

    const monthlyIncomeTax = Math.round((annualTax / 12) * 100) / 100;
    const martyrsFund = Math.round(grossSalary * 0.0005 * 100) / 100; // 0.05%
    const totalDeductions = empInsurance + monthlyIncomeTax + martyrsFund;
    const netSalary = Math.round((grossSalary - totalDeductions) * 100) / 100;

    res.json({
      success: true,
      simulation: {
        grossSalary: grossSalary.toFixed(2),
        insuranceWage: insuranceWage.toFixed(2),
        empInsurance: empInsurance.toFixed(2),
        compInsurance: compInsurance.toFixed(2),
        monthlyPersonalExemption: monthlyPersonalExemption.toFixed(2),
        annualTaxableBase: annualTaxableBase.toFixed(2),
        annualIncomeTax: annualTax.toFixed(2),
        monthlyIncomeTax: monthlyIncomeTax.toFixed(2),
        martyrsFund: martyrsFund.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        netSalary: netSalary.toFixed(2),
        totalEmployerBurden: (grossSalary + compInsurance).toFixed(2),
        bracketDetails,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 10. Departmental Cost Center Analytics ───────────────────────────
router.get("/payroll/analytics/cost-centers", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    
    // Group staff and calculate departmental costs
    const staff = await payrollDb
      .select({
        employee: employees,
        department: departments,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(and(
        propertyId ? eq(employees.propertyId, propertyId) : undefined,
        eq(employees.status, "active"),
        eq(employees.isActive, true)
      ));

    const deptsMap = new Map<string, any>();

    for (const item of staff) {
      const deptName = item.department?.nameAr || item.department?.nameEn || "إدارة عامة فندقية";
      const baseSalary = Number(item.employee.baseSalary) || 0;
      const insSalary = Number(item.employee.insuranceSalary) || baseSalary;
      const employerIns = Math.round(insSalary * 0.1875 * 100) / 100;
      const serviceChargeEst = 1850;

      if (!deptsMap.has(deptName)) {
        deptsMap.set(deptName, {
          departmentName: deptName,
          staffCount: 0,
          totalBaseSalary: 0,
          totalServiceCharge: 0,
          totalEmployerInsurance: 0,
          totalDepartmentBurden: 0,
        });
      }

      const d = deptsMap.get(deptName);
      d.staffCount += 1;
      d.totalBaseSalary += baseSalary;
      d.totalServiceCharge += serviceChargeEst;
      d.totalEmployerInsurance += employerIns;
      d.totalDepartmentBurden += (baseSalary + serviceChargeEst + employerIns);
    }

    const costCenters = Array.from(deptsMap.values()).map(d => ({
      ...d,
      totalBaseSalaryFormatted: `${d.totalBaseSalary.toLocaleString()} EGP`,
      totalDepartmentBurdenFormatted: `${d.totalDepartmentBurden.toLocaleString()} EGP`,
    }));

    res.json({ success: true, costCenters });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 11. SST Monthly Variable Transactions (الحركات الشهرية المتغيرة) ──────────────────
router.get("/payroll/monthly-transactions", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const calcNumber = req.query.calcNumber ? Number(req.query.calcNumber) : undefined;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    const conditions = [];
    if (propertyId) conditions.push(eq(monthlyTransactions.propertyId, propertyId));
    if (year) conditions.push(eq(monthlyTransactions.periodYear, year));
    if (month) conditions.push(eq(monthlyTransactions.periodMonth, month));
    if (calcNumber) conditions.push(eq(monthlyTransactions.calcNumber, calcNumber));
    if (employeeId) conditions.push(eq(monthlyTransactions.employeeId, employeeId));

    const list = await payrollDb
      .select({
        transaction: monthlyTransactions,
        employee: employees,
        costCenter: costCenters,
      })
      .from(monthlyTransactions)
      .innerJoin(employees, eq(monthlyTransactions.employeeId, employees.id))
      .leftJoin(costCenters, eq(monthlyTransactions.costCenterId, costCenters.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(monthlyTransactions.id));

    res.json({ success: true, transactions: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/payroll/monthly-transactions", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { 
      propertyId, employeeId, bandCode, calculateBy, amount, calculateValue,
      periodMonth, periodYear, calcNumber, calculationNumber, paymentMethod, costCenterId, comment, notes 
    } = req.body;

    const valAmount = amount !== undefined ? amount : calculateValue;
    const now = new Date();
    const pMonth = periodMonth || (now.getMonth() + 1);
    const pYear = periodYear || now.getFullYear();
    const cNum = calculationNumber || calcNumber || 1;

    if (!propertyId || !employeeId || !bandCode || valAmount === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields for monthly transaction" });
    }

    const [created] = await payrollDb.insert(monthlyTransactions).values({
      propertyId: Number(propertyId),
      employeeId: Number(employeeId),
      bandCode: String(bandCode),
      calculateBy: calculateBy || "amount",
      amount: String(valAmount),
      periodMonth: Number(pMonth),
      periodYear: Number(pYear),
      calcNumber: Number(cNum),
      paymentMethod: paymentMethod || "bank",
      costCenterId: costCenterId ? Number(costCenterId) : null,
      comment: notes || comment || "",
      status: "pending",
    }).returning();

    res.status(200).json({ success: true, transaction: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete("/payroll/monthly-transactions/:id", requirePermission("payroll", "delete"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await payrollDb.delete(monthlyTransactions).where(eq(monthlyTransactions.id, id));
    res.json({ success: true, message: "تم حذف الحركة المتغيرة بنجاح" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 12. SST End Period: Close Transaction Checklist (إقفال الحركات التمهيدية) ──────────
router.get("/payroll/periods/:id/close-status", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const periodId = Number(req.params.id);
    const [period] = await payrollDb.select().from(payrollPeriods).where(eq(payrollPeriods.id, periodId));
    if (!period) return res.status(404).json({ success: false, error: "Payroll period not found" });

    // Check pending leaves in this period
    const pendingLeaves = await payrollDb
      .select({ count: sql<number>`count(*)::int` })
      .from(leaveApplications)
      .where(and(
        eq(leaveApplications.propertyId, period.propertyId),
        eq(leaveApplications.status, "pending"),
        sql`${leaveApplications.startDate} <= ${period.endDate} AND ${leaveApplications.endDate} >= ${period.startDate}`
      ));

    // Check unapproved penalties
    const pendingPenalties = await payrollDb
      .select({ count: sql<number>`count(*)::int` })
      .from(penalties)
      .where(and(
        eq(penalties.propertyId, period.propertyId),
        eq(penalties.status, "pending"),
        sql`${penalties.incidentDate} >= ${period.startDate} AND ${penalties.incidentDate} <= ${period.endDate}`
      ));

    // Check active monthly transactions
    const transactionsCount = await payrollDb
      .select({ count: sql<number>`count(*)::int` })
      .from(monthlyTransactions)
      .where(and(
        eq(monthlyTransactions.propertyId, period.propertyId),
        eq(monthlyTransactions.periodYear, period.year),
        eq(monthlyTransactions.periodMonth, period.month)
      ));

    res.json({
      success: true,
      period,
      isTransactionClosed: period.isTransactionClosed || false,
      transactionsClosedAt: period.transactionsClosedAt,
      transactionsClosedBy: period.transactionsClosedBy,
      checks: {
        pendingLeavesCount: pendingLeaves[0]?.count || 0,
        pendingPenaltiesCount: pendingPenalties[0]?.count || 0,
        monthlyTransactionsCount: transactionsCount[0]?.count || 0,
        leavesClosed: (pendingLeaves[0]?.count || 0) === 0,
        penaltiesClosed: (pendingPenalties[0]?.count || 0) === 0,
        readyForCalculation: true,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/payroll/periods/:id/close-transactions", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const periodId = Number(req.params.id);
    const user = (req as any).user?.username || "admin";

    const [period] = await payrollDb.select().from(payrollPeriods).where(eq(payrollPeriods.id, periodId));
    if (!period) return res.status(404).json({ success: false, error: "Payroll period not found" });

    const [updated] = await payrollDb
      .update(payrollPeriods)
      .set({
        isTransactionClosed: true,
        transactionsClosedAt: new Date(),
        transactionsClosedBy: user,
      })
      .where(eq(payrollPeriods.id, periodId))
      .returning();

    res.json({
      success: true,
      message: `تم إقفال الحركات التمهيدية لشهر ${period.month}/${period.year} بنجاح ومطابقتها للاحتساب النهائي`,
      period: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 13. SST Special Tools: Yearly Vacations Rollover (ترحيل أرصدة الإجازات السنوي) ──────
router.post("/payroll/leaves/rollover-preview", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const { propertyId, year, maxCap } = req.body;
    if (!propertyId || !year) {
      return res.status(400).json({ success: false, error: "Property and target year are required" });
    }

    const cap = maxCap ? Number(maxCap) : 30;

    // Get active staff
    const staff = await payrollDb
      .select({
        id: employees.id,
        employeeCode: employees.employeeCode,
        fullName: employees.fullName,
        fullNameAr: employees.fullNameAr,
        department: departments.nameAr,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(and(
        eq(employees.propertyId, Number(propertyId)),
        eq(employees.status, "active")
      ))
      .orderBy(asc(employees.employeeCode));

    // Simulated / calculated rollover balances for the 4 SST buckets
    const preview = staff.map(emp => {
      const annual = Math.min(cap, 21); // statutory 21 days base
      const dayoff = 4; // weekly rest roll
      const holiday = 2; // public holidays roll
      const fourth = 0; // comp off roll
      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullNameAr || emp.fullName,
        department: emp.department || "عام",
        annualCarried: annual,
        dayoffCarried: dayoff,
        holidayCarried: holiday,
        fourthCarried: fourth,
        totalCarried: annual + dayoff + holiday + fourth,
        maxCap: cap,
      };
    });

    res.json({ success: true, year: Number(year), maxCap: cap, count: preview.length, records: preview, preview });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/payroll/leaves/rollover-post", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, year, maxCap, records } = req.body;
    const user = (req as any).user?.username || "admin";

    if (!propertyId || !year || !Array.isArray(records)) {
      return res.status(400).json({ success: false, error: "Property, year, and records array required" });
    }

    const inserted = [];
    for (const r of records) {
      const [entry] = await payrollDb
        .insert(leaveRolloverPostings)
        .values({
          propertyId: Number(propertyId),
          employeeId: Number(r.employeeId),
          year: Number(year),
          annualCarried: String(r.annualCarried || 0),
          dayoffCarried: String(r.dayoffCarried || 0),
          holidayCarried: String(r.holidayCarried || 0),
          fourthCarried: String(r.fourthCarried || 0),
          maxPostingCap: String(maxCap || 30),
          postedBy: user,
        })
        .onConflictDoUpdate({
          target: [leaveRolloverPostings.propertyId, leaveRolloverPostings.employeeId, leaveRolloverPostings.year],
          set: {
            annualCarried: String(r.annualCarried || 0),
            dayoffCarried: String(r.dayoffCarried || 0),
            holidayCarried: String(r.holidayCarried || 0),
            fourthCarried: String(r.fourthCarried || 0),
            postedBy: user,
            postedAt: new Date(),
          }
        })
        .returning();

      inserted.push(entry);
    }

    res.json({
      success: true,
      message: `تم ترحيل أرصدة الإجازات السنوي لـ ${inserted.length} موظف بنجاح لسنة ${year}`,
      count: inserted.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 14. SST Reports Catalog (فهرس التقارير الـ 20 المعتمد) ─────────────────────────
router.get("/payroll/reports/catalog", requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  const categories = [
    { id: "favorite", titleAr: "التقارير المفضلة", titleEn: "Favorite Reports", count: 8 },
    { id: "all", titleAr: "كافة التقارير المتاحة", titleEn: "All Reports", count: 85 },
    { id: "hr", titleAr: "شؤون العاملين والموظفين", titleEn: "Human Resources", count: 18 },
    { id: "official", titleAr: "التقارير الرسمية وحكومية", titleEn: "Official Reports (Form 1, 2, 6)", count: 6 },
    { id: "leaves", titleAr: "الإجازات والأرصدة المستحقة", titleEn: "Leaves And Vacations", count: 12 },
    { id: "budget", titleAr: "الموازنة التقديرية والتكلفة", titleEn: "Budget & Manpower Variance", count: 5 },
    { id: "payroll", titleAr: "مسيرات الرواتب والاستحقاقات", titleEn: "Payroll & Compensation", count: 16 },
    { id: "statistics", titleAr: "الإحصائيات ونسب التوزيع", titleEn: "Statistics & Demographics", count: 14 },
    { id: "training", titleAr: "التدريب والشهادات الفندقية", titleEn: "Training & Hospitality Certs", count: 7 },
    { id: "housing", titleAr: "سكن العاملين ورحلات الأتوبيس", titleEn: "Staff Housing & Bus Travel", count: 9 },
    { id: "foreigners", titleAr: "إقامات وتصاريح الأجانب", titleEn: "Foreigners & Work Permits", count: 6 },
    { id: "definitions", titleAr: "دليل التعريفات الأساسية", titleEn: "Basic Definitions Audit", count: 10 },
    { id: "appraisal", titleAr: "تقييم الأداء السنوي KPIs", titleEn: "Performance Appraisals", count: 8 },
    { id: "applications", titleAr: "طلبات التوظيف والترشيحات", titleEn: "Job Applications & ATS", count: 7 },
    { id: "archives", titleAr: "الأرشيف والمستندات الرقمية", titleEn: "Document Archives", count: 5 },
    { id: "other_expenses", titleAr: "مصروفات وإعانات أخرى", titleEn: "Other Expenses & Allowances", count: 6 },
    { id: "time_machine", titleAr: "سجلات البصمة والورديات", titleEn: "Time Machine Punches & Roster", count: 12 },
    { id: "special", titleAr: "التقارير الاستثنائية والرقابة", titleEn: "Special Control Reports", count: 9 },
    { id: "medical", titleAr: "العيادة والتأمين الطبي", titleEn: "Medical & Clinic Visits", count: 8 },
    { id: "new_hire", titleAr: "مسوغات ونماذج التعيين", titleEn: "New Hire Onboarding Checklists", count: 7 },
  ];

  res.json({ success: true, categories });
});

export default router;
