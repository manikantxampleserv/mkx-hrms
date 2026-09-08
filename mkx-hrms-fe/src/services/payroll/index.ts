import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";
import { type ApiResponse } from "../api.types";

/**
 * Payroll record contract
 */
export interface PayrollRecord {
  id: string;
  db_id?: number;
  name: string;
  email: string;
  role: string;
  department: string;
  base_salary: string;
  allowance: string;
  net_pay: string;
  status: "Processed" | "Pending" | "On Hold";
  pay_date: string;
  avatar?: string;
}

/**
 * Payroll KPI card contract
 */
export interface PayrollStatCard {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon_name: string;
  icon_color: string;
  icon_bg: string;
}

/**
 * Hook to retrieve payroll records with optional filtering
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetPayroll = (params?: {
  search?: string;
  status?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);
  if (params?.department && params.department !== "All")
    queryParams.append("department", params.department);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<PayrollRecord[]>>(
    [
      "payroll",
      params?.search,
      params?.status,
      params?.department,
      params?.startDate,
      params?.endDate,
    ],
    `/v1/payroll${queryString}`,
  );
};

/**
 * Hook to retrieve payroll operation KPI metrics
 *
 * @returns React Query query result
 */
export const useGetPayrollStats = () => {
  return useCustomQuery<ApiResponse<PayrollStatCard[]>>(["payroll", "stats"], "/v1/payroll/stats");
};

/**
 * Dynamic filter options for Payroll module
 */
export interface PayrollFilterOptions {
  departments: string[];
}

/**
 * Hook to retrieve dynamic payroll filter categories (departments)
 *
 * @returns React Query query result
 */
export const useGetPayrollFilters = () => {
  return useCustomQuery<ApiResponse<PayrollFilterOptions>>(
    ["payroll", "filters"],
    "/v1/payroll/filters",
  );
};

/**
 * Payload for updating payroll disbursement status
 */
export interface UpdatePayrollInput {
  id: string;
  status: "Processed" | "Pending" | "On Hold";
}

/**
 * Hook to update a payroll record status
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useUpdatePayrollStatus = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<PayrollRecord>,
    unknown,
    Omit<UpdatePayrollInput, "id">
  >({
    toastMessages: {
      loading: "Updating payroll status...",
      success: (res) => `Payroll for ${res.data?.name || ""} status updated!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: UpdatePayrollInput) =>
      mutation.mutate({
        url: `/v1/payroll/${data.id}/status`,
        method: "PATCH",
        data: { status: data.status },
      }),
    mutateAsync: (data: UpdatePayrollInput) =>
      mutation.mutateAsync({
        url: `/v1/payroll/${data.id}/status`,
        method: "PATCH",
        data: { status: data.status },
      }),
  };
};

