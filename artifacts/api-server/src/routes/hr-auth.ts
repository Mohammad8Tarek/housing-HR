import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { payrollDb, hrUsers, properties } from "@workspace/db-payroll";
import { db, usersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

// ─── 1. Login to Dedicated HR / Payroll / Attendance System ──────────
router.post("/hr-auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password, system } = req.body;
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

    // 2. Fallback: Check Housing usersTable (allowing admin, super_admin, etc.)
    const [housingUser] = await db
      .select()
      .from(usersTable)
      .where(sql`lower(${usersTable.username}) = lower(${trimmedUser})`)
      .limit(1);

    if (housingUser && housingUser.status?.toLowerCase() === "active") {
      const isMatch = await bcrypt.compare(password, housingUser.passwordHash);
      if (isMatch) {
        const roles = (housingUser.roles || []).map(r => String(r).toLowerCase());
        const isSysAdmin = roles.includes("super_admin") || roles.includes("system_admin") || roles.includes("admin");

        const session = req.session as any;
        session.hrUserId = housingUser.id;
        session.hrUser = {
          id: housingUser.id,
          username: housingUser.username,
          fullName: housingUser.fullName || housingUser.username,
          email: housingUser.email,
          role: isSysAdmin ? "super_admin" : (roles[0] || "officer"),
          systemAccess: "both",
          propertyId: housingUser.propertyId,
          permissions: {
            payroll: { view: true, create: true, edit: true, delete: isSysAdmin, approve: isSysAdmin, wps_export: true },
            attendance: { view: true, create: true, edit: true, delete: isSysAdmin, approve: isSysAdmin, sync_payroll: true },
          },
        };

        res.json({
          success: true,
          user: session.hrUser,
          message: "Authenticated successfully to HR Operations Suite",
        });
        return;
      }
    }

    res.status(401).json({ success: false, error: "بيانات الدخول غير صحيحة أو الحساب غير مفعّل (Invalid credentials)" });
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

export default router;
