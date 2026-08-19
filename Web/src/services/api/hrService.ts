// ========================
// HR API Service
// Maps to: /api/hr/* .NET Core controllers
// ========================

import { httpClient, ApiResponse, PaginationParams } from "./httpClient";

export interface EmployeeDto {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  status: string;
  hireDate: string;
  managerId?: string;
}

export interface LeaveRequestDto {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
}

export interface PayrollRecordDto {
  id: string;
  employeeId: string;
  period: string;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  status: string;
}

export const hrService = {
  // Employees
  getEmployees: (params?: PaginationParams) =>
    httpClient.get<EmployeeDto[]>("/hr/employees", params),

  getEmployeeById: (id: string) =>
    httpClient.get<EmployeeDto>(`/hr/employees/${id}`),

  createEmployee: (employee: Omit<EmployeeDto, "id">) =>
    httpClient.post<EmployeeDto>("/hr/employees", employee),

  updateEmployee: (id: string, employee: Partial<EmployeeDto>) =>
    httpClient.put<EmployeeDto>(`/hr/employees/${id}`, employee),

  deleteEmployee: (id: string) =>
    httpClient.delete<void>(`/hr/employees/${id}`),

  // Leave
  getLeaveRequests: (params?: PaginationParams) =>
    httpClient.get<LeaveRequestDto[]>("/hr/leave", params),

  createLeaveRequest: (request: Omit<LeaveRequestDto, "id">) =>
    httpClient.post<LeaveRequestDto>("/hr/leave", request),

  approveLeave: (id: string) =>
    httpClient.patch<LeaveRequestDto>(`/hr/leave/${id}/approve`, {}),

  rejectLeave: (id: string, reason: string) =>
    httpClient.patch<LeaveRequestDto>(`/hr/leave/${id}/reject`, { reason }),

  // Payroll
  getPayrollRecords: (params?: PaginationParams) =>
    httpClient.get<PayrollRecordDto[]>("/hr/payroll", params),

  runPayroll: (period: string) =>
    httpClient.post<PayrollRecordDto[]>("/hr/payroll/run", { period }),
};
