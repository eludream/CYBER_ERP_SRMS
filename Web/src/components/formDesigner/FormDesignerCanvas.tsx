import { useState, useCallback, useEffect } from "react";
import { 
  Type, Hash, Mail, Phone, Calendar, Clock, AlignLeft, ChevronDown, List, 
  CheckSquare, Circle, Link, Upload, Image, FileText, Search, PenTool, Star, Palette,
  DollarSign, Package, BookOpen, Box, User, Truck, Users, Warehouse, Target, Receipt,
  Columns3, Minus, Heading, Space, Info, GripVertical, Trash2, Copy, Settings,
  Eye, Save, ArrowLeft, Undo2, Redo2, Plus, SquareDashedBottom, Columns, Layout, Repeat,
  Sparkles, ChevronRight, Zap, MousePointerClick, PanelLeft, PanelRight, Layers, GitBranch,
  SlidersHorizontal, Keyboard, CheckCircle, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { fieldPalette } from "@/data/formDesignerData";
import { documentTypeRegistry, assignFormToDocumentType, type DocumentType } from "@/config/documentTypes";
import { saveVersionSnapshot, diffSchemas } from "@/data/formVersionHistory";
import VersionHistoryPanel from "@/components/formDesigner/VersionHistoryPanel";
import type { FormFieldDefinition, FormSchema, FormFieldType, FieldPaletteItem, ValidationRule, FieldOption } from "@/types/formDesigner";

// ── Icon map ────────────────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  Type, Hash, Mail, Phone, Calendar, Clock, AlignLeft, ChevronDown, List,
  CheckSquare, Circle, Link, Upload, Image, FileText, Search, PenTool, Star, Palette,
  DollarSign, Package, BookOpen, Box, User, Truck, Users, Warehouse, Target, Receipt,
  Columns3, Minus, Heading, Space, Info, SquareDashedBottom, Columns, Layout, Repeat,
};

const getIcon = (name: string) => iconMap[name] || Type;

// ── Generate unique ID ──────────────────────────────────────
let fieldCounter = 100;
const generateId = () => `field_${Date.now()}_${fieldCounter++}`;

const generateName = (type: FormFieldType, label: string) =>
  label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || type;

// ── Default field factory ───────────────────────────────────
function createFieldFromPalette(item: FieldPaletteItem, order: number): FormFieldDefinition {
  const id = generateId();
  return {
    id,
    type: item.type,
    label: item.label,
    name: generateName(item.type, item.label),
    width: item.category === "layout" ? "full" : "half",
    order,
    validations: [],
    options: ["select", "multiselect", "radio"].includes(item.type)
      ? [{ label: "Option 1", value: "option_1" }, { label: "Option 2", value: "option_2" }]
      : undefined,
    columnCount: item.type === "columns" ? 2 : undefined,
    children: ["section", "tab", "columns", "repeater"].includes(item.type) ? [] : undefined,
    minRows: item.type === "repeater" ? 1 : undefined,
    maxRows: item.type === "repeater" ? 10 : undefined,
    addButtonText: item.type === "repeater" ? "Add Row" : undefined,
  };
}

// ── Props ───────────────────────────────────────────────────
interface FormDesignerCanvasProps {
  schema: FormSchema;
  onSchemaChange: (schema: FormSchema) => void;
  onBack: () => void;
}

const FormDesignerCanvas = ({ schema, onSchemaChange, onBack }: FormDesignerCanvasProps) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<FormSchema[]>([]);
  const [redoStack, setRedoStack] = useState<FormSchema[]>([]);
  const [showPalette, setShowPalette] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["basic"]);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSavedSchema, setLastSavedSchema] = useState<FormSchema | null>(null);

  const selectedField = schema.fields.find(f => f.id === selectedFieldId) || null;

  // ── Undo/Redo ─────────────────────────────────────────────
  const pushUndo = useCallback((prev: FormSchema) => {
    setUndoStack(s => [...s.slice(-20), prev]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(s => [...s, schema]);
    setUndoStack(s => s.slice(0, -1));
    onSchemaChange(prev);
  }, [undoStack, schema, onSchemaChange]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(s => [...s, schema]);
    setRedoStack(s => s.slice(0, -1));
    onSchemaChange(next);
  }, [redoStack, schema, onSchemaChange]);

  // ── Field operations ──────────────────────────────────────
  const updateFields = useCallback((fields: FormFieldDefinition[]) => {
    pushUndo(schema);
    onSchemaChange({ ...schema, fields });
  }, [schema, onSchemaChange, pushUndo]);

  const addField = useCallback((item: FieldPaletteItem) => {
    const newField = createFieldFromPalette(item, schema.fields.length);
    updateFields([...schema.fields, newField]);
    setSelectedFieldId(newField.id);
    setShowProperties(true);
  }, [schema.fields, updateFields]);

  const removeField = useCallback((id: string) => {
    updateFields(schema.fields.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }, [schema.fields, updateFields, selectedFieldId]);

  const duplicateField = useCallback((id: string) => {
    const field = schema.fields.find(f => f.id === id);
    if (!field) return;
    const newField: FormFieldDefinition = {
      ...field,
      id: generateId(),
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
      order: schema.fields.length,
    };
    updateFields([...schema.fields, newField]);
    setSelectedFieldId(newField.id);
  }, [schema.fields, updateFields]);

  const updateField = useCallback((id: string, updates: Partial<FormFieldDefinition>) => {
    pushUndo(schema);
    onSchemaChange({
      ...schema,
      fields: schema.fields.map(f => f.id === id ? { ...f, ...updates } : f),
    });
  }, [schema, onSchemaChange, pushUndo]);

  const moveField = useCallback((fromIndex: number, toIndex: number) => {
    const fields = [...schema.fields];
    const [moved] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, moved);
    updateFields(fields.map((f, i) => ({ ...f, order: i })));
  }, [schema.fields, updateFields]);

  // ── Drag handlers ─────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, data: string) => {
    e.dataTransfer.setData("text/plain", data);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCanvasDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleCanvasDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const data = e.dataTransfer.getData("text/plain");

    if (data.startsWith("palette:")) {
      const [, catId, fieldIdx] = data.split(":");
      const cat = fieldPalette.find(c => c.id === catId);
      const item = cat?.fields[parseInt(fieldIdx)];
      if (item) {
        const newField = createFieldFromPalette(item, targetIndex);
        const fields = [...schema.fields];
        fields.splice(targetIndex, 0, newField);
        updateFields(fields.map((f, i) => ({ ...f, order: i })));
        setSelectedFieldId(newField.id);
      }
      return;
    }

    if (data.startsWith("field:")) {
      const fromIndex = parseInt(data.split(":")[1]);
      if (fromIndex !== targetIndex) moveField(fromIndex, targetIndex);
    }
  };

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const isMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Z / Ctrl+Shift+Z
      if (isMeta && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (isMeta && e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); return; }
      if (isMeta && e.key === "y") { e.preventDefault(); redo(); return; }

      // Delete / Backspace selected field
      if ((e.key === "Delete" || e.key === "Backspace") && selectedFieldId) {
        e.preventDefault();
        removeField(selectedFieldId);
        return;
      }

      // Ctrl+D duplicate
      if (isMeta && e.key === "d" && selectedFieldId) {
        e.preventDefault();
        duplicateField(selectedFieldId);
        return;
      }

      // Arrow keys to move selected field
      if (selectedFieldId && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        e.preventDefault();
        const idx = schema.fields.findIndex(f => f.id === selectedFieldId);
        if (idx < 0) return;
        const target = e.key === "ArrowUp" ? idx - 1 : idx + 1;
        if (target >= 0 && target < schema.fields.length) {
          moveField(idx, target);
        }
        return;
      }

      // Escape to deselect
      if (e.key === "Escape") {
        setSelectedFieldId(null);
        setShowSettings(false);
        setShowShortcuts(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedFieldId, removeField, duplicateField, moveField, schema.fields]);

  const layoutFields = ["section", "tab", "columns", "divider", "heading", "spacer", "infoPanel"];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full bg-background">
        {/* ── Top Toolbar ──────────────────────────────────── */}
        <div className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0 shadow-sm">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-4 h-4 text-primary shrink-0" />
              <h2 className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: "var(--font-display)" }}>
                {schema.name}
              </h2>
            </div>
            <Badge 
              variant={schema.status === "published" ? "default" : "secondary"} 
              className={cn(
                "text-[10px] font-medium shrink-0",
                schema.status === "published" && "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
              )}
            >
              {schema.status === "draft" && "Draft"}
              {schema.status === "published" && "Published"}
              {schema.status === "archived" && "Archived"}
            </Badge>
            <span className="text-[11px] text-muted-foreground shrink-0">v{schema.version}</span>
            <span className="text-[11px] text-muted-foreground shrink-0">· {schema.fields.length} fields</span>
          </div>

          <div className="flex items-center gap-1">
            {!previewMode && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPalette(!showPalette)}>
                      <PanelLeft className={cn("w-4 h-4", showPalette ? "text-primary" : "text-muted-foreground")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Toggle field palette</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowProperties(!showProperties)}>
                      <PanelRight className={cn("w-4 h-4", showProperties ? "text-primary" : "text-muted-foreground")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Toggle properties</TooltipContent>
                </Tooltip>
                
                <div className="h-6 w-px bg-border mx-1" />
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={undoStack.length === 0}>
                  <Undo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Undo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0}>
                  <Redo2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Redo</TooltipContent>
            </Tooltip>
            
            <div className="h-6 w-px bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowShortcuts(!showShortcuts)}>
                  <Keyboard className={cn("w-4 h-4", showShortcuts ? "text-primary" : "text-muted-foreground")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Keyboard shortcuts</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(!showHistory)}>
                  <History className={cn("w-4 h-4", showHistory ? "text-primary" : "text-muted-foreground")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Version history</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(!showSettings)}>
                  <SlidersHorizontal className={cn("w-4 h-4", showSettings ? "text-primary" : "text-muted-foreground")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Form settings</TooltipContent>
            </Tooltip>

            <div className="h-6 w-px bg-border mx-1" />

            <Button 
              variant={previewMode ? "default" : "outline"} 
              size="sm" 
              className="gap-1.5 text-xs h-8"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="w-3.5 h-3.5" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90"
              onClick={() => {
                // Create version snapshot on save
                if (lastSavedSchema) {
                  const diff = diffSchemas(lastSavedSchema, schema);
                  saveVersionSnapshot(schema, diff.changeType, diff.changeSummary, {
                    fieldsAdded: diff.fieldsAdded,
                    fieldsRemoved: diff.fieldsRemoved,
                    fieldsModified: diff.fieldsModified,
                  });
                } else {
                  saveVersionSnapshot(schema, "created", `Form saved with ${schema.fields.length} fields`);
                }
                setLastSavedSchema(JSON.parse(JSON.stringify(schema)));
              }}
            >
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Field Palette ─────────────────────────────── */}
          {!previewMode && showPalette && (
            <div className="w-[260px] border-r border-border bg-card flex flex-col shrink-0">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground tracking-wide uppercase" style={{ fontFamily: "var(--font-display)" }}>
                    Components
                  </h3>
                </div>
                <p className="text-[11px] text-muted-foreground">Drag or click to add fields</p>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="px-3 pb-4 space-y-1">
                  {fieldPalette.map(cat => {
                    const isExpanded = expandedCategories.includes(cat.id);
                    const CatIcon = getIcon(cat.icon);
                    return (
                      <Collapsible key={cat.id} open={isExpanded} onOpenChange={() => toggleCategory(cat.id)}>
                        <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-accent/60 transition-colors group">
                          <ChevronRight className={cn(
                            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                            isExpanded && "rotate-90"
                          )} />
                          <CatIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-[11px] font-semibold text-foreground flex-1 text-left">{cat.label}</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">
                            {cat.fields.length}
                          </Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid grid-cols-2 gap-1.5 pt-1.5 pb-2 px-1">
                            {cat.fields.map((item, idx) => {
                              const Icon = getIcon(item.icon);
                              return (
                                <div
                                  key={item.type}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, `palette:${cat.id}:${idx}`)}
                                  onClick={() => addField(item)}
                                  className={cn(
                                    "flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border border-border/60",
                                    "bg-background cursor-grab active:cursor-grabbing",
                                    "hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
                                    "transition-all duration-150 group/item"
                                  )}
                                >
                                  <div className="w-7 h-7 rounded-md bg-muted/80 flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/item:text-primary transition-colors" />
                                  </div>
                                  <span className="text-[10px] font-medium text-foreground text-center leading-tight">{item.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* ── Canvas ────────────────────────────────────── */}
          <div className="flex-1 overflow-auto bg-muted/30">
            <div className="p-8">
              <div className="max-w-2xl mx-auto">
                {/* Form header card */}
                {!previewMode && (
                  <div className="mb-6 bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
                    <div>
                      <Input
                        value={schema.name}
                        onChange={(e) => onSchemaChange({ ...schema, name: e.target.value })}
                        className="border-none text-lg font-bold text-foreground p-0 h-auto focus-visible:ring-0 mb-1"
                        style={{ fontFamily: "var(--font-display)" }}
                        placeholder="Form name..."
                      />
                      <Input
                        value={schema.description || ""}
                        onChange={(e) => onSchemaChange({ ...schema, description: e.target.value })}
                        className="border-none text-sm text-muted-foreground p-0 h-auto focus-visible:ring-0"
                        placeholder="Add a description..."
                      />
                    </div>

                    {/* Workflow settings */}
                    <div className="border border-border rounded-lg p-3.5 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-[hsl(var(--success))]" />
                          <div>
                            <p className="text-xs font-semibold text-foreground">Approval Workflow</p>
                            <p className="text-[10px] text-muted-foreground">Auto-create approval task on submission</p>
                          </div>
                        </div>
                        <Switch
                          checked={schema.triggerWorkflowOnSubmit || false}
                          onCheckedChange={(v) => onSchemaChange({ ...schema, triggerWorkflowOnSubmit: v, workflowId: v ? (schema.workflowId || undefined) : undefined })}
                        />
                      </div>
                      {schema.triggerWorkflowOnSubmit && (
                        <div className="mt-3 space-y-1.5">
                          <Label className="text-[11px] font-medium text-muted-foreground">Approval Chain</Label>
                          <Select
                            value={schema.workflowId || ""}
                            onValueChange={(v) => onSchemaChange({ ...schema, workflowId: v || undefined })}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Select approval chain..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ac-1">Purchase Order Approval</SelectItem>
                              <SelectItem value="ac-2">Leave Request Approval</SelectItem>
                              <SelectItem value="ac-3">Journal Entry Posting</SelectItem>
                              <SelectItem value="ac-4">NCR Disposition</SelectItem>
                            </SelectContent>
                          </Select>
                          {schema.workflowId && (
                            <p className="text-[10px] text-[hsl(var(--success))] flex items-center gap-1 mt-1">
                              <GitBranch className="w-3 h-3" />
                              Submissions will be routed to the first approver in this chain
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Drop zone */}
                <div
                  className="grid grid-cols-12 gap-2 items-start"
                  onDragOver={(e) => { e.preventDefault(); }}
                >
                  {schema.fields.length === 0 && (
                    <div
                      className="col-span-12 border-2 border-dashed border-border rounded-2xl p-16 text-center bg-card/50 transition-colors"
                      onDragOver={(e) => handleCanvasDragOver(e, 0)}
                      onDragLeave={() => setDragOverIndex(null)}
                      onDrop={(e) => handleCanvasDrop(e, 0)}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <MousePointerClick className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>
                        Start building your form
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                        Drag fields from the component palette or click them to add to your canvas
                      </p>
                    </div>
                  )}

                  {schema.fields.map((field, index) => {
                    const colSpan = {
                      full: "col-span-12",
                      half: "col-span-12 md:col-span-6",
                      third: "col-span-12 md:col-span-4",
                      quarter: "col-span-12 md:col-span-3",
                    }[field.width] || "col-span-12";

                    return (
                      <div key={field.id} className={cn(colSpan, "relative group/drop")}>
                        {/* Drop indicator - full left edge for grid reorder */}
                        <div
                          className={cn(
                            "absolute -left-1 top-0 bottom-0 w-2 z-10 rounded-full transition-all duration-200",
                            dragOverIndex === index ? "bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]" : "bg-transparent"
                          )}
                        />
                        {/* Drop zone overlay - covers entire cell */}
                        <div
                          className="absolute inset-0 z-[5]"
                          style={{ pointerEvents: "none" }}
                        />
                        <div
                          className="absolute -top-2 left-0 right-0 h-4 z-10"
                          onDragOver={(e) => handleCanvasDragOver(e, index)}
                          onDragLeave={() => setDragOverIndex(null)}
                          onDrop={(e) => handleCanvasDrop(e, index)}
                        />

                        {previewMode ? (
                          <PreviewField field={field} />
                        ) : (
                          <CanvasFieldCard
                            field={field}
                            index={index}
                            isSelected={selectedFieldId === field.id}
                            hasConditions={(field.conditions?.length || 0) > 0}
                            onSelect={() => {
                              setSelectedFieldId(field.id);
                              setShowProperties(true);
                            }}
                            onRemove={() => removeField(field.id)}
                            onDuplicate={() => duplicateField(field.id)}
                            onDragStart={handleDragStart}
                            onLabelChange={(label) => updateField(field.id, { label, name: generateName(field.type, label) })}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Final drop zone */}
                  {schema.fields.length > 0 && (
                    <div
                      className={cn(
                        "col-span-12 h-16 border-2 border-dashed rounded-xl transition-all duration-200 flex items-center justify-center",
                        dragOverIndex === schema.fields.length
                          ? "border-primary/60 bg-primary/5"
                          : "border-transparent hover:border-border/50"
                      )}
                      onDragOver={(e) => handleCanvasDragOver(e, schema.fields.length)}
                      onDragLeave={() => setDragOverIndex(null)}
                      onDrop={(e) => handleCanvasDrop(e, schema.fields.length)}
                    >
                      {dragOverIndex === schema.fields.length && (
                        <p className="text-xs text-primary font-medium">Drop here</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Property Panel ────────────────────────────── */}
          {!previewMode && showProperties && selectedField && (
            <div className="w-[320px] border-l border-border bg-card flex flex-col shrink-0">
              <div className="h-12 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <p className="text-xs font-bold text-foreground tracking-wide uppercase" style={{ fontFamily: "var(--font-display)" }}>
                    Properties
                  </p>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">{selectedField.type}</Badge>
              </div>
              <ScrollArea className="flex-1">
                <PropertyPanel field={selectedField} allFields={schema.fields} onChange={(updates) => updateField(selectedField.id, updates)} />
              </ScrollArea>
            </div>
          )}

          {/* Empty state for property panel */}
          {!previewMode && showProperties && !selectedField && (
            <div className="w-[320px] border-l border-border bg-card flex flex-col items-center justify-center shrink-0">
              <div className="text-center px-8">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <MousePointerClick className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-xs font-semibold text-foreground mb-1">No field selected</p>
                <p className="text-[11px] text-muted-foreground">Click a field on the canvas to edit its properties</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Form Settings Panel (overlay) ──────────────── */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSettings(false)}>
            <div className="bg-card border border-border rounded-2xl shadow-xl w-[520px] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Form Settings</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSettings(false)}>
                  <span className="sr-only">Close</span>×
                </Button>
              </div>
              <div className="p-6 space-y-5">
                {/* Document Type Binding */}
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs font-bold text-foreground">Document Type Binding</p>
                      <p className="text-[10px] text-muted-foreground">Assign this form to a document type — it will replace the default entry screen</p>
                    </div>
                  </div>
                  <Select
                    value={
                      documentTypeRegistry.find(dt => dt.assignedFormId === schema.id)?.id || "_none"
                    }
                    onValueChange={(v) => {
                      // Unassign from any previous document type
                      documentTypeRegistry.forEach(dt => {
                        if (dt.assignedFormId === schema.id) {
                          assignFormToDocumentType(dt.id, null);
                        }
                      });
                      // Assign to new
                      if (v !== "_none") {
                        assignFormToDocumentType(v, schema.id);
                        // Update schema module/entity to match
                        const dt = documentTypeRegistry.find(d => d.id === v);
                        if (dt) {
                          onSchemaChange({ ...schema, module: dt.module, entity: dt.entity });
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select document type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Not assigned</SelectItem>
                      {documentTypeRegistry.filter(dt => dt.customizable).map(dt => {
                        const Icon = dt.icon;
                        const isOccupied = dt.assignedFormId && dt.assignedFormId !== schema.id;
                        return (
                          <SelectItem key={dt.id} value={dt.id} disabled={!!isOccupied} className="text-xs">
                            <span className="flex items-center gap-2">
                              <span className="capitalize">{dt.module}</span> → {dt.label}
                              {isOccupied && <span className="text-muted-foreground">(assigned)</span>}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {documentTypeRegistry.find(dt => dt.assignedFormId === schema.id) && (
                    <p className="text-[10px] text-[hsl(var(--success))] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      This form will be used when creating new "{documentTypeRegistry.find(dt => dt.assignedFormId === schema.id)?.label}" documents
                    </p>
                  )}
                </div>

                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Submit Button Text</Label>
                    <Input
                      value={schema.settings.submitButtonText}
                      onChange={(e) => onSchemaChange({ ...schema, settings: { ...schema.settings, submitButtonText: e.target.value } })}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Cancel Button Text</Label>
                    <Input
                      value={schema.settings.cancelButtonText}
                      onChange={(e) => onSchemaChange({ ...schema, settings: { ...schema.settings, cancelButtonText: e.target.value } })}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Success Message</Label>
                  <Textarea
                    value={schema.settings.successMessage}
                    onChange={(e) => onSchemaChange({ ...schema, settings: { ...schema.settings, successMessage: e.target.value } })}
                    className="text-sm min-h-[60px] resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Redirect URL (after submit)</Label>
                  <Input
                    value={schema.settings.redirectUrl || ""}
                    onChange={(e) => onSchemaChange({ ...schema, settings: { ...schema.settings, redirectUrl: e.target.value || undefined } })}
                    placeholder="https://..."
                    className="h-9 text-sm font-mono"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium">Allow Draft Saving</Label>
                      <p className="text-[10px] text-muted-foreground">Users can save incomplete forms</p>
                    </div>
                    <Switch checked={schema.settings.allowDraft} onCheckedChange={(v) => onSchemaChange({ ...schema, settings: { ...schema.settings, allowDraft: v } })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium">Allow Print</Label>
                      <p className="text-[10px] text-muted-foreground">Show print button on form</p>
                    </div>
                    <Switch checked={schema.settings.allowPrint} onCheckedChange={(v) => onSchemaChange({ ...schema, settings: { ...schema.settings, allowPrint: v } })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium">Allow Export</Label>
                      <p className="text-[10px] text-muted-foreground">Allow exporting submissions</p>
                    </div>
                    <Switch checked={schema.settings.allowExport} onCheckedChange={(v) => onSchemaChange({ ...schema, settings: { ...schema.settings, allowExport: v } })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium">Show Progress Bar</Label>
                      <p className="text-[10px] text-muted-foreground">For wizard/multi-step layouts</p>
                    </div>
                    <Switch checked={schema.settings.showProgressBar} onCheckedChange={(v) => onSchemaChange({ ...schema, settings: { ...schema.settings, showProgressBar: v } })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium">Notify on Submit</Label>
                      <p className="text-[10px] text-muted-foreground">Send email notification</p>
                    </div>
                    <Switch checked={schema.settings.notifyOnSubmit} onCheckedChange={(v) => onSchemaChange({ ...schema, settings: { ...schema.settings, notifyOnSubmit: v } })} />
                  </div>
                </div>

                {schema.settings.notifyOnSubmit && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Notification Emails (comma-separated)</Label>
                    <Input
                      value={(schema.settings.notifyEmails || []).join(", ")}
                      onChange={(e) => onSchemaChange({ ...schema, settings: { ...schema.settings, notifyEmails: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } })}
                      placeholder="admin@company.com, manager@company.com"
                      className="h-9 text-sm"
                    />
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Max Submissions</Label>
                    <Input
                      type="number"
                      value={schema.settings.maxSubmissions ?? ""}
                      onChange={(e) => onSchemaChange({ ...schema, settings: { ...schema.settings, maxSubmissions: e.target.value ? parseInt(e.target.value) : undefined } })}
                      placeholder="Unlimited"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-muted-foreground">Layout</Label>
                    <Select value={schema.layout} onValueChange={(v) => onSchemaChange({ ...schema, layout: v as FormSchema["layout"] })}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Page</SelectItem>
                        <SelectItem value="tabs">Tabs</SelectItem>
                        <SelectItem value="wizard">Wizard</SelectItem>
                        <SelectItem value="multi-column">Multi-Column</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Custom CSS</Label>
                  <Textarea
                    value={schema.settings.customCss || ""}
                    onChange={(e) => onSchemaChange({ ...schema, settings: { ...schema.settings, customCss: e.target.value || undefined } })}
                    placeholder=".form-container { ... }"
                    className="text-xs font-mono min-h-[60px] resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Keyboard Shortcuts Dialog ──────────────────── */}
        {showShortcuts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShortcuts(false)}>
            <div className="bg-card border border-border rounded-2xl shadow-xl w-[400px]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Keyboard Shortcuts</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowShortcuts(false)}>
                  <span className="sr-only">Close</span>×
                </Button>
              </div>
              <div className="p-6 space-y-3">
                {[
                  ["Ctrl + Z", "Undo"],
                  ["Ctrl + Shift + Z", "Redo"],
                  ["Ctrl + D", "Duplicate field"],
                  ["Delete / Backspace", "Remove field"],
                  ["↑ / ↓", "Move field up/down"],
                  ["Escape", "Deselect / Close"],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{desc}</span>
                    <kbd className="text-[10px] font-mono bg-muted border border-border rounded px-2 py-1 text-foreground">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Version History Panel ────────────────────────── */}
      <VersionHistoryPanel
        formId={schema.id}
        currentSchema={schema}
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onRestore={(restoredSchema) => {
          pushUndo(schema);
          onSchemaChange(restoredSchema);
          setLastSavedSchema(JSON.parse(JSON.stringify(restoredSchema)));
          setShowHistory(false);
        }}
      />
    </TooltipProvider>
  );
};

// ── Canvas Field Card (WYSIWYG) ─────────────────────────────

interface CanvasFieldCardProps {
  field: FormFieldDefinition;
  index: number;
  isSelected: boolean;
  hasConditions: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onDragStart: (e: React.DragEvent, data: string) => void;
  onLabelChange: (label: string) => void;
}

const CanvasFieldCard = ({ field, index, isSelected, hasConditions, onSelect, onRemove, onDuplicate, onDragStart, onLabelChange }: CanvasFieldCardProps) => {
  const isRequired = field.validations.some(v => v.type === "required");

  return (
    <div
      className={cn(
        "group relative rounded-xl border transition-all duration-200 cursor-pointer",
        isSelected
          ? "border-primary bg-card shadow-[0_0_0_1px_hsl(var(--primary)),0_4px_12px_hsl(var(--primary)/0.1)]"
          : "border-border/60 bg-card hover:border-primary/30 hover:shadow-sm",
      )}
      onClick={onSelect}
      draggable
      onDragStart={(e) => onDragStart(e, `field:${index}`)}
    >
      {/* Toolbar overlay on hover/select */}
      <div className={cn(
        "absolute -top-3 right-2 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-sm px-1 py-0.5 z-10 transition-opacity",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <div className="cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
        <div className="w-px h-4 bg-border" />
        {hasConditions && (
          <Tooltip>
            <TooltipTrigger>
              <div className="p-1">
                <Zap className="w-3 h-3 text-[hsl(var(--warning))]" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">Has conditional rules</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Duplicate</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Remove</TooltipContent>
        </Tooltip>
      </div>

      {/* Live field preview */}
      <div className="p-4">
        <LiveFieldPreview field={field} isRequired={isRequired} onLabelChange={onLabelChange} />
      </div>
    </div>
  );
};

// ── Live Field Preview (WYSIWYG rendering) ──────────────────

const LiveFieldPreview = ({ field, isRequired, onLabelChange }: { field: FormFieldDefinition; isRequired: boolean; onLabelChange?: (label: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.label);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(field.label);
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    if (editValue.trim() && editValue !== field.label) {
      onLabelChange?.(editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") { setEditing(false); setEditValue(field.label); }
  };

  // Layout fields render directly
  if (field.type === "divider") return <Separator className="my-1" />;
  if (field.type === "spacer") return <div className="h-4" />;
  if (field.type === "heading") return editing ? (
    <input
      autoFocus
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={handleKeyDown}
      className="text-base font-bold text-foreground bg-transparent border-b-2 border-primary outline-none w-full"
      style={{ fontFamily: "var(--font-display)" }}
    />
  ) : (
    <h3
      className="text-base font-bold text-foreground cursor-text hover:bg-primary/5 rounded px-1 -mx-1 transition-colors"
      style={{ fontFamily: "var(--font-display)" }}
      onDoubleClick={startEditing}
    >
      {field.label || "Heading"}
    </h3>
  );
  if (field.type === "infoPanel") return (
    <div className="bg-[hsl(var(--info)/0.08)] border border-[hsl(var(--info)/0.2)] rounded-lg p-3 text-sm text-foreground flex items-start gap-2">
      <Info className="w-4 h-4 text-[hsl(var(--info))] shrink-0 mt-0.5" />
      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-b border-primary outline-none flex-1 text-sm"
        />
      ) : (
        <span className="cursor-text hover:bg-primary/5 rounded px-1 -mx-1 transition-colors" onDoubleClick={startEditing}>
          {field.label || "Info panel"}
        </span>
      )}
    </div>
  );

  // Inline editable label
  const labelElement = editing ? (
    <input
      autoFocus
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={commitEdit}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      className="text-sm text-foreground font-medium bg-transparent border-b-2 border-primary outline-none w-full mb-2 block"
    />
  ) : (
    <Label
      className="text-sm text-foreground mb-2 block font-medium cursor-text group/label"
      onDoubleClick={startEditing}
    >
      <span className="hover:bg-primary/5 rounded px-1 -mx-1 py-0.5 transition-colors inline-block">
        {field.label || "(Untitled)"}
      </span>
      {isRequired && <span className="text-destructive ml-1">*</span>}
    </Label>
  );

  return (
    <div>
      {labelElement}

      {/* Text-like inputs */}
      {["text", "email", "phone", "url", "password"].includes(field.type) && (
        <Input
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          disabled
          className="h-10 text-sm bg-background"
        />
      )}

      {field.type === "number" && (
        <Input type="number" placeholder={field.placeholder || "0"} disabled className="h-10 text-sm bg-background" />
      )}

      {["date", "datetime", "time"].includes(field.type) && (
        <Input type={field.type === "datetime" ? "datetime-local" : field.type} disabled className="h-10 text-sm bg-background" />
      )}

      {field.type === "textarea" && (
        <Textarea placeholder={field.placeholder || "Enter text..."} disabled className="text-sm min-h-[80px] bg-background resize-none" />
      )}

      {["select", "multiselect"].includes(field.type) && (
        <Select disabled>
          <SelectTrigger className="h-10 text-sm bg-background">
            <SelectValue placeholder={field.placeholder || "Select..."} />
          </SelectTrigger>
        </Select>
      )}

      {field.type === "checkbox" && (
        <div className="flex items-center gap-2.5 pt-1">
          <input type="checkbox" disabled className="rounded border-input w-4 h-4" />
          <span className="text-sm text-muted-foreground">{field.placeholder || field.label}</span>
        </div>
      )}

      {field.type === "radio" && (
        <div className="space-y-2 pt-1">
          {(field.options || []).map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <input type="radio" name={`preview-${field.id}`} disabled className="w-4 h-4" /> {opt.label}
            </label>
          ))}
          {(!field.options || field.options.length === 0) && (
            <span className="text-xs text-muted-foreground/60 italic">No options configured</span>
          )}
        </div>
      )}

      {/* Currency */}
      {field.type === "currency" && (
        <div className="flex gap-2">
          <Input placeholder="0.00" disabled className="h-10 text-sm bg-background flex-1" />
          <Badge variant="outline" className="text-xs shrink-0 h-10 px-3 flex items-center">
            {field.currencyCode || "USD"}
          </Badge>
        </div>
      )}

      {/* Quantity */}
      {field.type === "quantity" && (
        <div className="flex gap-2">
          <Input placeholder="0" disabled className="h-10 text-sm bg-background flex-1" />
          {field.unitOfMeasure && (
            <Badge variant="outline" className="text-xs shrink-0 h-10 px-3 flex items-center">
              {field.unitOfMeasure}
            </Badge>
          )}
        </div>
      )}

      {/* ERP Pickers */}
      {["accountPicker", "itemPicker", "employeePicker", "supplierPicker", "customerPicker", "warehousePicker", "costCenterPicker", "taxCode", "lookup"].includes(field.type) && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`Search ${field.label}...`} disabled className="h-10 text-sm bg-background pl-10" />
        </div>
      )}

      {/* File/Image upload */}
      {["file", "image"].includes(field.type) && (
        <div className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-muted/10">
          <Upload className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Drop files here or click to upload</p>
          {field.maxFileSize && (
            <p className="text-[11px] text-muted-foreground/50 mt-1">
              Max {field.maxFileSize}MB · {field.maxFiles || 1} file(s)
            </p>
          )}
        </div>
      )}

      {/* Rating */}
      {field.type === "rating" && (
        <div className="flex gap-1 pt-1">
          {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} className="w-5 h-5 text-muted-foreground/25" />
          ))}
        </div>
      )}

      {/* Signature */}
      {field.type === "signature" && (
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/10">
          <PenTool className="w-5 h-5 mx-auto text-muted-foreground/40 mb-1" />
          <p className="text-xs text-muted-foreground">Sign here</p>
        </div>
      )}

      {/* Color */}
      {field.type === "color" && (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg border border-border bg-primary/20" />
          <Input placeholder="#000000" disabled className="h-10 text-sm bg-background flex-1 font-mono" />
        </div>
      )}

      {/* Rich text */}
      {field.type === "richtext" && (
        <div className="border border-border rounded-lg bg-background">
          <div className="border-b border-border px-3 py-1.5 flex gap-1">
            {["B", "I", "U"].map(b => (
              <span key={b} className="w-7 h-7 flex items-center justify-center text-xs font-bold text-muted-foreground bg-muted rounded">
                {b}
              </span>
            ))}
          </div>
          <div className="p-3 min-h-[80px] text-sm text-muted-foreground/50">
            {field.placeholder || "Start typing..."}
          </div>
        </div>
      )}

      {/* Repeater */}
      {field.type === "repeater" && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-2.5 flex items-center gap-2 border-b border-border">
            <Repeat className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {field.children?.length || 0} columns · {field.minRows ?? 1}-{field.maxRows ?? 10} rows
            </span>
          </div>
          {(field.children && field.children.length > 0) ? (
            <div className="p-3">
              {/* Column headers */}
              <div className="flex gap-2 mb-2">
                {field.children.map(child => (
                  <div key={child.id} className="flex-1">
                    <p className="text-[11px] text-muted-foreground font-medium mb-1.5">{child.label}</p>
                    <Input className="h-8 text-xs bg-background" placeholder={child.label} disabled />
                  </div>
                ))}
                <div className="w-8 flex items-end pb-1">
                  <Trash2 className="w-4 h-4 text-muted-foreground/20" />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground" disabled>
                <Plus className="w-3 h-3" /> {field.addButtonText || "Add Row"}
              </Button>
            </div>
          ) : (
            <div className="p-5 text-center text-xs text-muted-foreground">
              Configure columns in the property panel →
            </div>
          )}
        </div>
      )}

      {/* Section / Tab / Columns containers */}
      {["section", "tab", "columns"].includes(field.type) && (
        <div className="border border-dashed border-border rounded-lg p-4 text-center bg-muted/10">
          <p className="text-xs text-muted-foreground">
            {field.type === "section" && "Section container"}
            {field.type === "tab" && "Tab group"}
            {field.type === "columns" && `${field.columnCount || 2}-column layout`}
          </p>
        </div>
      )}

      {/* Help text */}
      {field.helpText && (
        <p className="text-[11px] text-muted-foreground mt-2">{field.helpText}</p>
      )}
    </div>
  );
};

// ── Property Panel ──────────────────────────────────────────

interface PropertyPanelProps {
  field: FormFieldDefinition;
  allFields: FormFieldDefinition[];
  onChange: (updates: Partial<FormFieldDefinition>) => void;
}

const PropertyPanel = ({ field, allFields, onChange }: PropertyPanelProps) => {
  const layoutTypes = ["section", "tab", "columns", "divider", "heading", "spacer", "infoPanel"];
  const isLayout = layoutTypes.includes(field.type);
  const hasOptions = ["select", "multiselect", "radio"].includes(field.type);

  const updateValidation = (type: string, enabled: boolean, value?: string | number | boolean, message?: string) => {
    const existing = field.validations.filter(v => v.type !== type);
    if (enabled) {
      existing.push({ type: type as ValidationRule["type"], value: value as string | number | undefined, message: message || `${type} validation failed` });
    }
    onChange({ validations: existing });
  };

  const isRequired = field.validations.some(v => v.type === "required");

  return (
    <div className="p-4">
      <Tabs defaultValue="general">
        <TabsList className="w-full h-9 bg-muted/50 p-1">
          <TabsTrigger value="general" className="text-[11px] flex-1 data-[state=active]:shadow-sm">General</TabsTrigger>
          {!isLayout && <TabsTrigger value="validation" className="text-[11px] flex-1 data-[state=active]:shadow-sm">Rules</TabsTrigger>}
          <TabsTrigger value="conditions" className="text-[11px] flex-1 data-[state=active]:shadow-sm">Logic</TabsTrigger>
          <TabsTrigger value="appearance" className="text-[11px] flex-1 data-[state=active]:shadow-sm">Style</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          {!isLayout && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">API Field Name</Label>
              <Input
                value={field.name}
                onChange={(e) => onChange({ name: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                className="h-9 text-sm font-mono"
              />
            </div>
          )}

          {!isLayout && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Placeholder</Label>
              <Input
                value={field.placeholder || ""}
                onChange={(e) => onChange({ placeholder: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          )}

          {!isLayout && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Help Text</Label>
              <Input
                value={field.helpText || ""}
                onChange={(e) => onChange({ helpText: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
          )}

          {/* Default value */}
          {!isLayout && !["file", "image", "signature", "repeater"].includes(field.type) && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Default Value</Label>
              {field.type === "checkbox" ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.defaultValue === true || field.defaultValue === "true"}
                    onCheckedChange={(v) => onChange({ defaultValue: v })}
                  />
                  <span className="text-xs text-muted-foreground">{field.defaultValue ? "Checked" : "Unchecked"}</span>
                </div>
              ) : ["select", "multiselect", "radio"].includes(field.type) && field.options?.length ? (
                <Select
                  value={String(field.defaultValue || "")}
                  onValueChange={(v) => onChange({ defaultValue: v })}
                >
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="No default" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">No default</SelectItem>
                    {field.options.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "number" || field.type === "currency" || field.type === "quantity" || field.type === "rating" ? (
                <Input
                  type="number"
                  value={field.defaultValue !== undefined ? String(field.defaultValue) : ""}
                  onChange={(e) => onChange({ defaultValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="No default"
                  className="h-9 text-sm"
                />
              ) : (
                <Input
                  value={field.defaultValue !== undefined ? String(field.defaultValue) : ""}
                  onChange={(e) => onChange({ defaultValue: e.target.value || undefined })}
                  placeholder="No default"
                  className="h-9 text-sm"
                />
              )}
            </div>
          )}

          {hasOptions && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Options</Label>
              <div className="space-y-1.5 bg-muted/30 rounded-lg p-3 border border-border/50">
                {(field.options || []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                    </div>
                    <Input
                      value={opt.label}
                      onChange={(e) => {
                        const options = [...(field.options || [])];
                        options[i] = { ...options[i], label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") };
                        onChange({ options });
                      }}
                      className="h-8 text-xs flex-1"
                    />
                    <button
                      onClick={() => {
                        const options = (field.options || []).filter((_, idx) => idx !== i);
                        onChange({ options });
                      }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] h-7 w-full hover:bg-primary/5 hover:text-primary"
                  onClick={() => {
                    const options = [...(field.options || []), { label: `Option ${(field.options?.length || 0) + 1}`, value: `option_${(field.options?.length || 0) + 1}` }];
                    onChange({ options });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Option
                </Button>
              </div>
            </div>
          )}

          {/* Currency specific */}
          {field.type === "currency" && (
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Currency</Label>
                <Input value={field.currencyCode || "USD"} onChange={(e) => onChange({ currencyCode: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="w-20 space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Decimals</Label>
                <Input type="number" value={field.decimalPlaces ?? 2} onChange={(e) => onChange({ decimalPlaces: parseInt(e.target.value) })} className="h-9 text-sm" />
              </div>
            </div>
          )}

          {/* Quantity specific */}
          {field.type === "quantity" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Unit of Measure</Label>
              <Input value={field.unitOfMeasure || ""} onChange={(e) => onChange({ unitOfMeasure: e.target.value })} className="h-9 text-sm" />
            </div>
          )}

          {/* Lookup fields */}
          {["lookup", "accountPicker", "itemPicker", "employeePicker", "supplierPicker", "customerPicker", "warehousePicker", "costCenterPicker"].includes(field.type) && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Lookup Module</Label>
                <Select value={field.lookupModule || ""} onValueChange={(v) => onChange({ lookupModule: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="procurement">Procurement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Lookup Entity</Label>
                <Input value={field.lookupEntity || ""} onChange={(e) => onChange({ lookupEntity: e.target.value })} className="h-9 text-sm" />
              </div>
            </>
          )}

          {/* File upload */}
          {["file", "image"].includes(field.type) && (
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Max Size (MB)</Label>
                <Input type="number" value={field.maxFileSize ?? 10} onChange={(e) => onChange({ maxFileSize: parseInt(e.target.value) })} className="h-9 text-sm" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Max Files</Label>
                <Input type="number" value={field.maxFiles ?? 1} onChange={(e) => onChange({ maxFiles: parseInt(e.target.value) })} className="h-9 text-sm" />
              </div>
            </div>
          )}

          {/* Repeater specific */}
          {field.type === "repeater" && (
            <>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Min Rows</Label>
                  <Input type="number" value={field.minRows ?? 1} onChange={(e) => onChange({ minRows: parseInt(e.target.value) || 1 })} className="h-9 text-sm" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Max Rows</Label>
                  <Input type="number" value={field.maxRows ?? 10} onChange={(e) => onChange({ maxRows: parseInt(e.target.value) || 10 })} className="h-9 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Add Button Text</Label>
                <Input value={field.addButtonText || "Add Row"} onChange={(e) => onChange({ addButtonText: e.target.value })} className="h-9 text-sm" />
              </div>
              <Separator />
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-muted-foreground">Columns</Label>
                <div className="space-y-1.5 bg-muted/30 rounded-lg p-3 border border-border/50">
                  {(field.children || []).map((child, ci) => (
                    <div key={child.id} className="flex items-center gap-1.5">
                      <Input
                        value={child.label}
                        onChange={(e) => {
                          const children = [...(field.children || [])];
                          children[ci] = { ...children[ci], label: e.target.value, name: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") };
                          onChange({ children });
                        }}
                        placeholder="Column label"
                        className="h-8 text-xs flex-1"
                      />
                      <Select
                        value={child.type}
                        onValueChange={(v) => {
                          const children = [...(field.children || [])];
                          children[ci] = { ...children[ci], type: v as any };
                          onChange({ children });
                        }}
                      >
                        <SelectTrigger className="h-8 text-[10px] w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="quantity">Quantity</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => {
                          const children = (field.children || []).filter((_, idx) => idx !== ci);
                          onChange({ children });
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-7 w-full hover:bg-primary/5 hover:text-primary"
                    onClick={() => {
                      const newChild: any = {
                        id: `col_${Date.now()}`,
                        type: "text",
                        label: `Column ${(field.children?.length || 0) + 1}`,
                        name: `column_${(field.children?.length || 0) + 1}`,
                        width: "full",
                        order: field.children?.length || 0,
                        validations: [],
                      };
                      onChange({ children: [...(field.children || []), newChild] });
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Column
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {!isLayout && (
          <TabsContent value="validation" className="space-y-4 mt-4">
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs font-medium">Required</Label>
              <Switch
                checked={isRequired}
                onCheckedChange={(checked) => updateValidation("required", checked, true, "This field is required")}
              />
            </div>

            {["text", "textarea", "email", "url", "phone"].includes(field.type) && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Min Length</Label>
                  <Input
                    type="number"
                    value={field.validations.find(v => v.type === "minLength")?.value as number || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateValidation("minLength", !isNaN(val) && val > 0, val, `Minimum ${val} characters`);
                    }}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Max Length</Label>
                  <Input
                    type="number"
                    value={field.validations.find(v => v.type === "maxLength")?.value as number || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      updateValidation("maxLength", !isNaN(val) && val > 0, val, `Maximum ${val} characters`);
                    }}
                    className="h-9 text-sm"
                  />
                </div>
              </>
            )}

            {["number", "currency", "quantity"].includes(field.type) && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Minimum Value</Label>
                  <Input
                    type="number"
                    value={field.validations.find(v => v.type === "min")?.value as number || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateValidation("min", !isNaN(val), val, `Minimum value is ${val}`);
                    }}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground">Maximum Value</Label>
                  <Input
                    type="number"
                    value={field.validations.find(v => v.type === "max")?.value as number || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateValidation("max", !isNaN(val), val, `Maximum value is ${val}`);
                    }}
                    className="h-9 text-sm"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-muted-foreground">Regex Pattern</Label>
              <Input
                value={(field.validations.find(v => v.type === "pattern")?.value as string) || ""}
                onChange={(e) => updateValidation("pattern", e.target.value.length > 0, e.target.value, "Invalid format")}
                placeholder="e.g. ^[A-Z]{2}\\d{4}$"
                className="h-9 text-sm font-mono"
              />
            </div>
          </TabsContent>
        )}

        <TabsContent value="conditions" className="space-y-3 mt-4">
          <ConditionsEditor field={field} allFields={allFields} onChange={onChange} />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Width</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["full", "half", "third", "quarter"] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => onChange({ width: w })}
                  className={cn(
                    "h-9 rounded-lg border text-[11px] font-medium transition-all",
                    field.width === w
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {w === "full" ? "100%" : w === "half" ? "50%" : w === "third" ? "33%" : "25%"}
                </button>
              ))}
            </div>
          </div>

          {!isLayout && (
            <div className="space-y-3 bg-muted/30 rounded-lg p-3 border border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Read Only</Label>
                <Switch checked={field.readOnly || false} onCheckedChange={(v) => onChange({ readOnly: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Disabled</Label>
                <Switch checked={field.disabled || false} onCheckedChange={(v) => onChange({ disabled: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Hidden</Label>
                <Switch checked={field.hidden || false} onCheckedChange={(v) => onChange({ hidden: v })} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium text-muted-foreground">Custom CSS Class</Label>
            <Input
              value={field.className || ""}
              onChange={(e) => onChange({ className: e.target.value })}
              placeholder="e.g. font-bold text-primary"
              className="h-9 text-sm font-mono"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ── Conditions Editor ────────────────────────────────────────

interface ConditionsEditorProps {
  field: FormFieldDefinition;
  allFields: FormFieldDefinition[];
  onChange: (updates: Partial<FormFieldDefinition>) => void;
}

const operatorLabels: Record<string, string> = {
  equals: "Equals",
  notEquals: "Not equals",
  contains: "Contains",
  greaterThan: "Greater than",
  lessThan: "Less than",
  isEmpty: "Is empty",
  isNotEmpty: "Is not empty",
};

const actionLabels: Record<string, string> = {
  show: "Show this field",
  hide: "Hide this field",
  require: "Make required",
  disable: "Disable this field",
};

const ConditionsEditor = ({ field, allFields, onChange }: ConditionsEditorProps) => {
  const conditions = field.conditions || [];
  const layoutTypes = ["section", "tab", "columns", "divider", "heading", "spacer", "infoPanel"];
  const sourceFields = allFields.filter(f => !layoutTypes.includes(f.type) && f.id !== field.id);

  const addCondition = () => {
    const firstSource = sourceFields[0];
    if (!firstSource) return;
    const newRule = {
      fieldId: firstSource.name,
      operator: "equals" as const,
      value: "",
      action: "show" as const,
    };
    onChange({ conditions: [...conditions, newRule] });
  };

  const updateCondition = (index: number, updates: Partial<typeof conditions[0]>) => {
    const updated = conditions.map((c, i) => i === index ? { ...c, ...updates } : c);
    onChange({ conditions: updated });
  };

  const removeCondition = (index: number) => {
    onChange({ conditions: conditions.filter((_, i) => i !== index) });
  };

  const needsValue = (op: string) => !["isEmpty", "isNotEmpty"].includes(op);
  const getSourceField = (fieldName: string) => allFields.find(f => f.name === fieldName);

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-3.5 h-3.5 text-[hsl(var(--warning))]" />
          <p className="text-xs font-semibold text-foreground">Conditional Logic</p>
        </div>
        <p className="text-[11px] text-muted-foreground">Control this field based on other field values</p>
      </div>

      {conditions.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-5 text-center bg-muted/20">
          <Zap className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-[11px] text-muted-foreground">No rules — field always visible</p>
        </div>
      )}

      {conditions.map((cond, idx) => {
        const sourceField = getSourceField(cond.fieldId);
        const hasSelectOptions = sourceField && ["select", "multiselect", "radio"].includes(sourceField.type);

        return (
          <div key={idx} className="border border-border rounded-xl p-3.5 space-y-2.5 bg-muted/20">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-[9px] font-semibold">Rule {idx + 1}</Badge>
              <button
                onClick={() => removeCondition(idx)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Action</Label>
              <Select value={cond.action} onValueChange={(v) => updateCondition(idx, { action: v as typeof cond.action })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">When field</Label>
              <Select value={cond.fieldId} onValueChange={(v) => updateCondition(idx, { fieldId: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select field" /></SelectTrigger>
                <SelectContent>
                  {sourceFields.map(f => (
                    <SelectItem key={f.id} value={f.name} className="text-xs">
                      {f.label} <span className="text-muted-foreground ml-1">({f.type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Operator</Label>
              <Select value={cond.operator} onValueChange={(v) => updateCondition(idx, { operator: v as typeof cond.operator })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(operatorLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsValue(cond.operator) && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground">Value</Label>
                {hasSelectOptions && sourceField.options ? (
                  <Select value={String(cond.value)} onValueChange={(v) => updateCondition(idx, { value: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select value" /></SelectTrigger>
                    <SelectContent>
                      {sourceField.options.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={String(cond.value ?? "")}
                    onChange={(e) => updateCondition(idx, { value: e.target.value })}
                    placeholder="Enter value"
                    className="h-8 text-xs"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-[11px] h-8 gap-1.5"
        onClick={addCondition}
        disabled={sourceFields.length === 0}
      >
        <Plus className="w-3.5 h-3.5" /> Add Rule
      </Button>

      {sourceFields.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-center">Add more fields to create conditions</p>
      )}
    </div>
  );
};

// ── Preview Field ───────────────────────────────────────────

const PreviewField = ({ field }: { field: FormFieldDefinition }) => {
  if (field.hidden) return null;

  const isRequired = field.validations.some(v => v.type === "required");

  if (field.type === "divider") return <Separator className="my-4" />;
  if (field.type === "spacer") return <div className="h-6" />;
  if (field.type === "heading") return <h3 className="text-base font-bold text-foreground pt-6 pb-2" style={{ fontFamily: "var(--font-display)" }}>{field.label}</h3>;
  if (field.type === "infoPanel") return (
    <div className="bg-[hsl(var(--info)/0.08)] border border-[hsl(var(--info)/0.2)] rounded-xl p-4 text-sm text-foreground flex items-start gap-2.5">
      <Info className="w-4 h-4 text-[hsl(var(--info))] shrink-0 mt-0.5" />{field.label}
    </div>
  );

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <Label className="text-sm text-foreground mb-2 block font-medium">
        {field.label}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </Label>

      {["text", "email", "phone", "url", "password"].includes(field.type) && (
        <Input placeholder={field.placeholder} disabled={field.disabled} readOnly={field.readOnly} className="h-10 text-sm" />
      )}

      {field.type === "number" && <Input type="number" placeholder={field.placeholder} className="h-10 text-sm" />}

      {["date", "datetime", "time"].includes(field.type) && (
        <Input type={field.type === "datetime" ? "datetime-local" : field.type} className="h-10 text-sm" />
      )}

      {field.type === "textarea" && <Textarea placeholder={field.placeholder} className="text-sm min-h-[80px]" />}

      {["select", "multiselect"].includes(field.type) && (
        <Select>
          <SelectTrigger className="h-10 text-sm"><SelectValue placeholder={field.placeholder || "Select..."} /></SelectTrigger>
          <SelectContent>
            {field.options?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {field.type === "checkbox" && (
        <div className="flex items-center gap-2.5">
          <input type="checkbox" className="rounded border-border w-4 h-4" />
          <span className="text-sm text-muted-foreground">{field.placeholder || field.label}</span>
        </div>
      )}

      {field.type === "radio" && (
        <div className="space-y-2">
          {field.options?.map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm">
              <input type="radio" name={field.name} className="w-4 h-4" /> {opt.label}
            </label>
          ))}
        </div>
      )}

      {["currency", "quantity", "accountPicker", "itemPicker", "employeePicker", "supplierPicker", "customerPicker", "warehousePicker", "costCenterPicker", "taxCode"].includes(field.type) && (
        <div className="flex gap-2">
          <Input placeholder={field.type === "currency" ? `0.00 ${field.currencyCode || ""}` : field.type === "quantity" ? `0 ${field.unitOfMeasure || ""}` : `Search ${field.label}...`} className="h-10 text-sm flex-1" />
          {field.type === "quantity" && field.unitOfMeasure && (
            <Badge variant="outline" className="text-xs shrink-0 h-10 px-3 flex items-center">{field.unitOfMeasure}</Badge>
          )}
        </div>
      )}

      {["file", "image"].includes(field.type) && (
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center bg-muted/20">
          <Upload className="w-6 h-6 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Drop files here or click to upload</p>
          {field.maxFileSize && <p className="text-[11px] text-muted-foreground/60 mt-1">Max {field.maxFileSize}MB · {field.maxFiles || 1} file(s)</p>}
        </div>
      )}

      {field.type === "rating" && (
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n => <Star key={n} className="w-5 h-5 text-muted-foreground/30 hover:text-[hsl(var(--warning))] cursor-pointer transition-colors" />)}
        </div>
      )}

      {field.type === "repeater" && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/50 px-4 py-2.5 flex items-center gap-2 border-b border-border">
            <Repeat className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {field.children?.length || 0} columns · {field.minRows ?? 1}-{field.maxRows ?? 10} rows
            </span>
          </div>
          {(field.children && field.children.length > 0) ? (
            <div className="p-4">
              <div className="flex gap-2 mb-2">
                {field.children.map(child => (
                  <div key={child.id} className="flex-1">
                    <p className="text-[11px] text-muted-foreground font-medium mb-1.5">{child.label}</p>
                    <Input className="h-8 text-xs" placeholder={child.placeholder || child.label} disabled />
                  </div>
                ))}
                <div className="w-8 flex items-end pb-1">
                  <Trash2 className="w-4 h-4 text-muted-foreground/30" />
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground" disabled>
                <Plus className="w-3 h-3" /> {field.addButtonText || "Add Row"}
              </Button>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Configure columns in the property panel
            </div>
          )}
        </div>
      )}

      {field.helpText && <p className="text-[11px] text-muted-foreground mt-2">{field.helpText}</p>}
    </div>
  );
};

export default FormDesignerCanvas;
