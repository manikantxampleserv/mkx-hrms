import { AccessTime, Cancel, CheckCircle, MoreHoriz, Visibility } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputBase,
  MenuItem,
  Select,
} from "@mui/material";
import {
  Calendar,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  Filter,
  Search,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ArrowMenu } from "shared/ArrowMenu";
import { CustomDialog } from "shared/CustomDialog";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { CustomDateRangePicker } from "shared/DatePicker";
import { StatsCard } from "shared/StatsCard";
import { FadeUpItem, StaggerContainer } from "shared/animations";
import { downloadExcelFromApi } from "src/utils/exportToExcel";

/**
 * Type representing payroll disbursement status categories
 */
type PayrollStatusFilter = "All" | "Processed" | "Pending" | "On Hold";

import {
  useGetPayroll,
  useGetPayrollFilters,
  useGetPayrollStats,
  useUpdatePayrollStatus,
  useProcessBatchPayroll,
  type PayrollRecord,
} from "services/payroll";
import { RunPayrollDialog } from "./RunPayrollDialog";

const iconMap: Record<string, LucideIcon> = {
  Wallet,
  TrendingUp,
  Clock,
  Calendar,
};

/**
 * Filter tabs list
 */
const statusTabs: PayrollStatusFilter[] = ["All", "Processed", "Pending", "On Hold"];

/**
 * Props definition for PayrollRowActions component
 */
interface PayrollRowActionsProps {
  row: PayrollRecord;
  onUpdateStatus: (record: PayrollRecord, status: "Processed" | "Pending" | "On Hold") => void;
  onView: (record: PayrollRecord) => void;
}

/**
 * Dynamic row actions popup menu for Payroll entries
 *
 * @param props - Component configuration props
 * @returns Rendered action menu trigger and popup
 */
function PayrollRowActions({
  row,
  onUpdateStatus,
  onView,
}: PayrollRowActionsProps): React.ReactElement {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        className="!text-muted-foreground hover:!text-foreground"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <MoreHoriz />
      </IconButton>
      <ArrowMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        arrowPosition="right"
        paperClassName="!min-w-[160px]"
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onView(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70"
        >
          <Visibility className="!w-4 !h-4" />
          View Payslip
        </MenuItem>
        {row.status !== "Processed" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStatus(row, "Processed");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-emerald-500 hover:!bg-emerald-500/10"
          >
            <CheckCircle className="!w-4 !h-4 text-emerald-500" />
            <span className="font-medium text-emerald-500">Mark Processed</span>
          </MenuItem>
        )}
        {row.status !== "Pending" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStatus(row, "Pending");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-amber-500 hover:!bg-amber-500/10"
          >
            <AccessTime className="!w-4 !h-4 text-amber-500" />
            <span className="font-medium text-amber-500">Set Pending</span>
          </MenuItem>
        )}
        {row.status !== "On Hold" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStatus(row, "On Hold");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-destructive hover:!bg-destructive/10"
          >
            <Cancel className="!w-4 !h-4 text-destructive" />
            <span className="font-medium text-destructive">Put On Hold</span>
          </MenuItem>
        )}
      </ArrowMenu>
    </>
  );
}

/**
 * Generates dynamic column definitions for Payroll operations
 *
 * @param onUpdateStatus - Callback to update status
 * @param onView - Callback to inspect detailed payslip
 * @returns Column definitions list
 */
function getPayrollColumns(
  onUpdateStatus: (record: PayrollRecord, status: "Processed" | "Pending" | "On Hold") => void,
  onView: (record: PayrollRecord) => void,
): ColumnDef<PayrollRecord>[] {
  return [
    {
      header: "EMPLOYEE",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.avatar || undefined}
            variant="rounded"
            className="!bg-secondary !text-foreground shrink-0"
          >
            {row.name.charAt(0)}
          </Avatar>
          <div className="flex flex-col">
            <span
              onClick={() => onView(row)}
              className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {row.name}
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">{row.email}</span>
          </div>
        </div>
      ),
      width: "24%",
    },
    {
      header: "ROLE & DEPT",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">{row.role}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{row.department}</span>
        </div>
      ),
      width: "20%",
    },
    {
      header: "GROSS PAY",
      cell: (row) => (
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {row.gross_pay || row.base_salary}
        </span>
      ),
      width: "14%",
    },
    {
      header: "DEDUCTIONS",
      cell: (row) => (
        <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
          {row.total_deductions ? `-${row.total_deductions}` : "$0"}
        </span>
      ),
      width: "12%",
    },
    {
      header: "NET PAY",
      cell: (row) => <span className="text-sm font-bold text-foreground">{row.net_pay}</span>,
      width: "12%",
    },
    {
      header: "STATUS",
      cell: (row) => {
        if (row.status === "Processed") {
          return (
            <Chip
              icon={<CheckCircle className="!w-3.5 !h-3.5" />}
              label="Processed"
              size="small"
              color="success"
              variant="outlined"
              className="!h-6 !text-xs !bg-success/10 !border-success/20 !font-medium"
            />
          );
        }
        if (row.status === "Pending") {
          return (
            <Chip
              icon={<AccessTime className="!w-3.5 !h-3.5" />}
              label="Pending"
              size="small"
              color="warning"
              variant="outlined"
              className="!h-6 !text-xs !bg-warning/10 !border-warning/20 !font-medium"
            />
          );
        }
        return (
          <Chip
            icon={<Cancel className="!w-3.5 !h-3.5" />}
            label="On Hold"
            size="small"
            color="error"
            variant="outlined"
            className="!h-6 !text-xs !bg-destructive/10 !border-destructive/20 !font-medium"
          />
        );
      },
      width: "13%",
    },
    {
      header: "PAY DATE",
      cell: (row) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{row.pay_date}</span>
      ),
      width: "14%",
    },
    {
      header: "ACTION",
      cell: (row) => (
        <PayrollRowActions row={row} onUpdateStatus={onUpdateStatus} onView={onView} />
      ),
      width: "5%",
      align: "right",
    },
  ];
}

/**
 * Payroll page component providing salary disbursement, bonus calculations, and compliance records.
 */
export default function Payroll() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollStatusFilter>("All");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewingPayroll, setViewingPayroll] = useState<PayrollRecord | null>(null);

  const {
    data: payrollResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetPayroll({
    search: searchTerm,
    status: statusFilter,
    department: departmentFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: filtersResponse } = useGetPayrollFilters();
  const filterOptions = filtersResponse?.data;
  const { data: statsResponse, refetch: refetchStats } = useGetPayrollStats();

  const updatePayrollStatusMutation = useUpdatePayrollStatus(() => {
    refetch();
    refetchStats();
  });

  const [isRunPayrollOpen, setIsRunPayrollOpen] = useState(false);

  const processBatchMutation = useProcessBatchPayroll(() => {
    refetch();
    refetchStats();
  });

  /**
   * Updates payroll status with feedback toast
   */
  const handleUpdateStatus = async (
    record: PayrollRecord,
    status: "Processed" | "Pending" | "On Hold",
  ) => {
    await updatePayrollStatusMutation.mutateAsync({ id: record.id, status });
    if (viewingPayroll?.id === record.id) {
      setViewingPayroll((prev) => (prev ? { ...prev, status } : null));
    }
  };

  /**
   * Opens detailed payslip dialog for the selected payroll record
   */
  const handleView = (record: PayrollRecord) => {
    setViewingPayroll(record);
  };

  const payrollColumns = useMemo(
    () => getPayrollColumns(handleUpdateStatus, handleView),
    [handleUpdateStatus, handleView],
  );

  const records = useMemo(() => payrollResponse?.data || [], [payrollResponse]);

  const pendingRecords = useMemo(
    () => records.filter((r) => r.status === "Pending"),
    [records],
  );

  /**
   * Approves all pending disbursements in the current batch
   */
  const handleApproveAllPending = () => {
    const pendingIds = pendingRecords
      .map((r) => r.db_id)
      .filter((id): id is number => typeof id === "number");
    if (pendingIds.length === 0) return;
    processBatchMutation.mutate({
      payroll_ids: pendingIds,
      status: "Processed",
    });
  };

  /**
   * Dynamic departments available in the Payroll directory
   */
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>(filterOptions?.departments || []);
    records.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    if (departmentFilter !== "All") set.add(departmentFilter);
    return Array.from(set);
  }, [filterOptions?.departments, records, departmentFilter]);

  const activeKpiCards = useMemo(() => {
    return (statsResponse?.data || []).map((card) => ({
      id: card.id,
      title: card.title,
      value: card.value,
      subtext: card.subtext,
      icon: iconMap[card.icon_name] || Wallet,
      icon_color: card.icon_color,
      icon_bg: card.icon_bg,
    }));
  }, [statsResponse]);

  /**
   * Filtered payroll list
   */
  const filteredPayroll = useMemo(() => {
    return records.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  return (
    <StaggerContainer className="space-y-4">
      <FadeUpItem className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeKpiCards.map((card) => (
          <StatsCard
            key={card.id}
            title={card.title}
            value={card.value}
            subtext={card.subtext}
            icon={card.icon}
            iconBg={card.icon_bg}
            iconColor={card.icon_color}
          />
        ))}
      </FadeUpItem>

      <FadeUpItem>
        <p className="text-sm text-muted-foreground">
          Manage salary disbursements, deductions, and payment records
        </p>
      </FadeUpItem>

      <FadeUpItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <InputBase
            placeholder="Search payroll records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-9 pl-3 pr-4 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all duration-200"
            startAdornment={
              <InputAdornment position="start">
                <Search className="w-4 h-4 text-muted-foreground" />
              </InputAdornment>
            }
          />

          <div className="flex items-center gap-1 bg-card/60 p-0.5 h-9 rounded-[5px] border border-border/50 box-border">
            {statusTabs.map((status) => (
              <Button
                key={status}
                size="small"
                onClick={() => setStatusFilter(status)}
                className={`${
                  statusFilter === status
                    ? "!bg-accent !text-accent-foreground"
                    : "!text-muted-foreground"
                }`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingRecords.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleApproveAllPending}
              disabled={processBatchMutation.isPending}
              startIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
              className="!border-emerald-500/30 !bg-emerald-500/10 !text-emerald-600 dark:!text-emerald-400 !text-xs !normal-case !font-semibold !px-3.5 !py-2 !rounded-[5px]"
            >
              {processBatchMutation.isPending
                ? "Processing..."
                : `Approve Batch (${pendingRecords.length})`}
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={() => setIsRunPayrollOpen(true)}
            startIcon={<CreditCard className="w-3.5 h-3.5" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-3.5 !py-2 !rounded-[5px] shadow-sm"
          >
            Run Payroll
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => downloadExcelFromApi("/v1/payroll/export", "Payroll_Summary.xlsx")}
            startIcon={<Download className="w-3.5 h-3.5 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px]"
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            startIcon={<Filter className="w-3.5 h-3.5 text-muted-foreground" />}
            endIcon={<ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px]"
          >
            More filters
          </Button>
          <ArrowMenu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
            arrowPosition="right"
            arrowOffsetY={-6}
            paperClassName="!min-w-[280px] !p-3"
          >
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Advanced Filters
            </div>

            <div className="flex flex-col gap-3">
              <FormControl size="small" fullWidth>
                <Select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="!rounded-[5px] !text-sm"
                >
                  <MenuItem value="All" className="!text-sm">
                    All Departments
                  </MenuItem>
                  {uniqueDepartments.map((dept) => (
                    <MenuItem key={dept} value={dept} className="!text-sm">
                      {dept}
                    </MenuItem>
                  ))}
                  {departmentFilter !== "All" && !uniqueDepartments.includes(departmentFilter) && (
                    <MenuItem value={departmentFilter} className="!text-sm">
                      {departmentFilter}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Pay Date Range
                </span>
                <CustomDateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="small"
                  onClick={() => {
                    setDepartmentFilter("All");
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="!text-xs !normal-case !text-muted-foreground hover:!text-foreground"
                >
                  Clear all
                </Button>
              </div>
            </div>
          </ArrowMenu>
        </div>
      </FadeUpItem>

      <FadeUpItem>
        <DataTable
          data={filteredPayroll}
          columns={payrollColumns}
          pageSize={8}
          loading={isLoading || isFetching}
        />
      </FadeUpItem>

      {viewingPayroll && (
        <CustomDialog
          open={Boolean(viewingPayroll)}
          onClose={() => setViewingPayroll(null)}
          title="Employee Payslip Breakdown"
          maxWidth="xs"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Avatar
              src={viewingPayroll.avatar || undefined}
              className="!w-12 !h-12 !bg-primary/20 !text-primary !text-lg !font-bold"
            >
              {viewingPayroll.name.charAt(0)}
            </Avatar>
            <div>
              <h4 className="text-base font-semibold text-foreground">{viewingPayroll.name}</h4>
              <p className="text-xs text-muted-foreground">
                {viewingPayroll.email} • {viewingPayroll.role}
              </p>
              <p className="text-xs text-muted-foreground">{viewingPayroll.department}</p>
            </div>
            <div className="ml-auto">
              <Chip
                label={viewingPayroll.status}
                size="small"
                color={
                  viewingPayroll.status === "Processed"
                    ? "success"
                    : viewingPayroll.status === "Pending"
                      ? "warning"
                      : "error"
                }
                variant="outlined"
                className="!text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            {/* Days calculation bar */}
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-secondary/30 rounded-[5px] text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground block">Working Days</span>
                <span className="font-semibold text-foreground">{viewingPayroll.working_days ?? 30} d</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Paid Days</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{viewingPayroll.paid_days ?? 30} d</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">LOP Days</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">{viewingPayroll.lop_days ?? 0} d</span>
              </div>
            </div>

            {/* Itemized Line Items Breakdown */}
            {viewingPayroll.items && viewingPayroll.items.length > 0 ? (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Earnings & Allowances
                  </span>
                  <div className="space-y-1">
                    {viewingPayroll.items
                      .filter((it) => it.category === "Earning")
                      .map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-secondary/40 rounded-[4px]">
                          <span className="text-foreground font-medium">{it.name}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            +${Number(it.amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {viewingPayroll.items.some((it) => it.category === "Deduction") && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                      Deductions & Losses
                    </span>
                    <div className="space-y-1">
                      {viewingPayroll.items
                        .filter((it) => it.category === "Deduction")
                        .map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2 bg-secondary/40 rounded-[4px]">
                            <span className="text-foreground font-medium">{it.name}</span>
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              -${Number(it.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs p-2.5 bg-secondary/40 rounded-[5px]">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span className="font-semibold text-foreground">{viewingPayroll.gross_pay || viewingPayroll.base_salary}</span>
                </div>
                <div className="flex justify-between items-center text-xs p-2.5 bg-secondary/40 rounded-[5px]">
                  <span className="text-muted-foreground">Allowance</span>
                  <span className="font-semibold text-emerald-500">+{viewingPayroll.allowance || "$0"}</span>
                </div>
              </div>
            )}

            {/* Payout Summary */}
            <div className="flex justify-between items-center text-xs p-3 bg-primary/10 border border-primary/20 rounded-[5px]">
              <div>
                <span className="font-bold text-foreground block">Net Disbursed Pay</span>
                <span className="text-[10px] text-muted-foreground">Pay Date: {viewingPayroll.pay_date}</span>
              </div>
              <span className="text-base font-bold text-primary">{viewingPayroll.net_pay}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Update Disbursement Status
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="small"
                variant={viewingPayroll.status === "Processed" ? "contained" : "outlined"}
                color="success"
                onClick={() => handleUpdateStatus(viewingPayroll, "Processed")}
                className="!text-xs !normal-case"
              >
                Mark Processed
              </Button>
              <Button
                size="small"
                variant={viewingPayroll.status === "Pending" ? "contained" : "outlined"}
                color="warning"
                onClick={() => handleUpdateStatus(viewingPayroll, "Pending")}
                className="!text-xs !normal-case"
              >
                Set Pending
              </Button>
              <Button
                size="small"
                variant={viewingPayroll.status === "On Hold" ? "contained" : "outlined"}
                color="error"
                onClick={() => handleUpdateStatus(viewingPayroll, "On Hold")}
                className="!text-xs !normal-case"
              >
                Put On Hold
              </Button>
            </div>
          </div>
        </CustomDialog>
      )}

      <RunPayrollDialog
        open={isRunPayrollOpen}
        onClose={() => setIsRunPayrollOpen(false)}
        onSuccess={() => {
          refetch();
          refetchStats();
        }}
      />
    </StaggerContainer>
  );
}
