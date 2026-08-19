// ========================
// Document Type Registry — maps module document types to custom forms
// ========================

import type { LucideIcon } from "lucide-react";
import {
  FileText, ClipboardCheck, PackageCheck, Users, UserPlus, Receipt,
  Truck, ShoppingBag, ListOrdered, Wrench, AlertTriangle, CheckCircle,
  BookOpen, CreditCard, Shield, Calendar, Boxes, Hash,
} from "lucide-react";

export interface DocumentType {
  id: string;
  module: string;
  entity: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** The form schema ID currently assigned to this document type (null = use default) */
  assignedFormId: string | null;
  /** Whether this document type supports custom forms */
  customizable: boolean;
  /** Number prefix for auto-generated document numbers */
  numberPrefix: string;
  /** Route where "New" documents should be created */
  createRoute: string;
  /** The module list page where this document type lives */
  listRoute: string;
}

// ── Registry of all document types across modules ───────────

export const documentTypeRegistry: DocumentType[] = [
  // ── Finance ────────────────────────────────────────────────
  {
    id: "dt-journal-entry",
    module: "finance",
    entity: "journal_entry",
    label: "Journal Entry",
    description: "General ledger journal entry",
    icon: BookOpen,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "JE",
    createRoute: "/documents/new/finance/journal_entry",
    listRoute: "/finance/ledger",
  },
  {
    id: "dt-invoice",
    module: "finance",
    entity: "invoice",
    label: "Invoice",
    description: "Customer or vendor invoice",
    icon: FileText,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "INV",
    createRoute: "/documents/new/finance/invoice",
    listRoute: "/finance/invoicing",
  },
  {
    id: "dt-payment-voucher",
    module: "finance",
    entity: "payment_voucher",
    label: "Payment Voucher",
    description: "Outgoing payment authorization",
    icon: CreditCard,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "PV",
    createRoute: "/documents/new/finance/payment_voucher",
    listRoute: "/finance/accounts-payable",
  },

  // ── Procurement ────────────────────────────────────────────
  {
    id: "dt-requisition",
    module: "procurement",
    entity: "requisition",
    label: "Purchase Requisition",
    description: "Internal purchase request",
    icon: ClipboardCheck,
    assignedFormId: "form-001", // Pre-assigned to our mock form
    customizable: true,
    numberPrefix: "PR",
    createRoute: "/documents/new/procurement/requisition",
    listRoute: "/procurement/requisitions",
  },
  {
    id: "dt-purchase-order",
    module: "procurement",
    entity: "purchase_order",
    label: "Purchase Order",
    description: "Order to supplier",
    icon: FileText,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "PO",
    createRoute: "/documents/new/procurement/purchase_order",
    listRoute: "/procurement/orders",
  },
  {
    id: "dt-goods-receipt",
    module: "procurement",
    entity: "goods_receipt",
    label: "Goods Receipt Note",
    description: "Record of received goods",
    icon: PackageCheck,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "GRN",
    createRoute: "/documents/new/procurement/goods_receipt",
    listRoute: "/procurement/grn",
  },
  {
    id: "dt-supplier-registration",
    module: "procurement",
    entity: "supplier",
    label: "Vendor Registration",
    description: "New supplier/vendor KYC form",
    icon: Truck,
    assignedFormId: "form-005",
    customizable: true,
    numberPrefix: "VR",
    createRoute: "/documents/new/procurement/supplier",
    listRoute: "/procurement/suppliers",
  },

  // ── HR ─────────────────────────────────────────────────────
  {
    id: "dt-employee-onboarding",
    module: "hr",
    entity: "employee",
    label: "Employee Onboarding",
    description: "New hire data collection",
    icon: UserPlus,
    assignedFormId: "form-002",
    customizable: true,
    numberPrefix: "ONB",
    createRoute: "/documents/new/hr/employee",
    listRoute: "/hr/onboarding",
  },
  {
    id: "dt-leave-request",
    module: "hr",
    entity: "leave_request",
    label: "Leave Request",
    description: "Employee leave application",
    icon: Calendar,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "LR",
    createRoute: "/documents/new/hr/leave_request",
    listRoute: "/hr/leave",
  },
  {
    id: "dt-expense-claim",
    module: "hr",
    entity: "expense",
    label: "Expense Claim",
    description: "Employee expense reimbursement",
    icon: Receipt,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "EC",
    createRoute: "/documents/new/hr/expense",
    listRoute: "/hr/expenses",
  },

  // ── Sales ──────────────────────────────────────────────────
  {
    id: "dt-quotation",
    module: "sales",
    entity: "quotation",
    label: "Sales Quotation",
    description: "Price quote to customer",
    icon: ListOrdered,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "QT",
    createRoute: "/documents/new/sales/quotation",
    listRoute: "/sales/quotations",
  },
  {
    id: "dt-sales-order",
    module: "sales",
    entity: "sales_order",
    label: "Sales Order",
    description: "Customer order",
    icon: ShoppingBag,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "SO",
    createRoute: "/documents/new/sales/sales_order",
    listRoute: "/sales/orders",
  },

  // ── Production ─────────────────────────────────────────────
  {
    id: "dt-work-order",
    module: "production",
    entity: "work_order",
    label: "Work Order",
    description: "Production work order",
    icon: Wrench,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "WO",
    createRoute: "/documents/new/production/work_order",
    listRoute: "/production/work-orders",
  },

  // ── Quality ────────────────────────────────────────────────
  {
    id: "dt-inspection",
    module: "quality",
    entity: "inspection",
    label: "Quality Inspection",
    description: "QC inspection report",
    icon: CheckCircle,
    assignedFormId: "form-003",
    customizable: true,
    numberPrefix: "QI",
    createRoute: "/documents/new/quality/inspection",
    listRoute: "/quality/inspections",
  },
  {
    id: "dt-ncr",
    module: "quality",
    entity: "ncr",
    label: "Non-Conformance Report",
    description: "NCR documentation",
    icon: AlertTriangle,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "NCR",
    createRoute: "/documents/new/quality/ncr",
    listRoute: "/quality/ncr",
  },

  // ── Inventory ──────────────────────────────────────────────
  {
    id: "dt-stock-transfer",
    module: "inventory",
    entity: "stock_transfer",
    label: "Stock Transfer",
    description: "Inter-warehouse transfer",
    icon: Boxes,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "ST",
    createRoute: "/documents/new/inventory/stock_transfer",
    listRoute: "/inventory/transfers",
  },
  {
    id: "dt-cycle-count",
    module: "inventory",
    entity: "cycle_count",
    label: "Cycle Count",
    description: "Inventory count sheet",
    icon: Hash,
    assignedFormId: null,
    customizable: true,
    numberPrefix: "CC",
    createRoute: "/documents/new/inventory/cycle_count",
    listRoute: "/inventory/cycle-count",
  },
];

// ── Helper functions ────────────────────────────────────────

/** Get all document types for a given module */
export function getDocumentTypesForModule(module: string): DocumentType[] {
  return documentTypeRegistry.filter(dt => dt.module === module);
}

/** Get a document type by module + entity */
export function getDocumentType(module: string, entity: string): DocumentType | undefined {
  return documentTypeRegistry.find(dt => dt.module === module && dt.entity === entity);
}

/** Get a document type by its ID */
export function getDocumentTypeById(id: string): DocumentType | undefined {
  return documentTypeRegistry.find(dt => dt.id === id);
}

/** Get the assigned form ID for a module/entity combo */
export function getAssignedFormId(module: string, entity: string): string | null {
  return getDocumentType(module, entity)?.assignedFormId ?? null;
}

/** Assign a form to a document type (in-memory; production = API call) */
export function assignFormToDocumentType(documentTypeId: string, formId: string | null): void {
  const dt = documentTypeRegistry.find(d => d.id === documentTypeId);
  if (dt) dt.assignedFormId = formId;
}

/** Get all document types that have a form assigned */
export function getDocumentTypesWithForms(): DocumentType[] {
  return documentTypeRegistry.filter(dt => dt.assignedFormId !== null);
}

/** Get all modules that have document types */
export function getModulesWithDocumentTypes(): string[] {
  return [...new Set(documentTypeRegistry.map(dt => dt.module))];
}
