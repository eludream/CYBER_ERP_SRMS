import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Settings, Shield, Globe, Mail, Database, Key,
  Clock, Lock, Smartphone, Save, RotateCcw, Upload, Trash2, Building2, FileText, ArrowRight
} from "lucide-react";
import { multiTenantService, OrganizationRecord } from "@/services/api/multiTenantService";

const SettingsSection = ({
  icon: Icon, title, description, children,
}: {
  icon: typeof Settings; title: string; description: string; children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border bg-card p-5 space-y-4">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4.5 w-4.5 text-primary" />
      </div>
      <div>
        <h3 className="font-display font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const SettingsRow = ({
  label, description, children,
}: {
  label: string; description?: string; children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const SystemSettings = () => {
  const navigate = useNavigate();
  const { tenantSlug, moduleSlug } = useParams<{ tenantSlug: string; moduleSlug: string }>();
  // General
  const [organization, setOrganization] = useState<OrganizationRecord | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [currency, setCurrency] = useState("USD");
  useEffect(() => { multiTenantService.organizationProfile().then(record => { setOrganization(record); setCompanyName(record.displayName); setTimezone(record.timezone); setDateFormat(record.dateFormat); setCurrency(record.currency); }).catch(() => undefined); }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, SVG)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCompanyLogo(ev.target?.result as string);
      toast.success("Logo uploaded — remember to save");
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setCompanyLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
    toast.info("Logo removed");
  };

  // Security / Password
  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);
  const [passwordExpiry, setPasswordExpiry] = useState(90);
  const [passwordHistory, setPasswordHistory] = useState(5);

  // Session
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState(3);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(30);

  // 2FA
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [enforce2FAForAdmins, setEnforce2FAForAdmins] = useState(true);

  // Email
  const [smtpHost, setSmtpHost] = useState("smtp.company.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("noreply@cybererp.com");
  const [smtpTls, setSmtpTls] = useState(true);

  // Backup
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [retentionDays, setRetentionDays] = useState(30);

  const handleSave = async () => {
    if (!organization) { toast.error("Select an organization before saving organization defaults"); return; }
    try { const saved = await multiTenantService.saveOrganizationProfile({ ...organization, displayName: companyName, timezone, dateFormat, currency }); setOrganization(saved); toast.success("Organization settings saved"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save organization settings"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground text-sm">Configure system-wide preferences and security policies</p>
        </div>
        <Button onClick={handleSave} className="gap-1.5">
          <Save className="h-4 w-4" /> Save All
        </Button>
      </div>

      {/* Document Types quick-link */}
      <button
        onClick={() => navigate(
          tenantSlug && moduleSlug
            ? `/${tenantSlug}/${moduleSlug}/document-types`
            : "/security/document-types",
        )}
        className="w-full rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/40 hover:shadow-sm transition-all group text-left"
      >
        <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground">Document Types</h3>
          <p className="text-xs text-muted-foreground">Manage form bindings across all modules — assign custom forms to document types in bulk</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </button>

      <Tabs defaultValue="security">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general" className="space-y-4">
          <SettingsSection icon={Globe} title="General" description="Company identity and regional settings">
            <SettingsRow label="Company Name">
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-[220px]" />
            </SettingsRow>

            {/* Company Logo */}
            <div className="py-2">
              <p className="text-sm font-medium text-foreground mb-1">Company Logo</p>
              <p className="text-xs text-muted-foreground mb-3">Used on invoices, reports, and the login page. PNG, JPG, or SVG up to 2 MB.</p>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Company logo" className="h-full w-full object-contain p-1" />
                  ) : (
                    <Building2 className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {companyLogo ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {companyLogo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive/10"
                      onClick={removeLogo}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <SettingsRow label="Timezone">
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">US Eastern</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
            <SettingsRow label="Date Format">
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
            <SettingsRow label="Default Currency">
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN ₦</SelectItem>
                  <SelectItem value="USD">USD $</SelectItem>
                  <SelectItem value="EUR">EUR €</SelectItem>
                  <SelectItem value="GBP">GBP £</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          </SettingsSection>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="space-y-4">
          <SettingsSection icon={Lock} title="Password Policy" description="Enforce password complexity and rotation">
            <SettingsRow label="Minimum Length" description={`${minPasswordLength} characters`}>
              <div className="w-[160px]">
                <Slider value={[minPasswordLength]} onValueChange={([v]) => setMinPasswordLength(v)} min={6} max={24} step={1} />
              </div>
            </SettingsRow>
            <SettingsRow label="Require Uppercase" description="At least one uppercase letter">
              <Switch checked={requireUppercase} onCheckedChange={setRequireUppercase} />
            </SettingsRow>
            <SettingsRow label="Require Numbers" description="At least one digit">
              <Switch checked={requireNumbers} onCheckedChange={setRequireNumbers} />
            </SettingsRow>
            <SettingsRow label="Require Special Characters" description="At least one special character (!@#$...)">
              <Switch checked={requireSpecialChars} onCheckedChange={setRequireSpecialChars} />
            </SettingsRow>
            <SettingsRow label="Password Expiry" description={`Every ${passwordExpiry} days`}>
              <Select value={String(passwordExpiry)} onValueChange={v => setPasswordExpiry(Number(v))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="0">Never</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
            <SettingsRow label="Password History" description={`Remember last ${passwordHistory} passwords`}>
              <Select value={String(passwordHistory)} onValueChange={v => setPasswordHistory(Number(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="0">None</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          </SettingsSection>

          <SettingsSection icon={Clock} title="Session Management" description="Control user session behavior">
            <SettingsRow label="Session Timeout" description={`${sessionTimeout} minutes of inactivity`}>
              <div className="w-[160px]">
                <Slider value={[sessionTimeout]} onValueChange={([v]) => setSessionTimeout(v)} min={5} max={120} step={5} />
              </div>
            </SettingsRow>
            <SettingsRow label="Max Concurrent Sessions" description={`${maxConcurrentSessions} sessions per user`}>
              <Select value={String(maxConcurrentSessions)} onValueChange={v => setMaxConcurrentSessions(Number(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="0">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
            <SettingsRow label="Max Login Attempts" description={`Lock after ${maxLoginAttempts} failed attempts`}>
              <Select value={String(maxLoginAttempts)} onValueChange={v => setMaxLoginAttempts(Number(v))}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
            <SettingsRow label="Lockout Duration" description={`${lockoutDuration} minutes after max attempts`}>
              <Select value={String(lockoutDuration)} onValueChange={v => setLockoutDuration(Number(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="0">Until manual unlock</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
          </SettingsSection>

          <SettingsSection icon={Smartphone} title="Two-Factor Authentication" description="Multi-factor authentication settings">
            <SettingsRow label="Enforce 2FA for All Users" description="Require two-factor on every login">
              <Switch checked={enforce2FA} onCheckedChange={setEnforce2FA} />
            </SettingsRow>
            <SettingsRow label="Enforce 2FA for Admins" description="System Admins must always use 2FA">
              <Switch checked={enforce2FAForAdmins} onCheckedChange={setEnforce2FAForAdmins} />
            </SettingsRow>
          </SettingsSection>
        </TabsContent>

        {/* ── Email ── */}
        <TabsContent value="email" className="space-y-4">
          <SettingsSection icon={Mail} title="SMTP Configuration" description="Email server settings for notifications">
            <SettingsRow label="SMTP Host">
              <Input value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="w-[220px]" />
            </SettingsRow>
            <SettingsRow label="SMTP Port">
              <Input value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className="w-[100px]" />
            </SettingsRow>
            <SettingsRow label="Username / From">
              <Input value={smtpUser} onChange={e => setSmtpUser(e.target.value)} className="w-[220px]" />
            </SettingsRow>
            <SettingsRow label="Use TLS" description="Encrypt email connections">
              <Switch checked={smtpTls} onCheckedChange={setSmtpTls} />
            </SettingsRow>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Test email sent to admin@cybererp.com")}>
                <Mail className="h-3.5 w-3.5" /> Send Test Email
              </Button>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* ── Backup ── */}
        <TabsContent value="backup" className="space-y-4">
          <SettingsSection icon={Database} title="Automated Backups" description="Database backup schedule and retention">
            <SettingsRow label="Auto Backup" description="Enable scheduled backups">
              <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            </SettingsRow>
            <SettingsRow label="Frequency">
              <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
            <SettingsRow label="Retention Period" description={`Keep backups for ${retentionDays} days`}>
              <Select value={String(retentionDays)} onValueChange={v => setRetentionDays(Number(v))}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </SettingsRow>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Manual backup initiated")}>
                <Database className="h-3.5 w-3.5" /> Backup Now
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Restore wizard would open here")}>
                <RotateCcw className="h-3.5 w-3.5" /> Restore
              </Button>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;
