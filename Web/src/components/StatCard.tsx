import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

const StatCard = ({ title, value, change, trend = "neutral", icon: Icon, iconColor = "text-primary" }: StatCardProps) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="group rounded-xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center transition-colors group-hover:bg-primary/10",
          iconColor
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
            trend === "up" ? "bg-success/10 text-success" : trend === "down" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
          )}>
            <TrendIcon className="w-3 h-3" />
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-foreground leading-none">{value}</p>
      <p className="text-[13px] text-muted-foreground mt-1.5">{title}</p>
    </div>
  );
};

export default StatCard;
