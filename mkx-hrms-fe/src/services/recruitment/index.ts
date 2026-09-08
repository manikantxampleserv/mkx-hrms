import { useCustomMutation } from "hooks/useCustomMutation";
import { useCustomQuery } from "hooks/useCustomQuery";
import { type ApiResponse } from "../api.types";

/**
 * Candidate record contract
 */
export interface CandidateRecord {
  id: string;
  db_id?: number;
  name: string;
  email: string;
  position: string;
  department: string;
  stage: "Screening" | "Interviewing" | "Offered" | "Hired";
  experience: string;
  rating: string;
  status: "Active" | "In Review" | "Offered" | "Rejected";
  applied_date: string;
  avatar?: string;
  onboarded_at?: string | null;
  employee_id?: number | null;
}

/**
 * Recruitment KPI card contract
 */
export interface RecruitmentStatCard {
  id: string;
  title: string;
  value: string;
  subtext: string;
  icon_name: string;
  icon_color: string;
  icon_bg: string;
}

/**
 * Hook to retrieve candidates with optional filtering
 *
 * @param params - Optional query filter parameters
 * @returns React Query query result
 */
export const useGetCandidates = (params?: {
  search?: string;
  stage?: string;
  department?: string;
  position?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append("search", params.search);
  if (params?.stage && params.stage !== "All") queryParams.append("stage", params.stage);
  if (params?.department && params.department !== "All")
    queryParams.append("department", params.department);
  if (params?.position && params.position !== "All")
    queryParams.append("position", params.position);
  if (params?.status && params.status !== "All") queryParams.append("status", params.status);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return useCustomQuery<ApiResponse<CandidateRecord[]>>(
    [
      "candidates",
      params?.search,
      params?.stage,
      params?.department,
      params?.position,
      params?.status,
      params?.startDate,
      params?.endDate,
    ],
    `/v1/recruitment/candidates${queryString}`,
  );
};

/**
 * Hook to retrieve recruitment pipeline KPI metrics
 *
 * @returns React Query query result
 */
export const useGetRecruitmentStats = () => {
  return useCustomQuery<ApiResponse<RecruitmentStatCard[]>>(
    ["recruitment", "stats"],
    "/v1/recruitment/stats",
  );
};

/**
 * Dynamic filter options for Recruitment module
 */
export interface RecruitmentFilterOptions {
  departments: string[];
  positions: string[];
}

/**
 * Hook to retrieve dynamic recruitment filter categories (departments, positions)
 *
 * @returns React Query query result
 */
export const useGetRecruitmentFilters = () => {
  return useCustomQuery<ApiResponse<RecruitmentFilterOptions>>(
    ["recruitment", "filters"],
    "/v1/recruitment/filters",
  );
};

/**
 * Hook to onboard a candidate into an active employee
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useOnboardCandidate = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<unknown>,
    unknown,
    Record<string, unknown> | undefined
  >({
    toastMessages: {
      loading: "Onboarding candidate...",
      success: "Candidate successfully onboarded as employee!",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (payload: { id: string; data?: Record<string, unknown> }) =>
      mutation.mutate({
        url: `/v1/recruitment/candidates/${payload.id}/onboard`,
        method: "POST",
        data: payload.data,
      }),
    mutateAsync: (payload: { id: string; data?: Record<string, unknown> }) =>
      mutation.mutateAsync({
        url: `/v1/recruitment/candidates/${payload.id}/onboard`,
        method: "POST",
        data: payload.data,
      }),
  };
};

/**
 * Payload for updating candidate stage and status
 */
export interface UpdateCandidateInput {
  id: string;
  stage?: "Screening" | "Interviewing" | "Offered" | "Hired";
  status?: "Active" | "In Review" | "Offered" | "Rejected";
}

/**
 * Hook to update candidate stage or status
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useUpdateCandidateStatus = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<
    ApiResponse<CandidateRecord>,
    unknown,
    Omit<UpdateCandidateInput, "id">
  >({
    toastMessages: {
      loading: "Updating candidate status...",
      success: (res) => `Candidate ${res.data?.name || ""} status updated!`,
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (data: UpdateCandidateInput) =>
      mutation.mutate({
        url: `/v1/recruitment/candidates/${data.id}/status`,
        method: "PATCH",
        data: {
          stage: data.stage,
          status: data.status,
        },
      }),
    mutateAsync: (data: UpdateCandidateInput) =>
      mutation.mutateAsync({
        url: `/v1/recruitment/candidates/${data.id}/status`,
        method: "PATCH",
        data: {
          stage: data.stage,
          status: data.status,
        },
      }),
  };
};

/**
 * Hook to delete candidate
 *
 * @param onSuccessCallback - Optional callback on success
 * @returns Mutation trigger
 */
export const useDeleteCandidate = (onSuccessCallback?: () => void) => {
  const mutation = useCustomMutation<ApiResponse<{ id: number }>, unknown, undefined>({
    toastMessages: {
      loading: "Removing candidate...",
      success: "Candidate application removed",
    },
    onSuccess: () => {
      if (onSuccessCallback) onSuccessCallback();
    },
  });

  return {
    ...mutation,
    mutate: (id: string) =>
      mutation.mutate({
        url: `/v1/recruitment/candidates/${id}`,
        method: "DELETE",
      }),
    mutateAsync: (id: string) =>
      mutation.mutateAsync({
        url: `/v1/recruitment/candidates/${id}`,
        method: "DELETE",
      }),
  };
};
