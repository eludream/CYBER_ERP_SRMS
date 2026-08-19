import { useEffect, useState } from "react";
import { Clock, Database, Lock, Mail, Save, Settings, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { multiTenantService, PlatformSystemSettings as SettingsModel } from "@/services/api/multiTenantService";

const Section = ({ icon: Icon, title, description, children }: { icon: typeof Settings; title: string; description: string; children: React.ReactNode }) =>
  <div className="space-y-2 rounded-xl border border-border bg-card p-4"><div className="flex items-center gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary"/></div><div><h3 className="font-display text-sm font-semibold leading-tight">{title}</h3><p className="text-[11px] leading-tight text-muted-foreground">{description}</p></div></div>{children}</div>;
const Row = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) =>
  <div className="flex items-center justify-between gap-3 py-1"><div className="min-w-0"><p className="text-xs font-medium leading-tight">{label}</p>{description && <p className="text-[10px] leading-tight text-muted-foreground">{description}</p>}</div><div className="shrink-0">{children}</div></div>;
const choices = (values: number[], suffix = "") => values.map(x => <SelectItem key={x} value={String(x)}>{x ? `${x}${suffix}` : "None"}</SelectItem>);

export default function PlatformSystemSettings() {
  const [value, setValue] = useState<SettingsModel | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const set = <K extends keyof SettingsModel>(key: K, next: SettingsModel[K]) => setValue(current => current ? ({ ...current, [key]: next }) : current);
  useEffect(() => { multiTenantService.platformSystemSettings().then(setValue).catch(error => toast.error(error instanceof Error ? error.message : "Unable to load platform settings")); }, []);
  const save = async () => { if (!value) return; setSaving(true); try { setValue(await multiTenantService.savePlatformSystemSettings(value)); setOpen(false); toast.success("Platform settings saved"); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save platform settings"); } finally { setSaving(false); } };
  if (!value) return null;
  return <>
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div><h3 className="font-display text-sm font-semibold">System Settings</h3><p className="mt-0.5 text-xs text-muted-foreground">Installation-wide security, email, and backup configuration.</p></div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}><Settings className="h-3.5 w-3.5"/>Edit System Settings</Button>
      </div>
      <div className="bg-muted/10 p-4">
        <Tabs defaultValue="security"><TabsList><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="communications">Email &amp; Backup</TabsTrigger></TabsList>
          <TabsContent value="security" className="grid gap-3 lg:grid-cols-3">
            <Section icon={Lock} title="Password Policy" description="Enforce password complexity and rotation">
              <Row label="Minimum Length" description={`${value.minimumPasswordLength} characters`}><div className="w-40"><Slider disabled value={[value.minimumPasswordLength]} min={6} max={24}/></div></Row>
              <Row label="Require Uppercase"><Switch disabled checked={value.requireUppercase}/></Row>
              <Row label="Require Numbers"><Switch disabled checked={value.requireNumbers}/></Row>
              <Row label="Require Special Characters"><Switch disabled checked={value.requireSpecialCharacters}/></Row>
              <Row label="Password Expiry"><Select disabled value={String(value.passwordExpiryDays)}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent>{choices([0,30,60,90,180]," days")}</SelectContent></Select></Row>
              <Row label="Password History"><Select disabled value={String(value.passwordHistoryCount)}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent>{choices([0,3,5,10])}</SelectContent></Select></Row>
            </Section>
            <Section icon={Clock} title="Session Management" description="Control user session and lockout behavior">
              <Row label="Session Timeout" description={`${value.sessionTimeoutMinutes} minutes`}><div className="w-40"><Slider disabled value={[value.sessionTimeoutMinutes]} min={5} max={120} step={5}/></div></Row>
              <Row label="Max Concurrent Sessions"><Select disabled value={String(value.maxConcurrentSessions)}><SelectTrigger className="w-28"><SelectValue/></SelectTrigger><SelectContent>{choices([0,1,3,5])}</SelectContent></Select></Row>
              <Row label="Max Login Attempts"><Select disabled value={String(value.maxLoginAttempts)}><SelectTrigger className="w-28"><SelectValue/></SelectTrigger><SelectContent>{choices([3,5,10])}</SelectContent></Select></Row>
              <Row label="Lockout Duration"><Select disabled value={String(value.lockoutDurationMinutes)}><SelectTrigger className="w-28"><SelectValue/></SelectTrigger><SelectContent>{choices([0,15,30,60]," min")}</SelectContent></Select></Row>
            </Section>
            <Section icon={Smartphone} title="Two-Factor Authentication" description="Platform authentication requirements">
              <Row label="Enforce 2FA for All Users"><Switch disabled checked={value.enforceTwoFactorForAll}/></Row>
              <Row label="Enforce 2FA for Admins"><Switch disabled checked={value.enforceTwoFactorForAdmins}/></Row>
            </Section>
          </TabsContent>
          <TabsContent value="communications" className="grid gap-3 md:grid-cols-2">
            <Section icon={Mail} title="SMTP Configuration" description="Email server settings for notifications">
              <Row label="SMTP Host"><Input readOnly className="w-56" value={value.smtpHost}/></Row>
              <Row label="SMTP Port"><Input readOnly className="w-28" value={value.smtpPort}/></Row>
              <Row label="Username / From"><Input readOnly className="w-56" value={value.smtpUser}/></Row>
              <Row label="Use TLS"><Switch disabled checked={value.smtpUseTls}/></Row>
            </Section>
            <Section icon={Database} title="Automated Backups" description="Database backup schedule and retention">
              <Row label="Auto Backup"><Switch disabled checked={value.autoBackup}/></Row>
              <Row label="Frequency"><Select disabled value={value.backupFrequency}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent/></Select></Row>
              <Row label="Retention Period"><Select disabled value={String(value.backupRetentionDays)}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent/></Select></Row>
            </Section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    <Dialog open={open} onOpenChange={next => !saving && setOpen(next)}>
      <DialogContent className="max-h-[90vh] w-[94vw] max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden gap-0 p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6"><DialogTitle className="font-display">Edit System Settings</DialogTitle><DialogDescription>Configure installation-wide security, email, and backup policies.</DialogDescription></DialogHeader>
        <div className="overflow-y-auto px-6 py-4">
          <Tabs defaultValue="security"><TabsList><TabsTrigger value="security">Security</TabsTrigger><TabsTrigger value="communications">Email &amp; Backup</TabsTrigger></TabsList>
      <TabsContent value="security" className="grid gap-3 lg:grid-cols-3">
        <Section icon={Lock} title="Password Policy" description="Enforce password complexity and rotation">
          <Row label="Minimum Length" description={`${value.minimumPasswordLength} characters`}><div className="w-40"><Slider value={[value.minimumPasswordLength]} onValueChange={([v]) => set("minimumPasswordLength", v)} min={6} max={24}/></div></Row>
          <Row label="Require Uppercase"><Switch checked={value.requireUppercase} onCheckedChange={v => set("requireUppercase", v)}/></Row>
          <Row label="Require Numbers"><Switch checked={value.requireNumbers} onCheckedChange={v => set("requireNumbers", v)}/></Row>
          <Row label="Require Special Characters"><Switch checked={value.requireSpecialCharacters} onCheckedChange={v => set("requireSpecialCharacters", v)}/></Row>
          <Row label="Password Expiry"><Select value={String(value.passwordExpiryDays)} onValueChange={v => set("passwordExpiryDays", Number(v))}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent>{choices([0,30,60,90,180]," days")}</SelectContent></Select></Row>
          <Row label="Password History"><Select value={String(value.passwordHistoryCount)} onValueChange={v => set("passwordHistoryCount", Number(v))}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent>{choices([0,3,5,10])}</SelectContent></Select></Row>
        </Section>
        <Section icon={Clock} title="Session Management" description="Control user session and lockout behavior">
          <Row label="Session Timeout" description={`${value.sessionTimeoutMinutes} minutes`}><div className="w-40"><Slider value={[value.sessionTimeoutMinutes]} onValueChange={([v]) => set("sessionTimeoutMinutes", v)} min={5} max={120} step={5}/></div></Row>
          <Row label="Max Concurrent Sessions"><Select value={String(value.maxConcurrentSessions)} onValueChange={v => set("maxConcurrentSessions", Number(v))}><SelectTrigger className="w-28"><SelectValue/></SelectTrigger><SelectContent>{choices([0,1,3,5])}</SelectContent></Select></Row>
          <Row label="Max Login Attempts"><Select value={String(value.maxLoginAttempts)} onValueChange={v => set("maxLoginAttempts", Number(v))}><SelectTrigger className="w-28"><SelectValue/></SelectTrigger><SelectContent>{choices([3,5,10])}</SelectContent></Select></Row>
          <Row label="Lockout Duration"><Select value={String(value.lockoutDurationMinutes)} onValueChange={v => set("lockoutDurationMinutes", Number(v))}><SelectTrigger className="w-28"><SelectValue/></SelectTrigger><SelectContent>{choices([0,15,30,60]," min")}</SelectContent></Select></Row>
        </Section>
        <Section icon={Smartphone} title="Two-Factor Authentication" description="Platform authentication requirements">
          <Row label="Enforce 2FA for All Users"><Switch checked={value.enforceTwoFactorForAll} onCheckedChange={v => set("enforceTwoFactorForAll", v)}/></Row>
          <Row label="Enforce 2FA for Admins"><Switch checked={value.enforceTwoFactorForAdmins} onCheckedChange={v => set("enforceTwoFactorForAdmins", v)}/></Row>
        </Section>
      </TabsContent>
      <TabsContent value="communications" className="grid gap-3 md:grid-cols-2">
        <Section icon={Mail} title="SMTP Configuration" description="Email server settings for notifications">
          <Row label="SMTP Host"><Input className="w-56" value={value.smtpHost} onChange={e => set("smtpHost", e.target.value)}/></Row>
          <Row label="SMTP Port"><Input className="w-28" type="number" value={value.smtpPort} onChange={e => set("smtpPort", Number(e.target.value))}/></Row>
          <Row label="Username / From"><Input className="w-56" value={value.smtpUser} onChange={e => set("smtpUser", e.target.value)}/></Row>
          <Row label="Use TLS"><Switch checked={value.smtpUseTls} onCheckedChange={v => set("smtpUseTls", v)}/></Row>
        </Section>
        <Section icon={Database} title="Automated Backups" description="Database backup schedule and retention">
          <Row label="Auto Backup"><Switch checked={value.autoBackup} onCheckedChange={v => set("autoBackup", v)}/></Row>
          <Row label="Frequency"><Select value={value.backupFrequency} onValueChange={v => set("backupFrequency", v)}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent>{["hourly","daily","weekly"].map(x=><SelectItem key={x} value={x}>{x[0].toUpperCase()+x.slice(1)}</SelectItem>)}</SelectContent></Select></Row>
          <Row label="Retention Period"><Select value={String(value.backupRetentionDays)} onValueChange={v => set("backupRetentionDays", Number(v))}><SelectTrigger className="w-36"><SelectValue/></SelectTrigger><SelectContent>{choices([7,14,30,60,90]," days")}</SelectContent></Select></Row>
        </Section>
      </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="border-t px-6 py-4"><Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving} className="gap-1.5"><Save className="h-4 w-4"/>{saving ? "Saving…" : "Save changes"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
