import { lazy } from "react";
import { Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

const HRDashboard = lazy(() => import("@/pages/hr/HRDashboard"));
const EmployeeDirectory = lazy(() => import("@/pages/hr/EmployeeDirectory"));
const OrgChart = lazy(() => import("@/pages/hr/OrgChart"));
const Payroll = lazy(() => import("@/pages/hr/Payroll"));
const Attendance = lazy(() => import("@/pages/hr/Attendance"));
const LeaveManagement = lazy(() => import("@/pages/hr/LeaveManagement"));
const ShiftScheduling = lazy(() => import("@/pages/hr/ShiftScheduling"));
const Benefits = lazy(() => import("@/pages/hr/Benefits"));
const ExpenseClaims = lazy(() => import("@/pages/hr/ExpenseClaims"));
const Recruitment = lazy(() => import("@/pages/hr/Recruitment"));
const Onboarding = lazy(() => import("@/pages/hr/Onboarding"));
const Performance = lazy(() => import("@/pages/hr/Performance"));
const LearningDevelopment = lazy(() => import("@/pages/hr/LearningDevelopment"));
const HRAnalytics = lazy(() => import("@/pages/hr/HRAnalytics"));

export const hrRoutes: RouteObject[] = [
  { path: "/hr/dashboard", element: <HRDashboard /> },
  { path: "/hr/employees", element: <EmployeeDirectory /> },
  { path: "/hr/org-chart", element: <OrgChart /> },
  { path: "/hr/self-service", element: <Navigate to="/self-service" replace /> },
  { path: "/hr/payroll", element: <Payroll /> },
  { path: "/hr/attendance", element: <Attendance /> },
  { path: "/hr/leave", element: <LeaveManagement /> },
  { path: "/hr/shifts", element: <ShiftScheduling /> },
  { path: "/hr/benefits", element: <Benefits /> },
  { path: "/hr/expenses", element: <ExpenseClaims /> },
  { path: "/hr/recruitment", element: <Recruitment /> },
  { path: "/hr/onboarding", element: <Onboarding /> },
  { path: "/hr/performance", element: <Performance /> },
  { path: "/hr/learning", element: <LearningDevelopment /> },
  { path: "/hr/analytics", element: <HRAnalytics /> },
];
