import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingIndicatorVariant = "page" | "panel" | "inline";

interface LoadingIndicatorProps {
  title?: string;
  description?: string;
  variant?: LoadingIndicatorVariant;
  className?: string;
}

const defaults = {
  page: { title: "Loading your workspace", description: "Getting everything ready..." },
  panel: { title: "Loading", description: "Fetching the latest information..." },
};

export default function LoadingIndicator({
  title,
  description,
  variant = "panel",
  className,
}: LoadingIndicatorProps) {
  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2", className)} role="status" aria-live="polite">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        {title && <span>{title}</span>}
        {!title && <span className="sr-only">Loading</span>}
      </span>
    );
  }

  const copy = defaults[variant];
  return (
    <div className={cn("flex items-center justify-center", variant === "page" ? "min-h-[50vh] p-8" : "p-8", className)} role="status" aria-live="polite">
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card px-7 py-6 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <div className="flex items-center gap-4">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
            <LoaderCircle className="relative h-6 w-6 animate-spin" aria-hidden="true" />
          </span>
          <span className="text-left">
            <span className="block text-sm font-semibold text-foreground">{title || copy.title}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{description || copy.description}</span>
          </span>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-primary/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/70" />
        </div>
      </div>
    </div>
  );
}
