import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import type {
  WorkflowProfile, WorkflowStatusDef, WorkflowAction, WorkflowField,
  WorkflowPath, WorkflowMessage, WorkflowNotificationSetting, WorkflowStatusFieldAttribute,
  WorkflowSequence, WorkflowPathMessage, WorkflowPathRequiredField, WorkflowActionAuditField,
} from "@/types/workflowDesigner";

// ========================
// Seed Data
// ========================

// Profile-to-document-type binding: maps "module::documentType" to workflowId
export interface WorkflowProfileBinding {
  module: string;
  documentType: string;
  workflowId: number;
}

const seedProfiles: WorkflowProfile[] = [
  { id: 1, name: "Purchase Order", description: "Standard PO approval workflow", isNotificationEnabled: true },
  { id: 2, name: "Leave Request", description: "Employee leave approval", isNotificationEnabled: true },
  { id: 3, name: "Journal Entry", description: "Financial journal posting workflow", isNotificationEnabled: true },
  { id: 4, name: "Non-Conformance Report", description: "Quality NCR disposition workflow", isNotificationEnabled: false },
];

const seedStatuses: WorkflowStatusDef[] = [
  { id: 1, workflowId: 1, name: "Draft", displayName: "Draft", position: 0 },
  { id: 2, workflowId: 1, name: "PendingManagerApproval", displayName: "Pending Manager Approval", position: 1 },
  { id: 3, workflowId: 1, name: "PendingDirectorApproval", displayName: "Pending Director Approval", position: 2 },
  { id: 4, workflowId: 1, name: "Approved", displayName: "Approved", position: 3 },
  { id: 5, workflowId: 1, name: "Rejected", displayName: "Rejected", position: 4 },
  { id: 6, workflowId: 2, name: "Draft", displayName: "Draft", position: 0 },
  { id: 7, workflowId: 2, name: "PendingManagerApproval", displayName: "Pending Manager", position: 1 },
  { id: 8, workflowId: 2, name: "PendingHR", displayName: "Pending HR Confirmation", position: 2 },
  { id: 9, workflowId: 2, name: "Approved", displayName: "Approved", position: 3 },
  { id: 10, workflowId: 2, name: "Rejected", displayName: "Rejected", position: 4 },
  { id: 11, workflowId: 3, name: "Draft", displayName: "Draft", position: 0 },
  { id: 12, workflowId: 3, name: "UnderReview", displayName: "Under Review", position: 1 },
  { id: 13, workflowId: 3, name: "Posted", displayName: "Posted", position: 2 },
  { id: 14, workflowId: 3, name: "Rejected", displayName: "Rejected", position: 3 },
  { id: 15, workflowId: 4, name: "Open", displayName: "Open", position: 0 },
  { id: 16, workflowId: 4, name: "UnderInvestigation", displayName: "Under Investigation", position: 1 },
  { id: 17, workflowId: 4, name: "Dispositioned", displayName: "Dispositioned", position: 2 },
  { id: 18, workflowId: 4, name: "Closed", displayName: "Closed", position: 3 },
];

const seedActions: WorkflowAction[] = [
  { id: 1, workflowId: 1, name: "Submit", displayName: "Submit for Approval", withRemark: false, withConfirmation: true, position: 0 },
  { id: 2, workflowId: 1, name: "Approve", displayName: "Approve", withRemark: true, withConfirmation: true, position: 1 },
  { id: 3, workflowId: 1, name: "Reject", displayName: "Reject", withRemark: true, withConfirmation: true, position: 2 },
  { id: 4, workflowId: 1, name: "Escalate", displayName: "Escalate", withRemark: true, withConfirmation: false, position: 3 },
  { id: 5, workflowId: 2, name: "Submit", displayName: "Submit Request", withRemark: false, withConfirmation: true, position: 0 },
  { id: 6, workflowId: 2, name: "Approve", displayName: "Approve", withRemark: false, withConfirmation: true, position: 1 },
  { id: 7, workflowId: 2, name: "Reject", displayName: "Reject", withRemark: true, withConfirmation: true, position: 2 },
  { id: 8, workflowId: 3, name: "Submit", displayName: "Submit Entry", withRemark: false, withConfirmation: true, position: 0 },
  { id: 9, workflowId: 3, name: "Post", displayName: "Post Entry", withRemark: false, withConfirmation: true, position: 1 },
  { id: 10, workflowId: 3, name: "Reject", displayName: "Reject", withRemark: true, withConfirmation: true, position: 2 },
  { id: 11, workflowId: 4, name: "StartInvestigation", displayName: "Start Investigation", withRemark: true, withConfirmation: false, position: 0 },
  { id: 12, workflowId: 4, name: "Disposition", displayName: "Set Disposition", withRemark: true, withConfirmation: true, position: 1 },
  { id: 13, workflowId: 4, name: "Close", displayName: "Close NCR", withRemark: true, withConfirmation: true, position: 2 },
];

const seedPaths: WorkflowPath[] = [
  { id: 1, actionId: 1, currentStatusId: 1, nextStatusId: 2, businessRule: "", allowedUsersToken: "{Owner}", notificationDateToken: "", onEntryToken: "{LockFields}", onExitToken: "{LogSubmission}", confirmationMessageTemplate: "Submit this PO for approval?", resultMessage: "PO submitted successfully", historyTemplate: "{User} submitted PO", closeOnAction: false, enabled: true, position: 0 },
  { id: 2, actionId: 2, currentStatusId: 2, nextStatusId: 3, businessRule: "Amount>5000", allowedUsersToken: "{ProcurementManager}", notificationDateToken: "", onEntryToken: "{NotifyDirector}", onExitToken: "{LogManagerApproval}", confirmationMessageTemplate: "Approve this PO?", resultMessage: "PO approved by manager", historyTemplate: "{User} approved (manager level)", closeOnAction: false, enabled: true, position: 1 },
  { id: 3, actionId: 2, currentStatusId: 3, nextStatusId: 4, businessRule: "", allowedUsersToken: "{FinanceDirector}", notificationDateToken: "", onEntryToken: "{GeneratePDF},{UpdateInventory}", onExitToken: "{LogFinalApproval}", confirmationMessageTemplate: "Give final approval?", resultMessage: "PO fully approved", historyTemplate: "{User} gave final approval", closeOnAction: true, enabled: true, position: 2 },
  { id: 4, actionId: 3, currentStatusId: 2, nextStatusId: 5, businessRule: "", allowedUsersToken: "{ProcurementManager}", notificationDateToken: "", onEntryToken: "{NotifyOwner}", onExitToken: "{LogRejection}", confirmationMessageTemplate: "Reject this PO?", resultMessage: "PO rejected", historyTemplate: "{User} rejected PO", closeOnAction: true, enabled: true, position: 3 },
  { id: 5, actionId: 5, currentStatusId: 6, nextStatusId: 7, businessRule: "", allowedUsersToken: "{Owner}", notificationDateToken: "", onEntryToken: "{LockLeaveDates}", onExitToken: "{LogLeaveSubmission}", confirmationMessageTemplate: "Submit leave request?", resultMessage: "Leave request submitted", historyTemplate: "{User} submitted leave request", closeOnAction: false, enabled: true, position: 0 },
  { id: 6, actionId: 6, currentStatusId: 7, nextStatusId: 8, businessRule: "", allowedUsersToken: "{LineManager}", notificationDateToken: "", onEntryToken: "{NotifyHR}", onExitToken: "{DeductLeaveBalance}", confirmationMessageTemplate: "Approve this leave?", resultMessage: "Leave approved by manager", historyTemplate: "{User} approved leave", closeOnAction: false, enabled: true, position: 1 },
  { id: 7, actionId: 6, currentStatusId: 8, nextStatusId: 9, businessRule: "", allowedUsersToken: "{HRManager}", notificationDateToken: "", onEntryToken: "{UpdateCalendar}", onExitToken: "{SendConfirmation}", confirmationMessageTemplate: "Confirm this leave?", resultMessage: "Leave confirmed", historyTemplate: "{User} confirmed leave", closeOnAction: true, enabled: true, position: 2 },
];

const seedFields: WorkflowField[] = [
  { id: 1, workflowId: 1, name: "Amount", position: 0 },
  { id: 2, workflowId: 1, name: "Supplier", position: 1 },
  { id: 3, workflowId: 1, name: "DeliveryDate", position: 2 },
  { id: 4, workflowId: 1, name: "Department", position: 3 },
  { id: 5, workflowId: 2, name: "StartDate", position: 0 },
  { id: 6, workflowId: 2, name: "EndDate", position: 1 },
  { id: 7, workflowId: 2, name: "LeaveType", position: 2 },
  { id: 8, workflowId: 3, name: "Amount", position: 0 },
  { id: 9, workflowId: 3, name: "Account", position: 1 },
];

const seedMessages: WorkflowMessage[] = [
  { id: 1, workflowId: 1, name: "PO Submitted", bodyTemplate: "PO {ReferenceNo} has been submitted by {Owner} for your approval.", sendToToken: "{NextApprover}", ccToken: "{Owner}", subjectTemplate: "PO {ReferenceNo} - Pending Approval", shouldSendMail: true, escalateToUsersToken: "", isNotificationEnabled: true, position: 0 },
  { id: 2, workflowId: 1, name: "PO Approved", bodyTemplate: "PO {ReferenceNo} has been approved by {ActionTaker}.", sendToToken: "{Owner}", ccToken: "", subjectTemplate: "PO {ReferenceNo} - Approved", shouldSendMail: true, escalateToUsersToken: "", isNotificationEnabled: true, position: 1 },
  { id: 3, workflowId: 1, name: "PO Rejected", bodyTemplate: "PO {ReferenceNo} has been rejected. Reason: {Remarks}", sendToToken: "{Owner}", ccToken: "", subjectTemplate: "PO {ReferenceNo} - Rejected", shouldSendMail: true, escalateToUsersToken: "", isNotificationEnabled: true, position: 2 },
  { id: 4, workflowId: 2, name: "Leave Submitted", bodyTemplate: "Leave request from {Owner} ({StartDate} - {EndDate}) pending your approval.", sendToToken: "{LineManager}", ccToken: "", subjectTemplate: "Leave Request - {Owner}", shouldSendMail: true, escalateToUsersToken: "", isNotificationEnabled: true, position: 0 },
];

const seedNotificationSettings: WorkflowNotificationSetting[] = [
  { workflowStatusId: 2, elapsedDays: 2, recursEvery: 1, noOfNotifications: 3, escalationRecursEvery: 2, escalationNoOfNotifications: 2 },
  { workflowStatusId: 3, elapsedDays: 1, recursEvery: 1, noOfNotifications: 5, escalationRecursEvery: 1, escalationNoOfNotifications: 3 },
];

const seedStatusFieldAttrs: WorkflowStatusFieldAttribute[] = [
  // PO workflow (profile 1): Draft (statusId 1) — fields editable
  { workflowStatusId: 1, fieldId: 1, editableForEditors: true, requiredForEditors: true, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 1, fieldId: 2, editableForEditors: true, requiredForEditors: true, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 1, fieldId: 3, editableForEditors: true, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 1, fieldId: 4, editableForEditors: true, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  // PO: Pending Manager (statusId 2) — fields read-only
  { workflowStatusId: 2, fieldId: 1, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 2, fieldId: 2, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 2, fieldId: 3, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 2, fieldId: 4, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: true },
  // PO: Pending Director (statusId 3) — all read-only, department hidden
  { workflowStatusId: 3, fieldId: 1, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 3, fieldId: 2, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 3, fieldId: 4, editableForEditors: false, requiredForEditors: false, hiddenForEditors: true, hiddenForReaders: true },
  // PO: Approved (statusId 4) — all read-only
  { workflowStatusId: 4, fieldId: 1, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 4, fieldId: 2, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  // Leave: Draft (statusId 6) — editable
  { workflowStatusId: 6, fieldId: 5, editableForEditors: true, requiredForEditors: true, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 6, fieldId: 6, editableForEditors: true, requiredForEditors: true, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 6, fieldId: 7, editableForEditors: true, requiredForEditors: true, hiddenForEditors: false, hiddenForReaders: false },
  // Leave: Pending Manager (statusId 7) — read-only
  { workflowStatusId: 7, fieldId: 5, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 7, fieldId: 6, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
  { workflowStatusId: 7, fieldId: 7, editableForEditors: false, requiredForEditors: false, hiddenForEditors: false, hiddenForReaders: false },
];

const seedPathMessages: WorkflowPathMessage[] = [
  { pathId: 1, messageId: 1 },
  { pathId: 3, messageId: 2 },
  { pathId: 4, messageId: 3 },
  { pathId: 5, messageId: 4 },
];

const seedPathRequiredFields: WorkflowPathRequiredField[] = [
  { pathId: 1, fieldId: 1 },  // Submit PO requires Amount
  { pathId: 1, fieldId: 2 },  // Submit PO requires Supplier
  { pathId: 5, fieldId: 5 },  // Submit Leave requires StartDate
  { pathId: 5, fieldId: 6 },  // Submit Leave requires EndDate
];

const seedActionAuditFields: WorkflowActionAuditField[] = [
  // When Approving PO (action 2): stamp ApprovedBy (user) and ApprovedDate (datetime)
  { actionId: 2, fieldId: 1, auditType: 1 },  // Amount → current user (acts as ApprovedBy)
  { actionId: 2, fieldId: 3, auditType: 2 },  // DeliveryDate → current datetime (acts as ApprovedDate)
  // When Rejecting PO (action 3): stamp RejectedBy
  { actionId: 3, fieldId: 1, auditType: 1 },
  // When Approving Leave (action 6): stamp approver
  { actionId: 6, fieldId: 5, auditType: 1 },
  { actionId: 6, fieldId: 6, auditType: 2 },
  // When Posting Journal (action 9): stamp PostedBy and PostedDate
  { actionId: 9, fieldId: 8, auditType: 1 },
  { actionId: 9, fieldId: 9, auditType: 2 },
];

const seedSequences: WorkflowSequence[] = [
  { workflowId: 1, value: 1892, month: 3, year: 2026, format: "PO-{Value}", resetType: 3 },
  { workflowId: 2, value: 445, month: 3, year: 2026, format: "LR-{Value}", resetType: 2 },
  { workflowId: 3, value: 1004, month: 3, year: 2026, format: "JE-{Value}", resetType: 1 },
  { workflowId: 4, value: 201, month: 3, year: 2026, format: "NCR-{Value}", resetType: 2 },
];

const seedProfileBindings: WorkflowProfileBinding[] = [
  { module: "procurement", documentType: "Purchase Order", workflowId: 1 },
  { module: "hr", documentType: "Leave Request", workflowId: 2 },
  { module: "finance", documentType: "Journal Entry", workflowId: 3 },
  { module: "quality", documentType: "NCR", workflowId: 4 },
  { module: "sales", documentType: "Sales Order", workflowId: 1 },
  { module: "sales", documentType: "Sales Invoice", workflowId: 3 },
  { module: "procurement", documentType: "Goods Receipt", workflowId: 1 },
];

let nextId = 100;
const genId = () => ++nextId;

// ========================
// Context
// ========================

interface WorkflowDesignerContextType {
  profiles: WorkflowProfile[];
  statuses: WorkflowStatusDef[];
  actions: WorkflowAction[];
  fields: WorkflowField[];
  paths: WorkflowPath[];
  messages: WorkflowMessage[];
  pathMessages: WorkflowPathMessage[];
  pathRequiredFields: WorkflowPathRequiredField[];
  actionAuditFields: WorkflowActionAuditField[];

  // Profile CRUD
  addProfile: (p: Omit<WorkflowProfile, "id">) => number;
  updateProfile: (id: number, u: Partial<WorkflowProfile>) => void;
  deleteProfile: (id: number) => void;

  // Status CRUD
  addStatus: (s: Omit<WorkflowStatusDef, "id">) => number;
  updateStatus: (id: number, u: Partial<WorkflowStatusDef>) => void;
  deleteStatus: (id: number) => void;

  // Action CRUD
  addAction: (a: Omit<WorkflowAction, "id">) => number;
  updateAction: (id: number, u: Partial<WorkflowAction>) => void;
  deleteAction: (id: number) => void;

  // Field CRUD
  addField: (f: Omit<WorkflowField, "id">) => number;
  updateField: (id: number, u: Partial<WorkflowField>) => void;
  deleteField: (id: number) => void;

  // Path CRUD
  addPath: (p: Omit<WorkflowPath, "id">) => number;
  updatePath: (id: number, u: Partial<WorkflowPath>) => void;
  deletePath: (id: number) => void;

  // Message CRUD
  addMessage: (m: Omit<WorkflowMessage, "id">) => number;
  updateMessage: (id: number, u: Partial<WorkflowMessage>) => void;
  deleteMessage: (id: number) => void;

  // Sequence CRUD
  sequences: WorkflowSequence[];
  getProfileSequence: (workflowId: number) => WorkflowSequence | undefined;
  upsertSequence: (seq: WorkflowSequence) => void;
  deleteSequence: (workflowId: number) => void;
  generateNextReference: (workflowId: number) => string;

  // Notification Settings CRUD
  notificationSettings: WorkflowNotificationSetting[];
  upsertNotificationSetting: (setting: WorkflowNotificationSetting) => void;
  deleteNotificationSetting: (workflowStatusId: number) => void;
  getStatusNotificationSetting: (workflowStatusId: number) => WorkflowNotificationSetting | undefined;

  // Status Field Attributes CRUD
  statusFieldAttributes: WorkflowStatusFieldAttribute[];
  upsertStatusFieldAttribute: (attr: WorkflowStatusFieldAttribute) => void;
  deleteStatusFieldAttribute: (workflowStatusId: number, fieldId: number) => void;
  getStatusFieldAttributes: (workflowStatusId: number) => WorkflowStatusFieldAttribute[];

  // Profile Bindings (module+docType → workflowId)
  profileBindings: WorkflowProfileBinding[];
  addProfileBinding: (binding: WorkflowProfileBinding) => void;
  removeProfileBinding: (module: string, documentType: string) => void;
  getProfileForDocument: (module: string, documentType: string) => WorkflowProfile | undefined;
  getAvailablePathsForStatus: (workflowId: number, currentStatusName: string) => Array<{
    path: WorkflowPath;
    action: WorkflowAction;
    nextStatus: WorkflowStatusDef;
  }>;
  getInitialStatus: (workflowId: number) => WorkflowStatusDef | undefined;
  getStatusByName: (workflowId: number, name: string) => WorkflowStatusDef | undefined;

  // Helpers
  getProfileStatuses: (workflowId: number) => WorkflowStatusDef[];
  getProfileActions: (workflowId: number) => WorkflowAction[];
  getProfileFields: (workflowId: number) => WorkflowField[];
  getProfilePaths: (workflowId: number) => WorkflowPath[];
  getProfileMessages: (workflowId: number) => WorkflowMessage[];

  // Runtime enforcement helpers
  getPathRequiredFields: (pathId: number) => WorkflowField[];
  getActionAuditFields: (actionId: number) => WorkflowActionAuditField[];
  getPathMessagesForPath: (pathId: number) => WorkflowMessage[];
  evaluateBusinessRule: (rule: string, context: Record<string, unknown>) => boolean;
  isUserAllowed: (allowedUsersToken: string, currentUserRole: string) => boolean;

  // onEntry/onExit token execution
  executeEntryExitTokens: (onEntryToken: string, onExitToken: string, context: {
    documentId: string; module: string; userName: string; referenceNo?: string;
  }) => { entryActions: string[]; exitActions: string[] };

  // Field visibility for current status
  getFieldVisibility: (workflowId: number, statusName: string, isEditor: boolean) => Array<{
    field: WorkflowField;
    editable: boolean;
    required: boolean;
    hidden: boolean;
  }>;

  // Escalation check
  checkEscalation: (workflowStatusId: number, daysInStatus: number) => {
    shouldNotify: boolean;
    shouldEscalate: boolean;
    notificationCount: number;
    escalationCount: number;
  } | null;
}

const WorkflowDesignerContext = createContext<WorkflowDesignerContextType | undefined>(undefined);

export const WorkflowDesignerProvider = ({ children }: { children: ReactNode }) => {
  const [profiles, setProfiles] = useState<WorkflowProfile[]>(seedProfiles);
  const [statuses, setStatuses] = useState<WorkflowStatusDef[]>(seedStatuses);
  const [actions, setActions] = useState<WorkflowAction[]>(seedActions);
  const [fields, setFields] = useState<WorkflowField[]>(seedFields);
  const [paths, setPaths] = useState<WorkflowPath[]>(seedPaths);
  const [messages, setMessages] = useState<WorkflowMessage[]>(seedMessages);
  const [sequences, setSequences] = useState<WorkflowSequence[]>(seedSequences);
  const [notificationSettings, setNotificationSettings] = useState<WorkflowNotificationSetting[]>(seedNotificationSettings);
  const [statusFieldAttributes, setStatusFieldAttributes] = useState<WorkflowStatusFieldAttribute[]>(seedStatusFieldAttrs);
  const [pathMessages] = useState<WorkflowPathMessage[]>(seedPathMessages);
  const [pathRequiredFields] = useState<WorkflowPathRequiredField[]>(seedPathRequiredFields);
  const [actionAuditFields] = useState<WorkflowActionAuditField[]>(seedActionAuditFields);
  const addProfile = useCallback((p: Omit<WorkflowProfile, "id">) => { const id = genId(); setProfiles(prev => [...prev, { ...p, id }]); return id; }, []);
  const updateProfile = useCallback((id: number, u: Partial<WorkflowProfile>) => { setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...u } : p)); }, []);
  const deleteProfile = useCallback((id: number) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  const addStatus = useCallback((s: Omit<WorkflowStatusDef, "id">) => { const id = genId(); setStatuses(prev => [...prev, { ...s, id }]); return id; }, []);
  const updateStatus = useCallback((id: number, u: Partial<WorkflowStatusDef>) => { setStatuses(prev => prev.map(s => s.id === id ? { ...s, ...u } : s)); }, []);
  const deleteStatus = useCallback((id: number) => { setStatuses(prev => prev.filter(s => s.id !== id)); }, []);

  const addAction = useCallback((a: Omit<WorkflowAction, "id">) => { const id = genId(); setActions(prev => [...prev, { ...a, id }]); return id; }, []);
  const updateAction = useCallback((id: number, u: Partial<WorkflowAction>) => { setActions(prev => prev.map(a => a.id === id ? { ...a, ...u } : a)); }, []);
  const deleteAction = useCallback((id: number) => { setActions(prev => prev.filter(a => a.id !== id)); }, []);

  const addField = useCallback((f: Omit<WorkflowField, "id">) => { const id = genId(); setFields(prev => [...prev, { ...f, id }]); return id; }, []);
  const updateField = useCallback((id: number, u: Partial<WorkflowField>) => { setFields(prev => prev.map(f => f.id === id ? { ...f, ...u } : f)); }, []);
  const deleteField = useCallback((id: number) => { setFields(prev => prev.filter(f => f.id !== id)); }, []);

  const addPath = useCallback((p: Omit<WorkflowPath, "id">) => { const id = genId(); setPaths(prev => [...prev, { ...p, id }]); return id; }, []);
  const updatePath = useCallback((id: number, u: Partial<WorkflowPath>) => { setPaths(prev => prev.map(p => p.id === id ? { ...p, ...u } : p)); }, []);
  const deletePath = useCallback((id: number) => { setPaths(prev => prev.filter(p => p.id !== id)); }, []);

  const addMessage = useCallback((m: Omit<WorkflowMessage, "id">) => { const id = genId(); setMessages(prev => [...prev, { ...m, id }]); return id; }, []);
  const updateMessage = useCallback((id: number, u: Partial<WorkflowMessage>) => { setMessages(prev => prev.map(m => m.id === id ? { ...m, ...u } : m)); }, []);
  const deleteMessage = useCallback((id: number) => { setMessages(prev => prev.filter(m => m.id !== id)); }, []);

  const getProfileSequence = useCallback((wid: number) => sequences.find(s => s.workflowId === wid), [sequences]);
  const upsertSequence = useCallback((seq: WorkflowSequence) => {
    setSequences(prev => {
      const exists = prev.find(s => s.workflowId === seq.workflowId);
      if (exists) return prev.map(s => s.workflowId === seq.workflowId ? seq : s);
      return [...prev, seq];
    });
  }, []);
  const deleteSequence = useCallback((workflowId: number) => {
    setSequences(prev => prev.filter(s => s.workflowId !== workflowId));
  }, []);
  const generateNextReference = useCallback((workflowId: number) => {
    const seq = sequences.find(s => s.workflowId === workflowId);
    if (!seq) return `DOC-${Date.now()}`;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    let nextVal = seq.value + 1;
    // Check if reset is needed
    if (seq.resetType === 1 && (month !== seq.month || year !== seq.year)) nextVal = 1;
    if (seq.resetType === 2 && year !== seq.year) nextVal = 1;
    // Update sequence
    setSequences(prev => prev.map(s => s.workflowId === workflowId ? { ...s, value: nextVal, month, year } : s));
    return seq.format.replace("{Value}", String(nextVal)).replace("{Month}", String(month).padStart(2, "0")).replace("{Year}", String(year)).replace("{YY}", String(year).slice(-2));
  }, [sequences]);

  // Notification Settings CRUD
  const upsertNotificationSetting = useCallback((setting: WorkflowNotificationSetting) => {
    setNotificationSettings(prev => {
      const exists = prev.find(s => s.workflowStatusId === setting.workflowStatusId);
      if (exists) return prev.map(s => s.workflowStatusId === setting.workflowStatusId ? setting : s);
      return [...prev, setting];
    });
  }, []);
  const deleteNotificationSetting = useCallback((workflowStatusId: number) => {
    setNotificationSettings(prev => prev.filter(s => s.workflowStatusId !== workflowStatusId));
  }, []);
  const getStatusNotificationSetting = useCallback((workflowStatusId: number) => {
    return notificationSettings.find(s => s.workflowStatusId === workflowStatusId);
  }, [notificationSettings]);

  // Status Field Attributes CRUD
  const upsertStatusFieldAttribute = useCallback((attr: WorkflowStatusFieldAttribute) => {
    setStatusFieldAttributes(prev => {
      const exists = prev.find(a => a.workflowStatusId === attr.workflowStatusId && a.fieldId === attr.fieldId);
      if (exists) return prev.map(a => (a.workflowStatusId === attr.workflowStatusId && a.fieldId === attr.fieldId) ? attr : a);
      return [...prev, attr];
    });
  }, []);
  const deleteStatusFieldAttribute = useCallback((workflowStatusId: number, fieldId: number) => {
    setStatusFieldAttributes(prev => prev.filter(a => !(a.workflowStatusId === workflowStatusId && a.fieldId === fieldId)));
  }, []);
  const getStatusFieldAttributes = useCallback((workflowStatusId: number) => {
    return statusFieldAttributes.filter(a => a.workflowStatusId === workflowStatusId);
  }, [statusFieldAttributes]);

  const getProfileStatuses = useCallback((wid: number) => statuses.filter(s => s.workflowId === wid).sort((a, b) => a.position - b.position), [statuses]);
  const getProfileActions = useCallback((wid: number) => actions.filter(a => a.workflowId === wid).sort((a, b) => a.position - b.position), [actions]);
  const getProfileFields = useCallback((wid: number) => fields.filter(f => f.workflowId === wid).sort((a, b) => a.position - b.position), [fields]);
  const getProfilePaths = useCallback((wid: number) => {
    const wActions = actions.filter(a => a.workflowId === wid);
    const actionIds = new Set(wActions.map(a => a.id));
    return paths.filter(p => actionIds.has(p.actionId)).sort((a, b) => a.position - b.position);
  }, [actions, paths]);
  const getProfileMessages = useCallback((wid: number) => messages.filter(m => m.workflowId === wid).sort((a, b) => a.position - b.position), [messages]);

  // Profile Bindings
  const [profileBindings, setProfileBindings] = useState<WorkflowProfileBinding[]>(seedProfileBindings);

  const addProfileBinding = useCallback((binding: WorkflowProfileBinding) => {
    setProfileBindings(prev => {
      const exists = prev.find(b => b.module === binding.module && b.documentType === binding.documentType);
      if (exists) return prev.map(b => (b.module === binding.module && b.documentType === binding.documentType) ? binding : b);
      return [...prev, binding];
    });
  }, []);

  const removeProfileBinding = useCallback((module: string, documentType: string) => {
    setProfileBindings(prev => prev.filter(b => !(b.module === module && b.documentType === documentType)));
  }, []);

  const getProfileForDocument = useCallback((module: string, documentType: string) => {
    const binding = profileBindings.find(b => b.module === module && b.documentType === documentType);
    if (!binding) return undefined;
    return profiles.find(p => p.id === binding.workflowId);
  }, [profileBindings, profiles]);

  const getInitialStatus = useCallback((workflowId: number) => {
    return statuses.filter(s => s.workflowId === workflowId).sort((a, b) => a.position - b.position)[0];
  }, [statuses]);

  const getStatusByName = useCallback((workflowId: number, name: string) => {
    return statuses.find(s => s.workflowId === workflowId && (s.name === name || s.displayName === name));
  }, [statuses]);

  const getAvailablePathsForStatus = useCallback((workflowId: number, currentStatusName: string) => {
    const wStatuses = statuses.filter(s => s.workflowId === workflowId);
    const currentStatus = wStatuses.find(s => s.name === currentStatusName || s.displayName === currentStatusName);
    if (!currentStatus) return [];

    const wActions = actions.filter(a => a.workflowId === workflowId);
    const actionIds = new Set(wActions.map(a => a.id));
    const validPaths = paths.filter(p =>
      actionIds.has(p.actionId) &&
      p.currentStatusId === currentStatus.id &&
      p.enabled
    );

    return validPaths.map(p => ({
      path: p,
      action: wActions.find(a => a.id === p.actionId)!,
      nextStatus: wStatuses.find(s => s.id === p.nextStatusId)!,
    })).filter(x => x.action && x.nextStatus);
  }, [statuses, actions, paths]);

  // Runtime enforcement helpers
  const getPathRequiredFields = useCallback((pathId: number) => {
    const reqFieldIds = pathRequiredFields.filter(prf => prf.pathId === pathId).map(prf => prf.fieldId);
    return fields.filter(f => reqFieldIds.includes(f.id));
  }, [pathRequiredFields, fields]);

  const getActionAuditFieldsFn = useCallback((actionId: number) => {
    return actionAuditFields.filter(aaf => aaf.actionId === actionId);
  }, [actionAuditFields]);

  const getPathMessagesForPath = useCallback((pathId: number) => {
    const msgIds = pathMessages.filter(pm => pm.pathId === pathId).map(pm => pm.messageId);
    return messages.filter(m => msgIds.includes(m.id));
  }, [pathMessages, messages]);

  const evaluateBusinessRule = useCallback((rule: string, context: Record<string, unknown>) => {
    if (!rule || !rule.trim()) return true;
    try {
      // Simple rule evaluation: supports "Field>Value", "Field<Value", "Field=Value"
      const match = rule.match(/^(\w+)\s*(>|<|>=|<=|=|!=)\s*(.+)$/);
      if (!match) return true;
      const [, field, op, rawVal] = match;
      const ctxVal = Number(context[field] ?? 0);
      const ruleVal = Number(rawVal);
      if (isNaN(ctxVal) || isNaN(ruleVal)) return true;
      switch (op) {
        case ">": return ctxVal > ruleVal;
        case "<": return ctxVal < ruleVal;
        case ">=": return ctxVal >= ruleVal;
        case "<=": return ctxVal <= ruleVal;
        case "=": return ctxVal === ruleVal;
        case "!=": return ctxVal !== ruleVal;
        default: return true;
      }
    } catch {
      return true; // If rule can't be parsed, allow
    }
  }, []);

  const isUserAllowed = useCallback((allowedUsersToken: string, currentUserRole: string) => {
    if (!allowedUsersToken || !allowedUsersToken.trim()) return true;
    // Token format: {Role1},{Role2} or {Owner}
    const tokens = allowedUsersToken.split(",").map(t => t.trim().replace(/[{}]/g, "").toLowerCase());
    if (tokens.includes("owner")) return true; // Owner is always allowed
    const role = currentUserRole.toLowerCase().replace(/\s+/g, "");
    return tokens.some(t => role.includes(t) || t.includes("admin") || t.includes("system"));
  }, []);

  // onEntry/onExit token execution
  const executeEntryExitTokens = useCallback((onEntryToken: string, onExitToken: string, context: {
    documentId: string; module: string; userName: string; referenceNo?: string;
  }) => {
    const parseTokens = (token: string): string[] => {
      if (!token || !token.trim()) return [];
      return token.split(",").map(t => t.trim().replace(/[{}]/g, "")).filter(Boolean);
    };
    const entryActions = parseTokens(onEntryToken);
    const exitActions = parseTokens(onExitToken);
    return { entryActions, exitActions };
  }, []);

  // Field visibility for current status
  const getFieldVisibility = useCallback((workflowId: number, statusName: string, isEditor: boolean) => {
    const currentStatus = statuses.find(s => s.workflowId === workflowId && (s.name === statusName || s.displayName === statusName));
    if (!currentStatus) return [];
    const wFields = fields.filter(f => f.workflowId === workflowId).sort((a, b) => a.position - b.position);
    const attrs = statusFieldAttributes.filter(a => a.workflowStatusId === currentStatus.id);

    return wFields.map(field => {
      const attr = attrs.find(a => a.fieldId === field.id);
      if (!attr) {
        // No attribute = visible, read-only, not required
        return { field, editable: false, required: false, hidden: false };
      }
      return {
        field,
        editable: isEditor ? attr.editableForEditors : false,
        required: isEditor ? attr.requiredForEditors : false,
        hidden: isEditor ? attr.hiddenForEditors : attr.hiddenForReaders,
      };
    }).filter(fv => !fv.hidden);
  }, [statuses, fields, statusFieldAttributes]);

  // Escalation check
  const checkEscalation = useCallback((workflowStatusId: number, daysInStatus: number) => {
    const setting = notificationSettings.find(s => s.workflowStatusId === workflowStatusId);
    if (!setting) return null;

    const shouldNotify = daysInStatus >= setting.elapsedDays;
    const notificationCycles = shouldNotify
      ? Math.min(Math.floor((daysInStatus - setting.elapsedDays) / setting.recursEvery) + 1, setting.noOfNotifications)
      : 0;

    const totalNotifyDays = setting.elapsedDays + (setting.noOfNotifications - 1) * setting.recursEvery;
    const shouldEscalate = daysInStatus > totalNotifyDays;
    const escalationCycles = shouldEscalate
      ? Math.min(Math.floor((daysInStatus - totalNotifyDays) / setting.escalationRecursEvery), setting.escalationNoOfNotifications)
      : 0;

    return {
      shouldNotify,
      shouldEscalate,
      notificationCount: notificationCycles,
      escalationCount: escalationCycles,
    };
  }, [notificationSettings]);

  return (
    <WorkflowDesignerContext.Provider value={{
      profiles, statuses, actions, fields, paths, messages,
      notificationSettings, upsertNotificationSetting, deleteNotificationSetting, getStatusNotificationSetting,
      statusFieldAttributes, upsertStatusFieldAttribute, deleteStatusFieldAttribute, getStatusFieldAttributes,
      pathMessages, pathRequiredFields, actionAuditFields,
      sequences, getProfileSequence, upsertSequence, deleteSequence, generateNextReference,
      addProfile, updateProfile, deleteProfile,
      addStatus, updateStatus, deleteStatus,
      addAction, updateAction, deleteAction,
      addField, updateField, deleteField,
      addPath, updatePath, deletePath,
      addMessage, updateMessage, deleteMessage,
      profileBindings, addProfileBinding, removeProfileBinding, getProfileForDocument,
      getAvailablePathsForStatus, getInitialStatus, getStatusByName,
      getProfileStatuses, getProfileActions, getProfileFields, getProfilePaths, getProfileMessages,
      getPathRequiredFields, getActionAuditFields: getActionAuditFieldsFn, getPathMessagesForPath,
      evaluateBusinessRule, isUserAllowed,
      executeEntryExitTokens, getFieldVisibility, checkEscalation,
    }}>
      {children}
    </WorkflowDesignerContext.Provider>
  );
};

export const useWorkflowDesigner = () => {
  const ctx = useContext(WorkflowDesignerContext);
  if (!ctx) throw new Error("useWorkflowDesigner must be used within WorkflowDesignerProvider");
  return ctx;
};
