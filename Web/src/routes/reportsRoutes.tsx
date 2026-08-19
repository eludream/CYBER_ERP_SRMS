import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const ReportsDashboard = lazy(() => import("@/pages/reports/ReportsDashboard"));
const Analytics = lazy(() => import("@/pages/reports/Analytics"));
const CustomReports = lazy(() => import("@/pages/reports/CustomReports"));

export const reportsRoutes: RouteObject[] = [
  { path: "/reports/dashboard", element: <ReportsDashboard /> },
  { path: "/reports/analytics", element: <Analytics /> },
  { path: "/reports/custom", element: <CustomReports /> },
];
