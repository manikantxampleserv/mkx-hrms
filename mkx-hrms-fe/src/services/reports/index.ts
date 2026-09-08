import { useCustomQuery } from "hooks/useCustomQuery";
import { type ApiResponse } from "../api.types";

/**
 * Report card contract
 */
export interface ReportCardItem {
  id: string;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon_color: string;
  icon_bg: string;
}

/**
 * Recent report item contract
 */
export interface RecentReportItem {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
}

/**
 * Analytical reports data container
 */
export interface ReportAnalytics {
  summary_cards: ReportCardItem[];
  headcount_growth: Array<{
    month: string;
    engineering: number;
    sales: number;
    product: number;
    hr: number;
  }>;
  retention_trend: Array<{ month: string; rate: number }>;
  recruitment_sources: Array<{ name: string; value: number; color: string }>;
  department_compensation: Array<{ dept: string; current: number; budget: number }>;
}

/**
 * Hook to retrieve recent reports list
 *
 * @returns React Query query result
 */
export const useGetReports = () => {
  return useCustomQuery<ApiResponse<RecentReportItem[]>>(["reports"], "/v1/reports");
};

/**
 * Hook to retrieve analytical report charts and trends
 *
 * @returns React Query query result
 */
export const useGetReportAnalytics = () => {
  return useCustomQuery<ApiResponse<ReportAnalytics>>(
    ["reports", "analytics"],
    "/v1/reports/analytics",
  );
};
