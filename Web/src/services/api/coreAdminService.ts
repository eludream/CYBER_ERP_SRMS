import { httpClient, PaginationParams } from "./httpClient";

export interface CoreUserDto {
  id: string;
  employeeId?: string | null;
  employeeFullName?: string | null;
  employeeNumber?: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  userName: string;
  profilePictureUrl?: string | null;
}

export interface AvailableEmployeeDto {
  employeeId: string;
  employeeNumber: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface AdminUserDto extends CoreUserDto {
  accountStatus: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockoutEndUtc: string | null;
  createdAt: string;
  lastLoginUtc: string | null;
  roles: string[];
}

export interface AdminPermissionDto {
  roleId: string;
  module: string;
  operation: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

export interface AdminRoleDto {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  isPlatformRole: boolean;
  userCount: number;
  permissions: AdminPermissionDto[];
}

export interface LoginLogDto {
  id: string;
  timestamp: string;
  user: string;
  userNameAttempted: string;
  ipAddress: string;
  userAgent: string | null;
  status: string | null;
  failureReason: string | null;
  eventType: string;
}

export interface WorkflowProfileDto {
  id: string;
  name: string;
  description: string | null;
  module: string;
  documentType: string;
  isActive: boolean;
  version: number;
  definitionJson: string;
}

export type SavePermissionRequest = Omit<AdminPermissionDto, "roleId">;
export interface SaveRoleRequest {
  name: string;
  code?: string | null;
  description?: string | null;
  isPlatformRole: boolean;
  permissions: SavePermissionRequest[];
}

export interface CreateCoreUserRequest {
  employeeId?: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  userName: string;
  password: string;
  roleIds: string[];
}

export interface UpdateCoreUserRequest extends Omit<CreateCoreUserRequest, "password" | "roleIds"> {
  id: string;
}

export interface AdminUserPreferences {
  language: string; timeZone: string; dateFormat: string; numberFormat: string; landingPage: string;
  theme: "light" | "dark" | "system"; emailNotifications: boolean; inAppNotifications: boolean; approvalNotifications: boolean;
}

export const coreAdminService = {
  getUsers: (params: PaginationParams = { page: 1, pageSize: 100 }) =>
    httpClient.get<CoreUserDto[]>("/User", params),
  getAvailableEmployees: (currentUserId?: string) =>
    httpClient.get<AvailableEmployeeDto[]>(`/User/available-employees${currentUserId ? `?currentUserId=${encodeURIComponent(currentUserId)}` : ""}`),
  createUser: (data: CreateCoreUserRequest) =>
    httpClient.post<{ id: string }>("/User", data),
  updateUser: (data: UpdateCoreUserRequest) =>
    httpClient.put<{ id: string }>("/User", data),
  deleteUser: (id: string) => httpClient.delete<{ id: string }>(`/User/${id}`),
  uploadUserProfilePicture: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return httpClient.postForm<{ profilePictureUrl: string }>(`/User/${id}/profile-picture`, form);
  },
  removeUserProfilePicture: (id: string) => httpClient.delete<void>(`/User/${id}/profile-picture`),
  getAdminUsers: () => httpClient.get<AdminUserDto[]>("/CoreAdministration/users"),
  updateUserSecurity: (id: string, data: { accountStatus: boolean; twoFactorEnabled: boolean; lockoutEndUtc?: string | null }) =>
    httpClient.put<void>(`/CoreAdministration/users/${id}/security`, data),
  getUserPreferences: (id: string) => httpClient.get<AdminUserPreferences>(`/CoreAdministration/users/${id}/preferences`),
  updateUserPreferences: (id: string, data: AdminUserPreferences) => httpClient.put<void>(`/CoreAdministration/users/${id}/preferences`, data),
  updateUserRoles: (id: string, roleIds: string[]) =>
    httpClient.put<void>(`/CoreAdministration/users/${id}/roles`, { roleIds }),
  getRoles: () => httpClient.get<AdminRoleDto[]>("/CoreAdministration/roles"),
  createRole: (data: SaveRoleRequest) => httpClient.post<AdminRoleDto>("/CoreAdministration/roles", data),
  updateRole: (id: string, data: SaveRoleRequest) => httpClient.put<AdminRoleDto>(`/CoreAdministration/roles/${id}`, data),
  deleteRole: (id: string) => httpClient.delete<void>(`/CoreAdministration/roles/${id}`),
  getLoginLogs: () => httpClient.get<LoginLogDto[]>("/CoreAdministration/login-logs"),
};
