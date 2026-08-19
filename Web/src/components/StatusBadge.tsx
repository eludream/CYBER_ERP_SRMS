import { cn } from "@/lib/utils";

const StatusBadge = ({ status, label }: { status: string; label?: string }) => {
  const colors: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    completed: "bg-success/10 text-success border-success/20",
    paid: "bg-success/10 text-success border-success/20",
    approved: "bg-success/10 text-success border-success/20",
    closed: "bg-success/10 text-success border-success/20",
    current: "bg-success/10 text-success border-success/20",
    compliant: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning border-warning/20",
    "pending audit": "bg-warning/10 text-warning border-warning/20",
    "due soon": "bg-warning/10 text-warning border-warning/20",
    "on hold": "bg-warning/10 text-warning border-warning/20",
    "in progress": "bg-info/10 text-info border-info/20",
    "capa pending": "bg-info/10 text-info border-info/20",
    processing: "bg-info/10 text-info border-info/20",
    open: "bg-info/10 text-info border-info/20",
    draft: "bg-muted text-muted-foreground border-border",
    "under review": "bg-muted text-muted-foreground border-border",
    overdue: "bg-destructive/10 text-destructive border-destructive/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
    "non-compliant": "bg-destructive/10 text-destructive border-destructive/20",
    low: "bg-destructive/10 text-destructive border-destructive/20",
    high: "bg-success/10 text-success border-success/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    critical: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const colorClass = colors[status.toLowerCase()] || "bg-secondary text-secondary-foreground border-border";

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide",
      colorClass
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        colorClass.includes("text-success") ? "bg-success" :
        colorClass.includes("text-warning") ? "bg-warning" :
        colorClass.includes("text-info") ? "bg-info" :
        colorClass.includes("text-destructive") ? "bg-destructive" :
        "bg-muted-foreground"
      )} />
      {label || status}
    </span>
  );
};

export default StatusBadge;
