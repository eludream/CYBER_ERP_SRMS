import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Contact, ExternalLink, Globe2, ImagePlus, LayoutGrid, List, ListChecks, MapPin, Menu, Pencil, Plus, Settings2, ShieldCheck, Trash2, Upload, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import LucideIconPreview from "@/components/LucideIconPreview";
import { iconNames } from "@/config/iconNames";
import { isRequiredTenantModule, isSecurityAdminModule, isSystemResourceModule } from "@/config/platformModules";
import { platformAdminPaths, moduleBasePath } from "@/config/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LookupCategoryItemRecord, multiTenantService, OrganizationRecord, PlatformModuleRecord, RoleTemplateRecord, SubscriptionPlanRecord, TenantRecord } from "@/services/api/multiTenantService";
import { useTenant } from "@/contexts/TenantContext";
import PlatformOrganizationSummary from "@/pages/administration/PlatformOrganizationSettingsView";
import PlatformSystemSettings from "@/pages/administration/PlatformSystemSettings";
import PlatformUsers from "@/pages/administration/PlatformUsers";

type Editor = "organization" | "tenant" | "module" | "plan" | "role" | null;
type PlatformTab = "organizations" | "tenants" | "subsystems" | "roles" | "settings" | "users";
type ViewMode = "table" | "cards";
const platformSectionTabs: Record<string, PlatformTab> = {
  organization: "organizations", organizations: "organizations",
  tenant: "tenants", tenants: "tenants",
  subsystem: "subsystems", subsystems: "subsystems", modules: "subsystems",
  roles: "roles", settings: "settings", users: "users",
};
const platformTabPaths: Record<PlatformTab, string> = {
  organizations: platformAdminPaths.organization,
  tenants: platformAdminPaths.tenant,
  subsystems: platformAdminPaths.subsystems,
  roles: platformAdminPaths.roles,
  settings: platformAdminPaths.settings,
  users: platformAdminPaths.users,
};
const organizationBlank: Omit<OrganizationRecord, "id"> = {
  code: "", legalName: "", displayName: "", registrationNumber: "", taxNumber: "", tinNumber: "",
  organizationType: "", industry: "", website: "", logoUrl: "", address: "",
  postalAddress: "", country: "", region: "", city: "", postalCode: "", phone: "",
  email: "", primaryContactName: "", primaryContactTitle: "", primaryContactEmail: "",
  primaryContactPhone: "", currency: "USD", timezone: "Africa/Nairobi", locale: "en",
  defaultLanguage: "en", dateFormat: "yyyy-MM-dd", fiscalYearStartMonth: 1,
  dataRetentionPolicy: "", regulatoryIdentifiers: "", isActive: true,
};
const moduleBlank = { code: "", name: "", abbreviation: "", description: "", landingPath: "", icon: "", displayOrder: 0, isActive: true, subSystem: "ERP" };
const planBlank = { name: "", description: "", price: 0, billingCycle: "Yearly", maxUsers: 100, maxStorageGB: 100, trialDays: 0, isActive: true, moduleIds: [] as string[] };
const roleBlank = { code: "", name: "", description: "", isPlatformRole: false, isActive: true };
const tenantBlank = { organizationId: "", organizationName: "", identifier: "", name: "", tenantTypeId: null as string | null, isActive: true, moduleIds: [] as string[] };

export default function PlatformAdministration() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const routeSection = location.pathname.split("/").filter(Boolean).at(-1) ?? "organization";
  const { reloadMemberships } = useTenant();
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [modules, setModules] = useState<PlatformModuleRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [tenantTypes, setTenantTypes] = useState<LookupCategoryItemRecord[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanRecord[]>([]);
  const [templates, setTemplates] = useState<RoleTemplateRecord[]>([]);
  const activeTab = platformSectionTabs[routeSection] ?? "organizations";
  const [loadedTabs, setLoadedTabs] = useState<Set<PlatformTab>>(() => new Set());
  const loadingTabs = useRef(new Set<PlatformTab>());
  const [editor, setEditor] = useState<Editor>(null);
  const [editingId, setEditingId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: Exclude<Editor, null>; id: string; name: string }>();
  const [orgForm, setOrgForm] = useState(organizationBlank);
  const [orgEditorTab, setOrgEditorTab] = useState("identity");
  const [orgLogoFile, setOrgLogoFile] = useState<File>();
  const [orgLogoPreview, setOrgLogoPreview] = useState<string>();
  const [orgLogoRemoved, setOrgLogoRemoved] = useState(false);
  const [moduleForm, setModuleForm] = useState(moduleBlank);
  const [moduleIconDialogOpen, setModuleIconDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState(planBlank);
  const [roleForm, setRoleForm] = useState(roleBlank);
  const [tenantForm, setTenantForm] = useState(tenantBlank);
  const [originalTenantModuleIds, setOriginalTenantModuleIds] = useState<string[]>([]);
  const [unassignNames, setUnassignNames] = useState<string[]>();
  const [tenantView, setTenantView] = useState<ViewMode>("table");
  const [subsystemView, setSubsystemView] = useState<ViewMode>("table");
  const [roleView, setRoleView] = useState<ViewMode>("table");
  const [rolePage, setRolePage] = useState(1);
  const [subsystemPage, setSubsystemPage] = useState(1);
  const orderedTemplates = useMemo(() => [...templates].sort((left, right) => Number(right.isPlatformRole) - Number(left.isPlatformRole) || left.name.localeCompare(right.name)), [templates]);
  const tenantAssignableModules = useMemo(() => modules.filter(module => !isSystemResourceModule(module)), [modules]);
  const requiredTenantModuleIds = useMemo(() => tenantAssignableModules.filter(isRequiredTenantModule).map(module => module.id), [tenantAssignableModules]);
  const filteredModuleIconNames = useMemo(() => {
    const query = moduleForm.icon.trim().toLowerCase();
    return query ? iconNames.filter(iconName => iconName.includes(query)) : iconNames;
  }, [moduleForm.icon]);

  const loadTab = useCallback(async (tab: PlatformTab, force = false) => {
    if ((!force && loadedTabs.has(tab)) || loadingTabs.current.has(tab)) return;
    loadingTabs.current.add(tab);
    try {
      if (tab === "organizations") {
        setOrganizations(await multiTenantService.organizations());
      } else if (tab === "subsystems") {
        setModules(await multiTenantService.modules());
      } else if (tab === "tenants") {
        const [organizationRows, moduleRows, lookupRows] = await Promise.all([
          organizations.length ? Promise.resolve(organizations) : multiTenantService.organizations(),
          modules.length ? Promise.resolve(modules) : multiTenantService.modules(),
          multiTenantService.lookupCategories(),
        ]);
        setOrganizations(organizationRows);
        setModules(moduleRows);
        const tenantTypeCategory = lookupRows.find(category => category.code.replace(/[^a-z0-9]/gi, "").toLowerCase() === "tenanttype");
        setTenantTypes(tenantTypeCategory?.items ?? []);
        setTenants(organizationRows[0] ? await multiTenantService.organizationTenantsForPlatform(organizationRows[0].id) : []);
      } else if (tab === "roles") {
        setTemplates(await multiTenantService.templates());
      }
      setLoadedTabs(current => new Set(current).add(tab));
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load platform administration"); }
    finally { loadingTabs.current.delete(tab); }
  }, [loadedTabs, modules, organizations]);
  useEffect(() => { void loadTab(activeTab); }, [activeTab, loadTab]);
  useEffect(() => { setRolePage(page => Math.min(page, Math.max(1, Math.ceil(templates.length / 10)))); }, [templates.length]);
  useEffect(() => { setSubsystemPage(page => Math.min(page, Math.max(1, Math.ceil(modules.length / 10)))); }, [modules.length]);
  useEffect(() => {
    const tab = platformSectionTabs[routeSection];
    if (!tab) {
      navigate(platformAdminPaths.organization, { replace: true });
      return;
    }
  }, [navigate, routeSection]);

  const openNew = (type: Exclude<Editor, null>) => { if(type==="organization"&&organizations.length){toast.info("Only one organization is allowed. Use Edit to maintain it.");return;} setEditingId(undefined); setEditor(type); if (type === "organization") { setOrgForm(organizationBlank); setOrgLogoFile(undefined); setOrgLogoPreview(undefined); setOrgLogoRemoved(false); setOrgEditorTab("identity"); } if (type === "tenant") { setOriginalTenantModuleIds([]); setUnassignNames(undefined); setTenantForm({...tenantBlank,organizationId:organizations[0]?.id??"",organizationName:organizations[0]?.displayName??"",moduleIds:requiredTenantModuleIds}); } if (type === "module") { const nextCode = Math.max(0, ...modules.map(module => Number.parseInt(module.code, 10)).filter(Number.isFinite)) + 1; const nextDisplayOrder = Math.max(0, ...modules.map(module => module.displayOrder)) + 1; setModuleForm({...moduleBlank,code:String(nextCode).padStart(3,"0"),displayOrder:nextDisplayOrder}); } if (type === "plan") setPlanForm(planBlank); if (type === "role") setRoleForm(roleBlank); };
  const editOrganization = (x: OrganizationRecord) => { setEditingId(x.id); setOrgForm({ ...x }); setOrgLogoFile(undefined); setOrgLogoPreview(undefined); setOrgLogoRemoved(false); setOrgEditorTab("identity"); setEditor("organization"); };
  const editModule = (x: PlatformModuleRecord) => { setEditingId(x.id); setModuleForm({ ...x, icon: x.icon ?? "", subSystem: "ERP" }); setEditor("module"); };
  const editPlan = (x: SubscriptionPlanRecord) => { setEditingId(x.id); setPlanForm({ name: x.name, description: x.description, price: x.price, billingCycle: x.billingCycle, maxUsers: x.maxUsers, maxStorageGB: x.maxStorageGB, trialDays: x.trialDays, isActive: x.isActive, moduleIds: x.moduleIds }); setEditor("plan"); };
  const editRole = (x: RoleTemplateRecord) => { setEditingId(x.id); setRoleForm({ code: x.code, name: x.name, description: x.description, isPlatformRole: x.isPlatformRole, isActive: x.isActive }); setEditor("role"); };
  const editTenant = (x: TenantRecord) => { setEditingId(x.id); setOriginalTenantModuleIds(x.moduleIds); setUnassignNames(undefined); setTenantForm({organizationId:x.organizationId,organizationName:organizations.find(o=>o.id===x.organizationId)?.displayName??"",identifier:x.identifier,name:x.name,tenantTypeId:x.tenantTypeId??null,isActive:x.isActive,moduleIds:Array.from(new Set([...x.moduleIds,...requiredTenantModuleIds]))}); setEditor("tenant"); };
  const removedTenantSubSystems = () => {
    const selected = new Set(tenantForm.moduleIds);
    return originalTenantModuleIds
      .filter(id => !selected.has(id))
      .map(id => modules.find(module => module.id === id)?.name ?? "Sub system");
  };
  const save = async (confirmUnassign = false) => {
    if (!editor) return;
    if (editor === "organization" && (!orgForm.code.trim() || !orgForm.displayName.trim() || !orgForm.legalName.trim())) { setOrgEditorTab("identity"); toast.error("Organization code, display name, and legal name are required"); return; }
    if (editor === "organization" && orgForm.currency.trim().length !== 3) { setOrgEditorTab("regional"); toast.error("Currency must be a 3-letter ISO code"); return; }
    if (editor === "organization" && (orgForm.fiscalYearStartMonth < 1 || orgForm.fiscalYearStartMonth > 12)) { setOrgEditorTab("regional"); toast.error("Fiscal year start month must be between 1 and 12"); return; }
    if (editor === "tenant" && (!tenantForm.identifier.trim() || !tenantForm.name.trim())) { toast.error("Tenant identifier and name are required"); return; }
    if (editor === "tenant" && !tenantForm.organizationId && !tenantForm.organizationName.trim()) { toast.error("Organization name is required"); return; }
    if (editor === "tenant" && editingId && !confirmUnassign) {
      const removed = removedTenantSubSystems();
      if (removed.length) { setUnassignNames(removed); return; }
    }
    setSaving(true);
    try {
      if (editor === "organization") {
        const saved = await multiTenantService.saveOrganization(orgForm, editingId);
        if (orgLogoRemoved) await multiTenantService.deleteOrganizationLogo(saved.id);
        if (orgLogoFile) {
          await multiTenantService.uploadOrganizationLogo(saved.id, orgLogoFile);
        }
      }
      if (editor === "tenant") {
        let organizationId = tenantForm.organizationId;
        if (!organizationId) {
          const organizationName = tenantForm.organizationName.trim();
          const generatedCode = organizationName.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase().slice(0, 40) || "ORGANIZATION";
          const organization = await multiTenantService.saveOrganization({
            ...organizationBlank,
            code: generatedCode,
            displayName: organizationName,
            legalName: organizationName,
          });
          organizationId = organization.id;
        }
        const activeModuleIds = new Set(tenantAssignableModules.filter(module => module.isActive).map(module => module.id));
        await multiTenantService.saveTenant(organizationId, {
          ...tenantForm,
          organizationId,
          moduleIds: Array.from(new Set([
            ...tenantForm.moduleIds.filter(moduleId => activeModuleIds.has(moduleId)),
            ...requiredTenantModuleIds,
          ])),
        }, editingId);
        await reloadMemberships();
      }
      if (editor === "module") {
        await multiTenantService.saveModule({
          ...moduleForm,
          landingPath: isSystemResourceModule(moduleForm) ? moduleBasePath(moduleForm.abbreviation) : moduleForm.landingPath,
        }, editingId);
      }
      if (editor === "plan") {
        const assignableModuleIds = new Set(tenantAssignableModules.map(module => module.id));
        await multiTenantService.savePlan({ ...planForm, moduleIds: planForm.moduleIds.filter(moduleId => assignableModuleIds.has(moduleId)) }, editingId);
      }
      if (editor === "role") await multiTenantService.saveTemplate(roleForm, editingId);
      toast.success(`${editor[0].toUpperCase()}${editor.slice(1)} saved`); setEditor(null); await loadTab(activeTab, true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save record"); }
    finally { setSaving(false); }
  };
  const toggle = (values: string[], id: string) => values.includes(id) ? values.filter(x => x !== id) : [...values, id];
  const selectOrganizationLogo = (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Choose a PNG, JPG, or WebP image"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Organization logos must be 2 MB or smaller"); return; }
    const reader = new FileReader();
    reader.onload = () => { setOrgLogoFile(file); setOrgLogoPreview(String(reader.result)); setOrgLogoRemoved(false); };
    reader.readAsDataURL(file);
  };
  const remove = async () => {
    if (!deleteTarget) return; setSaving(true);
    try {
      if (deleteTarget.type === "organization") await multiTenantService.deleteOrganization(deleteTarget.id);
      if (deleteTarget.type === "tenant") await multiTenantService.deleteTenant(organizations[0].id, deleteTarget.id);
      if (deleteTarget.type === "module") await multiTenantService.deleteModule(deleteTarget.id);
      if (deleteTarget.type === "plan") await multiTenantService.deletePlan(deleteTarget.id);
      if (deleteTarget.type === "role") await multiTenantService.deleteTemplate(deleteTarget.id);
      toast.success(`${deleteTarget.name} deleted`); setDeleteTarget(undefined); await loadTab(activeTab, true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete record"); }
    finally { setSaving(false); }
  };
  const section = <T extends { id: string; code: string; name?: string; displayName?: string; abbreviation?: string; description?: string; icon?: string; isActive: boolean; isPlatformRole?: boolean }>(
    title: string, description: string, rows: T[], type: Exclude<Editor, null>, edit: (row: T) => void, view: ViewMode, setView: (view: ViewMode) => void,
  ) => (
    <div className="overflow-hidden rounded-xl border border-border bg-card xl:[&>.grid]:grid-cols-4 [&>.grid>article]:min-h-52 [&>.grid>article]:bg-card [&>.grid>article]:shadow-none [&>.grid>article]:transition-all [&>.grid>article]:duration-200 [&>.grid>article]:hover:-translate-y-0.5 [&>.grid>article]:hover:shadow-md [&>.grid>article>div:last-child]:-mx-4 [&>.grid>article>div:last-child]:-mb-4 [&>.grid>article>div:last-child]:border-t [&>.grid>article>div:last-child]:border-border [&>.grid>article>div:last-child]:bg-muted/40 [&>.grid>article>div:last-child]:px-4 [&>.grid>article>div:last-child]:py-1.5 [&>.grid>article>div:last-child_button.w-8]:h-7 [&>.grid>article>div:last-child_button.w-8]:w-7">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-display text-sm font-semibold">{title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
        <div className="flex items-center gap-2"><ViewSwitch value={view} onChange={setView}/>{!(type === "organization" && organizations.length > 0) && <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => openNew(type)}><Plus className="h-3.5 w-3.5"/>{type === "module" ? "Add Sub System" : type === "role" ? "Add Role" : `Add ${type}`}</Button>}</div>
      </div>
      {view === "table" ? <div className="overflow-x-auto">
      <Table className="min-w-[760px]">
        <TableHeader><TableRow>
          <TableHead className={type === "module" ? "w-[38%] min-w-[280px] text-[11px] font-display font-semibold uppercase" : "text-[11px] font-display font-semibold uppercase"}>{type === "module" ? "Sub system" : "Name"}</TableHead>
          {type !== "role" && type !== "module" && <TableHead className="text-[11px] font-display font-semibold uppercase">Code</TableHead>}
          <TableHead className={type === "module" ? "w-full min-w-[360px] text-[11px] font-display font-semibold uppercase" : "text-[11px] font-display font-semibold uppercase"}>Description</TableHead>
          <TableHead className="w-px whitespace-nowrap text-[11px] font-display font-semibold uppercase">Status</TableHead>
          <TableHead className="w-px whitespace-nowrap text-right text-[11px] font-display font-semibold uppercase">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {(type === "role" ? rows.slice((rolePage - 1) * 10, rolePage * 10) : type === "module" ? rows.slice((subsystemPage - 1) * 10, subsystemPage * 10) : rows).map(row => {
            const name = row.displayName ?? row.name ?? row.code;
            const protectedRole = type === "role" && (row.code === "ADMINISTRATOR" || row.name === "Administrator");
            const protectedSecurityModule = type === "module" && isSecurityAdminModule(row);
            const hasOperationEditor = type === "module" && !isSystemResourceModule(row) && !protectedSecurityModule;
            const canDelete = !protectedRole && type !== "module";
            const startsTenantRoles = type === "role" && !row.isPlatformRole && row.id === rows.find(candidate => !candidate.isPlatformRole)?.id;
            return <Fragment key={row.id}>{startsTenantRoles && <TableRow className="border-t-2 border-primary/20 bg-muted/30"><TableCell colSpan={4} className="py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tenant roles</TableCell></TableRow>}<TableRow>
              <TableCell className={type === "module" ? "font-body text-sm" : "font-display text-sm font-semibold"}>
                <span className="flex items-center gap-3">
                  {type === "module" && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/10 text-primary">
                      <LucideIconPreview name={row.icon || "boxes"} className="h-[18px] w-[18px]"/>
                    </span>
                  )}
                  <span className="min-w-0">
                    {type === "module" && <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-primary">{row.abbreviation || "N/A"}</span>}
                    <span className={`block leading-5 ${type === "module" ? "font-normal text-muted-foreground" : "text-foreground"}`}>{name}</span>
                  </span>
                  {type === "role" && row.isPlatformRole && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} aria-label="Platform role" className="inline-flex cursor-help">
                          <Badge className="h-5 w-5 justify-center p-0">
                            <ShieldCheck className="h-3 w-3" />
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs font-normal">Platform role</TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </TableCell>
              {type !== "role" && type !== "module" && <TableCell><span className="rounded bg-muted px-2 py-1 font-mono text-xs">{row.code}</span></TableCell>}
              <TableCell className={type === "module" ? "whitespace-normal font-body text-sm leading-5 text-muted-foreground" : "max-w-md truncate text-sm text-muted-foreground"}>{row.description || "—"}</TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0} aria-label={row.isActive ? "Active" : "Inactive"} className="inline-flex cursor-help">
                      <Badge
                        variant="outline"
                        className={`h-6 w-6 justify-center p-0 ${
                          row.isActive
                            ? "border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "border-red-200 bg-red-100 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {row.isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      </Badge>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs font-normal">{row.isActive ? "Active" : "Inactive"}</TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell><div className="flex justify-end gap-1.5">
                {hasOperationEditor && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground" aria-label={`Edit ${name} operations`} onClick={() => navigate(`/platform-admin/subsystems/${row.id}/operations`)}><ListChecks className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Manage operations</TooltipContent></Tooltip>}
                {!protectedRole && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-md border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground" aria-label={`Edit ${name}`} onClick={() => edit(row)}><Pencil className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent>Edit {type === "module" ? "sub system" : type}</TooltipContent></Tooltip>}
                {canDelete && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Delete ${name}`} onClick={() => setDeleteTarget({ type, id: row.id, name })}><Trash2 className="h-3.5 w-3.5"/></Button></TooltipTrigger><TooltipContent>Delete {type}</TooltipContent></Tooltip>}
              </div></TableCell>
            </TableRow></Fragment>;
          })}
          {rows.length === 0 && <TableRow><TableCell colSpan={type === "role" || type === "module" ? 4 : 5} className="py-12 text-center text-sm text-muted-foreground">No records configured.</TableCell></TableRow>}
        </TableBody>
      </Table>
      </div> : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {(type === "role" ? rows.slice((rolePage - 1) * 10, rolePage * 10) : type === "module" ? rows.slice((subsystemPage - 1) * 10, subsystemPage * 10) : rows).map(row => {
          const name = row.displayName ?? row.name ?? row.code;
          const protectedRole = type === "role" && (row.code === "ADMINISTRATOR" || row.name === "Administrator");
          const protectedSecurityModule = type === "module" && isSecurityAdminModule(row);
          const hasOperationEditor = type === "module" && !isSystemResourceModule(row) && !protectedSecurityModule;
          const canDelete = !protectedRole && type !== "module";
          const startsTenantRoles = type === "role" && !row.isPlatformRole && row.id === rows.find(candidate => !candidate.isPlatformRole)?.id;
          return <Fragment key={row.id}>{startsTenantRoles && <div className="col-span-full flex items-center gap-3 pt-1"><span className="h-px flex-1 bg-border"/><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tenant roles</span><span className="h-px flex-1 bg-border"/></div>}<article className="flex min-h-44 flex-col rounded-xl border bg-background p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{type === "module" && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><LucideIconPreview name={row.icon || "boxes"} className="h-5 w-5"/></span>}<div className="min-w-0">{type === "module" && <p className="text-xs font-bold uppercase tracking-wide text-primary">{row.abbreviation || "N/A"}</p>}<h4 className="truncate font-display text-sm font-semibold">{name}</h4>{type === "role" && <p className="mt-1 font-mono text-[11px] text-muted-foreground">{row.code}</p>}</div></div><Badge variant="outline" className={row.isActive ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-red-200 bg-red-100 text-red-700"}>{row.isActive ? "Active" : "Inactive"}</Badge></div>
            <p className="mt-3 line-clamp-3 text-sm leading-5 text-muted-foreground">{row.description || "No description provided."}</p>
            <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
              <span>{type === "role" && row.isPlatformRole && <Badge className="gap-1"><ShieldCheck className="h-3 w-3"/>Platform role</Badge>}</span>
              {!protectedRole && <div className="flex items-center gap-1">{hasOperationEditor && <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate(`/platform-admin/subsystems/${row.id}/operations`)}><ListChecks className="h-3.5 w-3.5"/>Operations</Button>}<Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${name}`} onClick={() => edit(row)}><Pencil className="h-3.5 w-3.5"/></Button>{canDelete && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Delete ${name}`} onClick={() => setDeleteTarget({type,id:row.id,name})}><Trash2 className="h-3.5 w-3.5"/></Button>}</div>}
            </div>
          </article></Fragment>;
        })}
        {!rows.length && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">No records configured.</div>}
      </div>}
      {type === "role" && rows.length > 0 && <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5"><p className="text-xs text-muted-foreground">Showing {(rolePage-1)*10+1}–{Math.min(rolePage*10,rows.length)} of {rows.length} records</p>{Math.ceil(rows.length/10)>1&&<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous page" disabled={rolePage===1} onClick={()=>setRolePage(page=>Math.max(1,page-1))}><ChevronLeft className="h-4 w-4"/></Button><span className="min-w-20 text-center text-xs text-muted-foreground">Page {rolePage} of {Math.ceil(rows.length/10)}</span><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Next page" disabled={rolePage===Math.ceil(rows.length/10)} onClick={()=>setRolePage(page=>Math.min(Math.ceil(rows.length/10),page+1))}><ChevronRight className="h-4 w-4"/></Button></div>}</div>}
      {type === "module" && rows.length > 0 && <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5"><p className="text-xs text-muted-foreground">Showing {(subsystemPage-1)*10+1}–{Math.min(subsystemPage*10,rows.length)} of {rows.length} records</p>{Math.ceil(rows.length/10)>1&&<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous page" disabled={subsystemPage===1} onClick={()=>setSubsystemPage(page=>Math.max(1,page-1))}><ChevronLeft className="h-4 w-4"/></Button><span className="min-w-20 text-center text-xs text-muted-foreground">Page {subsystemPage} of {Math.ceil(rows.length/10)}</span><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Next page" disabled={subsystemPage===Math.ceil(rows.length/10)} onClick={()=>setSubsystemPage(page=>Math.min(Math.ceil(rows.length/10),page+1))}><ChevronRight className="h-4 w-4"/></Button></div>}</div>}
    </div>
  );
  const tenantSection = (
    <div className="overflow-hidden rounded-xl border border-border bg-card xl:[&>.grid]:grid-cols-4 [&>.grid>article]:min-h-52 [&>.grid>article]:bg-card [&>.grid>article]:shadow-none [&>.grid>article]:transition-all [&>.grid>article]:duration-200 [&>.grid>article]:hover:-translate-y-0.5 [&>.grid>article]:hover:shadow-md [&>.grid>article>div:nth-last-child(2)]:-mx-4 [&>.grid>article>div:nth-last-child(2)]:px-4 [&>.grid>article>div:nth-last-child(2)]:pb-2 [&>.grid>article>div:last-child]:-mx-4 [&>.grid>article>div:last-child]:-mb-4 [&>.grid>article>div:last-child]:border-t [&>.grid>article>div:last-child]:border-border [&>.grid>article>div:last-child]:bg-muted/40 [&>.grid>article>div:last-child]:px-4 [&>.grid>article>div:last-child]:py-1.5 [&>.grid>article>div:last-child_button.w-8]:h-7 [&>.grid>article>div:last-child_button.w-8]:w-7">
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-display text-sm font-semibold">Tenants</h3><p className="mt-0.5 text-xs text-muted-foreground">Business units under {organizations[0]?.displayName ?? "an organization"}, with tenant-specific sub systems access.</p></div><div className="flex items-center gap-2"><ViewSwitch value={tenantView} onChange={setTenantView}/><Button size="sm" className="h-8 gap-1.5 text-xs" onClick={()=>openNew("tenant")}><Plus className="h-3.5 w-3.5"/>Add Tenant</Button></div></div>
      {tenantView === "table" ? <><div className="overflow-x-auto">
      <Table className="min-w-[820px]"><TableHeader><TableRow><TableHead className="text-[11px] font-display font-semibold uppercase">Tenant</TableHead><TableHead className="text-[11px] font-display font-semibold uppercase">Tenant Type</TableHead><TableHead className="min-w-[320px] text-[11px] font-display font-semibold uppercase">Sub Systems</TableHead><TableHead className="text-[11px] font-display font-semibold uppercase">Status</TableHead><TableHead className="text-right text-[11px] font-display font-semibold uppercase">Actions</TableHead></TableRow></TableHeader>
        <TableBody>{tenants.map(row=>{const assignedModules=modules.filter(module=>row.moduleIds.includes(module.id));const canDelete=assignedModules.every(isRequiredTenantModule);return <TableRow key={row.id}><TableCell className="font-display text-sm font-semibold">{row.name}</TableCell><TableCell><span className="rounded bg-muted px-2 py-1 font-mono text-xs">{row.tenantTypeName??"Not specified"}</span></TableCell><TableCell><div className="flex max-w-xl flex-wrap items-center gap-1.5">{assignedModules.map(module=><SubsystemBadge key={module.id} module={module}/>)}{!assignedModules.length&&<span className="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground"><LayoutGrid className="h-3.5 w-3.5"/>No modules assigned</span>}</div></TableCell><TableCell><Tooltip><TooltipTrigger asChild><span tabIndex={0} aria-label={row.isActive?"Active":"Inactive"} className="inline-flex cursor-help"><Badge variant="outline" className={`h-6 w-6 justify-center p-0 ${row.isActive?"border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300":"border-red-200 bg-red-100 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"}`}>{row.isActive?<CheckCircle2 className="h-3.5 w-3.5"/>:<XCircle className="h-3.5 w-3.5"/>}</Badge></span></TooltipTrigger><TooltipContent side="top" className="text-xs font-normal">{row.isActive?"Active":"Inactive"}</TooltipContent></Tooltip></TableCell><TableCell><div className="flex justify-end gap-1"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${row.name}`} onClick={()=>editTenant(row)}><Pencil className="h-3.5 w-3.5"/></Button></TooltipTrigger><TooltipContent>Edit tenant</TooltipContent></Tooltip>{canDelete?<Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Delete ${row.name}`} onClick={()=>setDeleteTarget({type:"tenant",id:row.id,name:row.name})}><Trash2 className="h-3.5 w-3.5"/></Button></TooltipTrigger><TooltipContent>Delete tenant</TooltipContent></Tooltip>:<Tooltip><TooltipTrigger asChild><span tabIndex={0}><Button disabled variant="ghost" size="icon" className="h-7 w-7" aria-label={`Delete ${row.name}`}><Trash2 className="h-3.5 w-3.5"/></Button></span></TooltipTrigger><TooltipContent>Remove all optional subsystem assignments before deleting this tenant.</TooltipContent></Tooltip>}</div></TableCell></TableRow>;})}{!tenants.length&&<TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No tenants configured.</TableCell></TableRow>}</TableBody>
      </Table></div>
      </> : <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">{tenants.map(row=>{const assignedModules=modules.filter(module=>row.moduleIds.includes(module.id));const canDelete=assignedModules.every(isRequiredTenantModule);return <article key={row.id} className="flex min-h-52 flex-col rounded-xl border bg-background p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h4 className="truncate font-display text-base font-semibold">{row.name}</h4><p className="mt-1 font-mono text-[11px] text-muted-foreground">{row.identifier}</p></div><Badge variant="outline" className={row.isActive?"border-emerald-200 bg-emerald-100 text-emerald-700":"border-red-200 bg-red-100 text-red-700"}>{row.isActive?"Active":"Inactive"}</Badge></div><div className="mt-4 flex-1 border-b pb-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sub Systems</p><div className="flex flex-wrap gap-1.5">{assignedModules.map(module=><SubsystemBadge key={module.id} module={module}/>)}{!assignedModules.length&&<span className="text-xs text-muted-foreground">No sub systems assigned</span>}</div></div><div className="flex justify-end gap-1 pt-3"><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${row.name}`} onClick={()=>editTenant(row)}><Pencil className="h-3.5 w-3.5"/></Button><Button disabled={!canDelete} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Delete ${row.name}`} onClick={()=>canDelete&&setDeleteTarget({type:"tenant",id:row.id,name:row.name})}><Trash2 className="h-3.5 w-3.5"/></Button></div></article>;})}{!tenants.length&&<div className="col-span-full py-10 text-center text-sm text-muted-foreground">No tenants configured.</div>}</div>}
    </div>
  );
  const organizationSection = !loadedTabs.has("organizations")
    ? null
    : organizations[0]
    ? <PlatformOrganizationSummary organization={organizations[0]} onEdit={() => editOrganization(organizations[0])}/>
    : <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <Building2 className="mx-auto h-9 w-9 text-muted-foreground"/>
        <h3 className="mt-3 font-display text-base font-semibold">Set up your organization</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Create the legal and customer account profile for this installation.</p>
        <Button className="mt-4 gap-1.5" onClick={() => openNew("organization")}><Plus className="h-4 w-4"/>Set up organization</Button>
      </div>;

  return <div className="min-h-screen bg-background">
    <Tabs value={activeTab} onValueChange={value => navigate(platformTabPaths[value as PlatformTab])} className="flex min-h-screen w-full [&_table_th]:h-8 [&_table_th]:px-3 [&_table_th]:text-[10px] [&_table_td]:px-3 [&_table_td]:py-1.5 [&_table_tbody_button]:h-7 [&_table_tbody_button]:px-2 [&_table_tbody_.font-mono]:px-1.5 [&_table_tbody_.font-mono]:py-0.5 [&_table_tbody_.font-mono]:text-[11px]">
        <aside className={`sticky top-0 hidden h-screen shrink-0 select-none flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out md:flex ${sidebarCollapsed ? "w-[60px]" : "w-[300px]"}`}>
          <div className={`flex h-12 shrink-0 items-center border-b border-sidebar-border ${sidebarCollapsed ? "px-1" : "px-3"}`}>
            <Link to="/" className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:opacity-80">
              <span className={`flex shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm ${sidebarCollapsed ? "h-6 w-6" : "h-8 w-8"}`}><Building2 className="h-4 w-4 text-primary-foreground"/></span>
              {!sidebarCollapsed && <span className="whitespace-nowrap font-display text-[15px] font-bold">Cyber<span className="text-primary">ERP</span></span>}
            </Link>
            <button type="button" onClick={() => setSidebarCollapsed(value => !value)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><ChevronRight className={`h-3.5 w-3.5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}/></button>
          </div>
          <div className={`mt-3 border-primary bg-sidebar-accent/60 py-3 ${sidebarCollapsed ? "mx-2 flex justify-center rounded-lg px-2" : "border-l-4 px-5"}`}>
            <div className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 shrink-0 text-primary"/>{!sidebarCollapsed && <span className="font-display text-sm font-bold uppercase leading-tight tracking-wide text-foreground">Platform</span>}</div>
            {!sidebarCollapsed && <div className="mt-1 text-xs font-normal leading-tight text-muted-foreground">Administration control plane</div>}
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            <button
              type="button"
              onClick={() => navigate("/subsystems")}
              title={sidebarCollapsed ? "Tenant Sub Systems" : undefined}
              className={`mb-3 flex w-full items-center rounded-lg px-3 py-2 text-left text-[13px] font-medium text-sidebar-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-foreground ${sidebarCollapsed ? "justify-center" : "gap-2.5"}`}
            >
              <LayoutGrid className="h-4 w-4 shrink-0 text-primary"/>
              {!sidebarCollapsed && <span>Tenant Sub Systems</span>}
            </button>
            <div className="mb-2 border-t border-sidebar-border"/>
            {!sidebarCollapsed && <p className="mb-1 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Setup</p>}
            <TabsList aria-label="Platform administration sections" className="flex h-auto w-full flex-col items-stretch gap-0.5 rounded-none bg-transparent p-0">
            <PlatformMenuTrigger value="organizations" icon={Building2} label="Organization" collapsed={sidebarCollapsed} />
            <PlatformMenuTrigger value="tenants" icon={Contact} label="Tenants" collapsed={sidebarCollapsed} />
            <PlatformMenuTrigger value="subsystems" icon={LayoutGrid} label="Sub Systems" collapsed={sidebarCollapsed} />
            <PlatformMenuTrigger value="roles" icon={ShieldCheck} label="Standard Roles" collapsed={sidebarCollapsed} />
            <PlatformMenuTrigger value="settings" icon={Settings2} label="System Settings" collapsed={sidebarCollapsed} />
            <PlatformMenuTrigger value="users" icon={Contact} label="Users" collapsed={sidebarCollapsed} />
          </TabsList>
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="fixed left-3 top-2 z-50 md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 bg-card shadow-sm" aria-label="Open platform administration menu">
                  <Menu className="h-4 w-4"/>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-[min(300px,85vw)] flex-col bg-sidebar p-0">
                <SheetHeader className="border-b border-sidebar-border px-4 py-3 text-left">
                  <SheetTitle className="flex items-center gap-2.5 font-display text-[15px]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm"><Building2 className="h-4 w-4 text-primary-foreground"/></span>
                    Cyber<span className="-ml-2.5 text-primary">ERP</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mx-3 mt-3 border-l-4 border-primary bg-sidebar-accent/60 px-4 py-3">
                  <div className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-primary"/><span className="font-display text-sm font-bold uppercase tracking-wide">Platform</span></div>
                  <div className="mt-1 text-xs text-muted-foreground">Administration control plane</div>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-3">
                  <button type="button" onClick={() => { setMobileMenuOpen(false); navigate("/subsystems"); }} className="mb-3 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent">
                    <LayoutGrid className="h-4 w-4 text-primary"/><span>Tenant Sub Systems</span>
                  </button>
                  <div className="mb-2 border-t border-sidebar-border"/>
                  <p className="mb-1 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Setup</p>
                  <TabsList aria-label="Platform administration sections" className="flex h-auto w-full flex-col items-stretch gap-0.5 rounded-none bg-transparent p-0">
                    <PlatformMenuTrigger value="organizations" icon={Building2} label="Organization" collapsed={false} onSelect={() => setMobileMenuOpen(false)}/>
                    <PlatformMenuTrigger value="tenants" icon={Contact} label="Tenants" collapsed={false} onSelect={() => setMobileMenuOpen(false)}/>
                    <PlatformMenuTrigger value="subsystems" icon={LayoutGrid} label="Sub Systems" collapsed={false} onSelect={() => setMobileMenuOpen(false)}/>
                    <PlatformMenuTrigger value="roles" icon={ShieldCheck} label="Standard Roles" collapsed={false} onSelect={() => setMobileMenuOpen(false)}/>
                    <PlatformMenuTrigger value="settings" icon={Settings2} label="System Settings" collapsed={false} onSelect={() => setMobileMenuOpen(false)}/>
                    <PlatformMenuTrigger value="users" icon={Contact} label="Users" collapsed={false} onSelect={() => setMobileMenuOpen(false)}/>
                  </TabsList>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <AppHeader/>
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mb-6"><h1 className="font-display text-2xl font-bold tracking-tight">Platform Administration</h1><p className="text-sm text-muted-foreground">Maintain organizations, tenants, sub systems, and standard security templates.</p></div>
            <TabsContent value="organizations" className="m-0">{organizationSection}</TabsContent>
            <TabsContent value="tenants" className="m-0">{tenantSection}</TabsContent>
            <TabsContent value="subsystems" className="m-0">{section("Sub Systems", "Platform-wide sub systems available for tenant entitlements.", modules, "module", editModule, subsystemView, setSubsystemView)}</TabsContent>
            <TabsContent value="roles" className="m-0">{section("Standard Role Templates", "Platform roles are listed first, followed by reusable tenant role templates.", orderedTemplates, "role", editRole, roleView, setRoleView)}</TabsContent>
            <TabsContent value="settings" className="m-0"><PlatformSystemSettings/></TabsContent>
            <TabsContent value="users" className="m-0"><PlatformUsers/></TabsContent>
          </main>
          <AppFooter/>
        </div>
    </Tabs>
    <Dialog open={editor !== null} onOpenChange={open => { if (!open) { setEditor(null); setUnassignNames(undefined); } }}><DialogContent className={editor === "organization" ? "h-[575px] max-h-[90vh] w-[94vw] max-w-5xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden p-0 gap-0" : editor === "tenant" ? "max-h-[90vh] w-[94vw] max-w-4xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden gap-3" : "max-h-[90vh] max-w-2xl overflow-y-auto"}><DialogHeader className={editor === "organization" ? "border-b px-6 pb-4 pt-6" : undefined}><DialogTitle className="font-display">{editingId ? "Maintain" : "Add"} {editor === "module" ? "sub system" : editor}</DialogTitle><DialogDescription>Changes are persisted to the platform control-plane database.</DialogDescription></DialogHeader>
      {editor === "organization" && <Tabs value={orgEditorTab} onValueChange={setOrgEditorTab} className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="border-b bg-muted/20 p-4 md:border-b-0 md:border-r">
            <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Organization setup</p>
            <TabsList className="flex h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0">
              <TabsTrigger value="identity" className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-left data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Building2 className="h-4 w-4 shrink-0"/>
                <span><span className="block text-sm font-medium">General</span><span className="block text-[11px] font-normal text-muted-foreground">Identity and business profile</span></span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-left data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Contact className="h-4 w-4 shrink-0"/>
                <span><span className="block text-sm font-medium">Contact</span><span className="block text-[11px] font-normal text-muted-foreground">Channels and primary contact</span></span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-left data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MapPin className="h-4 w-4 shrink-0"/>
                <span><span className="block text-sm font-medium">Addresses</span><span className="block text-[11px] font-normal text-muted-foreground">Physical and postal location</span></span>
              </TabsTrigger>
              <TabsTrigger value="regional" className="h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-left data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Globe2 className="h-4 w-4 shrink-0"/>
                <span><span className="block text-sm font-medium">Regional &amp; fiscal</span><span className="block text-[11px] font-normal text-muted-foreground">Locale, currency, and periods</span></span>
              </TabsTrigger>
            </TabsList>
          </aside>
          <div className="min-h-0 overflow-y-auto bg-background px-5 py-5 lg:px-6">
        <TabsContent value="identity" className="m-0">
        <FormSection icon={Building2} title="General information" description="Logo, legal identity, and public business profile." columns={3}>
          <div className="sm:col-span-2 lg:order-2 lg:col-span-1">
            <Field label="Organization logo">
              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-4 text-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">
                  {(orgLogoPreview || orgForm.logoUrl) ? <img src={orgLogoPreview || orgForm.logoUrl || ""} alt="Organization logo preview" className="h-full w-full object-contain p-2"/> : <ImagePlus className="h-8 w-8 text-muted-foreground"/>}
                </div>
                <div className="mt-3 min-w-0">
                  <p className="text-xs text-muted-foreground">PNG, JPG, or WebP · maximum 2 MB</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => document.getElementById("organization-logo-upload")?.click()}><Upload className="h-3.5 w-3.5"/>{orgLogoPreview || orgForm.logoUrl ? "Replace" : "Choose logo"}</Button>
                    {(orgLogoPreview || orgForm.logoUrl) && <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={() => { setOrgLogoFile(undefined); setOrgLogoPreview(undefined); setOrgLogoRemoved(true); setOrgForm({...orgForm,logoUrl:null}); }}><X className="h-3.5 w-3.5"/>Remove</Button>}
                    <input id="organization-logo-upload" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { selectOrganizationLogo(e.target.files?.[0]); e.target.value = ""; }}/>
                  </div>
                </div>
              </div>
            </Field>
          </div>
          <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:order-1">
          <Field label="Code"><Input required value={orgForm.code} onChange={e=>setOrgForm({...orgForm,code:e.target.value})}/></Field>
          <Field label="Display name"><Input required value={orgForm.displayName} onChange={e=>setOrgForm({...orgForm,displayName:e.target.value})}/></Field>
          <Field label="Legal name"><Input required value={orgForm.legalName} onChange={e=>setOrgForm({...orgForm,legalName:e.target.value})}/></Field>
          <Field label="Registration number"><Input value={orgForm.registrationNumber ?? ""} onChange={e=>setOrgForm({...orgForm,registrationNumber:e.target.value})}/></Field>
          <Field label="Tax / VAT number"><Input value={orgForm.taxNumber ?? ""} onChange={e=>setOrgForm({...orgForm,taxNumber:e.target.value})}/></Field>
          <Field label="TIN number"><Input maxLength={50} value={orgForm.tinNumber ?? ""} onChange={e=>setOrgForm({...orgForm,tinNumber:e.target.value})}/></Field>
          <Field label="Organization type"><Input placeholder="Company, NGO, government…" value={orgForm.organizationType ?? ""} onChange={e=>setOrgForm({...orgForm,organizationType:e.target.value})}/></Field>
          <Field label="Industry"><Input value={orgForm.industry ?? ""} onChange={e=>setOrgForm({...orgForm,industry:e.target.value})}/></Field>
          <Field label="Website"><Input type="url" placeholder="https://" value={orgForm.website ?? ""} onChange={e=>setOrgForm({...orgForm,website:e.target.value})}/></Field>
          </div>
        </FormSection>
        </TabsContent>
        <TabsContent value="contact" className="m-0">
        <FormSection icon={Contact} title="Contact details" description="General channels and the primary organization contact." columns={3}>
          <Field label="Organization email"><Input type="email" value={orgForm.email ?? ""} onChange={e=>setOrgForm({...orgForm,email:e.target.value})}/></Field>
          <Field label="Organization phone"><Input type="tel" value={orgForm.phone ?? ""} onChange={e=>setOrgForm({...orgForm,phone:e.target.value})}/></Field>
          <Field label="Primary contact name"><Input value={orgForm.primaryContactName ?? ""} onChange={e=>setOrgForm({...orgForm,primaryContactName:e.target.value})}/></Field>
          <Field label="Primary contact title"><Input value={orgForm.primaryContactTitle ?? ""} onChange={e=>setOrgForm({...orgForm,primaryContactTitle:e.target.value})}/></Field>
          <Field label="Primary contact email"><Input type="email" value={orgForm.primaryContactEmail ?? ""} onChange={e=>setOrgForm({...orgForm,primaryContactEmail:e.target.value})}/></Field>
          <Field label="Primary contact phone"><Input type="tel" value={orgForm.primaryContactPhone ?? ""} onChange={e=>setOrgForm({...orgForm,primaryContactPhone:e.target.value})}/></Field>
        </FormSection>
        </TabsContent>
        <TabsContent value="addresses" className="m-0">
        <FormSection icon={MapPin} title="Addresses" description="Physical, postal, and geographic information.">
          <Field label="Physical address"><Textarea rows={2} className="min-h-16 resize-none" value={orgForm.address ?? ""} onChange={e=>setOrgForm({...orgForm,address:e.target.value})}/></Field>
          <Field label="Postal address"><Textarea rows={2} className="min-h-16 resize-none" value={orgForm.postalAddress ?? ""} onChange={e=>setOrgForm({...orgForm,postalAddress:e.target.value})}/></Field>
          <Field label="Country"><Input value={orgForm.country ?? ""} onChange={e=>setOrgForm({...orgForm,country:e.target.value})}/></Field>
          <Field label="Region / state"><Input value={orgForm.region ?? ""} onChange={e=>setOrgForm({...orgForm,region:e.target.value})}/></Field>
          <Field label="City"><Input value={orgForm.city ?? ""} onChange={e=>setOrgForm({...orgForm,city:e.target.value})}/></Field>
          <Field label="Postal code"><Input value={orgForm.postalCode ?? ""} onChange={e=>setOrgForm({...orgForm,postalCode:e.target.value})}/></Field>
        </FormSection>
        </TabsContent>
        <TabsContent value="regional" className="m-0">
        <FormSection icon={Globe2} title="Regional and fiscal settings" description="Defaults used for localization, dates, and financial periods." columns={3}>
          <Field label="Currency"><Input maxLength={3} value={orgForm.currency} onChange={e=>setOrgForm({...orgForm,currency:e.target.value.toUpperCase()})}/></Field>
          <Field label="Timezone"><Input value={orgForm.timezone} onChange={e=>setOrgForm({...orgForm,timezone:e.target.value})}/></Field>
          <Field label="Locale"><Input value={orgForm.locale} onChange={e=>setOrgForm({...orgForm,locale:e.target.value})}/></Field>
          <Field label="Default language"><Input value={orgForm.defaultLanguage} onChange={e=>setOrgForm({...orgForm,defaultLanguage:e.target.value})}/></Field>
          <Field label="Date format"><Input value={orgForm.dateFormat} onChange={e=>setOrgForm({...orgForm,dateFormat:e.target.value})}/></Field>
          <Field label="Fiscal year start month"><Input type="number" min={1} max={12} value={orgForm.fiscalYearStartMonth} onChange={e=>setOrgForm({...orgForm,fiscalYearStartMonth:Number(e.target.value)})}/></Field>
          <Active checked={orgForm.isActive} onChange={v=>setOrgForm({...orgForm,isActive:v})}/>
        </FormSection>
        </TabsContent>
          </div>
        </div>
      </Tabs>}
      {editor === "tenant" && <div className="grid min-h-0 gap-3 overflow-y-auto px-1 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Organization name"><Input disabled={!!tenantForm.organizationId} placeholder="Enter the organization name" value={tenantForm.organizationName} onChange={e=>setTenantForm({...tenantForm,organizationName:e.target.value})}/></Field></div><Field label="Identifier"><Input value={tenantForm.identifier} onChange={e=>setTenantForm({...tenantForm,identifier:e.target.value})}/></Field><Field label="Tenant name"><Input value={tenantForm.name} onChange={e=>setTenantForm({...tenantForm,name:e.target.value})}/></Field><Field label="Tenant type"><Select value={tenantForm.tenantTypeId??"__none__"} onValueChange={value=>setTenantForm({...tenantForm,tenantTypeId:value==="__none__"?null:value})}><SelectTrigger><SelectValue placeholder="Select tenant type"/></SelectTrigger><SelectContent><SelectItem value="__none__">Not specified</SelectItem>{tenantTypes.map(type=><SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}</SelectContent></Select></Field>{!tenantTypes.length&&<p className="self-end pb-2 text-xs text-muted-foreground">No Tenant Type lookup items are configured.</p>}<div className="sm:col-span-2"><ChoiceGrid compact showIcons title="Sub Systems" rows={modules.filter(module=>module.isActive)} selected={tenantForm.moduleIds} disabledIds={requiredTenantModuleIds} onToggle={id=>setTenantForm({...tenantForm,moduleIds:toggle(tenantForm.moduleIds,id)})}/></div><Active checked={tenantForm.isActive} onChange={v=>setTenantForm({...tenantForm,isActive:v})}/></div>}
      {editor === "module" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Code"><Input value={moduleForm.code} onChange={e=>setModuleForm({...moduleForm,code:e.target.value})}/></Field><Field label="Name"><Input value={moduleForm.name} onChange={e=>setModuleForm({...moduleForm,name:e.target.value})}/></Field><Field label="Abbreviation"><Input maxLength={50} placeholder="e.g. SRMS" value={moduleForm.abbreviation} onChange={e=>setModuleForm({...moduleForm,abbreviation:e.target.value})}/></Field><Field label="Landing path"><Input value={isSystemResourceModule(moduleForm) && moduleForm.abbreviation.trim() ? moduleBasePath(moduleForm.abbreviation) : moduleForm.landingPath} onChange={e=>setModuleForm({...moduleForm,landingPath:e.target.value})} disabled={isSystemResourceModule(moduleForm)}/></Field><Field label="Icon"><button type="button" onClick={() => setModuleIconDialogOpen(true)} className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LucideIconPreview name={moduleForm.icon.trim().toLowerCase()} className="h-4 w-4 shrink-0"/><span className="min-w-0 flex-1 truncate">{moduleForm.icon || "Choose icon"}</span></button></Field><Field label="Display order"><Input type="number" value={moduleForm.displayOrder} onChange={e=>setModuleForm({...moduleForm,displayOrder:Number(e.target.value)})}/></Field><div className="sm:col-span-2"><Field label="Description"><Textarea value={moduleForm.description} onChange={e=>setModuleForm({...moduleForm,description:e.target.value})}/></Field></div><Active checked={moduleForm.isActive} onChange={v=>setModuleForm({...moduleForm,isActive:v})}/></div>}
      {editor === "plan" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Name"><Input value={planForm.name} onChange={e=>setPlanForm({...planForm,name:e.target.value})}/></Field><Field label="Billing cycle"><Input value={planForm.billingCycle} onChange={e=>setPlanForm({...planForm,billingCycle:e.target.value})}/></Field><Field label="Price"><Input type="number" value={planForm.price} onChange={e=>setPlanForm({...planForm,price:Number(e.target.value)})}/></Field><Field label="Maximum users"><Input type="number" value={planForm.maxUsers} onChange={e=>setPlanForm({...planForm,maxUsers:Number(e.target.value)})}/></Field><Field label="Storage (GB)"><Input type="number" value={planForm.maxStorageGB} onChange={e=>setPlanForm({...planForm,maxStorageGB:Number(e.target.value)})}/></Field><Field label="Trial days"><Input type="number" value={planForm.trialDays} onChange={e=>setPlanForm({...planForm,trialDays:Number(e.target.value)})}/></Field><div className="sm:col-span-2"><Field label="Description"><Textarea value={planForm.description} onChange={e=>setPlanForm({...planForm,description:e.target.value})}/></Field><ChoiceGrid title="Included modules" rows={modules} selected={planForm.moduleIds} onToggle={id=>setPlanForm({...planForm,moduleIds:toggle(planForm.moduleIds,id)})}/></div><Active checked={planForm.isActive} onChange={v=>setPlanForm({...planForm,isActive:v})}/></div>}
      {editor === "role" && <div className="grid gap-4 sm:grid-cols-2"><Field label="Code"><Input disabled={!!editingId} value={roleForm.code} onChange={e=>setRoleForm({...roleForm,code:e.target.value})}/></Field><Field label="Name"><Input value={roleForm.name} onChange={e=>setRoleForm({...roleForm,name:e.target.value})}/></Field><div className="sm:col-span-2"><Field label="Description"><Textarea value={roleForm.description} onChange={e=>setRoleForm({...roleForm,description:e.target.value})}/></Field></div><div className="flex items-center justify-between rounded-lg border p-3"><Label>Platform role</Label><Switch checked={roleForm.isPlatformRole} onCheckedChange={checked=>setRoleForm({...roleForm,isPlatformRole:checked})}/></div><div className="flex items-center justify-between rounded-lg border p-3"><Label>Active</Label><Switch checked={roleForm.isActive} onCheckedChange={checked=>setRoleForm({...roleForm,isActive:checked})}/></div></div>}
      <DialogFooter className={editor === "organization" ? "border-t bg-background px-6 py-4" : undefined}><Button variant="outline" onClick={()=>setEditor(null)}>Cancel</Button><Button disabled={saving} onClick={()=>void save()}>{saving ? "Saving…" : "Save changes"}</Button></DialogFooter>
      </DialogContent></Dialog>
    <Dialog open={moduleIconDialogOpen} onOpenChange={setModuleIconDialogOpen}>
      <DialogContent className="max-h-[80vh] w-[calc(100vw-2rem)] max-w-[520px] overflow-hidden p-5">
        <DialogHeader><DialogTitle className="text-lg">Choose an icon</DialogTitle><DialogDescription>Select an icon or type a custom Lucide icon name.</DialogDescription></DialogHeader>
        <div className="relative">
          <LucideIconPreview name={moduleForm.icon.trim().toLowerCase()} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"/>
          <Input value={moduleForm.icon} onChange={event => setModuleForm({...moduleForm, icon:event.target.value})} placeholder="Search or type an icon name" autoComplete="off" className="pl-10" autoFocus/>
        </div>
        <div className="max-h-[42vh] overflow-y-auto rounded-md border border-border p-2">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {filteredModuleIconNames.map(iconName => <button key={iconName} type="button" onClick={() => { setModuleForm({...moduleForm, icon:iconName}); setModuleIconDialogOpen(false); }} className="flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground"><LucideIconPreview name={iconName} className="h-4 w-4 shrink-0"/><span className="truncate">{iconName}</span></button>)}
          </div>
          {!filteredModuleIconNames.length && <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"><LucideIconPreview name={moduleForm.icon.trim().toLowerCase()} className="h-5 w-5"/><span>Custom icon: {moduleForm.icon || "none"}</span></div>}
        </div>
        <DialogFooter><Button onClick={() => setModuleIconDialogOpen(false)}>Use "{moduleForm.icon || "custom"}"</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open && !saving) setDeleteTarget(undefined); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Delete {deleteTarget?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the record. Records already used by another platform configuration are protected and cannot be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={saving}
            onClick={event => { event.preventDefault(); void remove(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {saving ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <AlertDialog open={!!unassignNames?.length} onOpenChange={open => { if (!open && !saving) setUnassignNames(undefined); }}>
      <AlertDialogContent className="z-[60]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">
            {unassignNames?.length === 1 ? `Remove ${unassignNames[0]} from this tenant?` : `Remove ${unassignNames?.length} sub systems from this tenant?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {(unassignNames?.length ?? 0) > 1 ? `${unassignNames?.join(", ")}. ` : ""}
            This tenant's modules, operations, and role permissions for {unassignNames?.length === 1 ? "that sub system" : "those sub systems"} will be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={saving}
            onClick={event => { event.preventDefault(); setUnassignNames(undefined); void save(true); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {saving ? "Saving…" : "Remove and save"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}

function OrganizationProfile({organization,onEdit}:{organization:OrganizationRecord;onEdit:()=>void}) {
  const value = (item: string | number | null | undefined) => item === null || item === undefined || String(item).trim() === "" ? "Not configured" : String(item);
  return <section className="overflow-hidden rounded-xl border border-border bg-card">
    <div className="flex flex-col gap-4 bg-gradient-to-r from-primary/[0.07] to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background text-primary">
          {organization.logoUrl ? <img src={organization.logoUrl} alt="" className="h-full w-full object-contain p-1.5"/> : <Building2 className="h-6 w-6"/>}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-lg font-bold">{organization.displayName}</h2><Badge variant={organization.isActive ? "default" : "secondary"}>{organization.isActive ? "Active" : "Inactive"}</Badge></div>
          <p className="truncate text-sm text-muted-foreground">{organization.legalName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-foreground">{organization.code}</span>
            <span>{value(organization.organizationType)}</span><span aria-hidden="true">·</span><span>{value(organization.industry)}</span>
            {organization.website && <a className="inline-flex items-center gap-1 text-primary hover:underline" href={organization.website} target="_blank" rel="noreferrer">Website<ExternalLink className="h-3 w-3"/></a>}
          </div>
        </div>
      </div>
      <Button size="sm" className="shrink-0 gap-1.5 self-start sm:self-auto" onClick={onEdit}><Pencil className="h-3.5 w-3.5"/>Edit organization</Button>
    </div>
    <div className="grid gap-px border-t bg-border sm:grid-cols-2 lg:grid-cols-4">
      <ProfileStat label="Registration / Tax" value={`${value(organization.registrationNumber)} · ${value(organization.taxNumber)}`}/>
      <ProfileStat label="Contact" value={value(organization.email || organization.phone)}/>
      <ProfileStat label="Location" value={[organization.city, organization.country].filter(Boolean).join(", ") || "Not configured"}/>
      <ProfileStat label="Regional defaults" value={`${value(organization.currency)} · ${value(organization.timezone)}`}/>
    </div>
  </section>;
}

function ProfileStat({label,value}:{label:string;value:string}) {
  return <div className="bg-card px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-medium" title={value}>{value}</p></div>;
}

function ViewSwitch({value,onChange}:{value:ViewMode;onChange:(value:ViewMode)=>void}) {
  return <div className="inline-flex h-8 items-center rounded-md bg-muted/30 p-0.5" role="group" aria-label="Choose layout">
    <Button type="button" variant={value === "table" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Table view" aria-pressed={value === "table"} onClick={()=>onChange("table")}><List className="h-3.5 w-3.5"/></Button>
    <Button type="button" variant={value === "cards" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Card view" aria-pressed={value === "cards"} onClick={()=>onChange("cards")}><LayoutGrid className="h-3.5 w-3.5"/></Button>
  </div>;
}

function PlatformMenuTrigger({value,icon:Icon,label,collapsed,onSelect}:{value:PlatformTab;icon:typeof Settings2;label:string;collapsed:boolean;onSelect?:()=>void}) {
  return <TabsTrigger
    value={value}
    onClick={onSelect}
    title={collapsed ? label : undefined}
    className={`group h-auto w-full rounded-lg px-3 py-2 text-left !text-xs font-normal text-sidebar-foreground shadow-none transition-all duration-150 hover:bg-sidebar-accent hover:text-foreground data-[state=active]:bg-muted/70 data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none ${collapsed ? "justify-center" : "justify-start gap-2.5"}`}
  >
    <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-data-[state=active]:text-primary"/>
    {!collapsed && <span>{label}</span>}
  </TabsTrigger>;
}

function FormSection({icon:Icon,title,description,children,columns=2}:{icon:typeof Settings2;title:string;description:string;children:React.ReactNode;columns?:2|3}) { return <section className="overflow-hidden rounded-xl border border-border bg-card"><div className="flex items-start gap-3 border-b border-border bg-muted/30 px-4 py-2.5"><span className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary"><Icon className="h-4 w-4"/></span><div><h3 className="font-display text-sm font-semibold text-foreground">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div></div><div className={`grid gap-3 p-3 [&_input]:h-9 sm:grid-cols-2 ${columns === 3 ? "lg:grid-cols-3" : ""}`}>{children}</div></section>; }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-1"><Label className="text-xs font-medium text-foreground">{label}</Label>{children}</div>; }
function Active({checked,onChange}:{checked:boolean;onChange:(value:boolean)=>void}) { return <div className="flex items-center justify-between rounded-lg border p-3"><Label>Active</Label><Switch checked={checked} onCheckedChange={onChange}/></div>; }
function SubsystemBadge({module}:{module:PlatformModuleRecord}) { return <Tooltip><TooltipTrigger asChild><span tabIndex={0} aria-label={module.name} className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.06] px-2.5 py-1 text-xs font-semibold uppercase text-foreground"><LucideIconPreview name={module.icon||"boxes"} className="h-3.5 w-3.5 text-primary"/>{module.abbreviation || "N/A"}</span></TooltipTrigger><TooltipContent side="top" className="text-xs font-normal">{module.name}</TooltipContent></Tooltip>; }
function ChoiceGrid({title,rows,selected,onToggle,disabledIds=[],compact=false,showIcons=false}:{title:string;rows:Array<{id:string;name:string;code:string;abbreviation?:string;icon?:string}>;selected:string[];onToggle:(id:string)=>void;disabledIds?:string[];compact?:boolean;showIcons?:boolean}) { const subsystemTitle = title.replace("modules", "subsystems"); return <div className={compact ? "space-y-1.5" : "mt-4 space-y-2"}><Label>{subsystemTitle}</Label><div className={`grid gap-1.5 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2 ${compact ? "max-h-44 lg:grid-cols-3" : "max-h-56"}`}>{rows.filter(row => !isSystemResourceModule(row)).map(row=>{const disabled=disabledIds.includes(row.id);return <label key={row.id} className={`flex items-center gap-2 rounded-md p-1.5 ${disabled?"cursor-not-allowed bg-muted/40 opacity-75":"cursor-pointer hover:bg-muted"}`}><input type="checkbox" checked={selected.includes(row.id)} disabled={disabled} onChange={()=>onToggle(row.id)}/>{showIcons&&<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><LucideIconPreview name={row.icon||"boxes"} className="h-4 w-4"/></span>}<span className="min-w-0"><span className="block truncate text-sm font-medium">{row.name}</span><span className="block truncate text-[11px] font-semibold uppercase text-muted-foreground">{row.abbreviation || "N/A"}{disabled?" · Required":""}</span></span></label>})}</div></div>; }
