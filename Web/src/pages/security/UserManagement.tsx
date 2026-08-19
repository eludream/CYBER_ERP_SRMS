import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CheckCircle2, ChevronLeft, ChevronRight, ChevronsUpDown, Pencil, Plus, Search, Trash2, UserPlus, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTenant } from "@/contexts/TenantContext";
import { cn } from "@/lib/utils";
import { multiTenantService } from "@/services/api/multiTenantService";

type Membership = Awaited<ReturnType<typeof multiTenantService.tenantUsers>>[number];
type Role = Awaited<ReturnType<typeof multiTenantService.tenantStandardRoles>>[number];

export default function UserManagement() {
  const { currentTenant } = useTenant();
  const currentTenantId = useRef(currentTenant?.id);
  currentTenantId.current = currentTenant?.id;
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [available, setAvailable] = useState<Awaited<ReturnType<typeof multiTenantService.availableTenantUsers>>>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Membership | null>(null);
  const [removing, setRemoving] = useState<Membership | null>(null);
  const [form, setForm] = useState({ userId: "", roleIds: [] as string[], isDefaultTenant: false, isActive: true });
  const load = async () => {
    const requestedTenantId = currentTenantId.current;
    const [tenantUsers, platformUsers, standardRoles] = await Promise.all([multiTenantService.tenantUsers(), multiTenantService.availableTenantUsers(), multiTenantService.tenantStandardRoles()]);
    if (requestedTenantId !== currentTenantId.current) return;
    setMemberships(tenantUsers); setAvailable(platformUsers); setRoles(standardRoles);
  };
  useEffect(() => {
    setMemberships([]);
    setAvailable([]);
    if (!currentTenant) return;
    load().catch(error => toast.error(error instanceof Error ? error.message : "Unable to load tenant users"));
  }, [currentTenant?.id]);
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return memberships;

    return memberships.filter(user => {
      const assignedRoleNames = roles
        .filter(role => user.standardRoleIds.includes(role.id))
        .map(role => role.name);
      return [user.fullName, user.userName, user.email, ...assignedRoleNames]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search);
    });
  }, [memberships, query, roles]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedMemberships = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [currentPage, filtered]);
  useEffect(() => { setCurrentPage(1); }, [query]);
  useEffect(() => { setCurrentPage(page => Math.min(page, totalPages)); }, [totalPages]);
  const selectedPlatformUser = useMemo(() => available.find(user => user.id === form.userId) || (editing ? { id: editing.userId, fullName: editing.fullName, userName: editing.userName, email: editing.email, phoneNumber: "", profilePictureUrl: editing.profilePictureUrl } : undefined), [available, editing, form.userId]);
  const startAdd = () => { setEditing(null); setRolePickerOpen(false); setForm({ userId: "", roleIds: [], isDefaultTenant: false, isActive: true }); setOpen(true); };
  const startEdit = (user: Membership) => { setEditing(user); setRolePickerOpen(false); setForm({ userId: user.userId, roleIds: [...user.standardRoleIds], isDefaultTenant: user.isDefaultTenant, isActive: user.status === "Active" }); setOpen(true); };
  const save = async () => {
    if (!form.userId) return toast.error("Select an existing platform user");
    setSaving(true);
    try {
      await multiTenantService.saveTenantUser({ userId: form.userId, isDefaultTenant: form.isDefaultTenant, isActive: form.isActive, standardRoleIds: form.roleIds }, editing?.membershipId);
      await load(); setOpen(false); setEditing(null); setForm({ userId: "", roleIds: [], isDefaultTenant: false, isActive: true }); toast.success(editing ? "Tenant user updated" : "User associated with this tenant");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to associate user"); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!removing) return;
    try {
      await multiTenantService.removeTenantUser(removing.membershipId);
      await load(); setRemoving(null); toast.success("User removed from this tenant");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to remove tenant user"); }
  };
  return <div className="space-y-6">
    <div><h1 className="font-display text-xl font-bold sm:text-2xl">Tenant Users</h1><p className="text-sm text-muted-foreground">Associate users already defined by Platform Administration with the current tenant.</p></div>
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-semibold">User associations</h2><p className="text-xs text-muted-foreground">{memberships.length} users associated with this tenant</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground"/><Input className="h-8 w-full pl-8 text-xs sm:w-56" placeholder="Search tenant users..." value={query} onChange={e=>setQuery(e.target.value)}/></div><Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={startAdd}><Plus className="h-3.5 w-3.5"/>Add existing user</Button></div></div>
      <div className="hidden lg:block"><Table className="[&_thead_th]:h-8 [&_thead_th]:px-3 [&_tbody_td]:px-3 [&_tbody_td]:py-1.5 [&_tbody_td:first-child_span.font-medium]:text-sm [&_tbody_td:first-child_.text-muted-foreground]:text-xs [&_tbody_button]:h-7 [&_tbody_button]:w-7"><TableHeader><TableRow><TableHead className="text-[10px] font-display font-semibold uppercase">User</TableHead><TableHead className="text-[10px] font-display font-semibold uppercase">Tenant roles</TableHead><TableHead className="text-[10px] font-display font-semibold uppercase">Status</TableHead><TableHead className="w-16"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader><TableBody>
        {paginatedMemberships.map(user=><TableRow key={user.membershipId}><TableCell><div className="flex items-center gap-2"><UserAvatar name={user.fullName||user.userName} profilePictureUrl={user.profilePictureUrl} className="h-7 w-7 shrink-0"/><div className="min-w-0"><div className="flex items-center gap-1.5"><span className="truncate text-xs font-medium">{user.fullName||user.userName}</span>{user.isDefaultTenant&&<Badge variant="outline" className="h-5 px-1.5 text-[11px]">Default</Badge>}</div><div className="truncate text-[11px] text-muted-foreground">{user.email}</div></div></div></TableCell><TableCell>{user.standardRoleIds.length?<div className="flex flex-wrap gap-1">{roles.filter(r=>user.standardRoleIds.includes(r.id)).map(r=><Badge key={r.id} variant="outline" className="h-5 rounded-md bg-muted/40 px-1.5 py-0 text-[11px] font-medium">{r.name}</Badge>)}</div>:<span className="text-xs text-muted-foreground">No role assigned</span>}</TableCell><TableCell><Tooltip><TooltipTrigger asChild><span tabIndex={0} aria-label={user.status} className="inline-flex cursor-help"><Badge variant="outline" className={`h-5 w-5 justify-center p-0 ${user.status==="Active"?"border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300":"border-red-200 bg-red-100 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300"}`}>{user.status==="Active"?<CheckCircle2 className="h-3 w-3"/>:<XCircle className="h-3 w-3"/>}</Badge></span></TooltipTrigger><TooltipContent side="top" className="text-xs font-normal">{user.status}</TooltipContent></Tooltip></TableCell><TableCell><div className="flex"><Button variant="ghost" size="icon" aria-label={`Edit ${user.fullName||user.userName}`} onClick={()=>startEdit(user)}><Pencil className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" aria-label={`Remove ${user.fullName||user.userName} from tenant`} onClick={()=>setRemoving(user)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></div></TableCell></TableRow>)}
        {!filtered.length&&<TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground"><Users className="mx-auto mb-2 h-6 w-6"/>No tenant users found.</TableCell></TableRow>}
      </TableBody></Table></div>
      <div className="divide-y lg:hidden">{paginatedMemberships.map(user=><article key={user.membershipId} className="p-4"><div className="flex items-start gap-3"><UserAvatar name={user.fullName||user.userName} profilePictureUrl={user.profilePictureUrl} className="h-10 w-10 shrink-0"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><span className="truncate text-sm font-semibold">{user.fullName||user.userName}</span>{user.isDefaultTenant&&<Badge variant="outline" className="h-5 px-1.5 text-[10px]">Default</Badge>}</div><p className="truncate text-xs text-muted-foreground">{user.email}</p></div><Badge variant="outline" className={`h-6 w-6 shrink-0 justify-center p-0 ${user.status==="Active"?"border-emerald-200 bg-emerald-100 text-emerald-700":"border-red-200 bg-red-100 text-red-700"}`}>{user.status==="Active"?<CheckCircle2 className="h-3.5 w-3.5"/>:<XCircle className="h-3.5 w-3.5"/>}</Badge></div><div className="mt-3 flex items-end justify-between gap-3"><div className="min-w-0"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tenant roles</p><div className="flex flex-wrap gap-1">{roles.filter(r=>user.standardRoleIds.includes(r.id)).map(r=><Badge key={r.id} variant="outline" className="h-auto whitespace-normal rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium">{r.name}</Badge>)}{!user.standardRoleIds.length&&<span className="text-xs text-muted-foreground">No role assigned</span>}</div></div><div className="flex shrink-0"><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${user.fullName||user.userName}`} onClick={()=>startEdit(user)}><Pencil className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Remove ${user.fullName||user.userName} from tenant`} onClick={()=>setRemoving(user)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></div></div></article>)}{!filtered.length&&<div className="p-8 text-center text-sm text-muted-foreground"><Users className="mx-auto mb-2 h-6 w-6"/>No tenant users found.</div>}</div>
      {!!filtered.length&&<div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5"><p className="text-xs text-muted-foreground">Showing {(currentPage-1)*pageSize+1}–{Math.min(currentPage*pageSize,filtered.length)} of {filtered.length} records</p>{totalPages>1&&<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous page" disabled={currentPage===1} onClick={()=>setCurrentPage(page=>Math.max(1,page-1))}><ChevronLeft className="h-4 w-4"/></Button><span className="min-w-20 text-center text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Next page" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(page=>Math.min(totalPages,page+1))}><ChevronRight className="h-4 w-4"/></Button></div>}</div>}
    </div>
    <Dialog open={open} onOpenChange={value=>{setOpen(value);if(!value)setEditing(null)}}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle className="flex items-center gap-2">{editing?<Pencil className="h-4 w-4"/>:<UserPlus className="h-4 w-4"/>}{editing?"Edit associated user":"Add existing user"}</DialogTitle><DialogDescription>{editing?"Update this user's tenant access, roles, and default-tenant preference.":"User identities are created and edited in Platform Administration. This action only creates a tenant association."}</DialogDescription></DialogHeader>
      <div className="space-y-4"><div className="space-y-1.5"><Label>Platform user</Label>
        <Popover open={userPickerOpen} onOpenChange={setUserPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={userPickerOpen} disabled={!!editing||!available.length} className="h-11 w-full justify-between px-3 font-normal">
              {selectedPlatformUser?<span className="flex min-w-0 items-center gap-2"><UserAvatar name={selectedPlatformUser.fullName||selectedPlatformUser.userName} profilePictureUrl={selectedPlatformUser.profilePictureUrl} className="h-7 w-7 shrink-0"/><span className="min-w-0 text-left"><span className="block truncate text-sm font-medium">{selectedPlatformUser.fullName||selectedPlatformUser.userName}</span><span className="block truncate text-xs text-muted-foreground">{selectedPlatformUser.email}</span></span></span>:<span className="text-muted-foreground">Search and select a user</span>}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
            </Button>
          </PopoverTrigger>
          <PopoverContent portalled={false} className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search name, email, or username..." />
              <CommandList className="max-h-60">
                <CommandEmpty>No matching platform user.</CommandEmpty>
                <CommandGroup>
                  {available.map(user=><CommandItem key={user.id} value={`${user.fullName} ${user.email} ${user.userName}`} onSelect={()=>{setForm({...form,userId:user.id});setUserPickerOpen(false)}}>
                    <UserAvatar name={user.fullName||user.userName} profilePictureUrl={user.profilePictureUrl} className="mr-2 h-8 w-8 shrink-0"/>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{user.fullName||user.userName}</span><span className="block truncate text-xs text-muted-foreground">{user.email}</span></span>
                    <Check className={cn("ml-2 h-4 w-4 shrink-0",form.userId===user.id?"opacity-100":"opacity-0")}/>
                  </CommandItem>)}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {!available.length&&<p className="text-xs text-muted-foreground">All active platform users are already associated with this tenant.</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Standard roles</Label>
        <Popover open={rolePickerOpen} onOpenChange={setRolePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={rolePickerOpen} disabled={!roles.length} className="h-11 w-full justify-between px-3 font-normal">
              <span className={cn("truncate",!form.roleIds.length&&"text-muted-foreground")}>{form.roleIds.length?`${form.roleIds.length} role${form.roleIds.length===1?"":"s"} selected`:roles.length?"Search and select roles":"No active tenant roles are available"}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
            </Button>
          </PopoverTrigger>
          <PopoverContent portalled={false} className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search roles by name or description..." />
              <CommandList className="max-h-72">
                <CommandEmpty>No matching role.</CommandEmpty>
                <CommandGroup>
                  {roles.map(role=><CommandItem key={role.id} value={`${role.name} ${role.description ?? ""}`} onSelect={()=>setForm(current=>({...current,roleIds:current.roleIds.includes(role.id)?current.roleIds.filter(id=>id!==role.id):[...current.roleIds,role.id]}))}>
                    <Checkbox className="mr-2 shrink-0" checked={form.roleIds.includes(role.id)} aria-label={`Select ${role.name}`} />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{role.name}</span>{role.description&&<span className="line-clamp-1 block text-xs text-muted-foreground">{role.description}</span>}</span>
                  </CommandItem>)}
                </CommandGroup>
              </CommandList>
              <div className="flex items-center justify-between border-t px-3 py-2 text-xs"><span className="text-muted-foreground">{form.roleIds.length} of {roles.length} selected</span><Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={()=>setForm(current=>({...current,roleIds:current.roleIds.length===roles.length?[]:roles.map(role=>role.id)}))}>{form.roleIds.length===roles.length?"Clear all":"Select all"}</Button></div>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid gap-2 sm:grid-cols-2"><div className="flex items-center justify-between rounded-lg border p-3"><Label htmlFor="default-tenant">Default tenant</Label><Switch id="default-tenant" checked={form.isDefaultTenant} onCheckedChange={isDefaultTenant=>setForm({...form,isDefaultTenant})}/></div><div className="flex items-center justify-between rounded-lg border p-3"><Label htmlFor="active-membership">Active</Label><Switch id="active-membership" checked={form.isActive} onCheckedChange={isActive=>setForm({...form,isActive})}/></div></div></div>
      <DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={saving||(!editing&&!available.length)} onClick={save}>{saving?(editing?"Saving...":"Associating..."):(editing?"Save changes":"Associate user")}</Button></DialogFooter>
    </DialogContent></Dialog>
    <AlertDialog open={!!removing} onOpenChange={open=>{if(!open)setRemoving(null)}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove user from tenant?</AlertDialogTitle><AlertDialogDescription>{removing?.userName} will lose this tenant membership and all roles assigned through it. Their platform account will not be deleted.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove user</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
