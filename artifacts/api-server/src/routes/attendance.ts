import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  properties,
  biometricDevices, 
  shifts, 
  shiftAssignments, 
  employeeCheckins, 
  attendanceRecords,
  employees,
} from "@workspace/db-payroll";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 0. Properties ───────────────────────────────────────────────────
router.get("/attendance/properties", requirePermission("attendance", "view"), async (_req: Request, res: Response) => {
  try {
    const list = await payrollDb.select().from(properties).where(eq(properties.isActive, true));
    res.json({ success: true, properties: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 1. Biometric Devices ───────────────────────────────────────────
router.get("/attendance/devices", requirePermission("attendance", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(biometricDevices).where(eq(biometricDevices.propertyId, propertyId))
      : payrollDb.select().from(biometricDevices);
    const devices = await query;
    res.json({ success: true, devices });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/attendance/devices", requirePermission("attendance", "create"), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const [device] = await payrollDb.insert(biometricDevices).values({
      propertyId: Number(body.propertyId),
      deviceName: body.deviceName,
      deviceType: body.deviceType || "zkteco",
      ipAddress: body.ipAddress,
      port: Number(body.port) || 4370,
      deviceId: body.deviceId || null,
      location: body.location || null,
      isActive: true,
    }).returning();
    res.status(201).json({ success: true, device });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── 2. Shifts & Roster Scheduling ──────────────────────────────────
router.get("/attendance/shifts", requirePermission("attendance", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const query = propertyId 
      ? payrollDb.select().from(shifts).where(eq(shifts.propertyId, propertyId))
      : payrollDb.select().from(shifts);
    const list = await query;
    res.json({ success: true, shifts: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/attendance/shifts", requirePermission("attendance", "create"), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const [shift] = await payrollDb.insert(shifts).values({
      propertyId: Number(body.propertyId),
      nameEn: body.nameEn,
      nameAr: body.nameAr,
      startTime: body.startTime,
      endTime: body.endTime,
      gracePeriodEntryMins: Number(body.gracePeriodEntryMins) || 15,
      gracePeriodExitMins: Number(body.gracePeriodExitMins) || 15,
      breakDurationMins: Number(body.breakDurationMins) || 60,
      workingHours: String(body.workingHours || "8.00"),
      isNightShift: Boolean(body.isNightShift),
      color: body.color || "#3b82f6",
      isActive: true,
    }).returning();
    res.status(201).json({ success: true, shift });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/attendance/roster", requirePermission("attendance", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const assignments = await payrollDb
      .select({
        assignment: shiftAssignments,
        employee: employees,
        shift: shifts,
      })
      .from(shiftAssignments)
      .innerJoin(employees, eq(shiftAssignments.employeeId, employees.id))
      .innerJoin(shifts, eq(shiftAssignments.shiftId, shifts.id))
      .where(propertyId ? eq(shiftAssignments.propertyId, propertyId) : undefined)
      .orderBy(desc(shiftAssignments.id))
      .limit(100);

    res.json({ success: true, roster: assignments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/attendance/roster", requirePermission("attendance", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, employeeId, shiftId, startDate, endDate } = req.body;
    const [created] = await payrollDb.insert(shiftAssignments).values({
      propertyId: Number(propertyId),
      employeeId: Number(employeeId),
      shiftId: Number(shiftId),
      startDate,
      endDate: endDate || null,
      isActive: true,
    }).returning();
    res.status(201).json({ success: true, assignment: created });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── 3. Raw Biometric Punch Logs (Checkins) ─────────────────────────
// This endpoint is invoked by the Biometric Sync Bridge service or machine push API
router.post("/attendance/checkin", async (req: Request, res: Response) => {
  try {
    const { propertyId, biometricId, punchTime, logType, deviceId, syncSource } = req.body;

    if (!propertyId || !biometricId || !punchTime) {
      return res.status(400).json({ success: false, error: "propertyId, biometricId and punchTime required" });
    }

    // Resolve employee by biometricId
    const [emp] = await payrollDb
      .select()
      .from(employees)
      .where(and(
        eq(employees.propertyId, Number(propertyId)),
        eq(employees.biometricId, String(biometricId))
      ));

    const [checkin] = await payrollDb.insert(employeeCheckins).values({
      propertyId: Number(propertyId),
      employeeId: emp ? emp.id : null,
      biometricId: String(biometricId),
      punchTime: new Date(punchTime),
      logType: logType || "AUTO",
      deviceId: deviceId ? Number(deviceId) : null,
      syncSource: syncSource || "biometric_server",
      isProcessed: false,
    }).returning();

    res.status(201).json({ success: true, checkin });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/attendance/logs", requirePermission("attendance", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const logs = await payrollDb
      .select({
        log: employeeCheckins,
        employee: employees,
        device: biometricDevices,
      })
      .from(employeeCheckins)
      .leftJoin(employees, eq(employeeCheckins.employeeId, employees.id))
      .leftJoin(biometricDevices, eq(employeeCheckins.deviceId, biometricDevices.id))
      .where(propertyId ? eq(employeeCheckins.propertyId, propertyId) : undefined)
      .orderBy(desc(employeeCheckins.id))
      .limit(100);

    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. Daily Evaluated Attendance & Processing ─────────────────────
router.get("/attendance/daily", requirePermission("attendance", "view"), async (req: Request, res: Response) => {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const records = await payrollDb
      .select({
        attendance: attendanceRecords,
        employee: employees,
        shift: shifts,
      })
      .from(attendanceRecords)
      .innerJoin(employees, eq(attendanceRecords.employeeId, employees.id))
      .leftJoin(shifts, eq(attendanceRecords.shiftId, shifts.id))
      .where(and(
        propertyId ? eq(attendanceRecords.propertyId, propertyId) : undefined,
        eq(attendanceRecords.attendanceDate, date)
      ))
      .orderBy(desc(attendanceRecords.id));

    res.json({ success: true, records, date });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Engine to process raw punches into daily attendance records
router.post("/attendance/process-punches", requirePermission("attendance", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, targetDate } = req.body;
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    // 1. Fetch unprocessed punches for this date
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const punches = await payrollDb
      .select()
      .from(employeeCheckins)
      .where(and(
        eq(employeeCheckins.propertyId, Number(propertyId)),
        gte(employeeCheckins.punchTime, startOfDay),
        lte(employeeCheckins.punchTime, endOfDay)
      ))
      .orderBy(employeeCheckins.punchTime);

    // Group punches by employee
    const punchesByEmp = new Map<number, Date[]>();
    for (const p of punches) {
      if (p.employeeId) {
        const list = punchesByEmp.get(p.employeeId) || [];
        list.push(new Date(p.punchTime));
        punchesByEmp.set(p.employeeId, list);
      }
    }

    // 2. Fetch all active employees for this property
    const staff = await payrollDb
      .select()
      .from(employees)
      .where(and(
        eq(employees.propertyId, Number(propertyId)),
        eq(employees.status, "active"),
        eq(employees.isActive, true)
      ));

    let processedCount = 0;

    for (const emp of staff) {
      const empPunches = punchesByEmp.get(emp.id) || [];
      
      // Determine IN and OUT times
      let inTime: Date | null = null;
      let outTime: Date | null = null;
      let status = "absent";
      let hours = 0;
      let lateMins = 0;

      if (empPunches.length > 0) {
        inTime = empPunches[0];
        if (empPunches.length > 1) {
          outTime = empPunches[empPunches.length - 1];
          const diffMs = outTime.getTime() - inTime.getTime();
          hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        } else {
          hours = 8.0; // Default if single punch
        }
        status = hours >= 4.0 ? (hours >= 7.0 ? "present" : "half_day") : "absent";
      }

      // Upsert into attendanceRecords
      await payrollDb
        .insert(attendanceRecords)
        .values({
          propertyId: Number(propertyId),
          employeeId: emp.id,
          attendanceDate: dateStr,
          inTime,
          outTime,
          status,
          actualWorkingHours: String(hours),
          lateMinutes: lateMins,
        })
        .onConflictDoUpdate({
          target: [attendanceRecords.employeeId, attendanceRecords.attendanceDate],
          set: {
            inTime,
            outTime,
            status,
            actualWorkingHours: String(hours),
            lateMinutes: lateMins,
            updatedAt: new Date(),
          }
        });

      processedCount++;
    }

    // Mark checkins as processed
    await payrollDb
      .update(employeeCheckins)
      .set({ isProcessed: true, processedAt: new Date() })
      .where(and(
        eq(employeeCheckins.propertyId, Number(propertyId)),
        gte(employeeCheckins.punchTime, startOfDay),
        lte(employeeCheckins.punchTime, endOfDay)
      ));

    res.json({
      success: true,
      message: `Processed attendance for ${processedCount} employees on ${dateStr}`,
      processedCount,
      targetDate: dateStr,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
