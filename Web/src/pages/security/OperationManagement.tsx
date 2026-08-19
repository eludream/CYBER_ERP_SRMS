import { Fragment, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Edit, ExternalLink, ListChecks, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { moduleService, ModuleDto } from "@/services/api/moduleService";
import { operationService, OperationDto } from "@/services/api/operationService";
import { iconNames } from "@/config/iconNames";
import LucideIconPreview from "@/components/LucideIconPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import TenantSwitcher from "@/components/TenantSwitcher";
import { routeSlug } from "@/config/routes";
import { multiTenantService } from "@/services/api/multiTenantService";

type OperationForm = {
  id: string;
  moduleId: string;
  parentOperationId: string | null;
  name: string;
  link: string;
  filter: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
};

const emptyForm: OperationForm = {
  id: "",
  moduleId: "",
  parentOperationId: null,
  name: "",
  link: "",
  filter: "",
  icon: "folder",
  displayOrder: 0,
  isActive: true,
};

const isTechnicalApiOperation = (operation: Pick<OperationDto, "name" | "link">) =>
  operation.link.toLowerCase().startsWith("/api/") || operation.name.toLowerCase().endsWith(" api");

const OperationManagement = () => {
  const { tenantSlug, moduleSlug: routeModuleSlug } = useParams<{ tenantSlug?: string; moduleSlug?: string }>();
  const location = useLocation();
  const managingModules = location.pathname.endsWith("/modules");
  const { selectedModule, selectModule } = useAuth();
  const { currentTenant, tenants, switchTenant } = useTenant();
  const showTenantInRoute = tenants.filter(tenant => tenant.isActive).length > 1;
  const moduleSlug = routeModuleSlug ?? (!showTenantInRoute ? tenantSlug : undefined);
  const [operations, setOperations] = useState<OperationDto[]>([]);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(() => new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [iconDialogOpen, setIconDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OperationDto | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OperationDto | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<OperationForm>(emptyForm);
  const [busy, setBusy] = useState(false);

  const scopedModule = useMemo(() => {
    if (!moduleSlug) return null;
    const normalizedSlug = moduleSlug.toLowerCase();
    return modules.find((module) =>
      routeSlug(module.name) === normalizedSlug || module.code.toLowerCase() === normalizedSlug,
    ) ?? null;
  }, [moduleSlug, modules]);

  const loadData = async () => {
    setBusy(true);
    try {
      const [operationResponse, moduleResponse] = await Promise.all([
        operationService.list(),
        moduleService.list(),
      ]);
      setOperations(operationResponse.data);
      setModules(moduleResponse.data);
    } catch (error) {
      toast.error("Unable to load operations", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [currentTenant?.id]);

  useEffect(() => {
    if (!showTenantInRoute || !tenantSlug || !currentTenant || routeSlug(currentTenant.name) === tenantSlug) return;
    const routeTenant = tenants.find(tenant => routeSlug(tenant.name) === tenantSlug);
    if (routeTenant) void switchTenant(routeTenant.id);
  }, [currentTenant, showTenantInRoute, switchTenant, tenantSlug, tenants]);

  useLayoutEffect(() => {
    if (scopedModule && selectedModule !== scopedModule.code) {
      selectModule(scopedModule.code);
    }
  }, [scopedModule, selectModule, selectedModule]);

  const moduleOperations = useMemo(() => {
    return operations.filter((operation) => {
      if (isTechnicalApiOperation(operation)) return false;
      if (managingModules && operation.parentOperationId !== null) return false;
      if (moduleSlug && !scopedModule) return false;
      if (scopedModule && operation.moduleId !== scopedModule.id) return false;
      if (!scopedModule && moduleFilter !== "all" && operation.moduleId !== moduleFilter) return false;
      return true;
    });
  }, [managingModules, moduleSlug, moduleFilter, operations, scopedModule]);

  const filteredOperations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return moduleOperations.filter((operation) => {
      if (!query) return true;
      return (
        operation.name.toLowerCase().includes(query) ||
        operation.link.toLowerCase().includes(query) ||
        operation.filter.toLowerCase().includes(query) ||
        operation.module.toLowerCase().includes(query)
      );
    });
  }, [moduleOperations, search]);

  const parentOptions = useMemo(() => {
    const moduleId = form.moduleId || scopedModule?.id || (moduleFilter === "all" ? "" : moduleFilter);
    return operations
      .filter((operation) => operation.moduleId === moduleId && !operation.parentOperationId && !isTechnicalApiOperation(operation))
      .sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name));
  }, [form.moduleId, moduleFilter, operations, scopedModule]);

  const filteredIconNames = useMemo(() => {
    const query = form.icon.trim().toLowerCase();
    const matches = query
      ? iconNames.filter((iconName) => iconName.includes(query))
      : iconNames;

    return matches;
  }, [form.icon]);

  const operationTree = useMemo(() => {
    if (managingModules) return filteredOperations
      .sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name))
      .map(operation => ({ operation, children: [] as OperationDto[] }));
    const childrenByModule = filteredOperations.filter(operation => operation.parentOperationId).reduce<Record<string, OperationDto[]>>((groups, operation) => {
      groups[operation.parentOperationId!] = [...(groups[operation.parentOperationId!] ?? []), operation];
      return groups;
    }, {});
    return moduleOperations.filter(operation => !operation.parentOperationId)
      .map(operation => ({ operation, children: (childrenByModule[operation.id] ?? []).sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)) }))
      .filter(item => item.children.length > 0)
      .sort((left, right) => left.operation.displayOrder - right.operation.displayOrder || left.operation.name.localeCompare(right.operation.name));
  }, [filteredOperations, managingModules, moduleOperations]);
  const pageSize = managingModules ? 10 : 5;
  const pageCount = Math.max(1, Math.ceil(operationTree.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedOperationTree = operationTree.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setPage(1), [managingModules, moduleFilter, search]);

  const nextDisplayOrder = (moduleId: string, parentOperationId: string | null, excludedId = "") =>
    Math.max(0, ...operations
      .filter(operation => operation.moduleId === moduleId && operation.parentOperationId === parentOperationId && operation.id !== excludedId)
      .map(operation => operation.displayOrder)) + 1;
  const toggleModule = (id: string) => setCollapsedModules(current => {
    const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const allModulesCollapsed = !managingModules && operationTree.length > 0 && operationTree.every(({ operation }) => collapsedModules.has(operation.id));
  const toggleAllModules = () => setCollapsedModules(allModulesCollapsed ? new Set() : new Set(operationTree.map(({ operation }) => operation.id)));

  const openAdd = () => {
    setEditing(null);
    const moduleId = scopedModule?.id ?? modules[0]?.id ?? "";
    setForm({ ...emptyForm, moduleId, parentOperationId: managingModules ? null : parentOptions[0]?.id ?? null, displayOrder: nextDisplayOrder(moduleId, managingModules ? null : parentOptions[0]?.id ?? null) });
    setDialogOpen(true);
  };

  const openEdit = (operation: OperationDto) => {
    setEditing(operation);
    setForm({
      id: operation.id,
      moduleId: operation.moduleId,
      parentOperationId: operation.parentOperationId,
      name: operation.name,
      link: operation.link,
      filter: operation.filter,
      icon: operation.icon,
      displayOrder: operation.displayOrder,
      isActive: operation.isActive,
    });
    setDialogOpen(true);
  };

  const saveOperation = async () => {
    const normalized = {
      ...form,
      name: form.name.trim(),
      link: form.link.trim(),
      filter: form.filter.trim(),
      icon: form.icon.trim(),
      displayOrder: Number(form.displayOrder) || 0,
    };

    if (!normalized.moduleId || !normalized.name) {
      toast.error("Module and operation name are required");
      return;
    }

    if (normalized.link && !normalized.link.startsWith("/")) {
      toast.error("Link must start with /");
      return;
    }

    if (normalized.parentOperationId === normalized.id) {
      toast.error("An operation cannot be its own parent");
      return;
    }

    try {
      if (managingModules) {
        const data = await multiTenantService.saveTenantNavigationModule(normalized.moduleId, normalized, editing?.id);
        setOperations(current => editing ? current.map(item => item.id === editing.id ? { ...item, ...data, module: modules.find(module => module.id === normalized.moduleId)?.name ?? item.module } : item) : [{ ...data, module: modules.find(module => module.id === normalized.moduleId)?.name ?? "" }, ...current]);
        toast.success(editing ? "Module updated" : "Module added");
        setDialogOpen(false);
        return;
      }
      if (editing) {
        const { data } = await operationService.update(normalized);
        setOperations((current) => current.map((operation) => (
          operation.id === editing.id
            ? { ...operation, ...data, isActive: normalized.isActive, module: modules.find((module) => module.id === normalized.moduleId)?.name ?? operation.module }
            : operation
        )));
        toast.success("Operation menu updated");
      } else {
        const { data } = await operationService.create({
          moduleId: normalized.moduleId,
          parentOperationId: normalized.parentOperationId,
          name: normalized.name,
          link: normalized.link,
          filter: normalized.filter,
          icon: normalized.icon,
          displayOrder: normalized.displayOrder,
          isActive: normalized.isActive,
        });
        setOperations((current) => [
          { ...data, module: modules.find((module) => module.id === normalized.moduleId)?.name ?? "" },
          ...current,
        ]);
        toast.success("Operation menu added");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("Unable to save operation", { description: error instanceof Error ? error.message : undefined });
    }
  };

  const openDeleteDialog = (operation: OperationDto) => {
    setPendingDelete(operation);
    setDeleteError("");
  };

  const deleteOperation = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      if (managingModules) await multiTenantService.deleteTenantNavigationModule(pendingDelete.moduleId, pendingDelete.id);
      else await operationService.delete(pendingDelete.id);
      setOperations((current) => current.filter((item) => item.id !== pendingDelete.id));
      toast.success("Operation menu deleted");
      setPendingDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error prevented deletion.";
      setDeleteError(message);
      toast.error("Unable to delete operation", { description: message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">{managingModules ? "Modules" : "Operation Menus"}</h1>
          <p className="text-muted-foreground text-sm">
            {scopedModule ? `Manage ${scopedModule.name} ${managingModules ? "modules" : "operation menu links"}` : `Manage ${managingModules ? "modules" : "operation menu links"} by subsystem`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <TenantSwitcher compact moduleCode={scopedModule?.code ?? moduleSlug} />
          </div>
          <MiniCount value={moduleOperations.filter(operation => !operation.parentOperationId).length} label="Modules" />
          {!managingModules && <MiniCount value={moduleOperations.filter(operation => operation.parentOperationId).length} label="Operations" />}
          <Button size="sm" onClick={openAdd} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> Add {managingModules ? "Module" : "Operation"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${managingModules ? "modules" : "operation menus"}...`}
            className="pl-9"
          />
        </div>
        {!scopedModule && <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((module) => (
              <SelectItem key={module.id} value={module.id}>
                {module.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>}
        {!managingModules && <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5 px-3 text-xs" onClick={toggleAllModules} disabled={!operationTree.length}>
          {allModulesCollapsed ? <ChevronsUpDown className="h-3.5 w-3.5"/> : <ChevronsDownUp className="h-3.5 w-3.5"/>}
          {allModulesCollapsed ? "Expand all" : "Collapse all"}
        </Button>}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card [&_th]:h-8 [&_th]:px-3 [&_th]:text-xs [&_td]:px-3 [&_td]:py-1.5">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>{managingModules ? "Module" : "Operation"}</TableHead>
              {!managingModules && <TableHead>Link</TableHead>}
              <TableHead className="text-center">Icon</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedOperationTree.map(({ operation, children }) => (
              <Fragment key={operation.id}>
                <TableRow className="border-y border-border bg-muted/45 hover:bg-muted/55">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {!managingModules && <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleModule(operation.id)} aria-label={`${collapsedModules.has(operation.id) ? "Expand" : "Collapse"} ${operation.name}`}>{collapsedModules.has(operation.id) ? <ChevronRight className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}</Button>}
                      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/15 bg-primary/10"><LucideIconPreview name={operation.icon || "folder"} className="h-4 w-4 text-primary"/></div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{operation.name}</span>
                      {!managingModules && <Badge variant="secondary" className="text-[10px]">{children.length} {children.length === 1 ? "operation" : "operations"}</Badge>}
                      {!operation.isActive && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                    </div>
                  </TableCell>
                  {!managingModules && <TableCell>
                    {operation.link ? (
                      <a href={operation.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline">
                        {operation.link}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </TableCell>}
                  <TableCell className="text-center">
                    <div className="mx-auto flex w-fit min-w-14 flex-col items-center gap-1">
                      <LucideIconPreview name={operation.icon || "circle-help"} className="h-5 w-5 text-foreground" />
                      <span className="max-w-20 truncate text-[9px] leading-3 text-muted-foreground">{operation.icon || "none"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {managingModules && <><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${operation.name}`} onClick={() => openEdit(operation)}>
                      <Edit className="h-4 w-4" />
                    </Button></TooltipTrigger><TooltipContent>Edit module</TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`Delete ${operation.name}`} onClick={() => openDeleteDialog(operation)}>
                      <Trash2 className="h-4 w-4" />
                    </Button></TooltipTrigger><TooltipContent>Delete module</TooltipContent></Tooltip></>}
                  </TableCell>
                </TableRow>
                {!collapsedModules.has(operation.id) && children.map((child) => (
                  <TableRow key={child.id}>
                    <TableCell>
                      <div className="ml-5 flex items-center gap-2.5 border-l-2 border-primary/15 pl-6">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                          <ListChecks className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-[13px] text-foreground">{child.name}</span>
                        {!child.isActive && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a href={child.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline">
                        {child.link}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="mx-auto flex w-fit min-w-14 flex-col items-center gap-1">
                        <LucideIconPreview name={child.icon || "circle-help"} className="h-5 w-5 text-foreground" />
                        <span className="max-w-20 truncate text-[9px] leading-3 text-muted-foreground">{child.icon || "none"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${child.name}`} onClick={() => openEdit(child)}>
                        <Edit className="h-4 w-4" />
                      </Button></TooltipTrigger><TooltipContent>Edit operation</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`Delete ${child.name}`} onClick={() => openDeleteDialog(child)}>
                        <Trash2 className="h-4 w-4" />
                      </Button></TooltipTrigger><TooltipContent>Delete operation</TooltipContent></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
            {filteredOperations.length === 0 && (
              <TableRow>
                <TableCell colSpan={managingModules ? 3 : 4} className="py-12 text-center text-muted-foreground">
                  {!busy && (managingModules ? "No modules found" : "No operation menus found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground"><span>Page {currentPage} of {pageCount}</span><Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div>}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-4xl overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-lg">{editing ? `Edit ${managingModules ? "Module" : "Operation Menu"}` : `Add ${managingModules ? "Module" : "Operation Menu"}`}</DialogTitle>
            <DialogDescription>
              Choose the sub system, module, and route that should appear as an operation menu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
            <div className="space-y-1.5 sm:order-1 sm:col-span-3">
              <Label>Sub System</Label>
              <Select
                value={form.moduleId}
                onValueChange={(value) => setForm((current) => ({ ...current, moduleId: value, parentOperationId: null, displayOrder: nextDisplayOrder(value, null, current.id) }))}
                disabled={Boolean(scopedModule)}
              >
                <SelectTrigger className="border-primary/40 bg-primary/10 px-2 font-semibold text-primary focus:ring-primary/30 disabled:opacity-100">
                  <SelectValue placeholder="Select sub system" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id} className="pl-7 data-[state=checked]:bg-primary/10 data-[state=checked]:font-medium data-[state=checked]:text-primary">
                      {module.name.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:order-3 sm:col-span-3">
              <Label htmlFor="operation-name">{managingModules ? "Module name" : "Operation name"}</Label>
              <Input id="operation-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Accounts Payable" />
            </div>
            {!managingModules && <div className="space-y-1.5 sm:order-2 sm:col-span-3">
              <Label>Module</Label>
              <Select
                value={form.parentOperationId ?? ""}
                onValueChange={(parentOperationId) => setForm((current) => ({ ...current, parentOperationId, displayOrder: nextDisplayOrder(current.moduleId, parentOperationId, current.id) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {parentOptions
                    .filter((operation) => operation.id !== form.id)
                    .map((operation) => (
                      <SelectItem key={operation.id} value={operation.id}>
                        {operation.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>}
            {!managingModules && <div className="space-y-1.5 sm:order-4 sm:col-span-3">
              <Label htmlFor="operation-link">Link</Label>
              <Input id="operation-link" value={form.link} onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))} placeholder="/finance/accounts-payable" />
            </div>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(180px,1fr)_110px]">
              <div className="space-y-1.5">
                <Label htmlFor="operation-filter">Description/filter</Label>
                <Input id="operation-filter" value={form.filter} onChange={(event) => setForm((current) => ({ ...current, filter: event.target.value }))} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="operation-icon">Icon</Label>
                <button
                  id="operation-icon"
                  type="button"
                  onClick={() => setIconDialogOpen(true)}
                  className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <LucideIconPreview
                    name={form.icon.trim().toLowerCase()}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate">{form.icon || "Choose icon"}</span>
                </button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="operation-order">Display order</Label>
                <Input id="operation-order" type="number" value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Inactive operations are hidden from menus.</p>
              </div>
              <div className="ml-auto mr-4 w-44">
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Sidebar placement</p>
                <Select
                  value={form.parentOperationId || !form.link.trim()
                    ? "hidden"
                    : form.displayOrder < 0 ? "top" : form.displayOrder > 0 ? "bottom" : "hidden"}
                  onValueChange={(value) => setForm((current) => ({
                    ...current,
                    displayOrder: value === "top"
                      ? -(Math.abs(current.displayOrder) || 10)
                      : value === "bottom"
                        ? Math.abs(current.displayOrder) || 10
                        : 0,
                  }))}
                  disabled={Boolean(form.parentOperationId) || !form.link.trim()}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sidebar placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hidden">Not in sidebar</SelectItem>
                    <SelectItem value="top">Above Setup</SelectItem>
                    <SelectItem value="bottom">Below Setup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(value) => setForm((current) => ({ ...current, isActive: value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveOperation}>{editing ? "Save Changes" : `Add ${managingModules ? "Module" : "Operation"}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setPendingDelete(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>Delete operation menu?</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{pendingDelete?.name}</span>.
              The operation cannot be deleted while it is used by another record.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-medium">Deletion failed</p>
              <p className="mt-1 break-words">{deleteError}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void deleteOperation()}>
              {deleting ? "Deleting..." : "Delete operation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={iconDialogOpen} onOpenChange={setIconDialogOpen}>
        <DialogContent className="max-h-[80vh] w-[calc(100vw-2rem)] max-w-[520px] overflow-hidden p-5">
          <DialogHeader>
            <DialogTitle className="text-lg">Choose an icon</DialogTitle>
            <DialogDescription>Select an icon or type a custom Lucide icon name.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <LucideIconPreview name={form.icon.trim().toLowerCase()} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              value={form.icon}
              onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
              placeholder="Search or type an icon name"
              autoComplete="off"
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-[42vh] overflow-y-auto rounded-md border border-border p-2">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {filteredIconNames.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({ ...current, icon: iconName }));
                    setIconDialogOpen(false);
                  }}
                  className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                >
                  <LucideIconPreview name={iconName} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{iconName}</span>
                </button>
              ))}
            </div>
            {filteredIconNames.length === 0 && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <LucideIconPreview name={form.icon.trim().toLowerCase()} className="h-5 w-5" />
                <span>Custom icon: {form.icon || "none"}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIconDialogOpen(false)}>Use “{form.icon || "custom"}”</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function MiniCount({ value, label }: { value: number; label: string }) {
  return <div className="min-w-[72px] rounded-lg border bg-card px-3 py-1.5 text-center"><p className="text-sm font-bold leading-4">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}

export default OperationManagement;
