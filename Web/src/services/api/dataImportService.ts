// ========================
// Data Import/Export API Service — .NET Core DataImportController
// ========================
// Maps to: /api/data-import/*
// Controller: DataImportController.cs
// ========================

import { httpClient, type ApiResponse, type PaginationParams } from "./httpClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ── DTOs ──────────────────────────────────────────────────────

export interface ImportTemplate {
  id: string;
  name: string;
  module: string;
  entityType: string;
  columns: ImportColumn[];
  sampleFileUrl: string;
}

export interface ImportColumn {
  name: string;
  displayName: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "email";
  required: boolean;
  maxLength?: number;
  validValues?: string[];
  description?: string;
}

export interface ImportJob {
  id: string;
  module: string;
  entityType: string;
  fileName: string;
  status: "pending" | "validating" | "validated" | "importing" | "completed" | "failed" | "cancelled";
  totalRows: number;
  validRows: number;
  errorRows: number;
  importedRows: number;
  errors: ImportError[];
  createdAt: string;
  completedAt?: string;
  createdBy: string;
}

export interface ImportError {
  row: number;
  column: string;
  value: string;
  message: string;
  severity: "error" | "warning";
}

export interface ExportRequest {
  module: string;
  entityType: string;
  format: "csv" | "xlsx";
  filters?: Record<string, string>;
  columns?: string[];
  includeHeaders?: boolean;
}

export interface ExportResult {
  downloadUrl: string;
  fileName: string;
  format: string;
  rowCount: number;
  sizeBytes: number;
  expiresAt: string;
}

// ── Service ───────────────────────────────────────────────────

export const dataImportService = {
  // ── Templates ───────────────────────────────────────────────

  /** Get available import templates */
  getTemplates: (module?: string) =>
    httpClient.get<ImportTemplate[]>("/data-import/templates", module ? { search: module } as PaginationParams : undefined),

  /** Download a sample import file */
  getSampleFile: (templateId: string) =>
    `${API_BASE_URL}/data-import/templates/${templateId}/sample`,

  // ── Import ──────────────────────────────────────────────────

  /** Upload a file for import (returns job with validation results) */
  uploadFile: async (module: string, entityType: string, file: File): Promise<ApiResponse<ImportJob>> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("module", module);
    formData.append("entityType", entityType);

    const token = localStorage.getItem("auth_token");
    const tenantId = localStorage.getItem("erp_tenant_id");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) headers["X-Tenant-Id"] = tenantId;

    const response = await fetch(`${API_BASE_URL}/data-import/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    return response.json();
  },

  /** Confirm and execute import after validation */
  confirmImport: (jobId: string) =>
    httpClient.post<ImportJob>(`/data-import/jobs/${jobId}/confirm`, {}),

  /** Cancel an import job */
  cancelImport: (jobId: string) =>
    httpClient.post<ImportJob>(`/data-import/jobs/${jobId}/cancel`, {}),

  /** Get import job status */
  getJob: (jobId: string) =>
    httpClient.get<ImportJob>(`/data-import/jobs/${jobId}`),

  /** List all import jobs */
  getJobs: (params?: PaginationParams & { module?: string; status?: string }) =>
    httpClient.get<ImportJob[]>("/data-import/jobs", params as PaginationParams),

  /** Get validation errors for a job */
  getJobErrors: (jobId: string) =>
    httpClient.get<ImportError[]>(`/data-import/jobs/${jobId}/errors`),

  // ── Export ──────────────────────────────────────────────────

  /** Export data to CSV/XLSX */
  exportData: (data: ExportRequest) =>
    httpClient.post<ExportResult>("/data-import/export", data),
};
