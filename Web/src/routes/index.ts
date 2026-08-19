import { securityRoutes } from "./securityRoutes";
import type { RouteObject } from "react-router-dom";

export const moduleRoutes: RouteObject[] = [
  ...securityRoutes,
];
