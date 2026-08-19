// ========================
// Form Designer API Service — .NET Core Web API endpoints
// ========================

import { httpClient, type ApiResponse, type PaginationParams } from "./httpClient";
import type {
  FormSchema,
  FormListItem,
  FormSubmission,
  CreateFormDto,
  UpdateFormDto,
} from "@/types/formDesigner";

const BASE = "/form-designer";

// ── Form CRUD ───────────────────────────────────────────────

export const formDesignerService = {
  /** List all forms with pagination & filtering */
  list(params?: PaginationParams & { module?: string; status?: string }) {
    const endpoint = params?.module
      ? `${BASE}/forms?module=${params.module}${params.status ? `&status=${params.status}` : ""}`
      : `${BASE}/forms`;
    return httpClient.get<FormListItem[]>(endpoint, params);
  },

  /** Get full form schema by ID */
  getById(id: string) {
    return httpClient.get<FormSchema>(`${BASE}/forms/${id}`);
  },

  /** Create a new form */
  create(dto: CreateFormDto) {
    return httpClient.post<FormSchema>(`${BASE}/forms`, dto);
  },

  /** Update form schema (auto-saves fields, layout, settings) */
  update(id: string, dto: UpdateFormDto) {
    return httpClient.put<FormSchema>(`${BASE}/forms/${id}`, dto);
  },

  /** Publish a draft form */
  publish(id: string) {
    return httpClient.post<FormSchema>(`${BASE}/forms/${id}/publish`, {});
  },

  /** Archive a form */
  archive(id: string) {
    return httpClient.post<FormSchema>(`${BASE}/forms/${id}/archive`, {});
  },

  /** Duplicate a form */
  duplicate(id: string) {
    return httpClient.post<FormSchema>(`${BASE}/forms/${id}/duplicate`, {});
  },

  /** Delete a form */
  delete(id: string) {
    return httpClient.delete<void>(`${BASE}/forms/${id}`);
  },

  /** Get form version history */
  getVersions(id: string) {
    return httpClient.get<FormSchema[]>(`${BASE}/forms/${id}/versions`);
  },

  /** Restore a specific version */
  restoreVersion(id: string, version: number) {
    return httpClient.post<FormSchema>(`${BASE}/forms/${id}/versions/${version}/restore`, {});
  },

  // ── Submissions ─────────────────────────────────────────────

  /** List submissions for a form */
  listSubmissions(formId: string, params?: PaginationParams) {
    return httpClient.get<FormSubmission[]>(`${BASE}/forms/${formId}/submissions`, params);
  },

  /** Get a single submission */
  getSubmission(formId: string, submissionId: string) {
    return httpClient.get<FormSubmission>(`${BASE}/forms/${formId}/submissions/${submissionId}`);
  },

  /** Submit form data */
  submit(formId: string, data: Record<string, unknown>) {
    return httpClient.post<FormSubmission>(`${BASE}/forms/${formId}/submissions`, data);
  },

  /** Save draft submission */
  saveDraft(formId: string, data: Record<string, unknown>) {
    return httpClient.post<FormSubmission>(`${BASE}/forms/${formId}/submissions/draft`, data);
  },

  /** Export submissions */
  exportSubmissions(formId: string, format: "csv" | "xlsx") {
    return httpClient.get<{ downloadUrl: string }>(`${BASE}/forms/${formId}/submissions/export?format=${format}`);
  },

  // ── Lookup endpoints (for ERP pickers) ──────────────────────

  /** Fetch lookup data for ERP picker fields */
  getLookupData(module: string, entity: string, params?: PaginationParams) {
    return httpClient.get<Array<{ id: string; displayName: string; [key: string]: unknown }>>(
      `${BASE}/lookups/${module}/${entity}`,
      params
    );
  },
};
