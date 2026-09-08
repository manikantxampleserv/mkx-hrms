/**
 * Data contract representing a recruitment candidate in the HRMS system
 */
export interface Candidate {
  id: number;
  candidate_code: string;
  name: string;
  email: string;
  position: string;
  department: string;
  stage: "Screening" | "Interviewing" | "Offered" | "Hired";
  experience: string;
  rating: number | null;
  status: "Active" | "In Review" | "Offered" | "Rejected" | "Onboarded";
  applied_date: Date;
  avatar: string | null;
  onboarded_at: Date | null;
  employee_id: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Options payload when converting a candidate to an active employee
 */
export interface OnboardCandidateInput {
  candidate_id: number;
  employee_id?: string;
  manager_name?: string;
  manager_id?: number;
  join_date?: Date | string;
  department?: string;
  role?: string;
}
