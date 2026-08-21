import { Search, Sun, Moon, Monitor, Command, Upload } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import NotificationPanel from "@/components/NotificationPanel";
import ApprovalCenter from "@/components/ApprovalCenter";
import GlobalSearch from "@/components/GlobalSearch";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ImportExportDialog from "@/components/ImportExportDialog";
import AccountMenu from "@/components/AccountMenu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import SRMSIdentity from "@/components/SRMSIdentity";
import { cn } from "@/lib/utils";

const AppHeader = ({ standalone = false }: { standalone?: boolean }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [importExportOpen, setImportExportOpen] = useState(false);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        e.stopPropagation();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  return (
    <>
      <header className={cn(
        "flex h-12 shrink-0 items-center gap-1 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20",
        standalone ? "px-4" : "pl-14 pr-2 md:px-4",
      )}>
        <SRMSIdentity className="mr-3 hidden lg:block" />
        <Separator orientation="vertical" className="mr-3 hidden h-5 lg:block" />
        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 h-8 px-3 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 text-xs group"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Search...</span>
          <kbd className="hidden xl:inline-flex items-center gap-0.5 ml-4 px-1.5 py-0.5 rounded bg-background border border-border text-[10px] font-mono text-muted-foreground/70">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <div className="flex-1" />

        {/* Action buttons row */}
        <div className="flex items-center gap-0.5">
          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {resolvedTheme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={() => setTheme("light")} className={`gap-2 text-xs ${theme === "light" ? "bg-accent" : ""}`}>
                <Sun className="w-3.5 h-3.5" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className={`gap-2 text-xs ${theme === "dark" ? "bg-accent" : ""}`}>
                <Moon className="w-3.5 h-3.5" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className={`gap-2 text-xs ${theme === "system" ? "bg-accent" : ""}`}>
                <Monitor className="w-3.5 h-3.5" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Import/Export */}
          <button
            onClick={() => setImportExportOpen(true)}
            className="hidden w-8 h-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors sm:flex"
            title="Import / Export"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Language Switcher */}
          <div className="hidden sm:block"><LanguageSwitcher /></div>

          {/* Approval Center */}
          <ApprovalCenter />

          {/* Notifications */}
          <NotificationPanel />

          <Separator orientation="vertical" className="h-5 mx-1.5" />

          {/* The same authenticated-user menu is used in every solution header. */}
          <AccountMenu />
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Import/Export Dialog */}
      <ImportExportDialog open={importExportOpen} onOpenChange={setImportExportOpen} />
    </>
  );
};

export default AppHeader;
