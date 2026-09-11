/**
 * Master payload for Department creation
 */
export interface CreateDepartmentInput {
  name: string;
  code?: string;
  description?: string;
  status?: string;
}

/**
 * Master payload for Department updates
 */
export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  description?: string;
  status?: string;
}

/**
 * Master payload for Role creation
 */
export interface CreateRoleInput {
  name: string;
  description?: string;
  status?: string;
  permission_ids?: number[];
}

/**
 * Master payload for Role updates
 */
export interface UpdateRoleInput {
  name?: string;
  description?: string;
  status?: string;
  permission_ids?: number[];
}

/**
 * Master payload for Designation creation
 */
export interface CreateDesignationInput {
  title: string;
  code: string;
  department_id?: number | null;
  description?: string;
  status?: string;
}

/**
 * Master payload for Designation updates
 */
export interface UpdateDesignationInput {
  title?: string;
  code?: string;
  department_id?: number | null;
  description?: string;
  status?: string;
}

/**
 * Master payload for Leave Type creation
 */
export interface CreateLeaveTypeInput {
  name: string;
  code: string;
  days_per_year: number;
  is_paid?: boolean;
  color?: string;
  description?: string;
  status?: string;
}

/**
 * Master payload for Leave Type updates
 */
export interface UpdateLeaveTypeInput {
  name?: string;
  code?: string;
  days_per_year?: number;
  is_paid?: boolean;
  color?: string;
  description?: string;
  status?: string;
}

/**
 * Master payload for Salary Structure creation
 */
export interface CreateSalaryStructureInput {
  name: string;
  code: string;
  description?: string;
  is_deduction?: boolean;
  is_taxable?: boolean;
  is_base_salary?: boolean;
  calculation_type?: string;
  default_value?: number;
  status?: string;
}

/**
 * Master payload for Salary Structure updates
 */
export interface UpdateSalaryStructureInput {
  name?: string;
  code?: string;
  description?: string;
  is_deduction?: boolean;
  is_taxable?: boolean;
  is_base_salary?: boolean;
  calculation_type?: string;
  default_value?: number;
  status?: string;
}

/**
 * Master payload for Work Shift creation
 */
export interface CreateWorkShiftInput {
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_mins?: number;
  description?: string;
  status?: string;
}

/**
 * Master payload for Work Shift updates
 */
export interface UpdateWorkShiftInput {
  name?: string;
  code?: string;
  start_time?: string;
  end_time?: string;
  grace_mins?: number;
  description?: string;
  status?: string;
}
