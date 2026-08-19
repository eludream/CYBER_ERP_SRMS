import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const ProcurementDashboard = lazy(() => import("@/pages/procurement/ProcurementDashboard"));
const Requisitions = lazy(() => import("@/pages/procurement/Requisitions"));
const RFQManagement = lazy(() => import("@/pages/procurement/RFQManagement"));
const PurchaseOrders = lazy(() => import("@/pages/procurement/PurchaseOrders"));
const GoodsReceipt = lazy(() => import("@/pages/procurement/GoodsReceipt"));
const ThreeWayMatch = lazy(() => import("@/pages/procurement/ThreeWayMatch"));
const Suppliers = lazy(() => import("@/pages/procurement/Suppliers"));
const Contracts = lazy(() => import("@/pages/procurement/Contracts"));
const SpendAnalytics = lazy(() => import("@/pages/procurement/SpendAnalytics"));
const LandedCost = lazy(() => import("@/pages/procurement/LandedCost"));

export const procurementRoutes: RouteObject[] = [
  { path: "/procurement/dashboard", element: <ProcurementDashboard /> },
  { path: "/procurement/requisitions", element: <Requisitions /> },
  { path: "/procurement/rfq", element: <RFQManagement /> },
  { path: "/procurement/orders", element: <PurchaseOrders /> },
  { path: "/procurement/grn", element: <GoodsReceipt /> },
  { path: "/procurement/matching", element: <ThreeWayMatch /> },
  { path: "/procurement/suppliers", element: <Suppliers /> },
  { path: "/procurement/contracts", element: <Contracts /> },
  { path: "/procurement/analytics", element: <SpendAnalytics /> },
  { path: "/procurement/landed-cost", element: <LandedCost /> },
];
