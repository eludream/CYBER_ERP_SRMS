import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { multiTenantService } from "@/services/api/multiTenantService";
import { routeSlug, tenantSubsystemsPath } from "@/config/routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const TenantSwitcher = ({ compact = false, moduleCode }: { compact?: boolean; moduleCode?: string }) => {
  const { currentTenant, tenants, switchTenant, isLoading } = useTenant();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const pathSegments = pathname.split("/").filter(Boolean);
  const tenantRoute = pathSegments.length > 0
    && tenants.some(tenant => routeSlug(tenant.name) === pathSegments[0])
    ? pathSegments
    : null;
  const operationModuleCode = moduleCode ?? pathname.match(/^\/([^/]+)\/operations\/?$/)?.[1] ?? null;
  const [moduleTenantIds, setModuleTenantIds] = useState<string[] | null>(null);

  useEffect(() => {
    let active = true;
    if (!operationModuleCode) {
      setModuleTenantIds(null);
      return;
    }
    void multiTenantService.moduleTenantIds(operationModuleCode)
      .then((ids) => { if (active) setModuleTenantIds(ids); })
      .catch(() => { if (active) setModuleTenantIds([]); });
    return () => { active = false; };
  }, [operationModuleCode]);

  const activeTenants = useMemo(() => tenants.filter(tenant => tenant.isActive), [tenants]);
  const visibleTenants = useMemo(
    () => moduleTenantIds === null ? activeTenants : activeTenants.filter((tenant) => moduleTenantIds.includes(tenant.id)),
    [activeTenants, moduleTenantIds],
  );
  const selectTenant = async (tenantId: string, tenantName: string) => {
    await switchTenant(tenantId);
    if (tenantRoute && tenantRoute.length > 1) {
      navigate(`/${routeSlug(tenantName)}/${tenantRoute.slice(1).join("/")}`, { replace: true });
    } else if (tenantRoute) {
      navigate(tenantSubsystemsPath(tenantName), { replace: true });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center rounded-lg transition-colors text-left hover:bg-muted/50 ${compact ? "min-h-11 gap-3 border border-border bg-card px-3 py-1.5 shadow-sm" : "w-full gap-2 px-3 py-2"}`}>
          <div className={`${compact ? "h-8 w-8" : "h-8 w-8"} rounded-lg bg-primary/10 flex items-center justify-center shrink-0`}>
            {currentTenant?.logo ? (
              <img src={currentTenant.logo} alt="" className="w-5 h-5 rounded" />
            ) : (
              <Building2 className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className={`flex-1 min-w-0 ${compact ? "hidden min-w-52 md:block" : ""}`}>
            <p className="truncate text-xs font-semibold leading-4 text-foreground">
              {isLoading ? "Switching..." : currentTenant?.name || "Select Company"}
            </p>
            <p className="mt-0.5 truncate text-[10px] leading-3 text-muted-foreground">
              {currentTenant?.organizationName} · {currentTenant?.code}
            </p>
          </div>
          <ChevronDown className={`${compact ? "ml-1" : ""} w-3.5 h-3.5 text-muted-foreground shrink-0`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} className="flex max-h-[var(--radix-dropdown-menu-content-available-height)] w-64 flex-col overflow-hidden p-1.5">
        <div className="shrink-0 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tenants</p>
        </div>
        <DropdownMenuSeparator className="shrink-0" />
        <div className="min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleTenants.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => void selectTenant(t.id, t.name)}
            className="gap-2 rounded-md px-2.5 py-2"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.organizationName} · {t.code}</p>
            </div>
            {currentTenant?.id === t.id && (
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TenantSwitcher;
