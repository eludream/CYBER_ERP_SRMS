// ========================
// Procurement Module — Interfaces & API-hydrated Data
// ========================

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  requestedBy: string;
  department: string;
  items: PRLineItem[];
  totalEstimate: number;
  priority: "Low" | "Medium" | "High" | "Urgent";
  approver: string;
  status: "Draft" | "Submitted" | "Approved" | "Rejected" | "Converted";
  createdAt: string;
  requiredBy: string;
}

export interface PRLineItem {
  description: string;
  qty: number;
  estimatedPrice: number;
  total: number;
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  title: string;
  category: string;
  vendors: string[];
  responsesReceived: number;
  deadline: string;
  bestBid?: number;
  status: "Open" | "Closed" | "Awarded" | "Cancelled";
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  prRef?: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  expectedDelivery: string;
  receivedQty: number;
  totalQty: number;
  matchStatus: "Pending" | "2-Way Match" | "3-Way Match" | "Mismatch";
  status: "Draft" | "Sent" | "Acknowledged" | "Partial" | "Received" | "Closed" | "Cancelled";
  createdAt: string;
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  poRef: string;
  supplier: string;
  receivedDate: string;
  receivedBy: string;
  totalItems: number;
  acceptedItems: number;
  rejectedItems: number;
  discrepancies: string;
  status: "Pending Inspection" | "Accepted" | "Partial Accept" | "Rejected";
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentTerms: string;
  taxId: string;
  rating: number;
  onTimeDelivery: number;
  qualityScore: number;
  costAccuracy: number;
  totalOrders: number;
  totalSpend: number;
  status: "Active" | "Inactive" | "Blocked" | "Pending Review";
  contractExpiry?: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  supplier: string;
  type: "Fixed Price" | "Blanket" | "Framework" | "Service Level";
  value: number;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  daysToExpiry: number;
  status: "Active" | "Expiring Soon" | "Expired" | "Draft" | "Terminated";
}

export interface ThreeWayMatch {
  id: string;
  poNumber: string;
  grnNumber: string;
  invoiceNumber: string;
  supplier: string;
  poAmount: number;
  grnAmount: number;
  invoiceAmount: number;
  variance: number;
  matchResult: "Full Match" | "Partial Match" | "Mismatch" | "Pending";
}

export interface SpendRecord {
  category: string;
  department: string;
  vendor: string;
  amount: number;
  month: string;
}

// ========================
// API-hydrated data containers
// ========================

export const purchaseRequisitions: PurchaseRequisition[] = [] as any[];

export const rfqs: RFQ[] = [] as any[];

export const purchaseOrders: PurchaseOrder[] = [] as any[];

export const goodsReceipts: GoodsReceipt[] = [] as any[];

export const suppliers: Supplier[] = [] as any[];

export const contracts: Contract[] = [] as any[];

export const threeWayMatches: ThreeWayMatch[] = [] as any[];

export const monthlySpendData = [] as any[];

export const spendByCategory = [] as any[];

export const landedCostExamples = [] as any[];
