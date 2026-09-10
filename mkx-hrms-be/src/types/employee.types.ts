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
  status: "Active" | "Inactive";
  manager_id: number | null;
  role?: string;
  department?: string;
  manager_name?: string | null;
  join_date: Date;
  avatar: string | null;
  user_id: number | null;
  created_at: Date;
  updated_at: Date;
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
  manager_id?: number | null;
  role?: string;
  department?: string;
  status?: "Active" | "Inactive";
  manager_name?: string | null;
  join_date: Date | string;
  avatar?: string | null;
  timezone?: string;
}
