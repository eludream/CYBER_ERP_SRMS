import { lazy } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import { routeSlug, subsystemPath } from "@/config/routes";
import { modules } from "@/config/modules";
import { useTenant } from "@/contexts/TenantContext";

const UserManagement = lazy(() => import("@/pages/security/UserManagement"));
const RolesPermissions = lazy(() => import("@/pages/security/RolesPermissions"));
const OperationManagement = lazy(() => import("@/pages/security/OperationManagement"));
const SystemLogs = lazy(() => import("@/pages/security/SystemLogs"));
const LegacySubsystemOperationsRoute = () => {
  const { moduleCode = "" } = useParams<{ moduleCode: string }>();
  const { currentTenant, tenants } = useTenant();
  const moduleName = modules.find(module => module.id === moduleCode)?.title ?? moduleCode;
  const destination = currentTenant
    ? subsystemPath(currentTenant.name, moduleName, tenants.filter(tenant => tenant.isActive).length > 1)
    : "/subsystems";
  return <Navigate to={destination} replace />;
};
const LegacyNamedSubsystemRoute = () => {
  const { moduleSlug = "" } = useParams<{ moduleSlug: string }>();
  const { currentTenant, tenants } = useTenant();
  return <Navigate to={currentTenant ? subsystemPath(currentTenant.name, moduleSlug, tenants.filter(tenant => tenant.isActive).length > 1) : "/subsystems"} replace />;
};
const LegacyTenantSubsystemRoute = () => {
  const { tenantSlug = "", moduleSlug = "" } = useParams<{ tenantSlug: string; moduleSlug: string }>();
  return <Navigate to={`/${tenantSlug}/${moduleSlug}`} replace />;
};
export const SubsystemLanding = () => {
  const { tenantSlug = "", moduleSlug = "" } = useParams<{ tenantSlug: string; moduleSlug: string }>();
  const { tenants } = useTenant();
  const showTenantInRoute = tenants.filter(tenant => tenant.isActive).length > 1;
  const resolvedModuleSlug = moduleSlug || (!showTenantInRoute ? tenantSlug : "");
  const securityModule = modules.find(module => module.id === "security");
  const securitySlugs = new Set([
    "002",
    "sams",
    "security",
    "security-admin",
    "security-and-admin",
    "security-and-admin-management-system",
    ...(securityModule ? [routeSlug(securityModule.title)] : []),
  ]);

  if (securitySlugs.has(resolvedModuleSlug)) {
    return <Navigate to={showTenantInRoute ? `/${tenantSlug}/${resolvedModuleSlug}/users` : `/${resolvedModuleSlug}/users`} replace />;
  }

  return <OperationManagement />;
};

export const securityRoutes: RouteObject[] = [
  { path: "/:tenantSlug/:moduleSlug/users", element: <UserManagement /> },
  { path: "/:tenantSlug/:moduleSlug/roles", element: <RolesPermissions /> },
  { path: "/:tenantSlug/:moduleSlug/logs", element: <SystemLogs /> },
  { path: "/:tenantSlug/:moduleSlug/modules", element: <OperationManagement /> },
  { path: "/security/users", element: <UserManagement /> },
  { path: "/security/roles", element: <RolesPermissions /> },
  { path: "/security/logs", element: <SystemLogs /> },
  { path: "/:moduleSlug/users", element: <UserManagement /> },
  { path: "/:moduleSlug/roles", element: <RolesPermissions /> },
  { path: "/:moduleSlug/logs", element: <SystemLogs /> },
  { path: "/:moduleSlug/modules", element: <OperationManagement /> },
  { path: "/:tenantSlug/:moduleSlug", element: <SubsystemLanding /> },
  { path: "/tenant/:tenantSlug/subsystem/:moduleSlug", element: <LegacyTenantSubsystemRoute /> },
  { path: "/subsystem/:tenantSlug/:moduleSlug", element: <LegacyTenantSubsystemRoute /> },
  { path: "/subsystem/:moduleSlug", element: <LegacyNamedSubsystemRoute /> },
  { path: "/:moduleCode/operations", element: <LegacySubsystemOperationsRoute /> },
];
