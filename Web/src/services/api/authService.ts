// ========================
// Auth API Service
// Maps to: /api/auth/* .NET Core controller
// ========================

import { httpClient, ApiResponse } from "./httpClient";

export interface LoginRequest {
  userName: string;
  password: string;
  tenantId?: string;
}

export interface LoginResponse {
  token: string;
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  userName: string;
  companyId?: string | null;
  tenantId?: string | null;
  isPlatformAdministrator: boolean;
  profilePictureUrl?: string | null;
  sessionTimeoutMinutes: number;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  userName: string;
  profilePictureUrl?: string | null;
}

export interface AccountProfileResponse {
  accountStatus: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  lockoutEndUtc?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  lastLoginUtc?: string | null;
  activity: Array<{ timestamp: string; ipAddress: string; userAgent?: string | null; status?: string | null; failureReason?: string | null; eventType: string }>;
}

export interface UserPreferencesResponse {
  language: string;
  timeZone: string;
  dateFormat: string;
  numberFormat: string;
  landingPage: string;
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  inAppNotifications: boolean;
  approvalNotifications: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export type LoginStatus =
  | { isAuthenticated: false }
  | {
      isAuthenticated: true;
      userId: string;
      name: string;
      userName: string;
      email: string;
      phoneNumber: string;
      tenantId?: string;
      isPlatformAdministrator: boolean;
      profilePictureUrl?: string | null;
      sessionTimeoutMinutes: number;
    };

export const authService = {
  login: (credentials: LoginRequest) =>
    httpClient.post<LoginResponse>("/auth/login/cookie", credentials),

  logout: () =>
    httpClient.post<void>("/auth/logout/cookie"),

  getCurrentUser: () =>
    httpClient.get<LoginStatus>("/auth/loginStatus"),

  getUserProfile: (userId: string) => httpClient.get<UserProfileResponse>(`/User/${userId}`),

  updateUserProfile: (profile: UserProfileResponse) =>
    httpClient.put<{ id: string }>("/User", {
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      userName: profile.userName,
    }),

  uploadProfilePicture: (userId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return httpClient.postForm<{ profilePictureUrl: string }>(`/User/${userId}/profile-picture`, form);
  },

  removeProfilePicture: (userId: string) => httpClient.delete<void>(`/User/${userId}/profile-picture`),

  getAccountProfile: (userId: string) => httpClient.get<AccountProfileResponse>(`/User/${userId}/account-profile`),

  changePassword: (userId: string, currentPassword: string, newPassword: string) =>
    httpClient.post<void>(`/User/${userId}/change-password`, { currentPassword, newPassword }),

  getUserPreferences: (userId: string) => httpClient.get<UserPreferencesResponse>(`/User/${userId}/preferences`),

  updateUserPreferences: (userId: string, preferences: UserPreferencesResponse) =>
    httpClient.put<UserPreferencesResponse>(`/User/${userId}/preferences`, preferences),
};
