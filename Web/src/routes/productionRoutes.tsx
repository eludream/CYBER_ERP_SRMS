import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const ProductionDashboard = lazy(() => import("@/pages/production/ProductionDashboard"));
const BOMManagement = lazy(() => import("@/pages/production/BOMManagement"));
const WorkOrders = lazy(() => import("@/pages/production/WorkOrders"));
const Scheduling = lazy(() => import("@/pages/production/Scheduling"));
const ShopFloor = lazy(() => import("@/pages/production/ShopFloor"));
const WIPTracking = lazy(() => import("@/pages/production/WIPTracking"));
const Costing = lazy(() => import("@/pages/production/Costing"));
const QualityIntegration = lazy(() => import("@/pages/production/QualityIntegration"));
const Maintenance = lazy(() => import("@/pages/production/Maintenance"));
const ProductionAnalytics = lazy(() => import("@/pages/production/ProductionAnalytics"));

export const productionRoutes: RouteObject[] = [
  { path: "/production/dashboard", element: <ProductionDashboard /> },
  { path: "/production/bom", element: <BOMManagement /> },
  { path: "/production/work-orders", element: <WorkOrders /> },
  { path: "/production/scheduling", element: <Scheduling /> },
  { path: "/production/shop-floor", element: <ShopFloor /> },
  { path: "/production/wip", element: <WIPTracking /> },
  { path: "/production/costing", element: <Costing /> },
  { path: "/production/quality", element: <QualityIntegration /> },
  { path: "/production/maintenance", element: <Maintenance /> },
  { path: "/production/analytics", element: <ProductionAnalytics /> },
];
