import { useLocation, Link } from "react-router-dom";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { modules } from "@/config/modules";
import { useAuth } from "@/contexts/AuthContext";

const Breadcrumbs = () => {
  const location = useLocation();
  const { selectedModule } = useAuth();
  
  const currentModule = modules.find(m => m.id === selectedModule);
  const currentSub = currentModule?.subModules.find(s => s.path === location.pathname);
  const currentCategory = currentModule?.categories.find(c => 
    c.items.some(i => i.path === location.pathname)
  );

  if (!currentModule) return null;

  const ModuleIcon = currentModule.icon;

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      {/* Home pill */}
      <Link
        to="/subsystems"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="text-xs font-medium hidden lg:inline">Sub Systems</span>
      </Link>

      <ChevronRight className="w-3 h-3 text-muted-foreground/40" />

      {/* Module */}
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-muted-foreground">
        <ModuleIcon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold">{currentModule.title}</span>
      </span>

      {/* Category */}
      {currentCategory && (
        <>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
          <span className="px-2 py-1 text-xs text-muted-foreground font-medium">
            {currentCategory.category}
          </span>
        </>
      )}

      {/* Current page */}
      {currentSub && (
        <>
          <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
          <span className="px-2.5 py-1 rounded-md bg-primary/8 text-primary text-xs font-semibold">
            {currentSub.title}
          </span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumbs;
