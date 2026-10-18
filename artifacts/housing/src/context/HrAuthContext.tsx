import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface HrUser {
  id: number;
  username: string;
  fullName: string;
  email?: string | null;
  role: string;
  systemAccess: "payroll" | "attendance" | "both";
  propertyId?: number | null;
  permissions?: any;
}

interface HrAuthContextType {
  hrUser: HrUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, system?: "payroll" | "attendance" | "both") => Promise<void>;
  logout: () => Promise<void>;
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
      return json.user as HrUser;
    },
    retry: false,
    staleTime: 60_000,
  });

  const hrUser = data ?? null;
  const isAuthenticated = !!hrUser;

  const loginMutation = useMutation({
    mutationFn: async ({ username, password, system }: { username: string; password: string; system?: "payroll" | "attendance" | "both" }) => {
      const res = await fetch("/api/hr-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, system }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Login failed");
      }
      return json.user as HrUser;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["hr-auth-me"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/hr-auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["hr-auth-me"], null);
      queryClient.invalidateQueries({ queryKey: ["hr-auth-me"] });
    },
  });

  const login = async (username: string, password: string, system?: "payroll" | "attendance" | "both") => {
    await loginMutation.mutateAsync({ username, password, system });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
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
        isAuthenticated,
        isLoading,
        login,
        logout,
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
