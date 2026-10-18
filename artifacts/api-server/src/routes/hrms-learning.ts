import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  properties, 
  trainingCourses, 
  trainingSessions, 
  trainingEnrollments, 
  appraisalCycles, 
  appraisalTemplates, 
  employeeAppraisals,
  employees
} from "@workspace/db-payroll";
import { eq, desc, and, asc } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 1. Training Courses ─────────────────────────────────────────────
router.get("/hrms/learning/courses", requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(trainingCourses).orderBy(asc(trainingCourses.nameEn));
    res.json({ success: true, courses: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/learning/courses", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { courseCode, nameEn, nameAr, category, durationHours, isMandatory, validityMonths } = req.body;
    if (!courseCode || !nameEn || !nameAr) {
      return res.status(400).json({ success: false, error: "Course code and names are required" });
    }

    const [created] = await payrollDb.insert(trainingCourses).values({
      courseCode,
      nameEn,
      nameAr,
      category: category || "Hospitality",
      durationHours: durationHours ? Number(durationHours) : 4,
      isMandatory: Boolean(isMandatory),
      validityMonths: validityMonths ? Number(validityMonths) : null,
    }).returning();

    res.status(201).json({ success: true, course: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Training Sessions ────────────────────────────────────────────
router.get("/hrms/learning/sessions", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(trainingSessions).where(eq(trainingSessions.propertyId, propertyId)).orderBy(desc(trainingSessions.startDate))
      : payrollDb.select().from(trainingSessions).orderBy(desc(trainingSessions.startDate));
    const list = await query;
    res.json({ success: true, sessions: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/learning/sessions", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { courseId, propertyId, trainerName, startDate, endDate, locationVenue, maxCapacity } = req.body;
    if (!courseId || !propertyId || !trainerName || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "Course, property, trainer, and dates are required" });
    }

    const [created] = await payrollDb.insert(trainingSessions).values({
      courseId: Number(courseId),
      propertyId: Number(propertyId),
      trainerName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      locationVenue,
      maxCapacity: maxCapacity ? Number(maxCapacity) : 25,
      status: "scheduled",
    }).returning();

    res.status(201).json({ success: true, session: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. Training Enrollments ─────────────────────────────────────────
router.get("/hrms/learning/enrollments", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    const conditions = [];
    if (sessionId) conditions.push(eq(trainingEnrollments.sessionId, sessionId));
    if (employeeId) conditions.push(eq(trainingEnrollments.employeeId, employeeId));

    const query = conditions.length > 0
      ? payrollDb.select().from(trainingEnrollments).where(and(...conditions)).orderBy(desc(trainingEnrollments.createdAt))
      : payrollDb.select().from(trainingEnrollments).orderBy(desc(trainingEnrollments.createdAt));
    const list = await query;
    res.json({ success: true, enrollments: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/learning/enrollments", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { sessionId, employeeId } = req.body;
    if (!sessionId || !employeeId) {
      return res.status(400).json({ success: false, error: "Session and employee are required" });
    }

    const [created] = await payrollDb.insert(trainingEnrollments).values({
      sessionId: Number(sessionId),
      employeeId: Number(employeeId),
      attendanceStatus: "enrolled",
    }).returning();

    res.status(201).json({ success: true, enrollment: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. Performance Appraisal Cycles & Templates ─────────────────────
router.get("/hrms/appraisals/cycles", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(appraisalCycles).where(eq(appraisalCycles.propertyId, propertyId)).orderBy(desc(appraisalCycles.applicableYear))
      : payrollDb.select().from(appraisalCycles).orderBy(desc(appraisalCycles.applicableYear));
    const list = await query;
    res.json({ success: true, cycles: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/appraisals/cycles", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, nameEn, nameAr, startDate, endDate, applicableYear } = req.body;
    if (!propertyId || !nameEn || !nameAr || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "Property, names, and dates are required" });
    }

    const [created] = await payrollDb.insert(appraisalCycles).values({
      propertyId: Number(propertyId),
      nameEn,
      nameAr,
      startDate,
      endDate,
      applicableYear: applicableYear ? Number(applicableYear) : 2026,
      status: "active",
    }).returning();

    res.status(201).json({ success: true, cycle: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/hrms/appraisals/templates", requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(appraisalTemplates);
    res.json({ success: true, templates: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. Employee Appraisals ──────────────────────────────────────────
router.get("/hrms/appraisals", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const cycleId = req.query.cycleId ? Number(req.query.cycleId) : undefined;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    const conditions = [];
    if (cycleId) conditions.push(eq(employeeAppraisals.cycleId, cycleId));
    if (employeeId) conditions.push(eq(employeeAppraisals.employeeId, employeeId));

    const query = conditions.length > 0
      ? payrollDb.select().from(employeeAppraisals).where(and(...conditions)).orderBy(desc(employeeAppraisals.createdAt))
      : payrollDb.select().from(employeeAppraisals).orderBy(desc(employeeAppraisals.createdAt));
    const list = await query;
    res.json({ success: true, appraisals: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/appraisals", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { cycleId, templateId, employeeId } = req.body;
    if (!cycleId || !templateId || !employeeId) {
      return res.status(400).json({ success: false, error: "Cycle, template, and employee are required" });
    }

    const [created] = await payrollDb.insert(employeeAppraisals).values({
      cycleId: Number(cycleId),
      templateId: Number(templateId),
      employeeId: Number(employeeId),
      status: "pending_self",
    }).returning();

    res.status(201).json({ success: true, appraisal: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put("/hrms/appraisals/:id", requirePermission("payroll", "edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { selfScore, managerScore, finalScore, performanceBand, strengths, developmentNeeds, status } = req.body;

    const [updated] = await payrollDb.update(employeeAppraisals).set({
      selfScore: selfScore ? String(selfScore) : undefined,
      managerScore: managerScore ? String(managerScore) : undefined,
      finalScore: finalScore ? String(finalScore) : undefined,
      performanceBand,
      strengths,
      developmentNeeds,
      status: status || undefined,
      completedAt: status === "completed" ? new Date() : undefined,
    }).where(eq(employeeAppraisals.id, id)).returning();

    res.json({ success: true, appraisal: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
