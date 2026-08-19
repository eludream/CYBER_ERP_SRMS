// ========================
// Production API Service
// Maps to: /api/production/* .NET Core controllers
// ========================

import { httpClient, ApiResponse, PaginationParams } from "./httpClient";

export interface WorkOrderDto {
  id: string;
  woNumber: string;
  product: string;
  bomRef: string;
  qty: number;
  completedQty: number;
  productionLine: string;
  status: string;
}

export interface BOMDto {
  id: string;
  bomNumber: string;
  product: string;
  version: string;
  totalCost: number;
  status: string;
}

export interface MaintenanceTicketDto {
  id: string;
  ticketNumber: string;
  equipment: string;
  type: string;
  priority: string;
  status: string;
}

export const productionService = {
  // Work Orders
  getWorkOrders: (params?: PaginationParams) =>
    httpClient.get<WorkOrderDto[]>("/production/work-orders", params),

  createWorkOrder: (wo: Omit<WorkOrderDto, "id">) =>
    httpClient.post<WorkOrderDto>("/production/work-orders", wo),

  updateWorkOrderStatus: (id: string, status: string) =>
    httpClient.patch<WorkOrderDto>(`/production/work-orders/${id}/status`, { status }),

  // BOM
  getBOMs: (params?: PaginationParams) =>
    httpClient.get<BOMDto[]>("/production/bom", params),

  getBOMById: (id: string) =>
    httpClient.get<BOMDto>(`/production/bom/${id}`),

  // Maintenance
  getMaintenanceTickets: (params?: PaginationParams) =>
    httpClient.get<MaintenanceTicketDto[]>("/production/maintenance", params),

  createMaintenanceTicket: (ticket: Omit<MaintenanceTicketDto, "id">) =>
    httpClient.post<MaintenanceTicketDto>("/production/maintenance", ticket),
};
