export const routeSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** URL prefix for this app: /{abbreviation} from Core.SubSystem code 001. */
export const moduleBasePath = (abbreviation: string) => {
  const slug = routeSlug(abbreviation);
  if (!slug) throw new Error("The System Resource subsystem abbreviation is required for routing.");
  return `/${slug}`;
};

export const matchesModuleBasePath = (pathname: string, basePath: string) => {
  const path = pathname.replace(/\/$/, "").toLowerCase() || "/";
  const prefix = basePath.replace(/\/$/, "").toLowerCase();
  return path === prefix || path.startsWith(`${prefix}/`);
};

export const platformAdminPaths = {
  organization: "/platform-admin/organization",
  tenant: "/platform-admin/tenants",
  subsystems: "/platform-admin/subsystems",
  roles: "/platform-admin/roles",
  settings: "/platform-admin/settings",
  users: "/platform-admin/users",
} as const;

export const subsystemPath = (tenantName: string, subsystemName: string, showTenant = true) =>
  showTenant
    ? `/${routeSlug(tenantName)}/${routeSlug(subsystemName)}`
    : `/${routeSlug(subsystemName)}`;

export const subsystemPagePath = (tenantName: string, subsystemName: string, page: string, showTenant = true) =>
  `${subsystemPath(tenantName, subsystemName, showTenant)}/${routeSlug(page)}`;

export const tenantSubsystemsPath = (tenantName: string) =>
  `/${routeSlug(tenantName)}`;
