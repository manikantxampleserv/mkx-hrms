import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";
import { type ApiResponse } from "../api.types";

/**
 * Leave request record contract
 */
export interface LeaveRequest {
  id: string;
  db_id?: number;
  name: string;
  email: string;
  department: string;
  leave_type: "Annual PTO" | "Sick Leave" | "Parental Leave" | "Casual Leave";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  applied_on: string;
  avatar?: string;
}

/**
 * Leave KPI card contract
 */
export interface LeaveStatCard {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon_name: string;
  icon_color: string;
  icon_bg: string;
}

/**
 * Hook to retrieve leave requests with optional filtering
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetLeaves = (params?: {
  search?: string;
  status?: string;
  department?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);
  if (params?.department && params.department !== "All")
    queryParams.append("department", params.department);
  if (params?.leaveType && params.leaveType !== "All")
    queryParams.append("leaveType", params.leaveType);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<LeaveRequest[]>>(
    [
      "leaves",
      params?.search,
      params?.status,
      params?.department,
      params?.leaveType,
      params?.startDate,
      params?.endDate,
    ],
    `/v1/leaves${queryString}`,
  );
};

/**
 * Hook to retrieve leave management KPI metrics
 *
 * @returns React Query query result
 */
export const useGetLeaveStats = () => {
  return useCustomQuery<ApiResponse<LeaveStatCard[]>>(["leaves", "stats"], "/v1/leaves/stats");
};

/**
 * Dynamic filter options for Leaves module
 */
export interface LeaveFilterOptions {
  departments: string[];
  leaveTypes: string[];
}

/**
 * Hook to retrieve dynamic leave filter categories (departments, leave types)
 *
 * @returns React Query query result
 */
export const useGetLeaveFilters = () => {
  return useCustomQuery<ApiResponse<LeaveFilterOptions>>(
    ["leaves", "filters"],
    "/v1/leaves/filters",
  );
};

/**
 * Payload for updating leave request status
 */
export interface UpdateLeaveStatusInput {
  id: string;
  status: "Approved" | "Rejected";
}

/**
 * Hook to update leave status (Approve / Reject)
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useUpdateLeaveStatus = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<LeaveRequest>,
    unknown,
    { status: "Approved" | "Rejected" }
  >({
    toastMessages: {
      loading: "Updating leave request...",
      success: (res) => `Leave request for ${res.data?.name || ""} ${res.data?.status || "updated"}`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: UpdateLeaveStatusInput) =>
      mutation.mutate({
        url: `/v1/leaves/${data.id}/status`,
        method: "PATCH",
        data: { status: data.status },
      }),
    mutateAsync: (data: UpdateLeaveStatusInput) =>
      mutation.mutateAsync({
        url: `/v1/leaves/${data.id}/status`,
        method: "PATCH",
        data: { status: data.status },
      }),
  };
};

