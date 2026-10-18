import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  properties, 
  medicalRecords, 
  staffTransportRoutes, 
  staffTransportAssignments, 
  foreignEmployeeDocs, 
  documentCategories, 
  documentStorageRecords, 
  hrmsAuditLogs, 
  systemNotifications,
  employees
} from "@workspace/db-payroll";
import { eq, desc, and, asc } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 1. Occupational Health & Clinic Visits ──────────────────────────
router.get("/hrms/services/medical-records", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
    const query = employeeId
      ? payrollDb.select().from(medicalRecords).where(eq(medicalRecords.employeeId, employeeId)).orderBy(desc(medicalRecords.visitDate))
      : payrollDb.select().from(medicalRecords).orderBy(desc(medicalRecords.visitDate));
    const list = await query;
    res.json({ success: true, medicalRecords: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/services/medical-records", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { employeeId, visitDate, diagnosis, prescription, restDaysGranted, isWorkInjury, doctorName, foodHandlerCertExpiry } = req.body;
    if (!employeeId || !visitDate || !diagnosis || !doctorName) {
      return res.status(400).json({ success: false, error: "Employee, visit date, diagnosis, and doctor name are required" });
    }

    const [created] = await payrollDb.insert(medicalRecords).values({
      employeeId: Number(employeeId),
      visitDate,
      diagnosis,
      prescription,
      restDaysGranted: restDaysGranted ? Number(restDaysGranted) : 0,
      isWorkInjury: Boolean(isWorkInjury),
      doctorName,
      foodHandlerCertExpiry: foodHandlerCertExpiry || null,
    }).returning();

    res.status(201).json({ success: true, record: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Staff Transportation ─────────────────────────────────────────
router.get("/hrms/services/transport/routes", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(staffTransportRoutes).where(eq(staffTransportRoutes.propertyId, propertyId)).orderBy(asc(staffTransportRoutes.routeNameEn))
      : payrollDb.select().from(staffTransportRoutes).orderBy(asc(staffTransportRoutes.routeNameEn));
    const list = await query;
    res.json({ success: true, routes: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/services/transport/routes", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, routeNameEn, routeNameAr, vehicleNumber, driverName, driverPhone, seatingCapacity, departureTime } = req.body;
    if (!propertyId || !routeNameEn || !routeNameAr || !vehicleNumber) {
      return res.status(400).json({ success: false, error: "Property, route names, and vehicle number are required" });
    }

    const [created] = await payrollDb.insert(staffTransportRoutes).values({
      propertyId: Number(propertyId),
      routeNameEn,
      routeNameAr,
      vehicleNumber,
      driverName,
      driverPhone,
      seatingCapacity: seatingCapacity ? Number(seatingCapacity) : 30,
      departureTime,
    }).returning();

    res.status(201).json({ success: true, route: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/hrms/services/transport/assignments", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const routeId = req.query.routeId ? Number(req.query.routeId) : undefined;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    const conditions = [];
    if (routeId) conditions.push(eq(staffTransportAssignments.routeId, routeId));
    if (employeeId) conditions.push(eq(staffTransportAssignments.employeeId, employeeId));

    const query = conditions.length > 0
      ? payrollDb.select().from(staffTransportAssignments).where(and(...conditions))
      : payrollDb.select().from(staffTransportAssignments);
    const list = await query;
    res.json({ success: true, assignments: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/services/transport/assignments", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { routeId, employeeId, pickupPoint, monthlyDeduction } = req.body;
    if (!routeId || !employeeId || !pickupPoint) {
      return res.status(400).json({ success: false, error: "Route, employee, and pickup point are required" });
    }

    const [created] = await payrollDb.insert(staffTransportAssignments).values({
      routeId: Number(routeId),
      employeeId: Number(employeeId),
      pickupPoint,
      monthlyDeduction: monthlyDeduction ? String(monthlyDeduction) : "0.00",
    }).returning();

    res.status(201).json({ success: true, assignment: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. Foreign Employee Visas & Work Permits ────────────────────────
router.get("/hrms/services/foreign-docs", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;
    const query = employeeId
      ? payrollDb.select().from(foreignEmployeeDocs).where(eq(foreignEmployeeDocs.employeeId, employeeId))
      : payrollDb.select().from(foreignEmployeeDocs).orderBy(desc(foreignEmployeeDocs.createdAt));
    const list = await query;
    res.json({ success: true, foreignDocs: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/services/foreign-docs", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { employeeId, passportNumber, passportExpiryDate, workPermitNumber, workPermitExpiryDate, residencyVisaExpiryDate, securityClearanceStatus } = req.body;
    if (!employeeId || !passportNumber || !passportExpiryDate) {
      return res.status(400).json({ success: false, error: "Employee, passport number, and passport expiry are required" });
    }

    const [created] = await payrollDb.insert(foreignEmployeeDocs).values({
      employeeId: Number(employeeId),
      passportNumber,
      passportExpiryDate,
      workPermitNumber,
      workPermitExpiryDate: workPermitExpiryDate || null,
      residencyVisaExpiryDate: residencyVisaExpiryDate || null,
      securityClearanceStatus: securityClearanceStatus || "pending",
    }).returning();

    res.status(201).json({ success: true, doc: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. Document Categories & Central Storage ────────────────────────
router.get("/hrms/services/document-categories", requirePermission("payroll", "view"), async (_req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(documentCategories);
    res.json({ success: true, categories: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/hrms/services/documents", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : undefined;

    const conditions = [];
    if (propertyId) conditions.push(eq(documentStorageRecords.propertyId, propertyId));
    if (employeeId) conditions.push(eq(documentStorageRecords.employeeId, employeeId));

    const query = conditions.length > 0
      ? payrollDb.select().from(documentStorageRecords).where(and(...conditions)).orderBy(desc(documentStorageRecords.createdAt))
      : payrollDb.select().from(documentStorageRecords).orderBy(desc(documentStorageRecords.createdAt));
    const list = await query;
    res.json({ success: true, documents: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hrms/services/documents", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, categoryId, employeeId, title, fileUrl, fileSize, mimeType, expiryDate } = req.body;
    if (!propertyId || !categoryId || !title || !fileUrl) {
      return res.status(400).json({ success: false, error: "Property, category, title, and file URL are required" });
    }

    const [created] = await payrollDb.insert(documentStorageRecords).values({
      propertyId: Number(propertyId),
      categoryId: Number(categoryId),
      employeeId: employeeId ? Number(employeeId) : null,
      title,
      fileUrl,
      fileSize: fileSize ? Number(fileSize) : null,
      mimeType,
      expiryDate: expiryDate || null,
    }).returning();

    res.status(201).json({ success: true, document: created });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. Security & Activity Audit Logs ───────────────────────────────
router.get("/hrms/services/audit-logs", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(hrmsAuditLogs).where(eq(hrmsAuditLogs.propertyId, propertyId)).orderBy(desc(hrmsAuditLogs.createdAt)).limit(100)
      : payrollDb.select().from(hrmsAuditLogs).orderBy(desc(hrmsAuditLogs.createdAt)).limit(100);
    const list = await query;
    res.json({ success: true, logs: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 6. In-App Notifications ─────────────────────────────────────────
router.get("/hrms/services/notifications", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const targetUserId = (req.session as any)?.hrUserId || 1;
    const list = await payrollDb.select().from(systemNotifications).where(eq(systemNotifications.targetUserId, targetUserId)).orderBy(desc(systemNotifications.createdAt)).limit(50);
    res.json({ success: true, notifications: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch("/hrms/services/notifications/:id/read", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await payrollDb.update(systemNotifications).set({ isRead: true }).where(eq(systemNotifications.id, id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
