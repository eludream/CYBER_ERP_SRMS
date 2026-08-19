import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import LoadingIndicator from "@/components/LoadingIndicator";
import { matchesModuleBasePath, moduleBasePath } from "@/config/routes";
import { moduleService, type SystemResourceRouteDto } from "@/services/api/moduleService";

type SystemResourceRoutingValue = SystemResourceRouteDto & {
  basePath: string;
};

const SystemResourceRoutingContext = createContext<SystemResourceRoutingValue | null>(null);

export const useSystemResourceRouting = () => {
  const context = useContext(SystemResourceRoutingContext);
  if (!context) throw new Error("useSystemResourceRouting must be used within SystemResourceRoutingProvider");
  return context;
};

const routingErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to load the System Resource application route.";

export const SystemResourceRoutingProvider = ({ children }: { children: ReactNode }) => {
  const [resource, setResource] = useState<SystemResourceRouteDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    moduleService.systemResource()
      .then(({ data }) => {
        if (!active) return;
        moduleBasePath(data.abbreviation);
        setResource(data);
      })
      .catch(caught => {
        if (active) setError(routingErrorMessage(caught));
      });
    return () => { active = false; };
  }, []);

  const value = useMemo<SystemResourceRoutingValue | null>(() => {
    if (!resource) return null;
    return { ...resource, basePath: moduleBasePath(resource.abbreviation) };
  }, [resource]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="max-w-lg rounded-lg border bg-card p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Application route unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </section>
      </main>
    );
  }

  if (!value) return <LoadingIndicator variant="page" title="Loading application route" description="Reading the System Resource abbreviation..." />;

  return <SystemResourceRoutingContext.Provider value={value}>{children}</SystemResourceRoutingContext.Provider>;
};

export const resolveSystemResourceLocation = (basePath: string) => {
  const { pathname, search, hash } = window.location;
  const slug = basePath.replace(/^\//, "");
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0] ?? "";

  if (!first) return { action: "login" as const };

  if (first.toLowerCase() === slug && first !== slug) {
    const rest = segments.slice(1).join("/");
    return { action: "redirect" as const, href: `${basePath}${rest ? `/${rest}` : ""}${search}${hash}` };
  }

  if (matchesModuleBasePath(pathname, basePath)) return { action: "app" as const };

  return { action: "not-found" as const };
};
