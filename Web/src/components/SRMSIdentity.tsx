import { cn } from "@/lib/utils";
import { useSystemResourceRouting } from "@/contexts/SystemResourceRoutingContext";

type SRMSIdentityProps = {
  className?: string;
  showFullName?: boolean;
};

const SRMSIdentity = ({ className, showFullName = true }: SRMSIdentityProps) => {
  const { abbreviation, name } = useSystemResourceRouting();
  return (
    <div className={cn("min-w-0 leading-tight", className)} aria-label={`${abbreviation} — ${name}`}>
      <p className="font-display text-xs font-bold tracking-wide text-foreground">{abbreviation}</p>
      {showFullName && <p className="truncate text-[10px] text-muted-foreground">{name}</p>}
    </div>
  );
};

export default SRMSIdentity;
