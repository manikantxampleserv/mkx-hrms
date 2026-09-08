import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";
import { type ApiResponse } from "../api.types";

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
  department: string;
  status: "Active" | "On Leave" | "Terminated";
  manager: string;
  join_date: string;
  avatar?: string;
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
      params?.startDate,
      params?.endDate,
    ],
    `/v1/employees${queryString}`,
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
