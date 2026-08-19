import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const InventoryDashboard = lazy(() => import("@/pages/inventory/InventoryDashboard"));
const StockLevels = lazy(() => import("@/pages/inventory/StockLevels"));
const Warehousing = lazy(() => import("@/pages/inventory/Warehousing"));
const StockTransfers = lazy(() => import("@/pages/inventory/StockTransfers"));
const ReorderPoints = lazy(() => import("@/pages/inventory/ReorderPoints"));
const DemandForecasting = lazy(() => import("@/pages/inventory/DemandForecasting"));
const BinManagement = lazy(() => import("@/pages/inventory/BinManagement"));
const PickPackShip = lazy(() => import("@/pages/inventory/PickPackShip"));
const CycleCounting = lazy(() => import("@/pages/inventory/CycleCounting"));
const BatchTracking = lazy(() => import("@/pages/inventory/BatchTracking"));
const BarcodeScanning = lazy(() => import("@/pages/inventory/BarcodeScanning"));
const InventoryValuation = lazy(() => import("@/pages/inventory/InventoryValuation"));
const InventoryKPIs = lazy(() => import("@/pages/inventory/InventoryKPIs"));
const KitsBundles = lazy(() => import("@/pages/inventory/KitsBundles"));
const ShelfLife = lazy(() => import("@/pages/inventory/ShelfLife"));

export const inventoryRoutes: RouteObject[] = [
  { path: "/inventory/dashboard", element: <InventoryDashboard /> },
  { path: "/inventory/stock", element: <StockLevels /> },
  { path: "/inventory/warehousing", element: <Warehousing /> },
  { path: "/inventory/transfers", element: <StockTransfers /> },
  { path: "/inventory/reorder", element: <ReorderPoints /> },
  { path: "/inventory/forecasting", element: <DemandForecasting /> },
  { path: "/inventory/bins", element: <BinManagement /> },
  { path: "/inventory/pick-pack", element: <PickPackShip /> },
  { path: "/inventory/cycle-count", element: <CycleCounting /> },
  { path: "/inventory/batches", element: <BatchTracking /> },
  { path: "/inventory/barcode", element: <BarcodeScanning /> },
  { path: "/inventory/valuation", element: <InventoryValuation /> },
  { path: "/inventory/kpis", element: <InventoryKPIs /> },
  { path: "/inventory/kits", element: <KitsBundles /> },
  { path: "/inventory/shelf-life", element: <ShelfLife /> },
];
