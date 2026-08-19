import type { ReactNode } from "react";
import { Building2 } from "lucide-react";

/*
 * Enterprise auth shell — the SAP IAS / Microsoft (Azure AD, Dynamics 365) login anatomy:
 * a full-viewport BRANDED BACKDROP (deep primary gradient, quiet geometry + dot grid), the
 * product mark top-left, ONE ELEVATED SIGN-IN CARD centered on it (brand accent bar, in-card
 * product mark, heading, the form, a divided footer note), and a slim legal footer at the
 * bottom. No marketing panels — the card is the entire experience.
 *
 * SHARED DESIGN: this mirrors the HRMS and Home portal auth shells
 * (`Hrms|Home/frontend/src/components/auth/authLayout/authLayout.tsx`) so every CyberERP
 * subsystem presents one sign-in experience. Each app supplies its own brand accent, so this
 * reads "CyberSRMS" where the portal reads "CyberHome" — same layout, correct identity.
 * Keep the three in step when any of them changes.
 *
 * ⚠️ NOT A FILE COPY, AND IT CANNOT BE. HRMS/Home define their palette as ready-to-use colours
 * (`--primary: #0a4fa3`) and hand-write their utility classes; this app is shadcn-style, storing
 * HSL TRIPLETS (`--primary: 224 71% 33%`) that are only valid inside `hsl()`. Pasting their
 * `linear-gradient(..., var(--primary), ...)` here yields invalid CSS and renders no gradient at
 * all. Every colour below therefore goes through `hsl(var(--…))`, and the dark end of the gradient
 * is mixed here because this app has no `--primary-hover`.
 */

interface AuthLayoutProps {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  footer?: ReactNode;
  title?: string;
  subtitle?: string;
}

const widthClasses = {
  sm: "max-w-[440px]",
  md: "max-w-2xl",
  lg: "max-w-3xl",
};

/** Product identity. Login uses the platform brand, not the subsystem abbreviation. */
const BRAND_PREFIX = "Cyber";
const BRAND_ACCENT = "ERP";
const PRODUCT_LINE = "Enterprise Resource Planning";

const AuthLayout = ({ children, maxWidth = "sm", footer, title, subtitle }: AuthLayoutProps) => {
  const year = new Date().getFullYear();

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(165deg, hsl(var(--primary)) 0%, color-mix(in srgb, hsl(var(--primary)) 62%, #000) 100%)",
      }}
    >
      {/* Backdrop geometry — soft glows, a faint dot grid, thin outlined circles. No imagery. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 480px at 85% -10%, rgba(255,255,255,0.09), transparent 60%), radial-gradient(700px 420px at -10% 110%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -right-40 top-1/4 h-[420px] w-[420px] rounded-full border border-white/10" />
      <div aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full border border-white/[0.08]" />

      {/* Product mark — top-left, SAP placement */}
      <header className="relative z-10 flex items-center gap-2.5 px-8 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
          <Building2 className="h-[18px] w-[18px] text-white" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight text-white">
          {BRAND_PREFIX}
          <span className="text-white/70">{BRAND_ACCENT}</span>
        </span>
        <span className="ml-2 hidden border-l border-white/20 pl-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/55 sm:inline">
          {PRODUCT_LINE}
        </span>
      </header>

      {/* The sign-in card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div
          className={`relative w-full ${widthClasses[maxWidth]} overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-black/5`}
        >
          {/* Brand accent bar — the card's signature edge. */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />

          <div className="p-8 sm:p-9">
            {/* In-card product mark (Microsoft-style) — the identity travels with the card. */}
            <div className="mb-6 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-[18px] w-[18px]" />
              </span>
              <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
                {BRAND_PREFIX}
                <span className="text-primary">{BRAND_ACCENT}</span>
              </span>
            </div>

            {(title || subtitle) && (
              <div className="mb-6">
                {title && (
                  <h1 className="font-display text-[22px] font-bold tracking-tight text-foreground">
                    {title}
                  </h1>
                )}
                {subtitle && <p className="mt-1.5 text-[13px] text-muted-foreground">{subtitle}</p>}
              </div>
            )}

            {children}

            {footer && <div className="mt-6 border-t border-border pt-4">{footer}</div>}
          </div>
        </div>
      </main>

      {/* Slim legal footer */}
      <footer className="relative z-10 px-4 pb-5 text-center text-[11px] text-white/55">
        © {year} {BRAND_PREFIX}
        {BRAND_ACCENT} · {PRODUCT_LINE} · CyberERP v1.0
      </footer>
    </div>
  );
};

export default AuthLayout;
