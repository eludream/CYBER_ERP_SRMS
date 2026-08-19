import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Edit, ListChecks, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { multiTenantService, PlatformModuleRecord, PlatformOperationRecord } from "@/services/api/multiTenantService";
import { platformAdminPaths } from "@/config/routes";

const emptyOperation = (moduleId: string): PlatformOperationRecord => ({
  id: "", moduleId, parentOperationId: null, name: "", link: "",
  filter: "", icon: "folder", displayOrder: 0, isActive: true,
});

export default function PlatformOperationMaintenance() {
  const navigate = useNavigate();
  const { moduleId = "" } = useParams<{ moduleId: string }>();
  const [module, setModule] = useState<PlatformModuleRecord>();
  const [operations, setOperations] = useState<PlatformOperationRecord[]>([]);
  const [form, setForm] = useState(emptyOperation(moduleId));
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const modules = await multiTenantService.modules();
      const selected = modules.find(item => item.id === moduleId);
      if (!selected) throw new Error("Platform module was not found");
      setModule(selected);
      setOperations(await multiTenantService.operations(moduleId));
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load module operations"); }
  }, [moduleId]);
  useEffect(() => { void load(); }, [load]);

  const edit = (operation?: PlatformOperationRecord) => {
    setForm(operation ? { ...operation } : emptyOperation(moduleId));
    setFormOpen(true);
  };
  const save = async () => {
    const value = { ...form, name: form.name.trim(), link: form.link.trim(), filter: form.filter.trim(), icon: form.icon.trim() };
    if (!value.name) { toast.error("Operation name is required"); return; }
    if (value.link && !value.link.startsWith("/")) { toast.error("Link must start with /"); return; }
    setSaving(true);
    try {
      await multiTenantService.saveOperation(moduleId, value, form.id || undefined);
      toast.success(form.id ? "Module operation updated" : "Module operation added");
      setFormOpen(false);
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save module operation"); }
    finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-background p-6 lg:p-8">
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ListChecks className="h-5 w-5"/></div>
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Platform Sub System</p><h1 className="font-display text-2xl font-bold">Maintain {module?.name ?? "Sub System"} Modules</h1><p className="text-sm text-muted-foreground">Modules stored in Core.Operation.</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => navigate(platformAdminPaths.subsystems)}><ArrowLeft className="h-4 w-4"/>Back to Sub Systems</Button>
          <Button className="gap-1.5" onClick={() => edit()} disabled={!module}><Plus className="h-4 w-4"/>Add Operation</Button>
        </div>
      </div>
      <div className="overflow-auto rounded-xl border bg-card">
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Link</TableHead><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{operations.map(operation => <TableRow key={operation.id}><TableCell className="font-medium">{operation.name}</TableCell><TableCell className="text-muted-foreground">{operation.link || "—"}</TableCell><TableCell>{operation.displayOrder}</TableCell><TableCell><Badge variant={operation.isActive ? "default" : "secondary"}>{operation.isActive ? "Active" : "Inactive"}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" className="gap-1.5" onClick={() => edit(operation)}><Edit className="h-3.5 w-3.5"/>Edit</Button></TableCell></TableRow>)}</TableBody>
          </Table>
      </div>
    </div>
    <Dialog open={formOpen} onOpenChange={setFormOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{form.id ? "Maintain" : "Add"} Module Operation</DialogTitle><DialogDescription>Configure the operation menu using the tenant maintenance fields.</DialogDescription></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Operation name"><Input value={form.name} onChange={e => setForm({...form, name:e.target.value})}/></Field>
          <Field label="Module"><Select value={form.parentOperationId ?? "__root__"} onValueChange={value => setForm({...form, parentOperationId:value === "__root__" ? null : value})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="__root__">Create as top-level module</SelectItem>{operations.filter(x => !x.parentOperationId && x.id !== form.id).map(x => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Link"><Input value={form.link} onChange={e => setForm({...form, link:e.target.value})} placeholder="/finance/accounts-payable"/></Field>
          <Field label="Description/filter"><Input value={form.filter} onChange={e => setForm({...form, filter:e.target.value})}/></Field>
          <Field label="Icon"><Input value={form.icon} onChange={e => setForm({...form, icon:e.target.value})}/></Field>
          <Field label="Display order"><Input type="number" value={form.displayOrder} onChange={e => setForm({...form, displayOrder:Number(e.target.value)})}/></Field>
          <div className="flex items-center justify-between rounded-lg border px-3"><Label>Active</Label><Switch checked={form.isActive} onCheckedChange={value => setForm({...form, isActive:value})}/></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save changes"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
