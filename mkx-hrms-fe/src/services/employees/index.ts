import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";
import { type ApiResponse } from "../api.types";

export interface EmployeeSalaryStructureAssignment {
  id?: number;
  employee_id?: number;
  salary_structure_id: number;
  amount: number;
  effective_date?: string;
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
 * Data contract representing an employee in the frontend application
 */
export interface Employee {
  id: string;
  db_id?: number;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  role: string;
  role_id?: number | null;
  department: string;
  department_id?: number | null;
  shift_id?: number | null;
  shift?: string | null;
  shift_time?: string | null;
  shift_rel?: {
    id: number;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    grace_mins?: number;
  } | null;
  salary_structures?: EmployeeSalaryStructureAssignment[];
  status: "Active" | "Inactive";
  manager: string;
  manager_id?: number | null;
  join_date: string;
  birth_date?: string | null;
  address?: string | null;
  phone?: string | null;
  avatar?: string;
  payrolls?: Array<{
    id: string;
    db_id?: number;
    month: number;
    year: number;
    gross_pay: string;
    total_deductions: string;
    net_pay: string;
    raw_gross?: number;
    raw_deductions?: number;
    raw_net?: number;
    working_days?: number;
    paid_days?: number;
    lop_days?: number;
    lop_amount?: number;
    status: "Processed" | "Pending" | "On Hold" | "Paid";
    pay_date: string;
    items?: Array<{
      name: string;
      code: string;
      category: "Earning" | "Deduction";
      amount: number;
      is_taxable: boolean;
    }>;
  }>;
  user?: {
    id: number;
    email: string;
    status: string;
    created_at: string;
  } | null;
}

/**
 * Employee KPI card structure
 */
export interface EmployeeStatCard {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon_name: string;
  icon_color: string;
  icon_bg: string;
}

/**
 * Hook to retrieve employees from the backend API
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result with employees array
 */
export const useGetEmployees = (params?: {
  search?: string;
  status?: string;
  department?: string;
  role?: string;
  manager?: string;
  shift?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);
  if (params?.department && params.department !== "All")
    queryParams.append("department", params.department);
  if (params?.role && params.role !== "All") queryParams.append("role", params.role);
  if (params?.manager && params.manager !== "All") queryParams.append("manager", params.manager);
  if (params?.shift && params.shift !== "All") queryParams.append("shift", params.shift);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<Employee[]>>(
    [
      "employees",
      params?.search,
      params?.status,
      params?.department,
      params?.role,
      params?.manager,
      params?.shift,
      params?.startDate,
      params?.endDate,
    ],
    `/v1/employees${queryString}`,
  );
};

/**
 * Hook to retrieve a single employee record with its complete relations and payroll history
 *
 * @param id - Employee unique code or numeric database ID
 * @returns React Query query result
 */
export const useGetEmployeeById = (id?: string | number) => {
  return useCustomQuery<ApiResponse<Employee>>(
    ["employees", "detail", String(id)],
    `/v1/employees/${id}`,
    { enabled: Boolean(id) },
  );
};

/**
 * Hook to retrieve employee summary KPI metrics
 *
 * @returns React Query query result with employee KPI cards
 */
export const useGetEmployeeStats = () => {
  return useCustomQuery<ApiResponse<EmployeeStatCard[]>>(
    ["employees", "stats"],
    "/v1/employees/stats",
  );
};

/**
 * Hook to create a new employee
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useCreateEmployee = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<Employee>, unknown, Partial<Employee>>({
    toastMessages: {
      loading: "Adding employee...",
      success: (res) => `Employee ${res.data?.name || ""} successfully added!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<Employee>) =>
      mutation.mutate({
        url: "/v1/employees",
        method: "POST",
        data,
      }),
    mutateAsync: (data: Partial<Employee>) =>
      mutation.mutateAsync({
        url: "/v1/employees",
        method: "POST",
        data,
      }),
  };
};

/**
 * Hook to update an existing employee
 *
 * @param id - Employee ID to update
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useUpdateEmployee = (id: string, onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<Employee>, unknown, Partial<Employee>>({
    toastMessages: {
      loading: "Updating employee...",
      success: (res) => `Employee ${res.data?.name || ""} successfully updated!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<Employee>) =>
      mutation.mutate({
        url: `/v1/employees/${id}`,
        method: "PUT",
        data,
      }),
    mutateAsync: (data: Partial<Employee>) =>
      mutation.mutateAsync({
        url: `/v1/employees/${id}`,
        method: "PUT",
        data,
      }),
  };
};

/**
 * Hook to delete an employee
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useDeleteEmployee = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: string }>, unknown, undefined>({
    toastMessages: {
      loading: "Removing employee...",
      success: "Employee removed successfully",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({
        url: `/v1/employees/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: string) =>
      mutation.mutateAsync({
        url: `/v1/employees/${id}`,
        method: "DELETE",
      }),
  };
};

/**
 * Dynamic filter options structure returned by backend
 */
export interface EmployeeFilterOptions {
  departments: string[];
  roles: string[];
  managers: string[];
  shifts?: Array<{ id: number; name: string; start_time: string; end_time: string }>;
}

/**
 * Hook to retrieve dynamic employee filter categories (departments, roles, managers)
 *
 * @returns React Query query result with filter categories
 */
export const useGetEmployeeFilters = () => {
  return useCustomQuery<ApiResponse<EmployeeFilterOptions>>(
    ["employees", "filters"],
    "/v1/employees/filters",
  );
};

/**
 * Hook to retrieve assigned salary structure components for a specific employee
 *
 * @param employeeId - The employee ID
 * @returns React Query query result with assigned salary structures
 */
export const useGetEmployeeSalaryStructures = (employeeId?: string | number) => {
  return useCustomQuery<ApiResponse<EmployeeSalaryStructureAssignment[]>>(
    ["employees", employeeId, "salary-structures"],
    `/v1/employees/${employeeId}/salary-structures`,
    {
      enabled: Boolean(employeeId),
    },
  );
};

/**
 * Hook to bulk assign salary structures to an employee
 *
 * @param employeeId - The employee ID
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useAssignEmployeeSalaryStructures = (
  employeeId: string | number,
  onSuccessCallback?: () => void,
) => {
  const mutation = useCustomMutation<
    ApiResponse<unknown>,
    unknown,
    { assignments: Array<{ salary_structure_id: number; amount: number; effective_date?: string; status?: string }> }
  >({
    toastMessages: {
      loading: "Saving compensation structure...",
      success: "Salary structures assigned successfully!",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: { assignments: Array<{ salary_structure_id: number; amount: number; effective_date?: string; status?: string }> }) =>
      mutation.mutate({
        url: `/v1/employees/${employeeId}/salary-structures`,
        method: "POST",
        data,
      }),
    mutateAsync: (data: { assignments: Array<{ salary_structure_id: number; amount: number; effective_date?: string; status?: string }> }) =>
      mutation.mutateAsync({
        url: `/v1/employees/${employeeId}/salary-structures`,
        method: "POST",
        data,
      }),
  };
};
