import { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield, Check, Minus, Users, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { multiTenantService } from "@/services/api/multiTenantService";

// ========================
// Module → Document Types mapping
// ========================
const moduleDocumentTypes: Record<string, string[]> = {
  Finance: [
    "Journal Entry", "Invoice", "Credit Note", "Debit Note", "Payment Voucher",
    "Receipt Voucher", "Bank Reconciliation", "Budget", "Fixed Asset",
    "Financial Statement", "Tax Return", "Period Close",
  ],
  Inventory: [
    "Stock Item", "Stock Transfer", "Stock Adjustment", "Goods Receipt",
    "Delivery Note", "Cycle Count", "Inventory Valuation", "Kit/Bundle",
  ],
  HR: [
    "Employee Record", "Leave Request", "Attendance Record", "Payroll Run",
    "Expense Claim", "Recruitment Requisition", "Onboarding Checklist",
    "Performance Review", "Training Record", "Shift Schedule",
  ],
  Sales: [
    "Lead", "Quotation", "Sales Order", "Sales Invoice", "Sales Return",
    "Delivery Note", "Commission Record", "Credit Control",
  ],
  Procurement: [
    "Purchase Requisition", "RFQ", "Purchase Order", "Goods Receipt Note",
    "Supplier Record", "Contract", "3-Way Match", "Landed Cost",
  ],
  Production: [
    "Bill of Materials", "Work Order", "Production Schedule",
    "Shop Floor Log", "WIP Report", "Maintenance Ticket",
  ],
  Quality: [
    "Inspection Report", "NCR", "CAPA", "Audit Report",
    "Calibration Record", "Controlled Document", "SPC Chart",
  ],
  Workflow: [
    "Workflow Profile", "Approval Chain", "Automation Rule", "Task",
  ],
  Reports: [
    "Standard Report", "Custom Report", "Dashboard",
  ],
};

const permissionTypes = ["View", "Create", "Edit", "Delete", "Approve", "Export"] as const;
type PermKey = `${string}::${string}`; // "Module::DocType"

interface RoleDef {
  id: string;
  name: string;
  description: string;
  isPlatformRole: boolean;
  userCount: number;
  permissions: Record<PermKey, Set<string>>; // "Finance::Invoice" → Set<"View","Create"...>
}

// Helper to build permissions
const buildPerms = (
  config: Record<string, { docTypes?: string[]; perms: readonly string[] }>
): Record<PermKey, Set<string>> => {
  const result: Record<PermKey, Set<string>> = {};
  // Initialize all empty
  Object.entries(moduleDocumentTypes).forEach(([mod, dts]) => {
    dts.forEach(dt => { result[`${mod}::${dt}` as PermKey] = new Set(); });
  });
  // Apply config
  Object.entries(config).forEach(([mod, cfg]) => {
    const dts = cfg.docTypes || moduleDocumentTypes[mod] || [];
    dts.forEach(dt => {
      const key = `${mod}::${dt}` as PermKey;
      result[key] = new Set(cfg.perms);
    });
  });
  return result;
};

const allPerms = permissionTypes as unknown as string[];

const legacyRoleExamples: RoleDef[] = [
  {
    id: "1", name: "System Admin", description: "Full access to all document types", isPlatformRole: true, userCount: 3,
    permissions: buildPerms(
      Object.fromEntries(Object.keys(moduleDocumentTypes).map(m => [m, { perms: allPerms }]))
    ),
  },
  {
    id: "2", name: "Manager", description: "Read/Write/Approve on Finance, Sales, HR documents", isPlatformRole: false, userCount: 12,
    permissions: buildPerms({
      Finance: { perms: ["View", "Create", "Edit", "Approve"] },
      Sales: { perms: ["View", "Create", "Edit", "Approve"] },
      HR: { perms: ["View", "Create", "Edit"] },
      Inventory: { perms: ["View"] },
      Procurement: { perms: ["View", "Approve"] },
      Production: { perms: ["View"] },
      Quality: { perms: ["View"] },
      Reports: { perms: ["View", "Export"] },
      Workflow: { perms: ["View", "Approve"] },
    }),
  },
  {
    id: "3", name: "Analyst", description: "Read-only on Reports and Finance", isPlatformRole: false, userCount: 28,
    permissions: buildPerms({
      Finance: { perms: ["View"] },
      Reports: { perms: ["View", "Export"] },
    }),
  },
  {
    id: "4", name: "HR Admin", description: "Full HR document access", isPlatformRole: false, userCount: 5,
    permissions: buildPerms({
      HR: { perms: allPerms },
      Finance: { docTypes: ["Payment Voucher", "Receipt Voucher"], perms: ["View"] },
      Reports: { perms: ["View", "Export"] },
      Workflow: { perms: ["View", "Approve"] },
    }),
  },
  {
    id: "5", name: "Production Lead", description: "Production and Quality documents", isPlatformRole: false, userCount: 8,
    permissions: buildPerms({
      Production: { perms: ["View", "Create", "Edit", "Approve"] },
      Quality: { perms: ["View", "Create", "Edit"] },
      Inventory: { docTypes: ["Stock Item", "Goods Receipt"], perms: ["View"] },
      Procurement: { docTypes: ["Purchase Order", "Goods Receipt Note"], perms: ["View"] },
      Reports: { perms: ["View"] },
      Workflow: { perms: ["View"] },
    }),
  },
  {
    id: "6", name: "Sales Rep", description: "Limited Sales documents", isPlatformRole: false, userCount: 35,
    permissions: buildPerms({
      Sales: { docTypes: ["Lead", "Quotation", "Sales Order"], perms: ["View", "Create", "Edit"] },
      Sales2: { docTypes: undefined, perms: [] }, // won't match — just to keep other sales docs empty
      Inventory: { docTypes: ["Stock Item"], perms: ["View"] },
      Reports: { docTypes: ["Standard Report"], perms: ["View"] },
    }),
  },
  {
    id: "7", name: "Procurement Officer", description: "Full procure-to-pay cycle", isPlatformRole: false, userCount: 6,
    permissions: buildPerms({
      Procurement: { perms: ["View", "Create", "Edit", "Approve"] },
      Inventory: { docTypes: ["Stock Item", "Goods Receipt", "Stock Adjustment"], perms: ["View", "Create"] },
      Finance: { docTypes: ["Invoice", "Payment Voucher"], perms: ["View"] },
      Reports: { perms: ["View", "Export"] },
      Workflow: { perms: ["View", "Approve"] },
    }),
  },
  {
    id: "8", name: "Auditor", description: "Read-only + Export across all modules", isPlatformRole: false, userCount: 4,
    permissions: buildPerms(
      Object.fromEntries(Object.keys(moduleDocumentTypes).map(m => [m, { perms: ["View", "Export"] }]))
    ),
  },
];

const RolesPermissions = () => {
  type TenantRole = Awaited<ReturnType<typeof multiTenantService.tenantRoles>>[number];
  type StandardRole = Awaited<ReturnType<typeof multiTenantService.tenantStandardRoles>>[number];
  type TenantOperation = Awaited<ReturnType<typeof multiTenantService.tenantOperations>>[number];
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [rolePage, setRolePage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleDef | null>(null);
  const [form, setForm] = useState({ roleId: "", selectedRoleId: "", code: "", name: "", description: "" });
  const [editPerms, setEditPerms] = useState<Record<PermKey, Set<string>>>({});
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [dialogExpandedModules, setDialogExpandedModules] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([]);
  const [standardRoles, setStandardRoles] = useState<StandardRole[]>([]);
  const [tenantOperations, setTenantOperations] = useState<TenantOperation[]>([]);
  const [tenantModules, setTenantModules] = useState<Awaited<ReturnType<typeof multiTenantService.entitlements>>>([]);

  useEffect(() => {
    Promise.all([multiTenantService.tenantRoles(), multiTenantService.tenantStandardRoles(), multiTenantService.tenantOperations(), multiTenantService.entitlements()])
      .then(([tenantRoleRows, standardRoleRows, operationRows, moduleRows]) => {
        setTenantRoles(tenantRoleRows);
        setStandardRoles(standardRoleRows);
        const activeOperations = operationRows.filter(operation => operation.isActive && operation.parentOperationId !== null);
        const activeModules = moduleRows.filter(module => module.isEffective);
        setTenantOperations(activeOperations);
        setTenantModules(activeModules);
        setExpandedModules(new Set(activeModules.length ? [activeModules[0].moduleName] : []));
        const mapped = tenantRoleRows.map(role => {
          const permissions = buildPerms({});
          role.permissions.forEach(permission => {
            const operation = activeOperations.find(candidate => candidate.id === permission.tenantOperationId);
            const module = activeModules.find(candidate => candidate.moduleId === operation?.moduleId);
            if (!operation || !module) return;
            permissions[`${module.moduleName}::${operation.name}` as PermKey] = new Set([
              permission.canView && "View", permission.canAdd && "Create", permission.canEdit && "Edit",
              permission.canDelete && "Delete", permission.canApprove && "Approve", permission.canExport && "Export",
            ].filter(Boolean) as string[]);
          });
          return {
            id: role.id, name: role.name, description: role.description || "",
            isPlatformRole: false, userCount: role.userCount, permissions,
          };
        });
        setRoles(mapped);
        setSelectedRoleId(current => mapped.some(role => role.id === current) ? current : mapped[0]?.id || "");
      })
      .catch(error => toast.error("Unable to load tenant role options", { description: error instanceof Error ? error.message : undefined }));
  }, []);

  const dialogModules = Object.fromEntries(tenantModules.map(module => [
    module.moduleName,
    tenantOperations.filter(operation => operation.moduleId === module.moduleId),
  ]));
  const groupOperationsByParent = (operations: TenantOperation[]) => Object.entries(
    operations.reduce<Record<string, TenantOperation[]>>((groups, operation) => {
      const parentName = operation.parentOperationName || "Other Operations";
      groups[parentName] = [...(groups[parentName] ?? []), operation];
      return groups;
    }, {}),
  );
  const databaseModuleDocumentTypes = Object.fromEntries(tenantModules.map(module => [
    module.moduleName,
    tenantOperations
      .filter(operation => operation.moduleId === module.moduleId)
      .map(operation => operation.name),
  ]));

  const roleOptions = editingRole
    ? standardRoles
    : standardRoles.filter(role => {
        const tenantRole = tenantRoles.find(candidate =>
          candidate.roleId === role.id || candidate.code === role.code
        );
        return !tenantRole || tenantRole.permissions.length === 0;
      });

  const selectStandardRole = (role: StandardRole) => {
    const tenantRole = tenantRoles.find(candidate => candidate.roleId === role.id || candidate.code === role.code);
    const permissions: Record<PermKey, Set<string>> = {};
    tenantOperations.forEach(operation => {
      const saved = tenantRole?.permissions.find(permission => permission.tenantOperationId === operation.id);
      permissions[`${operation.moduleId}::${operation.id}` as PermKey] = new Set([
        saved?.canView && "View", saved?.canAdd && "Create", saved?.canEdit && "Edit",
        saved?.canDelete && "Delete", saved?.canApprove && "Approve", saved?.canExport && "Export",
      ].filter(Boolean) as string[]);
    });
    setForm({ roleId: tenantRole?.id || "", selectedRoleId: role.id, code: role.code, name: role.name, description: role.description || "" });
    setEditPerms(permissions);
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const rolePageSize = 10;
  const rolePageCount = Math.max(1, Math.ceil(roles.length / rolePageSize));
  const paginatedRoles = roles.slice((rolePage - 1) * rolePageSize, rolePage * rolePageSize);
  useEffect(() => { setRolePage(page => Math.min(page, rolePageCount)); }, [rolePageCount]);

  const toggleModule = (mod: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod); else next.add(mod);
      return next;
    });
  };

  const openAddDialog = () => {
    setEditingRole(null);
    setForm({ roleId: "", selectedRoleId: "", code: "", name: "", description: "" });
    setEditPerms({});
    setDialogExpandedModules(new Set(Object.keys(dialogModules)));
    setDialogOpen(true);
  };

  const openEditDialog = (role: RoleDef) => {
    setEditingRole(role);
    const standardRole = standardRoles.find(candidate => candidate.id === tenantRoles.find(instance => instance.id === role.id)?.roleId || candidate.name === role.name);
    if (standardRole) selectStandardRole(standardRole);
    else {
      setForm({ roleId: "", selectedRoleId: "", code: "", name: role.name, description: role.description });
      setEditPerms({});
    }
    setDialogExpandedModules(new Set(Object.keys(dialogModules)));
    setDialogOpen(true);
  };

  const toggleDialogModule = (mod: string) => {
    setDialogExpandedModules(current => {
      const next = new Set(current);
      if (next.has(mod)) next.delete(mod); else next.add(mod);
      return next;
    });
  };

  const allDialogModulesExpanded = Object.keys(dialogModules).length > 0
    && Object.keys(dialogModules).every(mod => dialogExpandedModules.has(mod));

  const togglePerm = (key: PermKey, perm: string) => {
    setEditPerms(prev => {
      const next = { ...prev };
      const set = new Set(next[key] || []);
      if (set.has(perm)) set.delete(perm); else set.add(perm);
      next[key] = set;
      return next;
    });
  };

  const toggleDocTypeAll = (key: PermKey) => {
    setEditPerms(prev => {
      const next = { ...prev };
      const current = next[key] || new Set();
      next[key] = current.size === permissionTypes.length ? new Set() : new Set(permissionTypes);
      return next;
    });
  };

  const toggleModuleAll = (mod: string) => {
    const dts = (dialogModules[mod] || []).map(operation => operation.id);
    setEditPerms(prev => {
      const next = { ...prev };
      const moduleId = (dialogModules[mod] || [])[0]?.moduleId;
      const allFull = dts.every(dt => (next[`${moduleId}::${dt}` as PermKey] || new Set()).size === permissionTypes.length);
      dts.forEach(dt => {
        next[`${moduleId}::${dt}` as PermKey] = allFull ? new Set() : new Set(permissionTypes);
      });
      return next;
    });
  };

  const toggleOperationGroupAll = (operations: Array<{ id: string; moduleId: string }>) => {
    setEditPerms(prev => {
      const next = { ...prev };
      const allFull = operations.every(operation =>
        (next[`${operation.moduleId}::${operation.id}` as PermKey] || new Set()).size === permissionTypes.length
      );
      operations.forEach(operation => {
        next[`${operation.moduleId}::${operation.id}` as PermKey] = allFull
          ? new Set()
          : new Set(permissionTypes);
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.selectedRoleId || saving) { if (!form.selectedRoleId) toast.error("Select a standard role"); return; }
    const permissions = Object.entries(editPerms).map(([key, values]) => {
      const tenantOperationId = key.split("::")[1];
      return {
        tenantOperationId,
        canView: values.has("View"), canAdd: values.has("Create"), canEdit: values.has("Edit"),
        canDelete: values.has("Delete"), canApprove: values.has("Approve"), canExport: values.has("Export"),
      };
    }).filter(permission => permission.canView || permission.canAdd || permission.canEdit || permission.canDelete || permission.canApprove || permission.canExport);
    setSaving(true);
    try {
      if (form.roleId) await multiTenantService.saveTenantRolePermissions(form.roleId, permissions);
      else await multiTenantService.createTenantRole({ code: form.code, name: form.name, roleId: form.selectedRoleId, permissions });
      const refreshed = await multiTenantService.tenantRoles();
      setTenantRoles(refreshed);
      setRoles(refreshed.map(role => {
        const savedPermissions = buildPerms({});
        role.permissions.forEach(permission => {
          const operation = tenantOperations.find(candidate => candidate.id === permission.tenantOperationId);
          const module = tenantModules.find(candidate => candidate.moduleId === operation?.moduleId);
          if (!operation || !module) return;
          savedPermissions[`${module.moduleName}::${operation.name}` as PermKey] = new Set([
            permission.canView && "View", permission.canAdd && "Create", permission.canEdit && "Edit",
            permission.canDelete && "Delete", permission.canApprove && "Approve", permission.canExport && "Export",
          ].filter(Boolean) as string[]);
        });
        return {
          id: role.id, name: role.name, description: role.description || "",
          isPlatformRole: false, userCount: role.userCount, permissions: savedPermissions,
        };
      }));
      toast.success(`Permissions for "${form.name}" saved`);
      setDialogOpen(false);
    } catch (error) {
      toast.error("Unable to save role", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && role.userCount > 0) {
      toast.error(`Cannot delete "${role.name}" — ${role.userCount} users assigned`);
      return;
    }
    try {
      await multiTenantService.deleteTenantRole(roleId);
      const remaining = roles.filter(r => r.id !== roleId);
      setRoles(remaining);
      if (selectedRoleId === roleId) setSelectedRoleId(remaining[0]?.id || "");
      toast.success("Role deleted");
    } catch (error) {
      toast.error("Unable to delete role", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setRoleToDelete(null);
    }
  };

  // Compute module-level summary for the read-only matrix
  const getModuleSummary = (role: RoleDef, mod: string) => {
    const dts = (dialogModules[mod] || []).map(operation => operation.name);
    let totalPerms = 0;
    let maxPerms = dts.length * permissionTypes.length;
    dts.forEach(dt => {
      totalPerms += (role.permissions[`${mod}::${dt}` as PermKey] || new Set()).size;
    });
    if (maxPerms === 0) return "None";
    if (totalPerms === maxPerms) return "Full Access";
    if (totalPerms === 0) return "None";
    return `${totalPerms}/${maxPerms}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">Granular access control per operation within each module</p>
        </div>
        <Button onClick={openAddDialog} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Role List */}
        <div className="space-y-2">
          {paginatedRoles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRoleId(role.id)}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                selectedRoleId === role.id
                  ? "border-primary bg-card shadow-sm"
                  : "border-border hover:border-primary/20 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {role.name}
                  {role.isPlatformRole && <Badge variant="outline" className="ml-1 text-[9px]">Platform</Badge>}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  <Users className="h-2.5 w-2.5 mr-0.5" />{role.userCount}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{role.description}</p>
            </button>
          ))}
          {!!roles.length && <div className="rounded-xl border bg-card px-3 py-2"><p className="mb-2 text-center text-[11px] text-muted-foreground">Showing {(rolePage-1)*rolePageSize+1}–{Math.min(rolePage*rolePageSize,roles.length)} of {roles.length} roles</p>{rolePageCount>1&&<div className="flex items-center justify-between"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous role page" disabled={rolePage===1} onClick={()=>setRolePage(page=>Math.max(1,page-1))}><ChevronLeft className="h-4 w-4"/></Button><span className="text-xs text-muted-foreground">Page {rolePage} of {rolePageCount}</span><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Next role page" disabled={rolePage===rolePageCount} onClick={()=>setRolePage(page=>Math.min(rolePageCount,page+1))}><ChevronRight className="h-4 w-4"/></Button></div>}</div>}
        </div>

        {/* Permission Matrix — Collapsible per module */}
        {selectedRole && (
          <div className="space-y-0 overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div>
                <h3 className="font-semibold text-foreground">{selectedRole.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openEditDialog(selectedRole)}>
                  <Pencil className="h-3 w-3" /> Edit
                </Button>
                {selectedRole.userCount === 0 && (
                  <Button variant="outline" size="sm" className="gap-1 text-destructive hover:bg-destructive/10" onClick={() => setRoleToDelete(selectedRole)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="max-h-[600px]">
              {Object.entries(dialogModules).map(([mod, operations]) => {
                const isOpen = expandedModules.has(mod);
                const summary = getModuleSummary(selectedRole, mod);
                const summaryColor = summary === "Full Access"
                  ? "text-emerald-500" : summary === "None"
                    ? "text-muted-foreground" : "text-primary";

                return (
                  <Collapsible key={mod} open={isOpen} onOpenChange={() => toggleModule(mod)}>
                    <CollapsibleTrigger asChild>
                      <button className="flex w-full items-center justify-between border-b border-border/50 bg-card px-4 py-2.5 text-left transition-colors hover:bg-muted/20">
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="font-semibold text-sm text-foreground">{mod}</span>
                          <span className="text-[10px] text-muted-foreground">({operations.length} operations)</span>
                        </div>
                        <span className={`text-xs font-medium ${summaryColor}`}>{summary}</span>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground text-[11px]">
                            <th className="pl-10 pr-3 py-1.5 text-left font-medium">Operation</th>
                            {permissionTypes.map(p => (
                              <th key={p} className="px-2 py-1.5 text-center font-medium">{p}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {groupOperationsByParent(operations).map(([parentName, parentOperations]) => (
                            <Fragment key={parentName}>
                              <tr className="bg-muted/30">
                                <td colSpan={permissionTypes.length + 1} className="pl-10 pr-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {parentName}
                                </td>
                              </tr>
                              {parentOperations.map(operation => {
                                const key = `${mod}::${operation.name}` as PermKey;
                                const perms = selectedRole.permissions[key] || new Set();
                                return (
                                  <tr key={operation.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="pl-14 pr-3 py-1.5 text-foreground text-xs">{operation.name}</td>
                                    {permissionTypes.map(perm => (
                                      <td key={perm} className="px-2 py-1.5 text-center">
                                        {perms.has(perm)
                                          ? <span aria-label={`${perm} granted`} className="mx-auto flex h-5 w-5 items-center justify-center rounded-full border border-emerald-700 bg-emerald-50/60 text-emerald-700 dark:border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300"><Check className="h-3 w-3" strokeWidth={2} /></span>
                                          : <span aria-label={`${perm} not granted`} className="mx-auto flex h-5 w-5 items-center justify-center text-muted-foreground/35"><Minus className="h-3 w-3" /></span>
                                        }
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Add / Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!saving) setDialogOpen(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              {editingRole ? "Edit Role" : "Add New Role"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Role Name</Label>
                <Popover open={rolePickerOpen} onOpenChange={setRolePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={rolePickerOpen} className="mt-1.5 h-10 w-full justify-between px-3 font-normal">
                      <span className={form.name ? "truncate text-foreground" : "truncate text-muted-foreground"}>
                        {form.name || "Search and select a role"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent portalled={false} align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Search roles..." />
                      <CommandList className="max-h-64">
                        <CommandEmpty>No matching role found.</CommandEmpty>
                        <CommandGroup>
                          {roleOptions.map(role => (
                            <CommandItem
                              key={role.id}
                              value={`${role.name} ${role.description || ""}`}
                              onSelect={() => {
                                selectStandardRole(role);
                                setRolePickerOpen(false);
                              }}
                              className="items-start gap-2 py-2.5"
                            >
                              <Check className={`mt-0.5 h-4 w-4 shrink-0 ${form.selectedRoleId === role.id ? "opacity-100 text-primary" : "opacity-0"}`} />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium">{role.name}</span>
                                {role.description && <span className="line-clamp-2 block text-xs text-muted-foreground">{role.description}</span>}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Description</Label>
                <Input readOnly value={form.description} placeholder="Role description" className="bg-muted/30" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">System permissions</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setDialogExpandedModules(allDialogModulesExpanded ? new Set() : new Set(Object.keys(dialogModules)))}
              disabled={!Object.keys(dialogModules).length}
            >
              {allDialogModulesExpanded ? "Collapse all" : "Expand all"}
            </Button>
          </div>

          <ScrollArea className="max-h-[55vh] pr-2">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {Object.entries(dialogModules).map(([mod, operations]) => {
                const allFull = operations.length > 0 && operations.every(operation =>
                  (editPerms[`${operation.moduleId}::${operation.id}` as PermKey] || new Set()).size === permissionTypes.length
                );
                const hasAnyPermission = operations.some(operation =>
                  (editPerms[`${operation.moduleId}::${operation.id}` as PermKey] || new Set()).size > 0
                );
                const moduleSelectionState = allFull ? true : hasAnyPermission ? "indeterminate" : false;
                return (
                  <Collapsible
                    key={mod}
                    open={dialogExpandedModules.has(mod)}
                    onOpenChange={() => toggleDialogModule(mod)}
                    className="border-b border-border bg-card last:border-b-0"
                  >
                    <div className="flex items-center gap-2 bg-card px-3 py-2.5 transition-colors hover:bg-muted/20">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-1.5 flex-1 text-left">
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground collapsible-chevron" />
                          <span className="font-semibold text-sm text-foreground">{mod}</span>
                          <span className="text-[10px] text-muted-foreground">({operations.length})</span>
                        </button>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
                        <span id={`module-select-all-${operations[0]?.moduleId}`}>All</span>
                        <Checkbox
                          checked={moduleSelectionState}
                          onCheckedChange={() => toggleModuleAll(mod)}
                          aria-labelledby={`module-select-all-${operations[0]?.moduleId}`}
                          aria-label={`Select all permissions for ${mod}`}
                        />
                      </div>
                    </div>
                    <CollapsibleContent className="border-t border-border bg-card">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground text-[10px]">
                            <th className="pl-8 pr-2 py-1 text-left font-medium">Operation</th>
                            {permissionTypes.map(p => (
                              <th key={p} className="px-1.5 py-1 text-center font-medium">{p}</th>
                            ))}
                            <th className="px-1.5 py-1 text-center font-medium">All</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupOperationsByParent(operations).map(([parentName, parentOperations]) => {
                            const parentAllFull = parentOperations.every(operation =>
                              (editPerms[`${operation.moduleId}::${operation.id}` as PermKey] || new Set()).size === permissionTypes.length
                            );
                            const parentHasAnyPermission = parentOperations.some(operation =>
                              (editPerms[`${operation.moduleId}::${operation.id}` as PermKey] || new Set()).size > 0
                            );
                            const parentSelectionState = parentAllFull
                              ? true
                              : parentHasAnyPermission ? "indeterminate" : false;

                            return <Fragment key={parentName}>
                              <tr className="bg-muted/30">
                                <td colSpan={permissionTypes.length + 1} className="pl-8 pr-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {parentName}
                                </td>
                                <td className="px-1.5 py-1.5 text-center">
                                  <Checkbox
                                    checked={parentSelectionState}
                                    onCheckedChange={() => toggleOperationGroupAll(parentOperations)}
                                    aria-label={`Select all permissions for ${parentName}`}
                                  />
                                </td>
                              </tr>
                              {parentOperations.map(operation => {
                                const key = `${operation.moduleId}::${operation.id}` as PermKey;
                                const perms = editPerms[key] || new Set();
                                const rowFull = perms.size === permissionTypes.length;
                                return (
                                  <tr key={operation.id} className="hover:bg-muted/10">
                                    <td className="pl-12 pr-2 py-1.5 text-xs text-foreground">{operation.name}</td>
                                    {permissionTypes.map(perm => (
                                      <td key={perm} className="px-1.5 py-1 text-center">
                                        <Checkbox checked={perms.has(perm)} onCheckedChange={() => togglePerm(key, perm)} />
                                      </td>
                                    ))}
                                    <td className="px-1.5 py-1 text-center">
                                      <Checkbox checked={rowFull} onCheckedChange={() => toggleDocTypeAll(key)} />
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>;
                          })}
                        </tbody>
                      </table>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={!form.selectedRoleId || saving} onClick={handleSave}>{saving ? "Saving…" : editingRole ? "Save Changes" : "Save Permissions"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!roleToDelete} onOpenChange={open => { if (!open) setRoleToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{roleToDelete?.name}</strong> and its configured permissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => roleToDelete && void deleteRole(roleToDelete.id)}
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RolesPermissions;
