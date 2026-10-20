import { Router, type Request, type Response } from "express";
import { 
  payrollDb, 
  payrollPool,
  properties, 
  departments, 
  designations, 
  employees, 
  sections, 
  jobGrades, 
  costCenters,
  employeeDocuments,
  employeeQualifications,
  employeeDependents,
  employeeHistory,
  employeeClearances,
  attendanceRecords,
  leaveApplications
} from "@workspace/db-payroll";
import { eq, desc, and, or, ilike, sql, count } from "drizzle-orm";
import { requirePermission } from "../middlewares/permissions.js";

const router = Router();

// ─── 1. Paginated Employee Master Directory ──────────────────────────
router.get("/hrms/employees", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
    const sectionId = req.query.sectionId ? Number(req.query.sectionId) : undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const conditions = [];

    if (propertyId) conditions.push(eq(employees.propertyId, propertyId));
    if (departmentId) conditions.push(eq(employees.departmentId, departmentId));
    if (sectionId) conditions.push(eq(employees.sectionId, sectionId));
    if (status && status !== "all") conditions.push(eq(employees.status, status));

    if (search && search.trim() !== "") {
      const searchPattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(employees.fullName, searchPattern),
          ilike(employees.fullNameAr, searchPattern),
          ilike(employees.employeeCode, searchPattern),
          ilike(employees.nationalId, searchPattern),
          ilike(employees.phone, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total Count
    const [totalRes] = await payrollDb
      .select({ total: count() })
      .from(employees)
      .where(whereClause);
    const totalRecords = Number(totalRes?.total ?? 0);

    // Paginated list with joins for department, designation, section, and property names
    const query = payrollDb
      .select({
        id: employees.id,
        propertyId: employees.propertyId,
        propertyName: properties.nameEn,
        propertyNameAr: properties.nameAr,
        employeeCode: employees.employeeCode,
        firstName: employees.firstName,
        secondName: employees.secondName,
        thirdName: employees.thirdName,
        lastName: employees.lastName,
        fullName: employees.fullName,
        fullNameAr: employees.fullNameAr,
        nationalId: employees.nationalId,
        passportNumber: employees.passportNumber,
        gender: employees.gender,
        dateOfBirth: employees.dateOfBirth,
        maritalStatus: employees.maritalStatus,
        employmentType: employees.employmentType,
        contractType: employees.contractType,
        status: employees.status,
        joiningDate: employees.joiningDate,
        probationEndDate: employees.probationEndDate,
        contractEndDate: employees.contractEndDate,
        departmentId: employees.departmentId,
        departmentName: departments.nameEn,
        departmentNameAr: departments.nameAr,
        designationId: employees.designationId,
        designationTitle: designations.titleEn,
        designationTitleAr: designations.titleAr,
        sectionId: employees.sectionId,
        sectionName: sections.nameEn,
        sectionNameAr: sections.nameAr,
        costCenterId: employees.costCenterId,
        costCenterCode: costCenters.code,
        jobGradeId: employees.jobGradeId,
        jobGradeCode: jobGrades.code,
        baseSalary: employees.baseSalary,
        bankName: employees.bankName,
        bankAccountNumber: employees.bankAccountNumber,
        iban: employees.iban,
        phone: employees.phone,
        email: employees.email,
        profilePhotoUrl: employees.profilePhotoUrl,
        emergencyContactName: employees.emergencyContactName,
        emergencyContactPhone: employees.emergencyContactPhone,
        emergencyContactRelation: employees.emergencyContactRelation,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .leftJoin(properties, eq(employees.propertyId, properties.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .leftJoin(sections, eq(employees.sectionId, sections.id))
      .leftJoin(costCenters, eq(employees.costCenterId, costCenters.id))
      .leftJoin(jobGrades, eq(employees.jobGradeId, jobGrades.id))
      .where(whereClause)
      .orderBy(desc(employees.id))
      .limit(limit)
      .offset(offset);

    const list = await query;

    res.json({
      success: true,
      employees: list,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (err: any) {
    const pgMsg = err.cause?.message || err.message;
    const pgDetail = err.cause?.detail || err.detail;
    console.error("CREATE EMPLOYEE ERROR:", pgMsg, pgDetail);
    res.status(500).json({ success: false, error: pgMsg, detail: pgDetail });
  }
});

// ─── 2. Deep Employee Master Detail ──────────────────────────────────
router.get("/hrms/employees/:id", requirePermission("payroll", "view"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid employee ID" });

    const [emp] = await payrollDb
      .select({
        id: employees.id,
        propertyId: employees.propertyId,
        propertyName: properties.nameEn,
        propertyNameAr: properties.nameAr,
        employeeCode: employees.employeeCode,
        firstName: employees.firstName,
        secondName: employees.secondName,
        thirdName: employees.thirdName,
        lastName: employees.lastName,
        fullName: employees.fullName,
        fullNameAr: employees.fullNameAr,
        nationalId: employees.nationalId,
        passportNumber: employees.passportNumber,
        gender: employees.gender,
        dateOfBirth: employees.dateOfBirth,
        maritalStatus: employees.maritalStatus,
        employmentType: employees.employmentType,
        contractType: employees.contractType,
        status: employees.status,
        joiningDate: employees.joiningDate,
        probationEndDate: employees.probationEndDate,
        contractEndDate: employees.contractEndDate,
        departmentId: employees.departmentId,
        departmentName: departments.nameEn,
        departmentNameAr: departments.nameAr,
        designationId: employees.designationId,
        designationTitle: designations.titleEn,
        designationTitleAr: designations.titleAr,
        sectionId: employees.sectionId,
        sectionName: sections.nameEn,
        sectionNameAr: sections.nameAr,
        costCenterId: employees.costCenterId,
        costCenterCode: costCenters.code,
        jobGradeId: employees.jobGradeId,
        jobGradeCode: jobGrades.code,
        baseSalary: employees.baseSalary,
        bankName: employees.bankName,
        bankAccountNumber: employees.bankAccountNumber,
        iban: employees.iban,
        insuranceNumber: employees.insuranceNumber,
        insuranceSalary: employees.insuranceSalary,
        isInsured: employees.isInsured,
        phone: employees.phone,
        email: employees.email,
        address: employees.address,
        notes: employees.notes,
        profilePhotoUrl: employees.profilePhotoUrl,
        emergencyContactName: employees.emergencyContactName,
        emergencyContactPhone: employees.emergencyContactPhone,
        emergencyContactRelation: employees.emergencyContactRelation,
        isActive: employees.isActive,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .leftJoin(properties, eq(employees.propertyId, properties.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(designations, eq(employees.designationId, designations.id))
      .leftJoin(sections, eq(employees.sectionId, sections.id))
      .leftJoin(costCenters, eq(employees.costCenterId, costCenters.id))
      .leftJoin(jobGrades, eq(employees.jobGradeId, jobGrades.id))
      .where(eq(employees.id, id));

    if (!emp) {
      return res.status(404).json({ success: false, error: "Employee not found" });
    }

    // Fetch related tabs in parallel
    const [docs, quals, deps, hist, clear, recentLeaves, recentAttendance] = await Promise.all([
      payrollDb.select().from(employeeDocuments).where(eq(employeeDocuments.employeeId, id)).orderBy(desc(employeeDocuments.createdAt)),
      payrollDb.select().from(employeeQualifications).where(eq(employeeQualifications.employeeId, id)),
      payrollDb.select().from(employeeDependents).where(eq(employeeDependents.employeeId, id)),
      payrollDb.select().from(employeeHistory).where(eq(employeeHistory.employeeId, id)).orderBy(desc(employeeHistory.effectiveDate)),
      payrollDb.select().from(employeeClearances).where(eq(employeeClearances.employeeId, id)).orderBy(desc(employeeClearances.createdAt)),
      payrollDb.select().from(leaveApplications).where(eq(leaveApplications.employeeId, id)).orderBy(desc(leaveApplications.startDate)).limit(10),
      payrollDb.select().from(attendanceRecords).where(eq(attendanceRecords.employeeId, id)).orderBy(desc(attendanceRecords.attendanceDate)).limit(15),
    ]);

    res.json({
      success: true,
      employee: {
        ...emp,
        documents: docs,
        qualifications: quals,
        dependents: deps,
        history: hist,
        clearances: clear,
        recentLeaves,
        recentAttendance,
      }
    });
  } catch (err: any) {
    const pgMsg = err.cause?.message || err.message;
    const pgDetail = err.cause?.detail || err.detail;
    console.error("CREATE EMPLOYEE ERROR:", pgMsg, pgDetail);
    res.status(500).json({ success: false, error: pgMsg, detail: pgDetail });
  }
});

// ─── 3. Create Employee ──────────────────────────────────────────────
router.post("/hrms/employees", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const {
      propertyId,
      employeeCode,
      firstName,
      secondName,
      thirdName,
      lastName,
      nationalId,
      passportNumber,
      gender,
      dateOfBirth,
      maritalStatus,
      employmentType,
      contractType,
      departmentId,
      designationId,
      sectionId,
      costCenterId,
      jobGradeId,
      joiningDate,
      probationEndDate,
      contractEndDate,
      baseSalary,
      bankName,
      bankAccountNumber,
      iban,
      insuranceNumber,
      insuranceSalary,
      isInsured,
      phone,
      email,
      address,
      notes,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      profilePhotoUrl
    } = req.body;

    if (!propertyId || !employeeCode || !firstName || !lastName || !joiningDate) {
      return res.status(400).json({
        success: false,
        error: "Property, employee code, first name, last name, and joining date are required"
      });
    }

    // Check duplicate employee code
    const [existingCode] = await payrollDb
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.propertyId, Number(propertyId)), eq(employees.employeeCode, employeeCode)));
    if (existingCode) {
      return res.status(409).json({ success: false, error: `Employee code '${employeeCode}' already exists in this property` });
    }

    // Auto-generate full names
    const fullName = [firstName, secondName, thirdName, lastName].filter(Boolean).join(" ");
    const fullNameAr = req.body.fullNameAr || fullName;

    const normalizedGender = (gender && String(gender).toLowerCase().startsWith("f")) ? "female" : "male";

    const [newEmp] = await payrollDb
      .insert(employees)
      .values({
        propertyId: Number(propertyId),
        employeeCode,
        firstName,
        secondName,
        thirdName,
        lastName,
        fullName,
        fullNameAr,
        nationalId,
        passportNumber,
        gender: normalizedGender,
        dateOfBirth: (dateOfBirth && String(dateOfBirth).trim() !== "") ? String(dateOfBirth) : null,
        maritalStatus: maritalStatus || "Single",
        employmentType: employmentType || "regular",
        contractType: contractType || "permanent",
        status: "active",
        departmentId: departmentId ? Number(departmentId) : null,
        designationId: designationId ? Number(designationId) : null,
        sectionId: sectionId ? Number(sectionId) : null,
        costCenterId: costCenterId ? Number(costCenterId) : null,
        jobGradeId: jobGradeId ? Number(jobGradeId) : null,
        joiningDate: (joiningDate && String(joiningDate).trim() !== "") ? String(joiningDate) : new Date().toISOString().split("T")[0],
        probationEndDate: (probationEndDate && String(probationEndDate).trim() !== "") ? String(probationEndDate) : null,
        contractEndDate: (contractEndDate && String(contractEndDate).trim() !== "") ? String(contractEndDate) : null,
        baseSalary: baseSalary ? String(baseSalary) : "0.00",
        bankName,
        bankAccountNumber,
        iban,
        insuranceNumber,
        insuranceSalary: insuranceSalary ? String(insuranceSalary) : "0.00",
        isInsured: isInsured !== undefined ? Boolean(isInsured) : true,
        phone,
        email,
        address,
        notes,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        profilePhotoUrl,
      })
      .returning();

    // Log to audit log
    await payrollPool.query(
      "INSERT INTO hrms_audit_logs (property_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5);",
      [propertyId, "EMPLOYEE_CREATE", "employee", newEmp.id, JSON.stringify({ code: employeeCode, name: fullName })]
    ).catch(() => {});

    res.status(201).json({ success: true, employee: newEmp });
  } catch (err: any) {
    const pgMsg = err.cause?.message || err.message;
    const pgDetail = err.cause?.detail || err.detail;
    console.error("CREATE EMPLOYEE ERROR:", pgMsg, pgDetail);
    res.status(500).json({ success: false, error: pgMsg, detail: pgDetail });
  }
});

// ─── 4. Update Employee ──────────────────────────────────────────────
router.put("/hrms/employees/:id", requirePermission("payroll", "edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid employee ID" });

    const updates = { ...req.body, updatedAt: new Date() };
    delete updates.id;

    // Recalculate fullName if name parts changed
    if (updates.firstName || updates.lastName) {
      const [curr] = await payrollDb.select().from(employees).where(eq(employees.id, id));
      if (curr) {
        const fn = updates.firstName ?? curr.firstName;
        const sn = updates.secondName ?? curr.secondName;
        const tn = updates.thirdName ?? curr.thirdName;
        const ln = updates.lastName ?? curr.lastName;
        updates.fullName = [fn, sn, tn, ln].filter(Boolean).join(" ");
      }
    }

    const [updated] = await payrollDb
      .update(employees)
      .set(updates)
      .where(eq(employees.id, id))
      .returning();

    res.json({ success: true, employee: updated });
  } catch (err: any) {
    const pgMsg = err.cause?.message || err.message;
    const pgDetail = err.cause?.detail || err.detail;
    console.error("CREATE EMPLOYEE ERROR:", pgMsg, pgDetail);
    res.status(500).json({ success: false, error: pgMsg, detail: pgDetail });
  }
});

// ─── 5. Employee Documents ───────────────────────────────────────────
router.post("/hrms/employees/:id/documents", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);
    const { documentType, documentNumber, issuedDate, expiryDate, fileUrl, fileSize, mimeType } = req.body;
    if (!documentType || !fileUrl) {
      return res.status(400).json({ success: false, error: "Document type and file URL are required" });
    }

    const [doc] = await payrollDb
      .insert(employeeDocuments)
      .values({
        employeeId,
        documentType,
        documentNumber,
        issuedDate: issuedDate || null,
        expiryDate: expiryDate || null,
        fileUrl,
        fileSize: fileSize ? Number(fileSize) : null,
        mimeType,
        isVerified: false,
      })
      .returning();

    res.status(201).json({ success: true, document: doc });
  } catch (err: any) {
    const pgMsg = err.cause?.message || err.message;
    const pgDetail = err.cause?.detail || err.detail;
    console.error("CREATE EMPLOYEE ERROR:", pgMsg, pgDetail);
    res.status(500).json({ success: false, error: pgMsg, detail: pgDetail });
  }
});

// ─── 6. Career History & Promotions ──────────────────────────────────
router.post("/hrms/employees/:id/history", requirePermission("payroll", "edit"), async (req: Request, res: Response) => {
  try {
    const employeeId = Number(req.params.id);
    const {
      actionType,
      effectiveDate,
      newPropertyId,
      newDepartmentId,
      newDesignationId,
      newSalary,
      reason
    } = req.body;

    const [current] = await payrollDb.select().from(employees).where(eq(employees.id, employeeId));
    if (!current) return res.status(404).json({ success: false, error: "Employee not found" });

    // Record career history entry
    const [entry] = await payrollDb
      .insert(employeeHistory)
      .values({
        employeeId,
        actionType: actionType || "promotion",
        effectiveDate: effectiveDate || new Date().toISOString().split("T")[0],
        previousPropertyId: current.propertyId,
        newPropertyId: newPropertyId ? Number(newPropertyId) : current.propertyId,
        previousDepartmentId: current.departmentId,
        newDepartmentId: newDepartmentId ? Number(newDepartmentId) : current.departmentId,
        previousDesignationId: current.designationId,
        newDesignationId: newDesignationId ? Number(newDesignationId) : current.designationId,
        previousSalary: current.baseSalary,
        newSalary: newSalary ? String(newSalary) : current.baseSalary,
        reason,
      })
      .returning();

    // Update current employee profile with new values
    await payrollDb
      .update(employees)
      .set({
        propertyId: newPropertyId ? Number(newPropertyId) : current.propertyId,
        departmentId: newDepartmentId ? Number(newDepartmentId) : current.departmentId,
        designationId: newDesignationId ? Number(newDesignationId) : current.designationId,
        baseSalary: newSalary ? String(newSalary) : current.baseSalary,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, employeeId));

    res.status(201).json({ success: true, historyEntry: entry });
  } catch (err: any) {
    const pgMsg = err.cause?.message || err.message;
    const pgDetail = err.cause?.detail || err.detail;
    console.error("CREATE EMPLOYEE ERROR:", pgMsg, pgDetail);
    res.status(500).json({ success: false, error: pgMsg, detail: pgDetail });
  }
});

// ─── 7. Bulk Excel / CSV Employee Import ─────────────────────────────
router.post("/hrms/employees/bulk-import", requirePermission("payroll", "create"), async (req: Request, res: Response) => {
  try {
    const { propertyId, rows, dryRun } = req.body;
    if (!propertyId || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: "Property ID and an array of employee rows are required" });
    }

    const validated: any[] = [];
    const errors: Array<{ row: number; employeeCode?: string; error: string }> = [];

    // Fetch existing codes in property to detect duplicates
    const existing = await payrollDb
      .select({ code: employees.employeeCode })
      .from(employees)
      .where(eq(employees.propertyId, Number(propertyId)));
    const existingCodeSet = new Set(existing.map(e => e.code.toUpperCase()));

    rows.forEach((r, idx) => {
      const rowNum = idx + 1;
      const code = String(r.employeeCode || r.code || "").trim();
      const firstName = String(r.firstName || "").trim();
      const lastName = String(r.lastName || "").trim();
      const joiningDate = r.joiningDate || r.hireDate;

      if (!code) {
        errors.push({ row: rowNum, error: "Missing employee code" });
        return;
      }
      if (existingCodeSet.has(code.toUpperCase())) {
        errors.push({ row: rowNum, employeeCode: code, error: "Duplicate employee code in this property" });
        return;
      }
      if (!firstName || !lastName) {
        errors.push({ row: rowNum, employeeCode: code, error: "First and last name are required" });
        return;
      }

      const fullName = [firstName, r.secondName, r.thirdName, lastName].filter(Boolean).join(" ");
      validated.push({
        propertyId: Number(propertyId),
        employeeCode: code,
        firstName,
        secondName: r.secondName || null,
        thirdName: r.thirdName || null,
        lastName,
        fullName,
        fullNameAr: r.fullNameAr || fullName,
        nationalId: r.nationalId || null,
        passportNumber: r.passportNumber || null,
        gender: r.gender || "M",
        employmentType: r.employmentType || "regular",
        contractType: r.contractType || "permanent",
        status: "active",
        joiningDate: joiningDate || "2026-01-01",
        baseSalary: r.baseSalary ? String(r.baseSalary) : "0.00",
        phone: r.phone || null,
        email: r.email || null,
        bankName: r.bankName || null,
        bankAccountNumber: r.bankAccountNumber || null,
        iban: r.iban || null,
      });
      existingCodeSet.add(code.toUpperCase());
    });

    if (dryRun) {
      return res.json({
        success: true,
        dryRun: true,
        totalSubmitted: rows.length,
        validCount: validated.length,
        errorCount: errors.length,
        errors,
        preview: validated.slice(0, 10),
      });
    }

    // Commit to DB
    if (validated.length > 0) {
      await payrollDb.insert(employees).values(validated);
    }

    res.json({
      success: true,
      importedCount: validated.length,
      rejectedCount: errors.length,
      errors,
    });
  } catch (err: any) {
    const pgMsg = err.cause?.message || err.message;
    const pgDetail = err.cause?.detail || err.detail;
    console.error("CREATE EMPLOYEE ERROR:", pgMsg, pgDetail);
    res.status(500).json({ success: false, error: pgMsg, detail: pgDetail });
  }
});

export default router;
