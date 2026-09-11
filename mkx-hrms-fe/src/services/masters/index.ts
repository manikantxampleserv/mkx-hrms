import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";
import { type ApiResponse } from "../api.types";

/**
 * Department entity model returned from backend
 */
export interface MasterDepartment {
  id: number;
  name: string;
  code: string;
  description: string;
  status: "Active" | "Inactive";
  employee_count: number;
  designation_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Permission item assigned to roles
 */
export interface MasterPermission {
  id: number;
  name: string;
  module: string;
  description: string;
}

/**
 * Role entity model returned from backend
 */
export interface MasterRole {
  id: number;
  name: string;
  description: string;
  status: "Active" | "Inactive";
  permissions: MasterPermission[];
  user_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Designation entity model returned from backend
 */
export interface MasterDesignation {
  id: number;
  title: string;
  code: string;
  department_id: number | null;
  department_name: string;
  description: string;
  status: "Active" | "Inactive";
  employee_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Leave type configuration model
 */
export interface MasterLeaveType {
  id: number;
  name: string;
  code: string;
  days_per_year: number;
  is_paid: boolean;
  color: string;
  description: string;
  status: "Active" | "Inactive";
  request_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Salary structure configuration model
 */
export interface MasterSalaryStructure {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_deduction: boolean;
  is_taxable: boolean;
  is_base_salary: boolean;
  calculation_type: string;
  default_value: number;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

/**
 * Work shift schedule model
 */
export interface MasterWorkShift {
  id: number;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_mins: number;
  description: string;
  status: "Active" | "Inactive";
  created_at: string;
  updated_at: string;
}

/**
 * Retrieval hook for Master Departments
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetMasterDepartments = (params?: { search?: string; status?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<MasterDepartment[]>>(
    ["masters", "departments", params?.search, params?.status],
    `/v1/masters/departments${queryString}`,
  );
};

/**
 * Mutation hook to create a department
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useCreateMasterDepartment = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<MasterDepartment>, unknown, Partial<MasterDepartment>>({
    toastMessages: {
      loading: "Creating department...",
      success: (res) => `Department ${res.data?.name || ""} created successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<MasterDepartment>) =>
      mutation.mutate({
        url: "/v1/masters/departments",
        method: "POST",
        data,
      }),
    mutateAsync: (data: Partial<MasterDepartment>) =>
      mutation.mutateAsync({
        url: "/v1/masters/departments",
        method: "POST",
        data,
      }),
  };
};

/**
 * Mutation hook to update a department
 *
 * @param id - Department ID
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useUpdateMasterDepartment = (id: number, onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<MasterDepartment>, unknown, Partial<MasterDepartment>>({
    toastMessages: {
      loading: "Updating department...",
      success: (res) => `Department ${res.data?.name || ""} updated successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<MasterDepartment>) =>
      mutation.mutate({
        url: `/v1/masters/departments/${id}`,
        method: "PUT",
        data,
      }),
    mutateAsync: (data: Partial<MasterDepartment>) =>
      mutation.mutateAsync({
        url: `/v1/masters/departments/${id}`,
        method: "PUT",
        data,
      }),
  };
};

/**
 * Mutation hook to delete a department
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useDeleteMasterDepartment = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: number }>, unknown, undefined>({
    toastMessages: {
      loading: "Deleting department...",
      success: "Department deleted successfully",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: number) =>
      mutation.mutate({
        url: `/v1/masters/departments/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: number) =>
      mutation.mutateAsync({
        url: `/v1/masters/departments/${id}`,
        method: "DELETE",
      }),
  };
};

/**
 * Retrieval hook for Master Roles
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetMasterRoles = (params?: { search?: string; status?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<MasterRole[]>>(
    ["masters", "roles", params?.search, params?.status],
    `/v1/masters/roles${queryString}`,
  );
};

/**
 * Retrieval hook for all available system permissions
 *
 * @returns React Query query result
 */
export const useGetMasterPermissions = () => {
  return useCustomQuery<ApiResponse<MasterPermission[]>>(
    ["masters", "permissions"],
    "/v1/masters/permissions",
  );
};

/**
 * Mutation hook to create a role
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useCreateMasterRole = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<MasterRole>,
    unknown,
    { name: string; description?: string; status?: string; permission_ids?: number[] }
  >({
    toastMessages: {
      loading: "Creating role...",
      success: (res) => `Role ${res.data?.name || ""} created successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: { name: string; description?: string; status?: string; permission_ids?: number[] }) =>
      mutation.mutate({
        url: "/v1/masters/roles",
        method: "POST",
        data,
      }),
    mutateAsync: (data: { name: string; description?: string; status?: string; permission_ids?: number[] }) =>
      mutation.mutateAsync({
        url: "/v1/masters/roles",
        method: "POST",
        data,
      }),
  };
};

/**
 * Mutation hook to update a role
 *
 * @param id - Role ID
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useUpdateMasterRole = (id: number, onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<MasterRole>,
    unknown,
    { name?: string; description?: string; status?: string; permission_ids?: number[] }
  >({
    toastMessages: {
      loading: "Updating role...",
      success: (res) => `Role ${res.data?.name || ""} updated successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: { name?: string; description?: string; status?: string; permission_ids?: number[] }) =>
      mutation.mutate({
        url: `/v1/masters/roles/${id}`,
        method: "PUT",
        data,
      }),
    mutateAsync: (data: { name?: string; description?: string; status?: string; permission_ids?: number[] }) =>
      mutation.mutateAsync({
        url: `/v1/masters/roles/${id}`,
        method: "PUT",
        data,
      }),
  };
};

/**
 * Mutation hook to delete a role
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useDeleteMasterRole = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: number }>, unknown, undefined>({
    toastMessages: {
      loading: "Deleting role...",
      success: "Role deleted successfully",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: number) =>
      mutation.mutate({
        url: `/v1/masters/roles/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: number) =>
      mutation.mutateAsync({
        url: `/v1/masters/roles/${id}`,
        method: "DELETE",
      }),
  };
};

/**
 * Retrieval hook for Master Designations
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetMasterDesignations = (params?: {
  search?: string;
  status?: string;
  department_id?: number | string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);
  if (params?.department_id && params.department_id !== "All")
    queryParams.append("department_id", String(params.department_id));

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<MasterDesignation[]>>(
    ["masters", "designations", params?.search, params?.status, params?.department_id],
    `/v1/masters/designations${queryString}`,
  );
};

/**
 * Mutation hook to create a designation
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useCreateMasterDesignation = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<MasterDesignation>,
    unknown,
    { title: string; code?: string; department_id?: number | null; description?: string; status?: string }
  >({
    toastMessages: {
      loading: "Creating designation...",
      success: (res) => `Designation ${res.data?.title || ""} created successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: { title: string; code?: string; department_id?: number | null; description?: string; status?: string }) =>
      mutation.mutate({
        url: "/v1/masters/designations",
        method: "POST",
        data,
      }),
    mutateAsync: (data: { title: string; code?: string; department_id?: number | null; description?: string; status?: string }) =>
      mutation.mutateAsync({
        url: "/v1/masters/designations",
        method: "POST",
        data,
      }),
  };
};

/**
 * Mutation hook to update a designation
 *
 * @param id - Designation ID
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useUpdateMasterDesignation = (id: number, onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<MasterDesignation>,
    unknown,
    { title?: string; code?: string; department_id?: number | null; description?: string; status?: string }
  >({
    toastMessages: {
      loading: "Updating designation...",
      success: (res) => `Designation ${res.data?.title || ""} updated successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: { title?: string; code?: string; department_id?: number | null; description?: string; status?: string }) =>
      mutation.mutate({
        url: `/v1/masters/designations/${id}`,
        method: "PUT",
        data,
      }),
    mutateAsync: (data: { title?: string; code?: string; department_id?: number | null; description?: string; status?: string }) =>
      mutation.mutateAsync({
        url: `/v1/masters/designations/${id}`,
        method: "PUT",
        data,
      }),
  };
};

/**
 * Mutation hook to delete a designation
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useDeleteMasterDesignation = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: number }>, unknown, undefined>({
    toastMessages: {
      loading: "Deleting designation...",
      success: "Designation deleted successfully",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: number) =>
      mutation.mutate({
        url: `/v1/masters/designations/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: number) =>
      mutation.mutateAsync({
        url: `/v1/masters/designations/${id}`,
        method: "DELETE",
      }),
  };
};

/**
 * Retrieval hook for Master Leave Types
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetMasterLeaveTypes = (params?: { search?: string; status?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<MasterLeaveType[]>>(
    ["masters", "leave-types", params?.search, params?.status],
    `/v1/masters/leave-types${queryString}`,
  );
};

/**
 * Mutation hook to create a leave type
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useCreateMasterLeaveType = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<MasterLeaveType>, unknown, Partial<MasterLeaveType>>({
    toastMessages: {
      loading: "Creating leave type...",
      success: (res) => `Leave type ${res.data?.name || ""} created successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<MasterLeaveType>) =>
      mutation.mutate({
        url: "/v1/masters/leave-types",
        method: "POST",
        data,
      }),
    mutateAsync: (data: Partial<MasterLeaveType>) =>
      mutation.mutateAsync({
        url: "/v1/masters/leave-types",
        method: "POST",
        data,
      }),
  };
};

/**
 * Mutation hook to update a leave type
 *
 * @param id - Leave type ID
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useUpdateMasterLeaveType = (id: number, onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<MasterLeaveType>, unknown, Partial<MasterLeaveType>>({
    toastMessages: {
      loading: "Updating leave type...",
      success: (res) => `Leave type ${res.data?.name || ""} updated successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<MasterLeaveType>) =>
      mutation.mutate({
        url: `/v1/masters/leave-types/${id}`,
        method: "PUT",
        data,
      }),
    mutateAsync: (data: Partial<MasterLeaveType>) =>
      mutation.mutateAsync({
        url: `/v1/masters/leave-types/${id}`,
        method: "PUT",
        data,
      }),
  };
};

/**
 * Mutation hook to delete a leave type
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useDeleteMasterLeaveType = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: number }>, unknown, undefined>({
    toastMessages: {
      loading: "Deleting leave type...",
      success: "Leave type deleted successfully",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: number) =>
      mutation.mutate({
        url: `/v1/masters/leave-types/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: number) =>
      mutation.mutateAsync({
        url: `/v1/masters/leave-types/${id}`,
        method: "DELETE",
      }),
  };
};

/**
 * Retrieval hook for Master Salary Structures
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetMasterSalaryStructures = (params?: { search?: string; status?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<MasterSalaryStructure[]>>(
    ["masters", "salary-structures", params?.search, params?.status],
    `/v1/masters/salary-structures${queryString}`,
  );
};

/**
 * Mutation hook to create a salary structure
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useCreateMasterSalaryStructure = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<MasterSalaryStructure>, unknown, Partial<MasterSalaryStructure>>({
    toastMessages: {
      loading: "Creating salary structure...",
      success: (res) => `Salary structure ${res.data?.name || ""} created successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<MasterSalaryStructure>) =>
      mutation.mutate({
        url: "/v1/masters/salary-structures",
        method: "POST",
        data,
      }),
    mutateAsync: (data: Partial<MasterSalaryStructure>) =>
      mutation.mutateAsync({
        url: "/v1/masters/salary-structures",
        method: "POST",
        data,
      }),
  };
};

/**
 * Mutation hook to update a salary structure
 *
 * @param id - Salary structure ID
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useUpdateMasterSalaryStructure = (id: number, onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<MasterSalaryStructure>, unknown, Partial<MasterSalaryStructure>>({
    toastMessages: {
      loading: "Updating salary structure...",
      success: (res) => `Salary structure ${res.data?.name || ""} updated successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<MasterSalaryStructure>) =>
      mutation.mutate({
        url: `/v1/masters/salary-structures/${id}`,
        method: "PUT",
        data,
      }),
    mutateAsync: (data: Partial<MasterSalaryStructure>) =>
      mutation.mutateAsync({
        url: `/v1/masters/salary-structures/${id}`,
        method: "PUT",
        data,
      }),
  };
};

/**
 * Mutation hook to delete a salary structure
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useDeleteMasterSalaryStructure = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: number }>, unknown, undefined>({
    toastMessages: {
      loading: "Deleting salary structure...",
      success: "Salary structure deleted successfully",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: number) =>
      mutation.mutate({
        url: `/v1/masters/salary-structures/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: number) =>
      mutation.mutateAsync({
        url: `/v1/masters/salary-structures/${id}`,
        method: "DELETE",
      }),
  };
};

/**
 * Retrieval hook for Master Work Shifts
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetMasterWorkShifts = (params?: { search?: string; status?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<MasterWorkShift[]>>(
    ["masters", "shifts", params?.search, params?.status],
    `/v1/masters/shifts${queryString}`,
  );
};

/**
 * Mutation hook to create a work shift
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useCreateMasterWorkShift = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<MasterWorkShift>, unknown, Partial<MasterWorkShift>>({
    toastMessages: {
      loading: "Creating work shift...",
      success: (res) => `Work shift ${res.data?.name || ""} created successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<MasterWorkShift>) =>
      mutation.mutate({
        url: "/v1/masters/shifts",
        method: "POST",
        data,
      }),
    mutateAsync: (data: Partial<MasterWorkShift>) =>
      mutation.mutateAsync({
        url: "/v1/masters/shifts",
        method: "POST",
        data,
      }),
  };
};

/**
 * Mutation hook to update a work shift
 *
 * @param id - Work shift ID
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useUpdateMasterWorkShift = (id: number, onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<MasterWorkShift>, unknown, Partial<MasterWorkShift>>({
    toastMessages: {
      loading: "Updating work shift...",
      success: (res) => `Work shift ${res.data?.name || ""} updated successfully!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: Partial<MasterWorkShift>) =>
      mutation.mutate({
        url: `/v1/masters/shifts/${id}`,
        method: "PUT",
        data,
      }),
    mutateAsync: (data: Partial<MasterWorkShift>) =>
      mutation.mutateAsync({
        url: `/v1/masters/shifts/${id}`,
        method: "PUT",
        data,
      }),
  };
};

/**
 * Mutation hook to delete a work shift
 *
 * @param onSuccessCallback - Optional callback executed on success
 * @returns Mutation trigger
 */
export const useDeleteMasterWorkShift = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: number }>, unknown, undefined>({
    toastMessages: {
      loading: "Deleting work shift...",
      success: "Work shift deleted successfully",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: number) =>
      mutation.mutate({
        url: `/v1/masters/shifts/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: number) =>
      mutation.mutateAsync({
        url: `/v1/masters/shifts/${id}`,
        method: "DELETE",
      }),
  };
};
