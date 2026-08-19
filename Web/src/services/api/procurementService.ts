// ========================
// Procurement API Service
// Maps to: /api/procurement/* .NET Core controllers
// ========================

import { httpClient, ApiResponse, PaginationParams } from "./httpClient";

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  supplier: string;
  items: number;
  total: number;
  status: string;
  expectedDelivery: string;
}

export interface SupplierDto {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  status: string;
}

export interface RequisitionDto {
  id: string;
  prNumber: string;
  requestedBy: string;
  department: string;
  totalEstimate: number;
  status: string;
}

export const procurementService = {
  // Purchase Orders
  getPurchaseOrders: (params?: PaginationParams) =>
    httpClient.get<PurchaseOrderDto[]>("/procurement/orders", params),

  createPurchaseOrder: (po: Omit<PurchaseOrderDto, "id">) =>
    httpClient.post<PurchaseOrderDto>("/procurement/orders", po),

  // Suppliers
  getSuppliers: (params?: PaginationParams) =>
    httpClient.get<SupplierDto[]>("/procurement/suppliers", params),

  createSupplier: (supplier: Omit<SupplierDto, "id">) =>
    httpClient.post<SupplierDto>("/procurement/suppliers", supplier),

  // Requisitions
  getRequisitions: (params?: PaginationParams) =>
    httpClient.get<RequisitionDto[]>("/procurement/requisitions", params),

  createRequisition: (pr: Omit<RequisitionDto, "id">) =>
    httpClient.post<RequisitionDto>("/procurement/requisitions", pr),

  approveRequisition: (id: string) =>
    httpClient.patch<RequisitionDto>(`/procurement/requisitions/${id}/approve`, {}),
};
