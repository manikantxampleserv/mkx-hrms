/**
 * Data contract representing a single line item within a generated payslip
 */
export interface PayrollItemRecord {
  id?: number;
  payroll_id?: number;
  salary_structure_id?: number | null;
  name: string;
  code: string;
  category: "Earning" | "Deduction";
  amount: number;
  is_taxable: boolean;
}

/**
 * Data contract representing an employee's monthly payroll record
 */
export interface PayrollRecord {
  id: number;
  payroll_code: string;
  employee_id: number;
  month: number;
  year: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  working_days: number;
  paid_days: number;
  lop_days: number;
  lop_amount: number;
  status: "Pending" | "Processed" | "Paid" | "On Hold";
  pay_date: Date | string;
  items?: PayrollItemRecord[];
}

/**
 * Request payload for generating payroll across active staff
 */
export interface GeneratePayrollInput {
  month: number;
  year: number;
  department_id?: number;
  employee_ids?: number[];
  preview?: boolean;
}

/**
 * Individual employee breakdown item inside a payroll calculation preview
 */
export interface PayrollPreviewItem {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  role: string;
  working_days: number;
  paid_days: number;
  lop_days: number;
  lop_amount: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  items: Array<{
    name: string;
    code: string;
    category: "Earning" | "Deduction";
    amount: number;
    is_taxable: boolean;
    salary_structure_id?: number | null;
  }>;
  warnings?: string[];
}

/**
 * Batch status update request payload
 */
export interface BatchPayrollStatusInput {
  payroll_ids: number[];
  status: "Pending" | "Processed" | "Paid" | "On Hold";
}
