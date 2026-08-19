import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const FormListPage = lazy(() => import("@/pages/forms/FormListPage"));
const FormDesignerPage = lazy(() => import("@/pages/forms/FormDesignerPage"));
const FormPreviewPage = lazy(() => import("@/pages/forms/FormPreviewPage"));
const DocumentEntryPage = lazy(() => import("@/pages/forms/DocumentEntryPage"));

export const formDesignerRoutes: RouteObject[] = [
  { path: "/forms", element: <FormListPage /> },
  { path: "/forms/designer/:id", element: <FormDesignerPage /> },
  { path: "/forms/preview/:id", element: <FormPreviewPage /> },
  { path: "/documents/new/:module/:entity", element: <DocumentEntryPage /> },
];
