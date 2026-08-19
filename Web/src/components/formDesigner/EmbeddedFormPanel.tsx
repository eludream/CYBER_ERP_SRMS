import { useState, useMemo } from "react";
import { FormInput, ChevronRight, X, FileText, ExternalLink, GitBranch, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import FormRenderer from "@/components/formDesigner/FormRenderer";
import { mockFormList, mockFormSchemas } from "@/data/formDesignerData";
import { useWorkflow, type WorkflowPriority } from "@/contexts/WorkflowContext";
import type { FormSchema, FormListItem } from "@/types/formDesigner";
import { toast } from "sonner";

// ── Props ───────────────────────────────────────────────────

interface EmbeddedFormPanelProps {
  module: string;
  entity?: string;
  mode?: "inline" | "button";
  buttonLabel?: string;
  formId?: string;
  className?: string;
}

const EmbeddedFormPanel = ({
  module,
  entity,
  mode = "inline",
  buttonLabel,
  formId,
  className,
}: EmbeddedFormPanelProps) => {
  const [activeFormId, setActiveFormId] = useState<string | null>(formId || null);
  const [sheetOpen, setSheetOpen] = useState(!!formId);
  const { addTask, approvalChains } = useWorkflow();

  const availableForms = useMemo(() => {
    return mockFormList.filter(f => {
      if (f.status !== "published") return false;
      if (f.module !== module) return false;
      if (entity && f.entity !== entity) return false;
      return true;
    });
  }, [module, entity]);

  const activeSchema = useMemo<FormSchema | null>(() => {
    if (!activeFormId) return null;
    return mockFormSchemas[activeFormId] || null;
  }, [activeFormId]);

  const openForm = (id: string) => {
    setActiveFormId(id);
    setSheetOpen(true);
  };

  const closeForm = () => {
    setSheetOpen(false);
    setTimeout(() => setActiveFormId(null), 200);
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (!activeSchema) return;

    console.log(`[EmbeddedForm] Submitted ${activeFormId}:`, data);

    // If workflow is enabled, create a workflow task
    if (activeSchema.triggerWorkflowOnSubmit && activeSchema.workflowId) {
      const chain = approvalChains.find(c => c.id === activeSchema.workflowId);
      const refNo = `${activeSchema.entity?.toUpperCase().slice(0, 3) || "FRM"}-${Date.now().toString().slice(-4)}`;
      
      // Determine priority from form data if available
      const priority = (data.priority as string) || "Medium";
      const priorityMap: Record<string, WorkflowPriority> = {
        low: "Low", medium: "Medium", high: "High", critical: "Critical",
      };

      addTask({
        title: `${activeSchema.name}: ${(data.title as string) || (data.fullName as string) || (data.companyName as string) || refNo}`,
        description: `Form submission via ${activeSchema.name} (v${activeSchema.version}). ${activeSchema.description || ""}`,
        module: activeSchema.module,
        documentType: activeSchema.entity || "Form Submission",
        documentId: refNo,
        referenceNo: refNo,
        status: "Pending Approval",
        priority: priorityMap[priority.toLowerCase()] || "Medium",
        assignee: chain?.steps?.[0]?.assignee || "Approver",
        createdBy: "Current User",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        approvalChainId: activeSchema.workflowId,
        currentStep: 1,
        totalSteps: chain?.steps?.length || 1,
        tags: ["form-submission", activeSchema.module],
      });

      toast.success(
        `${activeSchema.settings.successMessage} Workflow task created and routed to ${chain?.steps?.[0]?.assignee || "approver"} for approval.`,
        { duration: 5000 }
      );
    } else {
      toast.success(activeSchema.settings.successMessage);
    }

    closeForm();
  };

  const handleSaveDraft = (data: Record<string, unknown>) => {
    console.log(`[EmbeddedForm] Draft saved ${activeFormId}:`, data);
    toast.success("Draft saved.");
  };

  if (availableForms.length === 0) return null;

  // ── Button mode ───────────────────────────────────────────
  if (mode === "button") {
    return (
      <>
        {availableForms.length === 1 ? (
          <Button
            size="sm"
            variant="outline"
            className={cn("gap-1.5", className)}
            onClick={() => openForm(availableForms[0].id)}
          >
            <FormInput className="w-4 h-4" />
            {buttonLabel || availableForms[0].name}
          </Button>
        ) : (
          <div className={cn("flex gap-2 flex-wrap", className)}>
            {availableForms.map(form => (
              <Button
                key={form.id}
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => openForm(form.id)}
              >
                <FormInput className="w-3.5 h-3.5" />
                {form.name}
              </Button>
            ))}
          </div>
        )}

        <FormSheet
          open={sheetOpen}
          schema={activeSchema}
          onClose={closeForm}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
        />
      </>
    );
  }

  // ── Inline mode ───────────────────────────────────────────
  return (
    <>
      <div className={cn("rounded-xl border border-border bg-card", className)}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FormInput className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Quick Forms</h3>
            <Badge variant="secondary" className="text-[10px]">{availableForms.length}</Badge>
          </div>
        </div>
        <div className="divide-y divide-border">
          {availableForms.map(form => {
            const schema = mockFormSchemas[form.id];
            const hasWorkflow = schema?.triggerWorkflowOnSubmit && schema?.workflowId;
            return (
              <button
                key={form.id}
                onClick={() => openForm(form.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{form.name}</p>
                  {form.description && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{form.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasWorkflow && (
                    <Badge variant="outline" className="text-[9px] gap-1 text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]">
                      <GitBranch className="w-2.5 h-2.5" /> Workflow
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[9px]">v{form.version}</Badge>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <FormSheet
        open={sheetOpen}
        schema={activeSchema}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
      />
    </>
  );
};

// ── Form Sheet ──────────────────────────────────────────────

interface FormSheetProps {
  open: boolean;
  schema: FormSchema | null;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  onSaveDraft: (data: Record<string, unknown>) => void;
}

const FormSheet = ({ open, schema, onClose, onSubmit, onSaveDraft }: FormSheetProps) => {
  if (!schema) return null;

  const hasWorkflow = schema.triggerWorkflowOnSubmit && schema.workflowId;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="sm:max-w-lg w-full p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base">{schema.name}</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">
                {schema.description || `${schema.module} · ${schema.entity} · v${schema.version}`}
              </SheetDescription>
            </div>
            <Badge variant={schema.status === "published" ? "default" : "secondary"} className="text-[10px] shrink-0">
              {schema.status}
            </Badge>
          </div>
          {hasWorkflow && (
            <div className="mt-3 flex items-center gap-2 bg-[hsl(var(--success)/0.08)] border border-[hsl(var(--success)/0.2)] rounded-lg px-3 py-2">
              <GitBranch className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
              <span className="text-[11px] text-foreground font-medium">
                Submission triggers approval workflow
              </span>
            </div>
          )}
        </SheetHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <FormRenderer
            schema={schema}
            onSubmit={onSubmit}
            onSaveDraft={onSaveDraft}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EmbeddedFormPanel;
