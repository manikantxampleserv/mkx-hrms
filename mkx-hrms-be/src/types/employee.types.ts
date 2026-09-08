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
  role: string;
  role_id: number | null;
  department: string;
  department_id: number | null;
  status: "Active" | "On Leave" | "Terminated";
  manager_name: string | null;
  manager_id: number | null;
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
  role: string;
  role_id?: number | null;
  department: string;
  department_id?: number | null;
  status?: "Active" | "On Leave" | "Terminated";
  manager_name?: string | null;
  manager_id?: number | null;
  join_date: Date | string;
  avatar?: string | null;
  timezone?: string;
}
