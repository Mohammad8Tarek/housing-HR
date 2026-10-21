export type AppDomain = "housing" | "payroll" | "attendance" | "hrms";

export interface ActiveAppSession {
  app: AppDomain;
  appNameAr: string;
  appNameEn: string;
  launchedAt: string;
  propertyId?: number | null;
  propertyName?: string;
  username?: string;
}

const STORAGE_KEY = "sunrise_active_app_session";

export const APP_METADATA: Record<AppDomain, { ar: string; en: string; icon: string }> = {
  housing: {
    ar: "سكن العاملين الفندقي",
    en: "Staff Housing System",
    icon: "Building2",
  },
  payroll: {
    ar: "استوديو الرواتب والأجور (SST)",
    en: "Payroll Studio (SST)",
    icon: "DollarSign",
  },
  attendance: {
    ar: "الحضور والانصراف وأجهزة البصمة",
    en: "Attendance & Biometrics",
    icon: "Fingerprint",
  },
  hrms: {
    ar: "الموارد البشرية وشؤون العاملين",
    en: "Core HRMS Suite",
    icon: "Users",
  },
};

/**
 * Retrieves the currently active application session from sessionStorage
 */
export function getActiveAppSession(): ActiveAppSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Records an application launch into the audit trail and establishes a locked session
 */
export async function recordAppLaunch(
  app: AppDomain,
  propertyId?: number | null,
  propertyName?: string,
  username?: string
): Promise<ActiveAppSession> {
  const meta = APP_METADATA[app] || { ar: app, en: app };
  const session: ActiveAppSession = {
    app,
    appNameAr: meta.ar,
    appNameEn: meta.en,
    launchedAt: new Date().toISOString(),
    propertyId: propertyId ?? null,
    propertyName: propertyName || "Enterprise Scope",
    username: username || "staff",
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  // Asynchronously record into backend audit logs
  try {
    fetch("/api/activity-logs/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app,
        propertyId,
        propertyName: session.propertyName,
        username: session.username,
      }),
    }).catch(() => {});
  } catch {}

  return session;
}

/**
 * Terminate the active application session and log the exit event
 */
export async function recordAppExit(): Promise<void> {
  const current = getActiveAppSession();
  if (!current) return;

  const durationSeconds = Math.max(
    1,
    Math.round((Date.now() - new Date(current.launchedAt).getTime()) / 1000)
  );

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("tsplus_portal_authenticated");
    sessionStorage.removeItem("hr_property_vault_scope");
    sessionStorage.removeItem("sst_selected_period");
  }

  try {
    await fetch("/api/activity-logs/exit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app: current.app,
        durationSeconds,
        username: current.username,
        propertyId: current.propertyId,
      }),
    });
  } catch {}
}

/**
 * Checks if accessing `targetApp` conflicts with an already active session of a different application
 */
export function checkAppSessionConflict(targetApp: AppDomain): {
  hasConflict: boolean;
  activeSession: ActiveAppSession | null;
} {
  const current = getActiveAppSession();
  if (!current) {
    return { hasConflict: false, activeSession: null };
  }
  if (current.app !== targetApp) {
    return { hasConflict: true, activeSession: current };
  }
  return { hasConflict: false, activeSession: current };
}
