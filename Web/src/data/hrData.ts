// ========== HR Module Data & Interfaces ==========

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  managerId?: string;
  managerName?: string;
  joinDate: string;
  status: "Active" | "On Leave" | "Terminated" | "Probation";
  employmentType: "Full-Time" | "Part-Time" | "Contract";
  location: string;
  salary: number;
  avatar?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: "Annual" | "Sick" | "Personal" | "Maternity" | "Paternity" | "Unpaid";
  startDate: string;
  endDate: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  reason: string;
}

export interface ShiftSchedule {
  id: string;
  employeeName: string;
  department: string;
  shift: "Morning" | "Afternoon" | "Night" | "Flexible";
  startTime: string;
  endTime: string;
  date: string;
  status: "Scheduled" | "Completed" | "Swapped" | "Absent";
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  period: string;
  basicSalary: number;
  allowances: number;
  overtime: number;
  grossPay: number;
  taxDeduction: number;
  socialSecurity: number;
  healthInsurance: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  status: "Paid" | "Processing" | "Pending" | "On Hold";
}

export interface BenefitPlan {
  id: string;
  name: string;
  type: "Health Insurance" | "Retirement" | "Life Insurance" | "Dental" | "Vision" | "Wellness";
  provider: string;
  coverage: string;
  employerContribution: number;
  employeeContribution: number;
  enrolled: number;
  eligible: number;
  status: "Active" | "Expired" | "Pending Renewal";
}

export interface ExpenseClaim {
  id: string;
  employeeName: string;
  department: string;
  category: "Travel" | "Meals" | "Equipment" | "Training" | "Office Supplies" | "Other";
  amount: number;
  date: string;
  description: string;
  receipt: boolean;
  status: "Pending" | "Approved" | "Rejected" | "Reimbursed";
  approver: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  stage: "Applied" | "Screening" | "Interview" | "Assessment" | "Offer" | "Hired" | "Rejected";
  appliedDate: string;
  source: string;
  rating: number;
  resume: boolean;
}

export interface OnboardingTask {
  id: string;
  employeeName: string;
  task: string;
  category: "IT Setup" | "Documentation" | "Training" | "Access" | "Asset Allocation" | "Orientation";
  assignedTo: string;
  dueDate: string;
  status: "Pending" | "In Progress" | "Completed" | "Overdue";
}

export interface PerformanceReview {
  id: string;
  employeeName: string;
  department: string;
  reviewPeriod: string;
  reviewer: string;
  overallRating: number;
  goals: { title: string; progress: number; status: string }[];
  status: "Draft" | "In Progress" | "Completed" | "Acknowledged";
}

export interface TrainingProgram {
  id: string;
  title: string;
  category: "Technical" | "Compliance" | "Leadership" | "Safety" | "Soft Skills" | "Certification";
  instructor: string;
  duration: string;
  enrolled: number;
  capacity: number;
  completionRate: number;
  status: "Active" | "Upcoming" | "Completed" | "Cancelled";
  mandatory: boolean;
}

// ========== Sample Data ==========

export const employees: Employee[] = [] as any[];

export const leaveRequests: LeaveRequest[] = [] as any[];

export const shiftSchedules: ShiftSchedule[] = [] as any[];

export const payrollRecords: PayrollRecord[] = [] as any[];

export const benefitPlans: BenefitPlan[] = [] as any[];

export const expenseClaims: ExpenseClaim[] = [] as any[];

export const candidates: Candidate[] = [] as any[];

export const onboardingTasks: OnboardingTask[] = [] as any[];

export const performanceReviews: PerformanceReview[] = [] as any[];

export const trainingPrograms: TrainingProgram[] = [] as any[];

export const orgStructure = [] as any[];
