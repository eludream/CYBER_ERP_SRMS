// ========================
// Audit Trail API Service — .NET Core AuditController
// ========================
// Maps to: /api/audit/*
// Controller: AuditController.cs
// ========================

import { httpClient, type ApiResponse, type PaginationParams } from "./httpClient";

// ── DTOs ──────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  action: "Create" | "Update" | "Delete" | "View" | "Export" | "Login" | "Logout" | "Approve" | "Reject" | "Print" | "Import";
  module: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  tenantId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AuditFilters extends PaginationParams {
  module?: string;
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AuditSummary {
  totalEntries: number;
  entriesByModule: Record<string, number>;
  entriesByAction: Record<string, number>;
  topUsers: { userId: string; userName: string; count: number }[];
  recentActivity: AuditEntry[];
}

export interface AuditExportRequest {
  format: "csv" | "xlsx" | "pdf";
  filters?: AuditFilters;
  dateRange: { from: string; to: string };
}

export interface AuditRetentionPolicy {
  retentionDays: number;
  archiveEnabled: boolean;
  archiveAfterDays: number;
  complianceMode: boolean;
}

// ── Service ───────────────────────────────────────────────────

export const auditService = {
  /** Log an audit entry (called automatically by API interceptor on .NET side) */
  logEntry: (entry: Omit<AuditEntry, "id" | "timestamp" | "ipAddress" | "userAgent">) =>
    httpClient.post<AuditEntry>("/audit/log", entry),

  /** Get paginated audit trail */
  getAuditTrail: (filters?: AuditFilters) =>
    httpClient.get<AuditEntry[]>("/audit", filters),

  /** Get a single audit entry with full diff */
  getEntry: (id: string) =>
    httpClient.get<AuditEntry>(`/audit/${id}`),

  /** Get audit entries for a specific entity */
  getEntityHistory: (entityType: string, entityId: string, params?: PaginationParams) =>
    httpClient.get<AuditEntry[]>(`/audit/entity/${entityType}/${entityId}`, params),

  /** Get audit summary/dashboard data */
  getSummary: (period?: string) =>
    httpClient.get<AuditSummary>(`/audit/summary`, { search: period } as PaginationParams),

  /** Export audit trail */
  exportAuditTrail: (data: AuditExportRequest) =>
    httpClient.post<{ downloadUrl: string; fileName: string }>("/audit/export", data),

  /** Get retention policy */
  getRetentionPolicy: () =>
    httpClient.get<AuditRetentionPolicy>("/audit/retention-policy"),

  /** Update retention policy (admin only) */
  updateRetentionPolicy: (data: AuditRetentionPolicy) =>
    httpClient.put<AuditRetentionPolicy>("/audit/retention-policy", data),

  /** Purge old entries (admin only) */
  purgeOldEntries: (beforeDate: string) =>
    httpClient.post<{ deletedCount: number }>("/audit/purge", { beforeDate }),
};
