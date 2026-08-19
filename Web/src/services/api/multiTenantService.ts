import { beginApiActivity } from "@/lib/apiActivity";

const apiUrl = (path: string) => path.startsWith("/api/") ? path : `/api/${path}`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const finishActivity = beginApiActivity(init?.method || "GET");
  const token = localStorage.getItem("auth_token");
  try {
    const response = await fetch(apiUrl(path), {
      ...init,
      credentials: "include",
      headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
    });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || payload.message || `Request failed (${response.status})`); }
    return response.status === 204 ? undefined as T : response.json();
  } finally {
    finishActivity();
  }
}

async function upload<T>(path: string, file: File): Promise<T> {
  const finishActivity = beginApiActivity("POST");
  const token = localStorage.getItem("auth_token");
  const body = new FormData();
  body.append("file", file);
  try {
    const response = await fetch(apiUrl(path), {
      method: "POST", body, credentials: "include",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || payload.message || `Request failed (${response.status})`); }
    return response.json();
  } finally {
    finishActivity();
  }
}

export interface Membership { organizationId: string; organizationName: string; tenantId: string; tenantName: string; isOrganizationAdministrator: boolean; isDefaultTenant: boolean; isActive: boolean }
export interface Entitlement { id: string; moduleId: string; moduleCode: string; moduleName: string; moduleDescription?: string; startDate: string; endDate: string | null; status: boolean; isEffective: boolean }
export interface OrganizationRecord {
  id: string;
  code: string;
  legalName: string;
  displayName: string;
  registrationNumber: string | null;
  taxNumber: string | null;
  tinNumber: string | null;
  organizationType: string | null;
  industry: string | null;
  website: string | null;
  logoUrl: string | null;
  address: string | null;
  postalAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  primaryContactName: string | null;
  primaryContactTitle: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  currency: string;
  timezone: string;
  locale: string;
  defaultLanguage: string;
  dateFormat: string;
  fiscalYearStartMonth: number;
  dataRetentionPolicy: string | null;
  regulatoryIdentifiers: string | null;
  isActive: boolean;
}
export interface PlatformModuleRecord { id: string; code: string; name: string; abbreviation: string; description: string; landingPath: string; icon?: string; displayOrder: number; isActive: boolean }
export interface PlatformOperationRecord { id: string; moduleId: string; parentOperationId: string | null; name: string; link: string; filter: string; icon: string; displayOrder: number; isActive: boolean }
export interface SubscriptionPlanRecord { id: string; code: string; name: string; description: string; price: number; billingCycle: string; maxUsers: number; maxStorageGB: number; trialDays: number; isActive: boolean; moduleIds: string[] }
export interface RoleTemplateRecord { id: string; code: string; name: string; description: string; isActive: boolean; isPlatformRole: boolean }
export interface TenantRecord { id: string; organizationId: string; identifier: string; name: string; isActive: boolean; tenantTypeId: string | null; tenantTypeName?: string | null; moduleIds: string[] }
export interface LookupCategoryItemRecord { id: string; categoryId: string; code: string; name: string; displayOrder: number }
export interface LookupCategoryRecord { id: string; code: string; name: string; displayOrder: number; items: LookupCategoryItemRecord[] }
export interface PlatformUserRecord { id: string; employeeId?: string | null; employeeFullName?: string | null; employeeNumber?: string | null; fullName: string; email: string; phoneNumber: string; userName: string; accountStatus: boolean; twoFactorEnabled: boolean; lockoutEndUtc?: string | null; isPlatformAdministrator: boolean; createdAt: string; tenantCount: number; roleIds: string[]; profilePictureUrl?: string | null }
export interface PlatformSystemSettings {
  id?: string; minimumPasswordLength: number; requireUppercase: boolean; requireNumbers: boolean;
  requireSpecialCharacters: boolean; passwordExpiryDays: number; passwordHistoryCount: number;
  sessionTimeoutMinutes: number; maxConcurrentSessions: number; maxLoginAttempts: number;
  lockoutDurationMinutes: number; enforceTwoFactorForAll: boolean; enforceTwoFactorForAdmins: boolean;
  smtpHost: string; smtpPort: number; smtpUser: string; smtpUseTls: boolean;
  autoBackup: boolean; backupFrequency: string; backupRetentionDays: number;
}

export const multiTenantService = {
  memberships: () => request<Membership[]>("/api/tenant-context/memberships"),
  moduleTenantIds: (moduleCode: string) => request<string[]>(`/api/tenant-context/module-tenants/${encodeURIComponent(moduleCode)}`),
  select: (organizationId: string, tenantId: string) => request<{ organizationId: string; tenantId: string }>("/api/tenant-context/select", { method: "POST", body: JSON.stringify({ organizationId, tenantId }) }),
  entitlements: () => request<Entitlement[]>("/api/tenant/modules"),
  organizations: () => request<OrganizationRecord[]>("/api/platform/organizations"),
  lookupCategories: () => request<LookupCategoryRecord[]>("/api/v1.0/lookup-categories"),
  platformUsers: () => request<PlatformUserRecord[]>("/api/platform/users"),
  savePlatformUser: (value: { employeeId?: string | null; fullName: string; email: string; phoneNumber: string; userName: string; password?: string; accountStatus: boolean; twoFactorEnabled: boolean; isPlatformAdministrator: boolean; roleIds?: string[] }, id?: string) =>
    request<void | { id: string }>(id ? `/api/platform/users/${id}` : "/api/platform/users", { method: id ? "PUT" : "POST", body: JSON.stringify(value) }),
  deletePlatformUser: (id: string) => request<void>(`/api/platform/users/${id}`, { method: "DELETE" }),
  modules: async () => {
    const rows = await request<PlatformModuleRecord[]>("/api/platform/modules");
    return [...rows].sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name));
  },
  platformSystemSettings: () => request<PlatformSystemSettings>("/api/platform/system-settings"),
  savePlatformSystemSettings: (value: PlatformSystemSettings) => request<PlatformSystemSettings>("/api/platform/system-settings", { method: "PUT", body: JSON.stringify(value) }),
  saveOrganization: (value: Omit<OrganizationRecord, "id">, id?: string) => request<OrganizationRecord>(id ? `/api/platform/organizations/${id}` : "/api/platform/organizations", { method: id ? "PUT" : "POST", body: JSON.stringify(value, (key, current) => key === "logoUrl" ? undefined : current) }),
  uploadOrganizationLogo: (id: string, file: File) => upload<{ logoUrl: string }>(`/api/platform/organizations/${id}/logo`, file),
  deleteOrganizationLogo: (id: string) => request<void>(`/api/platform/organizations/${id}/logo`, { method: "DELETE" }),
  deleteOrganization: (id: string) => request<void>(`/api/platform/organizations/${id}`, { method: "DELETE" }),
  organizationTenantsForPlatform: async (organizationId: string) => {
    const rows = await request<Array<Omit<TenantRecord, "moduleIds">>>(`/api/platform/organizations/${organizationId}/tenants`);
    return Promise.all(rows.map(async tenant => ({ ...tenant, moduleIds: (await request<Entitlement[]>(`/api/platform/organizations/${organizationId}/tenants/${tenant.id}/entitlements`)).map(x => x.moduleId) })));
  },
  saveTenant: (organizationId: string, value: Omit<TenantRecord, "id">, id?: string) => request<TenantRecord>(id ? `/api/platform/organizations/${organizationId}/tenants/${id}` : `/api/platform/organizations/${organizationId}/tenants`, { method: id ? "PUT" : "POST", body: JSON.stringify(value) }),
  deleteTenant: (organizationId: string, id: string) => request<void>(`/api/platform/organizations/${organizationId}/tenants/${id}`, { method: "DELETE" }),
  saveModule: (value: Omit<PlatformModuleRecord, "id"> & { subSystem: string }, id?: string) => request<PlatformModuleRecord>(id ? `/api/platform/modules/${id}` : "/api/platform/modules", { method: id ? "PUT" : "POST", body: JSON.stringify(value) }),
  deleteModule: (id: string) => request<void>(`/api/platform/modules/${id}`, { method: "DELETE" }),
  operations: (moduleId: string) => request<PlatformOperationRecord[]>(`/api/platform/modules/${moduleId}/operations`),
  saveOperation: (moduleId: string, value: Omit<PlatformOperationRecord, "id" | "moduleId">, id?: string) => request<PlatformOperationRecord>(id ? `/api/platform/modules/${moduleId}/operations/${id}` : `/api/platform/modules/${moduleId}/operations`, { method: id ? "PUT" : "POST", body: JSON.stringify(value) }),
  deleteOperation: (moduleId: string, id: string) => request<void>(`/api/platform/modules/${moduleId}/operations/${id}`, { method: "DELETE" }),
  saveTenantNavigationModule: (subSystemId: string, value: Omit<PlatformOperationRecord, "id" | "moduleId">, id?: string) => request<PlatformOperationRecord>(id ? `/api/tenant/sub-systems/${subSystemId}/modules/${id}` : `/api/tenant/sub-systems/${subSystemId}/modules`, { method: id ? "PUT" : "POST", body: JSON.stringify(value) }),
  deleteTenantNavigationModule: (subSystemId: string, id: string) => request<void>(`/api/tenant/sub-systems/${subSystemId}/modules/${id}`, { method: "DELETE" }),
  templates: () => request<RoleTemplateRecord[]>("/api/platform/standard-role-templates"),
  saveTemplate: (value: { code: string; name: string; description: string; isPlatformRole: boolean; isActive: boolean }, id?: string) => request<RoleTemplateRecord>(id ? `/api/platform/standard-role-templates/${id}` : "/api/platform/standard-role-templates", { method: id ? "PUT" : "POST", body: JSON.stringify(value) }),
  deleteTemplate: (id: string) => request<void>(`/api/platform/standard-role-templates/${id}`, { method: "DELETE" }),
  plans: () => request<SubscriptionPlanRecord[]>("/api/platform/subscription-plans"),
  savePlan: (value: { name: string; description: string; price: number; billingCycle: string; maxUsers: number; maxStorageGB: number; trialDays: number; isActive: boolean; moduleIds: string[] }, id?: string) => request<void | { id: string; code: string }>(id ? `/api/platform/subscription-plans/${id}` : "/api/platform/subscription-plans", { method: id ? "PUT" : "POST", body: JSON.stringify(value) }),
  deletePlan: (id: string) => request<void>(`/api/platform/subscription-plans/${id}`, { method: "DELETE" }),
  tenantUsers: () => request<Array<{ membershipId: string; userId: string; fullName: string; userName: string; email: string; status: string; isDefaultTenant: boolean; profilePictureUrl?: string | null; standardRoleIds: string[] }>>("/api/tenant/users"),
  tenantStandardRoles: () => request<Array<{ id: string; code: string; name: string; description: string }>>("/api/tenant/standard-roles"),
  availableTenantUsers: () => request<Array<{ id: string; fullName: string; email: string; phoneNumber: string; userName: string; profilePictureUrl?: string | null }>>("/api/tenant/available-users"),
  saveTenantUser: (value: { userId: string; isDefaultTenant: boolean; isActive: boolean; standardRoleIds: string[] }, membershipId?: string) =>
    request<void>(membershipId ? `/api/tenant/users/${membershipId}` : "/api/tenant/users", { method: membershipId ? "PUT" : "POST", body: JSON.stringify(value) }),
  removeTenantUser: (membershipId: string) => request<void>(`/api/tenant/users/${membershipId}`, { method: "DELETE" }),
  tenantOperations: () => request<Array<{ id: string; operationId: string; moduleId: string; parentOperationId: string | null; parentOperationName?: string | null; name: string; isActive: boolean }>>("/api/tenant/operations"),
  tenantRoles: () => request<Array<{ id: string; code: string; name: string; description?: string; roleId?: string; isCustomized: boolean; userCount: number; permissions: Array<{ tenantOperationId: string; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean; canApprove: boolean; canExport: boolean }> }>>("/api/tenant/roles"),
  createTenantRole: (value: { code: string; name: string; roleId: string; permissions: Array<{ tenantOperationId: string; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean; canApprove: boolean; canExport: boolean }> }) =>
    request<{ id: string }>("/api/tenant/roles", { method: "POST", body: JSON.stringify(value) }),
  saveTenantRolePermissions: (roleId: string, permissions: Array<{ tenantOperationId: string; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean; canApprove: boolean; canExport: boolean }>) =>
    request<void>(`/api/tenant/roles/${roleId}/permissions`, { method: "PUT", body: JSON.stringify(permissions) }),
  deleteTenantRole: (roleId: string) => request<void>(`/api/tenant/roles/${roleId}`, { method: "DELETE" }),
  organizationProfile: () => request<OrganizationRecord>("/api/organization/profile"),
  saveOrganizationProfile: (profile: OrganizationRecord) => request<OrganizationRecord>("/api/organization/profile", { method: "PUT", body: JSON.stringify(profile) }),
  organizationTenants: () => request<Array<{ id: string; organizationId: string; identifier: string; name: string; isActive: boolean }>>("/api/organization/tenants"),
  organizationAdministrators: () => request<Array<{ id: string; userId: string; userName: string; email: string; status: string; isOrganizationAdministrator: boolean }>>("/api/organization/administrators"),
  organizationSubscriptions: () => request<Array<{ id: string; planId: string; name: string; status: string; currency: string; startDate: string; endDate?: string; autoRenew: boolean }>>("/api/organization/subscription"),
};
