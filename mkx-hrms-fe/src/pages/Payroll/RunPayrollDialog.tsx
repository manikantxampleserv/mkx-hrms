import React, { useState, useMemo } from "react";
import { Button, CircularProgress, Chip, Alert } from "@mui/material";
import {
  Visibility,
  CheckCircle,
  AccountBalanceWallet,
  TrendingDown,
  TrendingUp,
  People,
} from "@mui/icons-material";
import { CustomDialog } from "shared/CustomDialog";
import { Select, type SelectOption } from "shared/Select";
import { StatsCard } from "shared/StatsCard";
import {
  useGeneratePayroll,
  type PayrollPreviewData,
  type PayrollPreviewItem,
} from "services/payroll";
import { useGetMasterDepartments } from "services/masters";

/**
 * Props definition for the RunPayrollDialog component
 */
export interface RunPayrollDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

/**
 * Modern interactive dialog for executing payroll batches with preview dry-run and itemized inspection
 *
 * @param props - Dialog props
 * @returns The rendered RunPayrollDialog
 */
export const RunPayrollDialog: React.FC<RunPayrollDialogProps> = ({ open, onClose, onSuccess }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [previewData, setPreviewData] = useState<PayrollPreviewData | null>(null);
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<number | null>(null);

  const { data: departmentsResponse } = useGetMasterDepartments();
  const departments = departmentsResponse?.data || [];

  const generateMutation = useGeneratePayroll((res) => {
    const data = res.data as PayrollPreviewData;
    if (data && "records" in data) {
      setPreviewData(data);
    } else {
      onSuccess();
      handleClose();
    }
  });

  /**
   * Safe close handler resetting preview state
   */
  const handleClose = () => {
    setPreviewData(null);
    setExpandedEmployeeId(null);
    onClose();
  };

  /**
   * Trigger preview dry run calculation without database commit
   */
  const handleCalculatePreview = () => {
    generateMutation.mutate({
      month: selectedMonth,
      year: selectedYear,
      department_id: selectedDeptId ? Number(selectedDeptId) : undefined,
      preview: true,
    });
  };

  /**
   * Final confirmation to persist payroll batch to database
   */
  const handleCommitPayroll = () => {
    generateMutation.mutate({
      month: selectedMonth,
      year: selectedYear,
      department_id: selectedDeptId ? Number(selectedDeptId) : undefined,
      preview: false,
    });
  };

  const selectedMonthLabel = useMemo(
    () => months.find((m) => m.value === selectedMonth)?.label || "Selected Month",
    [selectedMonth],
  );

  const monthOptions: SelectOption[] = useMemo(
    () =>
      months.map((m) => ({
        label: m.label,
        value: m.value,
      })),
    [],
  );

  const yearOptions: SelectOption[] = useMemo(
    () => [
      { label: "2025", value: 2025 },
      { label: "2026", value: 2026 },
      { label: "2027", value: 2027 },
    ],
    [],
  );

  const departmentOptions: SelectOption[] = useMemo(
    () => [
      { label: "All Departments", value: "" },
      ...departments.map((d) => ({
        label: d.name,
        value: String(d.id),
      })),
    ],
    [departments],
  );

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      paperClassName="!rounded-lg !border !border-border !bg-card !text-foreground shadow-2xl overflow-hidden"
      contentClassName="!p-6 space-y-6"
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <AccountBalanceWallet className="!w-5 !h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Run Monthly Payroll Batch</h3>
            <p className="text-xs text-muted-foreground">
              Calculate salary components, pro-rated loss of pay (LOP), and generate itemized
              payslips
            </p>
          </div>
        </div>
      }
      actions={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={generateMutation.isPending}
            className="!text-xs !normal-case !border-border !text-muted-foreground hover:!text-foreground"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              onClick={handleCalculatePreview}
              disabled={generateMutation.isPending}
              startIcon={
                generateMutation.isPending ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Visibility className="!w-4 !h-4" />
                )
              }
              className="!text-xs !normal-case !border-primary !text-primary hover:!bg-primary/10"
            >
              {generateMutation.isPending ? "Calculating..." : "Calculate Preview"}
            </Button>

            {previewData && (
              <Button
                variant="contained"
                onClick={handleCommitPayroll}
                disabled={generateMutation.isPending || previewData.employee_count === 0}
                startIcon={
                  generateMutation.isPending ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <CheckCircle className="!w-4 !h-4" />
                  )
                }
                className="!text-xs !normal-case !bg-primary !text-primary-foreground hover:!bg-primary/90 font-semibold"
              >
                {generateMutation.isPending
                  ? "Disbursing..."
                  : `Confirm & Generate (${selectedMonthLabel} ${selectedYear})`}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-secondary/30 border border-border">
          <Select
            name="month"
            label="Payroll Cycle Month"
            options={monthOptions}
            value={selectedMonth}
            onValueChange={(val) => {
              setSelectedMonth(Number(val));
              setPreviewData(null);
            }}
          />

          <Select
            name="year"
            label="Payroll Cycle Year"
            options={yearOptions}
            value={selectedYear}
            onValueChange={(val) => {
              setSelectedYear(Number(val));
              setPreviewData(null);
            }}
          />

          <Select
            name="department_id"
            label="Filter Department"
            options={departmentOptions}
            value={selectedDeptId}
            onValueChange={(val) => {
              setSelectedDeptId(String(val));
              setPreviewData(null);
            }}
          />
        </div>

        {previewData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatsCard
                title="Eligible Staff"
                value={previewData.employee_count}
                subtext="Active workforce"
                icon={People}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                className="p-3.5 !rounded-lg"
              />

              <StatsCard
                title="Total Gross"
                value={`$${previewData.total_gross.toLocaleString()}`}
                subtext="Earnings & allowances"
                icon={TrendingUp}
                iconColor="text-emerald-500"
                iconBg="bg-emerald-500/10"
                className="p-3.5 !rounded-lg"
              />

              <StatsCard
                title="Deductions & LOP"
                value={`-$${previewData.total_deductions.toLocaleString()}`}
                subtext="Statutory & unpaid leave"
                icon={TrendingDown}
                iconColor="text-rose-500"
                iconBg="bg-rose-500/10"
                className="p-3.5 !rounded-lg"
              />

              <StatsCard
                title="Net Disbursed"
                value={`$${previewData.total_net.toLocaleString()}`}
                subtext="Final payout total"
                icon={AccountBalanceWallet}
                iconColor="text-primary"
                iconBg="bg-primary/10"
                className="p-3.5 !rounded-lg"
              />
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Individual Calculation Breakdown ({previewData.records.length} Employees)
                </span>
                <span className="text-xs text-muted-foreground">
                  Cycle Days: {previewData.days_in_month}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {previewData.records.map((emp: PayrollPreviewItem) => {
                  const isExpanded = expandedEmployeeId === emp.employee_id;
                  return (
                    <div
                      key={emp.employee_id}
                      className="p-3 bg-background hover:bg-secondary/20 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex flex-col min-w-[160px]">
                          <span className="font-semibold text-foreground">{emp.employee_name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {emp.employee_code} • {emp.department} • {emp.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <span className="text-[11px] text-muted-foreground block">
                              Paid / LOP Days
                            </span>
                            <span className="font-medium text-foreground">
                              {emp.paid_days} / {emp.lop_days} d
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">
                              Gross Pay
                            </span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              ${emp.gross_pay.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-muted-foreground block">
                              Deductions
                            </span>
                            <span className="font-medium text-rose-600 dark:text-rose-400">
                              -${emp.total_deductions.toLocaleString()}
                            </span>
                          </div>

                          <div className="text-right min-w-[80px]">
                            <span className="text-[11px] text-muted-foreground block">Net Pay</span>
                            <span className="font-bold text-foreground">
                              ${emp.net_pay.toLocaleString()}
                            </span>
                          </div>

                          <Button
                            size="small"
                            variant="text"
                            onClick={() =>
                              setExpandedEmployeeId(isExpanded ? null : emp.employee_id)
                            }
                            className="!text-xs !normal-case !text-primary !min-w-0 !px-2"
                          >
                            {isExpanded ? "Hide" : "Details"}
                          </Button>
                        </div>
                      </div>

                      {emp.warnings && emp.warnings.length > 0 && (
                        <div className="mt-2">
                          <Chip
                            label={emp.warnings.join(", ")}
                            size="small"
                            color="warning"
                            variant="outlined"
                            className="!text-[10px] !h-5"
                          />
                        </div>
                      )}

                      {isExpanded && (
                        <div className="mt-3 p-3 rounded-md bg-secondary/30 border border-border/80 space-y-2">
                          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                            Assigned Component Breakdown
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {emp.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded bg-background border border-border/60 text-xs"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                                      it.category === "Deduction"
                                        ? "bg-rose-500/15 text-rose-500"
                                        : "bg-emerald-500/15 text-emerald-500"
                                    }`}
                                  >
                                    {it.category === "Deduction" ? "DED" : "EARN"}
                                  </span>
                                  <span className="font-medium text-foreground">{it.name}</span>
                                </div>
                                <span
                                  className={`font-semibold ${
                                    it.category === "Deduction"
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-foreground"
                                  }`}
                                >
                                  {it.category === "Deduction" ? "-" : ""}$
                                  {Number(it.amount).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!previewData && (
          <Alert
            severity="info"
            className="!bg-secondary/40 !border !border-border !text-foreground !text-xs"
          >
            Select the month, year, and target department above, then click{" "}
            <strong>Calculate Preview</strong> to inspect all employee salary computations and
            unpaid leave deductions before generating.
          </Alert>
        )}
      </div>
    </CustomDialog>
  );
};

export default RunPayrollDialog;
