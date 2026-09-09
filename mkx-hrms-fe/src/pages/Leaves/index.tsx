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
  Activity,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Filter,
  Search,
  type LucideIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  useGetLeaveFilters,
  useGetLeaves,
  useGetLeaveStats,
  useUpdateLeaveStatus,
  type LeaveRequest,
} from "services/leaves";
import { ArrowMenu } from "shared/ArrowMenu";
import { CustomDialog } from "shared/CustomDialog";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { CustomDateRangePicker } from "shared/DatePicker";
import { StatsCard } from "shared/StatsCard";
import { FadeUpItem, StaggerContainer } from "shared/animations";
import { downloadExcelFromApi } from "src/utils/exportToExcel";

/**
 * Type representing leave request status categories
 */
type LeaveStatusFilter = "All" | "Pending" | "Approved" | "Rejected";

const iconMap: Record<string, LucideIcon> = {
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
};

const statusTabs: LeaveStatusFilter[] = ["All", "Pending", "Approved", "Rejected"];

/**
 * Props for LeaveRowActions component
 */
interface LeaveRowActionsProps {
  row: LeaveRequest;
  onApprove: (leave: LeaveRequest) => void;
  onReject: (leave: LeaveRequest) => void;
  onView: (leave: LeaveRequest) => void;
}

/**
 * Dynamic row actions popup menu for Leave Requests
 *
 * @param props - Component configuration props
 * @returns Rendered action menu trigger and popup
 */
function LeaveRowActions({
  row,
  onApprove,
  onReject,
  onView,
}: LeaveRowActionsProps): React.ReactElement {
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
        paperClassName="!min-w-[150px]"
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onView(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70"
        >
          <Visibility className="!w-4 !h-4" />
          View Details
        </MenuItem>
        {row.status !== "Approved" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onApprove(row);
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-emerald-500 hover:!bg-emerald-500/10"
          >
            <CheckCircle className="!w-4 !h-4 text-emerald-500" />
            <span className="font-medium text-emerald-500">Approve</span>
          </MenuItem>
        )}
        {row.status !== "Rejected" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onReject(row);
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-destructive hover:!bg-destructive/10"
          >
            <Cancel className="!w-4 !h-4 text-destructive" />
            <span className="font-medium text-destructive">Reject</span>
          </MenuItem>
        )}
      </ArrowMenu>
    </>
  );
}

/**
 * Generates column definitions for Leaves table
 *
 * @param onApprove - Callback to approve leave
 * @param onReject - Callback to reject leave
 * @param onView - Callback to view details
 * @returns Column definitions
 */
function getLeaveColumns(
  onApprove: (leave: LeaveRequest) => void,
  onReject: (leave: LeaveRequest) => void,
  onView: (leave: LeaveRequest) => void,
): ColumnDef<LeaveRequest>[] {
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
            <span className="text-xs text-muted-foreground mt-0.5">{row.department}</span>
          </div>
        </div>
      ),
      width: "24%",
    },
    {
      header: "LEAVE TYPE",
      cell: (row) => (
        <div className="px-2.5 py-1 rounded-[5px] text-xs font-medium bg-secondary text-foreground w-fit">
          {row.leave_type}
        </div>
      ),
      width: "16%",
    },
    {
      header: "DURATION",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {row.start_date} - {row.end_date}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            {row.days_count} {row.days_count === 1 ? "day" : "days"}
          </span>
        </div>
      ),
      width: "20%",
    },
    {
      header: "REASON",
      cell: (row) => (
        <span className="text-xs text-muted-foreground line-clamp-1">{row.reason}</span>
      ),
      width: "18%",
    },
    {
      header: "STATUS",
      cell: (row) => {
        if (row.status === "Approved") {
          return (
            <Chip
              icon={<CheckCircle className="!w-3.5 !h-3.5" />}
              label="Approved"
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
            label="Rejected"
            size="small"
            color="error"
            variant="outlined"
            className="!h-6 !text-xs !bg-destructive/10 !border-destructive/20 !font-medium"
          />
        );
      },
      width: "12%",
    },
    {
      header: "APPLIED ON",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.applied_on}</span>,
      width: "10%",
    },
    {
      header: "ACTION",
      cell: (row) => (
        <LeaveRowActions row={row} onApprove={onApprove} onReject={onReject} onView={onView} />
      ),
      width: "6%",
      align: "right",
    },
  ];
}

/**
 * Leaves page component providing PTO, casual, and sick leave administration
 *
 * @returns Rendered Leaves page
 */
export default function Leaves(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeaveStatusFilter>("All");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [viewingLeave, setViewingLeave] = useState<LeaveRequest | null>(null);

  const {
    data: leavesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetLeaves({
    search: searchTerm,
    status: statusFilter,
    department: departmentFilter,
    leaveType: leaveTypeFilter,
    startDate,
    endDate,
  });

  const { data: statsResponse } = useGetLeaveStats();
  const { data: filterOptionsResponse } = useGetLeaveFilters();

  const updateLeaveStatusMutation = useUpdateLeaveStatus(() => {
    refetch();
  });

  const leaves = useMemo(() => leavesResponse?.data || [], [leavesResponse]);
  const stats = statsResponse?.data;
  const filterOptions = filterOptionsResponse?.data;

  const handleApprove = async (leave: LeaveRequest) => {
    await updateLeaveStatusMutation.mutateAsync({ id: leave.id, status: "Approved" });
    if (viewingLeave?.id === leave.id) {
      setViewingLeave((prev) => (prev ? { ...prev, status: "Approved" } : null));
    }
  };

  const handleReject = async (leave: LeaveRequest) => {
    await updateLeaveStatusMutation.mutateAsync({ id: leave.id, status: "Rejected" });
    if (viewingLeave?.id === leave.id) {
      setViewingLeave((prev) => (prev ? { ...prev, status: "Rejected" } : null));
    }
  };

  const handleView = (leave: LeaveRequest) => {
    setViewingLeave(leave);
  };

  const leaveColumns = useMemo(
    () => getLeaveColumns(handleApprove, handleReject, handleView),
    [leaves],
  );

  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      const matchesSearch =
        leave.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.leave_type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || leave.status === statusFilter;
      const matchesDept = departmentFilter === "All" || leave.department === departmentFilter;
      const matchesType = leaveTypeFilter === "All" || leave.leave_type === leaveTypeFilter;

      return matchesSearch && matchesStatus && matchesDept && matchesType;
    });
  }, [leaves, searchTerm, statusFilter, departmentFilter, leaveTypeFilter]);

  const activeFiltersCount = [
    departmentFilter !== "All",
    leaveTypeFilter !== "All",
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  return (
    <StaggerContainer className="space-y-4">
      <FadeUpItem className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats &&
          stats.map((card) => {
            const IconComponent = iconMap[card.icon_name] || Activity;
            return (
              <StatsCard
                key={card.id}
                title={card.title}
                value={card.value}
                subtext={card.subtext}
                icon={IconComponent}
                iconBg={card.icon_bg}
                iconColor={card.icon_color}
              />
            );
          })}
      </FadeUpItem>

      <FadeUpItem>
        <p className="text-sm text-muted-foreground">
          Review, approve, and track employee time-off and leave quotas
        </p>
      </FadeUpItem>

      <FadeUpItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <InputBase
            placeholder="Search leaves..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-9 pl-3 pr-4 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all duration-200"
            startAdornment={
              <InputAdornment position="start">
                <Search className="!w-4 !h-4 text-muted-foreground" />
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
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            startIcon={<Filter className="!w-4 !h-4 text-muted-foreground" />}
            endIcon={<ChevronDown className="!w-4 !h-4 text-muted-foreground" />}
            className={`!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px] ${
              activeFiltersCount > 0 ? "!border-primary/50 !text-primary" : ""
            }`}
          >
            More filters
            {activeFiltersCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] rounded-full font-semibold">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => downloadExcelFromApi("/v1/leaves/export", "Leaves_Log.xlsx")}
            startIcon={<Download className="!w-4 !h-4 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px]"
          >
            Export
          </Button>

          <ArrowMenu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
            arrowPosition="right"
            paperClassName="!w-80 !p-4"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Filter Leaves
                </span>
                {activeFiltersCount > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {activeFiltersCount} active
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Department
                </span>
                <FormControl fullWidth size="small">
                  <Select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="!bg-secondary !text-xs !rounded-[5px] [&_.MuiSelect-select]:!py-1.5"
                  >
                    <MenuItem value="All" className="!text-xs">
                      All Departments
                    </MenuItem>
                    {filterOptions?.departments.map((dept) => (
                      <MenuItem key={dept} value={dept} className="!text-xs">
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Leave Type
                </span>
                <FormControl fullWidth size="small">
                  <Select
                    value={leaveTypeFilter}
                    onChange={(e) => setLeaveTypeFilter(e.target.value)}
                    className="!bg-secondary !text-xs !rounded-[5px] [&_.MuiSelect-select]:!py-1.5"
                  >
                    <MenuItem value="All" className="!text-xs">
                      All Leave Types
                    </MenuItem>
                    {filterOptions?.leaveTypes.map((type) => (
                      <MenuItem key={type} value={type} className="!text-xs">
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Leave Date Range
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
                    setLeaveTypeFilter("All");
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
          data={filteredLeaves}
          columns={leaveColumns}
          pageSize={8}
          loading={isLoading || isFetching}
        />
      </FadeUpItem>

      {viewingLeave && (
        <CustomDialog
          open={Boolean(viewingLeave)}
          onClose={() => setViewingLeave(null)}
          title="Leave Request Details"
          maxWidth="sm"
          actions={
            <>
              {viewingLeave.status !== "Approved" && (
                <Button
                  variant="contained"
                  size="small"
                  color="success"
                  onClick={() => handleApprove(viewingLeave)}
                  className="!text-xs !normal-case"
                >
                  Approve Leave
                </Button>
              )}
              {viewingLeave.status !== "Rejected" && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={() => handleReject(viewingLeave)}
                  className="!text-xs !normal-case"
                >
                  Reject Leave
                </Button>
              )}
            </>
          }
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Avatar
              src={viewingLeave.avatar || undefined}
              className="!w-12 !h-12 !bg-primary/20 !text-primary !text-lg !font-bold"
            >
              {viewingLeave.name.charAt(0)}
            </Avatar>
            <div>
              <h4 className="text-base font-semibold text-foreground">{viewingLeave.name}</h4>
              <p className="text-xs text-muted-foreground">
                {viewingLeave.email} • {viewingLeave.department}
              </p>
            </div>
            <div className="ml-auto">
              <Chip
                label={viewingLeave.status}
                size="small"
                color={
                  viewingLeave.status === "Approved"
                    ? "success"
                    : viewingLeave.status === "Pending"
                      ? "warning"
                      : "error"
                }
                variant="outlined"
                className="!text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Leave Type</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingLeave.leave_type}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Total Duration</span>
              <p className="font-semibold text-foreground mt-0.5">
                {viewingLeave.days_count} {viewingLeave.days_count === 1 ? "day" : "days"}
              </p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Start Date</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingLeave.start_date}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">End Date</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingLeave.end_date}</p>
            </div>
          </div>

          <div className="p-3 bg-secondary/30 border border-border/60 rounded-[5px] space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">
              Employee Reason
            </span>
            <p className="text-xs text-foreground leading-relaxed">{viewingLeave.reason}</p>
          </div>
        </CustomDialog>
      )}
    </StaggerContainer>
  );
}
