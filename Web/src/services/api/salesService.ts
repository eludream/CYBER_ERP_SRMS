// ========================
// Sales API Service
// Maps to: /api/sales/* .NET Core controllers
// ========================

import { httpClient, ApiResponse, PaginationParams } from "./httpClient";

export interface LeadDto {
  id: string;
  company: string;
  contact: string;
  email: string;
  stage: string;
  value: number;
  probability: number;
  assignedTo: string;
}

export interface SalesOrderDto {
  id: string;
  orderNumber: string;
  customer: string;
  items: number;
  total: number;
  status: string;
  orderDate: string;
  promisedDate: string;
}

export interface QuotationDto {
  id: string;
  quoteNumber: string;
  customer: string;
  total: number;
  validUntil: string;
  status: string;
}

export const salesService = {
  // Leads
  getLeads: (params?: PaginationParams) =>
    httpClient.get<LeadDto[]>("/sales/leads", params),

  createLead: (lead: Omit<LeadDto, "id">) =>
    httpClient.post<LeadDto>("/sales/leads", lead),

  updateLead: (id: string, lead: Partial<LeadDto>) =>
    httpClient.put<LeadDto>(`/sales/leads/${id}`, lead),

  // Orders
  getOrders: (params?: PaginationParams) =>
    httpClient.get<SalesOrderDto[]>("/sales/orders", params),

  createOrder: (order: Omit<SalesOrderDto, "id">) =>
    httpClient.post<SalesOrderDto>("/sales/orders", order),

  // Quotations
  getQuotations: (params?: PaginationParams) =>
    httpClient.get<QuotationDto[]>("/sales/quotations", params),

  createQuotation: (quote: Omit<QuotationDto, "id">) =>
    httpClient.post<QuotationDto>("/sales/quotations", quote),

  convertQuoteToOrder: (quoteId: string) =>
    httpClient.post<SalesOrderDto>(`/sales/quotations/${quoteId}/convert`, {}),
};
