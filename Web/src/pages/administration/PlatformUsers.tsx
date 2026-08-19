import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, CircleX, LayoutGrid, List, LockKeyhole, Pencil, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { multiTenantService, PlatformUserRecord } from "@/services/api/multiTenantService";
import UserAccountDialog, { AdminProfileTarget } from "@/components/UserAccountDialog";
import UserAvatar from "@/components/UserAvatar";

const StatusIcons = ({ user }: { user: PlatformUserRecord }) => {
  const lockedOut = Boolean(user.lockoutEndUtc && new Date(user.lockoutEndUtc) > new Date());
  const label = lockedOut ? "Locked" : user.accountStatus ? "Active" : "Inactive";
  return <div className="flex items-center gap-1">
  <Tooltip delayDuration={100}>
    <TooltipTrigger type="button" aria-label={label} className="inline-flex cursor-help rounded-full">
      {lockedOut
        ? <Badge variant="outline" className="h-6 w-6 justify-center rounded-full border-amber-200 bg-amber-100 p-0 text-amber-700"><LockKeyhole className="h-3.5 w-3.5"/></Badge>
        : !user.accountStatus
        ? <Badge variant="outline" className="h-6 w-6 justify-center rounded-full border-red-200 bg-red-100 p-0 text-red-700"><CircleX className="h-3.5 w-3.5"/></Badge>
        : <Badge variant="outline" className="h-6 w-6 justify-center rounded-full border-emerald-200 bg-emerald-100 p-0 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5"/></Badge>}
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs font-normal">{lockedOut ? `Locked until ${new Date(user.lockoutEndUtc!).toLocaleString()}` : label}</TooltipContent>
  </Tooltip>
</div>;
};

const UserCard = ({ user, onEdit, onDelete }: { user: PlatformUserRecord; onEdit: (user: PlatformUserRecord) => void; onDelete: (user: PlatformUserRecord) => void }) => <article className="flex min-h-48 flex-col rounded-xl border bg-background p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><UserAvatar name={user.fullName || user.userName} profilePictureUrl={user.profilePictureUrl || null} className="h-11 w-11 shrink-0"/><div className="min-w-0"><h4 className="truncate font-display text-sm font-semibold">{user.fullName}</h4><p className="truncate text-xs text-muted-foreground">{user.email}</p></div></div><StatusIcons user={user}/></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Username</dt><dd className="mt-1 truncate">{user.userName}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Tenants</dt><dd className="mt-1 flex items-center gap-1"><Users className="h-3.5 w-3.5"/>{user.tenantCount}</dd></div></dl><div className="mt-auto flex items-center justify-between gap-2 border-t pt-3"><div>{user.isPlatformAdministrator&&<Badge className="gap-1"><ShieldCheck className="h-3 w-3"/>Platform administrator</Badge>}</div><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${user.fullName}`} onClick={()=>onEdit(user)}><Pencil className="h-3.5 w-3.5"/></Button><Button disabled={user.isPlatformAdministrator} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label={`Delete ${user.fullName}`} title={user.isPlatformAdministrator ? "Administrator users cannot be deleted" : "Delete user"} onClick={()=>!user.isPlatformAdministrator&&onDelete(user)}><Trash2 className="h-3.5 w-3.5"/></Button></div></div></article>;

export default function PlatformUsers() {
  const [users, setUsers] = useState<PlatformUserRecord[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PlatformUserRecord>();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlatformUserRecord>();
  const [deleting, setDeleting] = useState(false);
  const [view, setView] = useState<"table" | "cards">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const load = async () => setUsers(await multiTenantService.platformUsers());
  useEffect(() => { load().catch(error => toast.error(error instanceof Error ? error.message : "Unable to load users")); }, []);
  const allFiltered = useMemo(() => users
    .filter(x => `${x.fullName} ${x.email} ${x.userName} ${x.employeeFullName || ""} ${x.employeeNumber || ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((left, right) => Number(right.isPlatformAdministrator) - Number(left.isPlatformAdministrator) || left.fullName.localeCompare(right.fullName)), [users, query]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / pageSize));
  const filtered = useMemo(() => allFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [allFiltered, currentPage]);
  const administratorUsers = filtered.filter(user => user.isPlatformAdministrator);
  const standardUsers = filtered.filter(user => !user.isPlatformAdministrator);
  useEffect(() => { setCurrentPage(1); }, [query]);
  useEffect(() => { setCurrentPage(page => Math.min(page, totalPages)); }, [totalPages]);
  const startAdd = () => { setEditing(undefined); setOpen(true); };
  const startEdit = (user: PlatformUserRecord) => { setEditing(user); setOpen(true); };
  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await multiTenantService.deletePlatformUser(deleteTarget.id);
      setUsers(current => current.filter(user => user.id !== deleteTarget.id));
      setDeleteTarget(undefined);
      toast.success("User deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete user");
    } finally {
      setDeleting(false);
    }
  };
  return <div className="overflow-hidden rounded-xl border border-border bg-card xl:[&>.grid]:grid-cols-4 [&>.grid>article]:min-h-52 [&>.grid>article]:bg-card [&>.grid>article]:shadow-none [&>.grid>article]:transition-all [&>.grid>article]:duration-200 [&>.grid>article]:hover:-translate-y-0.5 [&>.grid>article]:hover:shadow-md [&>.grid>article>div:last-child]:-mx-4 [&>.grid>article>div:last-child]:-mb-4 [&>.grid>article>div:last-child]:border-t [&>.grid>article>div:last-child]:border-border [&>.grid>article>div:last-child]:bg-muted/40 [&>.grid>article>div:last-child]:px-4 [&>.grid>article>div:last-child]:py-1.5 [&>.grid>article>div:last-child_button.w-8]:h-7 [&>.grid>article>div:last-child_button.w-8]:w-7">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
      <div><h3 className="font-display text-sm font-semibold">Platform Users</h3><p className="text-xs text-muted-foreground">Create and maintain identities once, then associate them with tenants.</p></div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><div className="relative flex-1"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground"/><Input className="h-8 w-full pl-8 text-xs sm:w-56" placeholder="Search users..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="inline-flex h-8 items-center rounded-md bg-muted/30 p-0.5" role="group" aria-label="Choose layout"><Button variant={view === "table" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Table view" aria-pressed={view === "table"} onClick={()=>setView("table")}><List className="h-3.5 w-3.5"/></Button><Button variant={view === "cards" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" aria-label="Card view" aria-pressed={view === "cards"} onClick={()=>setView("cards")}><LayoutGrid className="h-3.5 w-3.5"/></Button></div><Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={startAdd}><Plus className="h-3.5 w-3.5"/>Add User</Button></div>
    </div>
    {view === "table" ? <><div className="overflow-x-auto">
    <Table className="min-w-[760px]"><TableHeader><TableRow><TableHead className="text-[11px] font-display font-semibold uppercase">User</TableHead><TableHead className="text-[11px] font-display font-semibold uppercase">Username</TableHead><TableHead className="text-[11px] font-display font-semibold uppercase">Tenant associations</TableHead><TableHead className="text-[11px] font-display font-semibold uppercase">Status</TableHead><TableHead className="text-right text-[11px] font-display font-semibold uppercase">Actions</TableHead></TableRow></TableHeader>
      <TableBody>{administratorUsers.length > 0 && <TableRow className="bg-primary/5 hover:bg-primary/5"><TableCell colSpan={5} className="py-2 text-[11px] font-display font-semibold uppercase tracking-wide text-primary"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5"/>Platform administrators ({administratorUsers.length})</span></TableCell></TableRow>}{administratorUsers.map(user => <TableRow key={user.id}>
        <TableCell><div className="flex items-center gap-3"><UserAvatar name={user.employeeFullName || user.fullName || user.userName} profilePictureUrl={user.profilePictureUrl || null} className="h-8 w-8 shrink-0"/><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate font-medium">{user.employeeFullName || user.fullName}</span>{user.isPlatformAdministrator && <Tooltip delayDuration={100}><TooltipTrigger type="button" aria-label="Platform administrator" className="inline-flex cursor-help rounded-full"><Badge className="h-5 w-5 justify-center p-0"><ShieldCheck className="h-3 w-3"/></Badge></TooltipTrigger><TooltipContent side="top" className="text-xs font-normal">Platform administrator</TooltipContent></Tooltip>}</div><div className="truncate text-xs text-muted-foreground">{user.employeeNumber ? `${user.employeeNumber} · ${user.email}` : user.email}</div></div></div></TableCell>
        <TableCell>{user.userName}</TableCell><TableCell><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5"/>{user.tenantCount}</span></TableCell>
        <TableCell><StatusIcons user={user}/></TableCell>
        <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${user.fullName}`} onClick={() => startEdit(user)}><Pencil className="h-3.5 w-3.5"/></Button><Button disabled={user.isPlatformAdministrator} variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Delete ${user.fullName}`} onClick={() => !user.isPlatformAdministrator && setDeleteTarget(user)}><Trash2 className="h-3.5 w-3.5"/></Button></div></TableCell>
      </TableRow>)}{standardUsers.length > 0 && <TableRow className="bg-muted/30 hover:bg-muted/30"><TableCell colSpan={5} className="py-2 text-[11px] font-display font-semibold uppercase tracking-wide text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5"/>System users ({standardUsers.length})</span></TableCell></TableRow>}{standardUsers.map(user => <TableRow key={user.id}>
        <TableCell><div className="flex items-center gap-3"><UserAvatar name={user.employeeFullName || user.fullName || user.userName} profilePictureUrl={user.profilePictureUrl || null} className="h-8 w-8 shrink-0"/><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate font-medium">{user.employeeFullName || user.fullName}</span></div><div className="truncate text-xs text-muted-foreground">{user.employeeNumber ? `${user.employeeNumber} · ${user.email}` : user.email}</div></div></div></TableCell>
        <TableCell>{user.userName}</TableCell><TableCell><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5"/>{user.tenantCount}</span></TableCell>
        <TableCell><StatusIcons user={user}/></TableCell>
        <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${user.fullName}`} onClick={() => startEdit(user)}><Pencil className="h-3.5 w-3.5"/></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" aria-label={`Delete ${user.fullName}`} onClick={() => setDeleteTarget(user)}><Trash2 className="h-3.5 w-3.5"/></Button></div></TableCell>
      </TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No users found.</TableCell></TableRow>}</TableBody>
    </Table></div>
    </> : <div className="space-y-5 p-4">{administratorUsers.length > 0 && <section><div className="mb-2 flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-wide text-primary"><ShieldCheck className="h-3.5 w-3.5"/>Platform administrators ({administratorUsers.length})</div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{administratorUsers.map(user=><UserCard key={user.id} user={user} onEdit={startEdit} onDelete={setDeleteTarget}/>)}</div></section>}{standardUsers.length > 0 && <section><div className="mb-2 flex items-center gap-1.5 text-xs font-display font-semibold uppercase tracking-wide text-muted-foreground"><Users className="h-3.5 w-3.5"/>System users ({standardUsers.length})</div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{standardUsers.map(user=><UserCard key={user.id} user={user} onEdit={startEdit} onDelete={setDeleteTarget}/>)}</div></section>}{!filtered.length&&<div className="py-10 text-center text-sm text-muted-foreground">No users found.</div>}</div>}
    {!!allFiltered.length&&<div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5"><p className="text-xs text-muted-foreground">Showing {(currentPage-1)*pageSize+1}–{Math.min(currentPage*pageSize,allFiltered.length)} of {allFiltered.length} records</p>{totalPages>1&&<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous page" disabled={currentPage===1} onClick={()=>setCurrentPage(page=>Math.max(1,page-1))}><ChevronLeft className="h-4 w-4"/></Button><span className="min-w-20 text-center text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span><Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Next page" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(page=>Math.min(totalPages,page+1))}><ChevronRight className="h-4 w-4"/></Button></div>}</div>}
    <UserAccountDialog
      key={editing?.id ?? "no-user-selected"}
      open={open}
      onOpenChange={next => { setOpen(next); if (!next) setEditing(undefined); }}
      createMode={!editing}
      platformMode
      platformAdministrator={editing?.isPlatformAdministrator ?? false}
      targetUser={editing ? {
        id: editing.id, employeeId: editing.employeeId, employeeFullName: editing.employeeFullName, employeeNumber: editing.employeeNumber, name: editing.fullName, email: editing.email, phoneNumber: editing.phoneNumber,
        userName: editing.userName, profilePictureUrl: editing.profilePictureUrl || null,
        status: editing.accountStatus, twoFactorEnabled: editing.twoFactorEnabled, lockoutEndUtc: editing.lockoutEndUtc,
        createdAt: editing.createdAt, lastLogin: "Not available", roleIds: editing.roleIds,
      } : undefined}
      onAdminSaved={async (saved: AdminProfileTarget) => {
        if (!editing) {
          await load();
          return;
        }
        setEditing(current => current?.id === saved.id ? {
          ...current, fullName: saved.name, email: saved.email, phoneNumber: saved.phoneNumber,
          userName: saved.userName, accountStatus: saved.status, profilePictureUrl: saved.profilePictureUrl,
        } : current);
        setUsers(current => current.map(user => user.id === saved.id ? {
          ...user, fullName: saved.name, email: saved.email, phoneNumber: saved.phoneNumber,
          userName: saved.userName, accountStatus: saved.status, profilePictureUrl: saved.profilePictureUrl,
        } : user));
        await load();
      }}
    />
    <AlertDialog open={!!deleteTarget} onOpenChange={next => { if (!next && !deleting) setDeleteTarget(undefined); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget?.tenantCount
              ? `${deleteTarget.fullName} is associated with ${deleteTarget.tenantCount} tenant${deleteTarget.tenantCount === 1 ? "" : "s"}. Remove those associations before deleting this user.`
              : `This permanently deletes ${deleteTarget?.fullName ?? "this user"} and their platform login. This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting || !!deleteTarget?.tenantCount}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={event => { event.preventDefault(); void remove(); }}
          >
            {deleting ? "Deleting..." : "Delete user"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
