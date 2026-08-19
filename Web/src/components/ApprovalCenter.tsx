import { useState } from "react";
import { useERP } from "@/contexts/ERPContext";
import { ShieldCheck, Check, X, ChevronDown, DollarSign, FileText, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/finance/FinanceWidgets";

const typeIcons: Record<string, typeof FileText> = {
  journal_entry: DollarSign,
  purchase_requisition: FileText,
  leave_request: Calendar,
  expense_claim: DollarSign,
  sales_order: FileText,
  ncr_disposition: AlertTriangle,
};

const typeLabels: Record<string, string> = {
  journal_entry: "Journal Entry",
  purchase_requisition: "Purchase Requisition",
  leave_request: "Leave Request",
  expense_claim: "Expense Claim",
  sales_order: "Sales Order",
  ncr_disposition: "NCR Disposition",
};

const priorityColors: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-warning/10 text-warning border-warning/20",
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Critical: "bg-destructive text-destructive-foreground",
};

const ApprovalCenter = () => {
  const { approvals, pendingApprovalCount, approveRequest, rejectRequest } = useERP();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const filtered = filter === "pending"
    ? approvals.filter(a => a.status === "Pending")
    : approvals;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-ring"
      >
        <ShieldCheck className="w-[18px] h-[18px]" />
        {pendingApprovalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-warning text-warning-foreground text-[10px] font-bold px-1">
            {pendingApprovalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-[420px] max-h-[520px] rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-sm">Approval Center</h3>
                {pendingApprovalCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-warning/10 text-warning text-[10px] font-bold">
                    {pendingApprovalCount} pending
                  </span>
                )}
              </div>
            </div>

            <div className="px-4 py-2 border-b border-border flex gap-2">
              {(["pending", "all"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "pending" ? `Pending (${pendingApprovalCount})` : "All"}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No {filter === "pending" ? "pending " : ""}approvals
                </div>
              ) : (
                filtered.map(a => {
                  const TypeIcon = typeIcons[a.type] || FileText;
                  return (
                    <div key={a.id} className="px-4 py-3 border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 text-primary">
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold leading-tight">{a.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                            </div>
                            {a.amount && (
                              <span className="font-display font-bold text-sm shrink-0">
                                {formatCurrency(a.amount)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                              {typeLabels[a.type]}
                            </span>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold border", priorityColors[a.priority])}>
                              {a.priority}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              by {a.requestedBy}
                            </span>
                          </div>
                          {a.status === "Pending" && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
                                onClick={() => rejectRequest(a.id)}
                              >
                                <X className="w-3 h-3 mr-1" /> Reject
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90"
                                onClick={() => approveRequest(a.id)}
                              >
                                <Check className="w-3 h-3 mr-1" /> Approve
                              </Button>
                            </div>
                          )}
                          {a.status !== "Pending" && (
                            <span className={cn(
                              "mt-2 inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold",
                              a.status === "Approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                            )}>
                              {a.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ApprovalCenter;
