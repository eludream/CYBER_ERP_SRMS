import { createContext, useContext, useState, useCallback, ReactNode } from "react";

// ========================
// Cross-Module ERP Store
// Manages notifications, approvals, and module event bus
// ========================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  module: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ApprovalRequest {
  id: string;
  type: "journal_entry" | "purchase_requisition" | "leave_request" | "expense_claim" | "sales_order" | "ncr_disposition";
  title: string;
  description: string;
  amount?: number;
  requestedBy: string;
  requestedDate: string;
  module: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Pending" | "Approved" | "Rejected";
  data?: Record<string, unknown>;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  module: string;
  user: string;
  timestamp: string;
  details: string;
  entityType: string;
  entityId: string;
}

interface ERPContextType {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearNotification: (id: string) => void;
  
  // Approvals
  approvals: ApprovalRequest[];
  pendingApprovalCount: number;
  addApproval: (a: Omit<ApprovalRequest, "id" | "status">) => void;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  
  // Activity Log
  activityLog: ActivityLogEntry[];
  logActivity: (entry: Omit<ActivityLogEntry, "id" | "timestamp">) => void;
  
  // Cross-module helpers
  getModuleAlerts: (module: string) => Notification[];
  getModuleApprovals: (module: string) => ApprovalRequest[];
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Seed notifications
const seedNotifications: Notification[] = [
  { id: "n1", title: "Invoice Overdue", message: "Global Systems Ltd invoice INV-2403 ($451,500) is 22 days overdue", type: "error", module: "finance", timestamp: "2026-03-08T09:00:00", read: false, actionUrl: "/finance/accounts-receivable", actionLabel: "View AR" },
  { id: "n2", title: "PO Goods Received", message: "GRN-7004 received for PO-1892 from Steel Supplies Co — pending quality inspection", type: "info", module: "procurement", timestamp: "2026-03-08T08:30:00", read: false, actionUrl: "/procurement/goods-receipt", actionLabel: "View GRN" },
  { id: "n3", title: "Critical Stock Alert", message: "Hydraulic Seal Kit (SP-041) at 3 units — below safety stock of 5", type: "warning", module: "inventory", timestamp: "2026-03-08T08:00:00", read: false, actionUrl: "/inventory/reorder-points", actionLabel: "Reorder" },
  { id: "n4", title: "Work Order On Hold", message: "WO-5623 (Module C7) placed on hold — quality inspection failed with 20% defect rate", type: "error", module: "production", timestamp: "2026-03-08T07:45:00", read: false, actionUrl: "/production/work-orders", actionLabel: "View WO" },
  { id: "n5", title: "Leave Request Pending", message: "Adaeze Okonkwo requested 5 days annual leave (Mar 15-20)", type: "info", module: "hr", timestamp: "2026-03-08T07:30:00", read: false, actionUrl: "/hr/leave", actionLabel: "Review" },
  { id: "n6", title: "NCR Opened", message: "NCR-201: Critical dimensional deviation on Component B12 from batch B-2026-045", type: "warning", module: "quality", timestamp: "2026-03-08T07:15:00", read: false, actionUrl: "/quality/ncr", actionLabel: "View NCR" },
  { id: "n7", title: "Contract Expiring", message: "LogiTech Parts framework contract CTR-002 expires in 84 days", type: "warning", module: "procurement", timestamp: "2026-03-07T16:00:00", read: true, actionUrl: "/procurement/contracts", actionLabel: "Renew" },
  { id: "n8", title: "Sales Order Credit Hold", message: "SO-4523 for Acme Corp on credit hold — available credit $4,640", type: "warning", module: "sales", timestamp: "2026-03-07T15:00:00", read: true, actionUrl: "/sales/orders", actionLabel: "Review" },
];

const seedApprovals: ApprovalRequest[] = [
  { id: "a1", type: "journal_entry", title: "Monthly Depreciation — March", description: "Depreciation run for all fixed assets, Doc #1000000004", amount: 42500, requestedBy: "System", requestedDate: "2026-03-06", module: "finance", priority: "Medium", status: "Pending" },
  { id: "a2", type: "journal_entry", title: "Accrued Interest Revenue", description: "Year-end accrual adjustment, Doc #1000000005", amount: 12500, requestedBy: "Chidi Nnamdi", requestedDate: "2026-03-05", module: "finance", priority: "Low", status: "Pending" },
  { id: "a3", type: "purchase_requisition", title: "IT Server Rack Units", description: "PR-2402: 2x Server Rack Units for IT department", amount: 17000, requestedBy: "Emily Zhang", requestedDate: "2026-03-05", module: "procurement", priority: "Medium", status: "Pending" },
  { id: "a4", type: "leave_request", title: "Annual Leave — Adaeze Okonkwo", description: "5 days annual leave, March 15-20, 2026", requestedBy: "Adaeze Okonkwo", requestedDate: "2026-03-08", module: "hr", priority: "Low", status: "Pending" },
  { id: "a5", type: "expense_claim", title: "AWS Certification Exam", description: "EX-002: AWS certification exam fee for Adaeze Okonkwo", amount: 450, requestedBy: "Adaeze Okonkwo", requestedDate: "2026-03-05", module: "hr", priority: "Low", status: "Pending" },
  { id: "a6", type: "ncr_disposition", title: "NCR-200 Disposition", description: "Surface finish defect on Housing D4 — proposed rework", requestedBy: "Emeka Udo", requestedDate: "2026-03-07", module: "quality", priority: "High", status: "Pending" },
];

const seedActivityLog: ActivityLogEntry[] = [
  { id: "al1", action: "Created", module: "sales", user: "Admin User", timestamp: "2026-03-08T09:15:00", details: "Sales Order SO-4525 created for Nexus Group ($72,900)", entityType: "SalesOrder", entityId: "SO-4525" },
  { id: "al2", action: "Approved", module: "procurement", user: "Sarah Chen", timestamp: "2026-03-06T14:00:00", details: "Purchase Requisition PR-2404 approved (Chemical Reagent X-42)", entityType: "PurchaseRequisition", entityId: "PR-2404" },
  { id: "al3", action: "Posted", module: "finance", user: "Admin User", timestamp: "2026-03-08T08:00:00", details: "Journal Entry Doc #1000000001 posted — Customer Payment $150,000", entityType: "JournalEntry", entityId: "JE001" },
  { id: "al4", action: "Received", module: "procurement", user: "John Obi", timestamp: "2026-03-09T10:00:00", details: "Goods Receipt GRN-7002 for PO-1891 (8 of 12 items)", entityType: "GoodsReceipt", entityId: "GR002" },
  { id: "al5", action: "Completed", module: "production", user: "Team Alpha", timestamp: "2026-03-05T22:00:00", details: "Work Order WO-5618 completed — 800 units Housing D4", entityType: "WorkOrder", entityId: "WO-5618" },
];

export const ERPProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(seedApprovals);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(seedActivityLog);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingApprovalCount = approvals.filter(a => a.status === "Pending").length;

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    setNotifications(prev => [{
      ...n, id: generateId(), timestamp: new Date().toISOString(), read: false
    }, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addApproval = useCallback((a: Omit<ApprovalRequest, "id" | "status">) => {
    setApprovals(prev => [{ ...a, id: generateId(), status: "Pending" }, ...prev]);
    addNotification({
      title: `Approval Required: ${a.title}`,
      message: a.description,
      type: "info",
      module: a.module,
      actionLabel: "Review",
    });
  }, [addNotification]);

  const approveRequest = useCallback((id: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "Approved" } : a));
    const approval = approvals.find(a => a.id === id);
    if (approval) {
      addNotification({
        title: `Approved: ${approval.title}`,
        message: `${approval.title} has been approved`,
        type: "success",
        module: approval.module,
      });
      logActivity({
        action: "Approved",
        module: approval.module,
        user: "Admin User",
        details: `Approved: ${approval.title}`,
        entityType: approval.type,
        entityId: id,
      });
    }
  }, [approvals]);

  const rejectRequest = useCallback((id: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: "Rejected" } : a));
    const approval = approvals.find(a => a.id === id);
    if (approval) {
      addNotification({
        title: `Rejected: ${approval.title}`,
        message: `${approval.title} has been rejected`,
        type: "error",
        module: approval.module,
      });
    }
  }, [approvals]);

  const logActivity = useCallback((entry: Omit<ActivityLogEntry, "id" | "timestamp">) => {
    setActivityLog(prev => [{
      ...entry, id: generateId(), timestamp: new Date().toISOString()
    }, ...prev]);
  }, []);

  const getModuleAlerts = useCallback((module: string) => {
    return notifications.filter(n => n.module === module && !n.read);
  }, [notifications]);

  const getModuleApprovals = useCallback((module: string) => {
    return approvals.filter(a => a.module === module && a.status === "Pending");
  }, [approvals]);

  return (
    <ERPContext.Provider value={{
      notifications, unreadCount, addNotification, markAsRead, markAllRead, clearNotification,
      approvals, pendingApprovalCount, addApproval, approveRequest, rejectRequest,
      activityLog, logActivity,
      getModuleAlerts, getModuleApprovals,
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const ctx = useContext(ERPContext);
  if (!ctx) throw new Error("useERP must be used within ERPProvider");
  return ctx;
};
