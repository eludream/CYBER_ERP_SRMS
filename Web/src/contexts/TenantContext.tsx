import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Membership, multiTenantService } from "@/services/api/multiTenantService";
import { useAuth } from "@/contexts/AuthContext";
import { beginTenantSwitch } from "@/lib/apiActivity";

export interface Tenant { id: string; organizationId: string; organizationName: string; name: string; code: string; isActive: boolean; isOrganizationAdministrator: boolean }
interface TenantContextType { currentTenant: Tenant | null; tenants: Tenant[]; memberships: Membership[]; switchTenant: (tenantId: string) => Promise<void>; reloadMemberships: () => Promise<void>; isLoading: boolean; isReady: boolean; requiresSelection: boolean; hasInactiveMembership: boolean }
const TenantContext = createContext<TenantContextType | undefined>(undefined);
const toTenant = (m: Membership): Tenant => ({ id: m.tenantId, organizationId: m.organizationId, organizationName: m.organizationName, name: m.tenantName, code: m.tenantName, isActive: m.isActive, isOrganizationAdministrator: m.isOrganizationAdministrator });

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const switchTenant = useCallback(async (tenantId: string) => {
    const membership = memberships.find(item => item.tenantId === tenantId && item.isActive);
    if (!membership) throw new Error("The selected tenant is not an active membership.");
    const finishTenantSwitch = beginTenantSwitch();
    setIsLoading(true);
    try {
      await multiTenantService.select(membership.organizationId, membership.tenantId);
      setCurrentTenant(toTenant(membership));
      sessionStorage.setItem("erp_tenant_id", membership.tenantId);
      window.dispatchEvent(new CustomEvent("tenant:changed", { detail: { tenantId } }));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    } finally {
      setIsLoading(false);
      finishTenantSwitch();
    }
  }, [memberships]);
  const reloadMemberships = useCallback(async () => {
    setIsReady(false);
    setIsLoading(true);
    try { const rows = await multiTenantService.memberships(); setMemberships(rows); const activeRows = rows.filter(item => item.isActive); const saved = sessionStorage.getItem("erp_tenant_id"); const selected = activeRows.find(item => item.tenantId === saved) ?? activeRows.find(item => item.isDefaultTenant) ?? (user?.isPlatformAdministrator || import.meta.env.DEV || activeRows.length === 1 ? activeRows[0] : undefined); if (selected) { await multiTenantService.select(selected.organizationId, selected.tenantId); setCurrentTenant(toTenant(selected)); sessionStorage.setItem("erp_tenant_id", selected.tenantId); window.dispatchEvent(new CustomEvent("tenant:changed", { detail: { tenantId: selected.tenantId } })); } else { setCurrentTenant(null); sessionStorage.removeItem("erp_tenant_id"); } }
    finally { setIsLoading(false); setIsReady(true); }
  }, [user?.isPlatformAdministrator]);
  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      setMemberships([]);
      setCurrentTenant(null);
      setIsReady(false);
      return;
    }
    void reloadMemberships().catch(() => undefined);
  }, [isAuthenticated, isInitializing, reloadMemberships]);
  const tenants = memberships.map(toTenant);
  const activeMemberships = memberships.filter(item => item.isActive);
  return <TenantContext.Provider value={{ currentTenant, tenants, memberships, switchTenant, reloadMemberships, isLoading, isReady, requiresSelection: activeMemberships.length > 1 && !currentTenant, hasInactiveMembership: memberships.length > 0 && activeMemberships.length === 0 }}>{children}</TenantContext.Provider>;
};
export const useTenant = () => { const ctx = useContext(TenantContext); if (!ctx) throw new Error("useTenant must be used within TenantProvider"); return ctx; };
