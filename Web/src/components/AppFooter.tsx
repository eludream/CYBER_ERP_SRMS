import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type AppFooterProps = {
  className?: string;
  productName?: string;
  companyName?: string;
};

const AppFooter = ({
  className,
  productName = "CyberERP",
  companyName = "CyberERP",
}: AppFooterProps) => (
  <footer className={cn("border-t border-border/70 bg-card/60", className)}>
    <div className="flex min-h-12 w-full flex-col items-center justify-between gap-2 px-6 py-3 text-xs text-muted-foreground sm:flex-row lg:px-8">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
        <span>© {new Date().getFullYear()} {companyName}</span>
        <span className="hidden text-border sm:inline">•</span>
        <span>{productName} Enterprise Platform</span>
      </div>
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Secure · Reliable · Auditable</span>
      </div>
    </div>
  </footer>
);

export default AppFooter;
