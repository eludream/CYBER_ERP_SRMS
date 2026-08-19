import { ComponentType, SVGProps, useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type LucideIconPreviewProps = {
  name: string;
  className?: string;
};

const LucideIconPreview = ({ name, className }: LucideIconPreviewProps) => {
  const [Icon, setIcon] = useState<IconComponent | null>(null);

  useEffect(() => {
    let active = true;
    const loader = dynamicIconImports[name as keyof typeof dynamicIconImports];

    setIcon(null);
    if (!loader) return () => { active = false; };

    void loader().then((module) => {
      if (active) setIcon(() => module.default as IconComponent);
    });

    return () => { active = false; };
  }, [name]);

  if (!Icon) {
    return <CircleHelp className={cn("text-muted-foreground", className)} aria-hidden="true" />;
  }

  return <Icon className={className} aria-hidden="true" />;
};

export default LucideIconPreview;
