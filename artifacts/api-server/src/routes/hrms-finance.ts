import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  properties, 
  departments, 
  payrollBudgets, 
  glAccounts, 
  glJournalEntries, 
  glJournalLines,
  payrollRuns
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

// Generate GL Journal Voucher from approved Payroll Run
router.post("/hrms/finance/journal-entries/generate/:payrollRunId", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const payrollRunId = Number(req.params.payrollRunId);
    const [run] = await payrollDb.select().from(payrollRuns).where(eq(payrollRuns.id, payrollRunId));
    if (!run) return res.status(404).json({ success: false, error: "Payroll run not found" });

    const voucherNumber = `JV-PAY-${Date.now().toString().slice(-6)}`;
    const voucherDate = new Date().toISOString().split("T")[0];
    const totalAmount = String(run.totalNetPay || "0.00");

    const [entry] = await payrollDb.insert(glJournalEntries).values({
      payrollRunId,
      propertyId: run.propertyId,
      voucherNumber,
      voucherDate,
      periodLabel: `Payroll ${run.periodId}`,
      totalDebit: totalAmount,
      totalCredit: totalAmount,
      isBalanced: true,
      isExportedToErp: false,
    }).returning();

    res.status(201).json({ success: true, journalEntry: entry });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
