import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  properties, 
  departments, 
  payrollBudgets, 
  glAccounts, 
  glJournalEntries, 
  glJournalLines,
  payrollRuns,
  salarySlips,
  hrmsAuditLogs,
} from "@workspace/db-payroll";
import { eq, desc, and, asc } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 1. GL Chart of Accounts ─────────────────────────────────────────
router.get("/hrms/finance/gl-accounts", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(glAccounts).where(eq(glAccounts.propertyId, propertyId)).orderBy(asc(glAccounts.accountNumber))
      : payrollDb.select().from(glAccounts).orderBy(asc(glAccounts.accountNumber));
    const list = await query;
    res.json({ success: true, accounts: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/finance/gl-accounts", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, accountNumber, accountNameEn, accountNameAr, accountType, subLedgerCode } = req.body;
    if (!propertyId || !accountNumber || !accountNameEn || !accountNameAr || !accountType) {
      return res.status(400).json({ success: false, error: "Property, account number, names, and account type are required" });
    }

    const [created] = await payrollDb.insert(glAccounts).values({
      propertyId: Number(propertyId),
      accountNumber,
      accountNameEn,
      accountNameAr,
      accountType, // expense, liability, clearing
      subLedgerCode,
    }).returning();

    res.status(201).json({ success: true, account: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Payroll Budgets (USALI Standard) ─────────────────────────────
router.get("/hrms/finance/budgets", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const fiscalYear = req.query.year ? Number(req.query.year) : 2026;

    const conditions = [eq(payrollBudgets.fiscalYear, fiscalYear)];
    if (propertyId) conditions.push(eq(payrollBudgets.propertyId, propertyId));

    const list = await payrollDb
      .select({
        id: payrollBudgets.id,
        propertyId: payrollBudgets.propertyId,
        propertyName: properties.nameEn,
        departmentId: payrollBudgets.departmentId,
        departmentName: departments.nameEn,
        departmentNameAr: departments.nameAr,
        fiscalYear: payrollBudgets.fiscalYear,
        fiscalMonth: payrollBudgets.fiscalMonth,
        approvedHeadcount: payrollBudgets.approvedHeadcount,
        allocatedBudget: payrollBudgets.allocatedBudget,
        actualSpent: payrollBudgets.actualSpent,
        variance: payrollBudgets.variance,
        createdAt: payrollBudgets.createdAt,
      })
      .from(payrollBudgets)
      .leftJoin(properties, eq(payrollBudgets.propertyId, properties.id))
      .leftJoin(departments, eq(payrollBudgets.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(asc(payrollBudgets.fiscalMonth));

    res.json({ success: true, budgets: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/finance/budgets", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, departmentId, fiscalYear, fiscalMonth, approvedHeadcount, allocatedBudget } = req.body;
    if (!propertyId || !departmentId || !fiscalMonth || !approvedHeadcount || !allocatedBudget) {
      return res.status(400).json({ success: false, error: "Property, department, month, headcount, and budget are required" });
    }

    const [created] = await payrollDb.insert(payrollBudgets).values({
      propertyId: Number(propertyId),
      departmentId: Number(departmentId),
      fiscalYear: fiscalYear ? Number(fiscalYear) : 2026,
      fiscalMonth: Number(fiscalMonth),
      approvedHeadcount: Number(approvedHeadcount),
      allocatedBudget: String(allocatedBudget),
    }).returning();

    res.status(201).json({ success: true, budget: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. GL Journal Vouchers ──────────────────────────────────────────
router.get("/hrms/finance/journal-entries", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId
      ? payrollDb.select().from(glJournalEntries).where(eq(glJournalEntries.propertyId, propertyId)).orderBy(desc(glJournalEntries.voucherDate))
      : payrollDb.select().from(glJournalEntries).orderBy(desc(glJournalEntries.voucherDate));
    const entries = await query;

    // Load lines for each entry
    const entryIds = entries.map(e => e.id);
    const lines = entryIds.length > 0 
      ? await payrollDb.select().from(glJournalLines)
      : [];

    const result = entries.map(entry => ({
      ...entry,
      lines: lines.filter(l => l.journalEntryId === entry.id),
    }));

    res.json({ success: true, journalEntries: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Generate GL Journal Voucher and balanced double-entry lines from approved Payroll Run
router.post("/hrms/finance/journal-entries/generate/:payrollRunId", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const payrollRunId = Number(req.params.payrollRunId);
    const session = req.session as any;

    const [run] = await payrollDb.select().from(payrollRuns).where(eq(payrollRuns.id, payrollRunId));
    if (!run) {
      return res.status(404).json({ success: false, error: "Payroll run not found" });
    }

    // Strict status enforcement: only approved or closed payroll runs can be posted to the GL
    if (run.status !== "approved" && run.status !== "closed") {
      return res.status(400).json({
        success: false,
        error: "لا يمكن إنشاء قيد يومية عامة إلا لمسير رواتب معتمد أو مقفل نهائياً (Approved / Closed)",
      });
    }

    // Prevent duplicate GL vouchers for the same payroll run
    const [existingVoucher] = await payrollDb
      .select()
      .from(glJournalEntries)
      .where(eq(glJournalEntries.payrollRunId, payrollRunId));

    if (existingVoucher) {
      return res.status(409).json({
        success: false,
        error: `تم إنشاء قيد يومية عامة لهذا المسير مسبقاً برقم ${existingVoucher.voucherNumber}`,
        existingVoucherId: existingVoucher.id,
      });
    }

    // Query all salary slips
    const slips = await payrollDb
      .select()
      .from(salarySlips)
      .where(eq(salarySlips.payrollRunId, payrollRunId));

    if (slips.length === 0) {
      return res.status(400).json({
        success: false,
        error: "لا توجد قسائم رواتب محسوبة لهذا المسير لإنشاء قيد اليومية",
      });
    }

    // Ensure required USALI standard chart of accounts exists for this property
    const defaultAccounts = [
      { accountNumber: "51010", accountNameEn: "Basic Salaries Expense", accountNameAr: "مصروف الرواتب الأساسية", accountType: "expense" },
      { accountNumber: "51020", accountNameEn: "Overtime & Allowances Expense", accountNameAr: "مصروف العمل الإضافي والبدلات", accountType: "expense" },
      { accountNumber: "51040", accountNameEn: "Employer Social Insurance Expense", accountNameAr: "مصروف التأمينات الاجتماعية - حصة المنشأة", accountType: "expense" },
      { accountNumber: "21010", accountNameEn: "Accrued Net Salaries Payable", accountNameAr: "مستحقات رواتب العاملين الصافية", accountType: "liability" },
      { accountNumber: "21020", accountNameEn: "Social Insurance Authority Payable", accountNameAr: "مصلحة التأمينات الاجتماعية المستحقة", accountType: "liability" },
      { accountNumber: "21030", accountNameEn: "Accrued Payroll Income Tax Payable", accountNameAr: "مصلحة الضرائب - كسب العمل المستحق", accountType: "liability" },
      { accountNumber: "21040", accountNameEn: "Clearing - Staff Loans & Disciplinary Deductions", accountNameAr: "حساب تسوية السلف والجزاءات والغياب", accountType: "clearing" },
    ];

    // Atomic execution inside a PostgreSQL transaction
    const journalResult = await payrollDb.transaction(async (tx) => {
      // Provision any missing accounts
      const accountMap: Record<string, number> = {};
      for (const acc of defaultAccounts) {
        const [existing] = await tx
          .select()
          .from(glAccounts)
          .where(and(
            eq(glAccounts.propertyId, run.propertyId),
            eq(glAccounts.accountNumber, acc.accountNumber)
          ));

        if (existing) {
          accountMap[acc.accountNumber] = existing.id;
        } else {
          const [created] = await tx.insert(glAccounts).values({
            propertyId: run.propertyId,
            accountNumber: acc.accountNumber,
            accountNameEn: acc.accountNameEn,
            accountNameAr: acc.accountNameAr,
            accountType: acc.accountType,
          }).returning();
          accountMap[acc.accountNumber] = created.id;
        }
      }

      // Aggregate slip financial numbers with exact 2-decimal precision
      let totalBasic = 0;
      let totalOvertimeAndAllowances = 0;
      let totalEmployerGosi = 0;
      let totalNet = 0;
      let totalTax = 0;
      let totalGosiPayable = 0;

      for (const s of slips) {
        const basic = Number(s.basicSalary) || 0;
        const earnings = Number(s.totalEarnings) || 0;
        const overtime = Math.max(0, earnings - basic);
        const empGosi = Number(s.socialInsuranceEmployee) || 0;
        const compGosi = Number(s.socialInsuranceCompany) || 0;
        const net = Number(s.netSalary) || 0;
        const tax = Number(s.incomeTax) || 0;

        totalBasic += basic;
        totalOvertimeAndAllowances += overtime;
        totalEmployerGosi += compGosi;
        totalNet += net;
        totalTax += tax;
        totalGosiPayable += (empGosi + compGosi);
      }

      totalBasic = Math.round(totalBasic * 100) / 100;
      totalOvertimeAndAllowances = Math.round(totalOvertimeAndAllowances * 100) / 100;
      totalEmployerGosi = Math.round(totalEmployerGosi * 100) / 100;
      totalNet = Math.round(totalNet * 100) / 100;
      totalTax = Math.round(totalTax * 100) / 100;
      totalGosiPayable = Math.round(totalGosiPayable * 100) / 100;

      // Exact mathematical balancing (Debits == Credits):
      // Debits: Basic Salaries + Overtime & Allowances + Employer GOSI
      // Credits: Net Payable + GOSI Total Payable + Income Tax Payable + Clearing Account (Loans, Penalties, Martyr's Fund & Adjustments)
      const totalDebit = Math.round((totalBasic + totalOvertimeAndAllowances + totalEmployerGosi) * 100) / 100;
      const totalClearing = Math.round((totalDebit - (totalNet + totalTax + totalGosiPayable)) * 100) / 100;
      const totalCredit = Math.round((totalNet + totalTax + totalGosiPayable + totalClearing) * 100) / 100;

      const voucherNumber = `JV-PAY-${Date.now().toString().slice(-6)}`;
      const voucherDate = new Date().toISOString().split("T")[0];

      // 1. Insert Voucher Header
      const [entry] = await tx.insert(glJournalEntries).values({
        payrollRunId,
        propertyId: run.propertyId,
        voucherNumber,
        voucherDate,
        periodLabel: `Payroll Period #${run.payrollPeriodId}`,
        totalDebit: totalDebit.toFixed(2),
        totalCredit: totalCredit.toFixed(2),
        isBalanced: totalDebit === totalCredit,
        isExportedToErp: false,
      }).returning();

      // 2. Insert Balanced Double-Entry Lines
      const linesData = [
        // Debits (Expenses)
        {
          journalEntryId: entry.id,
          accountId: accountMap["51010"],
          description: "مصروف الرواتب الأساسية (Basic Salaries Expense)",
          debitAmount: totalBasic.toFixed(2),
          creditAmount: "0.00",
        },
        {
          journalEntryId: entry.id,
          accountId: accountMap["51020"],
          description: "مصروف العمل الإضافي والبدلات (Overtime & Allowances Expense)",
          debitAmount: totalOvertimeAndAllowances.toFixed(2),
          creditAmount: "0.00",
        },
        {
          journalEntryId: entry.id,
          accountId: accountMap["51040"],
          description: "حصة الشركة في التأمينات الاجتماعية (Employer GOSI Contribution)",
          debitAmount: totalEmployerGosi.toFixed(2),
          creditAmount: "0.00",
        },
        // Credits (Liabilities & Clearing)
        {
          journalEntryId: entry.id,
          accountId: accountMap["21010"],
          description: "صافي الرواتب المستحقة للعاملين (Net Salaries Payable)",
          debitAmount: "0.00",
          creditAmount: totalNet.toFixed(2),
        },
        {
          journalEntryId: entry.id,
          accountId: accountMap["21020"],
          description: "التأمينات الاجتماعية المستحقة - حصة العامل والمنشأة (GOSI Payable)",
          debitAmount: "0.00",
          creditAmount: totalGosiPayable.toFixed(2),
        },
        {
          journalEntryId: entry.id,
          accountId: accountMap["21030"],
          description: "ضريبة كسب العمل المستحقة (Payroll Tax Payable)",
          debitAmount: "0.00",
          creditAmount: totalTax.toFixed(2),
        },
        {
          journalEntryId: entry.id,
          accountId: accountMap["21040"],
          description: "وسيط تسوية السلف والجزاءات والغياب (Staff Loans, Penalties & Absence Clearing)",
          debitAmount: "0.00",
          creditAmount: totalClearing.toFixed(2),
        },
      ];

      const insertedLines = await tx.insert(glJournalLines).values(linesData).returning();

      // 3. Write Audit Log
      await tx.insert(hrmsAuditLogs).values({
        userId: session?.user?.id || 1,
        action: "GL_JOURNAL_GENERATE",
        entityType: "gl_journal_entries",
        entityId: entry.id,
        details: {
          payrollRunId,
          voucherNumber,
          totalDebit,
          totalCredit,
          linesCount: insertedLines.length,
        },
      });

      return {
        entry,
        lines: insertedLines,
      };
    });

    res.status(201).json({
      success: true,
      journalEntry: journalResult.entry,
      lines: journalResult.lines,
      message: "تم إنشاء قيد اليومية العامة ومطابقة المدين والدائن بنجاح تام",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
