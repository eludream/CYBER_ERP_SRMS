export const SYSTEM_RESOURCE_MODULE_CODE = "001";
export const LEGACY_SYSTEM_RESOURCE_MODULE_CODE = "001_srms";
export const SECURITY_ADMIN_MODULE_CODE = "002";
export const SECURITY_ADMIN_MODULE_ABBREVIATION = "SAMS";
export const SYSTEM_SETTINGS_MODULE_CODE = "003";
export const SYSTEM_SETTINGS_MODULE_ABBREVIATION = "SSMS";

/** Identify System Resource by code 001. The row id and abbreviation may change. */
export const isSystemResourceModule = (module: { code: string }) =>
  [SYSTEM_RESOURCE_MODULE_CODE, LEGACY_SYSTEM_RESOURCE_MODULE_CODE].includes(module.code.trim().toLowerCase());

const normalizeModuleIdentity = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");

export const isSecurityAdminModule = (module: { code: string; abbreviation?: string; name?: string }) =>
  normalizeModuleIdentity(module.code) === SECURITY_ADMIN_MODULE_CODE
  || normalizeModuleIdentity(module.abbreviation ?? "") === normalizeModuleIdentity(SECURITY_ADMIN_MODULE_ABBREVIATION)
  || normalizeModuleIdentity(module.code) === "security"
  || normalizeModuleIdentity(module.name ?? "") === "securityadmin";

export const isRequiredTenantModule = (module: { code: string; abbreviation?: string; name?: string }) =>
  isSecurityAdminModule(module)
  || normalizeModuleIdentity(module.code) === SYSTEM_SETTINGS_MODULE_CODE
  || normalizeModuleIdentity(module.abbreviation ?? "") === normalizeModuleIdentity(SYSTEM_SETTINGS_MODULE_ABBREVIATION);
