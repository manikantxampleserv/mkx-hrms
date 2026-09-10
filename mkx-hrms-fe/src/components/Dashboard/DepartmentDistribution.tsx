import React, { useMemo } from "react";
import { useGetEmployees } from "services/employees";
import { useGetMasterDepartments } from "services/masters";

/**
 * Chart color palette cycle for dynamic department bars
 */
const chartColors = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

/**
 * Dynamic Department Distribution widget displaying real workforce allocation by department
 *
 * @returns Rendered dynamic department distribution widget
 */
export function DepartmentDistribution(): React.ReactElement {
  const { data: employeesResponse, isLoading: isEmployeesLoading } = useGetEmployees();
  const { data: departmentsResponse, isLoading: isDeptsLoading } = useGetMasterDepartments();

  const { departmentList, totalCount } = useMemo(() => {
    const employees = employeesResponse?.data || [];
    const masterDepts = departmentsResponse?.data || [];
    const total = employees.length;

    /** Count employees per department */
    const countsMap = new Map<string, number>();

    /** Initialize with all active master departments */
    masterDepts.forEach((d) => {
      if (d.status === "Active") {
        countsMap.set(d.name, 0);
      }
    });

    /** Aggregate employee assignments */
    employees.forEach((emp) => {
      if (emp.department) {
        countsMap.set(emp.department, (countsMap.get(emp.department) || 0) + 1);
      }
    });

    /** Sort by count descending */
    const sorted = Array.from(countsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: chartColors[index % chartColors.length],
        delay: index * 100,
      }));

    return {
      departmentList: sorted.length > 0 ? sorted.slice(0, 5) : [],
      totalCount: total,
    };
  }, [employeesResponse?.data, departmentsResponse?.data]);

  const isLoading = isEmployeesLoading || isDeptsLoading;

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 flex flex-col">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-foreground">Department Distribution</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Workforce allocation by department</p>
      </div>

      <div className="space-y-5 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col gap-4 py-8">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        ) : departmentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs">
            No departments configured yet
          </div>
        ) : (
          departmentList.map((dept) => (
            <div key={dept.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                  {dept.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{dept.count}</span>
                  <span className="text-sm font-semibold text-foreground">{dept.percentage}%</span>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${dept.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.max(dept.percentage, dept.count > 0 ? 4 : 0)}%`, transitionDelay: `${dept.delay}ms` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Workforce</span>
          <span className="text-xl font-bold text-foreground">{totalCount}</span>
        </div>
      </div>
    </div>
  );
}

export default DepartmentDistribution;
