import { useState } from "react";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useWorkflowDesigner } from "@/contexts/WorkflowDesignerContext";
import { useERP } from "@/contexts/ERPContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  GitBranch, CheckCircle, XCircle, Clock, Send,
  AlertTriangle, MessageSquare, ChevronRight, User, History, Zap, ShieldAlert, Lock
} from "lucide-react";
import type { WorkflowStatus } from "@/contexts/WorkflowContext";

// ========================
// Status config shared
// ========================
const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
  "Draft": { color: "bg-muted text-muted-foreground border-border", icon: GitBranch },
  "In Progress": { color: "bg-info/10 text-info border-info/20", icon: Clock },
  "Pending Approval": { color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  "Approved": { color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  "Rejected": { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  "Completed": { color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  "On Hold": { color: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  "Cancelled": { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

// Map designer status names to display config keys
const mapDesignerStatusToConfig = (statusName: string): string => {
  const n = statusName.toLowerCase();
  if (n.includes("draft")) return "Draft";
  if (n.includes("approved") || n.includes("posted") || n.includes("closed") || n.includes("completed")) return "Approved";
  if (n.includes("rejected") || n.includes("cancel")) return "Rejected";
  if (n.includes("pending") || n.includes("review") || n.includes("investigation")) return "Pending Approval";
  if (n.includes("open") || n.includes("progress") || n.includes("disposition")) return "In Progress";
  return "Draft";
};

// ========================
// Audit Trail / History Dialog
// ========================
const WorkflowHistoryDialog = ({
  open, onOpenChange, documentId, module,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; documentId: string; module: string;
}) => {
  const { getDocumentHistory } = useWorkflow();
  const history = getDocumentHistory(documentId, module);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Workflow History — {documentId}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-2">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No workflow history yet
            </div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {history.map((entry, idx) => {
                  const cfgKey = mapDesignerStatusToConfig(entry.toStatus);
                  const cfg = statusConfig[cfgKey] || statusConfig["Draft"];
                  const Icon = cfg.icon;
                  const isLast = idx === history.length - 1;
                  return (
                    <div key={entry.id} className="relative">
                      <div className={`absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center ${isLast ? "bg-primary border-primary" : "bg-background border-border"}`}>
                        <Icon className={`h-2.5 w-2.5 ${isLast ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{entry.action}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${cfg.color}`}>
                            {entry.toStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                          <User className="h-3 w-3" />
                          {entry.performedBy}
                          <span className="mx-1">•</span>
                          {new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {" "}
                          {new Date(entry.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {entry.fromStatus && (
                          <div className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mb-1">
                            <ChevronRight className="h-2.5 w-2.5" />
                            {entry.fromStatus} → {entry.toStatus}
                          </div>
                        )}
                        {entry.remarks && (
                          <div className="flex items-start gap-1.5 mt-1.5 pt-1.5 border-t border-border/30">
                            <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground italic">{entry.remarks}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

// ========================
// Workflow Status Indicator (clickable badge → opens history)
// ========================
export const WorkflowStatusIndicator = ({
  documentId, module,
}: {
  documentId: string; module: string;
}) => {
  const { tasks } = useWorkflow();
  const designer = useWorkflowDesigner();
  const [historyOpen, setHistoryOpen] = useState(false);
  const task = tasks.find(t => t.documentId === documentId && t.module === module);

  // Resolve display from designer status if available
  let displayLabel = "No Workflow";
  let cfgKey = "Draft";

  if (task) {
    if (task.workflowProfileId && task.designerStatusName) {
      const designerStatus = designer.getStatusByName(task.workflowProfileId, task.designerStatusName);
      displayLabel = designerStatus?.displayName || task.designerStatusName;
      cfgKey = mapDesignerStatusToConfig(task.designerStatusName);
    } else {
      displayLabel = task.status;
      cfgKey = task.status;
    }
  }

  const cfg = statusConfig[cfgKey] || statusConfig["Draft"];
  const Icon = cfg.icon;

  if (!task) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => setHistoryOpen(true)}
            >
              <GitBranch className="h-2.5 w-2.5" />No Workflow
            </button>
          </TooltipTrigger>
          <TooltipContent><p className="text-xs">Click to view workflow history</p></TooltipContent>
        </Tooltip>
        <WorkflowHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} documentId={documentId} module={module} />
      </>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${cfg.color}`}
            onClick={() => setHistoryOpen(true)}
          >
            <Icon className="h-2.5 w-2.5" />
            {displayLabel}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px]">
          <div className="space-y-1">
            <p className="text-xs font-medium">{task.title}</p>
            {task.referenceNo && (
              <p className="text-[10px] text-muted-foreground font-mono">Ref: {task.referenceNo}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Assignee: {task.assignee}</p>
            {task.workflowProfileId && (
              <p className="text-[10px] text-muted-foreground">
                Profile: {designer.profiles.find(p => p.id === task.workflowProfileId)?.name}
              </p>
            )}
            {task.dueDate && <p className="text-[10px] text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
            <p className="text-[10px] text-primary">Click to view history</p>
          </div>
        </TooltipContent>
      </Tooltip>
      <WorkflowHistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} documentId={documentId} module={module} />
    </>
  );
};

// ========================
// Workflow Action Buttons — now profile-driven
// ========================
export const WorkflowActionButtons = ({
  documentId, module, compact = false, documentContext = {},
}: {
  documentId: string; module: string; compact?: boolean;
  documentContext?: Record<string, unknown>; // e.g. { Amount: 50000 } for business rule evaluation
}) => {
  const { tasks, updateTask, addTask } = useWorkflow();
  const designer = useWorkflowDesigner();
  const { addNotification } = useERP();
  const { user } = useAuth();
  const [actionDialog, setActionDialog] = useState<{
    pathId: number;
    actionId: number;
    actionName: string;
    actionDisplayName: string;
    nextStatusName: string;
    nextStatusDisplayName: string;
    taskId: string;
    withRemark: boolean;
    withConfirmation: boolean;
    confirmationMessage: string;
    closeOnAction: boolean;
    workflowProfileId: number;
    requiredFields: string[];
  } | null>(null);
  const [remark, setRemark] = useState("");

  const task = tasks.find(t => t.documentId === documentId && t.module === module);
  const currentUserRole = user?.role || "System Administrator";
  const currentUserName = user?.name || "System";

  // Find available paths from Designer profile, filtered by business rules and allowed users
  const getAvailablePaths = () => {
    if (!task?.workflowProfileId || !task?.designerStatusName) return [];
    const allPaths = designer.getAvailablePathsForStatus(task.workflowProfileId, task.designerStatusName);

    return allPaths.filter(entry => {
      // Business rule evaluation
      if (entry.path.businessRule) {
        const ruleResult = designer.evaluateBusinessRule(entry.path.businessRule, {
          ...documentContext,
          ...(task.auditFieldValues || {}),
        });
        if (!ruleResult) return false;
      }

      // Allowed users enforcement
      if (entry.path.allowedUsersToken) {
        if (!designer.isUserAllowed(entry.path.allowedUsersToken, currentUserRole)) return false;
      }

      return true;
    });
  };

  // Handle submitting a document into workflow (no task yet, or Draft status)
  const handleInitialSubmit = () => {
    // Try to find a profile binding for this module
    // We try common document type names based on module
    const docTypeGuesses: Record<string, string[]> = {
      procurement: ["Purchase Order", "Goods Receipt"],
      hr: ["Leave Request"],
      finance: ["Journal Entry"],
      quality: ["NCR"],
      sales: ["Sales Order", "Sales Invoice"],
      inventory: ["Goods Receipt"],
      production: ["BOM"],
    };
    const guesses = docTypeGuesses[module] || [];
    let profile = undefined;
    let docType = "";
    for (const g of guesses) {
      profile = designer.getProfileForDocument(module, g);
      if (profile) { docType = g; break; }
    }

    if (profile) {
      const initialStatus = designer.getInitialStatus(profile.id);
      const profileStatuses = designer.getProfileStatuses(profile.id);
      // Find paths from the initial status
      const availablePaths = initialStatus
        ? designer.getAvailablePathsForStatus(profile.id, initialStatus.name)
        : [];

      if (availablePaths.length > 0) {
        // Auto-execute the first available path (usually "Submit")
        const firstPath = availablePaths[0];
        if (task) {
          // Task exists but is in Draft — transition
          if (firstPath.action.withConfirmation || firstPath.action.withRemark) {
            setActionDialog({
              pathId: firstPath.path.id,
              actionId: firstPath.action.id,
              actionName: firstPath.action.name,
              actionDisplayName: firstPath.action.displayName,
              nextStatusName: firstPath.nextStatus.name,
              nextStatusDisplayName: firstPath.nextStatus.displayName,
              taskId: task.id,
              withRemark: firstPath.action.withRemark,
              withConfirmation: firstPath.action.withConfirmation,
              confirmationMessage: firstPath.path.confirmationMessageTemplate,
              closeOnAction: firstPath.path.closeOnAction,
              workflowProfileId: profile.id,
              requiredFields: designer.getPathRequiredFields(firstPath.path.id).map(f => f.name),
            });
          } else {
            executeTransition(task.id, firstPath.nextStatus.name, firstPath.nextStatus.displayName, firstPath.action.displayName, "", firstPath.path.closeOnAction, firstPath.path.id, firstPath.action.id);
          }
        } else {
          // Create task with auto-generated reference number from sequence
          const refNo = designer.generateNextReference(profile.id);
          addTask({
            title: `${firstPath.action.displayName}: ${refNo}`,
            description: `Workflow for ${documentId}`,
            module,
            documentType: docType,
            documentId,
            referenceNo: refNo,
            status: mapDesignerToRuntimeStatus(firstPath.nextStatus.name),
            priority: "Medium",
            assignee: "Manager",
            createdBy: "Current User",
            dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
            tags: ["approval"],
            workflowProfileId: profile.id,
            designerStatusName: firstPath.nextStatus.name,
          });
        }
        return;
      }
    }

    // Fallback: no profile found, create basic task
    if (task) {
      updateTask(task.id, { status: "Pending Approval", currentStep: 1 }, "Submitted for approval");
    } else {
      addTask({
        title: `Approval: ${documentId}`,
        description: `Workflow approval for ${documentId}`,
        module,
        documentType: "Document",
        documentId,
        status: "Pending Approval",
        priority: "Medium",
        assignee: "Manager",
        createdBy: "Current User",
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        currentStep: 1,
        totalSteps: 2,
        tags: ["approval"],
      });
    }
  };

  const mapDesignerToRuntimeStatus = (designerName: string): WorkflowStatus => {
    const n = designerName.toLowerCase();
    if (n.includes("draft")) return "Draft";
    if (n.includes("approved") || n.includes("posted") || n.includes("closed")) return "Approved";
    if (n.includes("rejected") || n.includes("cancel")) return "Rejected";
    if (n.includes("completed")) return "Completed";
    if (n.includes("hold")) return "On Hold";
    return "Pending Approval";
  };

  const executeTransition = (
    taskId: string, nextStatusName: string, nextStatusDisplay: string,
    actionLabel: string, remarks: string, closeOnAction: boolean,
    pathId?: number, actionId?: number
  ) => {
    const runtimeStatus = mapDesignerToRuntimeStatus(nextStatusName);
    const currentTask = tasks.find(t => t.id === taskId);

    // 1. onExit token — execute before leaving current status
    if (pathId && currentTask) {
      const path = designer.paths.find(p => p.id === pathId);
      if (path?.onExitToken) {
        const { exitActions } = designer.executeEntryExitTokens("", path.onExitToken, {
          documentId: currentTask.documentId,
          module,
          userName: currentUserName,
          referenceNo: currentTask.referenceNo,
        });
        if (exitActions.length > 0) {
          toast.info("Exit hooks executed", {
            description: exitActions.map(a => `✓ ${a}`).join(", "),
            duration: 3000,
          });
        }
      }
    }

    // 2. Audit field stamping — auto-set fields like ApprovedBy, ApprovedDate
    let auditFieldValues: Record<string, string> = {};
    if (actionId) {
      const auditFields = designer.getActionAuditFields(actionId);
      auditFieldValues = { ...(currentTask?.auditFieldValues || {}) };
      const actionDef = designer.actions.find(a => a.id === actionId);
      const actionName = actionDef?.name || actionLabel;

      auditFields.forEach(af => {
        const field = designer.fields.find(f => f.id === af.fieldId);
        const fieldLabel = field?.name || `Field_${af.fieldId}`;
        const baseName = actionName.replace(/^(Start|Set|Give)\s*/i, "").replace(/\s+/g, "");
        if (af.auditType === 1) {
          auditFieldValues[`${baseName}By`] = currentUserName;
          auditFieldValues[`${fieldLabel}_StampedBy`] = currentUserName;
        } else if (af.auditType === 2) {
          auditFieldValues[`${baseName}Date`] = new Date().toISOString();
          auditFieldValues[`${fieldLabel}_StampedAt`] = new Date().toISOString();
        }
      });
    }

    // 3. Update the task
    updateTask(taskId, {
      status: runtimeStatus,
      designerStatusName: nextStatusName,
      auditFieldValues: Object.keys(auditFieldValues).length > 0 ? auditFieldValues : undefined,
      ...(closeOnAction || runtimeStatus === "Approved" || runtimeStatus === "Rejected" || runtimeStatus === "Completed"
        ? { completedAt: new Date().toISOString() }
        : {}),
    }, remarks || `${actionLabel} → ${nextStatusDisplay}`);

    // 4. onEntry token — execute after entering next status
    if (pathId && currentTask) {
      const path = designer.paths.find(p => p.id === pathId);
      if (path?.onEntryToken) {
        const { entryActions } = designer.executeEntryExitTokens(path.onEntryToken, "", {
          documentId: currentTask.documentId,
          module,
          userName: currentUserName,
          referenceNo: currentTask.referenceNo,
        });
        if (entryActions.length > 0) {
          toast.info("Entry hooks executed", {
            description: entryActions.map(a => `✓ ${a}`).join(", "),
            duration: 3000,
          });
        }
      }
    }

    // 5. Notification delivery — fire notifications from path messages
    if (pathId) {
      const pathMsgs = designer.getPathMessagesForPath(pathId);
      pathMsgs.forEach(msg => {
        if (!msg.isNotificationEnabled) return;
        const body = msg.bodyTemplate
          .replace("{ReferenceNo}", currentTask?.referenceNo || currentTask?.documentId || "")
          .replace("{Owner}", currentTask?.createdBy || "")
          .replace("{ActionTaker}", currentUserName)
          .replace("{Remarks}", remarks || "");
        const subject = msg.subjectTemplate
          .replace("{ReferenceNo}", currentTask?.referenceNo || currentTask?.documentId || "");

        addNotification({
          title: subject,
          message: body,
          type: runtimeStatus === "Rejected" ? "warning" : "success",
          module,
        });

        toast.success(subject, { description: body, duration: 5000 });
      });
    }

    // 6. Escalation check on the new status
    if (currentTask?.workflowProfileId) {
      const nextStatusDef = designer.getStatusByName(currentTask.workflowProfileId, nextStatusName);
      if (nextStatusDef) {
        const escalation = designer.checkEscalation(nextStatusDef.id, 0);
        if (escalation && escalation.shouldNotify) {
          // This would normally be handled by a background scheduler
          // Here we just set up the escalation awareness
          console.log(`[Workflow] Escalation configured for status ${nextStatusName}: notify after ${escalation.notificationCount} cycles`);
        }
      }
    }

    // 7. Show audit stamp toast
    if (Object.keys(auditFieldValues).length > 0) {
      const stampSummary = Object.entries(auditFieldValues)
        .filter(([k]) => k.endsWith("By") || k.endsWith("Date"))
        .filter(([k]) => !k.includes("_Stamped"))
        .map(([k, v]) => `${k}: ${k.endsWith("Date") ? new Date(v).toLocaleString() : v}`)
        .join(", ");
      if (stampSummary) {
        toast.info("Audit fields stamped", { description: stampSummary, duration: 4000 });
      }
    }
  };

  const handlePathAction = (pathEntry: ReturnType<typeof getAvailablePaths>[0]) => {
    if (!task) return;
    const { path, action, nextStatus } = pathEntry;

    // Check required fields
    const requiredFields = designer.getPathRequiredFields(path.id).map(f => f.name);

    if (action.withConfirmation || action.withRemark || requiredFields.length > 0) {
      setActionDialog({
        pathId: path.id,
        actionId: action.id,
        actionName: action.name,
        actionDisplayName: action.displayName,
        nextStatusName: nextStatus.name,
        nextStatusDisplayName: nextStatus.displayName,
        taskId: task.id,
        withRemark: action.withRemark,
        withConfirmation: action.withConfirmation,
        confirmationMessage: path.confirmationMessageTemplate,
        closeOnAction: path.closeOnAction,
        workflowProfileId: task.workflowProfileId || 0,
        requiredFields,
      });
    } else {
      executeTransition(task.id, nextStatus.name, nextStatus.displayName, action.displayName, "", path.closeOnAction, path.id, action.id);
    }
  };

  const confirmAction = () => {
    if (!actionDialog) return;
    executeTransition(
      actionDialog.taskId, actionDialog.nextStatusName, actionDialog.nextStatusDisplayName,
      actionDialog.actionDisplayName, remark, actionDialog.closeOnAction,
      actionDialog.pathId, actionDialog.actionId
    );
    setActionDialog(null);
    setRemark("");
  };

  // ── Render ──

  const availablePaths = task ? getAvailablePaths() : [];
  const isTerminal = task && (task.status === "Approved" || task.status === "Rejected" || task.status === "Completed" || task.status === "Cancelled");

  // No task or Draft with no designer paths → show Submit
  if (!task || (task.designerStatusName === "Draft" && availablePaths.length > 0) || (!task.workflowProfileId && task.status === "Draft")) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          className={`gap-1 text-primary border-primary/30 hover:bg-primary/10 ${compact ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-xs"}`}
          onClick={handleInitialSubmit}
        >
          <Send className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
          {compact ? "Submit" : (availablePaths[0]?.action.displayName || "Submit")}
        </Button>
        {renderActionDialog()}
      </>
    );
  }

  // Has available paths from designer → show dynamic action buttons
  if (availablePaths.length > 0 && !isTerminal) {
    return (
      <>
        <div className="flex gap-1">
          {availablePaths.map(entry => {
            const isPositive = entry.action.name.toLowerCase().includes("approve") ||
              entry.action.name.toLowerCase().includes("post") ||
              entry.action.name.toLowerCase().includes("close") ||
              entry.action.name.toLowerCase().includes("confirm");
            const isNegative = entry.action.name.toLowerCase().includes("reject");

            const colorClass = isNegative
              ? "text-destructive hover:bg-destructive/10"
              : isPositive
                ? "text-success hover:bg-success/10"
                : "text-primary hover:bg-primary/10";

            const ActionIcon = isNegative ? XCircle : isPositive ? CheckCircle : Zap;

            return (
              <Tooltip key={entry.path.id}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={`${colorClass} ${compact ? "h-6 w-6 p-0" : "h-7 px-2 text-xs gap-1"}`}
                    onClick={() => handlePathAction(entry)}
                  >
                    <ActionIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                    {!compact && entry.action.displayName}
                  </Button>
                </TooltipTrigger>
                {compact && (
                  <TooltipContent>
                    <p className="text-xs">{entry.action.displayName}</p>
                    <p className="text-[10px] text-muted-foreground">→ {entry.nextStatus.displayName}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
        {renderActionDialog()}
      </>
    );
  }

  // Terminal or no paths — nothing to render
  return <>{renderActionDialog()}</>;

  // Action confirmation dialog
  function renderActionDialog() {
    // Get audit fields that will be stamped for this action
    const auditFieldsPreview = actionDialog?.actionId
      ? designer.getActionAuditFields(actionDialog.actionId).map(af => {
          const field = designer.fields.find(f => f.id === af.fieldId);
          const actionDef = designer.actions.find(a => a.id === actionDialog.actionId);
          const baseName = (actionDef?.name || "").replace(/^(Start|Set|Give)\s*/i, "").replace(/\s+/g, "");
          return {
            label: af.auditType === 1 ? `${baseName}By` : `${baseName}Date`,
            value: af.auditType === 1 ? currentUserName : "Current Date/Time",
            icon: af.auditType === 1 ? User : Clock,
          };
        })
      : [];

    // Get onEntry/onExit tokens for the selected path
    const pathDef = actionDialog ? designer.paths.find(p => p.id === actionDialog.pathId) : null;
    const entryTokens = pathDef?.onEntryToken
      ? pathDef.onEntryToken.split(",").map(t => t.trim().replace(/[{}]/g, "")).filter(Boolean)
      : [];
    const exitTokens = pathDef?.onExitToken
      ? pathDef.onExitToken.split(",").map(t => t.trim().replace(/[{}]/g, "")).filter(Boolean)
      : [];

    // Get field visibility for the NEXT status
    const fieldVisibility = actionDialog?.workflowProfileId
      ? designer.getFieldVisibility(actionDialog.workflowProfileId, actionDialog.nextStatusName, true)
      : [];

    // Get escalation info for next status
    const nextStatusDef = actionDialog?.workflowProfileId
      ? designer.getStatusByName(actionDialog.workflowProfileId, actionDialog.nextStatusName)
      : null;
    const escalationSetting = nextStatusDef
      ? designer.getStatusNotificationSetting(nextStatusDef.id)
      : null;

    return (
      <Dialog open={!!actionDialog} onOpenChange={open => { if (!open) { setActionDialog(null); setRemark(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {actionDialog?.actionDisplayName}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
          <div className="space-y-3 pr-2">
            {actionDialog?.confirmationMessage && (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border/50">
                {actionDialog.confirmationMessage}
              </div>
            )}
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3" />
              Transition to: <span className="font-semibold text-foreground">{actionDialog?.nextStatusDisplayName}</span>
            </div>

            {/* Required fields warning */}
            {actionDialog?.requiredFields && actionDialog.requiredFields.length > 0 && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-2.5 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-warning">Required Fields</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {actionDialog.requiredFields.join(", ")} must be filled before this action.
                  </p>
                </div>
              </div>
            )}

            {/* Audit fields preview */}
            {auditFieldsPreview.length > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Auto-Stamp Fields</p>
                {auditFieldsPreview.map((af, idx) => {
                  const Icon = af.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs text-foreground py-0.5">
                      <Icon className="h-3 w-3 text-primary" />
                      <span className="font-mono text-[11px]">{af.label}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-muted-foreground">{af.value}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* onEntry/onExit hooks */}
            {(entryTokens.length > 0 || exitTokens.length > 0) && (
              <div className="bg-accent/50 border border-border/50 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">Automation Hooks</p>
                {exitTokens.length > 0 && (
                  <div className="mb-1">
                    <p className="text-[10px] text-muted-foreground font-medium">On Exit (current status):</p>
                    {exitTokens.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-foreground pl-2 py-0.5">
                        <Zap className="h-2.5 w-2.5 text-amber-500" /> {t}
                      </div>
                    ))}
                  </div>
                )}
                {entryTokens.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium">On Entry (next status):</p>
                    {entryTokens.map((t, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-foreground pl-2 py-0.5">
                        <Zap className="h-2.5 w-2.5 text-emerald-500" /> {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Field visibility in next status */}
            {fieldVisibility.length > 0 && (
              <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                  Field Permissions ({actionDialog?.nextStatusDisplayName})
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {fieldVisibility.map((fv, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      {fv.editable ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Editable" />
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                      )}
                      <span className={`${fv.editable ? "text-foreground" : "text-muted-foreground"}`}>
                        {fv.field.name}
                      </span>
                      {fv.required && <span className="text-destructive text-[9px]">*</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Escalation info */}
            {escalationSetting && (
              <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-2.5 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-medium text-orange-600 dark:text-orange-400">Escalation Configured</p>
                  <p className="text-[10px] text-muted-foreground">
                    Reminder after {escalationSetting.elapsedDays}d, every {escalationSetting.recursEvery}d ({escalationSetting.noOfNotifications}×).
                    Escalates every {escalationSetting.escalationRecursEvery}d ({escalationSetting.escalationNoOfNotifications}×).
                  </p>
                </div>
              </div>
            )}

            {actionDialog?.withRemark && (
              <div>
                <Label>
                  Remarks
                  {actionDialog.actionName.toLowerCase().includes("reject") && <span className="text-destructive"> *</span>}
                </Label>
                <Textarea
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  placeholder="Add comments or remarks..."
                  rows={3}
                />
              </div>
            )}
          </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setActionDialog(null); setRemark(""); }}>Cancel</Button>
            <Button
              size="sm"
              onClick={confirmAction}
              disabled={actionDialog?.withRemark && actionDialog.actionName.toLowerCase().includes("reject") && !remark.trim()}
            >
              Confirm {actionDialog?.actionDisplayName}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
};

// ========================
// Combined Workflow Cell
// ========================
export const WorkflowCell = ({
  documentId, module,
}: {
  documentId: string; module: string;
}) => {
  return (
    <div className="flex items-center gap-1.5">
      <WorkflowStatusIndicator documentId={documentId} module={module} />
      <WorkflowActionButtons documentId={documentId} module={module} compact />
    </div>
  );
};
