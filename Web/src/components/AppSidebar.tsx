import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleConfig, SubModule, SubModuleCategory, modules } from "@/config/modules";
import { ChevronRight, Building2, LayoutGrid, ArrowLeft, Folder, ListChecks } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import TenantSwitcher from "@/components/TenantSwitcher";
import { useTenant } from "@/contexts/TenantContext";
import { moduleService, ModuleDto } from "@/services/api/moduleService";
import { operationService, OperationDto } from "@/services/api/operationService";
import { routeSlug, subsystemPagePath, subsystemPath, tenantSubsystemsPath } from "@/config/routes";
import { SECURITY_ADMIN_MODULE_ABBREVIATION, SECURITY_ADMIN_MODULE_CODE } from "@/config/platformModules";

const isTechnicalApiOperation = (operation: Pick<OperationDto, "name" | "link">) =>
  operation.link.toLowerCase().startsWith("/api/") || operation.name.toLowerCase().endsWith(" api");
const normalizeModuleName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
const normalizeSecurityCategory = (value: string) =>
  value.toLowerCase().replace(/\s+menu$/, "").replace(/[^a-z0-9]+/g, "");
const isAccessControlCategory = (value: string) =>
  ["accesscontrol", "menusaccesscontrol"].includes(normalizeSecurityCategory(value));
const isSecurityDatabaseModule = (module: Pick<ModuleDto, "code" | "abbreviation">) =>
  module.code.toLowerCase() === SECURITY_ADMIN_MODULE_CODE
  || module.abbreviation?.toLowerCase() === SECURITY_ADMIN_MODULE_ABBREVIATION.toLowerCase();
const isSecurityModule = (module: Pick<ModuleConfig, "id" | "title">) =>
  module.id.toLowerCase() === SECURITY_ADMIN_MODULE_CODE
  || module.id.toLowerCase() === "security"
  || normalizeModuleName(module.title) === normalizeModuleName("Security & Admin");
import LucideIconPreview from "@/components/LucideIconPreview";

const AppSidebar = ({ collapsed, onToggle, mobileOpen = false, onMobileClose }: { collapsed: boolean; onToggle: () => void; mobileOpen?: boolean; onMobileClose?: () => void }) => {
  const { selectedModule, selectModule } = useAuth();
  const { currentTenant, tenants } = useTenant();
  const showTenantInRoute = tenants.filter(tenant => tenant.isActive).length > 1;
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [databaseModules, setDatabaseModules] = useState<ModuleDto[]>([]);
  const [databaseOperations, setDatabaseOperations] = useState<OperationDto[]>([]);
  const [moduleCatalogTenantId, setModuleCatalogTenantId] = useState<string | null>(null);

  useEffect(() => { onMobileClose?.(); }, [location.pathname]);

  const currentModule = useMemo<(ModuleConfig & { abbreviation?: string; iconName?: string }) | undefined>(() => {
    if (moduleCatalogTenantId !== (currentTenant?.id ?? "__no_tenant__")) return undefined;
    const configuredModule = modules.find(module => module.id === selectedModule);
    if (configuredModule) {
      const databaseModule = databaseModules.find(module =>
        module.code === selectedModule || (configuredModule.id === "security" && isSecurityDatabaseModule(module)),
      );
      return databaseModule
        ? { ...configuredModule, title: databaseModule.name, description: databaseModule.description, abbreviation: databaseModule.abbreviation, iconName: databaseModule.icon || undefined }
        : { ...configuredModule, abbreviation: configuredModule.id === "security" ? SECURITY_ADMIN_MODULE_ABBREVIATION : configuredModule.id.toUpperCase() };
    }

    const databaseModule = databaseModules.find(module => module.code === selectedModule);
    if (!databaseModule) {
      if (!selectedModule) return undefined;
      const fallbackTitle = selectedModule
        .split("-")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      return {
        id: selectedModule,
        title: fallbackTitle,
        description: "",
        abbreviation: selectedModule.toUpperCase(),
        icon: LayoutGrid,
        color: "text-primary",
        subModules: [],
        categories: [],
      };
    }

    const configuredByName = isSecurityDatabaseModule(databaseModule)
      ? modules.find(module => module.id === "security")
      : modules.find(module => normalizeModuleName(module.title) === normalizeModuleName(databaseModule.name));
    if (configuredByName) {
      return {
        ...configuredByName,
        id: databaseModule.code,
        title: databaseModule.name,
        description: databaseModule.description,
        abbreviation: databaseModule.abbreviation,
        iconName: databaseModule.icon || undefined,
      };
    }

    return {
      id: databaseModule.code,
      title: databaseModule.name,
      description: databaseModule.description,
      abbreviation: databaseModule.abbreviation,
      iconName: databaseModule.icon || undefined,
      icon: LayoutGrid,
      color: "text-primary",
      subModules: [],
      categories: [],
    };
  }, [currentTenant?.id, databaseModules, moduleCatalogTenantId, selectedModule]);

  useEffect(() => {
    let alive = true;
    setModuleCatalogTenantId(null);
    setDatabaseModules([]);
    setDatabaseOperations([]);

    const loadModules = async () => {
      try {
        const [moduleResponse, operationResponse] = await Promise.all([
          moduleService.list(),
          operationService.list(),
        ]);

        if (!alive) return;
        setDatabaseModules(moduleResponse.data);
        setDatabaseOperations(operationResponse.data);
      } catch (error) {
        console.warn("Unable to load modules for sidebar", error);
      } finally {
        if (alive) setModuleCatalogTenantId(currentTenant?.id ?? "__no_tenant__");
      }
    };

    void loadModules();

    return () => {
      alive = false;
    };
  }, [currentTenant?.id]);

  useEffect(() => {
    const routeParts = location.pathname.split("/").filter(Boolean);
    const routeModuleSlug = routeParts[showTenantInRoute ? 1 : 0];
    if (!routeModuleSlug) return;

    const routeModule =
      databaseModules.find(module =>
        routeSlug(module.name) === routeModuleSlug || routeSlug(module.code) === routeModuleSlug,
      )
      ?? modules.find(module =>
        routeSlug(module.title) === routeModuleSlug || routeSlug(module.id) === routeModuleSlug,
      );

    if (!routeModule) return;
    const routeModuleId = "code" in routeModule ? routeModule.code : routeModule.id;
    if (routeModuleId !== selectedModule) selectModule(routeModuleId);
  }, [databaseModules, location.pathname, selectModule, selectedModule, showTenantInRoute]);

  const specialMenus = useMemo(() => {
    if (!selectedModule) return { top: [] as OperationDto[], bottom: [] as OperationDto[] };
    const databaseModule = databaseModules.find(module => module.code === selectedModule);
    if (!databaseModule) return { top: [] as OperationDto[], bottom: [] as OperationDto[] };
    if (isSecurityDatabaseModule(databaseModule)) {
      return { top: [] as OperationDto[], bottom: [] as OperationDto[] };
    }

    const menus = databaseOperations
      .filter(operation => (
        operation.moduleId === databaseModule.id
        && operation.isActive
        && !operation.parentOperationId
        && Boolean(operation.link)
        && operation.displayOrder !== 0
        && !isTechnicalApiOperation(operation)
      ));

    return {
      top: menus.filter(menu => menu.displayOrder < 0).sort((a, b) => b.displayOrder - a.displayOrder),
      bottom: menus.filter(menu => menu.displayOrder > 0).sort((a, b) => a.displayOrder - b.displayOrder),
    };
  }, [databaseModules, databaseOperations, selectedModule]);

  const securityOperationCategories = useMemo<SubModuleCategory[]>(() => {
    const configuredCategories = modules.find(module => module.id === "security")?.categories ?? [];
    const databaseModule = databaseModules.find(module => module.code === selectedModule);
    const selectedIsSecurityModule = selectedModule === "security"
      || Boolean(databaseModule && isSecurityDatabaseModule(databaseModule));
    if (!selectedIsSecurityModule) return [];
    if (!databaseModule) {
      return configuredCategories.map(category => ({
        ...category,
        category: isAccessControlCategory(category.category) ? "Access Control" : "System",
      }));
    }

    const allModuleOperations = databaseOperations
      .filter(operation => operation.moduleId === databaseModule.id && !isTechnicalApiOperation(operation));
    const moduleOperations = allModuleOperations
      .filter(operation => operation.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
    const childrenByParent = moduleOperations.reduce<Record<string, OperationDto[]>>((groups, operation) => {
      if (operation.parentOperationId) {
        groups[operation.parentOperationId] = [...(groups[operation.parentOperationId] ?? []), operation];
      }
      return groups;
    }, {});
    const rootItems: SubModule[] = [];
    const categories: SubModuleCategory[] = [];

    moduleOperations.filter(operation => !operation.parentOperationId).forEach(operation => {
      const children = childrenByParent[operation.id] ?? [];
      if (children.length > 0) {
        categories.push({
          category: operation.name,
          items: children.filter(child => Boolean(child.link)).map(child => ({
            title: child.name,
            path: child.link,
            icon: ListChecks,
          })),
        });
      } else if (operation.link) {
        rootItems.push({ title: operation.name, path: operation.link, icon: ListChecks });
      }
    });

    if (rootItems.length > 0) categories.unshift({ category: "Operations", items: rootItems });
    const populatedCategories = categories.filter(category => category.items.length > 0);
    const inactiveOperations = allModuleOperations.filter(operation => !operation.isActive);
    const inactivePaths = new Set(inactiveOperations.filter(operation => operation.link).map(operation => operation.link.toLowerCase()));
    const inactiveNames = new Set(inactiveOperations.map(operation => operation.name.toLowerCase()));
    const inactiveParentCategories = new Set(
      inactiveOperations.filter(operation => !operation.parentOperationId).map(operation => normalizeSecurityCategory(operation.name)),
    );
    const activeParentCategories = new Set(
      moduleOperations.filter(operation => !operation.parentOperationId).map(operation => normalizeSecurityCategory(operation.name)),
    );
    const databaseCategories = new Map(
      populatedCategories.map(category => [normalizeSecurityCategory(category.category), category]),
    );
    const mergedConfiguredCategories = configuredCategories.flatMap(configuredCategory => {
      const normalizedCategory = normalizeSecurityCategory(configuredCategory.category);
      if (inactiveParentCategories.has(normalizedCategory)) return [];
      const databaseCategory = databaseCategories.get(normalizedCategory);
      const enabledConfiguredItems = configuredCategory.items.filter(item =>
        !inactivePaths.has(item.path.toLowerCase()) && !inactiveNames.has(item.title.toLowerCase()),
      );
      if (!databaseCategory) {
        return activeParentCategories.has(normalizedCategory) && enabledConfiguredItems.length === 0
          ? []
          : [{ ...configuredCategory, items: enabledConfiguredItems }];
      }

      databaseCategories.delete(normalizedCategory);
      const configuredPaths = new Set(enabledConfiguredItems.map(item => item.path.toLowerCase()));
      const configuredTitles = new Set(enabledConfiguredItems.map(item => normalizeModuleName(item.title)));
      return [{
        category: databaseCategory.category,
        items: [
          ...enabledConfiguredItems,
          ...databaseCategory.items.filter(item =>
            !configuredPaths.has(item.path.toLowerCase())
            && !configuredTitles.has(normalizeModuleName(item.title)),
          ),
        ],
      }];
    });

    return [...mergedConfiguredCategories, ...databaseCategories.values()]
      .filter(category => isAccessControlCategory(category.category) || normalizeSecurityCategory(category.category) === "system")
      .map(category => ({
        ...category,
        category: isAccessControlCategory(category.category) ? "Access Control" : "System",
      }))
      .filter(category => category.items.length > 0);
  }, [databaseModules, databaseOperations, selectedModule]);

  const displayModules = useMemo<ModuleConfig[]>(() => {
    if (!currentModule) return [];

    const setupItem: SubModule = {
      title: "Operations",
      path: currentTenant ? subsystemPath(currentTenant.name, currentModule.title, showTenantInRoute) : "/subsystems",
      icon: ListChecks,
    };
    const modulesItem: SubModule = {
      title: "Modules",
      path: currentTenant ? subsystemPagePath(currentTenant.name, currentModule.title, "modules", showTenantInRoute) : "/subsystems",
      icon: Folder,
    };
    const setupCategory: SubModuleCategory = {
      category: "Setup",
      items: [modulesItem, setupItem],
    };

    const securityModule = isSecurityModule(currentModule);
    const categories = securityModule
      ? securityOperationCategories.map(category => ({
          ...category,
          items: category.items.map(item => {
            if (!currentTenant) return item;
            const page = item.path.split("/").filter(Boolean).at(-1) ?? item.path;
            return {
              ...item,
              path: subsystemPagePath(currentTenant.name, currentModule.title, page, showTenantInRoute),
            };
          }),
        }))
      : [...securityOperationCategories, setupCategory];

    return [{
      ...currentModule,
      subModules: categories.flatMap(category => category.items),
      categories,
    }];
  }, [currentModule, currentTenant, securityOperationCategories, showTenantInRoute]);

  // Auto-expand active category on route change
  useEffect(() => {
    const keys: string[] = [];
    displayModules.forEach(mod => {
      mod.categories.forEach(cat => {
        if (
          cat.items.some(item => location.pathname === item.path)
          || (isSecurityModule(mod) && cat.category === "Access Control")
        ) {
          keys.push(`${mod.id}-${cat.category}`);
        }
      });
    });
    setExpandedCategories(prev => {
      const merged = new Set([...prev, ...keys]);
      return Array.from(merged);
    });
  }, [displayModules, location.pathname, selectedModule]);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const isCatExpanded = (key: string) => expandedCategories.includes(key);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-screen w-[min(300px,85vw)] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out md:sticky md:top-0 md:z-auto md:translate-x-0 md:transition-all select-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-[60px]" : "md:w-[300px]"
      )}
    >
      {/* Logo & Toggle */}
      <div className={cn("h-12 flex items-center border-b border-sidebar-border shrink-0", collapsed ? "px-1" : "px-3")}>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus-ring rounded-lg px-1 py-1"
        >
          <div className={cn("rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm", collapsed ? "h-6 w-6" : "h-8 w-8")}>
            <Building2 className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-[15px] whitespace-nowrap text-foreground">
              Cyber<span className="text-primary">ERP</span>
            </span>
          )}
        </button>
        <button type="button" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={cn("ml-auto hidden items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex", collapsed ? "h-6 w-6" : "h-7 w-7")}>
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </button>
      </div>

      {/* Tenant Switcher */}
      {!collapsed && (
        <div className="hidden px-2 pt-2 pb-1 border-b border-sidebar-border md:block">
          <TenantSwitcher moduleCode={databaseModules.find(module =>
            module.code === selectedModule || (selectedModule === "security" && isSecurityDatabaseModule(module)),
          )?.code} />
        </div>
      )}

      {/* Back to modules */}
      {selectedModule && !collapsed && (
        <div className="pr-3 pt-3 pb-1">
          <button
            onClick={() => navigate(currentTenant && showTenantInRoute ? tenantSubsystemsPath(currentTenant.name) : "/subsystems")}
            className="flex w-full items-center gap-2 rounded-r-lg px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-sidebar-accent focus-ring"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>All Sub Systems</span>
          </button>
        </div>
      )}

      {selectedModule && collapsed && (
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={() => navigate(currentTenant && showTenantInRoute ? tenantSubsystemsPath(currentTenant.name) : "/subsystems")}
            className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors focus-ring"
            title="All Sub Systems"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module title when in a module */}
      {currentModule && !collapsed && (
        <div key={currentModule.id} className="mt-3 animate-in border-l-4 border-primary bg-sidebar-accent/60 px-5 py-3 fade-in slide-in-from-bottom-1 duration-300 motion-reduce:animate-none">
          <div className="flex items-center gap-2.5">
            {currentModule.iconName
              ? <LucideIconPreview name={currentModule.iconName} className="h-4 w-4 shrink-0 text-primary" />
              : <currentModule.icon className="h-4 w-4 shrink-0 text-primary" />}
            <div className="min-w-0 font-display text-sm font-bold uppercase leading-tight tracking-wide text-foreground">
              {currentModule.abbreviation || currentModule.id}
            </div>
          </div>
          <div className="mt-1 text-xs font-normal leading-tight text-muted-foreground">
            {currentModule.title}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-2 space-y-0.5">
        {displayModules.map((mod) => {
          const showHeaderless = selectedModule === mod.id;

          return (
            <div key={mod.id}>
              {/* Module-level button (only in "all modules" view) */}
              {!showHeaderless && !collapsed && (
                <button
                  onClick={() => {
                    const firstPath = mod.subModules[0]?.path;
                    if (firstPath) navigate(firstPath);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors group",
                    "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <mod.icon className="w-4 h-4 shrink-0 text-primary" />
                  <span className="flex-1 text-left font-medium">{mod.title}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {!showHeaderless && collapsed && (
                <button
                  onClick={() => {
                    const firstPath = mod.subModules[0]?.path;
                    if (firstPath) navigate(firstPath);
                  }}
                  className="flex items-center justify-center w-full p-2 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                  title={mod.title}
                >
                  <mod.icon className="w-4 h-4 text-primary" />
                </button>
              )}

              {/* Category groups (only when module is selected and expanded) */}
              {!collapsed && showHeaderless && (
                <div className="space-y-0.5">
                  {specialMenus.top.map(menu => (
                    <NavLink
                      key={menu.id}
                      to={menu.link}
                      end
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-foreground"
                      activeClassName="bg-muted/70 text-foreground hover:bg-muted"
                    >
                      <LucideIconPreview name={menu.icon} className="h-4 w-4 shrink-0" />
                      <span className="truncate">{menu.name}</span>
                    </NavLink>
                  ))}
                  {mod.categories.map((cat) => {
                    const catKey = `${mod.id}-${cat.category}`;
                    const catExpanded = isCatExpanded(catKey);

                    return (
                      <div key={catKey}>
                        <button
                          onClick={() => toggleCategory(catKey)}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all duration-200"
                        >
                          <div className="w-4 flex items-center justify-center">
                            <ChevronRight className={cn(
                              "w-3 h-3 shrink-0 transition-transform duration-200",
                              catExpanded && "rotate-90"
                            )} />
                          </div>
                          <span className="uppercase tracking-wider text-[10px] font-semibold">{cat.category}</span>
                        </button>

                        <div className={cn(
                          "overflow-hidden transition-all duration-200",
                          catExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                        )}>
                          <div className="ml-4 pl-3 border-l border-sidebar-border/60 space-y-0.5 py-0.5">
                            {cat.items.map((sub) => (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                end
                                className="flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] text-sidebar-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-foreground"
                                activeClassName="bg-muted/70 text-foreground hover:bg-muted"
                              >
                                <sub.icon className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{sub.title}</span>
                              </NavLink>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {specialMenus.bottom.map(menu => (
                    <NavLink
                      key={menu.id}
                      to={menu.link}
                      end
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-sidebar-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-foreground"
                      activeClassName="bg-muted/70 text-foreground hover:bg-muted"
                    >
                      <LucideIconPreview name={menu.icon} className="h-4 w-4 shrink-0" />
                      <span className="truncate">{menu.name}</span>
                    </NavLink>
                  ))}
                </div>
              )}

              {/* Collapsed mode: show icons for sub-modules */}
              {collapsed && showHeaderless && (
                <div className="space-y-0.5">
                  {specialMenus.top.map(menu => (
                    <NavLink key={menu.id} to={menu.link} end className="flex items-center justify-center p-2 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent" activeClassName="text-primary bg-primary/10" title={menu.name}>
                      <LucideIconPreview name={menu.icon} className="h-4 w-4" />
                    </NavLink>
                  ))}
                  {mod.subModules.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      end
                      className="flex items-center justify-center p-2 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="text-primary bg-primary/10"
                      title={sub.title}
                    >
                      <sub.icon className="w-4 h-4" />
                      </NavLink>
                  ))}
                  {specialMenus.bottom.map(menu => (
                    <NavLink key={menu.id} to={menu.link} end className="flex items-center justify-center p-2 rounded-lg text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent" activeClassName="text-primary bg-primary/10" title={menu.name}>
                      <LucideIconPreview name={menu.icon} className="h-4 w-4" />
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border shrink-0">
          <p className="text-[10px] text-muted-foreground/60 text-center">CyberERP v1.0</p>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
