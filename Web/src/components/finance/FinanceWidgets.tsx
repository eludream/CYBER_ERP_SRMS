import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Search, Filter, Plus, Download, Upload, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export const PageHeader = ({ title, description, children }: PageHeaderProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-display font-bold">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
  </div>
);

interface ActionToolbarProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onAdd?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onRefresh?: () => void;
  addLabel?: string;
  searchPlaceholder?: string;
  children?: ReactNode;
}

export const ActionToolbar = ({
  onSearch, onFilter, onAdd, onExport, onImport, onRefresh,
  addLabel = "Add New", searchPlaceholder = "Search...", children
}: ActionToolbarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
        {onSearch && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); onSearch(e.target.value); }}
              className="pl-9 h-9 bg-muted border-border text-sm"
            />
          </div>
        )}
        {onFilter && (
          <Button variant="outline" size="sm" onClick={onFilter} className="h-9">
            <Filter className="w-4 h-4 mr-1" /> Filter
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh} className="h-9">
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport} className="h-9">
            <Upload className="w-4 h-4 mr-1" /> Import
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} className="h-9">
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        )}
        {onAdd && (
          <Button size="sm" onClick={onAdd} className="h-9 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" /> {addLabel}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
};

export const formatCurrency = (amount: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

interface MiniBarChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export const MiniBarChart = ({ data, color = "bg-primary/40", height = 40 }: MiniBarChartProps) => {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((v, i) => (
        <div
          key={i}
          className={cn("flex-1 rounded-t-sm transition-all hover:opacity-80", color)}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  );
};

interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export const TabBar = ({ tabs, active, onChange }: TabBarProps) => (
  <div className="flex gap-1 border-b border-border">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          "px-4 py-2.5 text-sm font-medium transition-colors relative",
          active === tab.id
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span className={cn(
            "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
            active === tab.id ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
          )}>
            {tab.count}
          </span>
        )}
        {active === tab.id && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
        )}
      </button>
    ))}
  </div>
);

interface SummaryRowProps {
  items: { label: string; value: string; sub?: string; color?: string }[];
}

export const SummaryRow = ({ items }: SummaryRowProps) => (
  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
    {items.map((item, i) => (
      <div key={i} className="rounded-lg border border-border bg-card/50 p-4">
        <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
        <p className={cn("text-lg font-display font-bold", item.color || "text-foreground")}>{item.value}</p>
        {item.sub && <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>}
      </div>
    ))}
  </div>
);

interface AgingBucket {
  label: string;
  amount: number;
  count: number;
  color: string;
}

export const AgingChart = ({ buckets }: { buckets: AgingBucket[] }) => {
  const total = buckets.reduce((s, b) => s + b.amount, 0);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display font-semibold text-sm mb-4">Aging Analysis</h3>
      <div className="flex h-3 rounded-full overflow-hidden mb-4 bg-secondary">
        {buckets.map((b, i) => (
          <div key={i} className={cn("transition-all", b.color)} style={{ width: `${(b.amount / total) * 100}%` }} />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {buckets.map((b, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 rounded-full", b.color)} />
              <span className="text-xs text-muted-foreground">{b.label}</span>
            </div>
            <p className="text-sm font-display font-semibold">{formatCurrency(b.amount)}</p>
            <p className="text-xs text-muted-foreground">{b.count} invoices</p>
          </div>
        ))}
      </div>
    </div>
  );
};
