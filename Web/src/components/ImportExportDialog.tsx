import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// ── Types ──
interface ImportError {
  row: number;
  column: string;
  value: string;
  message: string;
  severity: "error" | "warning";
}

interface ImportJob {
  status: "idle" | "validating" | "validated" | "importing" | "completed" | "failed";
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  importedRows: number;
  errors: ImportError[];
  progress: number;
}

const moduleEntities: Record<string, string[]> = {
  Finance: ["Chart of Accounts", "Journal Entries", "Cost Centers", "Budget Lines", "Fixed Assets"],
  Sales: ["Customers", "Sales Orders", "Quotations", "Price Lists", "Leads"],
  Inventory: ["Items", "Warehouses", "Stock Adjustments", "Batch Records", "Reorder Rules"],
  HR: ["Employees", "Departments", "Positions", "Leave Balances", "Pay Grades"],
  Procurement: ["Suppliers", "Purchase Orders", "Contracts", "Price Agreements"],
  Production: ["Bill of Materials", "Work Centers", "Routing", "Work Orders"],
  Quality: ["Inspection Plans", "Standards", "Calibration Records"],
};

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultModule?: string;
  defaultMode?: "import" | "export";
}

const ImportExportDialog = ({ open, onOpenChange, defaultModule, defaultMode = "import" }: ImportExportDialogProps) => {
  const [module, setModule] = useState(defaultModule || "");
  const [entity, setEntity] = useState("");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [job, setJob] = useState<ImportJob>({
    status: "idle",
    fileName: "",
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    importedRows: 0,
    errors: [],
    progress: 0,
  });

  const resetJob = () => {
    setJob({ status: "idle", fileName: "", totalRows: 0, validRows: 0, errorRows: 0, importedRows: 0, errors: [], progress: 0 });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) return;

    // Simulate validation
    setJob(prev => ({ ...prev, status: "validating", fileName: file.name, progress: 0 }));

    // Mock validation result
    setTimeout(() => {
      const mockTotal = Math.floor(Math.random() * 200) + 50;
      const mockErrors: ImportError[] = [
        { row: 12, column: "Email", value: "invalid-email", message: "Invalid email format", severity: "error" },
        { row: 45, column: "Amount", value: "abc", message: "Expected numeric value", severity: "error" },
        { row: 78, column: "Date", value: "2026-13-01", message: "Invalid date (month > 12)", severity: "error" },
        { row: 23, column: "Code", value: "DUP-001", message: "Duplicate code found", severity: "warning" },
      ];
      setJob({
        status: "validated",
        fileName: file.name,
        totalRows: mockTotal,
        validRows: mockTotal - 3,
        errorRows: 3,
        importedRows: 0,
        errors: mockErrors,
        progress: 100,
      });
    }, 1500);
  };

  const handleConfirmImport = () => {
    setJob(prev => ({ ...prev, status: "importing", progress: 0 }));

    // Simulate import progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setJob(prev => ({
          ...prev,
          status: "completed",
          importedRows: prev.validRows,
          progress: 100,
        }));
      } else {
        setJob(prev => ({ ...prev, progress }));
      }
    }, 400);
  };

  const handleExport = () => {
    // In production, this calls dataImportService.exportData()
    // Mock: trigger download
    const mockCsv = "Column1,Column2,Column3\nValue1,Value2,Value3\n";
    const blob = new Blob([mockCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module}_${entity}_export.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const entities = module ? (moduleEntities[module] || []) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Data Import / Export
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultMode} className="space-y-4">
          <TabsList>
            <TabsTrigger value="import" className="gap-1.5"><Upload className="w-3.5 h-3.5" /> Import</TabsTrigger>
            <TabsTrigger value="export" className="gap-1.5"><Download className="w-3.5 h-3.5" /> Export</TabsTrigger>
          </TabsList>

          {/* ── Import Tab ── */}
          <TabsContent value="import" className="space-y-4">
            {/* Module & Entity selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Module</Label>
                <Select value={module} onValueChange={(v) => { setModule(v); setEntity(""); resetJob(); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select module..." /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(moduleEntities).map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Entity Type</Label>
                <Select value={entity} onValueChange={setEntity} disabled={!module}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select entity..." /></SelectTrigger>
                  <SelectContent>
                    {entities.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Download template link */}
            {entity && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-info/5 border border-info/20">
                <FileText className="w-4 h-4 text-info" />
                <span className="text-xs text-info">
                  Download the <button className="underline font-medium">import template</button> for {entity} to see required columns and formatting.
                </span>
              </div>
            )}

            {/* File upload */}
            {entity && job.status === "idle" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Drag & drop a CSV or Excel file</p>
                <p className="text-xs text-muted-foreground mt-1">Or click to browse — Max 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {/* Validating state */}
            {job.status === "validating" && (
              <div className="p-6 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
                <p className="text-sm font-medium text-foreground">Validating {job.fileName}...</p>
                <Progress value={50} className="max-w-xs mx-auto" />
              </div>
            )}

            {/* Validation results */}
            {(job.status === "validated" || job.status === "importing" || job.status === "completed") && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                  <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{job.fileName}</p>
                    <p className="text-xs text-muted-foreground">{module} → {entity}</p>
                  </div>
                  {job.status === "validated" && (
                    <Button variant="ghost" size="sm" onClick={resetJob}><X className="w-4 h-4" /></Button>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                    <p className="text-lg font-bold text-foreground">{job.totalRows}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Total Rows</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
                    <p className="text-lg font-bold text-success">{job.validRows}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Valid</p>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
                    <p className="text-lg font-bold text-destructive">{job.errorRows}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Errors</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <p className="text-lg font-bold text-primary">{job.importedRows}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Imported</p>
                  </div>
                </div>

                {/* Import progress */}
                {job.status === "importing" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm text-foreground">Importing records...</span>
                    </div>
                    <Progress value={job.progress} />
                  </div>
                )}

                {/* Completed */}
                {job.status === "completed" && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span className="text-sm font-medium text-success">
                      Successfully imported {job.importedRows} records!
                    </span>
                  </div>
                )}

                {/* Errors list */}
                {job.errors.length > 0 && job.status !== "completed" && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Validation Issues</p>
                    <div className="rounded-lg border border-border overflow-hidden max-h-40 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Row</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Column</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Value</th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Issue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.errors.map((err, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="px-3 py-1.5 font-mono">{err.row}</td>
                              <td className="px-3 py-1.5">{err.column}</td>
                              <td className="px-3 py-1.5 font-mono text-muted-foreground">{err.value}</td>
                              <td className="px-3 py-1.5 flex items-center gap-1">
                                {err.severity === "error" ? (
                                  <AlertTriangle className="w-3 h-3 text-destructive" />
                                ) : (
                                  <AlertTriangle className="w-3 h-3 text-warning" />
                                )}
                                {err.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm button */}
            {job.status === "validated" && (
              <DialogFooter>
                <Button variant="outline" onClick={resetJob}>Cancel</Button>
                <Button onClick={handleConfirmImport} disabled={job.validRows === 0}>
                  <Upload className="w-4 h-4 mr-1" /> Import {job.validRows} Records
                </Button>
              </DialogFooter>
            )}
          </TabsContent>

          {/* ── Export Tab ── */}
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Module</Label>
                <Select value={module} onValueChange={(v) => { setModule(v); setEntity(""); }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select module..." /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(moduleEntities).map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Entity Type</Label>
                <Select value={entity} onValueChange={setEntity} disabled={!module}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select entity..." /></SelectTrigger>
                  <SelectContent>
                    {entities.map(e => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "csv" | "xlsx")}>
                <SelectTrigger className="w-40 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleExport} disabled={!module || !entity}>
                <Download className="w-4 h-4 mr-1" /> Export {entity || "Data"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExportDialog;
