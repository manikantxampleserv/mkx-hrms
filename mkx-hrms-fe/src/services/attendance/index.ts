import { useCustomQuery } from "hooks/useCustomQuery";
import { useCustomMutation } from "hooks/useCustomMutation";
import { type ApiResponse } from "../api.types";

/**
 * Attendance record contract
 */
export interface AttendanceRecord {
  id: string;
  db_id?: number;
  name: string;
  email: string;
  department: string;
  check_in: string;
  check_out: string;
  work_hours: string;
  status: "Present" | "Late" | "Absent" | "Remote";
  location: string;
  avatar?: string;
}

/**
 * Attendance KPI card contract
 */
export interface AttendanceStatCard {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon_name: string;
  icon_color: string;
  icon_bg: string;
}

/**
 * Hook to retrieve attendance records with optional filtering
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetAttendance = (params?: {
  search?: string;
  status?: string;
  department?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);
  if (params?.department && params.department !== "All")
    queryParams.append("department", params.department);
  if (params?.location && params.location !== "All")
    queryParams.append("location", params.location);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<AttendanceRecord[]>>(
    [
      "attendance",
      params?.search,
      params?.status,
      params?.department,
      params?.location,
      params?.startDate,
      params?.endDate,
    ],
    `/v1/attendance${queryString}`,
  );
};

/**
 * Hook to retrieve attendance summary KPI metrics
 *
 * @param params - Optional query parameters for date and category filtering
 * @returns React Query query result
 */
export const useGetAttendanceStats = (params?: {
  startDate?: string;
  endDate?: string;
  department?: string;
  location?: string;
}) => {
  const queryString = params
    ? `?${new URLSearchParams(
        Object.entries(params).filter(
          ([, v]) => v !== undefined && v !== "" && v !== "All",
        ) as [string, string][],
      ).toString()}`
    : "";

  return useCustomQuery<ApiResponse<AttendanceStatCard[]>>(
    ["attendance", "stats", params],
    `/v1/attendance/stats${queryString}`,
  );
};

/**
 * Dynamic filter options for Attendance module
 */
export interface AttendanceFilterOptions {
  departments: string[];
  locations: string[];
}

/**
 * Hook to retrieve dynamic attendance filter categories (departments, locations)
 *
 * @returns React Query query result
 */
export const useGetAttendanceFilters = () => {
  return useCustomQuery<ApiResponse<AttendanceFilterOptions>>(
    ["attendance", "filters"],
    "/v1/attendance/filters",
  );
};

/**
 * Payload for updating attendance status and times
 */
export interface UpdateAttendanceInput {
  id: string;
  status?: "Present" | "Late" | "Absent" | "Remote";
  check_in?: string;
  check_out?: string;
  location?: string;
}

/**
 * Hook to update an attendance record
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useUpdateAttendanceStatus = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<AttendanceRecord>,
    unknown,
    Omit<UpdateAttendanceInput, "id">
  >({
    toastMessages: {
      loading: "Updating attendance...",
      success: (res) => `Attendance status for ${res.data?.name || ""} updated`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: UpdateAttendanceInput) =>
      mutation.mutate({
        url: `/v1/attendance/${data.id}/status`,
        method: "PATCH",
        data: {
          status: data.status,
          check_in: data.check_in,
          check_out: data.check_out,
          location: data.location,
        },
      }),
    mutateAsync: (data: UpdateAttendanceInput) =>
      mutation.mutateAsync({
        url: `/v1/attendance/${data.id}/status`,
        method: "PATCH",
        data: {
          status: data.status,
          check_in: data.check_in,
          check_out: data.check_out,
          location: data.location,
        },
      }),
  };
};

