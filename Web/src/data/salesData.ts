// ========================
// Sales Module — Interfaces & API-hydrated Data
// ========================

export interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  source: "Website" | "Referral" | "Trade Show" | "Cold Call" | "LinkedIn";
  stage: "New" | "Contacted" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
  value: number;
  probability: number;
  assignedTo: string;
  nextAction: string;
  nextActionDate: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customer: string;
  contact: string;
  items: QuoteLineItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: string;
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted";
  terms: string;
  createdAt: string;
}

export interface QuoteLineItem {
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customer: string;
  contact: string;
  quoteRef?: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  creditStatus: "Approved" | "On Hold" | "Exceeded";
  fulfillmentStatus: "Pending" | "Partial" | "Shipped" | "Delivered";
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  orderDate: string;
  promisedDate: string;
  status: "Open" | "Processing" | "Completed" | "Cancelled";
}

export interface CustomerCredit {
  customerId: string;
  company: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  paymentTerms: string;
  avgDaysToPay: number;
  riskRating: "Low" | "Medium" | "High";
  lastPaymentDate: string;
}

export interface ATPRecord {
  sku: string;
  product: string;
  onHand: number;
  allocated: number;
  incoming: number;
  available: number;
  nextReplenishment: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  orderRef: string;
  customer: string;
  carrier: string;
  trackingNumber: string;
  items: number;
  weight: string;
  scheduledDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  status: "Scheduled" | "Picking" | "Packed" | "Shipped" | "Delivered";
}

export interface ReturnRequest {
  id: string;
  rmaNumber: string;
  orderRef: string;
  customer: string;
  reason: "Defective" | "Wrong Item" | "Damaged" | "Not as Described" | "Changed Mind";
  items: number;
  value: number;
  resolution: "Refund" | "Replacement" | "Credit Note" | "Pending";
  status: "Requested" | "Approved" | "Received" | "Inspected" | "Resolved" | "Rejected";
  createdAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  orderRef: string;
  customer: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: string;
  paidAmount: number;
  status: "Draft" | "Sent" | "Partial" | "Paid" | "Overdue" | "Void";
  issuedDate: string;
}

export interface Commission {
  id: string;
  salesRep: string;
  period: string;
  totalSales: number;
  commissionRate: number;
  commissionAmount: number;
  adjustments: number;
  netCommission: number;
  status: "Calculated" | "Approved" | "Paid";
}

// ========================
// API-hydrated data containers
// ========================

export const leads: Lead[] = [] as any[];

export const quotations: Quotation[] = [] as any[];

export const salesOrders: SalesOrder[] = [] as any[];

export const customerCredits: CustomerCredit[] = [] as any[];

export const atpRecords: ATPRecord[] = [] as any[];

export const shipments: Shipment[] = [] as any[];

export const returnRequests: ReturnRequest[] = [] as any[];

export const salesInvoices: SalesInvoice[] = [] as any[];

export const commissions: Commission[] = [] as any[];

export const monthlySalesData = [] as any[];

export const pipelineByStage = [] as any[];
