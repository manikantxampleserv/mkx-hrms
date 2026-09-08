export function DepartmentDistribution() {
  const departments = [
    { name: "Engineering", count: 82, percentage: 40, color: "bg-chart-1", delay: 0 },
    { name: "Sales", count: 56, percentage: 28, color: "bg-chart-2", delay: 150 },
    { name: "Marketing", count: 35, percentage: 18, color: "bg-chart-3", delay: 300 },
    { name: "HR & Ops", count: 17, percentage: 9, color: "bg-chart-4", delay: 450 },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 flex flex-col">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-foreground">Department Distribution</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Distribution by department</p>
      </div>
      
      <div className="space-y-5 flex-1">
        {departments.map((dept) => (
          <div key={dept.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{dept.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{dept.count}</span>
                <span className="text-sm font-semibold text-foreground">{dept.percentage}%</span>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${dept.color} rounded-full transition-all duration-1000 ease-out`} 
                style={{ width: `${dept.percentage}%`, transitionDelay: `${dept.delay}ms` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Workforce</span>
          <span className="text-xl font-bold text-foreground">205</span>
        </div>
      </div>
    </div>
  );
}
