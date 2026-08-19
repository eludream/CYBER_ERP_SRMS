// ========================
// Production Module — Interfaces & API-hydrated Data
// ========================

export interface BOMItem {
  id: string;
  component: string;
  sku: string;
  qty: number;
  uom: string;
  unitCost: number;
  totalCost: number;
  leadTime: number; // days
  supplier: string;
  level: number; // BOM hierarchy level
}

export interface BillOfMaterials {
  id: string;
  bomNumber: string;
  product: string;
  productSku: string;
  version: string;
  items: BOMItem[];
  totalMaterialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  yield: number; // percentage
  status: "Active" | "Draft" | "Obsolete" | "Under Review";
  effectiveDate: string;
  lastUpdated: string;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  product: string;
  bomRef: string;
  qty: number;
  completedQty: number;
  scrapQty: number;
  productionLine: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  assignedTo: string;
  status: "Planned" | "Released" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
}

export interface ProductionSchedule {
  id: string;
  scheduleId: string;
  workOrderRef: string;
  product: string;
  line: string;
  shift: "Morning" | "Afternoon" | "Night";
  date: string;
  startTime: string;
  endTime: string;
  plannedQty: number;
  capacity: number;
  utilization: number;
  status: "Scheduled" | "Running" | "Completed" | "Delayed" | "Idle";
}

export interface ProductionLine {
  id: string;
  name: string;
  type: string;
  capacity: number;
  currentLoad: number;
  utilization: number;
  efficiency: number;
  status: "Running" | "Idle" | "Maintenance" | "Down";
  currentProduct?: string;
  nextMaintenance: string;
}

export interface ProductionCost {
  id: string;
  woRef: string;
  product: string;
  plannedMaterial: number;
  actualMaterial: number;
  plannedLabor: number;
  actualLabor: number;
  plannedOverhead: number;
  actualOverhead: number;
  plannedTotal: number;
  actualTotal: number;
  variance: number;
  variancePct: number;
  unitCost: number;
}

export interface QualityCheck {
  id: string;
  checkNumber: string;
  woRef: string;
  product: string;
  inspectionType: "In-Process" | "Final" | "Incoming" | "Random";
  sampleSize: number;
  passCount: number;
  failCount: number;
  defectRate: number;
  inspector: string;
  result: "Pass" | "Fail" | "Conditional" | "Pending";
  date: string;
}

export interface MaintenanceRecord {
  id: string;
  ticketNumber: string;
  equipment: string;
  line: string;
  type: "Preventive" | "Corrective" | "Predictive";
  priority: "Low" | "Medium" | "High" | "Emergency";
  scheduledDate: string;
  completedDate?: string;
  downtime: number; // hours
  cost: number;
  technician: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Overdue";
}

export interface WIPRecord {
  id: string;
  woRef: string;
  product: string;
  stage: string;
  qtyInStage: number;
  materialValue: number;
  laborValue: number;
  totalWIPValue: number;
  hoursInStage: number;
}

// ========================
// API-hydrated data containers
// ========================

export const billsOfMaterials: BillOfMaterials[] = [] as any[];

export const workOrders: WorkOrder[] = [] as any[];

export const productionSchedules: ProductionSchedule[] = [] as any[];

export const productionLines: ProductionLine[] = [] as any[];

export const productionCosts: ProductionCost[] = [] as any[];

export const qualityChecks: QualityCheck[] = [] as any[];

export const maintenanceRecords: MaintenanceRecord[] = [] as any[];

export const wipRecords: WIPRecord[] = [] as any[];

export const monthlyOutputData = [] as any[];

export const defectTrendData = [] as any[];
