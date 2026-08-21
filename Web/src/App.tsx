import { Fragment, Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from "react-router-dom";
import { Building2, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { HttpError } from "@/services/api/httpClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ERPProvider } from "@/contexts/ERPContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { WorkflowDesignerProvider } from "@/contexts/WorkflowDesignerContext";
import { resolveSystemResourceLocation, SystemResourceRoutingProvider, useSystemResourceRouting } from "@/contexts/SystemResourceRoutingContext";
import AppHeader from "@/components/AppHeader";
import DashboardLayout from "@/components/DashboardLayout";
import LoadingIndicator from "@/components/LoadingIndicator";
import GlobalRequestLoader from "@/components/GlobalRequestLoader";
import { moduleRoutes } from "@/routes";
import { SubsystemLanding } from "@/routes/securityRoutes";
import { platformAdminPaths, tenantSubsystemsPath, matchesModuleBasePath } from "@/config/routes";

// ── Eagerly loaded pages (login, shell) ──
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";

// ── Lazy loaded top-level pages ──
const Home = lazy(() => import("@/pages/Home"));
const ModuleSelector = lazy(() => import("@/pages/ModuleSelector"));
const PortalLanding = lazy(() => import("@/pages/PortalLanding"));
const PlatformAdministration = lazy(() => import("@/pages/administration/PlatformAdministration"));
const PlatformOperationMaintenance = lazy(() => import("@/pages/administration/PlatformOperationMaintenancePage"));
const OrganizationAdministration = lazy(() => import("@/pages/administration/OrganizationAdministrationView"));
const TenantAdministration = lazy(() => import("@/pages/administration/TenantAdministration"));

// ── Loading fallback ──
const PageLoader = () => <LoadingIndicator variant="page" />;
const RootLoginRedirect = () => {
  window.location.replace("/");
  return <PageLoader />;
};

// ── Global error handler for React Query ──
function handleGlobalError(error: unknown) {
  if (error instanceof HttpError) {
    if (error.status === 401) return;

    const friendlyMessages: Record<number, string> = {
      400: "Invalid request. Please check your input and try again.",
      403: "You don't have permission to perform this action.",
      404: "The requested resource was not found.",
      408: "The request timed out. Please try again.",
      409: "A conflict occurred. The record may have been modified by another user.",
      422: "Validation failed. Please check the form fields.",
      429: "Too many requests. Please wait a moment and try again.",
      500: "An internal server error occurred. Please try again later.",
      502: "The server is temporarily unavailable. Please try again.",
      503: "Service is under maintenance. Please try again shortly.",
    };

    const title = friendlyMessages[error.status] || error.message;
    const description = error.errors?.length ? error.errors.join("; ") : undefined;
    toast.error(title, { description, duration: 6000 });
  } else if (error instanceof TypeError && (error as TypeError).message.toLowerCase().includes("fetch")) {
    toast.error("Network error", {
      description: "Unable to reach the server. Please check your connection.",
      duration: 6000,
    });
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (error) => handleGlobalError(error) }),
  mutationCache: new MutationCache({ onError: (error) => handleGlobalError(error) }),
});

// ── Protected route wrapper ──
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitializing } = useAuth();
  if (isInitializing) return <PageLoader />;
  if (!isAuthenticated) return <RootLoginRedirect />;
  return <>{children}</>;
};

const AccessBlocked = ({
  title,
  description,
  variant = "no-access",
}: {
  title: string;
  description: string;
  variant?: "no-access" | "inactive";
}) => {
  const Icon = variant === "inactive" ? ShieldOff : Building2;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader standalone />
      <main className="relative flex flex-1 items-center justify-center p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/[0.05] to-transparent" />
        <section className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/80 bg-card px-7 py-8 text-center shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            {variant === "inactive" ? "Access suspended" : "Workspace unavailable"}
          </p>
          <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        </section>
      </main>
    </div>
  );
};

const TenantProtectedRoute = ({ children, allowInactiveMembership = false }: { children: React.ReactNode; allowInactiveMembership?: boolean }) => {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const { currentTenant, memberships, switchTenant, isReady, requiresSelection, hasInactiveMembership } = useTenant();
  if (isInitializing) return <PageLoader />;
  if (!isAuthenticated) return <RootLoginRedirect />;
  if (!isReady) return <PageLoader />;
  if (user?.isPlatformAdministrator && !currentTenant && !requiresSelection) return <>{children}</>;
  if (hasInactiveMembership && !currentTenant && allowInactiveMembership) return <>{children}</>;
  if (hasInactiveMembership && !currentTenant) {
    return (
      <AccessBlocked
        variant="inactive"
        title="Tenant access inactive"
        description="Your tenant membership or tenant is inactive. Contact your platform or organization administrator to reactivate your access."
      />
    );
  }
  if (requiresSelection) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Select an organization and tenant</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose the workspace you want to use for this session.</p>
          <div className="mt-6 space-y-3">
            {memberships.filter(membership => membership.isActive).map(membership => (
              <Button key={membership.tenantId} variant="outline" className="h-auto w-full justify-start py-3 text-left" onClick={() => void switchTenant(membership.tenantId)}>
                <span><span className="block font-medium">{membership.tenantName}</span><span className="block text-xs text-muted-foreground">{membership.organizationName}</span></span>
              </Button>
            ))}
          </div>
        </section>
      </main>
    );
  }
  if (!currentTenant) {
    return (
      <AccessBlocked
        title="No workspace access"
        description="Your account is signed in, but it is not assigned to any organization tenant or roles. Ask a platform or organization administrator to grant access, then sign in again."
      />
    );
  }
  return <Fragment key={currentTenant.id}>{children}</Fragment>;
};

const LoginRoute = () => {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const { isReady, currentTenant, hasInactiveMembership, memberships } = useTenant();
  const { basePath } = useSystemResourceRouting();
  if (isInitializing) return <PageLoader />;
  const onAppPrefix = matchesModuleBasePath(window.location.pathname, basePath);
  if (!isAuthenticated) {
    if (onAppPrefix) return <RootLoginRedirect />;
    return <LoginPage />;
  }
  if (!user?.isPlatformAdministrator && !isReady) return <PageLoader />;
  if (!user?.isPlatformAdministrator && isReady && (hasInactiveMembership || (!currentTenant && memberships.length === 0))) {
    if (hasInactiveMembership) {
      return (
        <AccessBlocked
          variant="inactive"
          title="Tenant access inactive"
          description="Your tenant membership or tenant is inactive. Contact your platform or organization administrator to reactivate your access."
        />
      );
    }
    return (
      <AccessBlocked
        title="No workspace access"
        description="Your account is signed in, but it is not assigned to any organization tenant or roles. Ask a platform or organization administrator to grant access, then sign in again."
      />
    );
  }
  const destination = user?.isPlatformAdministrator ? platformAdminPaths.organization : "/subsystems";
  if (!onAppPrefix) {
    window.location.assign(`${basePath}${destination}`);
    return <PageLoader />;
  }
  if (user?.isPlatformAdministrator) return <Navigate to={destination} replace />;
  return <TenantProtectedRoute><Navigate to={destination} replace /></TenantProtectedRoute>;
};

const SrmsPathGuard = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  const { basePath } = useSystemResourceRouting();
  if (!matchesModuleBasePath(window.location.pathname, basePath)) return <NotFound />;
  if (isInitializing) return <PageLoader />;
  if (!isAuthenticated) return <RootLoginRedirect />;
  return <Outlet />;
};

const TenantSubsystemsRedirect = () => {
  const { currentTenant, tenants } = useTenant();
  const activeTenantCount = tenants.filter(tenant => tenant.isActive).length;
  if (activeTenantCount <= 1) return <ModuleSelector />;
  return currentTenant ? <Navigate to={tenantSubsystemsPath(currentTenant.name)} replace /> : <ModuleSelector />;
};
const LegacyTenantSubsystemsRedirect = () => {
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  return <Navigate to={`/${tenantSlug}`} replace />;
};

const TenantOrSubsystemRoute = () => {
  const { tenants } = useTenant();
  const hasMultipleActiveTenants = tenants.filter(tenant => tenant.isActive).length > 1;

  return hasMultipleActiveTenants
    ? <TenantProtectedRoute><ModuleSelector /></TenantProtectedRoute>
    : <TenantProtectedRoute><DashboardLayout /></TenantProtectedRoute>;
};

// ── Route tree ──
const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<LoginRoute />} />
      <Route element={<SrmsPathGuard />}>
      <Route path="/home" element={<TenantProtectedRoute><Home /></TenantProtectedRoute>} />
      <Route path="/platform-admin" element={<Navigate to={platformAdminPaths.organization} replace />} />
      <Route path="/platform-admin/:section" element={<ProtectedRoute><PlatformAdministration /></ProtectedRoute>} />
      <Route path="/platform-admin/subsystems/:moduleId/operations" element={<ProtectedRoute><PlatformOperationMaintenance /></ProtectedRoute>} />
      <Route path="/platform-admin/subsystems/:moduleId/modules" element={<ProtectedRoute><PlatformOperationMaintenance /></ProtectedRoute>} />
      <Route path="/platform-admin/modules/:moduleId/operations" element={<Navigate to={platformAdminPaths.subsystems} replace />} />
      <Route path="/:tenantSlug" element={<TenantOrSubsystemRoute />}>
        <Route index element={<SubsystemLanding />} />
      </Route>
      <Route path="/:tenantSlug/subsystems" element={<TenantProtectedRoute><LegacyTenantSubsystemsRedirect /></TenantProtectedRoute>} />
      <Route path="/subsystems" element={<TenantProtectedRoute><TenantSubsystemsRedirect /></TenantProtectedRoute>} />
      <Route path="/modules" element={<Navigate to="/subsystems" replace />} />
      <Route path="/organization-admin" element={<TenantProtectedRoute><OrganizationAdministration /></TenantProtectedRoute>} />
      <Route path="/tenant-admin" element={<TenantProtectedRoute><TenantAdministration /></TenantProtectedRoute>} />

      {/* All module routes inside DashboardLayout */}
      <Route element={<TenantProtectedRoute><DashboardLayout /></TenantProtectedRoute>}>
        {moduleRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        {moduleRoutes.filter(route => !route.path?.includes(":tenantSlug")).map((route) => (
          <Route key={`tenant-${route.path}`} path={`/:tenantSlug${route.path}`} element={route.element} />
        ))}
      </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

// ── App shell ──
const AppShell = () => {
  const { basePath } = useSystemResourceRouting();
  const [locationState, setLocationState] = useState(() => resolveSystemResourceLocation(basePath));

  useEffect(() => {
    const next = resolveSystemResourceLocation(basePath);
    if (next.action === "redirect") {
      window.location.replace(next.href);
      return;
    }
    setLocationState(next);
  }, [basePath]);

  if (locationState.action === "redirect") return <PageLoader />;
  if (locationState.action === "not-found") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="max-w-lg rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in at the site root, then continue into the application.</p>
          <a className="mt-4 inline-block text-sm text-primary underline" href="/">Go to sign in</a>
        </section>
      </main>
    );
  }

  return (
    <BrowserRouter
      key={locationState.action === "app" ? basePath : "login"}
      basename={locationState.action === "app" ? basePath : undefined}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <TenantProvider>
          <ERPProvider>
            <WorkflowProvider>
            <WorkflowDesignerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <GlobalRequestLoader />
              <AppRoutes />
            </TooltipProvider>
            </WorkflowDesignerProvider>
            </WorkflowProvider>
          </ERPProvider>
        </TenantProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SystemResourceRoutingProvider>
          <AppShell />
        </SystemResourceRoutingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
