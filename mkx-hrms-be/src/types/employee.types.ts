/**
 * Data contract representing an employee in the backend HRMS system
 */
export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role_id: number | null;
  department_id: number | null;
  shift_id?: number | null;
  salary_structure_id?: number | null;
  base_salary?: number | string | null;
  status: "Active" | "Inactive";
  manager_id: number | null;
  role?: string;
  department?: string;
  shift?: string | null;
  shift_time?: string | null;
  shift_rel?: {
    id: number;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    grace_mins: number;
  } | null;
  salary_structures?: EmployeeSalaryStructureAssignment[];
  manager_name?: string | null;
  join_date: Date;
  birth_date: Date | null;
  address: string | null;
  phone: string | null;
  avatar: string | null;
  user_id: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Data contract representing an employee's assigned salary structure component
 */
export interface EmployeeSalaryStructureAssignment {
  id?: number;
  employee_id?: number;
  salary_structure_id: number;
  amount: number;
  effective_date?: Date | string;
  status?: string;
  salary_structure?: {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    is_deduction: boolean;
    is_taxable: boolean;
    is_base_salary: boolean;
    calculation_type: string;
    default_value: number;
    status: string;
  };
}

/**
 * Payload data for bulk assigning or updating salary components for an employee
 */
export interface AssignSalaryStructuresInput {
  assignments: Array<{
    salary_structure_id: number;
    amount: number;
    effective_date?: Date | string;
    status?: string;
  }>;
}

/**
 * Payload data needed to provision an employee and their corresponding user
 */
export interface CreateEmployeeInput {
  employee_id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role_id?: number | null;
  department_id?: number | null;
  shift_id?: number | null;
  salary_structures?: Array<{
    salary_structure_id: number;
    amount: number;
    effective_date?: Date | string;
    status?: string;
  }>;
  base_salary?: number | string | null;
  manager_id?: number | null;
  role?: string;
  department?: string;
  shift?: string | null;
  status?: "Active" | "Inactive";
  manager_name?: string | null;
  join_date: Date | string;
  birth_date?: Date | string | null;
  address?: string | null;
  phone?: string | null;
  avatar?: string | null;
  timezone?: string;
}
