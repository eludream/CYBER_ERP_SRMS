import { useEffect, useState } from "react";
import {
  Building2, CalendarRange, CheckCircle2, Clock3, CreditCard,
  Globe2, Landmark, Mail, MapPin, ShieldCheck, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { multiTenantService, OrganizationRecord } from "@/services/api/multiTenantService";

type Tenant = Awaited<ReturnType<typeof multiTenantService.organizationTenants>>[number];
type Administrator = Awaited<ReturnType<typeof multiTenantService.organizationAdministrators>>[number];
type Subscription = Awaited<ReturnType<typeof multiTenantService.organizationSubscriptions>>[number];
type Icon = typeof Building2;

export default function OrganizationAdministrationView() {
  const [profile, setProfile] = useState<OrganizationRecord | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    Promise.all([
      multiTenantService.organizationProfile(),
      multiTenantService.organizationTenants(),
      multiTenantService.organizationAdministrators(),
      multiTenantService.organizationSubscriptions(),
    ]).then(([organization, tenantRows, administratorRows, subscriptionRows]) => {
      setProfile(organization);
      setTenants(tenantRows);
      setAdmins(administratorRows);
      setSubscriptions(subscriptionRows);
    });
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative bg-gradient-to-br from-primary/[0.12] via-primary/[0.04] to-transparent px-5 py-6 sm:px-7">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-primary/[0.08] blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-background shadow-sm">
              {profile?.logoUrl
                ? <img src={profile.logoUrl} alt="" className="h-full w-full object-contain p-2" />
                : <Building2 className="h-7 w-7 text-primary" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Organization workspace</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {profile?.displayName ?? "Organization Administration"}
                </h1>
                {profile && <Badge variant={profile.isActive ? "default" : "secondary"}>{profile.isActive ? "Active" : "Inactive"}</Badge>}
              </div>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {profile?.legalName ?? "Customer identity, regional defaults, administrators, subscriptions, and tenants."}
              </p>
              {profile && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-background/80 px-2 py-1 font-mono text-foreground shadow-sm">{profile.code}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{[profile.city, profile.country].filter(Boolean).join(", ") || "Location not configured"}</span>
                  <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" />{profile.timezone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/70 p-1 sm:w-auto sm:grid-cols-4">
          <Tab value="profile" icon={Landmark}>Profile</Tab>
          <Tab value="tenants" icon={Building2}>Tenants</Tab>
          <Tab value="admins" icon={Users}>Administrators</Tab>
          <Tab value="subscription" icon={CreditCard}>Subscription</Tab>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <Panel icon={Landmark} title="Organization profile" description="Legal identity and regional operating defaults.">
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Legal name" value={profile?.legalName} />
              <Detail label="Currency" value={profile?.currency} />
              <Detail label="Timezone" value={profile?.timezone} />
              <Detail label="Locale" value={profile?.locale} />
              <Detail label="Date format" value={profile?.dateFormat} />
              <Detail label="Organization code" value={profile?.code} mono />
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="tenants" className="mt-0">
          <Panel icon={Building2} title="Tenants" description="Business workspaces operating under this organization.">
            <RecordGrid>{tenants.map(tenant => (
              <article key={tenant.id} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
                <Identity icon={Building2} title={tenant.name} detail={tenant.identifier} mono />
                <Badge variant={tenant.isActive ? "default" : "secondary"}>{tenant.isActive ? "Active" : "Inactive"}</Badge>
              </article>
            ))}</RecordGrid>
          </Panel>
        </TabsContent>

        <TabsContent value="admins" className="mt-0">
          <Panel icon={ShieldCheck} title="Organization administrators" description="People responsible for organization-level administration.">
            <RecordGrid>{admins.map(admin => (
              <article key={admin.id} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
                <Identity icon={Users} title={admin.userName} detail={admin.email} detailIcon={Mail} />
                <Badge variant="outline">{admin.status}</Badge>
              </article>
            ))}</RecordGrid>
          </Panel>
        </TabsContent>

        <TabsContent value="subscription" className="mt-0">
          <Panel icon={CreditCard} title="Subscription history" description="Commercial plans associated with this organization.">
            <RecordGrid>{subscriptions.map(subscription => (
              <article key={subscription.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <Identity icon={CreditCard} title={subscription.name} detail={subscription.currency} />
                  <Badge variant="outline">{subscription.status}</Badge>
                </div>
                <div className="mt-4 grid gap-2 border-t pt-3 text-xs text-muted-foreground sm:grid-cols-2">
                  <span className="inline-flex items-center gap-1.5"><CalendarRange className="h-3.5 w-3.5" />{formatDate(subscription.startDate)} – {formatDate(subscription.endDate)}</span>
                  <span className="inline-flex items-center gap-1.5 sm:justify-end">
                    {subscription.autoRenew ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                    {subscription.autoRenew ? "Auto-renew enabled" : "Manual renewal"}
                  </span>
                </div>
              </article>
            ))}</RecordGrid>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Tab({ value, icon: IconComponent, children }: { value: string; icon: Icon; children: React.ReactNode }) {
  return <TabsTrigger value={value} className="gap-2 py-2.5"><IconComponent className="h-4 w-4" />{children}</TabsTrigger>;
}

function Panel({ icon: IconComponent, title, description, children }: { icon: Icon; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden rounded-xl">
      <CardContent className="p-0">
        <div className="flex items-start gap-3 border-b bg-muted/25 px-5 py-4">
          <span className="rounded-lg bg-primary/10 p-2 text-primary"><IconComponent className="h-4 w-4" /></span>
          <div><h2 className="font-display text-sm font-semibold">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{description}</p></div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return <div className="min-w-0 bg-card px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p><p className={`mt-1.5 truncate text-sm font-medium ${mono ? "font-mono" : ""}`}>{value || "Not configured"}</p></div>;
}

function Identity({ icon: IconComponent, title, detail, detailIcon: DetailIcon, mono = false }: { icon: Icon; title: string; detail: string; detailIcon?: Icon; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconComponent className="h-4 w-4" /></span>
      <div className="min-w-0">
        <h3 className="truncate font-display text-sm font-semibold">{title}</h3>
        <p className={`mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground ${mono ? "font-mono" : ""}`}>
          {DetailIcon && <DetailIcon className="h-3.5 w-3.5 shrink-0" />}{detail}
        </p>
      </div>
    </div>
  );
}

function RecordGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 bg-muted/10 p-4 md:grid-cols-2">{children}</div>;
}

function formatDate(value?: string) {
  if (!value) return "Open ended";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
}
