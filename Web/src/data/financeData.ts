export interface JournalEntry {
  id: string;
  date: string;
  documentNo: string;
  reference: string;
  description: string;
  postingKey: string;
  account: string;
  accountName: string;
  costCenter?: string;
  debit: number;
  credit: number;
  currency: string;
  status: "Posted" | "Pending" | "Draft" | "Reversed" | "Parked";
  createdBy: string;
  fiscalYear: number;
  period: number;
  companyCode: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  type: "Customer" | "Vendor" | "Credit Note" | "Debit Note";
  party: string;
  partyId: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balance: number;
  currency: string;
  status: "Draft" | "Sent" | "Paid" | "Partial" | "Overdue" | "Cancelled" | "Void";
  paymentTerms: string;
  notes?: string;
  poReference?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  glAccount: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Account {
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  category: string;
  subCategory?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  isReconcilable: boolean;
  parent?: string;
  level: number;
}

export interface PayableEntry {
  id: string;
  vendorId: string;
  vendorName: string;
  invoiceNo: string;
  poReference: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paid: number;
  balance: number;
  currency: string;
  status: "Open" | "Partial" | "Paid" | "Overdue" | "Disputed" | "On Hold";
  paymentMethod?: string;
  approvalStatus: "Pending" | "Approved" | "Rejected";
}

export interface ReceivableEntry {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNo: string;
  soReference: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  received: number;
  balance: number;
  currency: string;
  status: "Open" | "Partial" | "Paid" | "Overdue" | "Written Off";
  creditLimit: number;
  creditUsed: number;
}

export interface BankTransaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  bankAccount: string;
  debit: number;
  credit: number;
  balance: number;
  matched: boolean;
  matchedTo?: string;
  status: "Matched" | "Unmatched" | "Partial" | "Excluded";
}

export interface FixedAsset {
  id: string;
  assetNo: string;
  name: string;
  category: string;
  location: string;
  acquisitionDate: string;
  acquisitionCost: number;
  currentValue: number;
  accumulatedDepreciation: number;
  depreciationMethod: string;
  usefulLife: number;
  salvageValue: number;
  status: "Active" | "Disposed" | "Fully Depreciated" | "Under Maintenance";
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  department: string;
  manager: string;
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
  status: "Active" | "Inactive" | "Closed";
}

export interface BudgetLine {
  id: string;
  code: string;
  category: string;
  department: string;
  annualBudget: number;
  q1Budget: number;
  q2Budget: number;
  q3Budget: number;
  q4Budget: number;
  ytdActual: number;
  ytdVariance: number;
  commitments: number;
  available: number;
  status: "On Track" | "Over Budget" | "Under Budget" | "At Risk";
}

export interface TaxEntry {
  id: string;
  period: string;
  taxType: string;
  taxCode: string;
  baseAmount: number;
  taxAmount: number;
  status: "Filed" | "Pending" | "Overdue" | "Draft";
  dueDate: string;
  filingDate?: string;
}

// Sample data generators
export const sampleJournalEntries: JournalEntry[] = [] as any[];

export const sampleInvoices: Invoice[] = [] as any[];

export const sampleAccounts: Account[] = [] as any[];

export const samplePayables: PayableEntry[] = [] as any[];

export const sampleReceivables: ReceivableEntry[] = [] as any[];

export const sampleBankTransactions: BankTransaction[] = [] as any[];

export const sampleFixedAssets: FixedAsset[] = [] as any[];

export const sampleCostCenters: CostCenter[] = [] as any[];

export const sampleBudgetLines: BudgetLine[] = [] as any[];

export const sampleTaxEntries: TaxEntry[] = [] as any[];
