import { useState, useEffect } from "react";
import {
  Clock, RotateCcw, Plus, Minus, Settings, Eye, Layers, ArrowUpCircle,
  FileText, ChevronDown, ChevronUp, CheckCircle, X, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getVersionHistory,
  initializeMockVersionHistory,
  saveVersionSnapshot,
  diffSchemas,
  type FormVersionSnapshot,
} from "@/data/formVersionHistory";
import { mockFormSchemas } from "@/data/formDesignerData";
import type { FormSchema } from "@/types/formDesigner";

// ── Change type config ──────────────────────────────────────

const changeTypeConfig: Record<
  FormVersionSnapshot["changeType"],
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  created: { icon: Plus, color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success)/0.1)]", label: "Created" },
  fields_added: { icon: Plus, color: "text-[hsl(var(--info))]", bgColor: "bg-[hsl(var(--info)/0.1)]", label: "Fields Added" },
  fields_removed: { icon: Minus, color: "text-destructive", bgColor: "bg-destructive/10", label: "Fields Removed" },
  fields_modified: { icon: Settings, color: "text-[hsl(var(--warning))]", bgColor: "bg-[hsl(var(--warning)/0.1)]", label: "Modified" },
  settings_changed: { icon: Settings, color: "text-muted-foreground", bgColor: "bg-muted", label: "Settings" },
  published: { icon: ArrowUpCircle, color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success)/0.1)]", label: "Published" },
  restored: { icon: RotateCcw, color: "text-[hsl(var(--info))]", bgColor: "bg-[hsl(var(--info)/0.1)]", label: "Restored" },
  layout_changed: { icon: Layers, color: "text-primary", bgColor: "bg-primary/10", label: "Layout" },
};

// ── Props ───────────────────────────────────────────────────

interface VersionHistoryPanelProps {
  formId: string;
  currentSchema: FormSchema;
  open: boolean;
  onClose: () => void;
  onRestore: (schema: FormSchema) => void;
}

const VersionHistoryPanel = ({ formId, currentSchema, open, onClose, onRestore }: VersionHistoryPanelProps) => {
  const [versions, setVersions] = useState<FormVersionSnapshot[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<FormVersionSnapshot | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<FormVersionSnapshot | null>(null);

  useEffect(() => {
    if (open) {
      // Ensure mock data is initialized
      initializeMockVersionHistory(mockFormSchemas);
      setVersions(getVersionHistory(formId));
    }
  }, [open, formId]);

  const handleRestore = (snapshot: FormVersionSnapshot) => {
    // Save current state as a version before restoring
    const diff = diffSchemas(currentSchema, snapshot.schema);
    saveVersionSnapshot(
      currentSchema,
      "restored",
      `Saved before restoring to v${snapshot.version}`
    );

    // Restore
    onRestore({ ...snapshot.schema, version: currentSchema.version + 1 });

    // Save the restored version
    saveVersionSnapshot(
      { ...snapshot.schema, version: currentSchema.version + 1 },
      "restored",
      `Restored from v${snapshot.version}: ${snapshot.changeSummary}`
    );

    setVersions(getVersionHistory(formId));
    setConfirmRestore(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (!open) return null;

  return (
    <>
      {/* Side panel */}
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-[420px] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
          {/* Header */}
          <div className="h-14 flex items-center justify-between px-5 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  Version History
                </h3>
                <p className="text-[10px] text-muted-foreground">{versions.length} version{versions.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Current version badge */}
          <div className="px-5 py-3 bg-primary/5 border-b border-border">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[10px] bg-primary">Current</Badge>
              <span className="text-xs font-semibold text-foreground">v{currentSchema.version}</span>
              <span className="text-[10px] text-muted-foreground">· {currentSchema.fields.length} fields</span>
            </div>
          </div>

          {/* Timeline */}
          <ScrollArea className="flex-1">
            <div className="px-5 py-4">
              {versions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">No version history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Save the form to create the first version</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-6 bottom-6 w-px bg-border" />

                  <div className="space-y-1">
                    {versions.map((ver, idx) => {
                      const config = changeTypeConfig[ver.changeType];
                      const Icon = config.icon;
                      const isExpanded = expandedId === ver.id;
                      const isLatest = idx === 0;
                      const hasDiffDetails = (ver.fieldsAdded?.length || 0) + (ver.fieldsRemoved?.length || 0) + (ver.fieldsModified?.length || 0) > 0;

                      return (
                        <div key={ver.id} className="relative">
                          <div
                            className={cn(
                              "flex gap-3 rounded-xl p-3 cursor-pointer transition-all duration-200",
                              isExpanded
                                ? "bg-accent/80 border border-border shadow-sm"
                                : "hover:bg-accent/40",
                              isLatest && !isExpanded && "bg-accent/30"
                            )}
                            onClick={() => setExpandedId(isExpanded ? null : ver.id)}
                          >
                            {/* Timeline dot */}
                            <div className={cn(
                              "w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-card",
                              config.bgColor
                            )}>
                              <Icon className={cn("w-3.5 h-3.5", config.color)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <Badge variant="outline" className={cn("text-[9px] font-semibold px-1.5 py-0", config.color)}>
                                  v{ver.version}
                                </Badge>
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                  {config.label}
                                </Badge>
                                {isLatest && (
                                  <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-primary">Latest</Badge>
                                )}
                              </div>

                              <p className="text-[11px] text-foreground font-medium leading-snug mt-1 line-clamp-2">
                                {ver.changeSummary}
                              </p>

                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-muted-foreground">{formatDate(ver.createdAt)}</span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground">{formatTime(ver.createdAt)}</span>
                                <span className="text-[10px] text-muted-foreground">·</span>
                                <span className="text-[10px] text-muted-foreground">{ver.createdBy}</span>
                              </div>

                              {/* Expanded details */}
                              {isExpanded && (
                                <div className="mt-3 space-y-2.5">
                                  {/* Stats */}
                                  <div className="flex gap-3">
                                    <div className="bg-background rounded-lg px-3 py-2 flex-1 border border-border/50">
                                      <p className="text-[10px] text-muted-foreground">Fields</p>
                                      <p className="text-sm font-bold text-foreground">{ver.fieldCount}</p>
                                    </div>
                                    <div className="bg-background rounded-lg px-3 py-2 flex-1 border border-border/50">
                                      <p className="text-[10px] text-muted-foreground">Layout</p>
                                      <p className="text-sm font-bold text-foreground capitalize">{ver.schema.layout}</p>
                                    </div>
                                    <div className="bg-background rounded-lg px-3 py-2 flex-1 border border-border/50">
                                      <p className="text-[10px] text-muted-foreground">Status</p>
                                      <p className="text-sm font-bold text-foreground capitalize">{ver.schema.status}</p>
                                    </div>
                                  </div>

                                  {/* Diff details */}
                                  {hasDiffDetails && (
                                    <div className="space-y-1.5">
                                      {ver.fieldsAdded && ver.fieldsAdded.length > 0 && (
                                        <div className="flex items-start gap-1.5">
                                          <Plus className="w-3 h-3 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                                          <div className="flex flex-wrap gap-1">
                                            {ver.fieldsAdded.map((f, i) => (
                                              <span key={i} className="text-[10px] bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] rounded px-1.5 py-0.5">
                                                {f}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {ver.fieldsRemoved && ver.fieldsRemoved.length > 0 && (
                                        <div className="flex items-start gap-1.5">
                                          <Minus className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                                          <div className="flex flex-wrap gap-1">
                                            {ver.fieldsRemoved.map((f, i) => (
                                              <span key={i} className="text-[10px] bg-destructive/10 text-destructive rounded px-1.5 py-0.5">
                                                {f}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {ver.fieldsModified && ver.fieldsModified.length > 0 && (
                                        <div className="flex items-start gap-1.5">
                                          <Settings className="w-3 h-3 text-[hsl(var(--warning))] mt-0.5 shrink-0" />
                                          <div className="flex flex-wrap gap-1">
                                            {ver.fieldsModified.map((f, i) => (
                                              <span key={i} className="text-[10px] bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] rounded px-1.5 py-0.5">
                                                {f}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[10px] h-7 gap-1 flex-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewVersion(ver);
                                      }}
                                    >
                                      <Eye className="w-3 h-3" /> Preview
                                    </Button>
                                    {!isLatest && (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        className="text-[10px] h-7 gap-1 flex-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setConfirmRestore(ver);
                                        }}
                                      >
                                        <RotateCcw className="w-3 h-3" /> Restore
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Expand indicator */}
                            <div className="shrink-0 mt-1">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Preview dialog */}
      {previewVersion && (
        <Dialog open onOpenChange={() => setPreviewVersion(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Preview — v{previewVersion.version}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {previewVersion.changeSummary}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">Fields</p>
                  <p className="text-lg font-bold text-foreground">{previewVersion.fieldCount}</p>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">Layout</p>
                  <p className="text-lg font-bold text-foreground capitalize">{previewVersion.schema.layout}</p>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-[10px] text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-foreground capitalize">{previewVersion.schema.status}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-[11px] font-semibold text-foreground mb-2">Fields in this version:</p>
                <div className="space-y-1 max-h-[300px] overflow-auto">
                  {previewVersion.schema.fields.map(f => (
                    <div key={f.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 rounded-lg">
                      <span className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">{f.type}</span>
                      <span className="text-xs text-foreground">{f.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{f.width}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm restore dialog */}
      {confirmRestore && (
        <Dialog open onOpenChange={() => setConfirmRestore(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))]" />
                Restore Version {confirmRestore.version}?
              </DialogTitle>
              <DialogDescription className="text-xs">
                This will replace the current form with the state from v{confirmRestore.version}. 
                The current version will be saved in history before restoring.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-lg p-3 mt-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Fields</span>
                <span className="font-medium text-foreground">{confirmRestore.fieldCount}</span>
              </div>
              <div className="flex justify-between text-[11px] mt-1">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-foreground">{formatDate(confirmRestore.createdAt)}</span>
              </div>
              <div className="flex justify-between text-[11px] mt-1">
                <span className="text-muted-foreground">Summary</span>
                <span className="font-medium text-foreground text-right max-w-[200px]">{confirmRestore.changeSummary}</span>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmRestore(null)}>
                Cancel
              </Button>
              <Button size="sm" className="text-xs gap-1" onClick={() => handleRestore(confirmRestore)}>
                <RotateCcw className="w-3 h-3" /> Restore v{confirmRestore.version}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

// Helper for external use
function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default VersionHistoryPanel;
