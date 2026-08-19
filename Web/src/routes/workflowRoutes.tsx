import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const WorkflowDashboard = lazy(() => import("@/pages/workflow/WorkflowDashboard"));
const WorkflowDesigner = lazy(() => import("@/pages/workflow/WorkflowDesigner"));
const ApprovalChains = lazy(() => import("@/pages/workflow/ApprovalChains"));
const TaskTracker = lazy(() => import("@/pages/workflow/TaskTracker"));
const AutomationRules = lazy(() => import("@/pages/workflow/AutomationRules"));

export const workflowRoutes: RouteObject[] = [
  { path: "/workflow/dashboard", element: <WorkflowDashboard /> },
  { path: "/workflow/designer", element: <WorkflowDesigner /> },
  { path: "/workflow/approvals", element: <ApprovalChains /> },
  { path: "/workflow/tasks", element: <TaskTracker /> },
  { path: "/workflow/automation", element: <AutomationRules /> },
];
