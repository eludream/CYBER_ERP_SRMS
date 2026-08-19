import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const SalesDashboard = lazy(() => import("@/pages/sales/SalesDashboard"));
const CRM = lazy(() => import("@/pages/sales/CRM"));
const Leads = lazy(() => import("@/pages/sales/Leads"));
const Quotations = lazy(() => import("@/pages/sales/Quotations"));
const Orders = lazy(() => import("@/pages/sales/Orders"));
const CreditControl = lazy(() => import("@/pages/sales/CreditControl"));
const AvailableToPromise = lazy(() => import("@/pages/sales/AvailableToPromise"));
const Shipping = lazy(() => import("@/pages/sales/Shipping"));
const Returns = lazy(() => import("@/pages/sales/Returns"));
const SalesInvoicing = lazy(() => import("@/pages/sales/SalesInvoicing"));
const Commissions = lazy(() => import("@/pages/sales/Commissions"));
const SalesAnalytics = lazy(() => import("@/pages/sales/SalesAnalytics"));
const SalesForecasting = lazy(() => import("@/pages/sales/SalesForecasting"));

export const salesRoutes: RouteObject[] = [
  { path: "/sales/dashboard", element: <SalesDashboard /> },
  { path: "/sales/crm", element: <CRM /> },
  { path: "/sales/leads", element: <Leads /> },
  { path: "/sales/quotations", element: <Quotations /> },
  { path: "/sales/orders", element: <Orders /> },
  { path: "/sales/credit", element: <CreditControl /> },
  { path: "/sales/atp", element: <AvailableToPromise /> },
  { path: "/sales/shipping", element: <Shipping /> },
  { path: "/sales/returns", element: <Returns /> },
  { path: "/sales/invoicing", element: <SalesInvoicing /> },
  { path: "/sales/commissions", element: <Commissions /> },
  { path: "/sales/analytics", element: <SalesAnalytics /> },
  { path: "/sales/forecasting", element: <SalesForecasting /> },
];
