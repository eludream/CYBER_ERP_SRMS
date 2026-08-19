import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, Check, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Edit, ExternalLink, LayoutGrid, Menu, Plus, Search, Trash2 } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import LucideIconPreview from "@/components/LucideIconPreview";
import { iconNames } from "@/config/iconNames";
import { isSystemResourceModule } from "@/config/platformModules";
import { platformAdminPaths } from "@/config/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { multiTenantService, PlatformModuleRecord, PlatformOperationRecord } from "@/services/api/multiTenantService";

const emptyOperation = (moduleId: string): PlatformOperationRecord => ({
  id: "", moduleId, parentOperationId: null, name: "", link: "",
  filter: "", icon: "folder", displayOrder: 0, isActive: true,
});

export default function PlatformOperationMaintenancePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { moduleId = "" } = useParams<{ moduleId: string }>();
  const managingModules = location.pathname.endsWith("/modules");
  const itemLabel = managingModules ? "Module" : "Operation";
  const [module, setModule] = useState<PlatformModuleRecord>();
  const [modules, setModules] = useState<PlatformModuleRecord[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operations, setOperations] = useState<PlatformOperationRecord[]>([]);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(() => new Set());
  const [form, setForm] = useState(emptyOperation(moduleId));
  const [formOpen, setFormOpen] = useState(false);
  const [iconDialogOpen, setIconDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformOperationRecord>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const modules = await multiTenantService.modules();
      const selected = modules.find(item => item.id === moduleId);
      if (!selected) throw new Error("Platform sub system was not found");
      if (isSystemResourceModule(selected)) {
        toast.info("System Resource does not have an operation editor.");
        navigate(platformAdminPaths.subsystems, { replace: true });
        return;
      }
      setModules(modules.filter(item => !isSystemResourceModule(item)).sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)));
      setModule(selected);
      setOperations(await multiTenantService.operations(moduleId));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load sub system operations"); }
    finally { setLoading(false); }
  }, [moduleId, navigate]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return operations.filter(operation => (managingModules ? !operation.parentOperationId : Boolean(operation.parentOperationId)) &&
      (!query || [operation.name, operation.link, operation.filter].some(value => value.toLowerCase().includes(query))));
  }, [managingModules, operations, search]);
  const operationTree = useMemo(() => {
    const childrenByModule = filtered.reduce<Record<string, PlatformOperationRecord[]>>((result, operation) => {
      if (operation.parentOperationId) result[operation.parentOperationId] = [...(result[operation.parentOperationId] ?? []), operation];
      return result;
    }, {});
    return operations.filter(operation => !operation.parentOperationId)
      .map(module => ({ module, children: (childrenByModule[module.id] ?? []).sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)) }))
      .filter(item => item.children.length > 0)
      .sort((a, b) => a.module.displayOrder - b.module.displayOrder || a.module.name.localeCompare(b.module.name));
  }, [filtered, operations]);
  const pageSize = managingModules ? 10 : 5;
  const pageItems = managingModules ? filtered : operationTree;
  const pageCount = Math.max(1, Math.ceil(pageItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = pageItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => setPage(1), [managingModules, search]);
  const filteredIconNames = useMemo(() => {
    const query = form.icon.trim().toLowerCase();
    return query ? iconNames.filter(iconName => iconName.includes(query)) : iconNames;
  }, [form.icon]);

  const nextDisplayOrder = (parentOperationId: string | null, excludedId = "") =>
    Math.max(0, ...operations
      .filter(operation => operation.parentOperationId === parentOperationId && operation.id !== excludedId)
      .map(operation => operation.displayOrder)) + 1;

  const edit = (operation?: PlatformOperationRecord) => {
    const parentOperationId = managingModules ? null : operations.find(item => !item.parentOperationId)?.id ?? null;
    setForm(operation ? { ...operation } : { ...emptyOperation(moduleId), parentOperationId, displayOrder: nextDisplayOrder(parentOperationId) });
    setFormOpen(true);
  };
  const save = async () => {
    const name = form.name.trim();
    const value = { ...form, name, link: form.link.trim(), filter: form.filter.trim(), icon: form.icon.trim() };
    if (!value.name) { toast.error(`${itemLabel} name is required`); return; }
    if (!managingModules && !value.parentOperationId) { toast.error("Choose a module for this operation"); return; }
    if (value.link && !value.link.startsWith("/")) { toast.error("Link must start with /"); return; }
    setSaving(true);
    try {
      await multiTenantService.saveOperation(moduleId, value, form.id || undefined);
      toast.success(form.id ? `${itemLabel} updated` : `${itemLabel} added`);
      setFormOpen(false);
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save module operation"); }
    finally { setSaving(false); }
  };
  const deleteOperation = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await multiTenantService.deleteOperation(moduleId, deleteTarget.id);
      toast.success(`${deleteTarget.parentOperationId ? "Operation" : "Module"} deleted`);
      setDeleteTarget(undefined);
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete operation"); }
    finally { setDeleting(false); }
  };

  const operationRow = (operation: PlatformOperationRecord) => (
    <TableRow key={operation.id}>
      <TableCell><div className="ml-5 flex items-center gap-2.5 border-l-2 border-primary/15 pl-6"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary"><LucideIconPreview name={operation.icon || "list-checks"} className="h-4 w-4"/></span><p className="text-[13px] text-foreground">{operation.name}</p></div></TableCell>
      <TableCell>{operation.link ? <a href={operation.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline">{operation.link}<ExternalLink className="h-3 w-3"/></a> : null}</TableCell>
      <TableCell className="text-center"><div className="mx-auto flex w-fit min-w-14 flex-col items-center gap-1"><LucideIconPreview name={operation.icon || "circle-help"} className="h-5 w-5 text-foreground"/><span className="max-w-20 truncate text-[9px] leading-3 text-muted-foreground">{operation.icon || "none"}</span></div></TableCell>
      <TableCell><div className="flex justify-end gap-1"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${operation.name}`} onClick={() => edit(operation)}><Edit className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Edit operation</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`Delete ${operation.name}`} onClick={() => setDeleteTarget(operation)}><Trash2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Delete operation</TooltipContent></Tooltip></div></TableCell>
    </TableRow>
  );
  const toggleModule = (id: string) => setCollapsedModules(current => {
    const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const allModulesCollapsed = operationTree.length > 0 && operationTree.every(({ module }) => collapsedModules.has(module.id));
  const toggleAllModules = () => setCollapsedModules(allModulesCollapsed ? new Set() : new Set(operationTree.map(({ module }) => module.id)));

  return <div className="flex min-h-screen w-full bg-background">
    {mobileMenuOpen && <button type="button" aria-label="Close navigation menu" className="fixed inset-0 z-30 bg-black/45 md:hidden" onClick={() => setMobileMenuOpen(false)}/>} 
    <PlatformOperationSidebar mobileOpen={mobileMenuOpen} module={module} modules={modules} managingModules={managingModules} onSelectModule={id => { setMobileMenuOpen(false); navigate(`/platform-admin/subsystems/${id}/${managingModules ? "modules" : "operations"}`); }}/>
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="fixed left-3 top-2 z-50 md:hidden"><Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-sm" aria-label="Open navigation menu" onClick={() => setMobileMenuOpen(true)}><Menu className="h-4 w-4"/></Button></div>
      <AppHeader/>
      <div className="hidden px-6 pb-0 pt-4 md:block"><nav className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="Breadcrumb">
        <Link to={platformAdminPaths.organization} className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2.5 py-1 text-muted-foreground hover:text-foreground"><Building2 className="h-3.5 w-3.5"/>Platform Administration</Link><ChevronRight className="h-3 w-3 text-muted-foreground/40"/>
        <Link to={platformAdminPaths.subsystems} className="flex items-center gap-1.5 px-2.5 py-1 text-muted-foreground hover:text-foreground"><LayoutGrid className="h-3.5 w-3.5 text-primary"/>Sub Systems</Link><ChevronRight className="h-3 w-3 text-muted-foreground/40"/>
        <span className="px-2 py-1 font-medium text-muted-foreground">{module?.name ?? "Sub System"}</span><ChevronRight className="h-3 w-3 text-muted-foreground/40"/><span className="rounded-md bg-primary/10 px-2.5 py-1 font-semibold text-primary">{managingModules ? "Modules" : "Operations"}</span>
      </nav></div>
    <main className="flex-1 overflow-auto p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="font-display text-2xl font-bold">{managingModules ? "Modules" : "Operation Menus"}</h1><p className="text-sm text-muted-foreground">Manage {module?.name ?? "sub system"} {managingModules ? "modules separately from their operation menus." : "operation menu links."}</p></div><div className="flex items-center gap-2"><MiniCount value={operations.filter(x => !x.parentOperationId).length} label="Modules"/>{!managingModules && <MiniCount value={operations.filter(x => x.parentOperationId).length} label="Operations"/>}<Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => edit()} disabled={!module}><Plus className="h-3.5 w-3.5"/>Add {itemLabel}</Button></div></div>
        <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${managingModules ? "modules" : "operation menus"}...`} className="pl-9"/></div>{!managingModules && <Button type="button" variant="outline" size="sm" className="h-10 gap-1.5 px-3 text-xs" onClick={toggleAllModules} disabled={!operationTree.length}>{allModulesCollapsed ? <ChevronsUpDown className="h-3.5 w-3.5"/> : <ChevronsDownUp className="h-3.5 w-3.5"/>}{allModulesCollapsed ? "Expand all" : "Collapse all"}</Button>}</div>
        <div className={`overflow-hidden rounded-xl border bg-card [&_th]:h-8 [&_th]:px-3 [&_th]:text-xs [&_td]:px-3 [&_td]:py-1.5 ${managingModules ? "[&_th:nth-child(2)]:hidden [&_td:nth-child(2)]:hidden" : ""}`}><Table><TableHeader><TableRow className="bg-muted/30"><TableHead>{managingModules ? "Module" : "Operation"}</TableHead><TableHead>Link</TableHead><TableHead className="w-36 text-center">Icon</TableHead><TableHead className="w-20 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {managingModules ? (pagedItems as PlatformOperationRecord[]).map(operation => <Fragment key={operation.id}><TableRow className="border-y border-border bg-muted/45 hover:bg-muted/55"><TableCell><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary"><LucideIconPreview name={operation.icon || "folder"} className="h-4 w-4"/></span><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{operation.name}</p>{!operation.isActive && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}</div></TableCell><TableCell/><TableCell className="text-center"><LucideIconPreview name={operation.icon || "folder"} className="mx-auto h-5 w-5"/></TableCell><TableCell><div className="flex justify-end gap-0.5"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => edit(operation)}><Edit className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Edit module</TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(operation)}><Trash2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Delete module</TooltipContent></Tooltip></div></TableCell></TableRow></Fragment>) : (pagedItems as typeof operationTree).map(({ module, children }) => <Fragment key={module.id}><TableRow className="border-y border-border bg-muted/45"><TableCell><div className="flex items-center gap-2.5"><Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleModule(module.id)} aria-label={`${collapsedModules.has(module.id) ? "Expand" : "Collapse"} ${module.name}`}>{collapsedModules.has(module.id) ? <ChevronRight className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}</Button><span className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary"><LucideIconPreview name={module.icon || "folder"} className="h-4 w-4"/></span><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{module.name}</p>{!module.isActive && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}</div></TableCell><TableCell/><TableCell className="text-center"><LucideIconPreview name={module.icon || "folder"} className="mx-auto h-5 w-5"/></TableCell><TableCell/></TableRow>{!collapsedModules.has(module.id) && children.map(operationRow)}</Fragment>)}
          {!pageItems.length && <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
            {!loading && (managingModules ? "No modules found" : "No operation menus found")}
          </TableCell></TableRow>}
        </TableBody></Table></div>{pageCount > 1 && <Pager page={currentPage} pages={pageCount} onChange={setPage}/>} 
      </div>
    </main>
    <AppFooter/>
    </div>
    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-[720px] overflow-y-auto p-5"><DialogHeader><DialogTitle className="text-lg">{form.id ? "Edit" : "Add"} {itemLabel}</DialogTitle><DialogDescription>{managingModules ? "Choose the sub system and details for the navigation module." : "Choose the module and route that should appear as an operation menu."}</DialogDescription></DialogHeader>
      <div className="space-y-3 py-1">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Sub System"><div className="flex h-10 w-full items-center rounded-md border border-primary/40 bg-primary/10 px-2 text-sm font-semibold text-primary" aria-label="Current sub system"><span className="min-w-0 truncate">{module?.name.trim() || "Sub System"}</span></div></Field>
          {managingModules ? <Field label="Module name"><Input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Accounts Payable" autoFocus/></Field> : <Field label="Module"><Select value={form.parentOperationId ?? ""} onValueChange={value => setForm({...form, parentOperationId:value, displayOrder:nextDisplayOrder(value, form.id)})}><SelectTrigger><SelectValue placeholder="Select module"/></SelectTrigger><SelectContent>{operations.filter(x => !x.parentOperationId && x.id !== form.id).map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select></Field>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {!managingModules && <Field label={`${itemLabel} name`}><Input value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Accounts Payable"/></Field>}
          {!managingModules && <Field label="Link"><Input value={form.link} onChange={e => setForm({...form, link:e.target.value})} placeholder="/finance/accounts-payable"/></Field>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(180px,1fr)_110px]">
          <Field label="Description/filter"><Input value={form.filter} onChange={e => setForm({...form, filter:e.target.value})} placeholder="Optional"/></Field>
          <Field label="Icon"><button type="button" onClick={() => setIconDialogOpen(true)} className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LucideIconPreview name={form.icon.trim().toLowerCase()} className="h-4 w-4 shrink-0"/><span className="min-w-0 flex-1 truncate">{form.icon || "Choose icon"}</span></button></Field>
          <Field label="Display order"><Input type="number" value={form.displayOrder} onChange={e => setForm({...form, displayOrder:Number(e.target.value)})}/></Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"><div><p className="text-sm font-medium text-foreground">Active</p><p className="text-xs text-muted-foreground">Inactive operations are hidden from menus.</p></div><Switch checked={form.isActive} onCheckedChange={value => setForm({...form, isActive:value})}/></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button disabled={saving} onClick={() => void save()}>{saving ? "Saving..." : form.id ? "Save Changes" : `Add ${itemLabel}`}</Button></DialogFooter></DialogContent>
    </Dialog>
    <Dialog open={iconDialogOpen} onOpenChange={setIconDialogOpen}>
      <DialogContent className="max-h-[80vh] w-[calc(100vw-2rem)] max-w-[520px] overflow-hidden p-5">
        <DialogHeader><DialogTitle className="text-lg">Choose an icon</DialogTitle><DialogDescription>Select an icon or type a custom Lucide icon name.</DialogDescription></DialogHeader>
        <div className="relative">
          <LucideIconPreview name={form.icon.trim().toLowerCase()} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"/>
          <Input value={form.icon} onChange={event => setForm({...form, icon:event.target.value})} placeholder="Search or type an icon name" autoComplete="off" className="pl-10" autoFocus/>
        </div>
        <div className="max-h-[42vh] overflow-y-auto rounded-md border border-border p-2">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {filteredIconNames.map(iconName => <button key={iconName} type="button" onClick={() => { setForm({...form, icon:iconName}); setIconDialogOpen(false); }} className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground"><LucideIconPreview name={iconName} className="h-4 w-4 shrink-0"/><span className="truncate">{iconName}</span></button>)}
          </div>
          {!filteredIconNames.length && <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><LucideIconPreview name={form.icon.trim().toLowerCase()} className="h-5 w-5"/><span>Custom icon: {form.icon || "none"}</span></div>}
        </div>
        <DialogFooter><Button onClick={() => setIconDialogOpen(false)}>Use "{form.icon || "custom"}"</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(deleteTarget)} onOpenChange={open => !open && !deleting && setDeleteTarget(undefined)}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Delete {deleteTarget?.parentOperationId ? "operation" : "module"}?</DialogTitle><DialogDescription>This permanently removes <strong>{deleteTarget?.name}</strong> from the platform catalog. Modules with child operations must be emptied first.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(undefined)}>Cancel</Button><Button variant="destructive" disabled={deleting} onClick={() => void deleteOperation()}>{deleting ? "Deleting..." : "Delete"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}

function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) { return <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground"><span>Page {page} of {pages}</span><Button variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page === pages} onClick={() => onChange(page + 1)}>Next</Button></div>; }
function MiniCount({ value, label }: { value: number; label: string }) { return <div className="min-w-[72px] rounded-lg border bg-card px-3 py-1.5 text-center"><p className="text-sm font-bold leading-4">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>; }

function PlatformOperationSidebar({ module, modules, managingModules, onSelectModule, mobileOpen }: { module?: PlatformModuleRecord; modules: PlatformModuleRecord[]; managingModules: boolean; onSelectModule: (id: string) => void; mobileOpen: boolean }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [setupExpanded, setSetupExpanded] = useState(true);
  const activeModules = modules.filter(item => item.isActive);
  useEffect(() => { if (mobileOpen) setSidebarCollapsed(false); }, [mobileOpen]);
  return <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[min(300px,85vw)] shrink-0 select-none flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out md:sticky md:top-0 md:z-auto md:translate-x-0 md:transition-all ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCollapsed ? "md:w-[60px]" : "md:w-[300px]"}`}>
    <div className={`flex h-12 shrink-0 items-center border-b border-sidebar-border ${sidebarCollapsed ? "px-1" : "px-3"}`}>
      <Link to="/" className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:opacity-80">
        <span className={`flex shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm ${sidebarCollapsed ? "h-6 w-6" : "h-8 w-8"}`}><Building2 className="h-4 w-4 text-primary-foreground"/></span>
        {!sidebarCollapsed && <span className="whitespace-nowrap font-display text-[15px] font-bold">Cyber<span className="text-primary">ERP</span></span>}
      </Link>
      <button type="button" onClick={() => setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="ml-auto hidden h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex"><ChevronRight className={`h-3.5 w-3.5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}/></button>
    </div>
    <div className={`border-b border-sidebar-border px-2 pb-1 pt-2 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" title={sidebarCollapsed ? module?.name ?? "Select sub system" : undefined} className={`flex min-h-11 items-center rounded-lg py-2 text-left transition-colors hover:bg-muted/50 ${sidebarCollapsed ? "justify-center px-2" : "w-full gap-2 px-3"}`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <LucideIconPreview name={module?.icon || "layout-grid"} className="h-4 w-4 text-primary"/>
            </span>
            {!sidebarCollapsed && <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold leading-4 text-foreground">{module?.name ?? "Select sub system"}</span>
              <span className="mt-0.5 block truncate text-[10px] leading-3 text-muted-foreground">Platform sub system operations</span>
            </span>}
            {!sidebarCollapsed && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground"/>}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="flex max-h-[var(--radix-dropdown-menu-content-available-height)] w-64 flex-col overflow-hidden p-1.5">
          <div className="shrink-0 px-2.5 py-1.5"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sub Systems</p></div>
          <DropdownMenuSeparator className="shrink-0"/>
          <div className="min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeModules.map(item => <DropdownMenuItem key={item.id} onClick={() => onSelectModule(item.id)} className={`gap-2 rounded-md px-2.5 py-2 ${module?.id === item.id ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary" : ""}`}>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10"><LucideIconPreview name={item.icon || "layout-grid"} className="h-3.5 w-3.5 text-primary"/></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-foreground">{item.name}</span><span className="block truncate text-[9px] font-semibold uppercase leading-3 text-muted-foreground">{item.abbreviation || "N/A"}</span></span>
              {module?.id === item.id && <Check className="h-3.5 w-3.5 shrink-0 text-primary"/>}
            </DropdownMenuItem>)}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div className="px-3 pb-1 pt-3">
      <Link to={platformAdminPaths.subsystems} title={sidebarCollapsed ? "All Sub Systems" : undefined} className={`flex items-center rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${sidebarCollapsed ? "justify-center" : "gap-2"}`}><ArrowLeft className="h-3.5 w-3.5"/>{!sidebarCollapsed && "All Sub Systems"}</Link>
    </div>
    <div className={`mt-3 border-primary bg-sidebar-accent/60 py-3 ${sidebarCollapsed ? "mx-2 flex justify-center rounded-lg px-2" : "border-l-4 px-5"}`}>
      <div className="flex items-center gap-2.5">
        <LucideIconPreview name={module?.icon || "layout-grid"} className="h-4 w-4 shrink-0 text-primary"/>
        {!sidebarCollapsed && <span className="min-w-0 truncate font-display text-sm font-bold uppercase leading-tight tracking-wide text-foreground">{module?.abbreviation || "N/A"}</span>}
      </div>
      {!sidebarCollapsed && <div className="mt-1 truncate text-xs font-normal leading-tight text-muted-foreground">{module?.name ?? "Sub System"}</div>}
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      <button type="button" aria-expanded={setupExpanded} title={sidebarCollapsed ? "Setup" : undefined} onClick={() => setSetupExpanded(value => !value)} className={`mb-1 flex w-full items-center rounded-md px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${sidebarCollapsed ? "justify-center" : "gap-2"}`}>
        {setupExpanded ? <ChevronDown className="h-3.5 w-3.5"/> : <ChevronRight className="h-3.5 w-3.5"/>}
        {!sidebarCollapsed && <span>Setup</span>}
      </button>
      {setupExpanded && <div className={sidebarCollapsed ? "" : "ml-3 border-l border-sidebar-border pl-2"}>
        <Link to={`/platform-admin/subsystems/${module?.id}/modules`} title={sidebarCollapsed ? "Modules" : undefined} className={`flex items-center rounded-lg px-3 py-2.5 text-xs transition-colors hover:bg-muted ${managingModules ? "bg-muted/70 text-foreground" : "text-muted-foreground"} ${sidebarCollapsed ? "justify-center" : "gap-2"}`}><LucideIconPreview name="folder" className="h-4 w-4"/>{!sidebarCollapsed && <span>Modules</span>}</Link>
        <Link to={`/platform-admin/subsystems/${module?.id}/operations`} title={sidebarCollapsed ? "Operations" : undefined} className={`flex items-center rounded-lg px-3 py-2.5 text-xs transition-colors hover:bg-muted ${!managingModules ? "bg-muted/70 text-foreground" : "text-muted-foreground"} ${sidebarCollapsed ? "justify-center" : "gap-2"}`}><ListChecksIcon/>{!sidebarCollapsed && <span>Operations</span>}</Link>
      </div>}
    </nav>
  </aside>;
}

function ListChecksIcon() { return <LucideIconPreview name="list-checks" className="h-4 w-4"/>; }
