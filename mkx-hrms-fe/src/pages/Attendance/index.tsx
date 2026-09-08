import {
  AccessTime,
  Cancel,
  CheckCircle,
  FileDownload,
  FilterList,
  HomeWork,
  HowToReg,
  KeyboardArrowDown,
  MoreHoriz,
  PersonOff,
  Search,
  Visibility,
} from "@mui/icons-material";
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
import { useMemo, useState, type ElementType } from "react";

import { ArrowMenu } from "shared/ArrowMenu";
import { CustomDialog } from "shared/CustomDialog";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { CustomDatePicker } from "shared/DatePicker";
import { StatsCard } from "shared/StatsCard";
import { FadeUpItem, StaggerContainer } from "shared/animations";

/**
 * Type representing attendance status filter categories
 */
type AttendanceStatusFilter = "All" | "Present" | "Late" | "Absent" | "Remote";

import {
  useGetAttendance,
  useGetAttendanceFilters,
  useGetAttendanceStats,
  useUpdateAttendanceStatus,
  type AttendanceRecord,
} from "services/attendance";
import { downloadExcelFromApi } from "src/utils/exportToExcel";

const iconMap: Record<string, ElementType> = {
  HowToReg,
  CheckCircle,
  AccessTime,
  PersonOff,
};

/**
 * Filter tab categories for toolbar
 */
const statusTabs: AttendanceStatusFilter[] = ["All", "Present", "Late", "Absent", "Remote"];

/**
 * Props definition for AttendanceRowActions component
 */
interface AttendanceRowActionsProps {
  row: AttendanceRecord;
  onUpdateStatus: (
    record: AttendanceRecord,
    status: "Present" | "Late" | "Absent" | "Remote",
  ) => void;
  onView: (record: AttendanceRecord) => void;
}

/**
 * Dynamic row actions popup menu for Attendance Records
 *
 * @param props - Component configuration props
 * @returns Rendered action menu trigger and popup
 */
function AttendanceRowActions({
  row,
  onUpdateStatus,
  onView,
}: AttendanceRowActionsProps): React.ReactElement {
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
          View Details
        </MenuItem>
        {row.status !== "Present" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStatus(row, "Present");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-emerald-500 hover:!bg-emerald-500/10"
          >
            <CheckCircle className="!w-4 !h-4 text-emerald-500" />
            <span className="font-medium text-emerald-500">Mark Present</span>
          </MenuItem>
        )}
        {row.status !== "Late" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStatus(row, "Late");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-amber-500 hover:!bg-amber-500/10"
          >
            <AccessTime className="!w-4 !h-4 text-amber-500" />
            <span className="font-medium text-amber-500">Mark Late</span>
          </MenuItem>
        )}
        {row.status !== "Remote" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStatus(row, "Remote");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-sky-500 hover:!bg-sky-500/10"
          >
            <HomeWork className="!w-4 !h-4 text-sky-500" />
            <span className="font-medium text-sky-500">Mark Remote</span>
          </MenuItem>
        )}
        {row.status !== "Absent" && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              onUpdateStatus(row, "Absent");
            }}
            className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-destructive hover:!bg-destructive/10"
          >
            <Cancel className="!w-4 !h-4 text-destructive" />
            <span className="font-medium text-destructive">Mark Absent</span>
          </MenuItem>
        )}
      </ArrowMenu>
    </>
  );
}

/**
 * Generates dynamic column definitions for Attendance table
 *
 * @param onUpdateStatus - Callback to update attendance status
 * @param onView - Callback to view attendance details
 * @returns Column definitions list
 */
function getAttendanceColumns(
  onUpdateStatus: (
    record: AttendanceRecord,
    status: "Present" | "Late" | "Absent" | "Remote",
  ) => void,
  onView: (record: AttendanceRecord) => void,
): ColumnDef<AttendanceRecord>[] {
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
      width: "26%",
    },
    {
      header: "DEPARTMENT",
      cell: (row) => (
        <Chip label={row.department} size="small" className="!bg-secondary/40 !text-foreground" />
      ),
      width: "15%",
    },
    {
      header: "CHECK IN",
      cell: (row) => <span className="text-sm font-medium text-foreground">{row.check_in}</span>,
      width: "12%",
    },
    {
      header: "CHECK OUT",
      cell: (row) => <span className="text-sm text-muted-foreground">{row.check_out}</span>,
      width: "12%",
    },
    {
      header: "WORK HOURS",
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">{row.work_hours}</span>
      ),
      width: "12%",
    },
    {
      header: "STATUS",
      cell: (row) => {
        if (row.status === "Present") {
          return (
            <Chip
              icon={<CheckCircle className="!w-3.5 !h-3.5" />}
              label="Present"
              size="small"
              color="success"
              variant="outlined"
              className="!bg-success/10"
            />
          );
        }
        if (row.status === "Late") {
          return (
            <Chip
              icon={<AccessTime className="!w-3.5 !h-3.5" />}
              label="Late"
              size="small"
              color="warning"
              variant="outlined"
              className="!bg-warning/10"
            />
          );
        }
        if (row.status === "Remote") {
          return (
            <Chip
              icon={<HomeWork className="!w-3.5 !h-3.5 !text-sky-500" />}
              label="Remote"
              size="small"
              variant="outlined"
              className="!bg-sky-500/10 !text-sky-500"
            />
          );
        }
        return (
          <Chip
            icon={<Cancel className="!w-3.5 !h-3.5" />}
            label="Absent"
            size="small"
            color="error"
            variant="outlined"
            className="!bg-destructive/10"
          />
        );
      },
      width: "13%",
    },
    {
      header: "LOCATION",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.location}</span>,
      width: "15%",
    },
    {
      header: "ACTION",
      cell: (row) => (
        <AttendanceRowActions row={row} onUpdateStatus={onUpdateStatus} onView={onView} />
      ),
      width: "5%",
      align: "right",
    },
  ];
}

/**
 * Attendance page component providing complete daily punctuality tracking and logging.
 */
export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatusFilter>("All");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [locationFilter, setLocationFilter] = useState<string>("All");
  const todayStr = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState<string>(todayStr);
  const [viewingAttendance, setViewingAttendance] = useState<AttendanceRecord | null>(null);

  const {
    data: attendanceResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetAttendance({
    search: searchTerm,
    status: statusFilter,
    department: departmentFilter,
    location: locationFilter,
    startDate: dateFilter || undefined,
    endDate: dateFilter || undefined,
  });

  const { data: filtersResponse } = useGetAttendanceFilters();
  const filterOptions = filtersResponse?.data;
  const { data: statsResponse, refetch: refetchStats } = useGetAttendanceStats();

  const updateAttendanceStatusMutation = useUpdateAttendanceStatus(() => {
    refetch();
    refetchStats();
  });

  /**
   * Handles updating attendance status with feedback toast
   */
  const handleUpdateStatus = async (
    record: AttendanceRecord,
    status: "Present" | "Late" | "Absent" | "Remote",
  ) => {
    await updateAttendanceStatusMutation.mutateAsync({ id: record.id, status });
    if (viewingAttendance?.id === record.id) {
      setViewingAttendance((prev) => (prev ? { ...prev, status } : null));
    }
  };

  /**
   * Opens details dialog for the selected attendance record
   */
  const handleView = (record: AttendanceRecord) => {
    setViewingAttendance(record);
  };

  const attendanceColumns = useMemo(
    () => getAttendanceColumns(handleUpdateStatus, handleView),
    [handleUpdateStatus, handleView],
  );

  const records = useMemo(() => attendanceResponse?.data || [], [attendanceResponse]);

  /**
   * Dynamic departments available in the Attendance directory
   */
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>(filterOptions?.departments || []);
    records.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    if (departmentFilter !== "All") set.add(departmentFilter);
    return Array.from(set);
  }, [filterOptions?.departments, records, departmentFilter]);

  /**
   * Dynamic locations available in the Attendance directory
   */
  const uniqueLocations = useMemo(() => {
    const set = new Set<string>(filterOptions?.locations || []);
    records.forEach((r) => {
      if (r.location) set.add(r.location);
    });
    if (locationFilter !== "All") set.add(locationFilter);
    return Array.from(set);
  }, [filterOptions?.locations, records, locationFilter]);

  const activeKpiCards = useMemo(() => {
    return (statsResponse?.data || []).map((card) => ({
      id: card.id,
      title: card.title,
      value: card.value,
      subtext: card.subtext,
      icon: iconMap[card.icon_name] || CheckCircle,
      icon_color: card.icon_color,
      icon_bg: card.icon_bg,
    }));
  }, [statsResponse]);

  /**
   * Filtered records based on query and selected category
   */
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  return (
    <StaggerContainer className="space-y-6">
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
          Monitor daily check-ins, punctuality, and work hours
        </p>
      </FadeUpItem>

      <FadeUpItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <InputBase
            placeholder="Search attendance..."
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
            onClick={() => downloadExcelFromApi("/v1/attendance/export", "Attendance_Log.xlsx")}
            startIcon={<FileDownload className="!w-4 !h-4 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px]"
          >
            Export Log
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            startIcon={<FilterList className="!w-4 !h-4 text-muted-foreground" />}
            endIcon={<KeyboardArrowDown className="!w-4 !h-4 text-muted-foreground" />}
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

              <FormControl size="small" fullWidth>
                <Select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="!rounded-[5px] !text-sm"
                >
                  <MenuItem value="All" className="!text-sm">
                    All Locations
                  </MenuItem>
                  {uniqueLocations.map((loc) => (
                    <MenuItem key={loc} value={loc} className="!text-sm">
                      {loc}
                    </MenuItem>
                  ))}
                  {locationFilter !== "All" && !uniqueLocations.includes(locationFilter) && (
                    <MenuItem value={locationFilter} className="!text-sm">
                      {locationFilter}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Date
                </span>
                <CustomDatePicker
                  label="Select Date"
                  value={dateFilter}
                  onChange={(val) => setDateFilter(val)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  size="small"
                  onClick={() => {
                    setDepartmentFilter("All");
                    setLocationFilter("All");
                    setDateFilter("");
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
          data={filteredRecords}
          columns={attendanceColumns}
          pageSize={8}
          loading={isLoading || isFetching}
        />
      </FadeUpItem>

      {viewingAttendance && (
        <CustomDialog
          open={Boolean(viewingAttendance)}
          onClose={() => setViewingAttendance(null)}
          title="Attendance Log Details"
          maxWidth="xs"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Avatar
              src={viewingAttendance.avatar || undefined}
              className="!w-12 !h-12 !bg-primary/20 !text-primary !text-lg !font-bold"
            >
              {viewingAttendance.name.charAt(0)}
            </Avatar>
            <div>
              <h4 className="text-base font-semibold text-foreground">{viewingAttendance.name}</h4>
              <p className="text-xs text-muted-foreground">
                {viewingAttendance.email} • {viewingAttendance.department}
              </p>
            </div>
            <div className="ml-auto">
              <Chip
                label={viewingAttendance.status}
                size="small"
                color={
                  viewingAttendance.status === "Present"
                    ? "success"
                    : viewingAttendance.status === "Late"
                      ? "warning"
                      : viewingAttendance.status === "Remote"
                        ? "info"
                        : "error"
                }
                variant="outlined"
                className="!text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Check In</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingAttendance.check_in}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Check Out</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingAttendance.check_out}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Work Hours</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingAttendance.work_hours}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Location</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingAttendance.location}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Status Change
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="small"
                variant={viewingAttendance.status === "Present" ? "contained" : "outlined"}
                color="success"
                onClick={() => handleUpdateStatus(viewingAttendance, "Present")}
                className="!text-xs !normal-case"
              >
                Present
              </Button>
              <Button
                size="small"
                variant={viewingAttendance.status === "Late" ? "contained" : "outlined"}
                color="warning"
                onClick={() => handleUpdateStatus(viewingAttendance, "Late")}
                className="!text-xs !normal-case"
              >
                Late
              </Button>
              <Button
                size="small"
                variant={viewingAttendance.status === "Remote" ? "contained" : "outlined"}
                color="info"
                onClick={() => handleUpdateStatus(viewingAttendance, "Remote")}
                className="!text-xs !normal-case"
              >
                Remote
              </Button>
              <Button
                size="small"
                variant={viewingAttendance.status === "Absent" ? "contained" : "outlined"}
                color="error"
                onClick={() => handleUpdateStatus(viewingAttendance, "Absent")}
                className="!text-xs !normal-case"
              >
                Absent
              </Button>
            </div>
          </div>
        </CustomDialog>
      )}
    </StaggerContainer>
  );
}
