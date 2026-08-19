import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Search, Download, CalendarIcon, ChevronDown, ChevronRight,
  Info, AlertTriangle, XCircle, Shield, Clock
} from "lucide-react";
import { coreAdminService } from "@/services/api/coreAdminService";

type Severity = "Info" | "Warning" | "Error" | "Critical";

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  detail: string;
  severity: Severity;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, string>;
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "2026-03-08 09:15:32", user: "admin@cybererp.com", action: "Login", module: "Auth", detail: "Successful login from 192.168.1.45", severity: "Info", ipAddress: "192.168.1.45", userAgent: "Chrome/120 Windows", metadata: { method: "Password + 2FA" } },
  { id: "2", timestamp: "2026-03-08 09:10:45", user: "chidi@cybererp.com", action: "Export", module: "Reports", detail: "Monthly P&L exported as PDF", severity: "Info", ipAddress: "10.0.0.23", userAgent: "Firefox/119 Linux", metadata: { format: "PDF", report: "Profit & Loss" } },
  { id: "3", timestamp: "2026-03-08 08:55:12", user: "system", action: "Backup", module: "System", detail: "Daily backup completed — 2.4 GB", severity: "Info", ipAddress: "127.0.0.1", userAgent: "System/Scheduler", metadata: { size: "2.4 GB", duration: "4m 12s" } },
  { id: "4", timestamp: "2026-03-08 08:45:00", user: "halima@cybererp.com", action: "Login Failed", module: "Auth", detail: "Failed login attempt — wrong password (attempt 4/5)", severity: "Warning", ipAddress: "192.168.1.88", userAgent: "Chrome/120 Windows", metadata: { attempts: "4", maxAttempts: "5" } },
  { id: "5", timestamp: "2026-03-08 08:30:00", user: "adaeze@cybererp.com", action: "Record Update", module: "HR", detail: "Employee record updated: Emeka Obi — salary adjustment", severity: "Info", ipAddress: "10.0.0.12", userAgent: "Safari/17 macOS", metadata: { employeeId: "EMP-1042", field: "salary" } },
  { id: "6", timestamp: "2026-03-08 08:20:15", user: "halima@cybererp.com", action: "Account Locked", module: "Auth", detail: "Account locked after 5 failed login attempts", severity: "Critical", ipAddress: "192.168.1.88", userAgent: "Chrome/120 Windows", metadata: { lockDuration: "30 min" } },
  { id: "7", timestamp: "2026-03-08 07:00:00", user: "fatima@cybererp.com", action: "Approval", module: "Workflow", detail: "Approved PO-1892 — Steel Supplies Co ($45,200)", severity: "Info", ipAddress: "192.168.1.101", userAgent: "Firefox/119 Linux", metadata: { documentId: "PO-1892", amount: "$45,200" } },
  { id: "8", timestamp: "2026-03-08 03:00:00", user: "system", action: "Maintenance", module: "System", detail: "Scheduled maintenance window — DB vacuum and index rebuild", severity: "Info", ipAddress: "127.0.0.1", userAgent: "System/Scheduler", metadata: { duration: "18m 34s" } },
  { id: "9", timestamp: "2026-03-07 23:45:00", user: "system", action: "Error", module: "Finance", detail: "Email notification failed for INV-3042 — SMTP timeout", severity: "Error", ipAddress: "127.0.0.1", userAgent: "System/Mailer", metadata: { invoiceId: "INV-3042", error: "SMTP connection timed out after 30s" } },
  { id: "10", timestamp: "2026-03-07 22:10:00", user: "admin@cybererp.com", action: "Role Changed", module: "Security", detail: "Changed role for chidi@cybererp.com: Viewer → Analyst", severity: "Warning", ipAddress: "192.168.1.45", userAgent: "Chrome/120 Windows", metadata: { targetUser: "chidi@cybererp.com", oldRole: "Viewer", newRole: "Analyst" } },
  { id: "11", timestamp: "2026-03-07 18:30:00", user: "emeka@cybererp.com", action: "Unauthorized Access", module: "Security", detail: "Attempted access to /security/settings — insufficient permissions", severity: "Critical", ipAddress: "10.0.0.55", userAgent: "Chrome/120 Windows", metadata: { route: "/security/settings", requiredRole: "System Admin" } },
  { id: "12", timestamp: "2026-03-07 17:45:00", user: "chidi@cybererp.com", action: "Logout", module: "Auth", detail: "User logged out", severity: "Info", ipAddress: "10.0.0.23", userAgent: "Firefox/119 Linux" },
];

const severityConfig: Record<Severity, { color: string; icon: typeof Info }> = {
  Info: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Info },
  Warning: { color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  Error: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  Critical: { color: "bg-red-600/10 text-red-600 border-red-600/20", icon: Shield },
};

const SystemLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    coreAdminService.getLoginLogs()
      .then(({ data }) => setLogs(data.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        user: log.user || log.userNameAttempted,
        action: log.status === "Success" ? "Login" : "Login Failed",
        module: "Auth",
        detail: log.status === "Success" ? "Successful login" : (log.failureReason || "Authentication failed"),
        severity: log.status === "Success" ? "Info" : "Warning",
        ipAddress: log.ipAddress,
        userAgent: log.userAgent || "Unknown",
        metadata: { eventType: log.eventType, attemptedUser: log.userNameAttempted },
      }))))
      .catch(error => toast.error("Unable to load login logs", { description: error instanceof Error ? error.message : undefined }));
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const modules = [...new Set(logs.map(l => l.module))];

  const filtered = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      log.user.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.detail.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q);
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    const logDate = new Date(log.timestamp);
    const matchesFrom = !dateFrom || logDate >= dateFrom;
    const matchesTo = !dateTo || logDate <= new Date(dateTo.getTime() + 86400000);
    return matchesSearch && matchesSeverity && matchesModule && matchesFrom && matchesTo;
  });

  const handleExport = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Module", "Detail", "Severity", "IP Address"].join(","),
      ...filtered.map(l =>
        [l.timestamp, l.user, l.action, l.module, `"${l.detail}"`, l.severity, l.ipAddress].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} log entries`);
  };

  const severityCounts = {
    Info: logs.filter(l => l.severity === "Info").length,
    Warning: logs.filter(l => l.severity === "Warning").length,
    Error: logs.filter(l => l.severity === "Error").length,
    Critical: logs.filter(l => l.severity === "Critical").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">System Logs</h1>
          <p className="text-muted-foreground text-sm">Audit trail and system activity monitoring</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Severity summary */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries(severityCounts) as [Severity, number][]).map(([sev, count]) => {
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;
          return (
            <button key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                severityFilter === sev ? cfg.color : "border-border text-muted-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {sev}: {count}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs by user, action, or detail..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal text-xs", !dateFrom && "text-muted-foreground")}>
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {dateFrom ? format(dateFrom, "MMM d") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal text-xs", !dateTo && "text-muted-foreground")}>
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {dateTo ? format(dateTo, "MMM d") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className={cn("p-3 pointer-events-auto")} />
          </PopoverContent>
        </Popover>
        {(dateFrom || dateTo || severityFilter !== "all" || moduleFilter !== "all") && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
            setDateFrom(undefined); setDateTo(undefined); setSeverityFilter("all"); setModuleFilter("all");
          }}>
            Clear filters
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} entries</p>

      {/* Log Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-left">
              <th className="px-3 py-2.5 w-8" />
              <th className="px-3 py-2.5 font-medium">Timestamp</th>
              <th className="px-3 py-2.5 font-medium">User</th>
              <th className="px-3 py-2.5 font-medium">Action</th>
              <th className="px-3 py-2.5 font-medium hidden md:table-cell">Module</th>
              <th className="px-3 py-2.5 font-medium hidden lg:table-cell">Detail</th>
              <th className="px-3 py-2.5 font-medium">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(log => {
              const cfg = severityConfig[log.severity];
              const Icon = cfg.icon;
              const isExpanded = expandedRows.has(log.id);
              return (
                <tr key={log.id} className="group">
                  <td colSpan={7} className="p-0">
                    <div
                      className="grid hover:bg-muted/30 transition-colors cursor-pointer"
                      style={{ gridTemplateColumns: "2rem 1fr 1fr 1fr 1fr 2fr auto" }}
                      onClick={() => toggleRow(log.id)}
                    >
                      <div className="px-3 py-2.5 flex items-center">
                        {isExpanded
                          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className="px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />{log.timestamp}
                      </div>
                      <div className="px-3 py-2.5 text-foreground truncate">{log.user}</div>
                      <div className="px-3 py-2.5 font-medium text-foreground">{log.action}</div>
                      <div className="px-3 py-2.5 hidden md:block">
                        <Badge variant="secondary" className="text-[10px] font-normal">{log.module}</Badge>
                      </div>
                      <div className="px-3 py-2.5 text-muted-foreground truncate hidden lg:block">{log.detail}</div>
                      <div className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${cfg.color}`}>
                          <Icon className="h-2.5 w-2.5" />{log.severity}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-12 pb-3 pt-0 bg-muted/20 border-t border-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-muted-foreground font-medium mb-0.5">IP Address</p>
                            <p className="font-mono text-foreground">{log.ipAddress}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium mb-0.5">User Agent</p>
                            <p className="text-foreground">{log.userAgent}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium mb-0.5">Full Detail</p>
                            <p className="text-foreground">{log.detail}</p>
                          </div>
                          {log.metadata && Object.entries(log.metadata).map(([k, v]) => (
                            <div key={k}>
                              <p className="text-muted-foreground font-medium mb-0.5 capitalize">{k}</p>
                              <p className="text-foreground">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No log entries match your filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemLogs;
