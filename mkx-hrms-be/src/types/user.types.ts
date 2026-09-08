/**
 * Represents a User in the HRMS system
 */
export interface User {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string | null;
  role_id: number | null;
  status: string | null;
  created_at: Date;
  updated_at: Date;
}
