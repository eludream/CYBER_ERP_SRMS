import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Camera, Check, CheckCircle2, ChevronsUpDown, Clock3, History, KeyRound, Laptop, Loader2, LockKeyhole, LogOut, Save, ShieldCheck, Trash2, UnlockKeyhole, Upload, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { authService, AccountProfileResponse } from "@/services/api/authService";
import { AdminRoleDto, AvailableEmployeeDto, coreAdminService } from "@/services/api/coreAdminService";
import { multiTenantService, PlatformSystemSettings } from "@/services/api/multiTenantService";
import UserAvatar from "@/components/UserAvatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface AdminProfileTarget {
  id: string; name: string; email: string; phoneNumber: string; userName: string; profilePictureUrl: string | null;
  employeeId?: string | null; employeeFullName?: string | null; employeeNumber?: string | null;
  status: boolean; twoFactorEnabled: boolean; lockoutEndUtc?: string | null; createdAt: string; lastLogin: string;
  roleIds?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser?: AdminProfileTarget | null;
  createMode?: boolean;
  onAdminSaved?: (user: AdminProfileTarget) => void;
  platformMode?: boolean;
  platformAdministrator?: boolean;
}

interface Preferences {
  language: string; timeZone: string; dateFormat: string; numberFormat: string;
  landingPage: string; theme: "light" | "dark" | "system";
  emailNotifications: boolean; inAppNotifications: boolean; approvalNotifications: boolean;
}

const defaultPreferences: Preferences = {
  language: "en", timeZone: "Africa/Nairobi", dateFormat: "dd/MM/yyyy", numberFormat: "1,234.56",
  landingPage: "/", theme: "system", emailNotifications: true, inAppNotifications: true,
  approvalNotifications: true,
};

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Not available";

const UserAccountDialog = ({ open, onOpenChange, targetUser, createMode = false, onAdminSaved, platformMode = false, platformAdministrator = false }: Props) => {
  const { user, uploadProfilePicture, removeProfilePicture, syncProfilePicture, syncUserProfile, updateProfile, logout } = useAuth();
  const { setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const initialForm = useRef("");
  const [busy, setBusy] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [details, setDetails] = useState<AccountProfileResponse | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phoneNumber: "", userName: "" });
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [crop, setCrop] = useState<{ file: File; url: string; zoom: number; x: number; y: number } | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [initialPassword, setInitialPassword] = useState("");
  const [platformPolicy, setPlatformPolicy] = useState<PlatformSystemSettings | null>(null);
  const [passwordPolicy] = useState({ minimumPasswordLength: 8, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSpecialCharacters: true });
  const [roles, setRoles] = useState<AdminRoleDto[]>([]);
  const [employees, setEmployees] = useState<AvailableEmployeeDto[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [adminStatus, setAdminStatus] = useState(true);
  const [pendingPicture, setPendingPicture] = useState<{ file: File; url: string } | null>(null);
  const [displayPictureUrl, setDisplayPictureUrl] = useState<string | null>(null);
  const [pictureRemoved, setPictureRemoved] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const isAdminFlow = createMode || Boolean(targetUser);
  const effectiveUser = createMode ? null : targetUser || user;

  const snapshot = useMemo(() => JSON.stringify({ form, preferences, roleIds, employeeId, adminStatus }), [form, preferences, roleIds, employeeId, adminStatus]);
  const dirty = Boolean(initialForm.current && snapshot !== initialForm.current) || Boolean(pendingPicture) || pictureRemoved;

  useEffect(() => {
    if (!open || (!effectiveUser && !createMode)) return;
    const nextForm = effectiveUser
      ? { name: effectiveUser.name, email: effectiveUser.email, phoneNumber: effectiveUser.phoneNumber, userName: effectiveUser.userName }
      : { name: "", email: "", phoneNumber: "", userName: "" };
    const nextPreferences = defaultPreferences;
    setForm(nextForm);
    setPreferences(nextPreferences);
    setPassword({ current: "", next: "", confirm: "" });
    setInitialPassword("");
    setPlatformPolicy(null);
    const nextRoleIds = targetUser?.roleIds || [];
    setRoleIds(nextRoleIds);
    const nextEmployeeId = targetUser?.employeeId || null;
    setEmployeeId(nextEmployeeId);
    setAdminStatus(targetUser?.status ?? true);
    setDisplayPictureUrl(effectiveUser?.profilePictureUrl || null);
    setPictureRemoved(false);
    if (pendingPicture) URL.revokeObjectURL(pendingPicture.url);
    setPendingPicture(null);
    setActiveTab("profile");
    initialForm.current = JSON.stringify({ form: nextForm, preferences: nextPreferences, roleIds: nextRoleIds, employeeId: nextEmployeeId, adminStatus: targetUser?.status ?? true });
    if (!createMode && !targetUser && user) {
      authService.getUserProfile(user.id)
        .then(({ data }) => {
          const identityForm = {
            name: data.fullName,
            email: data.email,
            phoneNumber: data.phoneNumber || "",
            userName: data.userName,
          };
          setForm(identityForm);
          syncUserProfile(identityForm);
          const currentSnapshot = initialForm.current ? JSON.parse(initialForm.current) : {};
          initialForm.current = JSON.stringify({ ...currentSnapshot, form: identityForm });
        })
        .catch(() => toast.error("Unable to load account information"));
    }
    if (createMode || (platformMode && targetUser)) {
      setDetails(null);
      setLoadingDetails(false);
      const roleRequest = platformMode
        ? multiTenantService.templates().then(data => data
            .filter(role => role.isPlatformRole && role.isActive)
            .map(role => ({
              id: role.id,
              name: role.name,
              code: role.code,
              description: role.description,
              isActive: role.isActive,
              isPlatformRole: role.isPlatformRole,
              userCount: 0,
              permissions: [],
            } satisfies AdminRoleDto)))
        : coreAdminService.getRoles().then(({ data }) => data.filter(role => role.isPlatformRole && role.isActive));
      roleRequest
        .then(availableRoles => {
          setRoles(availableRoles);
          const availableRoleIds = new Set(availableRoles.map(role => role.id));
          const normalizedRoleIds = nextRoleIds.filter(roleId => availableRoleIds.has(roleId));
          setRoleIds(normalizedRoleIds);
          initialForm.current = JSON.stringify({
            form: nextForm,
            preferences: nextPreferences,
            roleIds: normalizedRoleIds, employeeId: nextEmployeeId, adminStatus: targetUser?.status ?? true,
          });
        })
        .catch(() => toast.error("Unable to load roles"));
      coreAdminService.getAvailableEmployees(targetUser?.id)
        .then(({ data }) => setEmployees(data))
        .catch(() => toast.error("Unable to load employees"));
      if (platformMode) {
        multiTenantService.platformSystemSettings()
          .then(setPlatformPolicy)
          .catch(() => toast.error("Unable to load the platform security policy"));
      }
      if (createMode) return;
    }
    setLoadingDetails(true);
    if (platformMode && targetUser) {
      setDetails({ accountStatus: targetUser.status, twoFactorEnabled: targetUser.twoFactorEnabled, failedLoginAttempts: 0, lockoutEndUtc: targetUser.lockoutEndUtc, createdAt: targetUser.createdAt, lastLoginUtc: null, activity: [] });
      setLoadingDetails(false);
      return;
    }
    const detailRequest = targetUser
      ? coreAdminService.getLoginLogs().then(({ data }) => setDetails({ accountStatus: targetUser.status, twoFactorEnabled: targetUser.twoFactorEnabled, failedLoginAttempts: 0, createdAt: targetUser.createdAt, lastLoginUtc: targetUser.lastLogin === "—" ? null : targetUser.lastLogin, activity: data.filter(x => x.user === targetUser.name).slice(0, 10) }))
      : authService.getAccountProfile(user!.id).then(({ data }) => setDetails(data));
    detailRequest.catch(() => toast.error("Some security details could not be loaded")).finally(() => setLoadingDetails(false));
    const preferenceRequest = targetUser ? coreAdminService.getUserPreferences(targetUser.id) : authService.getUserPreferences(user!.id);
    preferenceRequest
      .then(({ data }) => {
        const persisted = { language: data.language, timeZone: data.timeZone, dateFormat: data.dateFormat,
          numberFormat: data.numberFormat, landingPage: data.landingPage, theme: data.theme,
          emailNotifications: data.emailNotifications,
          inAppNotifications: data.inAppNotifications, approvalNotifications: data.approvalNotifications };
        setPreferences(persisted);
        if (!createMode && !targetUser) setTheme(data.theme);
        const currentSnapshot = initialForm.current ? JSON.parse(initialForm.current) : {};
          initialForm.current = JSON.stringify({ ...currentSnapshot, form: currentSnapshot.form || nextForm, preferences: persisted, roleIds: [], employeeId: nextEmployeeId, adminStatus: targetUser?.status ?? true });
      })
      .catch(() => toast.error("Unable to load profile preferences"));
  }, [open, user?.id, targetUser?.id, createMode, platformMode, setTheme, syncUserProfile]);

  const requestClose = (nextOpen: boolean) => {
    if (!nextOpen && dirty) {
      setDiscardOpen(true);
      return;
    }
    onOpenChange(nextOpen);
  };

  const discardChanges = () => {
    if (pendingPicture) URL.revokeObjectURL(pendingPicture.url);
    setPendingPicture(null);
    setPictureRemoved(false);
    setDisplayPictureUrl(effectiveUser?.profilePictureUrl || null);
    setDiscardOpen(false);
    onOpenChange(false);
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Profile pictures must be 5 MB or smaller");
    setCrop({ file, url: URL.createObjectURL(file), zoom: 1, x: 0, y: 0 });
  };

  const closeCrop = () => {
    if (crop) URL.revokeObjectURL(crop.url);
    setCrop(null);
  };

  const uploadCroppedPicture = async () => {
    if (!crop) return;
    setBusy(true);
    try {
      const image = new Image();
      image.src = crop.url;
      await image.decode();
      const cropSize = Math.min(image.naturalWidth, image.naturalHeight) / crop.zoom;
      const sourceX = Math.max(0, image.naturalWidth - cropSize) * ((crop.x + 100) / 200);
      const sourceY = Math.max(0, image.naturalHeight - cropSize) * ((crop.y + 100) / 200);
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image cropping is not supported by this browser");
      context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, 512, 512);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Unable to crop image")), "image/jpeg", 0.9));
      const croppedFile = new File([blob], "profile-picture.jpg", { type: "image/jpeg" });
      if (pendingPicture) URL.revokeObjectURL(pendingPicture.url);
      setPendingPicture({ file: croppedFile, url: URL.createObjectURL(croppedFile) });
      setPictureRemoved(false);
      closeCrop();
      toast.success("Picture cropped and ready. Save the profile to apply it.");
    } catch (error) { toast.error("Unable to update profile picture", { description: error instanceof Error ? error.message : undefined }); }
    finally { setBusy(false); }
  };

  const handleRemove = async () => {
    if (pendingPicture) {
      URL.revokeObjectURL(pendingPicture.url);
      setPendingPicture(null);
      return;
    }
    setDisplayPictureUrl(null);
    setPictureRemoved(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.userName.trim()) return toast.error("Full name, email, and username are required");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Enter a valid email address");
    setBusy(true);
    try {
      if (createMode) {
        if (!initialPassword) throw new Error("An initial password is required");
        if (platformMode && platformPolicy) {
          const policyErrors = [
            initialPassword.length < platformPolicy.minimumPasswordLength ? `Use at least ${platformPolicy.minimumPasswordLength} characters` : "",
            !/[a-z]/.test(initialPassword) ? "Add a lowercase letter" : "",
            platformPolicy.requireUppercase && !/[A-Z]/.test(initialPassword) ? "Add an uppercase letter" : "",
            platformPolicy.requireNumbers && !/\d/.test(initialPassword) ? "Add a number" : "",
            platformPolicy.requireSpecialCharacters && !/[^A-Za-z0-9]/.test(initialPassword) ? "Add a special character" : "",
          ].filter(Boolean);
          if (policyErrors.length) throw new Error(policyErrors.join(". "));
        }
        const data = platformMode
          ? await multiTenantService.savePlatformUser({
              employeeId, fullName: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(),
              userName: form.userName.trim(), password: initialPassword, accountStatus: adminStatus,
              twoFactorEnabled: false, isPlatformAdministrator: platformAdministrator, roleIds,
            }) as { id: string }
          : (await coreAdminService.createUser({ employeeId, fullName: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(), userName: form.userName.trim(), password: initialPassword, roleIds })).data;
        if (!platformMode) await coreAdminService.updateUserPreferences(data.id, preferences);
        if (pendingPicture) await coreAdminService.uploadUserProfilePicture(data.id, pendingPicture.file);
        const selectedEmployee = employees.find(employee => employee.employeeId === employeeId);
        const created: AdminProfileTarget = { id: data.id, employeeId, employeeFullName: selectedEmployee?.fullName, employeeNumber: selectedEmployee?.employeeNumber, name: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(), userName: form.userName.trim(), profilePictureUrl: pendingPicture ? `/api/v1.0/User/${data.id}/profile-picture?v=${Date.now()}` : null, status: adminStatus, twoFactorEnabled: false, createdAt: new Date().toISOString(), lastLogin: "—" };
        onAdminSaved?.(created);
      } else if (targetUser) {
        let savedPictureUrl = targetUser.profilePictureUrl;
        if (platformMode) {
          await multiTenantService.savePlatformUser({
            employeeId, fullName: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(),
            userName: form.userName.trim(), accountStatus: adminStatus,
            twoFactorEnabled: targetUser.twoFactorEnabled, isPlatformAdministrator: platformAdministrator, roleIds,
          }, targetUser.id);
        } else {
          await coreAdminService.updateUser({ id: targetUser.id, employeeId, fullName: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(), userName: form.userName.trim() });
          await coreAdminService.updateUserPreferences(targetUser.id, preferences);
          if (adminStatus !== targetUser.status)
            await coreAdminService.updateUserSecurity(targetUser.id, { accountStatus: adminStatus, twoFactorEnabled: targetUser.twoFactorEnabled, lockoutEndUtc: null });
        }
        if (pendingPicture) {
          const { data } = await coreAdminService.uploadUserProfilePicture(targetUser.id, pendingPicture.file);
          const baseUrl = data.profilePictureUrl || `/api/v1.0/User/${targetUser.id}/profile-picture`;
          savedPictureUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
        } else if (pictureRemoved) {
          await coreAdminService.removeUserProfilePicture(targetUser.id);
          savedPictureUrl = null;
        }
        syncProfilePicture(targetUser.id, savedPictureUrl);
        onAdminSaved?.({ ...targetUser, name: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(), userName: form.userName.trim(), status: adminStatus, profilePictureUrl: savedPictureUrl });
      } else {
        await updateProfile({ name: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(), userName: form.userName.trim() });
        if (!user) throw new Error("No authenticated user");
        await authService.updateUserPreferences(user.id, preferences);
        if (pendingPicture) await uploadProfilePicture(pendingPicture.file);
        else if (pictureRemoved) await removeProfilePicture();
      }
      initialForm.current = JSON.stringify({ form: { ...form, name: form.name.trim(), email: form.email.trim(), phoneNumber: form.phoneNumber.trim(), userName: form.userName.trim() }, preferences, roleIds, employeeId, adminStatus });
      toast.success(createMode ? "User created" : "Profile and preferences saved");
      onOpenChange(false);
    } catch (error) { toast.error("Unable to update profile", { description: error instanceof Error ? error.message : undefined }); }
    finally { setBusy(false); }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    if (password.next !== password.confirm) return toast.error("New passwords do not match");
    const policyErrors = [
      password.next.length < passwordPolicy.minimumPasswordLength ? `Use at least ${passwordPolicy.minimumPasswordLength} characters` : "",
      passwordPolicy.requireUppercase && !/[A-Z]/.test(password.next) ? "Add an uppercase letter" : "",
      passwordPolicy.requireLowercase && !/[a-z]/.test(password.next) ? "Add a lowercase letter" : "",
      passwordPolicy.requireNumbers && !/\d/.test(password.next) ? "Add a number" : "",
      passwordPolicy.requireSpecialCharacters && !/[^A-Za-z0-9]/.test(password.next) ? "Add a special character" : "",
    ].filter(Boolean);
    if (policyErrors.length) return toast.error(policyErrors.join(". "));
    setBusy(true);
    try {
      await authService.changePassword(user.id, password.current, password.next);
      setPassword({ current: "", next: "", confirm: "" });
      toast.success("Password changed successfully");
    } catch (error) { toast.error("Unable to change password", { description: error instanceof Error ? error.message : undefined }); }
    finally { setBusy(false); }
  };

  return <>
  <Dialog open={open} onOpenChange={requestClose}>
    <DialogContent className="grid h-[680px] max-h-[94vh] w-[min(96vw,64rem)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-5">
      <DialogHeader>
        <DialogTitle>{createMode ? (platformMode ? "Add platform user" : "Create user") : targetUser ? `Edit ${targetUser.name}` : "My profile"}</DialogTitle>
        <DialogDescription>{createMode ? (platformMode ? "Create a new platform identity and assign its access roles." : "Create an account and configure its profile preferences.") : "Manage account information, personal preferences, and security."}</DialogDescription>
      </DialogHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        <TabsList className="grid h-9 w-full grid-cols-3">
          <TabsTrigger value="profile" className="h-7 gap-1.5 text-xs"><UserRound className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="preferences" className="h-7 gap-1.5 text-xs"><Bell className="h-3.5 w-3.5" /> Preferences</TabsTrigger>
          <TabsTrigger value="security" className="h-7 gap-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="m-0 h-full pt-2">
          <div className="grid h-full grid-cols-[220px_1fr] grid-rows-[1fr_auto] gap-3">
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/20 p-4 text-center">
            <div className="relative shrink-0">
              <UserAvatar name={form.name || effectiveUser?.name} profilePictureUrl={pendingPicture?.url || displayPictureUrl} className="h-24 w-24 ring-4 ring-primary/15" fallbackClassName="text-xl" />
              <span className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground ring-2 ring-background"><Camera className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3 min-w-0"><p className="truncate text-sm font-semibold">{form.name || "New user"}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{form.userName ? `@${form.userName}` : "Profile picture"}</p><p className="mt-2 text-[11px] leading-4 text-muted-foreground">Square JPG, PNG, GIF, or WebP<br />up to 5 MB.</p>
              <div className="mt-3 grid gap-1.5"><Button type="button" size="sm" variant="outline" className="h-8" onClick={() => inputRef.current?.click()} disabled={busy}><Upload className="mr-1.5 h-3.5 w-3.5" /> Change picture</Button>
                {(pendingPicture || displayPictureUrl) && <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={handleRemove} disabled={busy}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove</Button>}</div>
            </div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid content-start gap-3 rounded-lg border p-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><h3 className="text-sm font-semibold">Account information</h3><p className="text-xs text-muted-foreground">Basic identity and sign-in details.</p></div>
            {isAdminFlow && <div className="space-y-1.5 sm:col-span-2"><Label>Employee</Label><Popover modal open={employeeOpen} onOpenChange={setEmployeeOpen}><PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={employeeOpen} className="h-10 w-full justify-between font-normal">{employeeId ? (() => { const selected = employees.find(x => x.employeeId === employeeId); return selected ? <span className="min-w-0 text-left"><span className="block truncate font-medium">{selected.fullName}</span><span className="block truncate text-xs text-muted-foreground">{selected.employeeNumber}</span></span> : targetUser?.employeeFullName ? <span>{targetUser.employeeFullName} · {targetUser.employeeNumber}</span> : "Selected employee"; })() : <span className="text-muted-foreground">Search and select an employee</span>}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start"><Command><CommandInput placeholder="Search name or employee number..." /><CommandList className="h-64 max-h-64 overscroll-contain overflow-y-auto"><CommandEmpty>No employee without a user account was found.</CommandEmpty><CommandGroup>{employees.map(employee => <CommandItem key={employee.employeeId} value={`${employee.fullName} ${employee.employeeNumber}`} onSelect={() => { setEmployeeId(employee.employeeId); setForm(current => ({ ...current, name: employee.fullName, email: employee.email || current.email, phoneNumber: employee.phoneNumber || current.phoneNumber })); setEmployeeOpen(false); }}><Check className={`mr-2 h-4 w-4 ${employeeId === employee.employeeId ? "opacity-100" : "opacity-0"}`} /><span className="min-w-0"><span className="block truncate font-medium">{employee.fullName}</span><span className="block truncate text-xs text-muted-foreground">{employee.employeeNumber}{employee.email ? ` · ${employee.email}` : ""}</span></span></CommandItem>)}</CommandGroup></CommandList></Command></PopoverContent></Popover></div>}
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="profile-name">Full name <span className="text-destructive">*</span></Label><Input id="profile-name" autoComplete="name" value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label htmlFor="profile-username">Username <span className="text-destructive">*</span></Label><Input id="profile-username" autoComplete="username" value={form.userName} onChange={e => setForm(v => ({ ...v, userName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label htmlFor="profile-phone">Phone number <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="profile-phone" type="tel" autoComplete="tel" value={form.phoneNumber} onChange={e => setForm(v => ({ ...v, phoneNumber: e.target.value }))} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="profile-email">Email <span className="text-destructive">*</span></Label><Input id="profile-email" type="email" autoComplete="email" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} /></div>
          </div>
          <div className="col-span-2 grid grid-cols-5 gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Account status</p><p className="mt-1 flex items-center gap-1.5 font-medium"><CheckCircle2 className={`h-4 w-4 ${!(targetUser ? adminStatus : details?.accountStatus) ? "text-red-500" : "text-emerald-500"}`} /> {createMode ? "New" : !(targetUser ? adminStatus : details?.accountStatus) ? "Inactive" : "Active"}</p></div>
            <div><p className="text-xs text-muted-foreground">Login lock</p><p className="mt-1 flex items-center gap-1.5 font-medium">{details?.lockoutEndUtc && new Date(details.lockoutEndUtc) > new Date() ? <><LockKeyhole className="h-4 w-4 text-amber-600"/>Locked</> : <><UnlockKeyhole className="h-4 w-4 text-emerald-500"/>Unlocked</>}</p></div>
            <div><p className="text-xs text-muted-foreground">Member since</p><p className="mt-1 font-medium">{formatDate(details?.createdAt)}</p></div>
            <div><p className="text-xs text-muted-foreground">Last profile update</p><p className="mt-1 font-medium">{formatDate(details?.updatedAt)}</p></div>
            <div><p className="text-xs text-muted-foreground">Last successful login</p><p className="mt-1 font-medium">{formatDate(details?.lastLoginUtc)}</p></div>
          </div>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="m-0 h-full pt-2">
          <div className="grid h-full grid-cols-2 grid-rows-[1fr_auto] gap-3">
          <section className="col-span-2 rounded-lg border p-3"><div className="mb-3"><h3 className="text-sm font-semibold">Regional & display</h3><p className="text-xs text-muted-foreground">Control how dates, numbers, and the interface appear.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Language</Label><Select value={preferences.language} onValueChange={v => setPreferences(p => ({ ...p, language: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="sw">Kiswahili</SelectItem><SelectItem value="fr">Français</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Time zone</Label><Select value={preferences.timeZone} onValueChange={v => setPreferences(p => ({ ...p, timeZone: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Africa/Nairobi">East Africa Time</SelectItem><SelectItem value="UTC">UTC</SelectItem><SelectItem value="Africa/Lagos">West Africa Time</SelectItem><SelectItem value="Africa/Johannesburg">South Africa Time</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Date format</Label><Select value={preferences.dateFormat} onValueChange={v => setPreferences(p => ({ ...p, dateFormat: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem><SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem><SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Number format</Label><Select value={preferences.numberFormat} onValueChange={v => setPreferences(p => ({ ...p, numberFormat: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1,234.56">1,234.56</SelectItem><SelectItem value="1.234,56">1.234,56</SelectItem><SelectItem value="1 234,56">1 234,56</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Theme</Label><Select value={preferences.theme} onValueChange={v => { const selectedTheme = v as Preferences["theme"]; setPreferences(p => ({ ...p, theme: selectedTheme })); if (!createMode && !targetUser) setTheme(selectedTheme); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="system">System</SelectItem><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem></SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Default landing page</Label><Select value={preferences.landingPage} onValueChange={v => setPreferences(p => ({ ...p, landingPage: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="/">Home</SelectItem><SelectItem value="/workflow/inbox">Workflow inbox</SelectItem><SelectItem value="/reports">Reports</SelectItem></SelectContent></Select></div>
            </div>
          </section>
          <section className="col-span-2 rounded-lg border p-3"><div className="mb-2"><h3 className="text-sm font-semibold">Notifications</h3><p className="text-xs text-muted-foreground">Choose which updates you receive.</p></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3"><div><p className="text-xs font-medium">Email notifications</p><p className="text-[11px] text-muted-foreground">Important updates by email</p></div><Switch aria-label="Email notifications" checked={preferences.emailNotifications} onCheckedChange={value => setPreferences(p => ({ ...p, emailNotifications: value }))} /></div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3"><div><p className="text-xs font-medium">In-app notifications</p><p className="text-[11px] text-muted-foreground">Alerts in the notification centre</p></div><Switch aria-label="In-app notifications" checked={preferences.inAppNotifications} onCheckedChange={value => setPreferences(p => ({ ...p, inAppNotifications: value }))} /></div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-3"><div><p className="text-xs font-medium">Approval notifications</p><p className="text-[11px] text-muted-foreground">Items needing your decision</p></div><Switch aria-label="Approval notifications" checked={preferences.approvalNotifications} onCheckedChange={value => setPreferences(p => ({ ...p, approvalNotifications: value }))} /></div>
            </div>
          </section>
          </div>
        </TabsContent>

        <TabsContent value="security" className="m-0 h-full pt-2">
          <div className="grid h-full grid-cols-2 grid-rows-[auto_1fr] gap-3">
          <section className="grid grid-cols-2 gap-3 rounded-lg border p-3">
            <div className="rounded-lg bg-muted/30 p-3"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Two-factor authentication</h3></div><p className="mt-1 text-xs text-muted-foreground">{details?.twoFactorEnabled ? "Enabled for this account." : "Not configured for this account."}</p><span className="mt-2 inline-flex rounded-full bg-background px-2 py-0.5 text-xs font-medium">{details?.twoFactorEnabled ? "Enabled" : "Not configured"}</span></div>
            <div className="rounded-lg bg-muted/30 p-3"><div className="flex items-center gap-2"><Laptop className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">{isAdminFlow ? "Account access" : "Current session"}</h3></div>{isAdminFlow ? <div className="mt-2"><div className="flex items-center justify-between gap-3 rounded-lg bg-background p-2.5"><div><Label htmlFor="account-active" className="text-xs font-medium">Active account</Label><p className="text-[11px] text-muted-foreground">{adminStatus ? "The account is enabled." : "User cannot sign in."}</p></div><Switch id="account-active" aria-label="Active account" checked={adminStatus} onCheckedChange={setAdminStatus} /></div></div> : <><p className="mt-1 text-xs text-muted-foreground">This browser is currently signed in.</p><Button className="mt-2 h-7 text-xs" size="sm" variant="outline" onClick={() => void logout()}><LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out</Button></>}</div>
          </section>
          <section className="space-y-2 rounded-lg border p-3"><div className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /><div><h3 className="text-sm font-semibold">{createMode ? "Initial password and roles" : targetUser ? "Password management" : "Change password"}</h3><p className="text-xs text-muted-foreground">{platformMode && platformPolicy ? `Use at least ${platformPolicy.minimumPasswordLength} characters with lowercase${platformPolicy.requireUppercase ? ", uppercase" : ""}${platformPolicy.requireNumbers ? ", number" : ""}${platformPolicy.requireSpecialCharacters ? ", special character" : ""}.` : `Use at least ${passwordPolicy.minimumPasswordLength} characters with lowercase${passwordPolicy.requireUppercase ? ", uppercase" : ""}${passwordPolicy.requireNumbers ? ", number" : ""}${passwordPolicy.requireSpecialCharacters ? ", special character" : ""}.`}</p></div></div>
            {createMode || (platformMode && targetUser) ? <div className="space-y-3">{createMode && <div className="space-y-1.5"><Label>Initial password</Label><Input name="new-password" type="password" autoComplete="new-password" value={initialPassword} onChange={e => setInitialPassword(e.target.value)} /></div>}<div className="space-y-1.5"><div className="flex items-center justify-between"><Label>Platform roles</Label><span className="text-[11px] text-muted-foreground">{roleIds.length} selected</span></div><div className="max-h-28 space-y-1 overflow-y-auto rounded-md border p-2">{roles.length ? roles.map(role => <label key={role.id} className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-muted/50"><Checkbox className="mt-0.5" checked={roleIds.includes(role.id)} onCheckedChange={checked => setRoleIds(current => checked ? [...current, role.id] : current.filter(id => id !== role.id))} /><span><span className="block text-xs font-medium">{role.name}</span>{role.description && <span className="block text-[11px] text-muted-foreground">{role.description}</span>}</span></label>) : <p className="p-2 text-xs text-muted-foreground">No platform roles are available.</p>}</div></div></div> : targetUser ? <p className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">Password resets remain available from the user actions menu.</p> : <><div className="grid gap-3 sm:grid-cols-2"><Input name="username" autoComplete="username" value={form.userName} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" /><div className="space-y-1.5 sm:col-span-2"><Label>Current password</Label><Input name="current-password" type="password" autoComplete="current-password" value={password.current} onChange={e => setPassword(p => ({ ...p, current: e.target.value }))} /></div><div className="space-y-1.5"><Label>New password</Label><Input name="new-password" type="password" autoComplete="new-password" value={password.next} onChange={e => setPassword(p => ({ ...p, next: e.target.value }))} /></div><div className="space-y-1.5"><Label>Confirm password</Label><Input name="confirm-password" type="password" autoComplete="new-password" value={password.confirm} onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))} /></div></div><Button size="sm" onClick={handlePasswordChange} disabled={busy || !password.current || !password.next || !password.confirm}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update password</Button></>}
          </section>
          <section className="col-span-2 overflow-hidden rounded-lg border"><div className="flex items-center justify-between gap-3 border-b p-3"><div className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /><div><h3 className="text-sm font-semibold">Recent security activity</h3><p className="text-xs text-muted-foreground">Your four latest authentication events.</p></div></div>{(details?.activity.length || 0) > 4 && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setActivityOpen(true)}>View all</Button>}</div>
            {loadingDetails ? <div className="flex justify-center p-5"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : details?.activity.length ? <div className="grid grid-cols-2">{details.activity.slice(0, 4).map((item, index) => <div key={`${item.timestamp}-${index}`} className="flex items-start justify-between gap-4 border-b border-r p-2.5"><div className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-xs font-medium">{item.eventType} · {item.status || "Recorded"}</p><p className="text-[11px] text-muted-foreground">{item.ipAddress}{item.userAgent ? ` · ${item.userAgent.slice(0, 38)}` : ""}</p>{item.failureReason && <p className="text-[11px] text-destructive">{item.failureReason}</p>}</div></div><time className="shrink-0 text-[11px] text-muted-foreground">{formatDate(item.timestamp)}</time></div>)}</div> : <p className="p-5 text-center text-sm text-muted-foreground">No security activity recorded yet.</p>}
          </section>
          </div>
        </TabsContent>
      </Tabs>
      <DialogFooter className="border-t pt-3"><Button size="sm" variant="outline" onClick={() => requestClose(false)} disabled={busy}>Cancel</Button><Button size="sm" onClick={handleSave} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {createMode ? (platformMode ? "Add user" : "Create user") : "Save changes"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Security activity</DialogTitle><DialogDescription>Complete recent authentication history for your account.</DialogDescription></DialogHeader>
      <div className="divide-y rounded-lg border">
        {details?.activity.map((item, index) => <div key={`${item.timestamp}-full-${index}`} className="flex items-start justify-between gap-4 p-3"><div className="flex gap-2"><Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" /><div><p className="text-sm font-medium">{item.eventType} · {item.status || "Recorded"}</p><p className="text-xs text-muted-foreground">{item.ipAddress}{item.userAgent ? ` · ${item.userAgent}` : ""}</p>{item.failureReason && <p className="text-xs text-destructive">{item.failureReason}</p>}</div></div><time className="shrink-0 text-xs text-muted-foreground">{formatDate(item.timestamp)}</time></div>)}
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setActivityOpen(false)}>Close</Button></DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog open={Boolean(crop)} onOpenChange={value => { if (!value) closeCrop(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Crop profile picture</DialogTitle><DialogDescription>Adjust the image inside the square. The saved picture will be 512 × 512 pixels.</DialogDescription></DialogHeader>
      {crop && <div className="space-y-4">
        <div className="mx-auto h-72 w-72 overflow-hidden rounded-xl border-4 border-background bg-muted shadow-inner ring-1 ring-border">
          <img src={crop.url} alt="Crop preview" className="h-full w-full object-cover" style={{ transform: `scale(${crop.zoom}) translate(${crop.x / crop.zoom}%, ${crop.y / crop.zoom}%)` }} />
        </div>
        <div className="grid gap-3">
          <div className="grid grid-cols-[70px_1fr] items-center gap-3"><Label htmlFor="crop-zoom">Zoom</Label><input id="crop-zoom" type="range" min="1" max="3" step="0.05" value={crop.zoom} onChange={e => setCrop(current => current ? { ...current, zoom: Number(e.target.value) } : current)} className="w-full accent-primary" /></div>
          <div className="grid grid-cols-[70px_1fr] items-center gap-3"><Label htmlFor="crop-x">Horizontal</Label><input id="crop-x" type="range" min="-100" max="100" value={crop.x} onChange={e => setCrop(current => current ? { ...current, x: Number(e.target.value) } : current)} className="w-full accent-primary" /></div>
          <div className="grid grid-cols-[70px_1fr] items-center gap-3"><Label htmlFor="crop-y">Vertical</Label><input id="crop-y" type="range" min="-100" max="100" value={crop.y} onChange={e => setCrop(current => current ? { ...current, y: Number(e.target.value) } : current)} className="w-full accent-primary" /></div>
        </div>
      </div>}
      <DialogFooter><Button variant="outline" onClick={closeCrop} disabled={busy}>Cancel</Button><Button onClick={uploadCroppedPicture} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />} Crop & preview</Button></DialogFooter>
    </DialogContent>
  </Dialog>
  <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
        <AlertDialogDescription>
          Your profile changes and temporary picture preview have not been saved. Closing now will restore the original values.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Keep editing</AlertDialogCancel>
        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={discardChanges}>
          Discard changes
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  </>;
};

export default UserAccountDialog;
