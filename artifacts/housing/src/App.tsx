import { Suspense, lazy, useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { HrAuthProvider, useHrAuth } from "@/context/HrAuthContext";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import {
  PropertyProvider,
  useProperty,
} from "@/context/PropertyContext";
import { RESERVED_FIRST_SEGMENTS } from "@/lib/property-slug";
import { AppLayout } from "@/components/layout/AppLayout";
import { HrSuiteLayout } from "@/components/layout/HrSuiteLayout";
import { PageLoader } from "@/components/ui/loader";
import { useWebSocket } from "@/hooks/use-websocket";
import { usePermission } from "@/hooks/use-permission";
import type { Module, Action } from "@/lib/permissions";
import { Layers, LogOut, Sun, Moon, Languages, ShieldAlert, Fingerprint, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Link } from "wouter";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { checkAppSessionConflict, recordAppExit, recordAppLaunch, ActiveAppSession } from "@/lib/app-session";
import { SessionConflictModal } from "@/components/modals/SessionConflictModal";

const Properties = lazy(() => import("@/pages/properties"));
const Housing = lazy(() => import("@/pages/housing"));
const Profiles = lazy(() => import("@/pages/profiles/index"));
const ProfileDetail = lazy(() => import("@/pages/profiles/detail"));
const Portal = lazy(() => import("@/pages/portal"));
const Reservations = lazy(() => import("@/pages/accommodation/reservations"));
const InHouse = lazy(() => import("@/pages/accommodation/in-house"));
const RoomAssignment = lazy(
  () => import("@/pages/accommodation/room-assignment"),
);
const GuestHosting = lazy(() => import("@/pages/accommodation/guest-hosting"));
const History = lazy(() => import("@/pages/accommodation/history"));
const GateScanner = lazy(() => import("@/pages/gate-scanner/index"));
const Housekeeping = lazy(() => import("@/pages/housekeeping"));
const Maintenance = lazy(() => import("@/pages/maintenance"));
const MaintenanceDetails = lazy(() => import("@/pages/maintenance-details"));
const Reports = lazy(() => import("@/pages/reports"));
const ReportConfiguration = lazy(() => import("@/pages/reports/ReportConfigurationPage"));
const Users = lazy(() => import("@/pages/users"));
const UserDetail = lazy(() => import("@/pages/users/detail"));
const ActivityLog = lazy(() => import("@/pages/activity-log"));
const Settings = lazy(() => import("@/pages/settings"));
const SystemLauncher = lazy(() => import("@/pages/launcher"));
const PayrollPage = lazy(() => import("@/pages/payroll"));
const AttendancePage = lazy(() => import("@/pages/attendance"));
const HrmsSuitePage = lazy(() => import("@/pages/hrms"));
const HrPropertyGatePage = lazy(() => import("@/pages/auth/HrPropertyGatePage"));
const HrLoginPage = lazy(() => import("@/pages/hr-login"));
const EditHostingRequest = lazy(
  () => import("@/pages/hosting-requests/EditHostingRequest"),
);
const HostingRequestsList = lazy(
  () => import("@/pages/hosting-requests/HostingRequestsList"),
);
const CreateHostingRequest = lazy(
  () => import("@/pages/hosting-requests/CreateHostingRequest"),
);
const HostingRequestDetail = lazy(
  () => import("@/pages/hosting-requests/HostingRequestDetail"),
);
const RoomServiceLandingPage = lazy(
  () => import("@/pages/room-service/RoomServiceLandingPage"),
);

// Profile Portal Pages (Moved to standalone app)

let mutationRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      // Don't auto-invalidate all queries on auth mutations (login/logout/hr-login/etc.)
      const mutationKey = mutation.options.mutationKey;
      if (
        Array.isArray(mutationKey) &&
        mutationKey.some((k: any) => typeof k === "string" && (k.includes("login") || k.includes("logout") || k.includes("auth")))
      ) {
        return;
      }
      if (mutationRefreshTimer) clearTimeout(mutationRefreshTimer);
      mutationRefreshTimer = setTimeout(() => {
        queryClient.invalidateQueries({
          type: "active",
          refetchType: "active",
        });
      }, 120);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 1;
      },
    },
  },
});

/**
 * Global WebSocket Provider - stays mounted for the entire app session
 * This ensures WebSocket connection persists across route changes
 */
function WebSocketProvider({ children }: { children: React.ReactNode }) {
  useWebSocket();
  return <>{children}</>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [conflictSession, setConflictSession] = useState<ActiveAppSession | null>(() => {
    const conflict = checkAppSessionConflict("housing");
    return conflict.hasConflict ? conflict.activeSession : null;
  });

  useEffect(() => {
    const conflict = checkAppSessionConflict("housing");
    setConflictSession(conflict.hasConflict ? conflict.activeSession : null);
    if (!conflict.hasConflict && isAuthenticated) {
      recordAppLaunch("housing", 1, "Staff Housing Global", user?.username);
    }
  }, [location, isAuthenticated, user]);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  if (conflictSession) {
    return (
      <SessionConflictModal
        isOpen={true}
        activeSession={conflictSession}
        targetApp="housing"
        onConfirmSwitch={async () => {
          await recordAppExit();
          await recordAppLaunch("housing", 1, "Staff Housing Global", user?.username);
          setConflictSession(null);
        }}
        onStayInCurrent={() => {
          if (conflictSession.app === "payroll") setLocation("/payroll");
          else if (conflictSession.app === "attendance") setLocation("/attendance");
          else if (conflictSession.app === "hrms") setLocation("/hrms");
          else setLocation("/apps");
        }}
      />
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

function ProtectedLauncher() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <SystemLauncher />;
}

function ProtectedHrSuiteLayout({
  children,
  activeModule,
}: {
  children: React.ReactNode;
  activeModule?: "hrms" | "payroll" | "attendance";
}) {
  const { isAuthenticated, isLoading, hrUser, propertyScope } = useHrAuth();
  const auth = useAuth();
  const [location, setLocation] = useLocation();
  const targetApp = activeModule || "hrms";

  const [conflictSession, setConflictSession] = useState<ActiveAppSession | null>(() => {
    const conflict = checkAppSessionConflict(targetApp);
    return conflict.hasConflict ? conflict.activeSession : null;
  });

  useEffect(() => {
    const conflict = checkAppSessionConflict(targetApp);
    setConflictSession(conflict.hasConflict ? conflict.activeSession : null);
    if (!conflict.hasConflict && (isAuthenticated || auth.isAuthenticated)) {
      recordAppLaunch(
        targetApp,
        propertyScope?.id ? Number(propertyScope.id) : null,
        propertyScope?.nameEn,
        hrUser?.username || auth.user?.username
      );
    }
  }, [targetApp, location, isAuthenticated, auth.isAuthenticated, hrUser, auth.user, propertyScope]);

  if (isLoading || auth.isLoading) return <PageLoader />;
  if (!isAuthenticated && !auth.isAuthenticated) return <Redirect to="/hr-portal" />;

  if (conflictSession) {
    return (
      <SessionConflictModal
        isOpen={true}
        activeSession={conflictSession}
        targetApp={targetApp}
        onConfirmSwitch={async () => {
          await recordAppExit();
          await recordAppLaunch(
            targetApp,
            propertyScope?.id ? Number(propertyScope.id) : null,
            propertyScope?.nameEn,
            hrUser?.username || auth.user?.username
          );
          setConflictSession(null);
        }}
        onStayInCurrent={() => {
          if (conflictSession.app === "housing") setLocation("/dashboard");
          else if (conflictSession.app === "payroll") setLocation("/payroll");
          else if (conflictSession.app === "attendance") setLocation("/attendance");
          else if (conflictSession.app === "hrms") setLocation("/hrms");
          else setLocation("/apps");
        }}
      />
    );
  }

  return (
    <HrSuiteLayout activeModule={activeModule}>
      {children}
    </HrSuiteLayout>
  );
}

/** Renders `children` if user has permission, else redirects to /dashboard */
function PermissionLayout({
  module,
  modules,
  action = "view",
  children,
}: {
  module?: Module;
  modules?: Module[];
  action?: Action;
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermission();
  const { language } = useLanguage();
  const ar = language === "ar";

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  // Strictly check permission (single module or any module from modules list)
  const targetModules = modules || (module ? [module] : []);
  const hasAccess = targetModules.some((m) => can(m, action));

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-5 py-24 px-4 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/5">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {ar ? "غير مصرح بالدخول (403)" : "Access Denied (403)"}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {ar
                ? "ليس لديك صلاحية لعرض أو استخدام هذه الصفحة. تم إغلاق هذا الموديول لحسابك. يرجى التواصل مع مسؤول النظام لطلب الصلاحية."
                : "You don't have permission to access this page. This module is restricted for your account. Contact your administrator to request access."}
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              {ar ? "العودة للرئيسية" : "Go to Home"}
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

interface AppRouteDef {
  path: string;
  module?: Module;
  modules?: Module[];
  action?: Action;
  component: React.ComponentType;
}

const APP_ROUTES: AppRouteDef[] = [
  { path: "/dashboard", module: "dashboard", component: Dashboard },
  { path: "/room-space-view", module: "housing", component: Housing },
  { path: "/housing", module: "housing", component: Housing },
  { path: "/profiles/:id", module: "profiles", component: ProfileDetail },
  { path: "/profiles", module: "profiles", component: Profiles },
  { path: "/accommodation/reservations", module: "reservations", component: Reservations },
  { path: "/accommodation/in-house", module: "accommodation", component: InHouse },
  { path: "/gate-scanner", module: "gate", component: GateScanner },
  { path: "/accommodation/room-assignment", module: "accommodation", component: RoomAssignment },
  { path: "/accommodation/guest-hosting", module: "guest_hosting", component: GuestHosting },
  { path: "/accommodation/history", module: "accommodation", component: History },
  { path: "/housekeeping", module: "housekeeping", component: Housekeeping },
  { path: "/maintenance/:id", modules: ["maintenance", "housekeeping"], component: MaintenanceDetails },
  { path: "/maintenance", modules: ["maintenance", "housekeeping"], component: Maintenance },
  { path: "/reports/configuration", module: "reports", action: "config", component: ReportConfiguration },
  { path: "/reports", module: "reports", component: Reports },
  { path: "/users/:id", module: "users", component: UserDetail },
  { path: "/users", module: "users", component: Users },
  { path: "/properties", module: "properties", component: Properties },
  { path: "/portal", module: "portal_content", component: Portal },
  { path: "/settings", module: "settings", component: Settings },
  { path: "/activity-log", module: "activity_log", component: ActivityLog },
  { path: "/hosting-requests/create", module: "hosting_requests", action: "create", component: CreateHostingRequest },
  { path: "/hosting-requests/:id/edit", module: "hosting_requests", action: "edit", component: EditHostingRequest },
  { path: "/hosting-requests/:id", module: "hosting_requests", action: "view", component: HostingRequestDetail },
  { path: "/hosting-requests", module: "hosting_requests", action: "view", component: HostingRequestsList },
];

/** Redirects unprefixed paths (e.g. /dashboard) to /:currentProperty/dashboard */
function UnprefixedRedirect({ targetPath }: { targetPath: string }) {
  const { propertySlug } = useProperty();
  const slug = propertySlug || "all";
  return <Redirect to={`/${slug}${targetPath}`} />;
}

/** Dynamically redirects user to their first available module based on permissions */
function RootRedirect() {
  const { can } = usePermission();
  const { isAuthenticated, isLoading } = useAuth();
  const { propertySlug } = useProperty();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Redirect to="/login" />;

  const slug = propertySlug || "all";

  const candidates: Array<{ module: Module; href: string }> = [
    { module: "dashboard", href: "/dashboard" },
    { module: "housing", href: "/housing" },
    { module: "profiles", href: "/profiles" },
    { module: "reservations", href: "/accommodation/reservations" },
    { module: "accommodation", href: "/accommodation/in-house" },
    { module: "guest_hosting", href: "/accommodation/guest-hosting" },
    { module: "hosting_requests", href: "/hosting-requests" },
    { module: "housekeeping", href: "/housekeeping" },
    { module: "maintenance", href: "/maintenance" },
    { module: "reports", href: "/reports" },
    { module: "users", href: "/users" },
    { module: "portal_content", href: "/portal" },
    { module: "settings", href: "/settings" },
    { module: "activity_log", href: "/activity-log" },
  ];

  for (const c of candidates) {
    if (can(c.module, "view")) {
      return <Redirect to={`/${slug}${c.href}`} />;
    }
  }

  return <Redirect to={`/${slug}/dashboard`} />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* 1. Login is always non-prefixed */}
        <Route path="/login">
          <Login />
        </Route>

        {/* Public Room Service via Door QR Code */}
        <Route path="/room-service">
          <RoomServiceLandingPage />
        </Route>

        {/* 2. Unified System Launcher (App Switcher) */}
        <Route path="/">
          <SystemLauncher />
        </Route>
        <Route path="/apps">
          <SystemLauncher />
        </Route>

        {/* Dedicated Pre-Entry Property Gate & Database Vault Selector */}
        <Route path="/hr-portal">
          <HrPropertyGatePage />
        </Route>
        <Route path="/payroll/login">
          <HrPropertyGatePage />
        </Route>
        <Route path="/attendance/login">
          <HrPropertyGatePage />
        </Route>

        {/* 2b. Unified HR Operations Suite (HRMS, Payroll, Attendance with persistent Sidebar) */}
        <Route path="/payroll">
          <ProtectedHrSuiteLayout activeModule="payroll">
            <PayrollPage />
          </ProtectedHrSuiteLayout>
        </Route>
        <Route path="/attendance">
          <ProtectedHrSuiteLayout activeModule="attendance">
            <AttendancePage />
          </ProtectedHrSuiteLayout>
        </Route>
        <Route path="/hrms">
          <ProtectedHrSuiteLayout activeModule="hrms">
            <HrmsSuitePage />
          </ProtectedHrSuiteLayout>
        </Route>

        {/* 3. Property-prefixed application routes (/:property/:route) */}
        {APP_ROUTES.map((r, i) => (
          <Route key={`prop-${r.path}-${i}`} path={`/:property${r.path}`}>
            <PermissionLayout module={r.module} modules={r.modules} action={r.action}>
              <r.component />
            </PermissionLayout>
          </Route>
        ))}

        {/* Accommodation sub-route shortcut under property */}
        <Route path="/:property/accommodation">
          {(params) => (
            <Redirect to={`/${params.property}/accommodation/reservations`} />
          )}
        </Route>

        {/* 4. Unprefixed fallback routes for backward compatibility */}
        {APP_ROUTES.map((r, i) => (
          <Route key={`unprefixed-${r.path}-${i}`} path={r.path}>
            {(params: any) => {
              let resolved = r.path;
              if (params && params.id) {
                resolved = resolved.replace(":id", params.id);
              }
              return <UnprefixedRedirect targetPath={resolved} />;
            }}
          </Route>
        ))}

        <Route path="/accommodation">
          <UnprefixedRedirect targetPath="/accommodation/reservations" />
        </Route>

        {/* 5. Property root alone (e.g. /taal_housing or /all) redirects to /:property/dashboard */}
        <Route path="/:property">
          {(params) => {
            if (RESERVED_FIRST_SEGMENTS.has(params.property.toLowerCase())) {
              return <RootRedirect />;
            }
            return <Redirect to={`/${params.property}/dashboard`} />;
          }}
        </Route>

        {/* 6. Catch-all 404 */}
        <Route>
          <ProtectedLayout>
            <NotFound />
          </ProtectedLayout>
        </Route>
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <LanguageProvider>
            <AuthProvider>
              <HrAuthProvider>
                <PropertyProvider>
                  <WebSocketProvider>
                    <TooltipProvider>
                      <WouterRouter>
                        <Router />
                      </WouterRouter>
                      <Toaster />
                      <SonnerToaster />
                    </TooltipProvider>
                  </WebSocketProvider>
                </PropertyProvider>
              </HrAuthProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
