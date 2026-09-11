import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";
import { type ApiResponse } from "../api.types";

/**
 * Line item within a payslip
 */
export interface PayrollItem {
  id?: number;
  payroll_id?: number;
  salary_structure_id?: number | null;
  name: string;
  code: string;
  category: "Earning" | "Deduction";
  amount: number;
  is_taxable: boolean;
}

/**
 * Payroll record contract
 */
export interface PayrollRecord {
  id: string;
  db_id?: number;
  payroll_code?: string;
  name: string;
  email: string;
  role: string;
  department: string;
  month?: number;
  year?: number;
  gross_pay?: string;
  total_deductions?: string;
  base_salary?: string;
  allowance?: string;
  net_pay: string;
  raw_gross?: number;
  raw_deductions?: number;
  raw_net?: number;
  working_days?: number;
  paid_days?: number;
  lop_days?: number;
  lop_amount?: number;
  items?: PayrollItem[];
  status: "Processed" | "Pending" | "On Hold" | "Paid";
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
  salaryStructures?: string[];
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
  status: "Processed" | "Pending" | "On Hold" | "Paid";
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
      success: (res) => `Payroll status for ${res.data?.name || ""} updated!`,
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

/**
 * Payload for generating payroll batch
 */
export interface GeneratePayrollInput {
  month: number;
  year: number;
  department_id?: number;
  employee_ids?: number[];
  preview?: boolean;
}

/**
 * Itemized breakdown inside preview
 */
export interface PayrollPreviewItem {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  role: string;
  working_days: number;
  paid_days: number;
  lop_days: number;
  lop_amount: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  items: Array<{
    name: string;
    code: string;
    category: "Earning" | "Deduction";
    amount: number;
    is_taxable: boolean;
    salary_structure_id?: number | null;
  }>;
  warnings?: string[];
}

/**
 * Summary data returned for payroll calculation preview
 */
export interface PayrollPreviewData {
  month: number;
  year: number;
  days_in_month: number;
  employee_count: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  records: PayrollPreviewItem[];
}

/**
 * Hook to generate payroll batch or execute calculation preview
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useGeneratePayroll = (
  onSuccessCallback?: (data: ApiResponse<PayrollPreviewData | { month: number; year: number; count: number }>) => void,
) => {
  const mutation = useCustomMutation<
    ApiResponse<PayrollPreviewData | { month: number; year: number; count: number }>,
    unknown,
    GeneratePayrollInput
  >({
    toastMessages: {
      loading: "Calculating payroll batch...",
      success: (res) => res.message || "Payroll operation processed successfully!",
    },
    onSuccess: (res) => {
      if (onSuccessCallback) onSuccessCallback(res);
    },
  });

  return {
    ...mutation,
    mutate: (data: GeneratePayrollInput) =>
      mutation.mutate({
        url: "/v1/payroll/generate",
        method: "POST",
        data,
      }),
    mutateAsync: (data: GeneratePayrollInput) =>
      mutation.mutateAsync({
        url: "/v1/payroll/generate",
        method: "POST",
        data,
      }),
  };
};

/**
 * Hook to bulk process payroll records (e.g. approve or mark Paid)
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useProcessBatchPayroll = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<{ count: number }>,
    unknown,
    { payroll_ids: number[]; status?: "Processed" | "Paid" | "Pending" | "On Hold" }
  >({
    toastMessages: {
      loading: "Updating payroll batch...",
      success: "Payroll batch status updated successfully!",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: { payroll_ids: number[]; status?: "Processed" | "Paid" | "Pending" | "On Hold" }) =>
      mutation.mutate({
        url: "/v1/payroll/process-batch",
        method: "POST",
        data,
      }),
    mutateAsync: (data: { payroll_ids: number[]; status?: "Processed" | "Paid" | "Pending" | "On Hold" }) =>
      mutation.mutateAsync({
        url: "/v1/payroll/process-batch",
        method: "POST",
        data,
      }),
  };
};
