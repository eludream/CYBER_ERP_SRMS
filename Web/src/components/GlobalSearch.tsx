import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2, FileText, ArrowRight, Clock, Filter } from "lucide-react";
import { DollarSign, Package, Users, ShoppingCart, Truck, Factory, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { searchService, SearchResult, SearchModule } from "@/services/api/searchService";

const moduleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  all:         { label: "All Modules",  icon: Search,       color: "text-muted-foreground" },
  finance:     { label: "Finance",      icon: DollarSign,   color: "text-emerald-500" },
  inventory:   { label: "Inventory",    icon: Package,      color: "text-blue-500" },
  hr:          { label: "HR",           icon: Users,        color: "text-violet-500" },
  sales:       { label: "Sales",        icon: ShoppingCart,  color: "text-amber-500" },
  procurement: { label: "Procurement",  icon: Truck,        color: "text-orange-500" },
  production:  { label: "Production",   icon: Factory,      color: "text-rose-500" },
  quality:     { label: "Quality",      icon: Shield,       color: "text-teal-500" },
};

const moduleKeys: SearchModule[] = ["all", "finance", "inventory", "hr", "sales", "procurement", "production", "quality"];

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [module, setModule] = useState<SearchModule>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [took, setTook] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("erp_recent_searches") || "[]");
    } catch {
      return [];
    }
  });

  const doSearch = useCallback(async (q: string, mod: SearchModule) => {
    if (!q.trim()) {
      setResults([]);
      setTotalResults(0);
      setTook(0);
      return;
    }
    setLoading(true);
    try {
      const res = await searchService.search({ query: q, module: mod, pageSize: 8 });
      if (res.success) {
        setResults(res.data.results);
        setTotalResults(res.data.stats.totalResults);
        setTook(res.data.stats.took);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => doSearch(query, module), 200);
    return () => clearTimeout(timer);
  }, [query, module, doSearch]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setModule("all");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const saveRecent = (q: string) => {
    const recent = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    localStorage.setItem("erp_recent_searches", JSON.stringify(recent));
  };

  const handleSelect = (result: SearchResult) => {
    saveRecent(query);
    onOpenChange(false);
    navigate(result.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (["active", "paid", "approved", "accepted", "closed", "confirmed", "in stock"].includes(s)) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    if (["pending", "draft", "sent", "open"].includes(s)) return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    if (["in progress", "partial"].includes(s)) return "bg-blue-500/15 text-blue-700 dark:text-blue-400";
    if (["rejected", "cancelled", "blocked"].includes(s)) return "bg-destructive/15 text-destructive";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden rounded-xl [&>button]:hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search documents, records, employees..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {query && !loading && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Module filter pills */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border overflow-x-auto scrollbar-hide">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0 mr-1" />
          {moduleKeys.map(key => {
            const cfg = moduleConfig[key];
            const Icon = cfg.icon;
            const active = module === key;
            return (
              <button
                key={key}
                onClick={() => { setModule(key); setSelectedIndex(0); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {/* No query — show recent searches */}
          {!query && recentSearches.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Recent Searches</p>
              {recentSearches.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(s)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Clock className="w-3 h-3" /> {s}
                </button>
              ))}
            </div>
          )}

          {/* No query, no recent */}
          {!query && recentSearches.length === 0 && (
            <div className="px-4 py-10 text-center">
              <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Type to search across all ERP modules</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Search by reference number, name, description, or status</p>
            </div>
          )}

          {/* Has query but no results */}
          {query && !loading && results.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">No results for "<span className="font-medium text-foreground">{query}</span>"</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try different keywords or broaden the module filter</p>
            </div>
          )}

          {/* Results list */}
          {results.map((result, idx) => {
            const cfg = moduleConfig[result.module] || moduleConfig.all;
            const ModIcon = cfg.icon;
            return (
              <button
                key={result.id}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-start gap-3 w-full px-4 py-3 text-left transition-colors ${
                  idx === selectedIndex ? "bg-accent" : "hover:bg-muted/50"
                }`}
              >
                <div className={`mt-0.5 w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0`}>
                  <ModIcon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{result.title}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${getStatusColor(result.status)}`}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{result.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground/70 font-mono">{result.referenceNo}</span>
                    <span className="text-[10px] text-muted-foreground/50">•</span>
                    <span className="text-[10px] text-muted-foreground/70">{result.documentType}</span>
                  </div>
                </div>
                <ArrowRight className={`w-4 h-4 mt-2 shrink-0 transition-opacity ${idx === selectedIndex ? "text-muted-foreground opacity-100" : "opacity-0"}`} />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {query && results.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
            <span className="text-[10px] text-muted-foreground">
              {totalResults} result{totalResults !== 1 ? "s" : ""} in {took}ms
            </span>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↵</kbd> Open</span>
              <span><kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">ESC</kbd> Close</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearch;
