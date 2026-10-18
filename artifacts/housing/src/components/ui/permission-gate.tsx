import type { ReactNode } from "react";
import { usePermission } from "@/hooks/use-permission";
import { useHrAuth } from "@/context/HrAuthContext";
import type { Module, Action } from "@/lib/permissions";

interface PermissionGateProps {
  module?: Module;
  action?: Action;
  anyPermission?: [Module, Action][];
  /** Fallback to render if permission is denied. Defaults to null. */
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  module,
  action,
  anyPermission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can: housingCan } = usePermission();
  const { can: hrCan } = useHrAuth();

  const check = (m?: Module, a?: Action) => {
    if (!m || !a) return true;
    if (m === "payroll" || m === "attendance") {
      return hrCan(m, a) || housingCan(m, a);
    }
    return housingCan(m, a);
  };

  if (anyPermission && anyPermission.length > 0) {
    if (!anyPermission.some(([m, a]) => check(m, a))) return <>{fallback}</>;
    return <>{children}</>;
  }
  if (module && action) {
    if (!check(module, action)) return <>{fallback}</>;
  }
  return <>{children}</>;
}
