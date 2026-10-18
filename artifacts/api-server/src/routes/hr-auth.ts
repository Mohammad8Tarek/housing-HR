import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { payrollDb, hrUsers, properties } from "@workspace/db-payroll";
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

    const [user] = await payrollDb
      .select()
      .from(hrUsers)
      .where(sql`lower(${hrUsers.username}) = lower(${username.trim()})`)
      .limit(1);

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: "Invalid username or account is inactive" });
      return;
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: "Invalid password credentials" });
      return;
    }

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

    // Store in Session
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

    // Update last login
    await payrollDb
      .update(hrUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(hrUsers.id, user.id));

    res.json({
      success: true,
      user: session.hrUser,
      message: "Authenticated successfully to HR Operations Suite",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. Get Current Authenticated HR User ─────────────────────────────
router.get("/hr-auth/me", async (req: Request, res: Response) => {
  try {
    const session = req.session as any;
    if (!session?.hrUserId) {
      // Fallback: If user is logged into Housing as super_admin, grant temporary elevated HR context
      if (session?.userId && session?.isSystemAdmin) {
        res.json({
          success: true,
          user: {
            id: 0,
            username: "super_admin",
            fullName: "System Super Administrator",
            role: "super_admin",
            systemAccess: "both",
            permissions: {
              payroll: { view: true, create: true, edit: true, delete: true, approve: true, wps_export: true },
              attendance: { view: true, create: true, edit: true, delete: true, approve: true, sync_payroll: true },
            },
          },
        });
        return;
      }

      res.status(401).json({ success: false, error: "Not authenticated in HR system" });
      return;
    }

    const [user] = await payrollDb
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
      })
      .from(hrUsers)
      .where(eq(hrUsers.id, session.hrUserId))
      .limit(1);

    if (!user || !user.isActive) {
      session.hrUserId = null;
      session.hrUser = null;
      res.status(401).json({ success: false, error: "Session invalid or account deactivated" });
      return;
    }

    res.json({ success: true, user });
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
