// ========================
// Report & Analytics API Service — .NET Core ReportsController
// ========================
// Maps to: /api/reports/*
// Controller: ReportsController.cs
// ========================

import { httpClient, type ApiResponse, type PaginationParams } from "./httpClient";

// ── DTOs ──────────────────────────────────────────────────────

export interface ReportFieldDto {
  id: string;
  name: string;
  source: string;
  type: "text" | "number" | "date" | "currency" | "boolean";
}

export interface ReportFilterDto {
  field: string;
  operator: string;
  value: string;
  value2?: string; // for "between" operators
}

export interface ReportSortDto {
  field: string;
  direction: "asc" | "desc";
}

export interface ReportScheduleDto {
  enabled: boolean;
  frequency: "Daily" | "Weekly" | "Monthly" | "Quarterly";
  emailRecipients: string[];
  nextRunAt?: string;
  lastRunAt?: string;
}

export interface CreateReportRequest {
  name: string;
  description: string;
  module: string;
  type: "tabular" | "summary" | "chart" | "pivot";
  fields: string[];
  filters: ReportFilterDto[];
  groupBy?: string;
  sort?: ReportSortDto;
  schedule?: ReportScheduleDto;
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {}

export interface ReportRecord {
  id: string;
  name: string;
  description: string;
  module: string;
  type: "tabular" | "summary" | "chart" | "pivot";
  fields: string[];
  filters: ReportFilterDto[];
  groupBy?: string;
  sort?: ReportSortDto;
  schedule?: ReportScheduleDto;
  status: "ready" | "running" | "error" | "scheduled";
  lastRunAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  rowCount?: number;
}

export interface ReportExecutionResult {
  reportId: string;
  executionId: string;
  status: "completed" | "failed" | "timeout";
  rowCount: number;
  columns: ReportFieldDto[];
  rows: Record<string, unknown>[];
  summary?: Record<string, number>;
  executedAt: string;
  durationMs: number;
}

export interface ReportExportRequest {
  format: "csv" | "xlsx" | "pdf";
  includeHeaders?: boolean;
  includeFilters?: boolean;
  dateRange?: { from: string; to: string };
}

export interface ReportExportResult {
  downloadUrl: string;
  fileName: string;
  format: string;
  sizeBytes: number;
  expiresAt: string;
}

export interface ModuleFieldsResponse {
  module: string;
  fields: ReportFieldDto[];
}

export interface ReportExecutionHistoryEntry {
  executionId: string;
  reportId: string;
  status: "completed" | "failed" | "timeout";
  rowCount: number;
  durationMs: number;
  executedAt: string;
  triggeredBy: "manual" | "schedule";
  executedByUser: string;
}

export interface DashboardKpi {
  key: string;
  label: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  trend: "up" | "down" | "flat";
}

export interface AnalyticsChartData {
  chartType: "bar" | "line" | "area" | "pie" | "radar" | "scatter";
  title: string;
  data: Record<string, unknown>[];
  series: { key: string; label: string; color?: string }[];
}

// ── Service ───────────────────────────────────────────────────

export const reportService = {
  // ── Report CRUD ─────────────────────────────────────────────

  /** List all saved reports (paginated, searchable) */
  getReports: (params?: PaginationParams & { module?: string; type?: string; favoritesOnly?: boolean }) =>
    httpClient.get<ReportRecord[]>("/reports", params as PaginationParams),

  /** Get a single report by ID */
  getReport: (id: string) =>
    httpClient.get<ReportRecord>(`/reports/${id}`),

  /** Create a new report definition */
  createReport: (data: CreateReportRequest) =>
    httpClient.post<ReportRecord>("/reports", data),

  /** Update an existing report */
  updateReport: (id: string, data: UpdateReportRequest) =>
    httpClient.put<ReportRecord>(`/reports/${id}`, data),

  /** Delete a report */
  deleteReport: (id: string) =>
    httpClient.delete<void>(`/reports/${id}`),

  /** Duplicate a report */
  duplicateReport: (id: string) =>
    httpClient.post<ReportRecord>(`/reports/${id}/duplicate`, {}),

  /** Toggle favorite status */
  toggleFavorite: (id: string) =>
    httpClient.patch<ReportRecord>(`/reports/${id}/favorite`, {}),

  // ── Report Execution ────────────────────────────────────────

  /** Execute a report and return results */
  executeReport: (id: string) =>
    httpClient.post<ReportExecutionResult>(`/reports/${id}/execute`, {}),

  /** Execute a report preview (ad-hoc, without saving) */
  previewReport: (data: CreateReportRequest) =>
    httpClient.post<ReportExecutionResult>("/reports/preview", data),

  /** Get execution history for a report */
  getExecutionHistory: (id: string, params?: PaginationParams) =>
    httpClient.get<ReportExecutionHistoryEntry[]>(`/reports/${id}/executions`, params),

  /** Get a specific execution result */
  getExecutionResult: (reportId: string, executionId: string) =>
    httpClient.get<ReportExecutionResult>(`/reports/${reportId}/executions/${executionId}`),

  // ── Export ──────────────────────────────────────────────────

  /** Export a report to CSV / XLSX / PDF */
  exportReport: (id: string, data: ReportExportRequest) =>
    httpClient.post<ReportExportResult>(`/reports/${id}/export`, data),

  /** Export the latest execution result */
  exportExecution: (reportId: string, executionId: string, format: "csv" | "xlsx" | "pdf") =>
    httpClient.post<ReportExportResult>(
      `/reports/${reportId}/executions/${executionId}/export`,
      { format },
    ),

  // ── Scheduling ──────────────────────────────────────────────

  /** Get schedule config for a report */
  getSchedule: (id: string) =>
    httpClient.get<ReportScheduleDto>(`/reports/${id}/schedule`),

  /** Create or update a schedule */
  updateSchedule: (id: string, data: ReportScheduleDto) =>
    httpClient.put<ReportScheduleDto>(`/reports/${id}/schedule`, data),

  /** Remove a schedule */
  deleteSchedule: (id: string) =>
    httpClient.delete<void>(`/reports/${id}/schedule`),

  // ── Module Fields (metadata) ────────────────────────────────

  /** Get available fields for a module */
  getModuleFields: (module: string) =>
    httpClient.get<ModuleFieldsResponse>(`/reports/fields/${encodeURIComponent(module)}`),

  /** Get all available modules and their field counts */
  getAvailableModules: () =>
    httpClient.get<{ module: string; fieldCount: number }[]>("/reports/modules"),

  // ── Dashboard & Analytics ───────────────────────────────────

  /** Get KPI data for the reports dashboard */
  getDashboardKpis: () =>
    httpClient.get<DashboardKpi[]>("/reports/dashboard/kpis"),

  /** Get chart data for the reports dashboard */
  getDashboardChart: (chartId: string, params?: { period?: string; module?: string }) =>
    httpClient.get<AnalyticsChartData>(`/reports/dashboard/charts/${chartId}`, params as PaginationParams),

  /** Get analytics data (cohort, radar, scatter, etc.) */
  getAnalyticsData: (analysisType: string, params?: Record<string, string>) =>
    httpClient.get<AnalyticsChartData>(`/reports/analytics/${analysisType}`, params as PaginationParams),
};
