import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", employees: 120, target: 110 },
  { name: "Feb", employees: 125, target: 115 },
  { name: "Mar", employees: 135, target: 120 },
  { name: "Apr", employees: 142, target: 125 },
  { name: "May", employees: 138, target: 130 },
  { name: "Jun", employees: 155, target: 135 },
  { name: "Jul", employees: 162, target: 140 },
  { name: "Aug", employees: 168, target: 145 },
  { name: "Sep", employees: 175, target: 150 },
  { name: "Oct", employees: 182, target: 155 },
  { name: "Nov", employees: 190, target: 160 },
  { name: "Dec", employees: 205, target: 165 },
];

export function WorkforceChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Workforce Growth Trend</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Monthly active employees vs target</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-chart-1"></div>
            <span className="text-muted-foreground">Employees</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-chart-2"></div>
            <span className="text-muted-foreground">Target</span>
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEmployees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                borderRadius: "8px",
                color: "var(--foreground)",
              }}
              itemStyle={{ color: "var(--foreground)" }}
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke="var(--chart-2)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTarget)"
            />
            <Area
              type="monotone"
              dataKey="employees"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorEmployees)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
