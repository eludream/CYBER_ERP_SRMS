// ===== Interfaces =====

export interface InventoryItem {
  sku: string;
  name: string;
  category: "Raw Materials" | "WIP" | "Finished Goods" | "Spare Parts" | "Consumables";
  qty: number;
  unit: string;
  reorderLevel: number;
  safetyStock: number;
  unitCost: number;
  warehouse: string;
  bin: string;
  serialTracking: boolean;
  lotTracking: boolean;
  status: "In Stock" | "Low Stock" | "Critical" | "Out of Stock";
  lastReceived: string;
  barcode: string;
}

export interface WarehouseLocation {
  id: string;
  name: string;
  address: string;
  totalCapacity: number;
  usedCapacity: number;
  zones: number;
  bins: number;
  manager: string;
  status: "Active" | "Maintenance" | "Inactive";
}

export interface StockTransfer {
  id: string;
  from: string;
  to: string;
  items: number;
  totalValue: number;
  requestedBy: string;
  date: string;
  eta: string;
  status: "Pending" | "In Transit" | "Completed" | "Cancelled";
}

export interface ReorderAlert {
  sku: string;
  name: string;
  currentQty: number;
  reorderLevel: number;
  safetyStock: number;
  suggestedOrder: number;
  supplier: string;
  leadTime: string;
  priority: "High" | "Medium" | "Low";
}

export interface CycleCount {
  id: string;
  warehouse: string;
  zone: string;
  scheduledDate: string;
  countedBy: string;
  itemsCounted: number;
  discrepancies: number;
  accuracy: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Reviewed";
}

export interface PickOrder {
  id: string;
  orderRef: string;
  customer: string;
  items: number;
  picker: string;
  zone: string;
  startedAt: string;
  completedAt: string | null;
  status: "Queued" | "Picking" | "Packing" | "Shipped" | "Completed";
}

export interface BatchLot {
  lotNumber: string;
  sku: string;
  product: string;
  quantity: number;
  manufacturedDate: string;
  expiryDate: string | null;
  supplier: string;
  status: "Active" | "Quarantine" | "Expired" | "Recalled";
}

export interface KitBundle {
  kitId: string;
  name: string;
  components: { sku: string; name: string; qty: number }[];
  totalCost: number;
  sellPrice: number;
  available: number;
  status: "Active" | "Discontinued";
}

export interface ValuationRecord {
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
  totalValue: number;
  method: "FIFO" | "LIFO" | "Weighted Average";
  lastUpdated: string;
}

export interface DemandForecast {
  sku: string;
  product: string;
  currentStock: number;
  avgMonthlySales: number;
  projectedDemand: number;
  stockoutRisk: "High" | "Medium" | "Low";
  recommendedOrder: number;
}

// ===== API-hydrated data containers =====

export const inventoryItems: InventoryItem[] = [] as any[];

export const warehouses: WarehouseLocation[] = [] as any[];

export const stockTransfers: StockTransfer[] = [] as any[];

export const reorderAlerts: ReorderAlert[] = [] as any[];

export const cycleCounts: CycleCount[] = [] as any[];

export const pickOrders: PickOrder[] = [] as any[];

export const batchLots: BatchLot[] = [] as any[];

export const kitBundles: KitBundle[] = [] as any[];

export const valuationRecords: ValuationRecord[] = [] as any[];

export const demandForecasts: DemandForecast[] = [] as any[];

// ===== KPIs =====
export const inventoryKPIs = {} as any;

// Monthly trend data for charts
export const inventoryTrends = [] as any[];
