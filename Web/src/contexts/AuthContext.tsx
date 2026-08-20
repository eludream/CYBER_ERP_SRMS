import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { authService } from "@/services/api/authService";
import { cacheBustedUrl } from "@/lib/utils";

// Module codes are tenant-managed and may be added at runtime.
export type ERPModule = string;

interface AuthContextType {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: { id: string; name: string; email: string; phoneNumber: string; userName: string; role: string; isPlatformAdministrator: boolean; profilePictureUrl: string | null } | null;
  selectedModule: ERPModule | null;
  login: (userName: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  selectModule: (module: ERPModule) => void;
  uploadProfilePicture: (file: File) => Promise<void>;
  removeProfilePicture: () => Promise<void>;
  syncProfilePicture: (userId: string, profilePictureUrl: string | null) => void;
  syncUserProfile: (profile: { name: string; email: string; phoneNumber: string; userName: string }) => void;
  updateProfile: (profile: { name: string; email: string; phoneNumber: string; userName: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedModule, setSelectedModule] = useState<ERPModule | null>(null);
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);

  const clearLocalSession = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setSelectedModule(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("cybererp-theme");
    window.dispatchEvent(new CustomEvent("theme:reset-to-system"));
  }, []);

  const applyUserTheme = useCallback(async (userId: string) => {
    try {
      const { data: preferences } = await authService.getUserPreferences(userId);
      window.dispatchEvent(new CustomEvent("theme:apply-user-setting", { detail: preferences.theme }));
    } catch {
      window.dispatchEvent(new CustomEvent("theme:apply-user-setting", { detail: "system" }));
    }
  }, []);

  // Restore the authenticated user from the persistent server session. The
  // bearer token is optional because browser authentication also uses a signed,
  // HttpOnly cookie.
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const { data: current } = await authService.getCurrentUser();
        if (!active) return;
        if (!current.isAuthenticated) {
          clearLocalSession();
          return;
        }
        setUser({
          id: current.userId,
          name: current.name,
          email: current.email,
          phoneNumber: current.phoneNumber,
          userName: current.userName,
          role: "User",
          isPlatformAdministrator: current.isPlatformAdministrator,
          profilePictureUrl: cacheBustedUrl(current.profilePictureUrl),
        });
        setIsAuthenticated(true);
        setSessionTimeoutMinutes(current.sessionTimeoutMinutes || 30);
        await applyUserTheme(current.userId);
      } catch {
        if (!active) return;
        clearLocalSession();
      } finally {
        if (active) setIsInitializing(false);
      }
    };
    void restoreSession();
    return () => { active = false; };
  }, [applyUserTheme, clearLocalSession]);

  const login = async (userName: string, password: string) => {
    const { data: result } = await authService.login({ userName, password });
    localStorage.setItem("auth_token", result.token);
    setUser({ id: result.id, name: result.fullName || result.userName, email: result.email, phoneNumber: result.phoneNumber || "", userName: result.userName, role: "User", isPlatformAdministrator: result.isPlatformAdministrator, profilePictureUrl: cacheBustedUrl(result.profilePictureUrl) });
    setIsAuthenticated(true);
    setSessionTimeoutMinutes(result.sessionTimeoutMinutes || 30);
    await applyUserTheme(result.id);
    window.dispatchEvent(new CustomEvent("auth:logged-in"));
    return true;
  };

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Always clear local state even if the API is unavailable.
    }
    clearLocalSession();
  }, [clearLocalSession]);

  // Listen for session-expired events fired by httpClient on 401 refresh failure
  useEffect(() => {
    const handleSessionExpired = () => {
      clearLocalSession();
    };
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [clearLocalSession]);

  // Return an idle browser to login promptly. Server-side cookie validation
  // remains authoritative and enforces the same configured inactivity window.
  useEffect(() => {
    if (!isAuthenticated) return;
    let timer = window.setTimeout(clearLocalSession, sessionTimeoutMinutes * 60_000);
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(clearLocalSession, sessionTimeoutMinutes * 60_000);
    };
    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [clearLocalSession, isAuthenticated, sessionTimeoutMinutes]);

  const selectModule = (module: ERPModule) => setSelectedModule(module);

  const uploadProfilePicture = async (file: File) => {
    if (!user) throw new Error("No authenticated user");
    const { data } = await authService.uploadProfilePicture(user.id, file);
    setUser(current => current?.id === user.id ? { ...current, profilePictureUrl: cacheBustedUrl(data.profilePictureUrl) } : current);
  };

  const removeProfilePicture = async () => {
    if (!user) throw new Error("No authenticated user");
    await authService.removeProfilePicture(user.id);
    setUser(current => current?.id === user.id ? { ...current, profilePictureUrl: null } : current);
  };

  const syncProfilePicture = useCallback((userId: string, profilePictureUrl: string | null) => {
    setUser(current => current?.id === userId ? { ...current, profilePictureUrl } : current);
  }, []);

  const syncUserProfile = useCallback((profile: { name: string; email: string; phoneNumber: string; userName: string }) => {
    setUser(current => {
      if (!current) return current;
      if (current.name === profile.name && current.email === profile.email &&
          current.phoneNumber === profile.phoneNumber && current.userName === profile.userName) return current;
      return { ...current, ...profile };
    });
  }, []);

  const updateProfile = async (profile: { name: string; email: string; phoneNumber: string; userName: string }) => {
    if (!user) throw new Error("No authenticated user");
    await authService.updateUserProfile({
      id: user.id,
      fullName: profile.name,
      email: profile.email,
      phoneNumber: profile.phoneNumber,
      userName: profile.userName,
      profilePictureUrl: user.profilePictureUrl,
    });
    setUser(current => current?.id === user.id ? { ...current, ...profile } : current);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isInitializing, user, selectedModule, login, logout, selectModule, uploadProfilePicture, removeProfilePicture, syncProfilePicture, syncUserProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
