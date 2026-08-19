// ========================
// API Service Barrel Export
// ========================
// 
// Usage in components:
//   import { financeService, hrService } from "@/services/api";
//   
//   // With React Query:
//   const { data } = useQuery({
//     queryKey: ["invoices"],
//     queryFn: () => financeService.getInvoices({ page: 1, pageSize: 20 }),
//   });
//
// .NET Core Web API Integration Notes:
// ------------------------------------
// 1. Set VITE_API_BASE_URL in your .env file
// 2. Each service maps to a .NET controller:
//    - financeService  → FinanceController
//    - hrService       → HrController
//    - inventoryService → InventoryController
//    - salesService    → SalesController
//    - procurementService → ProcurementController
//    - productionService → ProductionController
//    - authService     → AuthController
// 3. ApiResponse<T> matches the standard response wrapper
// 4. JWT Bearer tokens are auto-attached from localStorage
// 5. PaginationParams maps to standard query parameters
// ========================

export { httpClient, type ApiResponse, type PaginationParams } from "./httpClient";
export { financeService } from "./financeService";
export { hrService } from "./hrService";
export { inventoryService } from "./inventoryService";
export { salesService } from "./salesService";
export { procurementService } from "./procurementService";
export { productionService } from "./productionService";
export { authService } from "./authService";
export { searchService } from "./searchService";
export { workflowService } from "./workflowService";
export { securityService } from "./securityService";
export { reportService } from "./reportService";
export { auditService } from "./auditService";
export { dataImportService } from "./dataImportService";
export { formDesignerService } from "./formDesignerService";
export { moduleDataService } from "./moduleDataService";
export { moduleService } from "./moduleService";
export type { ModuleDto, CreateModuleRequest, UpdateModuleRequest } from "./moduleService";
export type {
  UserRecord, CreateUserRequest, UpdateUserRequest, ActiveSession,
  RoleRecord, CreateRoleRequest, UpdateRoleRequest,
  AuditLogEntry, AuditLogFilters,
  PasswordPolicy, SessionPolicy, SmtpSettings, BackupSettings, CompanySettings,
} from "./securityService";
export type {
  TransitionRequestDto, TransitionResultDto, AvailablePathDto,
  WorkflowProfileBindingDto, WorkflowDocumentDetailDto, EscalationStatusDto,
  FieldVisibilityDto, BusinessRuleCheckDto, CreateWorkflowDocumentDto,
} from "./workflowService";
export type {
  ReportRecord, CreateReportRequest, UpdateReportRequest,
  ReportFieldDto, ReportFilterDto, ReportSortDto, ReportScheduleDto,
  ReportExecutionResult, ReportExportRequest, ReportExportResult,
  ReportExecutionHistoryEntry, DashboardKpi, AnalyticsChartData,
  ModuleFieldsResponse,
} from "./reportService";
export type {
  AuditEntry, AuditFilters, AuditSummary, AuditExportRequest, AuditRetentionPolicy,
} from "./auditService";
export type {
  ImportTemplate, ImportColumn, ImportJob, ImportError, ExportRequest, ExportResult,
} from "./dataImportService";
