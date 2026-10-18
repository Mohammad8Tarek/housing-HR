import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  properties, 
  departments, 
  legalEntities, 
  costCenters, 
  sections, 
  jobGrades, 
  holidayCalendars, 
  approvalWorkflows, 
  approvalWorkflowSteps 
} from "@workspace/db-payroll";
import { eq, desc, and, asc } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 1. Organization Tree & Structure ────────────────────────────────
router.get("/hrms/organization/tree", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;

    const [legalList, propList, deptList, secList, ccList, gradesList] = await Promise.all([
      payrollDb.select().from(legalEntities).where(eq(legalEntities.isActive, true)),
      propertyId 
        ? payrollDb.select().from(properties).where(and(eq(properties.id, propertyId), eq(properties.isActive, true)))
        : payrollDb.select().from(properties).where(eq(properties.isActive, true)),
      propertyId
        ? payrollDb.select().from(departments).where(eq(departments.propertyId, propertyId))
        : payrollDb.select().from(departments),
      propertyId
        ? payrollDb.select().from(sections).where(eq(sections.propertyId, propertyId))
        : payrollDb.select().from(sections),
      propertyId
        ? payrollDb.select().from(costCenters).where(eq(costCenters.propertyId, propertyId))
        : payrollDb.select().from(costCenters),
      payrollDb.select().from(jobGrades).where(eq(jobGrades.isActive, true)).orderBy(asc(jobGrades.levelOrder)),
    ]);

    // Build hierarchical tree
    const tree = legalList.map(le => ({
      ...le,
      properties: propList.map(prop => ({
        ...prop,
        departments: deptList.filter(d => d.propertyId === prop.id).map(dept => ({
          ...dept,
          sections: secList.filter(s => s.departmentId === dept.id),
        })),
        costCenters: ccList.filter(c => c.propertyId === prop.id),
      }))
    }));

    res.json({
      success: true,
      tree,
      grades: gradesList,
      counts: {
        legalEntities: legalList.length,
        properties: propList.length,
        departments: deptList.length,
        sections: secList.length,
        costCenters: ccList.length,
        jobGrades: gradesList.length,
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Legal Entities ───────────────────────────────────────────────
router.get("/hrms/legal-entities", requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(legalEntities).orderBy(desc(legalEntities.createdAt));
    res.json({ success: true, legalEntities: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/legal-entities", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { nameEn, nameAr, commercialRegistrationNo, taxCardNo, socialInsuranceOffice, socialInsuranceNo, registeredAddress } = req.body;
    if (!nameEn || !nameAr) {
      return res.status(400).json({ success: false, error: "Both English and Arabic names are required" });
    }
    const [created] = await payrollDb.insert(legalEntities).values({
      nameEn,
      nameAr,
      commercialRegistrationNo,
      taxCardNo,
      socialInsuranceOffice,
      socialInsuranceNo,
      registeredAddress,
    }).returning();
    res.status(201).json({ success: true, legalEntity: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. Cost Centers (USALI Standard) ────────────────────────────────
router.get("/hrms/cost-centers", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(costCenters).where(eq(costCenters.propertyId, propertyId)).orderBy(asc(costCenters.code))
      : payrollDb.select().from(costCenters).orderBy(asc(costCenters.code));
    const list = await query;
    res.json({ success: true, costCenters: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/cost-centers", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, legalEntityId, code, nameEn, nameAr, division } = req.body;
    if (!propertyId || !code || !nameEn || !nameAr) {
      return res.status(400).json({ success: false, error: "Property, code, and names are required" });
    }
    const [created] = await payrollDb.insert(costCenters).values({
      propertyId: Number(propertyId),
      legalEntityId: legalEntityId ? Number(legalEntityId) : null,
      code,
      nameEn,
      nameAr,
      division: division || "Rooms",
    }).returning();
    res.status(201).json({ success: true, costCenter: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. Sections ─────────────────────────────────────────────────────
router.get("/hrms/sections", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;

    let conditions = [];
    if (departmentId) conditions.push(eq(sections.departmentId, departmentId));
    if (propertyId) conditions.push(eq(sections.propertyId, propertyId));

    const query = conditions.length > 0
      ? payrollDb.select().from(sections).where(and(...conditions))
      : payrollDb.select().from(sections);
    const list = await query;
    res.json({ success: true, sections: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/sections", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { departmentId, propertyId, costCenterId, nameEn, nameAr, code } = req.body;
    if (!departmentId || !propertyId || !nameEn || !nameAr) {
      return res.status(400).json({ success: false, error: "Department, property, and names are required" });
    }
    const [created] = await payrollDb.insert(sections).values({
      departmentId: Number(departmentId),
      propertyId: Number(propertyId),
      costCenterId: costCenterId ? Number(costCenterId) : null,
      nameEn,
      nameAr,
      code,
    }).returning();
    res.status(201).json({ success: true, section: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. Hospitality Job Grades ───────────────────────────────────────
router.get("/hrms/job-grades", requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(jobGrades).orderBy(asc(jobGrades.levelOrder));
    res.json({ success: true, jobGrades: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/job-grades", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { code, nameEn, nameAr, levelOrder, minSalary, maxSalary, serviceChargePoints, housingEligibility } = req.body;
    if (!code || !nameEn || !nameAr) {
      return res.status(400).json({ success: false, error: "Code and names are required" });
    }
    const [created] = await payrollDb.insert(jobGrades).values({
      code,
      nameEn,
      nameAr,
      levelOrder: levelOrder ? Number(levelOrder) : 1,
      minSalary: minSalary ? String(minSalary) : "0.00",
      maxSalary: maxSalary ? String(maxSalary) : "0.00",
      serviceChargePoints: serviceChargePoints ? String(serviceChargePoints) : "1.00",
      housingEligibility: housingEligibility || "shared",
    }).returning();
    res.status(201).json({ success: true, jobGrade: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 6. Egyptian & Religious Holiday Calendars ───────────────────────
router.get("/hrms/holidays", requirePermission("attendance", "view"), async (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : 2026;
    const list = await payrollDb.select().from(holidayCalendars).where(eq(holidayCalendars.applicableYear, year)).orderBy(asc(holidayCalendars.holidayDate));
    res.json({ success: true, holidays: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/holidays", requirePermission("attendance", "create"), async (req: Request, res: Response) => {
  try {
    const { nameEn, nameAr, holidayDate, durationDays, isReligious, overtimeMultiplier, applicableYear } = req.body;
    if (!nameEn || !nameAr || !holidayDate) {
      return res.status(400).json({ success: false, error: "Names and holiday date are required" });
    }
    const [created] = await payrollDb.insert(holidayCalendars).values({
      nameEn,
      nameAr,
      holidayDate,
      durationDays: durationDays ? Number(durationDays) : 1,
      isReligious: Boolean(isReligious),
      overtimeMultiplier: overtimeMultiplier ? String(overtimeMultiplier) : "2.00",
      applicableYear: applicableYear ? Number(applicableYear) : 2026,
    }).returning();
    res.status(201).json({ success: true, holiday: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 7. Approval Workflows ───────────────────────────────────────────
router.get("/hrms/workflows", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId
      ? payrollDb.select().from(approvalWorkflows).where(eq(approvalWorkflows.propertyId, propertyId))
      : payrollDb.select().from(approvalWorkflows);
    const workflows = await query;

    const steps = await payrollDb.select().from(approvalWorkflowSteps).orderBy(asc(approvalWorkflowSteps.stepOrder));

    const result = workflows.map(wf => ({
      ...wf,
      steps: steps.filter(s => s.workflowId === wf.id),
    }));

    res.json({ success: true, workflows: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
