import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText, Search, Filter, Link2, Unlink, ExternalLink, CheckCircle2,
  AlertCircle, Package, Users, ShoppingCart, Truck, Factory, Shield, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  documentTypeRegistry,
  assignFormToDocumentType,
  getModulesWithDocumentTypes,
  type DocumentType,
} from "@/config/documentTypes";
import { mockFormList } from "@/data/formDesignerData";

const moduleIcons: Record<string, React.ElementType> = {
  finance: Globe, inventory: Package, hr: Users, sales: ShoppingCart,
  procurement: Truck, production: Factory, quality: Shield,
};

const moduleLabels: Record<string, string> = {
  finance: "Finance", inventory: "Inventory", hr: "HR", sales: "Sales",
  procurement: "Procurement", production: "Production", quality: "Quality",
};

const DocumentTypesManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [bindingFilter, setBindingFilter] = useState<"all" | "bound" | "unbound">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkFormId, setBulkFormId] = useState<string>("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [singleBindOpen, setSingleBindOpen] = useState(false);
  const [editingDt, setEditingDt] = useState<DocumentType | null>(null);
  const [singleFormId, setSingleFormId] = useState<string>("");
  // force re-render after mutation
  const [, setTick] = useState(0);

  const modules = getModulesWithDocumentTypes();

  const publishedForms = useMemo(
    () => mockFormList.filter((f) => f.status === "published"),
    []
  );

  const filtered = useMemo(() => {
    return documentTypeRegistry.filter((dt) => {
      if (moduleFilter !== "all" && dt.module !== moduleFilter) return false;
      if (bindingFilter === "bound" && !dt.assignedFormId) return false;
      if (bindingFilter === "unbound" && dt.assignedFormId) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          dt.label.toLowerCase().includes(q) ||
          dt.entity.toLowerCase().includes(q) ||
          dt.numberPrefix.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, moduleFilter, bindingFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((dt) => dt.id)));
    }
  };

  const getFormName = (formId: string | null) => {
    if (!formId) return null;
    return mockFormList.find((f) => f.id === formId)?.name ?? formId;
  };

  const handleSingleBind = () => {
    if (!editingDt) return;
    assignFormToDocumentType(editingDt.id, singleFormId === "__none__" ? null : singleFormId || null);
    setTick((t) => t + 1);
    setSingleBindOpen(false);
    toast.success(
      singleFormId && singleFormId !== "__none__"
        ? `Bound "${getFormName(singleFormId)}" to ${editingDt.label}`
        : `Unbound form from ${editingDt.label}`
    );
  };

  const handleBulkBind = () => {
    selected.forEach((id) => assignFormToDocumentType(id, bulkFormId || null));
    setTick((t) => t + 1);
    setBulkDialogOpen(false);
    setSelected(new Set());
    toast.success(
      bulkFormId
        ? `Bound form to ${selected.size} document types`
        : `Unbound forms from ${selected.size} document types`
    );
  };

  const handleBulkUnbind = () => {
    selected.forEach((id) => assignFormToDocumentType(id, null));
    setTick((t) => t + 1);
    setSelected(new Set());
    toast.success(`Unbound ${selected.size} document types`);
  };

  const boundCount = documentTypeRegistry.filter((dt) => dt.assignedFormId).length;
  const totalCount = documentTypeRegistry.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Document Types</h1>
        <p className="text-muted-foreground text-sm">
          Manage form bindings across all modules — {boundCount} of {totalCount} document types have custom forms assigned
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground">Total Types</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{boundCount}</p>
          <p className="text-xs text-muted-foreground">With Forms</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalCount - boundCount}</p>
          <p className="text-xs text-muted-foreground">Using Default</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{modules.length}</p>
          <p className="text-xs text-muted-foreground">Modules</p>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search document types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>
                {moduleLabels[m] ?? m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={bindingFilter} onValueChange={(v) => setBindingFilter(v as any)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="bound">Bound</SelectItem>
            <SelectItem value="unbound">Unbound</SelectItem>
          </SelectContent>
        </Select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setBulkDialogOpen(true)}>
              <Link2 className="h-3.5 w-3.5" /> Bind Form
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={handleBulkUnbind}>
              <Unlink className="h-3.5 w-3.5" /> Unbind
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Assigned Form</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((dt) => {
              const ModIcon = moduleIcons[dt.module] ?? FileText;
              const formName = getFormName(dt.assignedFormId);
              return (
                <TableRow key={dt.id} className={selected.has(dt.id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox checked={selected.has(dt.id)} onCheckedChange={() => toggleSelect(dt.id)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <dt.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{dt.label}</p>
                        <p className="text-xs text-muted-foreground">{dt.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ModIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm capitalize">{dt.module}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {dt.numberPrefix}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formName ? (
                      <button
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                        onClick={() => navigate(`/forms/designer/${dt.assignedFormId}`)}
                      >
                        {formName}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Default form</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {dt.assignedFormId ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Bound
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <AlertCircle className="h-3 w-3" /> Unbound
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs"
                      onClick={() => {
                        setEditingDt(dt);
                        setSingleFormId(dt.assignedFormId ?? "");
                        setSingleBindOpen(true);
                      }}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      {dt.assignedFormId ? "Change" : "Bind"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No document types match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Single Bind Dialog */}
      <Dialog open={singleBindOpen} onOpenChange={setSingleBindOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDt?.assignedFormId ? "Change" : "Assign"} Form — {editingDt?.label}
            </DialogTitle>
            <DialogDescription>
              Select a published form to use as the entry screen for this document type.
            </DialogDescription>
          </DialogHeader>
          <Select value={singleFormId || "__none__"} onValueChange={setSingleFormId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a form..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Use Default —</SelectItem>
              {publishedForms.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleBindOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSingleBind}>
              {singleFormId && singleFormId !== "__none__" ? "Assign Form" : "Remove Binding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Bind Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Assign Form</DialogTitle>
            <DialogDescription>
              Assign the same form to {selected.size} selected document types.
            </DialogDescription>
          </DialogHeader>
          <Select value={bulkFormId} onValueChange={setBulkFormId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a form..." />
            </SelectTrigger>
            <SelectContent>
              {publishedForms.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkBind} disabled={!bulkFormId}>
              Assign to {selected.size} Types
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentTypesManagement;
