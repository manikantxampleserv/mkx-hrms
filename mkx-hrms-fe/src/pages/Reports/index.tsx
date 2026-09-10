import {
  Users,
  UserCheck,
  Briefcase,
  Wallet,
  TrendingUp,
  FileText,
  Download,
  type LucideIcon,
} from "lucide-react";
import { AccessTime, ChevronRight } from "@mui/icons-material";
import { Button } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StaggerContainer, FadeUpItem } from "shared/animations";

/**
 * Interface definition for a top summary HR report card
 */
interface ReportCardItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  icon_color: string;
  icon_bg: string;
}

/**
 * Quick access summary cards for HRMS analytics
 */
const reportCards: ReportCardItem[] = [
  {
    id: "headcount-growth",
    title: "Headcount & Growth",
    description: "Monthly hiring and workforce growth metrics",
    icon: Users,
    icon_color: "text-[#00b1d8]",
    icon_bg: "bg-[#00b1d8]/10",
  },
  {
    id: "retention-rate",
    title: "Retention & Turnover",
    description: "Employee retention rate and tenure analysis",
    icon: UserCheck,
    icon_color: "text-[#45ba50]",
    icon_bg: "bg-[#45ba50]/10",
  },
  {
    id: "recruitment-sources",
    title: "Recruitment Sources",
    description: "Hiring channel attribution & pipeline breakdown",
    icon: Briefcase,
    icon_color: "text-[#ff8b25]",
    icon_bg: "bg-[#ff8b25]/10",
  },
  {
    id: "payroll-compensation",
    title: "Payroll & Comp",
    description: "Salary distribution and compensation targets",
    icon: Wallet,
    icon_color: "text-[#ad87ed]",
    icon_bg: "bg-[#ad87ed]/10",
  },
];

import { useGetReports, useGetReportAnalytics } from "services/reports";

/**
 * Reports page component providing HRMS-centric analytics and reporting.
 */
export default function Reports() {
  const { data: reportsResponse } = useGetReports();
  const { data: analyticsResponse } = useGetReportAnalytics();

  const reportsList = reportsResponse?.data || [];
  const activeTrendData = analyticsResponse?.data?.retention_trend || [];
  const activeSourcesData = analyticsResponse?.data?.recruitment_sources || [];

  return (
    <StaggerContainer className="space-y-4">
      {/* Top 4 HR Summary Cards */}
      <FadeUpItem className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-border/80 transition-all group flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.icon_bg} ${card.icon_color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground mt-4">{card.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-2">{card.description}</p>
              </div>
              <div>
                <Button variant="text" size="small" color="success" endIcon={<ChevronRight />}>
                  View Report
                </Button>
              </div>
            </div>
          );
        })}
      </FadeUpItem>

      {/* Analytics Charts Grid: Retention Rate Trend & Recruitment Sources */}
      <FadeUpItem className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Retention Rate Trend (Left - 7 Cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Employee Retention Rate</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly organizational retention benchmark
              </p>
            </div>
            <div className="flex items-center gap-1 text-emerald-500 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+98.2% YoY</span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeTrendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  ticks={[70, 80, 90, 100]}
                  tickFormatter={(val: number) => `${val}%`}
                  domain={[65, 100]}
                />
                <Tooltip
                  formatter={(val: unknown) => [
                    `${typeof val === "number" || typeof val === "string" ? val : 0}%`,
                    "Retention Rate",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "var(--foreground)" }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#45ba50"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "#45ba50" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recruitment Sources Donut Chart (Right - 5 Cols) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Recruitment Sources</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Where your newly hired talent comes from
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            {/* Donut Chart */}
            <div className="w-[180px] h-[200px] flex items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: unknown) => [
                      `${typeof val === "number" || typeof val === "string" ? val : 0}%`,
                      "Share",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                  <Pie
                    data={activeSourcesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {activeSourcesData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend List */}
            <div className="flex-1 pl-6 space-y-3">
              {activeSourcesData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-foreground font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeUpItem>

      {/* Recent Reports List Section */}
      <FadeUpItem className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Recent HR Reports</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your generated compliance and workforce reports
            </p>
          </div>

          <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-all cursor-pointer">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span>Generate New</span>
          </button>
        </div>

        <div className="divide-y divide-border">
          {reportsList.map((report) => (
            <div
              key={report.id}
              className="py-3.5 flex items-center justify-between hover:bg-secondary/30 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{report.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="bg-secondary px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground">
                      {report.category}
                    </span>
                    <span>•</span>
                    <span>{report.date}</span>
                  </div>
                </div>
              </div>

              <div>
                {report.status === "download" ? (
                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors cursor-pointer">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-warning font-medium">
                    <AccessTime className="!w-3.5 !h-3.5" />
                    <span>Generating...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </FadeUpItem>
    </StaggerContainer>
  );
}
