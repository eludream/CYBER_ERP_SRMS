// ========================
// Workflow Designer Types — mapped from SQL schema
// ========================

export interface WorkflowProfile {
  id: number;
  name: string;
  description: string;
  isNotificationEnabled: boolean;
}

export interface WorkflowStatusDef {
  id: number;
  workflowId: number;
  name: string;
  displayName: string;
  position: number;
}

export interface WorkflowAction {
  id: number;
  workflowId: number;
  name: string;
  displayName: string;
  withRemark: boolean;
  withConfirmation: boolean;
  position: number;
}

export interface WorkflowField {
  id: number;
  workflowId: number;
  name: string;
  position: number;
}

export interface WorkflowPath {
  id: number;
  actionId: number;
  currentStatusId: number | null;
  nextStatusId: number;
  businessRule: string;
  allowedUsersToken: string;
  notificationDateToken: string;
  onEntryToken: string;
  onExitToken: string;
  confirmationMessageTemplate: string;
  resultMessage: string;
  historyTemplate: string;
  closeOnAction: boolean;
  enabled: boolean;
  position: number;
}

export interface WorkflowMessage {
  id: number;
  workflowId: number;
  name: string;
  bodyTemplate: string;
  sendToToken: string;
  ccToken: string;
  subjectTemplate: string;
  shouldSendMail: boolean;
  escalateToUsersToken: string;
  isNotificationEnabled: boolean;
  position: number;
}

export interface WorkflowPathMessage {
  pathId: number;
  messageId: number;
}

export interface WorkflowPathRequiredField {
  pathId: number;
  fieldId: number;
}

export interface WorkflowActionAuditField {
  actionId: number;
  fieldId: number;
  auditType: 1 | 2; // 1 = current user, 2 = current datetime
}

export interface WorkflowNotificationSetting {
  workflowStatusId: number;
  elapsedDays: number;
  recursEvery: number;
  noOfNotifications: number;
  escalationRecursEvery: number;
  escalationNoOfNotifications: number;
}

export interface WorkflowStatusFieldAttribute {
  workflowStatusId: number;
  fieldId: number;
  editableForEditors: boolean;
  requiredForEditors: boolean;
  hiddenForEditors: boolean;
  hiddenForReaders: boolean;
}

export interface WorkflowSequence {
  workflowId: number;
  value: number;
  month: number;
  year: number;
  format: string;
  resetType: 1 | 2 | 3; // 1=Monthly, 2=Yearly, 3=None
}

export interface WorkflowDocument {
  id: number;
  documentId: number;
  workflowId: number;
  ownerId: number;
  referenceNo: string;
  currentStatusId: number;
  isCompleted: boolean;
}

export interface WorkflowTransaction {
  id: number;
  workflowDocumentId: number;
  pathId: number;
  actionTakerId: number;
  impersonatedById: number | null;
  actionDate: string;
  notificationDate: string;
  remarks: string;
  history: string;
  overridenHistory: string;
}
