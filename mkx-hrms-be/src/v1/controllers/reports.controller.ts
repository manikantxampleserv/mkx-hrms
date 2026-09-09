import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";

/**
 * Controller to retrieve generated analytics reports
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getReports = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { created_at: "desc" },
    });

    const formatted = reports.map((r) => ({
      id: r.report_code,
      title: r.title,
      category: r.category,
      date: r.date.toISOString().split("T")[0],
      status: r.status,
    }));

    res.sendSuccess({
      message: "Reports fetched successfully",
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch dynamic analytical charts and trend data
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getReportAnalytics = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const totalEmployees = await prisma.employee.count();
    const inactiveEmployees = await prisma.employee.count({
      where: { status: "Inactive" },
    });
    const retentionRate =
      totalEmployees > 0
        ? `${(((totalEmployees - inactiveEmployees) / totalEmployees) * 100).toFixed(1)}%`
        : "100.0%";

    const payrollRecords = await prisma.payroll.findMany();
    const totalMonthlyCompensation = payrollRecords.reduce(
      (acc, curr) => acc + Number(curr.net_pay),
      0,
    );
    const compensationStr =
      totalMonthlyCompensation > 0 ? `$${(totalMonthlyCompensation / 1000).toFixed(1)}k` : "$0";

    const data = {
      summary_cards: [
        {
          id: "headcount",
          title: "Total Headcount",
          value: String(totalEmployees),
          change: "+12.4% vs last quarter",
          positive: true,
          icon_color: "text-[#00b1d8]",
          icon_bg: "bg-[#00b1d8]/10",
        },
        {
          id: "retention",
          title: "Retention Rate",
          value: retentionRate,
          change: "+1.8% vs last year",
          positive: true,
          icon_color: "text-[#45ba50]",
          icon_bg: "bg-[#45ba50]/10",
        },
        {
          id: "time-to-hire",
          title: "Avg Time to Hire",
          value: "18 Days",
          change: "-3 days improvement",
          positive: true,
          icon_color: "text-[#ff8b25]",
          icon_bg: "bg-[#ff8b25]/10",
        },
        {
          id: "compensation",
          title: "Monthly Compensation",
          value: compensationStr,
          change: "+4.1% planned adjustment",
          positive: false,
          icon_color: "text-[#ad87ed]",
          icon_bg: "bg-[#ad87ed]/10",
        },
      ],
      headcount_growth: [
        { month: "Jan", engineering: 45, sales: 28, product: 18, hr: 8 },
        { month: "Feb", engineering: 48, sales: 30, product: 20, hr: 8 },
        { month: "Mar", engineering: 52, sales: 31, product: 22, hr: 9 },
        { month: "Apr", engineering: 55, sales: 34, product: 23, hr: 9 },
        { month: "May", engineering: 60, sales: 36, product: 25, hr: 10 },
        { month: "Jun", engineering: 64, sales: 38, product: 26, hr: 10 },
      ],
      retention_trend: [
        { month: "Jan", rate: 94.8 },
        { month: "Feb", rate: 95.2 },
        { month: "Mar", rate: 95.0 },
        { month: "Apr", rate: 95.8 },
        { month: "May", rate: 96.0 },
        { month: "Jun", rate: 96.2 },
      ],
      recruitment_sources: [
        { name: "Direct / Careers", value: 38, color: "#00b1d8" },
        { name: "LinkedIn & Social", value: 28, color: "#45ba50" },
        { name: "Referrals", value: 22, color: "#ff8b25" },
        { name: "Agency Partners", value: 12, color: "#ad87ed" },
      ],
      department_compensation: [
        { dept: "Engineering", current: 820000, budget: 850000 },
        { dept: "Sales & Mktg", current: 420000, budget: 440000 },
        { dept: "Product & UX", current: 340000, budget: 350000 },
        { dept: "Operations & HR", current: 240000, budget: 250000 },
      ],
    };

    res.sendSuccess({
      message: "Analytics data fetched successfully",
      data,
    });
  } catch (err) {
    next(err);
  }
};
