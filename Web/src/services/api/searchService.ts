// ========================
// Search API Service (Elasticsearch via .NET Core)
// Maps to: /api/search/* .NET Core controller
// ========================

import { httpClient, ApiResponse, PaginationParams } from "./httpClient";

export type SearchModule =
  | "all"
  | "finance"
  | "inventory"
  | "hr"
  | "sales"
  | "procurement"
  | "production"
  | "quality";

export interface SearchResult {
  id: string;
  module: SearchModule;
  documentType: string;
  title: string;
  description: string;
  referenceNo: string;
  status: string;
  highlights: Record<string, string[]>; // field → highlighted snippets
  score: number;
  url: string;        // frontend route to navigate to
  updatedAt: string;
}

export interface SearchRequest {
  query: string;
  module?: SearchModule;
  documentTypes?: string[];
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchSuggestion {
  text: string;
  module: SearchModule;
  documentType: string;
  count: number;
}

export interface SearchStats {
  totalResults: number;
  moduleBreakdown: Record<string, number>;
  took: number; // milliseconds
}

export interface SearchResponse {
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  stats: SearchStats;
}

// ========================
// Mock search data for demo/offline mode
// ========================
const mockResults: SearchResult[] = [
  { id: "PO-1892", module: "procurement", documentType: "Purchase Order", title: "PO-1892 — Steel Supplies Co", description: "Steel Sheets (Grade A) x500, Welding Rods x200", referenceNo: "PO-1892", status: "Sent", highlights: { title: ["<em>PO-1892</em> — Steel Supplies Co"] }, score: 9.8, url: "/procurement/purchase-orders", updatedAt: "2026-03-02" },
  { id: "PR-2401", module: "procurement", documentType: "Purchase Requisition", title: "PR-2401 — Production Materials", description: "Requested by John Obi, Department: Production", referenceNo: "PR-2401", status: "Approved", highlights: {}, score: 8.5, url: "/procurement/requisitions", updatedAt: "2026-03-01" },
  { id: "WO-501", module: "production", documentType: "Work Order", title: "WO-501 — Servo Motor Assembly", description: "Production Line B, Qty: 200", referenceNo: "WO-501", status: "In Progress", highlights: {}, score: 7.2, url: "/production/work-orders", updatedAt: "2026-03-06" },
  { id: "INV-3042", module: "finance", documentType: "Invoice", title: "INV-3042 — Acme Corp", description: "Quarterly service billing, $45,200.00", referenceNo: "INV-3042", status: "Paid", highlights: {}, score: 6.9, url: "/finance/invoicing", updatedAt: "2026-03-04" },
  { id: "NCR-201", module: "quality", documentType: "NCR", title: "NCR-201 — Dimensional Out of Spec", description: "Batch #B-2401, Product: Widget Assembly", referenceNo: "NCR-201", status: "Open", highlights: {}, score: 6.5, url: "/quality/ncr", updatedAt: "2026-03-05" },
  { id: "SO-8842", module: "sales", documentType: "Sales Order", title: "SO-8842 — TechVentures Ltd", description: "15 units, total $128,500", referenceNo: "SO-8842", status: "Confirmed", highlights: {}, score: 6.1, url: "/sales/orders", updatedAt: "2026-03-07" },
  { id: "EMP-1024", module: "hr", documentType: "Employee", title: "John Obi — Production Manager", description: "Department: Production, Location: Lagos", referenceNo: "EMP-1024", status: "Active", highlights: {}, score: 5.8, url: "/hr/employee-directory", updatedAt: "2026-02-15" },
  { id: "STK-A12", module: "inventory", documentType: "Stock Item", title: "Steel Sheets Grade A — Warehouse 1", description: "On Hand: 1,250 units, Bin: A-12", referenceNo: "SKU-SS-A12", status: "In Stock", highlights: {}, score: 5.4, url: "/inventory/stock-levels", updatedAt: "2026-03-08" },
  { id: "LR-5501", module: "hr", documentType: "Leave Request", title: "LR-5501 — Emily Zhang Annual Leave", description: "Mar 15–22, 2026 (5 working days)", referenceNo: "LR-5501", status: "Pending", highlights: {}, score: 4.9, url: "/hr/leave-management", updatedAt: "2026-03-07" },
  { id: "CAPA-102", module: "quality", documentType: "CAPA", title: "CAPA-102 — Root Cause: Welding Defect", description: "Corrective action for NCR-198, assigned to QA team", referenceNo: "CAPA-102", status: "In Progress", highlights: {}, score: 4.5, url: "/quality/capa", updatedAt: "2026-03-03" },
];

const USE_MOCK = true; // Toggle to false when .NET API is ready

export const searchService = {
  search: async (request: SearchRequest): Promise<ApiResponse<SearchResponse>> => {
    if (USE_MOCK) {
      const q = request.query.toLowerCase();
      const filtered = mockResults.filter(r => {
        const matchesQuery =
          !q ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.referenceNo.toLowerCase().includes(q) ||
          r.documentType.toLowerCase().includes(q);
        const matchesModule =
          !request.module || request.module === "all" || r.module === request.module;
        return matchesQuery && matchesModule;
      });

      const moduleBreakdown: Record<string, number> = {};
      filtered.forEach(r => {
        moduleBreakdown[r.module] = (moduleBreakdown[r.module] || 0) + 1;
      });

      return {
        success: true,
        message: "OK",
        data: {
          results: filtered.slice(0, request.pageSize || 10),
          suggestions: [],
          stats: {
            totalResults: filtered.length,
            moduleBreakdown,
            took: Math.floor(Math.random() * 50) + 5,
          },
        },
      };
    }

    return httpClient.post<SearchResponse>("/search", request);
  },

  suggest: async (query: string): Promise<ApiResponse<SearchSuggestion[]>> => {
    if (USE_MOCK) {
      return { success: true, message: "OK", data: [] };
    }
    return httpClient.get<SearchSuggestion[]>("/search/suggest", { search: query } as PaginationParams);
  },

  reindex: async (module?: string): Promise<ApiResponse<{ jobId: string }>> => {
    return httpClient.post<{ jobId: string }>("/search/reindex", { module });
  },
};
