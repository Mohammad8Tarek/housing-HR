import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface PropertyScope {
  id?: number | string;
  code: string;
  nameEn: string;
  nameAr: string;
  category: "permanent" | "casuals";
  ledgerCode?: string;
  badge?: string;
}

export interface HrUser {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  role: string;
  systemAccess: "payroll" | "attendance" | "both";
  propertyId?: number | null;
  propertyScope?: PropertyScope | null;
  permissions?: any;
}

interface HrAuthContextType {
  hrUser: HrUser | null;
  propertyScope: PropertyScope | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, system?: "payroll" | "attendance" | "both", propertyScope?: PropertyScope) => Promise<void>;
  logout: () => Promise<void>;
  verifyPin: (pin: string, action?: string, reason?: string) => Promise<{ success: boolean; auditStamp: string }>;
  can: (module: "payroll" | "attendance", action: string) => boolean;
}

const HrAuthContext = createContext<HrAuthContextType | undefined>(undefined);

export function HrAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch current HR user session
  const { data, isLoading, error } = useQuery({
    queryKey: ["hr-auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/hr-auth/me");
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to load HR session");
      }
      const json = await res.json();
      return (json.user || null) as HrUser | null;
    },
    retry: false,
    staleTime: 60_000,
  });

  const hrUser = data ?? null;
  const isAuthenticated = !!hrUser;

  const [activePropertyScope, setActivePropertyScope] = useState<PropertyScope | null>(() => {
    try {
      const saved = sessionStorage.getItem("hr_property_vault_scope");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const propertyScope = hrUser?.propertyScope || activePropertyScope || {
    id: 1,
    code: "MRK-01",
    nameEn: "Meraki Resort (Permanent Staff)",
    nameAr: "منتجع ميراكي شرم الشيخ (العمالة الدائمة)",
    category: "permanent" as const,
    ledgerCode: "PERM-EXEC-FY2025",
    badge: "MRK-01 • Sharm El Sheikh",
  };

  const loginMutation = useMutation({
    mutationKey: ["hr-login"],
    mutationFn: async ({
      username,
      password,
      system,
      propertyScope,
    }: {
      username: string;
      password: string;
      system?: "payroll" | "attendance" | "both";
      propertyScope?: PropertyScope;
    }) => {
      const res = await fetch("/api/hr-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, system, propertyScope }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Login failed");
      }
      return json.user as HrUser;
    },
    onSuccess: (user) => {
      if (user.propertyScope) {
        setActivePropertyScope(user.propertyScope);
        sessionStorage.setItem("hr_property_vault_scope", JSON.stringify(user.propertyScope));
      }
      queryClient.setQueryData(["hr-auth-me"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationKey: ["hr-logout"],
    mutationFn: async () => {
      await fetch("/api/hr-auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      sessionStorage.removeItem("hr_property_vault_scope");
      setActivePropertyScope(null);
      queryClient.setQueryData(["hr-auth-me"], null);
      queryClient.invalidateQueries({ queryKey: ["hr-auth-me"] });
    },
  });

  const login = async (
    username: string,
    password: string,
    system?: "payroll" | "attendance" | "both",
    scope?: PropertyScope
  ) => {
    if (scope) {
      setActivePropertyScope(scope);
      sessionStorage.setItem("hr_property_vault_scope", JSON.stringify(scope));
    }
    await loginMutation.mutateAsync({ username, password, system, propertyScope: scope });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const verifyPin = async (
    pin: string,
    action: string = "approval",
    reason?: string
  ): Promise<{ success: boolean; auditStamp: string }> => {
    const res = await fetch("/api/hr-auth/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, action, reason }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "رمز التأكيد الأمني المزدوج غير صحيح");
    }
    return { success: true, auditStamp: json.auditStamp };
  };

  const can = (module: "payroll" | "attendance", action: string): boolean => {
    if (!hrUser) return false;
    if (hrUser.role === "super_admin") return true;

    // Check system scope
    if (hrUser.systemAccess !== "both" && hrUser.systemAccess !== module) {
      return false;
    }

    const perms = hrUser.permissions?.[module];
    if (!perms) return false;
    return !!perms[action];
  };

  return (
    <HrAuthContext.Provider
      value={{
        hrUser,
        propertyScope,
        isAuthenticated,
        isLoading,
        login,
        logout,
        verifyPin,
        can,
      }}
    >
      {children}
    </HrAuthContext.Provider>
  );
}

export function useHrAuth() {
  const context = useContext(HrAuthContext);
  if (!context) {
    throw new Error("useHrAuth must be used within an HrAuthProvider");
  }
  return context;
}
