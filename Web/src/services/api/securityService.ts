// ========================
// Security & Admin API Service
// Maps to: /api/security/* .NET Core controller
// ========================

import { httpClient, ApiResponse, PaginationParams } from "./httpClient";

// ── Types ──────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Inactive" | "Locked";
  lastLogin: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: string;
  department: string;
  password: string;
  twoFactorEnabled?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  status?: "Active" | "Inactive" | "Locked";
  twoFactorEnabled?: boolean;
}

export interface ActiveSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  startedAt: string;
  lastActivity: string;
}

export interface RoleRecord {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: Record<string, string[]>; // "Module::DocType" → permission[]
  createdAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: Record<string, string[]>;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: Record<string, string[]>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  target: string;
  severity: "info" | "warning" | "error" | "critical";
  ipAddress: string;
  userAgent: string;
  details: string;
}

export interface AuditLogFilters extends PaginationParams {
  severity?: string;
  module?: string;
  user?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordHistory: number;
  passwordExpiryDays: number;
}

export interface SessionPolicy {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  maxConcurrentSessions: number;
}

export interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  useTls: boolean;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  retentionDays: number;
  time: string;
}

export interface CompanySettings {
  name: string;
  logoUrl: string | null;
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
}

// ── Service ────────────────────────────────────────────────

export const securityService = {
  // ── Users ──
  getUsers: (params?: PaginationParams) =>
    httpClient.get<UserRecord[]>("/security/users", params),

  getUser: (id: string) =>
    httpClient.get<UserRecord>(`/security/users/${id}`),

  createUser: (data: CreateUserRequest) =>
    httpClient.post<UserRecord>("/security/users", data),

  updateUser: (id: string, data: UpdateUserRequest) =>
    httpClient.put<UserRecord>(`/security/users/${id}`, data),

  deleteUser: (id: string) =>
    httpClient.delete<void>(`/security/users/${id}`),

  resetPassword: (id: string) =>
    httpClient.post<void>(`/security/users/${id}/reset-password`, {}),

  unlockUser: (id: string) =>
    httpClient.post<void>(`/security/users/${id}/unlock`, {}),

  getUserSessions: (userId: string) =>
    httpClient.get<ActiveSession[]>(`/security/users/${userId}/sessions`),

  killSession: (userId: string, sessionId: string) =>
    httpClient.delete<void>(`/security/users/${userId}/sessions/${sessionId}`),

  // ── Roles & Document-Type Permissions ──
  getRoles: (params?: PaginationParams) =>
    httpClient.get<RoleRecord[]>("/security/roles", params),

  getRole: (id: string) =>
    httpClient.get<RoleRecord>(`/security/roles/${id}`),

  createRole: (data: CreateRoleRequest) =>
    httpClient.post<RoleRecord>("/security/roles", data),

  updateRole: (id: string, data: UpdateRoleRequest) =>
    httpClient.put<RoleRecord>(`/security/roles/${id}`, data),

  deleteRole: (id: string) =>
    httpClient.delete<void>(`/security/roles/${id}`),

  // ── Audit Logs ──
  getAuditLogs: (filters?: AuditLogFilters) =>
    httpClient.get<AuditLogEntry[]>("/security/audit-logs", filters),

  exportAuditLogs: (filters?: AuditLogFilters) =>
    httpClient.get<{ downloadUrl: string }>("/security/audit-logs/export", filters),

  // ── Settings ──
  getPasswordPolicy: () =>
    httpClient.get<PasswordPolicy>("/security/settings/password-policy"),

  updatePasswordPolicy: (data: PasswordPolicy) =>
    httpClient.put<PasswordPolicy>("/security/settings/password-policy", data),

  getSessionPolicy: () =>
    httpClient.get<SessionPolicy>("/security/settings/session-policy"),

  updateSessionPolicy: (data: SessionPolicy) =>
    httpClient.put<SessionPolicy>("/security/settings/session-policy", data),

  getSmtpSettings: () =>
    httpClient.get<SmtpSettings>("/security/settings/smtp"),

  updateSmtpSettings: (data: SmtpSettings) =>
    httpClient.put<SmtpSettings>("/security/settings/smtp", data),

  testSmtpConnection: () =>
    httpClient.post<{ success: boolean; message: string }>("/security/settings/smtp/test", {}),

  getBackupSettings: () =>
    httpClient.get<BackupSettings>("/security/settings/backup"),

  updateBackupSettings: (data: BackupSettings) =>
    httpClient.put<BackupSettings>("/security/settings/backup", data),

  getCompanySettings: () =>
    httpClient.get<CompanySettings>("/security/settings/company"),

  updateCompanySettings: (data: CompanySettings) =>
    httpClient.put<CompanySettings>("/security/settings/company", data),

  uploadCompanyLogo: (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    return fetch(`${import.meta.env.VITE_API_BASE_URL || "/api"}/security/settings/company/logo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
      },
      body: formData,
    }).then(r => r.json()) as Promise<ApiResponse<{ logoUrl: string }>>;
  },
};
