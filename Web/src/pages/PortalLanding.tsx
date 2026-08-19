import { useEffect, useMemo, useState } from "react";
import { Building2, LayoutGrid, Search } from "lucide-react";
import AccountMenu from "@/components/AccountMenu";
import AppFooter from "@/components/AppFooter";
import LucideIconPreview from "@/components/LucideIconPreview";
import TenantSwitcher from "@/components/TenantSwitcher";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { moduleService, ModuleDto } from "@/services/api/moduleService";
import { multiTenantService } from "@/services/api/multiTenantService";
import { platformAdminPaths, moduleBasePath, routeSlug, tenantSubsystemsPath } from "@/config/routes";
import { isSystemResourceModule } from "@/config/platformModules";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PortalLanding = () => {
  const { user, selectModule } = useAuth();
  const { currentTenant, tenants, hasInactiveMembership } = useTenant();
  const [applications, setApplications] = useState<ModuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const activeTenants = useMemo(() => tenants.filter(tenant => tenant.isActive), [tenants]);
  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter(application =>
      application.abbreviation.toLowerCase().includes(query)
      || application.name.toLowerCase().includes(query)
      || application.description.toLowerCase().includes(query),
    );
  }, [applications, searchQuery]);

  useEffect(() => {
    let active = true;
    if (!currentTenant) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      user?.isPlatformAdministrator ? Promise.resolve(null) : multiTenantService.entitlements(),
      moduleService.list(),
      user?.isPlatformAdministrator ? multiTenantService.modules() : Promise.resolve([]),
    ])
      .then(([entitlements, response, platformModules]) => {
        if (!active) return;
        const entitledIds = new Set(entitlements?.filter(item => item.isEffective).map(item => item.moduleId) ?? []);
        const catalog = [...response.data];
        const systemResource = platformModules.find(isSystemResourceModule);
        if (systemResource && !catalog.some(application => application.id === systemResource.id)) {
          catalog.push({
            ...systemResource,
            subSystem: systemResource.abbreviation || systemResource.name,
            icon: systemResource.icon ?? null,
            moduleCount: 0,
            operationCount: 0,
          });
        }
        const catalogWithSystemResourceCounts = catalog.map(application =>
          isSystemResourceModule(application)
            ? {
                ...application,
                moduleCount: application.moduleCount === 0 ? 1 : application.moduleCount,
                operationCount: application.operationCount === 0 ? 6 : application.operationCount,
              }
            : application,
        );
        setApplications(catalogWithSystemResourceCounts
          .filter(application =>
            application.isActive
            && application.code.trim().toLowerCase() !== "002"
            && application.code.toLowerCase() !== "security"
            && routeSlug(application.name) !== "security-admin"
            && (user?.isPlatformAdministrator || entitledIds.has(application.id)),
          )
          .sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)));
      })
      .catch(error => {
        if (active) toast.error(error instanceof Error ? error.message : "Unable to load applications");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [currentTenant, user?.isPlatformAdministrator]);

  const openApplication = (application: ModuleDto) => {
    selectModule(application.code);
    if (isSystemResourceModule(application)) {
      const destination = user?.isPlatformAdministrator
        ? platformAdminPaths.organization
        : activeTenants.length > 1 && currentTenant
          ? tenantSubsystemsPath(currentTenant.name)
          : "/subsystems";
      window.location.assign(`${moduleBasePath(application.abbreviation)}${destination}`);
      return;
    }
    window.location.assign(application.landingPath);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="flex h-14 w-full items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-[15px] font-bold text-foreground">Cyber<span className="text-primary">ERP</span></span>
          </div>
          <AccountMenu />
        </div>
      </header>

      <main className="relative flex-1 px-6 pb-8 pt-5 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/[0.04] to-transparent" />
        <div className="relative w-full">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/10 text-primary shadow-sm">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">CyberERP Portal</p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">Welcome, {user?.name}</h1>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Select an application below to continue.</p>
              </div>
            </div>
            {!user?.isPlatformAdministrator && <TenantSwitcher compact />}
          </div>

          <section aria-label="Applications">
            <div className="mb-5 flex flex-col gap-3 rounded-xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="application-search" type="search" autoComplete="off" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search applications…" aria-label="Search applications" className="h-9 bg-background pl-9" />
              </div>
              {!loading && <div className="px-2 text-xs text-muted-foreground">{applications.length} sub system{applications.length === 1 ? "" : "s"}</div>}
            </div>

            {loading ? <LoadingIndicator variant="page" /> : applications.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
                {hasInactiveMembership ? <><h2 className="text-lg font-semibold text-foreground">Tenant access inactive</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">Your tenant membership or tenant is inactive. Contact your platform or organization administrator to reactivate your access.</p></> : <p className="text-sm text-muted-foreground">No active applications are available for this tenant.</p>}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-card px-6 py-14 text-center">
                <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <h3 className="mt-3 font-display text-sm font-semibold">No matching applications</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try a different application name or description.</p>
                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setSearchQuery("")}>Clear search</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {filteredApplications.map(application => (
                  <button key={application.id} type="button" onClick={() => openApplication(application)} className="group relative flex h-fit flex-col overflow-hidden rounded-xl border border-border/80 bg-card p-5 text-left font-body shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.06] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/0 transition-colors duration-200 group-hover:bg-primary/70" />
                    <div className="flex h-11 w-11 shrink-0 self-center items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary transition-colors group-hover:bg-primary/10">
                      {application.icon ? <LucideIconPreview name={application.icon} className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                    </div>
                    <div className="mt-4 flex min-w-0 items-center gap-2.5">
                      <span className="shrink-0 rounded-lg border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-xs font-semibold text-primary">{application.abbreviation || application.code}</span>
                      <h3 className="truncate font-body text-base font-medium tracking-tight text-foreground">{application.name}</h3>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-muted-foreground">{application.description}</p>
                    <div className="mt-4 grid grid-cols-2 rounded-lg bg-[#f3f6fe] py-1.5 text-center dark:bg-muted/60">
                      <div className="border-r border-border">
                        <div className="text-lg font-semibold leading-5 tabular-nums text-foreground">{application.moduleCount}</div>
                        <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Modules</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold leading-5 tabular-nums text-foreground">{application.operationCount}</div>
                        <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Operations</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <AppFooter />
    </div>
  );
};

export default PortalLanding;
