import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { 
  payrollDb, 
  hrUsers, 
  properties, 
  hrmsAuditLogs, 
  supervisorAuthorizations, 
  hrPinAttempts 
} from "@workspace/db-payroll";
import { eq, desc, sql, gt } from "drizzle-orm";

const router = Router();

// ─── 1. Login to Dedicated HR / Payroll / Attendance System ──────────
router.post("/hr-auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password, system, propertyScope } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: "Username and password are required" });
      return;
    }

    const trimmedUser = username.trim();

    // 1. First check dedicated hr_users table
    const [user] = await payrollDb
      .select()
      .from(hrUsers)
      .where(sql`lower(${hrUsers.username}) = lower(${trimmedUser})`)
      .limit(1);

    if (user && user.isActive) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) {
        // Check system scope isolation
        if (system && system !== "both") {
          if (user.systemAccess !== "both" && user.systemAccess !== system) {
            res.status(403).json({
              success: false,
              error: system === "payroll" 
                ? "غير مصرح لحسابك بالدخول لنظام المرتبات (Access Denied to Payroll)"
                : "غير مصرح لحسابك بالدخول لنظام البصمة والحضور (Access Denied to Attendance)",
            });
            return;
          }
        }

        const session = req.session as any;
        session.hrUserId = user.id;
        session.hrUser = {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          systemAccess: user.systemAccess,
          propertyId: user.propertyId,
          permissions: user.permissions,
          propertyScope: propertyScope || {
            code: "MRK-01",
            nameEn: "Meraki Resort (Permanent Staff)",
            nameAr: "منتجع ميراكي شرم الشيخ (العمالة الدائمة)",
            category: "permanent",
          },
        };

        await payrollDb
          .update(hrUsers)
          .set({ lastLoginAt: new Date() })
          .where(eq(hrUsers.id, user.id));

        res.json({
          success: true,
          user: session.hrUser,
          message: "Authenticated successfully to HR Operations Suite",
        });
        return;
      }
    }

    // HRMS uses dedicated hr_users authentication store for multi-tenant isolation
    res.status(401).json({ 
      success: false, 
      error: "بيانات الدخول غير صحيحة أو الحساب غير مفعّل في نظام الموارد البشرية (Invalid credentials)" 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Get Current Authenticated HR User ─────────────────────────────
router.get("/hr-auth/me", async (req: Request, res: Response) => {
  try {
    const session = req.session as any;
    
    // Check if session has hrUser cached
    if (session?.hrUser) {
      res.json({ success: true, user: session.hrUser });
      return;
    }

    // Check hrUserId in payrollDb
    if (session?.hrUserId) {
      const [user] = await payrollDb
        .select()
        .from(hrUsers)
        .where(eq(hrUsers.id, session.hrUserId))
        .limit(1);

      if (user && user.isActive) {
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            systemAccess: user.systemAccess,
            propertyId: user.propertyId,
            permissions: user.permissions,
          },
        });
        return;
      }
    }

    // Check Housing session fallback (userId from usersTable)
    if (session?.userId) {
      const [userRow] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, session.userId))
        .limit(1);

      if (userRow && userRow.status?.toLowerCase() === "active") {
        const roles = (userRow.roles || []).map(r => String(r).toLowerCase());
        const isSysAdmin = roles.includes("super_admin") || roles.includes("system_admin") || roles.includes("admin");

        const hrUser = {
          id: userRow.id,
          username: userRow.username,
          fullName: userRow.fullName || userRow.username,
          email: userRow.email,
          role: isSysAdmin ? "super_admin" : (roles[0] || "officer"),
          systemAccess: "both" as const,
          propertyId: userRow.propertyId,
          permissions: {
            payroll: { view: true, create: true, edit: true, delete: isSysAdmin, approve: isSysAdmin, wps_export: true },
            attendance: { view: true, create: true, edit: true, delete: isSysAdmin, approve: isSysAdmin, sync_payroll: true },
          },
        };

        session.hrUserId = userRow.id;
        session.hrUser = hrUser;

        res.json({ success: true, user: hrUser });
        return;
      }
    }

    // Return 200 with user: null when not authenticated to allow SPAs silent probe without console red error
    res.json({ success: true, authenticated: false, user: null });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. Logout from HR System ─────────────────────────────────────────
router.post("/hr-auth/logout", async (req: Request, res: Response) => {
  try {
    const session = req.session as any;
    session.hrUserId = null;
    session.hrUser = null;
    res.json({ success: true, message: "Logged out from HR System" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. HR User Management (Users & Role Administration) ──────────────
router.get("/hr-auth/users", async (req: Request, res: Response) => {
  try {
    const session = req.session as any;
    if (!session?.hrUserId && !session?.isSystemAdmin) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const list = await payrollDb
      .select({
        id: hrUsers.id,
        username: hrUsers.username,
        fullName: hrUsers.fullName,
        email: hrUsers.email,
        role: hrUsers.role,
        systemAccess: hrUsers.systemAccess,
        propertyId: hrUsers.propertyId,
        permissions: hrUsers.permissions,
        isActive: hrUsers.isActive,
        lastLoginAt: hrUsers.lastLoginAt,
        createdAt: hrUsers.createdAt,
      })
      .from(hrUsers)
      .orderBy(desc(hrUsers.id));

    res.json({ success: true, users: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/hr-auth/users", async (req: Request, res: Response) => {
  try {
    const { username, password, fullName, email, role, systemAccess, propertyId, permissions } = req.body;
    if (!username || !password || !fullName) {
      res.status(400).json({ success: false, error: "Username, password and full name are required" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [created] = await payrollDb
      .insert(hrUsers)
      .values({
        username: username.trim(),
        passwordHash,
        fullName: fullName.trim(),
        email: email || null,
        role: role || "officer",
        systemAccess: systemAccess || "both",
        propertyId: propertyId ? Number(propertyId) : null,
        permissions: permissions || {},
        isActive: true,
      })
      .returning();

    res.status(201).json({
      success: true,
      user: {
        id: created.id,
        username: created.username,
        fullName: created.fullName,
        role: created.role,
        systemAccess: created.systemAccess,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── 5. Isolated Property Vaults List ─────────────────────────────────
router.get("/hr-auth/properties-vault", async (req: Request, res: Response) => {
  try {
    const vaults = [
      {
        id: "MRK-01",
        code: "MRK-01",
        nameEn: "Meraki Resort Sharm El Sheikh (Permanent Staff)",
        nameAr: "منتجع ميراكي شرم الشيخ (العمالة الدائمة)",
        propertyId: 1,
        category: "permanent",
        badge: "MRK-01 • Sharm El Sheikh",
        descriptionAr: "العمالة الدائمة والعقود السنوية ومسير الرواتب المعتمد",
        descriptionEn: "Permanent Staff, annual contracts & approved salary ledger",
        ledgerCode: "PERM-EXEC-FY2025",
      },
      {
        id: "MRK-02",
        code: "MRK-02",
        nameEn: "Meraki Resort (Casuals & Daily Wages)",
        nameAr: "منتجع ميراكي (العمالة اليومية والكاجوال)",
        propertyId: 1,
        category: "casuals",
        badge: "MRK-02 • Banquets & Operations",
        descriptionAr: "عمالة الحفلات والأفراح والورديات اليومية والصرف الأسبوعي",
        descriptionEn: "Banquets crew, daily shift rates & quick disbursements",
        ledgerCode: "CASUAL-SHIFT-2025",
      },
      {
        id: "SCB-01",
        code: "SCB-01",
        nameEn: "Sunrise Crystal Bay Resort (Permanent Staff)",
        nameAr: "صن رايز كريستال باي (العمالة الدائمة)",
        propertyId: 2,
        category: "permanent",
        badge: "SCB-01 • Hurghada Grand",
        descriptionAr: "الكوادر والعمالة المنتظمة لمنتجع كريستال باي الغردقة",
        descriptionEn: "Crystal Bay Hurghada regular staff & management ledger",
        ledgerCode: "SCB-PERM-2025",
      },
      {
        id: "SCB-02",
        code: "SCB-02",
        nameEn: "Sunrise Crystal Bay (Casuals & Seasonal)",
        nameAr: "صن رايز كريستال باي (كاجوال وموسمي)",
        propertyId: 2,
        category: "casuals",
        badge: "SCB-02 • Seasonal Workforce",
        descriptionAr: "عمالة المواسم والأغذية والمشروبات باليومية",
        descriptionEn: "High-season daily rate workers & F&B casual pool",
        ledgerCode: "SCB-CAS-2025",
      },
      {
        id: "MSM-01",
        code: "MSM-01",
        nameEn: "Sunrise Montemare Resort (Permanent Staff)",
        nameAr: "صن رايز مونتيماري (العمالة الدائمة)",
        propertyId: 3,
        category: "permanent",
        badge: "MSM-01 • Sharm El Sheikh Luxury",
        descriptionAr: "عمالة منتجع مونتيماري الفاخر برأس أم سيد",
        descriptionEn: "Montemare Grand Select luxury permanent hospitality staff",
        ledgerCode: "MSM-PERM-2025",
      },
      {
        id: "SRO-01",
        code: "SRO-01",
        nameEn: "Sunrise Romance Resort Sahl Hasheesh",
        nameAr: "صن رايز رومانس سهل حشيش (العمالة الدائمة)",
        propertyId: 4,
        category: "permanent",
        badge: "SRO-01 • Sahl Hasheesh Adults Only",
        descriptionAr: "العمالة الدائمة لمنتجع رومانس سهل حشيش",
        descriptionEn: "Romance Resort Sahl Hasheesh permanent workforce",
        ledgerCode: "SRO-PERM-2025",
      },
    ];

    res.json({ success: true, vaults });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 6. Dual-Key PIN & Secondary Financial Authorization ──────────────
router.post("/hr-auth/verify-pin", async (req: Request, res: Response) => {
  try {
    const { pin, action, reason, entityType, entityId } = req.body;
    const session = req.session as any;
    let currentUserId = session?.hrUserId;
    let currentUsername = session?.hrUser?.username || session?.user?.username || session?.username;
    let propertyId = session?.hrUser?.propertyId || session?.propertyId || req.body.propertyId || null;

    // Resolve true HR user id in sunrise_payroll_attendance to ensure schema isolation and valid foreign keys
    if (!currentUserId && currentUsername) {
      const [hrUser] = await payrollDb
        .select()
        .from(hrUsers)
        .where(eq(hrUsers.username, currentUsername))
        .limit(1);
      if (hrUser) {
        currentUserId = hrUser.id;
        currentUsername = hrUser.username;
        session.hrUserId = hrUser.id;
        session.hrUser = hrUser;
        if (!propertyId && hrUser.propertyId) {
          propertyId = hrUser.propertyId;
        }
      }
    }

    // Security Gate 1: Require active authenticated session
    if (!currentUserId || !currentUsername) {
      return res.status(401).json({
        success: false,
        error: "يجب تسجيل الدخول أولاً لتفويض العمليات الحساسة (Unauthorized Session)",
      });
    }

    // Security Gate 2: Enforce Role & Permission Authorization
    const userRole = session?.hrUser?.role || session?.user?.role || session?.userRole;
    const userPermissions = session?.hrUser?.permissions || session?.user?.permissions || session?.permissions;
    const isSupervisor = 
      userRole === "super_admin" || 
      userRole === "payroll_manager" || 
      userPermissions?.payroll?.approve === true;

    if (!isSupervisor) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بإجراء تفويض المشرف المالي (Missing Payroll Approval Role/Permission)",
      });
    }

    // Security Gate 3: Fail Closed if Configuration is Missing
    const configuredPin = process.env.SUPERVISOR_FINANCIAL_PIN;
    if (!configuredPin || configuredPin.trim().length === 0) {
      return res.status(503).json({
        success: false,
        error: "نظام التحقق المالي غير مهيأ أمنياً (SUPERVISOR_FINANCIAL_PIN is missing). العمليات المالية مغلقة لحين التكوين.",
      });
    }

    // Security Gate 4: Persistent, Account-Bound Brute-Force Protection
    const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const [attemptRecord] = await payrollDb
      .select()
      .from(hrPinAttempts)
      .where(eq(hrPinAttempts.userId, Number(currentUserId)));

    if (attemptRecord && attemptRecord.lockedUntil && new Date(attemptRecord.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(attemptRecord.lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        error: `تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). تم تجميد المصادقة مؤقتاً لمدة ${remainingMinutes} دقيقة لدواعي الأمان المصرفي.`,
      });
    }

    if (!pin) {
      return res.status(400).json({ success: false, error: "رمز التحقق الأمني (PIN) مطلوب" });
    }

    const trimmedPin = String(pin).trim();
    // Strict Verification: Only exact configured secret is valid — zero hardcoded fallbacks
    const isValidPin = trimmedPin === configuredPin.trim();

    if (!isValidPin) {
      const currentAttempts = (attemptRecord?.attempts || 0) + 1;
      const isLocked = currentAttempts >= 5;
      const lockedUntil = isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null;

      if (attemptRecord) {
        await payrollDb
          .update(hrPinAttempts)
          .set({
            attempts: currentAttempts,
            lockedUntil,
            lastAttemptAt: new Date(),
            ipAddress: clientIp,
          })
          .where(eq(hrPinAttempts.userId, Number(currentUserId)));
      } else {
        await payrollDb.insert(hrPinAttempts).values({
          userId: Number(currentUserId),
          username: currentUsername,
          ipAddress: clientIp,
          attempts: 1,
          lockedUntil: null,
        });
      }

      // Persistent Audit Log (Never log PIN value)
      await payrollDb.insert(hrmsAuditLogs).values({
        propertyId: propertyId ? Number(propertyId) : null,
        userId: Number(currentUserId),
        action: "SUPERVISOR_PIN_FAILED",
        entityType: entityType || "dual_key_authorization",
        entityId: entityId ? Number(entityId) : null,
        ipAddress: clientIp,
        userAgent: req.headers["user-agent"] || null,
        details: {
          action: action || "payroll_approval",
          reason: reason || null,
          attempts: currentAttempts,
          locked: isLocked,
          username: currentUsername,
        },
      }).catch((logErr) => console.error("Audit log error:", logErr));

      const attemptsRemaining = Math.max(0, 5 - currentAttempts);
      return res.status(403).json({
        success: false,
        error: `رمز الأمان المزدوج (PIN) غير صحيح. المحاولات المتبقية: ${attemptsRemaining}.`,
      });
    }

    // On Success: Reset account lockout attempts atomically
    if (attemptRecord) {
      await payrollDb.delete(hrPinAttempts).where(eq(hrPinAttempts.userId, Number(currentUserId)));
    }

    // Generate Cryptographically Secure, Single-Use, Short-Lived Authorization Token
    const authorizationToken = "AUTH-" + crypto.randomBytes(24).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    const safePropertyId = propertyId && !isNaN(Number(propertyId)) ? Number(propertyId) : null;
    const safeEntityId = entityId && !isNaN(Number(entityId)) ? Number(entityId) : null;

    await payrollDb.insert(supervisorAuthorizations).values({
      token: authorizationToken,
      userId: Number(currentUserId),
      username: currentUsername,
      action: action || "payroll_approval",
      propertyId: safePropertyId,
      entityType: entityType || "payroll_run",
      entityId: safeEntityId,
      isConsumed: false,
      expiresAt,
      ipAddress: clientIp,
    });

    // Audit verification event
    await payrollDb.insert(hrmsAuditLogs).values({
      propertyId: safePropertyId,
      userId: Number(currentUserId),
      action: "SUPERVISOR_PIN_VERIFIED",
      entityType: entityType || "dual_key_authorization",
      entityId: safeEntityId,
      ipAddress: clientIp,
      userAgent: req.headers["user-agent"] || null,
      details: {
        action: action || "payroll_approval",
        tokenPrefix: authorizationToken.slice(0, 10),
        reason: reason || null,
        username: currentUsername,
      },
    }).catch((logErr) => console.error("Audit log error:", logErr));

    res.json({
      success: true,
      verified: true,
      authorizationToken,
      auditStamp: authorizationToken,
      action: action || "payroll_approval",
      expiresAt: expiresAt.toISOString(),
      message: "تم التحقق الأمني المزدوج بنجاح وتفويض الإجراء الحرج",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
