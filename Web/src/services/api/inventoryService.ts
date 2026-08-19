// ========================
// Inventory API Service
// Maps to: /api/inventory/* .NET Core controllers
// ========================

import { httpClient, ApiResponse, PaginationParams } from "./httpClient";

export interface InventoryItemDto {
  id: string;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  onHand: number;
  allocated: number;
  available: number;
  reorderPoint: number;
  unitCost: number;
  status: string;
}

export interface StockTransferDto {
  id: string;
  transferNumber: string;
  fromWarehouse: string;
  toWarehouse: string;
  items: number;
  status: string;
  requestedDate: string;
}

export interface StockAdjustmentDto {
  id: string;
  sku: string;
  adjustmentType: "increase" | "decrease";
  quantity: number;
  reason: string;
  date: string;
}

export const inventoryService = {
  // Stock
  getItems: (params?: PaginationParams) =>
    httpClient.get<InventoryItemDto[]>("/inventory/items", params),

  getItemBySku: (sku: string) =>
    httpClient.get<InventoryItemDto>(`/inventory/items/${sku}`),

  updateItem: (id: string, item: Partial<InventoryItemDto>) =>
    httpClient.put<InventoryItemDto>(`/inventory/items/${id}`, item),

  // Transfers
  getTransfers: (params?: PaginationParams) =>
    httpClient.get<StockTransferDto[]>("/inventory/transfers", params),

  createTransfer: (transfer: Omit<StockTransferDto, "id">) =>
    httpClient.post<StockTransferDto>("/inventory/transfers", transfer),

  // Adjustments
  createAdjustment: (adjustment: Omit<StockAdjustmentDto, "id">) =>
    httpClient.post<StockAdjustmentDto>("/inventory/adjustments", adjustment),

  // Valuation
  getValuationReport: () =>
    httpClient.get<{ method: string; totalValue: number; items: number }>("/inventory/valuation"),
};
