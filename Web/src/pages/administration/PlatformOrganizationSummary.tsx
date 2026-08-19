import { Building2, ExternalLink, Globe2, MapPin, Pencil, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrganizationRecord } from "@/services/api/multiTenantService";

export default function PlatformOrganizationSummary({ organization, onEdit }: { organization: OrganizationRecord; onEdit: () => void }) {
  const website = organization.website && !/^https?:\/\//i.test(organization.website) ? `https://${organization.website}` : organization.website;
  const location = [organization.city, organization.region, organization.country].filter(Boolean).join(", ");
  const businessType = [organization.organizationType, organization.industry].filter(Boolean).join(" · ");
  const registration = [organization.registrationNumber, organization.taxNumber].filter(Boolean).join(" · ");
  const primaryContact = [organization.primaryContactName, organization.primaryContactTitle].filter(Boolean).join(" · ");

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.10] via-primary/[0.035] to-transparent p-5 shadow-sm sm:p-6">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-background text-primary shadow-sm">
              {organization.logoUrl ? <img src={organization.logoUrl} alt="" className="h-full w-full object-contain p-2" /> : <Building2 className="h-7 w-7" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Organization profile</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold tracking-tight">{organization.displayName}</h2>
                <Badge variant={organization.isActive ? "default" : "secondary"}>{organization.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{organization.legalName}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-background/80 px-2 py-1 font-mono text-foreground shadow-sm">{organization.code}</span>
                {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{location}</span>}
                {website && <a className="inline-flex items-center gap-1 font-medium text-primary hover:underline" href={website} target="_blank" rel="noreferrer">Website<ExternalLink className="h-3 w-3" /></a>}
              </div>
            </div>
          </div>
          <Button size="sm" className="shrink-0 gap-1.5 self-start" onClick={onEdit}><Pencil className="h-3.5 w-3.5" />Edit organization</Button>
        </div>
      </section>
      <div className="grid items-stretch gap-4 md:grid-cols-3">
        <Summary icon={Building2} title="Business">
          <SummaryRow label="Type" value={businessType} />
          <SummaryRow label="Registration / Tax" value={registration} />
          <SummaryRow label="TIN number" value={organization.tinNumber} />
        </Summary>
        <Summary icon={UserRound} title="Primary contact">
          <SummaryRow label="Contact" value={primaryContact} />
          <SummaryRow label="Email" value={organization.primaryContactEmail || organization.email} />
          <SummaryRow label="Phone" value={organization.primaryContactPhone || organization.phone} />
        </Summary>
        <Summary icon={Globe2} title="Operating defaults">
          <SummaryRow label="Currency" value={organization.currency} />
          <SummaryRow label="Timezone" value={organization.timezone} />
          <SummaryRow label="Language" value={organization.defaultLanguage} />
          <SummaryRow label="Fiscal year" value={`Starts ${monthName(organization.fiscalYearStartMonth)}`} />
        </Summary>
      </div>
    </div>
  );
}

function Summary({ icon: Icon, title, children }: { icon: typeof Building2; title: string; children: React.ReactNode }) {
  return <section className="h-full min-h-64 rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="mb-4 flex items-center gap-2.5"><span className="rounded-lg border border-primary/10 bg-primary/10 p-1.5 text-primary"><Icon className="h-4 w-4" /></span><h3 className="font-display text-sm font-semibold">{title}</h3></div><dl className="space-y-3">{children}</dl></section>;
}

function SummaryRow({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</dt><dd className={`mt-0.5 break-words text-sm ${value ? "font-medium text-foreground" : "text-muted-foreground"}`}>{value || "Not configured"}</dd></div>;
}

function monthName(month: number) {
  if (month < 1 || month > 12) return String(month);
  return new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(2024, month - 1, 1));
}
