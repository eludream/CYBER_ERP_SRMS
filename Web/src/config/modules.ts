import {
  DollarSign, Package, Users, ShoppingCart, Truck, Factory,
  Shield, BarChart3, Lock, LucideIcon,
  BookOpen, FileText, PieChart, Boxes, Warehouse, ClipboardList,
  UserCheck, CreditCard, Target, ShoppingBag, ListOrdered,
  ClipboardCheck, Wrench, Calendar, CheckCircle, AlertTriangle,
  TrendingUp, FileBarChart, Settings, Key, ScrollText, Globe, Landmark,
  Briefcase, Clock, Heart, Receipt, UserPlus, GraduationCap, Star, Building2, MapPin,
  ArrowRightLeft, ScanBarcode, Hash, LayoutGrid, PackageCheck, Timer, Calculator, RefreshCw,
  Layers, Gauge, Cog, GitBranch, Zap, ListChecks, FormInput, Eye, Inbox
} from "lucide-react";
import { ERPModule } from "@/contexts/AuthContext";

export interface SubModule {
  title: string;
  path: string;
  icon: LucideIcon;
}

export interface SubModuleCategory {
  category: string;
  items: SubModule[];
}

export interface ModuleConfig {
  id: ERPModule;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  subModules: SubModule[]; // flat list for routing
  categories: SubModuleCategory[]; // grouped for sidebar display
}

export const modules: ModuleConfig[] = [
  {
    id: "finance",
    title: "Finance",
    description: "General Ledger, Invoicing, Chart of Accounts, Assets, Tax",
    icon: DollarSign,
    color: "text-emerald-400",
    subModules: [
      { title: "Dashboard", path: "/finance/dashboard", icon: PieChart },
      { title: "General Ledger", path: "/finance/ledger", icon: BookOpen },
      { title: "Invoicing", path: "/finance/invoicing", icon: FileText },
      { title: "Chart of Accounts", path: "/finance/chart-of-accounts", icon: PieChart },
      { title: "Accounts Payable", path: "/finance/accounts-payable", icon: CreditCard },
      { title: "Accounts Receivable", path: "/finance/accounts-receivable", icon: DollarSign },
      { title: "Bank Reconciliation", path: "/finance/bank-reconciliation", icon: Landmark },
      { title: "Fixed Assets", path: "/finance/fixed-assets", icon: BookOpen },
      { title: "Cost Centers", path: "/finance/cost-centers", icon: Target },
      { title: "Budget & Forecasting", path: "/finance/budget", icon: Target },
      { title: "Scenario Modeling", path: "/finance/scenarios", icon: TrendingUp },
      { title: "Multi-Currency", path: "/finance/multi-currency", icon: Globe },
      { title: "Tax Management", path: "/finance/tax", icon: FileText },
      { title: "Financial Statements", path: "/finance/statements", icon: FileBarChart },
      { title: "Risk & Compliance", path: "/finance/compliance", icon: Shield },
      { title: "Period-End Close", path: "/finance/period-close", icon: CheckCircle },
      { title: "Operations", path: "/finance/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Overview",
        items: [
          { title: "Dashboard", path: "/finance/dashboard", icon: PieChart },
        ],
      },
      {
        category: "Core Accounting",
        items: [
          { title: "General Ledger", path: "/finance/ledger", icon: BookOpen },
          { title: "Chart of Accounts", path: "/finance/chart-of-accounts", icon: PieChart },
          { title: "Invoicing", path: "/finance/invoicing", icon: FileText },
          { title: "Accounts Payable", path: "/finance/accounts-payable", icon: CreditCard },
          { title: "Accounts Receivable", path: "/finance/accounts-receivable", icon: DollarSign },
          { title: "Bank Reconciliation", path: "/finance/bank-reconciliation", icon: Landmark },
        ],
      },
      {
        category: "Planning & Analysis",
        items: [
          { title: "Budget & Forecasting", path: "/finance/budget", icon: Target },
          { title: "Cost Centers", path: "/finance/cost-centers", icon: Target },
          { title: "Scenario Modeling", path: "/finance/scenarios", icon: TrendingUp },
        ],
      },
      {
        category: "Assets & Tax",
        items: [
          { title: "Fixed Assets", path: "/finance/fixed-assets", icon: BookOpen },
          { title: "Tax Management", path: "/finance/tax", icon: FileText },
          { title: "Multi-Currency", path: "/finance/multi-currency", icon: Globe },
        ],
      },
      {
        category: "Reporting & Control",
        items: [
          { title: "Financial Statements", path: "/finance/statements", icon: FileBarChart },
          { title: "Risk & Compliance", path: "/finance/compliance", icon: Shield },
          { title: "Period-End Close", path: "/finance/period-close", icon: CheckCircle },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/finance/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Stock Tracking, Warehousing, Valuation, Replenishment",
    icon: Package,
    color: "text-blue-400",
    subModules: [
      { title: "Dashboard", path: "/inventory/dashboard", icon: PieChart },
      { title: "Stock Levels", path: "/inventory/stock", icon: Boxes },
      { title: "Item Categories", path: "/inventory/stock", icon: LayoutGrid },
      { title: "Barcode & RFID", path: "/inventory/barcode", icon: ScanBarcode },
      { title: "Batch & Lot Tracking", path: "/inventory/batches", icon: Hash },
      { title: "Reorder Points", path: "/inventory/reorder", icon: AlertTriangle },
      { title: "Demand Forecasting", path: "/inventory/forecasting", icon: TrendingUp },
      { title: "Warehousing", path: "/inventory/warehousing", icon: Warehouse },
      { title: "Bin Management", path: "/inventory/bins", icon: MapPin },
      { title: "Pick, Pack & Ship", path: "/inventory/pick-pack", icon: PackageCheck },
      { title: "Cycle Counting", path: "/inventory/cycle-count", icon: ClipboardCheck },
      { title: "Stock Transfers", path: "/inventory/transfers", icon: ArrowRightLeft },
      { title: "Inventory Valuation", path: "/inventory/valuation", icon: Calculator },
      { title: "Performance KPIs", path: "/inventory/kpis", icon: BarChart3 },
      { title: "Kits & Bundles", path: "/inventory/kits", icon: Package },
      { title: "Shelf-Life Tracking", path: "/inventory/shelf-life", icon: Timer },
      { title: "Operations", path: "/inventory/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Overview",
        items: [
          { title: "Dashboard", path: "/inventory/dashboard", icon: PieChart },
        ],
      },
      {
        category: "Stock Tracking",
        items: [
          { title: "Stock Levels", path: "/inventory/stock", icon: Boxes },
          { title: "Barcode & RFID", path: "/inventory/barcode", icon: ScanBarcode },
          { title: "Batch & Lot Tracking", path: "/inventory/batches", icon: Hash },
        ],
      },
      {
        category: "Optimization",
        items: [
          { title: "Reorder Points", path: "/inventory/reorder", icon: AlertTriangle },
          { title: "Demand Forecasting", path: "/inventory/forecasting", icon: TrendingUp },
        ],
      },
      {
        category: "Warehouse Operations",
        items: [
          { title: "Warehousing", path: "/inventory/warehousing", icon: Warehouse },
          { title: "Bin Management", path: "/inventory/bins", icon: MapPin },
          { title: "Pick, Pack & Ship", path: "/inventory/pick-pack", icon: PackageCheck },
          { title: "Cycle Counting", path: "/inventory/cycle-count", icon: ClipboardCheck },
          { title: "Stock Transfers", path: "/inventory/transfers", icon: ArrowRightLeft },
        ],
      },
      {
        category: "Financial & Analytics",
        items: [
          { title: "Inventory Valuation", path: "/inventory/valuation", icon: Calculator },
          { title: "Performance KPIs", path: "/inventory/kpis", icon: BarChart3 },
        ],
      },
      {
        category: "Advanced Tools",
        items: [
          { title: "Kits & Bundles", path: "/inventory/kits", icon: Package },
          { title: "Shelf-Life Tracking", path: "/inventory/shelf-life", icon: Timer },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/inventory/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "hr",
    title: "Human Resources",
    description: "Hire-to-Retire lifecycle, Payroll, Talent Management",
    icon: Users,
    color: "text-violet-400",
    subModules: [
      { title: "HR Dashboard", path: "/hr/dashboard", icon: PieChart },
      { title: "Employee Directory", path: "/hr/employees", icon: Users },
      { title: "Org Structure", path: "/hr/org-chart", icon: Building2 },
      { title: "Self-Service Portal", path: "/hr/self-service", icon: UserCheck },
      { title: "Attendance", path: "/hr/attendance", icon: MapPin },
      { title: "Leave Management", path: "/hr/leave", icon: Calendar },
      { title: "Shift Scheduling", path: "/hr/shifts", icon: Clock },
      { title: "Payroll", path: "/hr/payroll", icon: CreditCard },
      { title: "Benefits", path: "/hr/benefits", icon: Heart },
      { title: "Expense Claims", path: "/hr/expenses", icon: Receipt },
      { title: "Recruitment (ATS)", path: "/hr/recruitment", icon: UserPlus },
      { title: "Onboarding", path: "/hr/onboarding", icon: Briefcase },
      { title: "Performance", path: "/hr/performance", icon: Star },
      { title: "Learning & Dev", path: "/hr/learning", icon: GraduationCap },
      { title: "HR Analytics", path: "/hr/analytics", icon: TrendingUp },
      { title: "Operations", path: "/hr/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Overview",
        items: [
          { title: "HR Dashboard", path: "/hr/dashboard", icon: PieChart },
        ],
      },
      {
        category: "Core Employee Mgmt",
        items: [
          { title: "Employee Directory", path: "/hr/employees", icon: Users },
          { title: "Org Structure", path: "/hr/org-chart", icon: Building2 },
          { title: "Self-Service Portal", path: "/hr/self-service", icon: UserCheck },
        ],
      },
      {
        category: "Time & Attendance",
        items: [
          { title: "Attendance", path: "/hr/attendance", icon: MapPin },
          { title: "Leave Management", path: "/hr/leave", icon: Calendar },
          { title: "Shift Scheduling", path: "/hr/shifts", icon: Clock },
        ],
      },
      {
        category: "Payroll & Compensation",
        items: [
          { title: "Payroll", path: "/hr/payroll", icon: CreditCard },
          { title: "Benefits", path: "/hr/benefits", icon: Heart },
          { title: "Expense Claims", path: "/hr/expenses", icon: Receipt },
        ],
      },
      {
        category: "Talent Management",
        items: [
          { title: "Recruitment (ATS)", path: "/hr/recruitment", icon: UserPlus },
          { title: "Onboarding", path: "/hr/onboarding", icon: Briefcase },
          { title: "Performance", path: "/hr/performance", icon: Star },
          { title: "Learning & Dev", path: "/hr/learning", icon: GraduationCap },
        ],
      },
      {
        category: "Analytics",
        items: [
          { title: "HR Analytics", path: "/hr/analytics", icon: TrendingUp },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/hr/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "sales",
    title: "Sales",
    description: "CRM, Leads, Quotations, Orders, Shipping, Invoicing, Commissions",
    icon: ShoppingCart,
    color: "text-amber-400",
    subModules: [
      { title: "Dashboard", path: "/sales/dashboard", icon: PieChart },
      { title: "CRM", path: "/sales/crm", icon: Target },
      { title: "Leads & Pipeline", path: "/sales/leads", icon: Users },
      { title: "Quotations", path: "/sales/quotations", icon: ListOrdered },
      { title: "Sales Orders", path: "/sales/orders", icon: ShoppingBag },
      { title: "Credit Control", path: "/sales/credit", icon: Shield },
      { title: "ATP Check", path: "/sales/atp", icon: Boxes },
      { title: "Shipping", path: "/sales/shipping", icon: Truck },
      { title: "Returns (RMA)", path: "/sales/returns", icon: RefreshCw },
      { title: "Invoicing", path: "/sales/invoicing", icon: FileText },
      { title: "Commissions", path: "/sales/commissions", icon: CreditCard },
      { title: "Analytics", path: "/sales/analytics", icon: TrendingUp },
      { title: "Forecasting", path: "/sales/forecasting", icon: BarChart3 },
      { title: "Operations", path: "/sales/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Overview",
        items: [
          { title: "Dashboard", path: "/sales/dashboard", icon: PieChart },
        ],
      },
      {
        category: "Pre-Sales",
        items: [
          { title: "CRM", path: "/sales/crm", icon: Target },
          { title: "Leads & Pipeline", path: "/sales/leads", icon: Users },
          { title: "Quotations", path: "/sales/quotations", icon: ListOrdered },
        ],
      },
      {
        category: "Order Management",
        items: [
          { title: "Sales Orders", path: "/sales/orders", icon: ShoppingBag },
          { title: "Credit Control", path: "/sales/credit", icon: Shield },
          { title: "ATP Check", path: "/sales/atp", icon: Boxes },
        ],
      },
      {
        category: "Fulfillment",
        items: [
          { title: "Shipping", path: "/sales/shipping", icon: Truck },
          { title: "Returns (RMA)", path: "/sales/returns", icon: RefreshCw },
        ],
      },
      {
        category: "Billing & Revenue",
        items: [
          { title: "Invoicing", path: "/sales/invoicing", icon: FileText },
          { title: "Commissions", path: "/sales/commissions", icon: CreditCard },
        ],
      },
      {
        category: "Analytics & Forecasting",
        items: [
          { title: "Analytics", path: "/sales/analytics", icon: TrendingUp },
          { title: "Forecasting", path: "/sales/forecasting", icon: BarChart3 },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/sales/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "procurement",
    title: "Procurement",
    description: "Procure-to-Pay, Supplier Management, Contracts, Spend Analytics",
    icon: Truck,
    color: "text-orange-400",
    subModules: [
      { title: "Dashboard", path: "/procurement/dashboard", icon: PieChart },
      { title: "Requisitions", path: "/procurement/requisitions", icon: FileText },
      { title: "RFQ Management", path: "/procurement/rfq", icon: ListOrdered },
      { title: "Purchase Orders", path: "/procurement/orders", icon: ClipboardCheck },
      { title: "Goods Receipt", path: "/procurement/grn", icon: PackageCheck },
      { title: "3-Way Matching", path: "/procurement/matching", icon: CheckCircle },
      { title: "Suppliers", path: "/procurement/suppliers", icon: Users },
      { title: "Contracts", path: "/procurement/contracts", icon: FileText },
      { title: "Spend Analytics", path: "/procurement/analytics", icon: TrendingUp },
      { title: "Landed Costs", path: "/procurement/landed-cost", icon: Calculator },
      { title: "Operations", path: "/procurement/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Overview",
        items: [
          { title: "Dashboard", path: "/procurement/dashboard", icon: PieChart },
        ],
      },
      {
        category: "Procure-to-Pay",
        items: [
          { title: "Requisitions", path: "/procurement/requisitions", icon: FileText },
          { title: "RFQ Management", path: "/procurement/rfq", icon: ListOrdered },
          { title: "Purchase Orders", path: "/procurement/orders", icon: ClipboardCheck },
          { title: "Goods Receipt", path: "/procurement/grn", icon: PackageCheck },
          { title: "3-Way Matching", path: "/procurement/matching", icon: CheckCircle },
        ],
      },
      {
        category: "Vendor Management",
        items: [
          { title: "Suppliers", path: "/procurement/suppliers", icon: Users },
          { title: "Contracts", path: "/procurement/contracts", icon: FileText },
        ],
      },
      {
        category: "Analytics",
        items: [
          { title: "Spend Analytics", path: "/procurement/analytics", icon: TrendingUp },
          { title: "Landed Costs", path: "/procurement/landed-cost", icon: Calculator },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/procurement/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "production",
    title: "Production",
    description: "BOM, Work Orders, Scheduling, Costing, Quality, Analytics",
    icon: Factory,
    color: "text-cyan-400",
    subModules: [
      { title: "Dashboard", path: "/production/dashboard", icon: PieChart },
      { title: "Bill of Materials", path: "/production/bom", icon: Layers },
      { title: "Work Orders", path: "/production/work-orders", icon: Wrench },
      { title: "Scheduling", path: "/production/scheduling", icon: Calendar },
      { title: "Shop Floor", path: "/production/shop-floor", icon: Factory },
      { title: "WIP Tracking", path: "/production/wip", icon: Clock },
      { title: "Costing", path: "/production/costing", icon: DollarSign },
      { title: "Quality", path: "/production/quality", icon: CheckCircle },
      { title: "Maintenance", path: "/production/maintenance", icon: Cog },
      { title: "Analytics", path: "/production/analytics", icon: TrendingUp },
      { title: "Operations", path: "/production/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Overview",
        items: [
          { title: "Dashboard", path: "/production/dashboard", icon: PieChart },
        ],
      },
      {
        category: "Planning",
        items: [
          { title: "Bill of Materials", path: "/production/bom", icon: Layers },
          { title: "Work Orders", path: "/production/work-orders", icon: Wrench },
          { title: "Scheduling", path: "/production/scheduling", icon: Calendar },
        ],
      },
      {
        category: "Execution",
        items: [
          { title: "Shop Floor", path: "/production/shop-floor", icon: Factory },
          { title: "WIP Tracking", path: "/production/wip", icon: Clock },
        ],
      },
      {
        category: "Cost & Quality",
        items: [
          { title: "Costing", path: "/production/costing", icon: DollarSign },
          { title: "Quality", path: "/production/quality", icon: CheckCircle },
        ],
      },
      {
        category: "Operations",
        items: [
          { title: "Maintenance", path: "/production/maintenance", icon: Cog },
          { title: "Analytics", path: "/production/analytics", icon: TrendingUp },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/production/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "quality",
    title: "Quality Control",
    description: "Inspections, NCRs, CAPA, Audits, SPC, Calibration, Document Control",
    icon: Shield,
    color: "text-green-400",
    subModules: [
      { title: "Dashboard", path: "/quality/dashboard", icon: PieChart },
      { title: "Inspections", path: "/quality/inspections", icon: CheckCircle },
      { title: "Non-Conformances", path: "/quality/ncr", icon: AlertTriangle },
      { title: "CAPA", path: "/quality/capa", icon: Shield },
      { title: "Standards", path: "/quality/standards", icon: ClipboardCheck },
      { title: "Audits", path: "/quality/audits", icon: ClipboardList },
      { title: "Calibration", path: "/quality/calibration", icon: Wrench },
      { title: "Document Control", path: "/quality/documents", icon: FileText },
      { title: "SPC", path: "/quality/spc", icon: TrendingUp },
      { title: "Analytics", path: "/quality/analytics", icon: BarChart3 },
      { title: "Operations", path: "/quality/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Overview",
        items: [
          { title: "Dashboard", path: "/quality/dashboard", icon: PieChart },
        ],
      },
      {
        category: "Quality Assurance",
        items: [
          { title: "Inspections", path: "/quality/inspections", icon: CheckCircle },
          { title: "Standards", path: "/quality/standards", icon: ClipboardCheck },
          { title: "Audits", path: "/quality/audits", icon: ClipboardList },
        ],
      },
      {
        category: "Non-Conformance",
        items: [
          { title: "Non-Conformances", path: "/quality/ncr", icon: AlertTriangle },
          { title: "CAPA", path: "/quality/capa", icon: Shield },
        ],
      },
      {
        category: "Process Control",
        items: [
          { title: "SPC", path: "/quality/spc", icon: TrendingUp },
          { title: "Calibration", path: "/quality/calibration", icon: Wrench },
          { title: "Document Control", path: "/quality/documents", icon: FileText },
        ],
      },
      {
        category: "Analytics",
        items: [
          { title: "Analytics", path: "/quality/analytics", icon: BarChart3 },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/quality/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    description: "Dashboards, Custom Reports, Analytics",
    icon: BarChart3,
    color: "text-pink-400",
    subModules: [
      { title: "Dashboard", path: "/reports/dashboard", icon: BarChart3 },
      { title: "Analytics", path: "/reports/analytics", icon: TrendingUp },
      { title: "Custom Reports", path: "/reports/custom", icon: FileBarChart },
      { title: "Operations", path: "/reports/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Dashboards",
        items: [
          { title: "Dashboard", path: "/reports/dashboard", icon: BarChart3 },
          { title: "Analytics", path: "/reports/analytics", icon: TrendingUp },
        ],
      },
      {
        category: "Custom",
        items: [
          { title: "Custom Reports", path: "/reports/custom", icon: FileBarChart },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/reports/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Security & Admin",
    description: "User Roles, Permissions, System Logs",
    icon: Lock,
    color: "text-red-400",
    subModules: [
      { title: "User Management", path: "/security/users", icon: Users },
      { title: "Roles & Permissions", path: "/security/roles", icon: Key },
      { title: "System Logs", path: "/security/logs", icon: ScrollText },
    ],
    categories: [
      {
        category: "Access Control",
        items: [
          { title: "User Management", path: "/security/users", icon: Users },
          { title: "Roles & Permissions", path: "/security/roles", icon: Key },
        ],
      },
      {
        category: "System Menu",
        items: [
          { title: "System Logs", path: "/security/logs", icon: ScrollText },
        ],
      },
    ],
  },
  {
    id: "workflow",
    title: "Workflow",
    description: "Approval Chains, Task Tracking, Automation Rules, Designer",
    icon: GitBranch,
    color: "text-indigo-400",
    subModules: [
      { title: "Dashboard", path: "/workflow/dashboard", icon: PieChart },
      { title: "Workflow Designer", path: "/workflow/designer", icon: Settings },
      { title: "Approval Chains", path: "/workflow/approvals", icon: GitBranch },
      { title: "Task Tracker", path: "/workflow/tasks", icon: ListChecks },
      { title: "Automation Rules", path: "/workflow/automation", icon: Zap },
      { title: "Operations", path: "/workflow/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Overview",
        items: [
          { title: "Dashboard", path: "/workflow/dashboard", icon: PieChart },
        ],
      },
      {
        category: "Design",
        items: [
          { title: "Workflow Designer", path: "/workflow/designer", icon: Settings },
        ],
      },
      {
        category: "Management",
        items: [
          { title: "Approval Chains", path: "/workflow/approvals", icon: GitBranch },
          { title: "Task Tracker", path: "/workflow/tasks", icon: ListChecks },
          { title: "Automation Rules", path: "/workflow/automation", icon: Zap },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/workflow/operations", icon: ListChecks },
        ],
      },
    ],
  },
  {
    id: "forms",
    title: "Form Designer",
    description: "Build, manage, and deploy dynamic forms across all ERP modules",
    icon: FormInput,
    color: "text-teal-400",
    subModules: [
      { title: "All Forms", path: "/forms", icon: FormInput },
      { title: "Operations", path: "/forms/operations", icon: ListChecks },
    ],
    categories: [
      {
        category: "Management",
        items: [
          { title: "All Forms", path: "/forms", icon: FormInput },
        ],
      },
      {
        category: "Setup",
        items: [
          { title: "Operations", path: "/forms/operations", icon: ListChecks },
        ],
      },
    ],
  },
];

const hiddenModuleIds = new Set(["workflow", "forms"]);

export const visibleModules = modules.filter(module => !hiddenModuleIds.has(module.id));
