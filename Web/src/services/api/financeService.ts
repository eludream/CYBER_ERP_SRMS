// ========================
// Finance API Service
// Maps to: /api/finance/* .NET Core controllers
// ========================

import { httpClient, ApiResponse, PaginationParams } from "./httpClient";

// DTOs matching .NET Core models
export interface LedgerEntryDto {
  id: string;
  date: string;
  reference: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  customer: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: string;
  status: string;
  issuedDate: string;
}

export interface AccountDto {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  status: string;
}

export interface BudgetDto {
  id: string;
  department: string;
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  period: string;
}

export const financeService = {
  // General Ledger
  getLedgerEntries: (params?: PaginationParams) =>
    httpClient.get<LedgerEntryDto[]>("/finance/ledger", params),

  createLedgerEntry: (entry: Omit<LedgerEntryDto, "id">) =>
    httpClient.post<LedgerEntryDto>("/finance/ledger", entry),

  // Invoicing
  getInvoices: (params?: PaginationParams) =>
    httpClient.get<InvoiceDto[]>("/finance/invoices", params),

  getInvoiceById: (id: string) =>
    httpClient.get<InvoiceDto>(`/finance/invoices/${id}`),

  createInvoice: (invoice: Omit<InvoiceDto, "id">) =>
    httpClient.post<InvoiceDto>("/finance/invoices", invoice),

  updateInvoice: (id: string, invoice: Partial<InvoiceDto>) =>
    httpClient.put<InvoiceDto>(`/finance/invoices/${id}`, invoice),

  // Chart of Accounts
  getAccounts: (params?: PaginationParams) =>
    httpClient.get<AccountDto[]>("/finance/accounts", params),

  createAccount: (account: Omit<AccountDto, "id">) =>
    httpClient.post<AccountDto>("/finance/accounts", account),

  // Budget
  getBudgets: (params?: PaginationParams) =>
    httpClient.get<BudgetDto[]>("/finance/budgets", params),

  createBudget: (budget: Omit<BudgetDto, "id">) =>
    httpClient.post<BudgetDto>("/finance/budgets", budget),
};
