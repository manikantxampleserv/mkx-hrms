import {
  CalendarMonth,
  CheckCircle,
  Paid,
  Visibility,
  WarningAmber,
} from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { type Employee } from "services/employees";
import {
  useGeneratePayroll,
  type PayrollPreviewData,
  type PayrollPreviewItem,
} from "services/payroll";
import { CustomDialog } from "shared/CustomDialog";
import { Select, type SelectOption } from "shared/Select";

/**
 * Months option list for the payroll generation selector
 */
const monthOptions: SelectOption[] = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

/**
 * Years option list for payroll generation
 */
const currentYear = new Date().getFullYear();
const yearOptions: SelectOption[] = [
  { label: String(currentYear - 1), value: currentYear - 1 },
  { label: String(currentYear), value: currentYear },
  { label: String(currentYear + 1), value: currentYear + 1 },
];

/**
 * Properties for GenerateEmployeeSalaryDialog
 */
export interface GenerateEmployeeSalaryDialogProps {
  /** Whether the dialog modal is visible */
  open: boolean;
  /** Close handler callback */
  onClose: () => void;
  /** Target employee record for salary generation */
  employee: Employee;
  /** Callback fired when salary is successfully generated */
  onSuccess?: () => void;
}

/**
 * Dialog component enabling HR and Payroll managers to calculate, preview,
 * and finalize monthly salary generation for a specific employee.
 *
 * @param props - Dialog properties
 * @returns React dialog element
 */
export const GenerateEmployeeSalaryDialog: React.FC<GenerateEmployeeSalaryDialogProps> = ({
  open,
  onClose,
  employee,
  onSuccess,
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [previewItem, setPreviewItem] = useState<PayrollPreviewItem | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  const generatePayroll = useGeneratePayroll();

  /**
   * Triggers calculation preview without committing records to the database
   */
  const handleCalculatePreview = async () => {
    if (!employee.db_id) return;
    setIsPreviewing(true);
    setPreviewError(null);
    setPreviewItem(null);

    try {
      const response = await generatePayroll.mutateAsync({
        month: selectedMonth,
        year: selectedYear,
        employee_ids: [employee.db_id],
        preview: true,
      });

      const previewData = response.data as PayrollPreviewData | undefined;
      if (previewData?.records && previewData.records.length > 0) {
        setPreviewItem(previewData.records[0]);
      } else {
        setPreviewError("No calculation data returned for this employee.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to calculate payroll preview.";
      setPreviewError(message);
    } finally {
      setIsPreviewing(false);
    }
  };

  /**
   * Finalizes and persists official salary disbursement record
   */
  const handleConfirmGenerate = async () => {
    if (!employee.db_id) return;

    try {
      await generatePayroll.mutateAsync({
        month: selectedMonth,
        year: selectedYear,
        employee_ids: [employee.db_id],
        preview: false,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch {
      /** Error handled by toast */
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={`Generate Salary — ${employee.name}`}
      maxWidth="sm"
      actions={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            disabled={generatePayroll.isPending}
            className="!border-border !text-muted-foreground hover:!text-foreground !text-xs !normal-case !rounded-[5px]"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              onClick={handleCalculatePreview}
              disabled={isPreviewing || generatePayroll.isPending}
              startIcon={
                isPreviewing ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Visibility className="!w-4 !h-4" />
                )
              }
              className="!border-primary !text-primary hover:!bg-primary/10 !text-xs !normal-case !font-medium !rounded-[5px]"
            >
              {isPreviewing ? "Calculating..." : "Preview Calculation"}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleConfirmGenerate}
              disabled={generatePayroll.isPending}
              startIcon={
                generatePayroll.isPending ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Paid className="!w-4 !h-4" />
                )
              }
              className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !rounded-[5px] shadow-sm"
            >
              {generatePayroll.isPending ? "Generating..." : "Generate & Save"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="p-3 bg-secondary/30 rounded-[5px] border border-border text-xs flex items-center justify-between">
          <div>
            <span className="text-muted-foreground block text-[11px]">Employee Identifier</span>
            <span className="font-semibold text-foreground">{employee.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Department</span>
            <span className="font-semibold text-foreground">{employee.department}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Work Shift</span>
            <span className="font-semibold text-foreground">
              {employee.shift || "General Shift"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            name="month"
            label="Payroll Month"
            options={monthOptions}
            value={selectedMonth}
            onValueChange={(val) => setSelectedMonth(Number(val))}
            size="small"
          />
          <Select
            name="year"
            label="Payroll Year"
            options={yearOptions}
            value={selectedYear}
            onValueChange={(val) => setSelectedYear(Number(val))}
            size="small"
          />
        </div>

        {previewError && (
          <div className="p-3 rounded-[5px] bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-xs text-destructive">
            <WarningAmber className="!w-4 !h-4 shrink-0" />
            <span>{previewError}</span>
          </div>
        )}

        {previewItem ? (
          <div className="flex flex-col gap-3 p-3.5 rounded-[5px] bg-secondary/20 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="!w-4 !h-4 text-emerald-500" />
                <span className="font-semibold text-xs text-foreground">Calculation Breakdown</span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {monthOptions.find((m) => m.value === selectedMonth)?.label} {selectedYear}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
              <div className="p-2 bg-card rounded border border-border/70">
                <span className="text-[10px] text-muted-foreground block">Working Days</span>
                <span className="font-bold text-foreground">{previewItem.working_days}</span>
              </div>
              <div className="p-2 bg-card rounded border border-border/70">
                <span className="text-[10px] text-muted-foreground block">Paid Days</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {previewItem.paid_days}
                </span>
              </div>
              <div className="p-2 bg-card rounded border border-border/70">
                <span className="text-[10px] text-muted-foreground block">LOP Days</span>
                <span
                  className={`font-bold ${
                    previewItem.lop_days > 0 ? "text-rose-500" : "text-foreground"
                  }`}
                >
                  {previewItem.lop_days}
                </span>
              </div>
            </div>

            {previewItem.items && previewItem.items.length > 0 && (
              <div className="border border-border rounded overflow-hidden text-xs bg-card">
                <div className="bg-secondary/40 px-3 py-1.5 font-semibold text-[11px] text-muted-foreground border-b border-border flex justify-between">
                  <span>Component</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-border/60 max-h-40 overflow-y-auto">
                  {previewItem.items.map((item, idx) => (
                    <div key={idx} className="px-3 py-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                            item.category === "Deduction"
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-emerald-500/10 text-emerald-500"
                          }`}
                        >
                          {item.category === "Deduction" ? "DED" : "EARN"}
                        </span>
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <span
                        className={`font-medium ${
                          item.category === "Deduction"
                            ? "text-rose-500"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {item.category === "Deduction" ? "-" : ""}${item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {previewItem.lop_amount > 0 && (
                    <div className="px-3 py-1.5 flex items-center justify-between bg-rose-500/5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-500/10 text-rose-500">
                          DED
                        </span>
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          Loss of Pay (LOP)
                        </span>
                      </div>
                      <span className="font-medium text-rose-500">
                        -${previewItem.lop_amount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Gross Pay</span>
                <span className="font-bold text-foreground">
                  ${previewItem.gross_pay.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Total Deductions</span>
                <span className="font-bold text-rose-500">
                  -${previewItem.total_deductions.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Net Monthly Salary</span>
                <span className="font-bold text-primary text-sm">
                  ${previewItem.net_pay.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center border border-dashed border-border rounded-[5px] bg-secondary/10 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <CalendarMonth className="!w-8 !h-8 text-muted-foreground/40" />
            <span>
              Select the payroll month and year, then click &quot;Preview Calculation&quot; to inspect
              attendance days, LOP, and salary components before generation.
            </span>
          </div>
        )}
      </div>
    </CustomDialog>
  );
};
