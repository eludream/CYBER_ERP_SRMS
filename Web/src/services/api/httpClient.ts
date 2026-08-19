// ========================
// API Service Layer — Ready for .NET Core Web API Integration
// ========================
//
// Features:
//   • Automatic retry with exponential back-off for network failures & 5xx errors
//   • 401 interception with automatic token refresh (single-flight)
//   • Configurable via VITE_API_BASE_URL
//   • JWT Bearer tokens auto-attached from localStorage
// ========================

import { beginApiActivity } from "@/lib/apiActivity";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500; // 500ms, 1s, 2s
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  errors?: string[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  search?: string;
}

// ========================
// Token refresh singleton — prevents multiple concurrent refresh calls
// ========================
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const result = await response.json();
    if (result?.success && result?.data?.token) {
      localStorage.setItem("auth_token", result.data.token);
      if (result.data.refreshToken) {
        localStorage.setItem("refresh_token", result.data.refreshToken);
      }
      if (result.data.expiresAt) {
        localStorage.setItem("token_expires_at", result.data.expiresAt);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Single-flight token refresh — all concurrent 401 retries share one refresh call */
function singleFlightRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function handleAuthFailure(): void {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_expires_at");
  // Dispatch a custom event so AuthContext / app shell can react (e.g. redirect to login)
  window.dispatchEvent(new CustomEvent("auth:session-expired"));
}

// ========================
// Helpers
// ========================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && (error as TypeError).message.toLowerCase().includes("fetch");
}

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

// ========================
// HttpClient
// ========================

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(isFormData = false): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    if (!isFormData) headers["Content-Type"] = "application/json";

    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // i18n: attach locale preference
    const lang = localStorage.getItem("erp_language");
    if (lang) {
      headers["Accept-Language"] = lang;
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: PaginationParams): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
    if (params) {
      if (params.pageSize) url.searchParams.set("take", String(params.pageSize));
      if (params.page && params.pageSize) {
        url.searchParams.set("skip", String((params.page - 1) * params.pageSize));
      }
      if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
      if (params.sortDirection) url.searchParams.set("sortDirection", params.sortDirection);
      if (params.search) url.searchParams.set("search", params.search);
    }
    return url.toString();
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorBody = await response.text();
      let message = `HTTP ${response.status}: ${response.statusText}`;
      let errors: string[] | undefined;
      try {
        const parsed = JSON.parse(errorBody);
        message = parsed.message || parsed.detail || parsed.title || message;
        if (Array.isArray(parsed.errors)) {
          errors = parsed.errors;
        } else if (parsed.errors && typeof parsed.errors === "object") {
          errors = Object.values(parsed.errors).flatMap(value =>
            Array.isArray(value) ? value.map(String) : [String(value)]
          );
        }
        if (errors?.length) {
          message = `${message}: ${errors.join("; ")}`;
        }
      } catch {
        // Use default message
      }
      const err = new HttpError(message, response.status, errors);
      throw err;
    }
    if (response.status === 204) {
      return { data: undefined as T, success: true, message: "" };
    }

    const payload = await response.json();
    if (
      payload && typeof payload === "object" &&
      typeof payload.success === "boolean" &&
      Object.prototype.hasOwnProperty.call(payload, "data")
    ) {
      return payload as ApiResponse<T>;
    }

    if (
      payload && typeof payload === "object" &&
      Array.isArray(payload.data) &&
      ("totalRecords" in payload || "total" in payload)
    ) {
      return {
        data: payload.data as T,
        success: true,
        message: "",
        totalCount: payload.totalRecords ?? payload.total,
        page: payload.pageNumber,
        pageSize: payload.pageSize,
      };
    }

    return { data: payload as T, success: true, message: "" };
  }

  /**
   * Core request method with retry + 401 refresh logic.
   * - Network errors & 5xx → retry up to MAX_RETRIES with exponential back-off
   * - 401 → attempt single-flight token refresh, then retry once
   * - 4xx (non-401) → fail immediately
   */
  private async request<T>(
    method: string,
    endpoint: string,
    params?: PaginationParams,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const finishActivity = beginApiActivity(method);
    const url = this.buildUrl(endpoint, params);
    let lastError: unknown;

    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
        const fetchOptions: RequestInit = {
          method,
          headers: this.getHeaders(body instanceof FormData),
          credentials: "include",
        };
        if (body !== undefined) {
          fetchOptions.body = body instanceof FormData ? body : JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        // ── 401: try token refresh once ──
        if (response.status === 401 && attempt === 0) {
          const refreshed = await singleFlightRefresh();
          if (refreshed) {
            // Retry the original request with the new token
            const retryResponse = await fetch(url, {
              ...fetchOptions,
              headers: this.getHeaders(body instanceof FormData), // picks up new token
            });
            if (retryResponse.status === 401) {
              handleAuthFailure();
              return this.handleResponse<T>(retryResponse); // will throw HttpError
            }
            return this.handleResponse<T>(retryResponse);
          }
          handleAuthFailure();
          return this.handleResponse<T>(response); // will throw HttpError
        }

        // ── Retryable server errors (5xx, 429, 408) ──
        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          lastError = new HttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
          );
          await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
          continue;
        }

        return this.handleResponse<T>(response);
        } catch (error) {
        // ── Network failure (no response at all) ──
        if (isNetworkError(error) && attempt < MAX_RETRIES) {
          lastError = error;
          await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
          continue;
        }
        throw error;
        }
      }

      // Exhausted retries
      throw lastError ?? new Error("Request failed after retries");
    } finally {
      finishActivity();
    }
  }

  // ── Public HTTP methods ─────────────────────────────────────

  async get<T>(endpoint: string, params?: PaginationParams): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, params);
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, undefined, body);
  }

  async postForm<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, undefined, formData);
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, undefined, body);
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, undefined, body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint);
  }
}

// ========================
// HttpError — typed error with status code
// ========================

export class HttpError extends Error {
  status: number;
  errors?: string[];

  constructor(message: string, status: number, errors?: string[]) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.errors = errors;
  }
}

// Singleton HTTP client instance
export const httpClient = new HttpClient(API_BASE_URL);
