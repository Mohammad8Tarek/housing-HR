import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  properties, 
  departments, 
  designations, 
  manpowerRequisitions, 
  jobVacancies, 
  candidates, 
  candidateInterviews, 
  jobOffers, 
  onboardingTasks,
  employees
} from "@workspace/db-payroll";
import { eq, desc, and, asc } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 1. Manpower Requisitions ────────────────────────────────────────
router.get("/hrms/recruitment/requisitions", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(manpowerRequisitions).where(eq(manpowerRequisitions.propertyId, propertyId)).orderBy(desc(manpowerRequisitions.createdAt))
      : payrollDb.select().from(manpowerRequisitions).orderBy(desc(manpowerRequisitions.createdAt));
    const list = await query;
    res.json({ success: true, requisitions: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/recruitment/requisitions", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, departmentId, designationId, requiredCount, reasonForRequest, expectedJoiningDate, notes } = req.body;
    if (!propertyId || !departmentId || !designationId) {
      return res.status(400).json({ success: false, error: "Property, department, and designation are required" });
    }

    const requisitionNumber = `REQ-${Date.now().toString().slice(-6)}`;

    const [created] = await payrollDb.insert(manpowerRequisitions).values({
      requisitionNumber,
      propertyId: Number(propertyId),
      departmentId: Number(departmentId),
      designationId: Number(designationId),
      requiredCount: requiredCount ? Number(requiredCount) : 1,
      reasonForRequest: reasonForRequest || "replacement",
      expectedJoiningDate: expectedJoiningDate || null,
      notes,
      status: "draft",
    }).returning();

    res.status(201).json({ success: true, requisition: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/hrms/recruitment/requisitions/:id/status", requirePermission("payroll", "edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // draft, pending_gm, approved, rejected, fulfilled
    const [updated] = await payrollDb.update(manpowerRequisitions).set({
      status,
      gmApprovalDate: status === "approved" ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(manpowerRequisitions.id, id)).returning();
    res.json({ success: true, requisition: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Job Vacancies ────────────────────────────────────────────────
router.get("/hrms/recruitment/vacancies", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(jobVacancies).where(eq(jobVacancies.propertyId, propertyId)).orderBy(desc(jobVacancies.postedDate))
      : payrollDb.select().from(jobVacancies).orderBy(desc(jobVacancies.postedDate));
    const list = await query;
    res.json({ success: true, vacancies: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/recruitment/vacancies", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { requisitionId, propertyId, titleEn, titleAr, description, requirements, experienceYearsMin, postedDate, closingDate } = req.body;
    if (!propertyId || !titleEn || !titleAr || !postedDate) {
      return res.status(400).json({ success: false, error: "Property, titles, and posted date are required" });
    }

    const [created] = await payrollDb.insert(jobVacancies).values({
      requisitionId: requisitionId ? Number(requisitionId) : null,
      propertyId: Number(propertyId),
      titleEn,
      titleAr,
      description,
      requirements,
      experienceYearsMin: experienceYearsMin ? Number(experienceYearsMin) : 1,
      postedDate,
      closingDate: closingDate || null,
      status: "open",
    }).returning();

    res.status(201).json({ success: true, vacancy: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. Candidates (ATS Pipeline) ────────────────────────────────────
router.get("/hrms/recruitment/candidates", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const vacancyId = req.query.vacancyId ? Number(req.query.vacancyId) : undefined;
    const stage = req.query.stage as string | undefined;

    const conditions = [];
    if (vacancyId) conditions.push(eq(candidates.vacancyId, vacancyId));
    if (stage && stage !== "all") conditions.push(eq(candidates.stage, stage));

    const query = conditions.length > 0 
      ? payrollDb.select().from(candidates).where(and(...conditions)).orderBy(desc(candidates.createdAt))
      : payrollDb.select().from(candidates).orderBy(desc(candidates.createdAt));
    const list = await query;
    res.json({ success: true, candidates: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/recruitment/candidates", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { vacancyId, fullName, fullNameAr, email, phoneNumber, nationalId, resumeUrl, currentPosition, expectedSalary } = req.body;
    if (!fullName || !email || !phoneNumber) {
      return res.status(400).json({ success: false, error: "Full name, email, and phone number are required" });
    }

    const [created] = await payrollDb.insert(candidates).values({
      vacancyId: vacancyId ? Number(vacancyId) : null,
      fullName,
      fullNameAr,
      email,
      phoneNumber,
      nationalId,
      resumeUrl,
      currentPosition,
      expectedSalary: expectedSalary ? String(expectedSalary) : null,
      stage: "applied",
    }).returning();

    res.status(201).json({ success: true, candidate: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/hrms/recruitment/candidates/:id/stage", requirePermission("payroll", "edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { stage, rating, rejectionReason } = req.body; // applied, screened, interviewed, offer_made, hired, rejected
    const [updated] = await payrollDb.update(candidates).set({
      stage,
      rating: rating !== undefined ? Number(rating) : undefined,
      rejectionReason,
      updatedAt: new Date(),
    }).where(eq(candidates.id, id)).returning();
    res.json({ success: true, candidate: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. Candidate Interviews ─────────────────────────────────────────
router.get("/hrms/recruitment/interviews", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const candidateId = req.query.candidateId ? Number(req.query.candidateId) : undefined;
    const query = candidateId
      ? payrollDb.select().from(candidateInterviews).where(eq(candidateInterviews.candidateId, candidateId)).orderBy(asc(candidateInterviews.scheduledAt))
      : payrollDb.select().from(candidateInterviews).orderBy(desc(candidateInterviews.scheduledAt));
    const list = await query;
    res.json({ success: true, interviews: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/recruitment/interviews", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { candidateId, interviewRound, scheduledAt, locationOrLink, technicalScore, englishScore, appearanceAttitudeScore, feedbackNotes, recommendation } = req.body;
    if (!candidateId || !scheduledAt) {
      return res.status(400).json({ success: false, error: "Candidate and scheduled date/time are required" });
    }

    const [created] = await payrollDb.insert(candidateInterviews).values({
      candidateId: Number(candidateId),
      interviewRound: interviewRound ? Number(interviewRound) : 1,
      scheduledAt: new Date(scheduledAt),
      locationOrLink,
      technicalScore: technicalScore ? Number(technicalScore) : 0,
      englishScore: englishScore ? Number(englishScore) : 0,
      appearanceAttitudeScore: appearanceAttitudeScore ? Number(appearanceAttitudeScore) : 0,
      feedbackNotes,
      recommendation: recommendation || "undecided",
    }).returning();

    // Advance candidate to 'interviewed' stage
    await payrollDb.update(candidates).set({ stage: "interviewed", updatedAt: new Date() }).where(eq(candidates.id, Number(candidateId)));

    res.status(201).json({ success: true, interview: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. Job Offers & Hires ───────────────────────────────────────────
router.get("/hrms/recruitment/offers", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(jobOffers).where(eq(jobOffers.propertyId, propertyId)).orderBy(desc(jobOffers.createdAt))
      : payrollDb.select().from(jobOffers).orderBy(desc(jobOffers.createdAt));
    const list = await query;
    res.json({ success: true, offers: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/recruitment/offers", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { candidateId, propertyId, designationId, basicSalary, livingAllowance, offerDate, validUntil, expectedJoiningDate } = req.body;
    if (!candidateId || !propertyId || !designationId || !basicSalary || !offerDate || !validUntil) {
      return res.status(400).json({ success: false, error: "Candidate, property, designation, salary, and dates are required" });
    }

    const [created] = await payrollDb.insert(jobOffers).values({
      candidateId: Number(candidateId),
      propertyId: Number(propertyId),
      designationId: Number(designationId),
      basicSalary: String(basicSalary),
      livingAllowance: livingAllowance ? String(livingAllowance) : "0.00",
      offerDate,
      validUntil,
      expectedJoiningDate: expectedJoiningDate || null,
      status: "sent",
    }).returning();

    await payrollDb.update(candidates).set({ stage: "offer_made", updatedAt: new Date() }).where(eq(candidates.id, Number(candidateId)));

    res.status(201).json({ success: true, offer: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 6. Convert Candidate to Employee ────────────────────────────────
router.post("/hrms/recruitment/candidates/:id/convert-to-employee", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const candidateId = Number(req.params.id);
    const { propertyId, employeeCode, departmentId, designationId, joiningDate, baseSalary } = req.body;

    const [cand] = await payrollDb.select().from(candidates).where(eq(candidates.id, candidateId));
    if (!cand) return res.status(404).json({ success: false, error: "Candidate not found" });

    const nameParts = cand.fullName.split(" ");
    const firstName = nameParts[0] || cand.fullName;
    const lastName = nameParts[nameParts.length - 1] || "Staff";

    const [newEmp] = await payrollDb.insert(employees).values({
      propertyId: Number(propertyId),
      employeeCode,
      firstName,
      lastName,
      fullName: cand.fullName,
      fullNameAr: cand.fullNameAr || cand.fullName,
      nationalId: cand.nationalId,
      phone: cand.phoneNumber,
      email: cand.email,
      departmentId: departmentId ? Number(departmentId) : null,
      designationId: designationId ? Number(designationId) : null,
      joiningDate: joiningDate || new Date().toISOString().split("T")[0],
      baseSalary: baseSalary ? String(baseSalary) : (cand.expectedSalary ? String(cand.expectedSalary) : "0.00"),
      status: "active",
    }).returning();

    // Mark candidate as hired
    await payrollDb.update(candidates).set({ stage: "hired", updatedAt: new Date() }).where(eq(candidates.id, candidateId));

    // Create standard onboarding tasks
    await payrollDb.insert(onboardingTasks).values([
      { candidateId, employeeId: newEmp.id, propertyId: Number(propertyId), taskCategory: "medical_fit", titleEn: "Food Handler Health Card & Medical Examination", titleAr: "الفحص الطبي واستخراج الشهادة الصحية" },
      { candidateId, employeeId: newEmp.id, propertyId: Number(propertyId), taskCategory: "housing", titleEn: "Housing Unit Bed Allocation & Hotek PMS Key Card", titleAr: "تسكين السكن الإداري وإصدار بطاقة فتح الباب" },
      { candidateId, employeeId: newEmp.id, propertyId: Number(propertyId), taskCategory: "uniform", titleEn: "Hospitality Uniform Fitting & Name Tag Delivery", titleAr: "تسليم الزي الرسمي وكارنيه الاسم" },
      { candidateId, employeeId: newEmp.id, propertyId: Number(propertyId), taskCategory: "contract_sign", titleEn: "Sign Egyptian Labor Law Contract & Form 1 Insurance", titleAr: "توقيع عقد العمل واستمارة 1 تأمينات" },
    ]);

    res.status(201).json({ success: true, employee: newEmp });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 7. Onboarding Tasks ─────────────────────────────────────────────
router.get("/hrms/recruitment/onboarding-tasks", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
    const query = employeeId
      ? payrollDb.select().from(onboardingTasks).where(eq(onboardingTasks.employeeId, employeeId))
      : payrollDb.select().from(onboardingTasks).orderBy(desc(onboardingTasks.createdAt));
    const list = await query;
    res.json({ success: true, tasks: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/hrms/recruitment/onboarding-tasks/:id", requirePermission("payroll", "edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, notes } = req.body;
    const [updated] = await payrollDb.update(onboardingTasks).set({
      status,
      notes,
      completedAt: status === "completed" ? new Date() : null,
    }).where(eq(onboardingTasks.id, id)).returning();
    res.json({ success: true, task: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
