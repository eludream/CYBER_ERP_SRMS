// ========================
// Workflow API Service
// Maps to: /api/workflow/* .NET Core controllers
// ========================
//
// This service replaces all client-side workflow runtime logic
// (business rules, audit stamps, escalation, notifications, etc.)
// with server-side API calls to the .NET Core Workflow Engine.
//
// Controller mapping:
//   WorkflowProfileController     → /api/workflow/profiles
//   WorkflowDesignerController    → /api/workflow/designer (statuses, actions, fields, paths, messages)
//   WorkflowRuntimeController     → /api/workflow/runtime  (transitions, rule checks, escalation)
//   WorkflowDocumentController    → /api/workflow/documents
// ========================

import { httpClient, type ApiResponse, type PaginationParams } from "./httpClient";
import type {
  WorkflowProfile,
  WorkflowStatusDef,
  WorkflowAction,
  WorkflowField,
  WorkflowPath,
  WorkflowMessage,
  WorkflowNotificationSetting,
  WorkflowStatusFieldAttribute,
  WorkflowSequence,
  WorkflowPathMessage,
  WorkflowPathRequiredField,
  WorkflowActionAuditField,
  WorkflowDocument,
  WorkflowTransaction,
} from "@/types/workflowDesigner";

// ========================
// DTOs — request / response shapes for runtime endpoints
// ========================

/** Binding between a module+documentType and a workflow profile */
export interface WorkflowProfileBindingDto {
  module: string;
  documentType: string;
  workflowId: number;
}

/** Request to execute a workflow transition */
export interface TransitionRequestDto {
  workflowDocumentId: number;
  pathId: number;
  actionId: number;
  remarks?: string;
  /** Key-value pairs for any document-context fields needed by business rules */
  documentContext?: Record<string, unknown>;
}

/** Server response after a successful transition */
export interface TransitionResultDto {
  workflowDocumentId: number;
  previousStatusId: number;
  previousStatusName: string;
  newStatusId: number;
  newStatusName: string;
  newStatusDisplayName: string;
  transactionId: number;
  referenceNo: string;
  isCompleted: boolean;
  /** Audit fields that were auto-stamped during the transition */
  auditFieldValues: Record<string, string>;
  /** Notification messages that were fired */
  notificationsSent: NotificationResultDto[];
  /** onEntry / onExit hook tokens that were executed */
  hooksExecuted: HookExecutionDto[];
  resultMessage: string;
  historyEntry: string;
}

export interface NotificationResultDto {
  messageId: number;
  messageName: string;
  subject: string;
  body: string;
  sentTo: string;
  cc: string;
  mailSent: boolean;
}

export interface HookExecutionDto {
  phase: "onEntry" | "onExit";
  token: string;
  success: boolean;
  detail?: string;
}

/** Available action paths for a document's current status */
export interface AvailablePathDto {
  path: WorkflowPath;
  action: WorkflowAction;
  nextStatus: WorkflowStatusDef;
  /** Whether the current user is allowed (server-evaluated) */
  userAllowed: boolean;
  /** Whether the business rule passes (server-evaluated) */
  ruleResult: boolean;
  /** Required field names for this path */
  requiredFields: string[];
  /** Audit fields that will be stamped */
  auditFieldPreviews: AuditFieldPreviewDto[];
}

export interface AuditFieldPreviewDto {
  label: string;
  auditType: 1 | 2; // 1 = current user, 2 = current datetime
  previewValue: string; // e.g. "John Doe" or "Current Date/Time"
}

/** Field visibility in a given status */
export interface FieldVisibilityDto {
  fieldId: number;
  fieldName: string;
  editable: boolean;
  required: boolean;
  hidden: boolean;
}

/** Business rule evaluation request */
export interface BusinessRuleCheckDto {
  rule: string;
  context: Record<string, unknown>;
}

/** Escalation status for a document */
export interface EscalationStatusDto {
  workflowStatusId: number;
  daysInStatus: number;
  shouldNotify: boolean;
  shouldEscalate: boolean;
  notificationCount: number;
  escalationCount: number;
  setting: WorkflowNotificationSetting | null;
}

/** Reference number generation request */
export interface GenerateReferenceDto {
  workflowId: number;
}

/** Workflow document creation (submit into workflow) */
export interface CreateWorkflowDocumentDto {
  workflowId: number;
  documentId: number;
  module: string;
  documentType: string;
  /** Optional context values for initial business rule evaluation */
  documentContext?: Record<string, unknown>;
}

export interface WorkflowDocumentDetailDto extends WorkflowDocument {
  currentStatusName: string;
  currentStatusDisplayName: string;
  workflowProfileName: string;
  auditFieldValues: Record<string, string>;
  transactions: WorkflowTransaction[];
}

// ========================
// Service
// ========================

export const workflowService = {

  // ─── Profile CRUD ───────────────────────────────────────────
  getProfiles: (params?: PaginationParams) =>
    httpClient.get<WorkflowProfile[]>("/workflow/profiles", params),

  getProfileById: (id: number) =>
    httpClient.get<WorkflowProfile>(`/workflow/profiles/${id}`),

  createProfile: (profile: Omit<WorkflowProfile, "id">) =>
    httpClient.post<WorkflowProfile>("/workflow/profiles", profile),

  updateProfile: (id: number, profile: Partial<WorkflowProfile>) =>
    httpClient.put<WorkflowProfile>(`/workflow/profiles/${id}`, profile),

  deleteProfile: (id: number) =>
    httpClient.delete<void>(`/workflow/profiles/${id}`),

  // ─── Status Definitions ─────────────────────────────────────
  getStatuses: (workflowId: number) =>
    httpClient.get<WorkflowStatusDef[]>(`/workflow/profiles/${workflowId}/statuses`),

  createStatus: (workflowId: number, status: Omit<WorkflowStatusDef, "id" | "workflowId">) =>
    httpClient.post<WorkflowStatusDef>(`/workflow/profiles/${workflowId}/statuses`, status),

  updateStatus: (id: number, status: Partial<WorkflowStatusDef>) =>
    httpClient.put<WorkflowStatusDef>(`/workflow/statuses/${id}`, status),

  deleteStatus: (id: number) =>
    httpClient.delete<void>(`/workflow/statuses/${id}`),

  // ─── Actions ────────────────────────────────────────────────
  getActions: (workflowId: number) =>
    httpClient.get<WorkflowAction[]>(`/workflow/profiles/${workflowId}/actions`),

  createAction: (workflowId: number, action: Omit<WorkflowAction, "id" | "workflowId">) =>
    httpClient.post<WorkflowAction>(`/workflow/profiles/${workflowId}/actions`, action),

  updateAction: (id: number, action: Partial<WorkflowAction>) =>
    httpClient.put<WorkflowAction>(`/workflow/actions/${id}`, action),

  deleteAction: (id: number) =>
    httpClient.delete<void>(`/workflow/actions/${id}`),

  // ─── Fields ─────────────────────────────────────────────────
  getFields: (workflowId: number) =>
    httpClient.get<WorkflowField[]>(`/workflow/profiles/${workflowId}/fields`),

  createField: (workflowId: number, field: Omit<WorkflowField, "id" | "workflowId">) =>
    httpClient.post<WorkflowField>(`/workflow/profiles/${workflowId}/fields`, field),

  updateField: (id: number, field: Partial<WorkflowField>) =>
    httpClient.put<WorkflowField>(`/workflow/fields/${id}`, field),

  deleteField: (id: number) =>
    httpClient.delete<void>(`/workflow/fields/${id}`),

  // ─── Paths ──────────────────────────────────────────────────
  getPaths: (workflowId: number) =>
    httpClient.get<WorkflowPath[]>(`/workflow/profiles/${workflowId}/paths`),

  createPath: (path: Omit<WorkflowPath, "id">) =>
    httpClient.post<WorkflowPath>("/workflow/paths", path),

  updatePath: (id: number, path: Partial<WorkflowPath>) =>
    httpClient.put<WorkflowPath>(`/workflow/paths/${id}`, path),

  deletePath: (id: number) =>
    httpClient.delete<void>(`/workflow/paths/${id}`),

  // ─── Path Messages ──────────────────────────────────────────
  getPathMessages: (pathId: number) =>
    httpClient.get<WorkflowPathMessage[]>(`/workflow/paths/${pathId}/messages`),

  setPathMessages: (pathId: number, messageIds: number[]) =>
    httpClient.put<WorkflowPathMessage[]>(`/workflow/paths/${pathId}/messages`, { messageIds }),

  // ─── Path Required Fields ───────────────────────────────────
  getPathRequiredFields: (pathId: number) =>
    httpClient.get<WorkflowPathRequiredField[]>(`/workflow/paths/${pathId}/required-fields`),

  setPathRequiredFields: (pathId: number, fieldIds: number[]) =>
    httpClient.put<WorkflowPathRequiredField[]>(`/workflow/paths/${pathId}/required-fields`, { fieldIds }),

  // ─── Action Audit Fields ────────────────────────────────────
  getActionAuditFields: (actionId: number) =>
    httpClient.get<WorkflowActionAuditField[]>(`/workflow/actions/${actionId}/audit-fields`),

  setActionAuditFields: (actionId: number, auditFields: Omit<WorkflowActionAuditField, "actionId">[]) =>
    httpClient.put<WorkflowActionAuditField[]>(`/workflow/actions/${actionId}/audit-fields`, { auditFields }),

  // ─── Messages ───────────────────────────────────────────────
  getMessages: (workflowId: number) =>
    httpClient.get<WorkflowMessage[]>(`/workflow/profiles/${workflowId}/messages`),

  createMessage: (workflowId: number, message: Omit<WorkflowMessage, "id" | "workflowId">) =>
    httpClient.post<WorkflowMessage>(`/workflow/profiles/${workflowId}/messages`, message),

  updateMessage: (id: number, message: Partial<WorkflowMessage>) =>
    httpClient.put<WorkflowMessage>(`/workflow/messages/${id}`, message),

  deleteMessage: (id: number) =>
    httpClient.delete<void>(`/workflow/messages/${id}`),

  // ─── Notification Settings ──────────────────────────────────
  getNotificationSettings: (workflowId: number) =>
    httpClient.get<WorkflowNotificationSetting[]>(`/workflow/profiles/${workflowId}/notification-settings`),

  upsertNotificationSetting: (setting: WorkflowNotificationSetting) =>
    httpClient.put<WorkflowNotificationSetting>(
      `/workflow/notification-settings/${setting.workflowStatusId}`, setting
    ),

  deleteNotificationSetting: (workflowStatusId: number) =>
    httpClient.delete<void>(`/workflow/notification-settings/${workflowStatusId}`),

  // ─── Status Field Attributes ────────────────────────────────
  getStatusFieldAttributes: (workflowStatusId: number) =>
    httpClient.get<WorkflowStatusFieldAttribute[]>(`/workflow/statuses/${workflowStatusId}/field-attributes`),

  upsertStatusFieldAttribute: (attr: WorkflowStatusFieldAttribute) =>
    httpClient.put<WorkflowStatusFieldAttribute>(
      `/workflow/statuses/${attr.workflowStatusId}/field-attributes/${attr.fieldId}`, attr
    ),

  deleteStatusFieldAttribute: (workflowStatusId: number, fieldId: number) =>
    httpClient.delete<void>(`/workflow/statuses/${workflowStatusId}/field-attributes/${fieldId}`),

  // ─── Sequences ──────────────────────────────────────────────
  getSequence: (workflowId: number) =>
    httpClient.get<WorkflowSequence>(`/workflow/profiles/${workflowId}/sequence`),

  upsertSequence: (seq: WorkflowSequence) =>
    httpClient.put<WorkflowSequence>(`/workflow/profiles/${seq.workflowId}/sequence`, seq),

  deleteSequence: (workflowId: number) =>
    httpClient.delete<void>(`/workflow/profiles/${workflowId}/sequence`),

  /** Server generates the next reference number (thread-safe, atomic increment) */
  generateNextReference: (workflowId: number) =>
    httpClient.post<{ referenceNo: string }>(`/workflow/profiles/${workflowId}/sequence/next`, {}),

  // ─── Profile Bindings ───────────────────────────────────────
  getProfileBindings: (params?: PaginationParams) =>
    httpClient.get<WorkflowProfileBindingDto[]>("/workflow/profile-bindings", params),

  upsertProfileBinding: (binding: WorkflowProfileBindingDto) =>
    httpClient.put<WorkflowProfileBindingDto>("/workflow/profile-bindings", binding),

  deleteProfileBinding: (module: string, documentType: string) =>
    httpClient.delete<void>(`/workflow/profile-bindings/${encodeURIComponent(module)}/${encodeURIComponent(documentType)}`),

  /** Resolve which workflow profile applies to a given module + document type */
  resolveProfile: (module: string, documentType: string) =>
    httpClient.get<WorkflowProfile | null>(`/workflow/profile-bindings/resolve?module=${encodeURIComponent(module)}&documentType=${encodeURIComponent(documentType)}`),

  // ─── Workflow Documents ─────────────────────────────────────
  getDocuments: (params?: PaginationParams) =>
    httpClient.get<WorkflowDocumentDetailDto[]>("/workflow/documents", params),

  getDocumentById: (id: number) =>
    httpClient.get<WorkflowDocumentDetailDto>(`/workflow/documents/${id}`),

  /** Find a workflow document by its source document ID and module */
  findDocument: (documentId: number, module: string) =>
    httpClient.get<WorkflowDocumentDetailDto | null>(
      `/workflow/documents/find?documentId=${documentId}&module=${encodeURIComponent(module)}`
    ),

  /** Create a new workflow document (initial submission into workflow) */
  createDocument: (dto: CreateWorkflowDocumentDto) =>
    httpClient.post<WorkflowDocumentDetailDto>("/workflow/documents", dto),

  // ─── Runtime: Transitions ───────────────────────────────────

  /**
   * Execute a workflow transition (the core action).
   * The server handles ALL runtime logic:
   *  - Business rule evaluation
   *  - Allowed user checks
   *  - Required field validation
   *  - Audit field stamping (e.g. ApprovedBy, ApprovedDate)
   *  - onEntry / onExit hook execution
   *  - Notification message delivery
   *  - Escalation scheduling
   *  - Transaction history recording
   */
  executeTransition: (request: TransitionRequestDto) =>
    httpClient.post<TransitionResultDto>("/workflow/runtime/transition", request),

  /**
   * Get available paths/actions for a document's current status.
   * Server evaluates business rules and allowed-user tokens
   * and returns only the paths the current user can execute.
   */
  getAvailablePaths: (workflowDocumentId: number, documentContext?: Record<string, unknown>) =>
    httpClient.post<AvailablePathDto[]>(`/workflow/runtime/available-paths`, {
      workflowDocumentId,
      documentContext,
    }),

  // ─── Runtime: Business Rule Evaluation ──────────────────────

  /** Evaluate a business rule against a document context (for preview / testing) */
  evaluateBusinessRule: (dto: BusinessRuleCheckDto) =>
    httpClient.post<{ result: boolean; rule: string }>("/workflow/runtime/evaluate-rule", dto),

  // ─── Runtime: Field Visibility ──────────────────────────────

  /** Get field visibility/editability for a given workflow status */
  getFieldVisibility: (workflowId: number, statusId: number, isEditor: boolean) =>
    httpClient.get<FieldVisibilityDto[]>(
      `/workflow/runtime/field-visibility?workflowId=${workflowId}&statusId=${statusId}&isEditor=${isEditor}`
    ),

  // ─── Runtime: Escalation ────────────────────────────────────

  /** Check escalation status for a specific workflow document */
  getEscalationStatus: (workflowDocumentId: number) =>
    httpClient.get<EscalationStatusDto>(`/workflow/runtime/escalation/${workflowDocumentId}`),

  /** Get all documents in escalation (for dashboards) */
  getEscalatedDocuments: (params?: PaginationParams) =>
    httpClient.get<Array<WorkflowDocumentDetailDto & EscalationStatusDto>>(
      "/workflow/runtime/escalation/active", params
    ),

  // ─── Runtime: Transaction History ───────────────────────────

  /** Get full transaction history for a workflow document */
  getTransactionHistory: (workflowDocumentId: number) =>
    httpClient.get<WorkflowTransaction[]>(`/workflow/documents/${workflowDocumentId}/transactions`),
};
