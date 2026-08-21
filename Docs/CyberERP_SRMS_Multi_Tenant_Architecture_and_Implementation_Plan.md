<!-- CyberERP SRMS architecture and implementation specification -->

# CyberERP / SRMS

## Multi-Tenant Architecture and Implementation Plan

ERP-level catalogs, tenant subscriptions, global identity, role templates, authorization, database migration, API refactoring, and frontend delivery

## Execution directive for Codex

This Markdown file is the authoritative command-source specification for implementing the CyberERP/SRMS multi-tenant solution. When instructed to execute it, Codex must treat the requirements, ordering, invariants, security controls, migration rules, tests, and acceptance criteria below as required implementation scope.

### Execution rules

1. Inspect the current database, API, frontend, migrations, configuration, and working-tree state before editing.
2. Complete the mandatory backup gate below before changing source code, creating migrations, or modifying database state.
3. Implement the work phase by phase in the order defined in this document. Do not begin tenant features before the ERP catalog, global identity, and Organization foundation exist.
4. Create or update the database through reviewed EF Core migrations and explicit data-conversion logic. Do not modify production data manually or destructively.
5. Modify the current API projects at the Domain, Application, Infrastructure, and API layers while preserving their established architectural boundaries.
6. Modify the frontend only after the supporting API contract is implemented and verified.
7. Preserve existing data through staged, backward-compatible migrations and reconciliation reports.
8. Never weaken tenant isolation, authentication, authorization, auditability, subscription history, or referential integrity to simplify implementation.
9. Do not use browser-supplied tenant, organization, role, module, or permission identifiers without server-side membership and ownership validation.
10. Run targeted tests after every phase and the full applicable test/build suite before completing the implementation.
11. Stop and report any unresolved destructive migration, identity deduplication conflict, ambiguous organization ownership, or security decision that requires explicit approval.
12. Maintain an implementation log identifying backups, completed migrations, API features, frontend changes, tests, reconciliation results, and any approved deviations.
13. The implementation is complete only when all acceptance criteria in this document pass and no required phase remains unfinished.

### Mandatory backup gate

Before implementation begins, create a timestamped, read-only backup set outside the active project directories containing:

- A complete backup of `D:\Work\Project\Cyber ERP\SRMS\API`.
- A complete backup of `D:\Work\Project\Cyber ERP\SRMS\Web`.
- A native database backup of the current SRMS database, including schema and data.
- A database schema script and migration inventory to support independent inspection.
- A manifest containing backup timestamp, source paths, database/server identity, file sizes, checksums, current Git branch and commit, and working-tree status.
- A copy of uncommitted source changes so user work is not lost.

Backup requirements:

1. Do not store the only backup inside either active project directory.
2. Do not include plaintext secrets in the manifest or implementation log.
3. Verify that every project archive can be opened and enumerated.
4. Run the database platform's backup verification command and record the result.
5. Confirm that the database backup is non-empty and corresponds to the intended database.
6. Record exact restore instructions for the API project, Web project, and database.
7. Do not begin implementation if any backup or verification step fails.
8. Never overwrite an earlier backup set; create a new timestamped set for each execution attempt.
9. Obtain explicit approval before restoring a backup because restoration overwrites active state.

### Invocation example

```text
Implement the CyberERP/SRMS multi-tenant solution using this Markdown file as the authoritative execution specification. Before changing anything, create and verify timestamped backups of both the API and Web projects and a native backup of the SRMS database, and record the backup manifest and restore instructions. Then work through every phase in order, update the database and current API/frontend projects, run all required migrations and tests, and do not stop until the documented acceptance criteria are satisfied or a genuine approval-dependent blocker is reached.
```

| Document | Value |
| --- | --- |
| Purpose | Technical architecture and executable delivery specification |
| Application | SRMS - System Resource Management System |
| Platform | CyberERP |
| Status | Proposed target architecture |
| Prepared | July 2026 |

> Primary decision An Organization is the customer/account boundary and must exist before a Tenant. Modules, Operations, Subscription Plans, and Standard Role Templates are ERP-level records. Users are global identities. Tenants, entitlements, tenant roles, and user-role assignments operate beneath an Organization.

Confidential - Internal Architecture and Delivery Guide

# 1. Executive summary

CyberERP requires a control-plane architecture that can support a single tenant, multiple tenants, and people who participate in more than one tenant. The current SRMS implementation places TenantId on most entities, including User, Module, Operation, Role, UserRole, and RolePermission. That design isolates data, but it duplicates ERP product definitions and makes cross-tenant identity and subscription-based module access difficult.

The target design separates stable ERP definitions from organization and tenant assignments. An Organization represents the customer, legal entity, or account owner and must be created before any Tenant. Modules, Operations, Subscription Plans, and Standard Role Templates are maintained once at platform level. Tenants belong to an Organization and receive time-bound module entitlements from organization subscriptions or tenant add-ons. People authenticate through a global User identity and gain organization and tenant access through explicit memberships.

## 1.1 Required outcome

- A platform administrator can maintain the ERP catalog and create an Organization before any Tenant exists.
- Every Tenant belongs to exactly one Organization; an Organization may contain multiple Tenants.
- Organization administrators can manage the Organization and its authorized Tenants.
- A person can belong to multiple tenants and hold different roles in each tenant.
- A tenant can subscribe to different modules at different times.
- A tenant administrator can manage tenant users and roles without altering ERP-level templates.
- Every API request enforces tenant membership, module entitlement, and operation permission.
- Single-tenant installations use the same model while hiding unnecessary tenant-selection UI.
## 1.2 Scope

| Included | Excluded or deferred |
| --- | --- |
| Database schema and migrations | Payment gateway implementation |
| API domain and feature refactoring | Vendor-specific infrastructure provisioning |
| Authentication and tenant selection | Final commercial pricing decisions |
| Subscriptions and module entitlements | Tenant-specific custom modules unless explicitly enabled |
| ERP role templates and tenant role assignment | Full UI visual design specifications |
| Frontend platform and tenant administration flows | Production deployment execution |

# 2. Current-state assessment

The following findings are based on the current SRMS domain entities, EF Core configurations, generic repository, login repository, tenant seed service, and frontend tenant context.

| Area | Current behavior | Risk |
| --- | --- | --- |
| User identity | User inherits string TenantId | One person must be duplicated across tenants |
| Login | Searches all users by username, then chooses first matching password | Duplicate usernames/passwords can select an arbitrary tenant |
| Module | Tenant-scoped and unique by TenantId + Code | ERP modules and operations are copied per tenant |
| Operation | Tenant-scoped and belongs to tenant Module | Operation IDs differ between tenants |
| Role | Tenant-scoped | Appropriate for assignments, but no ERP role template |
| RolePermission | Tenant-scoped and linked to Operation | Cross-tenant links are not prevented by composite FKs |
| Subscription | TenantSubscription points to one plan | No independent module start/end periods |
| Organization | No domain entity; Security Settings uses mock company state | No persisted parent account exists before tenant creation |
| Tenant | No required Organization parent; also stores subscription dates | Hierarchy is missing and subscription truth can diverge |
| Frontend | TenantContext and Company Settings contain mock data | UI is not driven by persisted organization or memberships |

> Security priority The current default tenant seeding creates the same admin username and password for every tenant. Combined with cross-tenant username lookup, this is unsafe for multi-tenant operation and must be replaced before rollout.

# 3. Architectural principles

- Global identity: a User represents one person across the platform.
- Organization first: an Organization must exist before any Tenant can be provisioned.
- Explicit membership: OrganizationUser and TenantUser connect a person to each administrative scope.
- Platform catalog: ERP Modules and Operations are defined once.
- Commercial entitlement: subscriptions determine which modules a tenant can use and when.
- Tenant authorization: tenant roles determine which operations a member may perform.
- Template-based security: ERP standard roles are templates, not directly assigned global roles.
- Server-side enforcement: UI visibility is never the sole security boundary.
- History preservation: subscription, membership, and authorization history is retained.
- Consistent identifiers: TenantId and related foreign keys use uniqueidentifier/Guid.
# 4. Target logical architecture

```text
CYBERERP PLATFORM / CONTROL PLANE
  PlatformUser and PlatformAdministrator
  Module -> Operation
  SubscriptionPlan -> SubscriptionPlanModule -> Module
  StandardRoleTemplate -> StandardRolePermission -> Operation

ORGANIZATION CONTROL
  Organization -> OrganizationUser -> User
  Organization -> OrganizationSubscription
  Organization -> Tenant

TENANT CONTROL
  Tenant -> TenantModuleEntitlement -> Module
  Tenant -> TenantUser -> User
  Tenant -> TenantRole -> TenantRolePermission -> Operation
  TenantUser -> TenantUserRole -> TenantRole

REQUEST AUTHORIZATION
  Global User + Selected Tenant + Active Membership
  + Active Module Entitlement + Tenant Role Permission
```

## 4.1 Access decision

```text
ALLOW request only when:
  user is authenticated
  AND selected tenant is active
  AND user has an active TenantUser membership
  AND target module has an active TenantModuleEntitlement
  AND an assigned TenantRole grants the required Operation permission
```

# 5. Target database design

## 5.1 Platform schema

Create a Platform schema in the shared control database. These tables are not tenant-filtered.

| Table | Purpose | Key constraints |
| --- | --- | --- |
| Platform.Module | Stable ERP module catalog | Unique Code |
| Platform.Operation | Stable actions/routes within a module | Unique ModuleId + Code |
| Platform.SubscriptionPlan | Commercial plan definition | Unique Code; controlled BillingCycle |
| Platform.SubscriptionPlanModule | Modules bundled in a plan | Unique PlanId + ModuleId |
| Platform.StandardRoleTemplate | Reusable ERP role definition | Unique Code |
| Platform.StandardRolePermission | Template permissions over Operations | Unique TemplateId + OperationId |

## 5.2 Global identity schema

| Table | Important columns | Notes |
| --- | --- | --- |
| Core.User | Id, UserName, NormalizedUserName, Email, PasswordHash, AccountStatus, IsPlatformAdministrator | No TenantId |
| Core.TenantUser | TenantId, UserId, Status, IsTenantAdministrator, IsDefaultTenant | Unique TenantId + UserId |
| Core.TenantUserRole | TenantUserId, TenantRoleId, AssignedAt, AssignedBy | Unique membership + role |

## 5.2A Organization hierarchy

Organization is the customer/account boundary above Tenant. The current mock Company Settings fields become persisted organization identity and defaults. Every Tenant requires OrganizationId; one Organization may contain multiple Tenants. Tenant settings inherit organization defaults unless an approved override is present.

| Table | Important columns | Notes |
| --- | --- | --- |
| Core.Organization | Id, Code, LegalName, DisplayName, LogoUrl, address/contact, Currency, Timezone, Locale, DateFormat, IsActive | Created before Tenant; unique Code |
| Core.OrganizationUser | OrganizationId, UserId, Status, IsOrganizationAdministrator | A person may administer several organizations |
| Core.Tenant | OrganizationId, Identifier, Name, IsActive, optional setting overrides | Required Organization FK; unique OrganizationId + Identifier |

## 5.3 Tenant subscription schema

| Table | Important columns | Notes |
| --- | --- | --- |
| Core.OrganizationSubscription | OrganizationId, PlanId, Status, Currency, billing dates, AutoRenew | Primary commercial agreement and history |
| Core.TenantModuleEntitlement | OrganizationSubscriptionId, TenantId, ModuleId, SourceType, StartDate, EndDate, Status | Allocates organization purchases to a Tenant |
| Core.TenantSubscriptionAddOn | TenantId, ModuleId, billing and lifecycle fields | Optional tenant add-on where policy allows |

## 5.4 Tenant role schema

| Table | Important columns | Notes |
| --- | --- | --- |
| Core.TenantRole | TenantId, SourceTemplateId, Code, Name, IsCustomized | Instantiated from ERP template or created locally |
| Core.TenantRolePermission | TenantRoleId, OperationId and action flags | Must reference a platform Operation |

## 5.5 Recommended SQL blueprint

```text
CREATE SCHEMA Platform;

CREATE TABLE Platform.Module (
  Id uniqueidentifier NOT NULL PRIMARY KEY,
  Code nvarchar(80) NOT NULL UNIQUE,
  Name nvarchar(100) NOT NULL,
  Description nvarchar(500) NOT NULL,
  LandingPath nvarchar(250) NOT NULL,
  Icon nvarchar(100) NULL,
  DisplayOrder int NOT NULL,
  IsActive bit NOT NULL
);

CREATE TABLE Core.TenantUser (
  Id uniqueidentifier NOT NULL PRIMARY KEY,
  TenantId uniqueidentifier NOT NULL,
  UserId uniqueidentifier NOT NULL,
  Status nvarchar(30) NOT NULL,
  IsTenantAdministrator bit NOT NULL,
  IsDefaultTenant bit NOT NULL,
  CONSTRAINT UQ_TenantUser UNIQUE (TenantId, UserId),
  CONSTRAINT FK_TenantUser_Tenant FOREIGN KEY (TenantId) REFERENCES Core.Tenant(Id),
  CONSTRAINT FK_TenantUser_User FOREIGN KEY (UserId) REFERENCES Core.[User](Id)
);
```

```text
CREATE TABLE Core.Organization (
  Id uniqueidentifier NOT NULL PRIMARY KEY,
  Code nvarchar(80) NOT NULL UNIQUE,
  LegalName nvarchar(200) NOT NULL,
  DisplayName nvarchar(200) NOT NULL,
  LogoUrl nvarchar(500) NULL,
  Currency char(3) NOT NULL,
  Timezone nvarchar(100) NOT NULL,
  Locale nvarchar(20) NOT NULL,
  DateFormat nvarchar(30) NOT NULL,
  IsActive bit NOT NULL
);

ALTER TABLE Core.Tenant ADD OrganizationId uniqueidentifier NULL;
ALTER TABLE Core.Tenant ADD CONSTRAINT FK_Tenant_Organization
  FOREIGN KEY (OrganizationId) REFERENCES Core.Organization(Id);
-- Backfill and validate OrganizationId before changing it to NOT NULL.
```

# 6. Module and Operation catalog

Modules and Operations are product definitions. They must be created before tenant provisioning and maintained through Platform Administration. The tenant seed process must no longer copy these records.

| Module example | Operation examples |
| --- | --- |
| SRMS | SRMS.TENANTS.VIEW; SRMS.USERS.MANAGE; SRMS.ROLES.MANAGE; SRMS.MODULES.VIEW |
| Finance | FINANCE.JOURNAL.VIEW; FINANCE.JOURNAL.POST; FINANCE.INVOICE.APPROVE |
| Human Resources | HR.EMPLOYEE.VIEW; HR.EMPLOYEE.MANAGE; HR.PAYROLL.RUN |

## 6.1 Catalog maintenance rules

- Codes are stable contracts and cannot be freely changed after release.
- Deactivation is preferred over deletion when references exist.
- Catalog changes are audited and versioned.
- Tenant-specific custom modules are optional and require an explicit Scope and OwnerTenantId model.
# 7. Standard role templates

ERP-level standard roles are templates. A template is never assigned directly to a person. It is instantiated as a TenantRole so the tenant may customize permissions without modifying the platform definition.

```text
StandardRoleTemplate
  -> copy into TenantRole (SourceTemplateId retained)
  -> copy StandardRolePermission into TenantRolePermission
  -> assign TenantRole to TenantUser through TenantUserRole
```

| Template | Typical scope |
| --- | --- |
| Tenant Administrator | Tenant profile, memberships, tenant roles, settings, and entitlement visibility |
| Module Administrator | Configuration within entitled modules |
| Finance Manager | Finance operational and approval permissions |
| Auditor | Read and export permissions without mutation |
| Viewer | Read-only access to selected operations |

# 8. Subscription and entitlement model

OrganizationSubscription represents the primary customer billing relationship. TenantModuleEntitlement allocates actual time-bound access to a Tenant beneath that Organization. A tenant may activate Finance in January, HR in April, and Inventory in July without altering unrelated module periods. Tenant-specific add-ons may supplement the organization subscription where commercial policy permits.

| Module | Start | End | Source | Status |
| --- | --- | --- | --- | --- |
| SRMS | 2026-01-01 | 2026-12-31 | Base plan | Active |
| Finance | 2026-01-01 | 2026-12-31 | Plan | Active |
| HR | 2026-04-01 | 2027-03-31 | Add-on | Active |
| Inventory | 2026-07-01 | 2026-07-14 | Trial | Trial |

## 8.1 Entitlement lifecycle

- Pending: configured but not yet effective.
- Trial: effective until TrialEndDate.
- Active: usable within StartDate and EndDate.
- Suspended: temporarily blocked without deleting history.
- Expired: end date has passed.
- Cancelled: intentionally terminated; history retained.

# 9. Authentication and tenant selection

Authentication establishes the global person. Tenant selection establishes the working context. These are separate security events.

```text
Login credentials
  -> authenticate global User
  -> load active TenantUser memberships
  -> zero memberships: Platform Administration or No Tenant Access
  -> one membership: select automatically
  -> multiple memberships: Tenant Selection
  -> issue tenant-context token/session
  -> enter SRMS modules permitted by entitlements
```

## 9.1 Administrator routing

| User state | Landing behavior |
| --- | --- |
| Platform administrator, no tenant | Platform Administration |
| Platform administrator with memberships | Choose Platform Administration or tenant |
| Tenant administrator, one tenant | Select tenant automatically and open SRMS |
| Tenant administrator, multiple tenants | Tenant Selection |
| Ordinary user, no membership | No Tenant Access |

# 10. API project modifications

The current API should be refactored by feature area while preserving the existing layered projects: Domain, Application, Infrastructure, and API.

| Project | Required modifications |
| --- | --- |
| CyberErp.Srms.Dom | Add platform catalog entities, global User, TenantUser, entitlement entities, role templates, tenant roles, controlled status types, and invariants. |
| CyberErp.Srms.App | Add commands/queries, validators, DTOs, onboarding orchestration, tenant selection, entitlement evaluation, and authorization services. |
| CyberErp.Srms.Inf | Add EF configurations, migrations, repositories, migration services, normalized tenant context, and seed/version services. |
| CyberErp.Srms.Api | Add Platform and Tenant controllers, authorization policies, tenant-context issuance, and bootstrap endpoints. |

## 10.1 Platform APIs

- GET/POST/PUT /api/platform/modules
- GET/POST/PUT /api/platform/modules/{id}/operations
- GET/POST/PUT /api/platform/standard-role-templates
- GET/POST/PUT /api/platform/subscription-plans
- GET/POST/PUT /api/platform/organizations
- GET/POST/PUT /api/platform/organizations/{organizationId}/tenants
- GET/POST/PUT /api/platform/organization-subscriptions
- POST /api/platform/organization-onboarding
## 10.2 Tenant APIs

- GET /api/organization-context/memberships
- POST /api/organization-context/select
- GET /api/tenant-context/memberships
- POST /api/tenant-context/select
- GET/POST/PUT /api/tenant/users
- GET/POST/PUT /api/tenant/roles
- PUT /api/tenant/roles/{id}/permissions
- GET /api/tenant/module-entitlements
## 10.3 Transactional onboarding

Onboarding is split into two ordered transactions. Organization onboarding creates the Organization, organization administrator membership, and optional commercial subscription. Tenant provisioning requires OrganizationId and then creates the Tenant, initial entitlements, tenant administrator membership, tenant administrator role, and user-role assignment. A failed provisioning operation must not leave a partial Tenant.

# 11. Repository and tenant-context hardening

- Replace string TenantId with Guid tenant foreign keys.
- Do not silently skip tenant filtering when tenant context is absent on tenant endpoints.
- Verify tenant ownership on update and delete, not only on reads.
- Disallow cross-tenant UserRole and RolePermission relationships.
- Separate platform repositories from tenant-scoped repositories.
- Stop resolving tenant identity from arbitrary cookie values or email claims.
- Issue and validate a tenant-context token/session after selection.
# 12. Organization-first onboarding and bootstrap behavior

```text
No ERP catalog:
  Platform admin -> Platform Setup -> initialize versioned ERP catalog

ERP catalog exists, no organization:
  Platform admin -> Organization Setup -> create first organization

Organization exists, no tenant:
  Organization/platform admin -> Tenant Setup -> create first tenant under organization

Tenant exists:
  User login -> organization membership resolution -> tenant membership resolution
  -> tenant selection when needed -> SRMS
```

Bootstrap data must be versioned, idempotent, safe to rerun, and independent of tenant context. It should include the SRMS base module, core operations, Platform Administrator support, Tenant Administrator role template, and at least one subscription plan where commercially appropriate.

## 12.1 Organization profile and inherited settings

The current Security Settings General tab contains mock Company Name, Company Logo, Timezone, Date Format, Default Currency, and language-related service fields. These should move to Organization Administration and persist through an Organization API. Tenant Settings should contain tenant-specific overrides and operational security settings, not duplicate the organization record.

| Current field | Target owner | Inheritance rule |
| --- | --- | --- |
| Company Name | Organization | Tenant uses organization identity unless an approved display-name override exists |
| Company Logo | Organization | Inherited by documents and branding; optional tenant override |
| Timezone | Organization default | Tenant may override for local operations |
| Date Format | Organization default | Tenant may override |
| Default Currency | Organization default | Tenant may define operating currency; subscription retains billing currency |
| Language/Locale | Organization default | Tenant and user preferences may override |

# 13. Frontend modifications

| Area | Change |
| --- | --- |
| Authentication | Load global identity and memberships after login |
| Organization selection | Show when the user belongs to multiple active organizations |
| Tenant selection | Show within an Organization when more than one active tenant membership exists |
| Platform Administration | Add Organizations, ERP Catalog, Plans, Standard Roles, and platform-user areas |
| Organization Administration | Add profile, administrators, subscription, tenants, defaults, and branding |
| SRMS Tenant Administration | Add memberships, tenant roles, entitlement visibility, and tenant settings |
| Module selector | Render API-provided active entitlements rather than static modules |
| Navigation | Render operations allowed by effective tenant permissions |
| TenantContext | Remove demo tenants and use authenticated API data |

# 14. Migration plan

1. Add Organization, OrganizationUser, Platform, and membership tables without removing current columns.
2. Create one reconciled Organization for each existing customer/account grouping.
3. Backfill every existing Tenant.OrganizationId and make the relationship required.
4. Migrate reliable Company Settings values into persisted Organization records.
5. Create the global ERP Module and Operation catalog from distinct stable codes.
6. Map existing tenant Module and Operation records to platform records.
7. Create TenantModuleEntitlement records for existing tenant modules.
8. Deduplicate existing users using verified identity reconciliation; never display name alone.
9. Create TenantUser memberships from each existing User + TenantId relationship.
10. Convert tenant roles and map permissions to platform Operations.
11. Convert UserRole records into TenantUserRole records.
12. Create or link StandardRoleTemplates for agreed standard roles.
13. Run dual-read compatibility and reconciliation reports.
14. Switch authentication, authorization, and UI reads to the new model.
15. Remove legacy tenant columns and duplicate catalogs only after acceptance checks pass.
## 14.1 Data reconciliation reports

- Users with duplicate username or email across tenants
- Tenant modules without a global code match
- Operations without a stable operation code
- UserRole relationships whose tenant IDs disagree
- RolePermission relationships whose tenant IDs disagree
- Tenants without a valid Organization parent
- Organizations without an administrator membership
- Tenants without an active SRMS entitlement
- Subscriptions with conflicting dates or statuses

# 15. Security remediation

| Risk | Required remediation | Priority |
| --- | --- | --- |
| Ambiguous cross-tenant username login | Authenticate global User; select tenant after authentication | Critical |
| Shared seeded admin password | One-time invitation/setup token and forced password creation | Critical |
| Anonymous tenant creation | Bootstrap-only or Platform Administrator policy | Critical |
| Cross-tenant relationship assignment | Service validation plus appropriate database constraints | Critical |
| Connection string exposed in DTO | Remove from ordinary DTOs and secure secrets externally | High |
| Legacy plaintext password fallback | Complete migration, audit, and remove fallback | High |
| Free-form status values | Controlled enums/value objects and database checks | Medium |

# 16. Delivery phases

| Phase | Deliverables | Exit criteria |
| --- | --- | --- |
| 1. Foundation | Architecture decisions, identifiers, platform/tenant boundaries | Approved model and migration map |
| 2. Schema | Organization hierarchy, new tables, constraints, migrations, compatibility views | Every Tenant has a valid Organization parent |
| 3. Platform catalog | Module, Operation, Plan, and Role Template APIs | Catalog can be maintained without tenant context |
| 4. Identity | Global User, TenantUser, login, tenant selection | One person works across multiple tenants |
| 5. Entitlements | Subscription and module entitlement APIs | Independent module periods enforced |
| 6. Authorization | Tenant roles, permissions, policies | All protected APIs enforce effective access |
| 7. Frontend | Platform Admin, Tenant Admin, selector and navigation | UI is API-driven and tenant-safe |
| 8. Migration | Conversion, reconciliation, compatibility cutover | No lost users, roles, or permissions |
| 9. Rollout | Pilot, telemetry, rollback, production deployment | Isolation and security acceptance complete |

# 17. Testing strategy

## 17.1 Mandatory scenarios

- An Organization must exist before a Tenant can be created.
- One Organization contains multiple Tenants.
- A global user administers multiple Organizations and Tenants.
- A global user belongs to multiple tenants.
- The same user has different roles in different tenants.
- Tenant switching changes modules and permissions immediately.
- Tenant A cannot read or mutate Tenant B records.
- A tenant cannot access an unsubscribed or expired module.
- A tenant role customized from a template does not modify the template.
- A platform administrator can work without tenant membership.
- A tenant administrator cannot modify platform catalogs.
- Onboarding rolls back completely when any step fails.
- Migrated permissions produce the same or more restrictive effective access.
## 17.2 Test layers

| Layer | Coverage |
| --- | --- |
| Domain | Invariants, statuses, entitlement dates, role-template instantiation |
| Persistence | Constraints, tenant-safe updates/deletes, migration correctness |
| API integration | Policies, membership resolution, tenant context, platform endpoints |
| Security | Cross-tenant ID substitution, privilege escalation, stale context tokens |
| End-to-end | Login, tenant selection, module selection, role assignment, expiration |
| Performance | Permission evaluation, membership loading, entitlement caching |

# 18. Acceptance criteria

- No Tenant can exist without a valid OrganizationId.
- Organization identity and defaults are persisted; Security Settings no longer relies on mock company state.
- No standard Module or Operation row requires TenantId.
- No User row requires TenantId.
- Every tenant membership is represented by TenantUser.
- A tenant sees only modules with effective entitlements.
- Every tenant operation is authorized server-side.
- Role templates are maintained at ERP level and assigned through tenant role instances.
- Historical subscriptions and entitlements remain queryable.
- Platform endpoints work without a selected tenant and reject tenant users without platform privileges.
- All cross-tenant isolation tests pass.
- The current demo TenantContext and repeated tenant admin credentials are removed.
# 19. Decisions required before coding

| Decision | Recommended default |
| --- | --- |
| User uniqueness | Global normalized username and verified email |
| Organization meaning | Customer/account/legal boundary above one or more operational Tenants |
| Subscription owner | Organization owns the primary subscription; entitlements allocate modules to Tenants |
| Custom tenant modules | Disabled initially; add explicit platform/tenant scope later |
| Role template updates | Do not overwrite customized tenant roles automatically |
| Tenant storage model | Shared control database first; preserve ability to separate tenant data later |
| SRMS entitlement | Mandatory base entitlement for every active tenant |
| Tenant deletion | Deactivate/soft-delete and retain billing/security history |
| Platform support access | Explicit, time-bound, audited tenant impersonation |

# 20. Implementation checklist

- Approve Organization definition, ownership, and administrator rules.
- Approve target schema and naming conventions.
- Back up and profile the current database.
- Create migration rehearsal environment.
- Implement platform catalog entities and APIs.
- Implement global identity and TenantUser membership.
- Implement subscription/module entitlement model.
- Implement standard role templates and tenant role instantiation.
- Implement tenant-context authorization policies.
- Build Platform, Organization, and Tenant Administration UI.
- Convert existing data and reconcile exceptions.
- Run isolation, security, and regression suites.
- Pilot with representative single-tenant and multi-tenant organizations.
- Complete staged cutover and remove compatibility paths.
# Appendix A. Current files requiring modification

| Area | Representative current files |
| --- | --- |
| Domain | New Organization/OrganizationUser entities plus Tenant.cs, TenantSubscription.cs, SubscriptionPlan.cs, Module.cs, Operation.cs, User.cs, Role.cs, UserRole.cs, RolePermission.cs |
| EF mapping | New Organization configurations plus TenantConfiguration.cs, ModuleConfiguration.cs, OperationConfiguration.cs, UserConfiguration.cs, RoleConfiguration.cs and joins |
| Infrastructure | Repository.cs, LoginRepository.cs, TenantService.cs, TenantSeedService.cs |
| API | New OrganizationController and OrganizationSubscriptionController plus TenantController.cs, SubscriptionPlanController.cs, authentication and context middleware |
| Frontend | SystemSettings.tsx company mock, new OrganizationContext and Organization Administration, TenantContext.tsx, TenantSwitcher.tsx, AuthContext.tsx, routes and forms |

# Appendix B. Recommended naming

| Concept | Recommended name |
| --- | --- |
| Person account | User |
| Customer/account parent | Organization |
| Organization membership | OrganizationUser |
| Tenant membership | TenantUser |
| ERP module access | TenantModuleEntitlement |
| ERP standard role | StandardRoleTemplate |
| Tenant role instance | TenantRole |
| Membership-role assignment | TenantUserRole |
| Selected tenant security context | TenantContext |

# Appendix C. Final recommendation

> Proceed in sequence First establish the platform catalog and global identity model, then create Organization and OrganizationUser capabilities. Only after an Organization exists should Tenant provisioning, entitlements, tenant authorization, and Tenant Administration become available.
