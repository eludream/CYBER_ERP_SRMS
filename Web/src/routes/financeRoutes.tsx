import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const FinanceDashboard = lazy(() => import("@/pages/finance/FinanceDashboard"));
const GeneralLedger = lazy(() => import("@/pages/finance/GeneralLedger"));
const Invoicing = lazy(() => import("@/pages/finance/Invoicing"));
const ChartOfAccounts = lazy(() => import("@/pages/finance/ChartOfAccounts"));
const AccountsPayable = lazy(() => import("@/pages/finance/AccountsPayable"));
const AccountsReceivable = lazy(() => import("@/pages/finance/AccountsReceivable"));
const BankReconciliation = lazy(() => import("@/pages/finance/BankReconciliation"));
const FixedAssets = lazy(() => import("@/pages/finance/FixedAssets"));
const CostCenters = lazy(() => import("@/pages/finance/CostCenters"));
const BudgetManagement = lazy(() => import("@/pages/finance/BudgetManagement"));
const TaxManagement = lazy(() => import("@/pages/finance/TaxManagement"));
const FinancialStatements = lazy(() => import("@/pages/finance/FinancialStatements"));
const ScenarioModeling = lazy(() => import("@/pages/finance/ScenarioModeling"));
const MultiCurrency = lazy(() => import("@/pages/finance/MultiCurrency"));
const RiskCompliance = lazy(() => import("@/pages/finance/RiskCompliance"));
const PeriodEndClose = lazy(() => import("@/pages/finance/PeriodEndClose"));

export const financeRoutes: RouteObject[] = [
  { path: "/finance/dashboard", element: <FinanceDashboard /> },
  { path: "/finance/ledger", element: <GeneralLedger /> },
  { path: "/finance/invoicing", element: <Invoicing /> },
  { path: "/finance/chart-of-accounts", element: <ChartOfAccounts /> },
  { path: "/finance/accounts-payable", element: <AccountsPayable /> },
  { path: "/finance/accounts-receivable", element: <AccountsReceivable /> },
  { path: "/finance/bank-reconciliation", element: <BankReconciliation /> },
  { path: "/finance/fixed-assets", element: <FixedAssets /> },
  { path: "/finance/cost-centers", element: <CostCenters /> },
  { path: "/finance/budget", element: <BudgetManagement /> },
  { path: "/finance/tax", element: <TaxManagement /> },
  { path: "/finance/statements", element: <FinancialStatements /> },
  { path: "/finance/scenarios", element: <ScenarioModeling /> },
  { path: "/finance/multi-currency", element: <MultiCurrency /> },
  { path: "/finance/compliance", element: <RiskCompliance /> },
  { path: "/finance/period-close", element: <PeriodEndClose /> },
];
