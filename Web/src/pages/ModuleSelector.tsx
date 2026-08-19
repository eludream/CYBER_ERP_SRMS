import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { modules, visibleModules, ModuleConfig } from "@/config/modules";
import { routeSlug, subsystemPath } from "@/config/routes";
import { platformAdminPaths } from "@/config/routes";
import { isSecurityAdminModule, isSystemResourceModule } from "@/config/platformModules";
import { Building2, CheckCircle2, ChevronRight, LayoutGrid, Menu, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import LucideIconPreview from "@/components/LucideIconPreview";
import TenantSwitcher from "@/components/TenantSwitcher";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";
import { moduleService, ModuleDto } from "@/services/api/moduleService";
import { multiTenantService } from "@/services/api/multiTenantService";

type ManagedModule = ModuleConfig & { databaseId: string; abbreviation: string; landingPath: string; displayOrder: number; isActive: boolean; moduleCount: number; operationCount: number; iconName?: string };
type ModuleForm = { databaseId: string; id: string; title: string; description: string; landingPath: string; isActive: boolean };
const emptyForm: ModuleForm = { databaseId: "", id: "", title: "", description: "", landingPath: "", isActive: true };
const featureBadgeClassName = "h-6 shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground";

const SubSystemFeatureBadges = ({ badges }: { badges: string[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measurementRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const moreMeasurementRef = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState(badges.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const calculateVisibleCount = () => {
      const availableWidth = container.clientWidth;
      const widths = measurementRefs.current.slice(0, badges.length).map(element => element?.offsetWidth ?? 0);
      const moreWidth = moreMeasurementRef.current?.offsetWidth ?? 0;
      const fitsInTwoRows = (count: number) => {
        const itemWidths = [...widths.slice(0, count), ...(count < badges.length ? [moreWidth] : [])];
        let rows = 1;
        let rowWidth = 0;
        for (const width of itemWidths) {
          const nextWidth = rowWidth === 0 ? width : rowWidth + 6 + width;
          if (nextWidth <= availableWidth) rowWidth = nextWidth;
          else { rows += 1; rowWidth = width; }
          if (rows > 2) return false;
        }
        return true;
      };
      let count = badges.length;
      while (count > 0 && !fitsInTwoRows(count)) count -= 1;
      setVisibleCount(count);
    };
    calculateVisibleCount();
    const observer = new ResizeObserver(calculateVisibleCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, [badges]);

  return <div ref={containerRef} className="relative mt-12 w-full">
    <div aria-hidden className="pointer-events-none absolute invisible flex gap-1.5">
      {badges.map((badge, index) => <span key={`${badge}-${index}`} ref={element => { measurementRefs.current[index] = element; }} className={featureBadgeClassName}>{badge}</span>)}
      <span ref={moreMeasurementRef} className={`${featureBadgeClassName} font-semibold`}>More</span>
    </div>
    <div className="flex max-h-[54px] flex-wrap content-start gap-1.5 overflow-hidden">
      {badges.slice(0, visibleCount).map((badge, index) => <span key={`${badge}-${index}`} className={featureBadgeClassName}>{badge}</span>)}
      {visibleCount < badges.length && <Tooltip><TooltipTrigger asChild><span aria-label={`${badges.length - visibleCount} more features`} className="h-6 shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">More</span></TooltipTrigger><TooltipContent side="top" className="z-[100] max-w-sm text-xs leading-relaxed">{badges.slice(visibleCount).join(", ")}</TooltipContent></Tooltip>}
    </div>
  </div>;
};

const ModuleSelector = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectModule, user } = useAuth();
  const navigate = useNavigate();
  const { currentTenant, tenants, switchTenant } = useTenant();
  const showTenantInRoute = tenants.filter(tenant => tenant.isActive).length > 1;
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const [databaseModules, setDatabaseModules] = useState<ModuleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<ManagedModule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [form, setForm] = useState<ModuleForm>(emptyForm);

  const loadModules = async () => {
    setLoading(true);
    try {
      const [entitlements, moduleResponse] = await Promise.all([
        multiTenantService.entitlements(),
        moduleService.list(),
      ]);
      const effectiveEntitlements = entitlements.filter(item => item.isEffective);
      const effectiveModuleIds = new Set(effectiveEntitlements.map(item => item.moduleId?.toLowerCase()).filter(Boolean));
      const effectiveModuleCodes = new Set(effectiveEntitlements.map(item => item.moduleCode?.trim().toLowerCase()).filter(Boolean));
      setDatabaseModules(moduleResponse.data.filter(module =>
        effectiveModuleIds.has(module.id.toLowerCase())
        || effectiveModuleCodes.has(module.code.trim().toLowerCase()),
      ));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load modules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentTenant) {
      setDatabaseModules([]);
      setLoading(true);
      return;
    }
    void loadModules();
  }, [currentTenant?.id]);
  useEffect(() => {
    if (!tenantSlug || !currentTenant || routeSlug(currentTenant.name) === tenantSlug) return;
    const routeTenant = tenants.find(tenant => routeSlug(tenant.name) === tenantSlug);
    if (routeTenant) void switchTenant(routeTenant.id);
  }, [currentTenant, switchTenant, tenantSlug, tenants]);

  const moduleCatalog = useMemo<ManagedModule[]>(() => {
    const tenantModules = databaseModules.filter(module => !isSystemResourceModule(module));
    const configuredModules = visibleModules.flatMap(configured => {
      const record = tenantModules.find(module =>
        module.code === configured.id
        || (configured.id === "security" && isSecurityAdminModule(module)),
      );
      if (!record) return [];
      const usesSamsFallback = isSecurityAdminModule(record);
      return {
        ...configured,
        databaseId: record.id,
        abbreviation: record.abbreviation,
        title: record.name,
        description: record.description,
        landingPath: record.landingPath,
        displayOrder: record.displayOrder,
        isActive: record.isActive,
        // Older tenants may not have copied SAMS navigation records. Its
        // platform definition is always two modules with three active menus.
        moduleCount: usesSamsFallback && record.moduleCount === 0 ? 2 : record.moduleCount,
        operationCount: usesSamsFallback && record.operationCount === 0 ? configured.subModules.length : record.operationCount,
        iconName: record.icon || undefined,
      };
    });

    const customModules = tenantModules
      .filter(record => !isSecurityAdminModule(record) && !modules.some(module => module.id === record.code))
      .map(record => {
        const subModules = [{ title: "Open module", path: record.landingPath, icon: LayoutGrid }];
        return {
          id: record.code as ModuleConfig["id"],
          databaseId: record.id,
          abbreviation: record.abbreviation,
          title: record.name,
          description: record.description,
          landingPath: record.landingPath,
          displayOrder: record.displayOrder,
          isActive: record.isActive,
          moduleCount: record.moduleCount,
          operationCount: record.operationCount,
          icon: LayoutGrid,
          iconName: record.icon || undefined,
          color: "text-primary",
          subModules,
          categories: [{ category: "Overview", items: subModules }],
        };
      });

    return [...configuredModules, ...customModules]
      .sort((left, right) => left.displayOrder - right.displayOrder || left.title.localeCompare(right.title));
  }, [databaseModules]);

  const handleModuleSelect = (module: ManagedModule) => {
    if (!module.isActive) return;
    selectModule(module.id);
    if (!currentTenant) return;
    navigate(subsystemPath(currentTenant.name, module.title, showTenantInRoute));
  };

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return moduleCatalog.filter(module => {
      const matchesSearch = !query || module.abbreviation.toLowerCase().includes(query) || module.title.toLowerCase().includes(query) || module.description.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? module.isActive : !module.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [moduleCatalog, searchQuery, statusFilter]);

  const activeModuleCount = moduleCatalog.filter(module => module.isActive).length;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (module: ManagedModule) => {
    setEditingId(module.id);
    setForm({
      databaseId: module.databaseId,
      id: module.id,
      title: module.title,
      description: module.description,
      landingPath: module.landingPath || module.subModules[0]?.path || "",
      isActive: module.isActive,
    });
    setDialogOpen(true);
  };

  const saveModule = async () => {
    const normalized: ModuleForm = {
      databaseId: form.databaseId,
      id: form.id.trim().toLowerCase().replace(/\s+/g, "-"),
      title: form.title.trim(),
      description: form.description.trim(),
      landingPath: form.landingPath.trim(),
      isActive: form.isActive,
    };
    if (!normalized.id || !normalized.title || !normalized.description || !normalized.landingPath) {
      toast.error("Complete all module fields");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(normalized.id)) {
      toast.error("Module ID may only contain lowercase letters, numbers, and hyphens");
      return;
    }
    if (!normalized.landingPath.startsWith("/")) {
      toast.error("Landing route must start with /");
      return;
    }
    const duplicate = moduleCatalog.some(module => module.id === normalized.id && module.id !== editingId);
    if (duplicate) {
      toast.error("A module with this ID already exists");
      return;
    }
    try {
      if (editingId) {
        const current = databaseModules.find(module => module.id === normalized.databaseId);
        if (current) {
          await moduleService.update({
            id: normalized.databaseId,
            subSystem: current.subSystem,
            name: normalized.title,
            description: normalized.description,
            landingPath: normalized.landingPath,
            icon: current.icon ?? "layout-grid",
            displayOrder: current.displayOrder,
            isActive: normalized.isActive,
          });
        } else {
          await moduleService.create({
            code: normalized.id,
            subSystem: "ERP",
            name: normalized.title,
            description: normalized.description,
            landingPath: normalized.landingPath,
            icon: "layout-grid",
            displayOrder: databaseModules.length,
            isActive: normalized.isActive,
          });
        }
      } else {
        await moduleService.create({
          code: normalized.id,
          subSystem: "ERP",
          name: normalized.title,
          description: normalized.description,
          landingPath: normalized.landingPath,
          icon: "layout-grid",
          displayOrder: databaseModules.length,
          isActive: normalized.isActive,
        });
      }
      setDialogOpen(false);
      await loadModules();
      toast.success(editingId ? "Module updated" : "Module added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save module");
    }
  };

  const deleteModule = async () => {
    if (!moduleToDelete?.databaseId || isDeleting) return;
    setIsDeleting(true);
    try {
      await moduleService.delete(moduleToDelete.databaseId);
      toast.success(`${moduleToDelete.title} deleted`);
      setModuleToDelete(null);
      await loadModules();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete module");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {mobileMenuOpen && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-30 bg-black/45 md:hidden" onClick={() => setMobileMenuOpen(false)}/>} 
      <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[min(300px,85vw)] shrink-0 select-none flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out md:sticky md:top-0 md:z-auto md:translate-x-0 md:transition-all ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "md:w-[60px]" : "md:w-[300px]"}`}>
        <div className={`flex h-12 shrink-0 items-center border-b border-sidebar-border ${sidebarCollapsed ? "px-1" : "px-3"}`}>
          <Link to="/" className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:opacity-80">
            <span className={`flex shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm ${sidebarCollapsed ? "h-6 w-6" : "h-8 w-8"}`}><Building2 className="h-4 w-4 text-primary-foreground"/></span>
            {!sidebarCollapsed && <span className="whitespace-nowrap font-display text-[15px] font-bold">Cyber<span className="text-primary">ERP</span></span>}
          </Link>
          <button type="button" onClick={() => setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="ml-auto hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex"><ChevronRight className={`h-3.5 w-3.5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}/></button>
        </div>
        {!sidebarCollapsed && <div className="border-b border-sidebar-border px-2 pb-2 pt-2">
          <TenantSwitcher />
        </div>}
        <div className={`mt-3 border-primary bg-sidebar-accent/60 py-3 ${sidebarCollapsed ? "mx-2 flex justify-center rounded-lg px-2" : "border-l-4 px-5"}`}>
          <div className="flex items-center gap-2.5"><LayoutGrid className="h-4 w-4 shrink-0 text-primary"/>{!sidebarCollapsed && <span className="font-display text-sm font-bold uppercase leading-tight tracking-wide text-foreground">Sub Systems</span>}</div>
          {!sidebarCollapsed && <div className="mt-1 truncate text-xs font-normal leading-tight text-muted-foreground">{currentTenant?.name ?? "Tenant workspace"}</div>}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div aria-current="page" className={`flex items-center rounded-lg bg-muted/70 px-3 py-2.5 text-[13px] font-medium text-foreground ${sidebarCollapsed ? "justify-center" : "gap-2.5"}`}>
            <LayoutGrid className="h-4 w-4 shrink-0 text-primary"/>{!sidebarCollapsed && <span>All Sub Systems</span>}
          </div>
        </nav>
        {user?.isPlatformAdministrator && <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
          <button type="button" title={sidebarCollapsed ? "Platform Administration" : undefined} onClick={() => navigate(platformAdminPaths.organization)} className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground ${sidebarCollapsed ? "justify-center" : "gap-2.5"}`}>
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary"/>{!sidebarCollapsed && <span>Platform Administration</span>}
          </button>
        </div>}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
      <div className="fixed left-3 top-2 z-50 md:hidden"><Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-sm" aria-label="Open navigation menu" onClick={() => { setSidebarCollapsed(false); setMobileMenuOpen(true); }}><Menu className="h-4 w-4"/></Button></div>
      <AppHeader />
      <main className="relative w-full flex-1 px-6 pb-8 pt-5 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/[0.04] to-transparent" />
        <div className="relative mb-5 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/10 bg-primary/10 text-primary shadow-sm">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div>
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">SRMS Workspace</p>
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">Sub Systems</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mb-5 flex flex-col gap-3 rounded-xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search sub systems…"
              aria-label="Search sub systems"
              className="h-9 bg-background pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{activeModuleCount} active</span>
              <span className="text-border">•</span>
              <span>{moduleCatalog.length} total</span>
            </div>
            {(["all", "active", "inactive"] as const).map(filter => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={statusFilter === filter ? "secondary" : "ghost"}
                onClick={() => setStatusFilter(filter)}
                className="h-8 px-3 text-xs capitalize"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {!loading && moduleCatalog.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No sub systems are configured for this tenant.</p>}
        {!loading && moduleCatalog.length > 0 && filteredModules.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <h2 className="mt-3 font-display text-sm font-semibold">No matching sub systems</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or status filter.</p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>Clear filters</Button>
          </div>
        )}
        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((mod) => (
              <div
                key={mod.id}
                role="button"
                tabIndex={0}
                onClick={() => handleModuleSelect(mod)}
                onKeyDown={event => { if (event.key === "Enter" || event.key === " ") handleModuleSelect(mod); }}
                aria-disabled={!mod.isActive}
                className={`group relative flex h-fit flex-col overflow-hidden rounded-xl border border-border/80 bg-card p-5 text-left font-body shadow-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${mod.isActive ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/[0.06]" : "cursor-default opacity-60"}`}
              >
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/0 transition-colors duration-200 group-hover:bg-primary/70" />
                <div className="flex h-11 w-11 shrink-0 self-center items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.07] text-primary transition-colors group-hover:bg-primary/10">
                  {mod.iconName ? <LucideIconPreview name={mod.iconName} className="h-5 w-5"/> : <mod.icon className="h-5 w-5" />}
                </div>
                <h3 className="mt-3 line-clamp-2 min-h-6 text-center font-body text-base font-medium tracking-tight text-foreground">{mod.title}</h3>
                <span className="mt-2 self-center rounded-lg border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-xs font-semibold uppercase text-primary">{mod.abbreviation || "N/A"}</span>
                <p className="mt-3 line-clamp-2 min-h-[36px] text-xs leading-[18px] text-muted-foreground">{mod.description}</p>
                <div className="mt-4 grid grid-cols-2 rounded-lg bg-[#f3f6fe] py-1.5 text-center dark:bg-muted/60">
                  <div className="border-r border-border">
                    <div className="text-lg font-semibold leading-5 tabular-nums text-foreground">{mod.moduleCount}</div>
                    <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Modules</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold leading-5 tabular-nums text-foreground">{mod.operationCount}</div>
                    <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Operations</div>
                  </div>
                </div>
              </div>
          ))}
        </div>
      </main>

      <AppFooter />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl gap-3">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Module" : "Add Module"}</DialogTitle>
            <DialogDescription>
              Configure how the module appears in the catalog and where it opens.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="module-title">Module name</Label>
              <Input id="module-title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="e.g. Customer Support" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="module-id">Module ID</Label>
              <Input id="module-id" value={form.id} disabled={Boolean(editingId)} onChange={event => setForm({ ...form, id: event.target.value })} placeholder="customer-support" />
              <p className="text-xs text-muted-foreground">A stable lowercase identifier used by permissions and integrations.</p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="module-description">Description</Label>
              <Textarea id="module-description" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="What users can do in this module" rows={2} className="resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="module-route">Landing route</Label>
              <Input id="module-route" value={form.landingPath} onChange={event => setForm({ ...form, landingPath: event.target.value })} placeholder="/support/dashboard" />
              <p className="text-xs text-muted-foreground">Use an existing application route beginning with /.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="module-active">Module status</Label>
              <div className="flex h-10 items-center justify-between gap-4 rounded-md border border-input bg-background px-3">
                <span className="text-sm">Active module</span>
                <Switch
                  id="module-active"
                  checked={form.isActive}
                  onCheckedChange={isActive => setForm({ ...form, isActive })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Allow users to open this module.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveModule}>{editingId ? "Save Changes" : "Add Module"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(moduleToDelete)} onOpenChange={open => { if (!open && !isDeleting) setModuleToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete module?</AlertDialogTitle>
            <AlertDialogDescription>
              {moduleToDelete ? `This will permanently delete “${moduleToDelete.title}”. This action cannot be undone.` : "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={event => { event.preventDefault(); void deleteModule(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete Module"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ModuleSelector;
