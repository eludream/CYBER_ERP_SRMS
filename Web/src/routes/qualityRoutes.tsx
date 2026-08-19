import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const QualityDashboard = lazy(() => import("@/pages/quality/QualityDashboard"));
const Inspections = lazy(() => import("@/pages/quality/Inspections"));
const NCR = lazy(() => import("@/pages/quality/NCR"));
const CAPA = lazy(() => import("@/pages/quality/CAPA"));
const Standards = lazy(() => import("@/pages/quality/Standards"));
const Audits = lazy(() => import("@/pages/quality/Audits"));
const Calibration = lazy(() => import("@/pages/quality/Calibration"));
const DocumentControl = lazy(() => import("@/pages/quality/DocumentControl"));
const SPC = lazy(() => import("@/pages/quality/SPC"));
const QualityAnalytics = lazy(() => import("@/pages/quality/QualityAnalytics"));

export const qualityRoutes: RouteObject[] = [
  { path: "/quality/dashboard", element: <QualityDashboard /> },
  { path: "/quality/inspections", element: <Inspections /> },
  { path: "/quality/ncr", element: <NCR /> },
  { path: "/quality/capa", element: <CAPA /> },
  { path: "/quality/standards", element: <Standards /> },
  { path: "/quality/audits", element: <Audits /> },
  { path: "/quality/calibration", element: <Calibration /> },
  { path: "/quality/documents", element: <DocumentControl /> },
  { path: "/quality/spc", element: <SPC /> },
  { path: "/quality/analytics", element: <QualityAnalytics /> },
];
