import { useCustomQuery } from "hooks/useCustomQuery";
import { type ApiResponse } from "../api.types";

/**
 * Dashboard activity item contract
 */
export interface RecentActivity {
  id: number;
  initials: string;
  name: string;
  subtext: string;
  diff?: string;
  time_ago?: string;
  status_label: string;
  status_type: "success" | "warning" | "error" | "info";
  bg_alpha: string;
  created_at?: string;
}

/**
 * Top performer contract
 */
export interface TopPerformer {
  name: string;
  role: string;
  deals: number;
  avatar?: string;
}

/**
 * Dashboard overview dataset
 */
export interface DashboardOverview {
  kpi_metrics: {
    total_employees: number;
    active_workforce: number;
    on_leave_today: number;
    active_candidates: number;
  };
  recent_activities: RecentActivity[];
  top_performers: TopPerformer[];
}

/**
 * Hook to retrieve dashboard overview data
 *
 * @returns React Query query result
 */
export const useGetDashboardOverview = () => {
  return useCustomQuery<ApiResponse<DashboardOverview>>(
    ["dashboard", "overview"],
    "/v1/dashboard/overview",
  );
};

/**
 * Hook to retrieve all tracked activities with optional search query
 *
 * @param search - Optional search filter string
 * @returns React Query query result
 */
export const useGetAllActivities = (search?: string) => {
  const queryParam = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  return useCustomQuery<ApiResponse<RecentActivity[]>>(
    ["dashboard", "activities", search],
    `/v1/dashboard/activities${queryParam}`,
  );
};
