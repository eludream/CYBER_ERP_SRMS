import { useState, ReactNode } from "react";
import { GripVertical, X, Plus, RotateCcw, Settings2, Pin, PinOff, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Types ──

export interface DashboardWidget {
  id: string;
  title: string;
  type: string;
  size: "sm" | "md" | "lg" | "full";
  pinned: boolean;
  visible: boolean;
  order: number;
  component: ReactNode;
}

interface DashboardCustomizerProps {
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
  availableWidgets?: { id: string; title: string; type: string; component: ReactNode }[];
  storageKey: string;
}

const sizeClasses: Record<string, string> = {
  sm: "col-span-1",
  md: "col-span-1 lg:col-span-2",
  lg: "col-span-1 lg:col-span-2 xl:col-span-3",
  full: "col-span-full",
};

const DashboardCustomizer = ({ widgets, onWidgetsChange, availableWidgets = [], storageKey }: DashboardCustomizerProps) => {
  const [editMode, setEditMode] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => {
      // Pinned widgets first, then by order
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.order - b.order;
    });

  const hiddenWidgets = widgets.filter(w => !w.visible);

  const updateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    const updated = widgets.map(w => w.id === id ? { ...w, ...updates } : w);
    onWidgetsChange(updated);
    saveToStorage(updated);
  };

  const removeWidget = (id: string) => {
    updateWidget(id, { visible: false });
  };

  const addWidget = (id: string) => {
    const maxOrder = Math.max(...widgets.map(w => w.order), 0);
    updateWidget(id, { visible: true, order: maxOrder + 1 });
  };

  const toggleSize = (id: string) => {
    const widget = widgets.find(w => w.id === id);
    if (!widget) return;
    const sizes: DashboardWidget["size"][] = ["sm", "md", "lg", "full"];
    const currentIdx = sizes.indexOf(widget.size);
    const nextSize = sizes[(currentIdx + 1) % sizes.length];
    updateWidget(id, { size: nextSize });
  };

  const resetLayout = () => {
    const reset = widgets.map((w, i) => ({ ...w, visible: true, pinned: false, order: i, size: "md" as const }));
    onWidgetsChange(reset);
    saveToStorage(reset);
  };

  const saveToStorage = (ws: DashboardWidget[]) => {
    const layout = ws.map(w => ({ id: w.id, size: w.size, pinned: w.pinned, visible: w.visible, order: w.order }));
    localStorage.setItem(`dashboard_layout_${storageKey}`, JSON.stringify(layout));
  };

  // Simple drag reorder
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
  };
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const draggedWidget = widgets.find(w => w.id === draggedId);
    const targetWidget = widgets.find(w => w.id === targetId);
    if (!draggedWidget || !targetWidget) return;

    const updated = widgets.map(w => {
      if (w.id === draggedId) return { ...w, order: targetWidget.order };
      if (w.id === targetId) return { ...w, order: draggedWidget.order };
      return w;
    });
    onWidgetsChange(updated);
    saveToStorage(updated);
    setDraggedId(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        {editMode && (
          <>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Widget
            </Button>
            <Button variant="outline" size="sm" onClick={resetLayout} className="gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </>
        )}
        <Button
          variant={editMode ? "default" : "outline"}
          size="sm"
          onClick={() => setEditMode(!editMode)}
          className="gap-1"
        >
          <Settings2 className="w-3.5 h-3.5" />
          {editMode ? "Done" : "Customize"}
        </Button>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.id}
            className={cn(
              sizeClasses[widget.size],
              "relative group",
              editMode && "ring-2 ring-dashed ring-border rounded-xl",
              draggedId === widget.id && "opacity-50",
            )}
            draggable={editMode}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={(e) => handleDragOver(e, widget.id)}
            onDrop={() => handleDrop(widget.id)}
          >
            {/* Edit overlay */}
            {editMode && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1 rounded bg-card/90 border border-border shadow-sm hover:bg-muted"
                  onClick={() => updateWidget(widget.id, { pinned: !widget.pinned })}
                  title={widget.pinned ? "Unpin" : "Pin to top"}
                >
                  {widget.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                </button>
                <button
                  className="p-1 rounded bg-card/90 border border-border shadow-sm hover:bg-muted"
                  onClick={() => toggleSize(widget.id)}
                  title="Change size"
                >
                  {widget.size === "full" ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>
                <button
                  className="p-1 rounded bg-card/90 border border-border shadow-sm hover:bg-destructive/10 text-destructive"
                  onClick={() => removeWidget(widget.id)}
                  title="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {editMode && (
              <div className="absolute top-2 left-2 z-10 cursor-grab">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            )}

            {/* Pinned indicator */}
            {widget.pinned && !editMode && (
              <div className="absolute top-2 right-2 z-10">
                <Pin className="w-3 h-3 text-primary" />
              </div>
            )}

            {widget.component}
          </div>
        ))}
      </div>

      {/* Add Widget Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {hiddenWidgets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">All widgets are already visible.</p>
            )}
            {hiddenWidgets.map((w) => (
              <button
                key={w.id}
                onClick={() => { addWidget(w.id); setAddDialogOpen(false); }}
                className="flex items-center gap-3 w-full p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors text-left"
              >
                <Plus className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{w.title}</p>
                  <p className="text-xs text-muted-foreground">{w.type}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardCustomizer;

/** Helper to load saved layout from localStorage */
export function loadDashboardLayout(storageKey: string, defaultWidgets: DashboardWidget[]): DashboardWidget[] {
  try {
    const saved = localStorage.getItem(`dashboard_layout_${storageKey}`);
    if (!saved) return defaultWidgets;

    const layout = JSON.parse(saved) as { id: string; size: string; pinned: boolean; visible: boolean; order: number }[];
    return defaultWidgets.map(w => {
      const savedWidget = layout.find(s => s.id === w.id);
      if (savedWidget) {
        return {
          ...w,
          size: savedWidget.size as DashboardWidget["size"],
          pinned: savedWidget.pinned,
          visible: savedWidget.visible,
          order: savedWidget.order,
        };
      }
      return w;
    });
  } catch {
    return defaultWidgets;
  }
}
