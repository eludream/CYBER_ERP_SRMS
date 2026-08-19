import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useERP } from "@/contexts/ERPContext";

// ========================
// Workflow Engine Types
// ========================

export type WorkflowStatus = "Draft" | "In Progress" | "Pending Approval" | "Approved" | "Rejected" | "Completed" | "On Hold" | "Cancelled";
export type WorkflowPriority = "Low" | "Medium" | "High" | "Critical";
export type AutomationTrigger = "amount_exceeds" | "status_changed" | "created" | "overdue" | "field_equals";
export type AutomationAction = "route_to_approver" | "send_notification" | "update_status" | "create_task" | "escalate";

export interface WorkflowStep {
  id: string;
  name: string;
  assignee: string;
  role: string;
  status: WorkflowStatus;
  order: number;
  completedAt?: string;
  comments?: string;
}

export interface ApprovalChain {
  id: string;
  name: string;
  module: string;
  documentType: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
  conditions?: string;
}

export interface WorkflowAuditEntry {
  id: string;
  documentId: string;
  module: string;
  action: string;
  fromStatus: WorkflowStatus | null;
  toStatus: WorkflowStatus;
  performedBy: string;
  remarks: string;
  timestamp: string;
}

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  module: string;
  documentType: string;
  documentId: string;
  referenceNo?: string; // Generated from workflow sequence
  status: WorkflowStatus;
  priority: WorkflowPriority;
  assignee: string;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  approvalChainId?: string;
  currentStep?: number;
  totalSteps?: number;
  tags: string[];
  // Designer integration
  workflowProfileId?: number;
  designerStatusName?: string; // maps to WorkflowStatusDef.name
  // Audit field values auto-stamped on transitions
  auditFieldValues?: Record<string, string>; // e.g. { "ApprovedBy": "Admin User", "ApprovedDate": "2026-03-08T10:00:00" }
}

export interface AutomationRule {
  id: string;
  name: string;
  module: string;
  documentType: string;
  trigger: AutomationTrigger;
  triggerValue: string;
  action: AutomationAction;
  actionConfig: Record<string, string>;
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
}

interface WorkflowContextType {
  // Approval Chains
  approvalChains: ApprovalChain[];
  addApprovalChain: (chain: Omit<ApprovalChain, "id" | "createdAt">) => void;
  updateApprovalChain: (id: string, updates: Partial<ApprovalChain>) => void;
  deleteApprovalChain: (id: string) => void;

  // Tasks
  tasks: WorkflowTask[];
  addTask: (task: Omit<WorkflowTask, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<WorkflowTask>, remarks?: string) => void;
  deleteTask: (id: string) => void;
  getModuleTasks: (module: string) => WorkflowTask[];

  // Audit Trail
  auditTrail: WorkflowAuditEntry[];
  getDocumentHistory: (documentId: string, module: string) => WorkflowAuditEntry[];
  addAuditEntry: (entry: Omit<WorkflowAuditEntry, "id" | "timestamp">) => void;

  // Automation Rules
  automationRules: AutomationRule[];
  addAutomationRule: (rule: Omit<AutomationRule, "id" | "createdAt" | "executionCount">) => void;
  updateAutomationRule: (id: string, updates: Partial<AutomationRule>) => void;
  deleteAutomationRule: (id: string) => void;
  toggleAutomationRule: (id: string) => void;

  // Stats
  stats: {
    totalTasks: number;
    pendingApprovals: number;
    activeRules: number;
    completedToday: number;
    overdueCount: number;
  };
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const generateId = () => `wf-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

// ========================
// Seed Data
// ========================

const seedApprovalChains: ApprovalChain[] = [
  {
    id: "ac-1", name: "Purchase Order Approval", module: "procurement", documentType: "Purchase Order",
    isActive: true, createdAt: "2026-01-15T10:00:00", conditions: "Amount > $5,000",
    steps: [
      { id: "s1", name: "Manager Review", assignee: "Sarah Chen", role: "Procurement Manager", status: "Completed", order: 1, completedAt: "2026-03-07T14:00:00" },
      { id: "s2", name: "Director Approval", assignee: "James Okafor", role: "Finance Director", status: "Pending Approval", order: 2 },
      { id: "s3", name: "CFO Sign-off", assignee: "Victoria Mensah", role: "CFO", status: "Draft", order: 3 },
    ],
  },
  {
    id: "ac-2", name: "Leave Request Approval", module: "hr", documentType: "Leave Request",
    isActive: true, createdAt: "2026-01-20T09:00:00",
    steps: [
      { id: "s4", name: "Line Manager", assignee: "Team Lead", role: "Line Manager", status: "Completed", order: 1 },
      { id: "s5", name: "HR Confirmation", assignee: "HR Department", role: "HR Manager", status: "Draft", order: 2 },
    ],
  },
  {
    id: "ac-3", name: "Journal Entry Posting", module: "finance", documentType: "Journal Entry",
    isActive: true, createdAt: "2026-02-01T08:00:00", conditions: "Amount > $10,000",
    steps: [
      { id: "s6", name: "Accountant Review", assignee: "Chidi Nnamdi", role: "Senior Accountant", status: "Completed", order: 1 },
      { id: "s7", name: "Controller Approval", assignee: "James Okafor", role: "Financial Controller", status: "Pending Approval", order: 2 },
    ],
  },
  {
    id: "ac-4", name: "NCR Disposition", module: "quality", documentType: "Non-Conformance Report",
    isActive: true, createdAt: "2026-02-10T11:00:00",
    steps: [
      { id: "s8", name: "QA Review", assignee: "Emeka Udo", role: "QA Inspector", status: "Completed", order: 1 },
      { id: "s9", name: "Quality Manager", assignee: "Dr. Adaeze Eke", role: "Quality Manager", status: "Pending Approval", order: 2 },
      { id: "s10", name: "Plant Director", assignee: "Chief Ops", role: "Plant Director", status: "Draft", order: 3 },
    ],
  },
];

const seedTasks: WorkflowTask[] = [
  { id: "t1", title: "Review PO-1892 for Steel Supplies", description: "Review and approve purchase order for raw materials", module: "procurement", documentType: "Purchase Order", documentId: "PO-1892", referenceNo: "PO-1892", status: "Pending Approval", priority: "High", assignee: "James Okafor", createdBy: "Sarah Chen", createdAt: "2026-03-07T10:00:00", dueDate: "2026-03-09T17:00:00", approvalChainId: "ac-1", currentStep: 2, totalSteps: 3, tags: ["urgent", "materials"], workflowProfileId: 1, designerStatusName: "PendingDirectorApproval" },
  { id: "t2", title: "Approve Leave — Adaeze Okonkwo", description: "Annual leave request for March 15-20", module: "hr", documentType: "Leave Request", documentId: "LR-445", referenceNo: "LR-445", status: "Pending Approval", priority: "Low", assignee: "Team Lead", createdBy: "Adaeze Okonkwo", createdAt: "2026-03-08T07:30:00", dueDate: "2026-03-12T17:00:00", approvalChainId: "ac-2", currentStep: 1, totalSteps: 2, tags: ["leave"], workflowProfileId: 2, designerStatusName: "PendingManagerApproval" },
  { id: "t3", title: "Post Depreciation Journal", description: "Monthly depreciation run for all fixed assets", module: "finance", documentType: "Journal Entry", documentId: "JE-1004", referenceNo: "JE-1004", status: "Pending Approval", priority: "Medium", assignee: "James Okafor", createdBy: "System", createdAt: "2026-03-06T08:00:00", dueDate: "2026-03-10T17:00:00", approvalChainId: "ac-3", currentStep: 2, totalSteps: 2, tags: ["month-end"], workflowProfileId: 3, designerStatusName: "UnderReview" },
  { id: "t4", title: "NCR-201 Disposition Review", description: "Critical dimensional deviation on Component B12", module: "quality", documentType: "NCR", documentId: "NCR-201", referenceNo: "NCR-201", status: "In Progress", priority: "Critical", assignee: "Dr. Adaeze Eke", createdBy: "Emeka Udo", createdAt: "2026-03-07T15:00:00", dueDate: "2026-03-08T17:00:00", approvalChainId: "ac-4", currentStep: 2, totalSteps: 3, tags: ["critical", "quality"], workflowProfileId: 4, designerStatusName: "UnderInvestigation" },
  { id: "t5", title: "Sales Order SO-4525 Credit Check", description: "Verify credit limit for Nexus Group order", module: "sales", documentType: "Sales Order", documentId: "SO-4525", referenceNo: "SO-4525", status: "In Progress", priority: "Medium", assignee: "Finance Team", createdBy: "Admin User", createdAt: "2026-03-08T09:15:00", dueDate: "2026-03-09T12:00:00", tags: ["credit-check"], workflowProfileId: 1, designerStatusName: "PendingManagerApproval" },
  { id: "t6", title: "Goods Receipt QC — GRN-7004", description: "Quality inspection for received goods from Steel Supplies Co", module: "inventory", documentType: "Goods Receipt", documentId: "GRN-7004", referenceNo: "GRN-7004", status: "Draft", priority: "High", assignee: "QA Team", createdBy: "John Obi", createdAt: "2026-03-08T08:30:00", dueDate: "2026-03-09T17:00:00", tags: ["inspection"], workflowProfileId: 1, designerStatusName: "Draft" },
  { id: "t7", title: "Prepare Month-End Reports", description: "Compile financial statements for March close", module: "finance", documentType: "Report", documentId: "RPT-MAR", status: "Draft", priority: "Medium", assignee: "Chidi Nnamdi", createdBy: "James Okafor", createdAt: "2026-03-05T10:00:00", dueDate: "2026-03-15T17:00:00", tags: ["month-end", "reporting"] },
  { id: "t8", title: "Update BOM for Module C7", description: "Revise bill of materials after design change", module: "production", documentType: "BOM", documentId: "BOM-C7", status: "Completed", priority: "Medium", assignee: "Engineering", createdBy: "Production Lead", createdAt: "2026-03-03T10:00:00", dueDate: "2026-03-06T17:00:00", completedAt: "2026-03-05T16:00:00", tags: ["engineering"] },
];

const seedAutomationRules: AutomationRule[] = [
  { id: "ar-1", name: "Auto-route PO > $5,000", module: "procurement", documentType: "Purchase Order", trigger: "amount_exceeds", triggerValue: "5000", action: "route_to_approver", actionConfig: { approver: "Finance Director", chain: "ac-1" }, isActive: true, executionCount: 23, lastExecuted: "2026-03-07T10:00:00", createdAt: "2026-01-15T10:00:00" },
  { id: "ar-2", name: "Notify on critical NCR", module: "quality", documentType: "NCR", trigger: "field_equals", triggerValue: "priority=Critical", action: "send_notification", actionConfig: { recipients: "Quality Manager, Plant Director" }, isActive: true, executionCount: 8, lastExecuted: "2026-03-07T15:00:00", createdAt: "2026-02-01T09:00:00" },
  { id: "ar-3", name: "Escalate overdue approvals", module: "all", documentType: "All", trigger: "overdue", triggerValue: "48h", action: "escalate", actionConfig: { escalateTo: "Department Head", notification: "true" }, isActive: true, executionCount: 12, lastExecuted: "2026-03-06T08:00:00", createdAt: "2026-01-20T11:00:00" },
  { id: "ar-4", name: "Auto-create QC task on GRN", module: "procurement", documentType: "Goods Receipt", trigger: "created", triggerValue: "", action: "create_task", actionConfig: { assignTo: "QA Team", priority: "High" }, isActive: true, executionCount: 45, lastExecuted: "2026-03-08T08:30:00", createdAt: "2026-01-10T14:00:00" },
  { id: "ar-5", name: "Hold SO on credit exceeded", module: "sales", documentType: "Sales Order", trigger: "amount_exceeds", triggerValue: "credit_limit", action: "update_status", actionConfig: { newStatus: "On Hold", reason: "Credit limit exceeded" }, isActive: false, executionCount: 5, lastExecuted: "2026-03-07T15:00:00", createdAt: "2026-02-15T10:00:00" },
];

const seedAuditTrail: WorkflowAuditEntry[] = [
  { id: "audit-1", documentId: "PO-1892", module: "procurement", action: "Created", fromStatus: null, toStatus: "Draft", performedBy: "Sarah Chen", remarks: "Purchase order created for Steel Supplies Co", timestamp: "2026-03-07T09:30:00" },
  { id: "audit-2", documentId: "PO-1892", module: "procurement", action: "Submitted for Approval", fromStatus: "Draft", toStatus: "Pending Approval", performedBy: "Sarah Chen", remarks: "Submitted for manager review", timestamp: "2026-03-07T10:00:00" },
  { id: "audit-3", documentId: "PO-1892", module: "procurement", action: "Approved", fromStatus: "Pending Approval", toStatus: "Pending Approval", performedBy: "Sarah Chen", remarks: "Manager review completed. Forwarded to Director.", timestamp: "2026-03-07T14:00:00" },
  { id: "audit-4", documentId: "NCR-201", module: "quality", action: "Created", fromStatus: null, toStatus: "Draft", performedBy: "Emeka Udo", remarks: "Critical dimensional deviation on Component B12", timestamp: "2026-03-07T14:30:00" },
  { id: "audit-5", documentId: "NCR-201", module: "quality", action: "Submitted for Review", fromStatus: "Draft", toStatus: "In Progress", performedBy: "Emeka Udo", remarks: "Forwarded to Quality Manager for disposition", timestamp: "2026-03-07T15:00:00" },
  { id: "audit-6", documentId: "LR-445", module: "hr", action: "Created", fromStatus: null, toStatus: "Draft", performedBy: "Adaeze Okonkwo", remarks: "Annual leave request March 15-20", timestamp: "2026-03-08T07:00:00" },
  { id: "audit-7", documentId: "LR-445", module: "hr", action: "Submitted for Approval", fromStatus: "Draft", toStatus: "Pending Approval", performedBy: "Adaeze Okonkwo", remarks: "", timestamp: "2026-03-08T07:30:00" },
  { id: "audit-8", documentId: "JE-1004", module: "finance", action: "Created", fromStatus: null, toStatus: "Draft", performedBy: "System", remarks: "Auto-generated monthly depreciation journal", timestamp: "2026-03-06T07:00:00" },
  { id: "audit-9", documentId: "JE-1004", module: "finance", action: "Reviewed", fromStatus: "Draft", toStatus: "Pending Approval", performedBy: "Chidi Nnamdi", remarks: "Verified asset register totals match", timestamp: "2026-03-06T08:00:00" },
  { id: "audit-10", documentId: "BOM-C7", module: "production", action: "Created", fromStatus: null, toStatus: "Draft", performedBy: "Production Lead", remarks: "", timestamp: "2026-03-03T10:00:00" },
  { id: "audit-11", documentId: "BOM-C7", module: "production", action: "Completed", fromStatus: "In Progress", toStatus: "Completed", performedBy: "Engineering", remarks: "BOM revision applied after design change ECO-442", timestamp: "2026-03-05T16:00:00" },
];

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [approvalChains, setApprovalChains] = useState<ApprovalChain[]>(seedApprovalChains);
  const [tasks, setTasks] = useState<WorkflowTask[]>(seedTasks);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(seedAutomationRules);
  const [auditTrail, setAuditTrail] = useState<WorkflowAuditEntry[]>(seedAuditTrail);

  const addAuditEntry = useCallback((entry: Omit<WorkflowAuditEntry, "id" | "timestamp">) => {
    setAuditTrail(prev => [...prev, { ...entry, id: generateId(), timestamp: new Date().toISOString() }]);
  }, []);

  const getDocumentHistory = useCallback((documentId: string, module: string) => {
    return auditTrail
      .filter(e => e.documentId === documentId && e.module === module)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [auditTrail]);

  const addApprovalChain = useCallback((chain: Omit<ApprovalChain, "id" | "createdAt">) => {
    setApprovalChains(prev => [{ ...chain, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
  }, []);

  const updateApprovalChain = useCallback((id: string, updates: Partial<ApprovalChain>) => {
    setApprovalChains(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteApprovalChain = useCallback((id: string) => {
    setApprovalChains(prev => prev.filter(c => c.id !== id));
  }, []);

  const addTask = useCallback((task: Omit<WorkflowTask, "id" | "createdAt">) => {
    const newTask = { ...task, id: generateId(), createdAt: new Date().toISOString() };
    setTasks(prev => [newTask, ...prev]);
    addAuditEntry({
      documentId: task.documentId,
      module: task.module,
      action: "Submitted for Approval",
      fromStatus: null,
      toStatus: task.status,
      performedBy: task.createdBy,
      remarks: task.referenceNo ? `Reference: ${task.referenceNo}` : "",
    });
  }, [addAuditEntry]);

  const updateTask = useCallback((id: string, updates: Partial<WorkflowTask>, remarks?: string) => {
    setTasks(prev => {
      const existing = prev.find(t => t.id === id);
      if (existing && updates.status && updates.status !== existing.status) {
        const actionLabel = updates.status === "Approved" ? "Approved" : updates.status === "Rejected" ? "Rejected" : `Status → ${updates.status}`;
        addAuditEntry({
          documentId: existing.documentId,
          module: existing.module,
          action: actionLabel,
          fromStatus: existing.status,
          toStatus: updates.status,
          performedBy: "Current User",
          remarks: remarks || "",
        });
      }
      return prev.map(t => t.id === id ? { ...t, ...updates } : t);
    });
  }, [addAuditEntry]);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const getModuleTasks = useCallback((module: string) => {
    return tasks.filter(t => t.module === module);
  }, [tasks]);

  const addAutomationRule = useCallback((rule: Omit<AutomationRule, "id" | "createdAt" | "executionCount">) => {
    setAutomationRules(prev => [{ ...rule, id: generateId(), createdAt: new Date().toISOString(), executionCount: 0 }, ...prev]);
  }, []);

  const updateAutomationRule = useCallback((id: string, updates: Partial<AutomationRule>) => {
    setAutomationRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteAutomationRule = useCallback((id: string) => {
    setAutomationRules(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleAutomationRule = useCallback((id: string) => {
    setAutomationRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const stats = {
    totalTasks: tasks.length,
    pendingApprovals: tasks.filter(t => t.status === "Pending Approval").length,
    activeRules: automationRules.filter(r => r.isActive).length,
    completedToday: tasks.filter(t => t.completedAt?.startsWith(today)).length,
    overdueCount: tasks.filter(t => t.status !== "Completed" && t.status !== "Cancelled" && new Date(t.dueDate) < new Date()).length,
  };

  return (
    <WorkflowContext.Provider value={{
      approvalChains, addApprovalChain, updateApprovalChain, deleteApprovalChain,
      tasks, addTask, updateTask, deleteTask, getModuleTasks,
      auditTrail, getDocumentHistory, addAuditEntry,
      automationRules, addAutomationRule, updateAutomationRule, deleteAutomationRule, toggleAutomationRule,
      stats,
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
};
