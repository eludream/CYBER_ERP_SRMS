// ========================
// Quality Control Data Layer
// Mock data + interfaces for .NET Core Web API integration
// Maps to: QualityController endpoints
// ========================

export interface QualityInspection {
  id: string;
  inspectionNumber: string;
  product: string;
  batchNumber: string;
  inspector: string;
  type: "Incoming" | "In-Process" | "Final" | "Random";
  result: "Pass" | "Fail" | "Conditional";
  defectsFound: number;
  date: string;
  status: string;
}

export interface NonConformanceReport {
  id: string;
  ncrNumber: string;
  product: string;
  issueDescription: string;
  severity: "Critical" | "Major" | "Minor";
  rootCause: string;
  assignedTo: string;
  dispositionAction: "Rework" | "Scrap" | "Use As-Is" | "Return to Supplier" | "Pending";
  dateOpened: string;
  dateClosed: string | null;
  status: string;
  relatedCapa: string | null;
}

export interface CAPARecord {
  id: string;
  capaNumber: string;
  type: "Corrective" | "Preventive";
  source: string;
  description: string;
  assignedTo: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  completionDate: string | null;
  effectiveness: "Effective" | "Not Effective" | "Pending Review" | null;
  status: string;
}

export interface QualityStandard {
  id: string;
  standardCode: string;
  name: string;
  category: string;
  version: string;
  certifyingBody: string;
  lastAuditDate: string;
  nextAuditDate: string;
  complianceStatus: "Compliant" | "Non-Compliant" | "Pending Audit";
}

export interface AuditRecord {
  id: string;
  auditNumber: string;
  type: "Internal" | "External" | "Supplier";
  scope: string;
  auditor: string;
  findings: number;
  majorFindings: number;
  minorFindings: number;
  observations: number;
  date: string;
  status: string;
}

export interface CalibrationRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  location: string;
  lastCalibrated: string;
  nextDue: string;
  calibratedBy: string;
  result: "Pass" | "Fail" | "Adjusted";
  status: string;
}

export interface QualityDocument {
  id: string;
  docNumber: string;
  title: string;
  type: "SOP" | "Work Instruction" | "Form" | "Policy" | "Specification";
  version: string;
  owner: string;
  lastReviewed: string;
  nextReview: string;
  status: string;
}

export interface SPCDataPoint {
  sampleNumber: number;
  value: number;
  ucl: number;
  lcl: number;
  mean: number;
  date: string;
}

// ========================
// API-hydrated data containers
// ========================

export const qualityInspections: QualityInspection[] = [] as any[];

export const nonConformanceReports: NonConformanceReport[] = [] as any[];

export const capaRecords: CAPARecord[] = [] as any[];

export const qualityStandards: QualityStandard[] = [] as any[];

export const auditRecords: AuditRecord[] = [] as any[];

export const calibrationRecords: CalibrationRecord[] = [] as any[];

export const qualityDocuments: QualityDocument[] = [] as any[];

export const spcData: SPCDataPoint[] = [] as any[];

// ========================
// Aggregated metrics for dashboard
// ========================
export const qualityMetrics = {} as any;

// Monthly quality trends for charts
export const qualityTrends = [] as any[];

export const defectsByCategory = [] as any[];
