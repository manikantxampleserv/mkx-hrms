import {
  Cancel,
  CheckCircle,
  Delete,
  Edit,
  FileDownload,
  FilterList,
  KeyboardArrowDown,
  MoreHoriz,
  People,
  PersonAdd,
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
import { useMemo, useState } from "react";
import { FadeUpItem, StaggerContainer } from "shared/animations";
import { ArrowMenu } from "shared/ArrowMenu";
import { CustomDialog } from "shared/CustomDialog";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { CustomDateRangePicker } from "shared/DatePicker";
import { StatsCard } from "shared/StatsCard";
import { downloadExcelFromApi } from "src/utils/exportToExcel";
import { ManageEmployee, type ManageEmployeeFormValues } from "./ManageEmployee";

/**
 * Type representing an Employee status filter option
 */
type StatusFilter = "All" | "Active" | "Inactive";

import {
  useCreateEmployee,
  useDeleteEmployee,
  useGetEmployeeFilters,
  useGetEmployees,
  useUpdateEmployee,
  type Employee,
} from "services/employees";
import { useGetMasterDepartments, useGetMasterRoles } from "services/masters";

/**
 * Filter tab definitions for the toolbar
 */
const filterOptions: StatusFilter[] = ["All", "Active", "Inactive"];

/**
 * Props for the RowActions component
 */
interface RowActionsProps {
  row: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  onView: (employee: Employee) => void;
}

/**
 * Individual row actions component managing its own popup state
 */
const RowActions = ({ row, onEdit, onDelete, onView }: RowActionsProps) => {
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
        paperClassName="!min-w-[140px]"
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onView(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70"
        >
          <Visibility className="!w-4 !h-4" />
          View Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70"
        >
          <Edit className="!w-4 !h-4" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(row.id);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-destructive hover:!bg-destructive/10"
        >
          <Delete className="!w-4 !h-4 text-destructive" />
          <span className="text-destructive font-medium">Delete</span>
        </MenuItem>
      </ArrowMenu>
    </>
  );
};

/**
 * Factory creating table column definitions for Employees view utilizing MUI components
 */
const getEmployeeColumns = (
  onEdit: (employee: Employee) => void,
  onDelete: (employeeId: string) => void,
  onView: (employee: Employee) => void,
): ColumnDef<Employee>[] => [
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
    width: "28%",
  },
  {
    header: "ROLE",
    cell: (row) => (
      <div className="flex flex-col">
        <span className="font-semibold text-foreground text-sm">{row.role}</span>
        <span className="text-xs text-muted-foreground mt-0.5">{row.department}</span>
      </div>
    ),
    width: "22%",
  },
  {
    header: "STATUS",
    cell: (row) => {
      if (row.status === "Active") {
        return (
          <Chip
            icon={<CheckCircle className="!w-3.5 !h-3.5" />}
            label="Active"
            size="small"
            color="success"
            variant="outlined"
            className="!h-6 !text-xs !bg-success/10 !border-success/20 !font-medium"
          />
        );
      }
      return (
        <Chip
          icon={<Cancel className="!w-3.5 !h-3.5" />}
          label="Inactive"
          size="small"
          color="error"
          variant="outlined"
          className="!h-6 !text-xs !bg-destructive/10 !border-destructive/20 !font-medium"
        />
      );
    },
    width: "16%",
  },
  {
    header: "MANAGER",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.manager}</span>,
    width: "16%",
  },
  {
    header: "JOIN DATE",
    cell: (row) => <span className="text-sm text-muted-foreground">{row.join_date}</span>,
    width: "13%",
  },
  {
    header: "ACTION",
    cell: (row) => <RowActions row={row} onEdit={onEdit} onDelete={onDelete} onView={onView} />,
    width: "5%",
    align: "right",
  },
];

/**
 * Employees page component providing complete workforce directory management.
 */
export default function Employees() {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const {
    data: employeesResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetEmployees({
    search: searchTerm,
    status: statusFilter,
    department: departmentFilter,
    role: roleFilter,
    manager: managerFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: filtersResponse } = useGetEmployeeFilters();
  const filterOptionsData = filtersResponse?.data;
  const { data: masterDepartmentsResponse } = useGetMasterDepartments();
  const { data: masterRolesResponse } = useGetMasterRoles();

  const employees = useMemo(() => employeesResponse?.data || [], [employeesResponse]);

  /**
   * Dynamic list of departments fetched strictly from Master Departments
   */
  const uniqueDepartments = useMemo(() => {
    const depts = masterDepartmentsResponse?.data || [];
    const activeDepts = depts.filter((d) => d.status === "Active").map((d) => d.name);
    if (activeDepts.length > 0) {
      if (
        departmentFilter &&
        departmentFilter !== "All" &&
        !activeDepts.includes(departmentFilter)
      ) {
        return [...activeDepts, departmentFilter].sort();
      }
      return activeDepts.sort();
    }
    return (filterOptionsData?.departments || []).sort();
  }, [masterDepartmentsResponse?.data, filterOptionsData?.departments, departmentFilter]);

  /**
   * Dynamic roles fetched strictly from Master Roles table
   */
  const uniqueRoles = useMemo(() => {
    const roles = masterRolesResponse?.data || [];
    const activeRoles = roles.filter((r) => r.status === "Active").map((r) => r.name);
    if (activeRoles.length > 0) {
      if (roleFilter && roleFilter !== "All" && !activeRoles.includes(roleFilter)) {
        return [...activeRoles, roleFilter].sort();
      }
      return activeRoles.sort();
    }
    return (filterOptionsData?.roles || []).sort();
  }, [masterRolesResponse?.data, filterOptionsData?.roles, roleFilter]);

  /**
   * Dynamic managers fetched directly from PostgreSQL database
   */
  const uniqueManagers = useMemo(() => {
    const set = new Set<string>(filterOptionsData?.managers || []);
    employees.forEach((e) => {
      if (e.manager) set.add(e.manager);
    });
    if (managerFilter && managerFilter !== "All") {
      set.add(managerFilter);
    }
    return Array.from(set);
  }, [filterOptionsData?.managers, employees, managerFilter]);

  const createMutation = useCreateEmployee(() => {
    refetch();
  });

  const updateMutation = useUpdateEmployee(selectedEmployee?.id || "", () => {
    refetch();
  });

  const deleteMutation = useDeleteEmployee(() => {
    refetch();
  });

  /**
   * Open drawer to edit an existing employee
   */
  const handleEditEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsAddDrawerOpen(true);
  };

  /**
   * Delete employee from directory
   */
  const handleDeleteEmployee = (empId: string) => {
    deleteMutation.mutate(empId);
  };

  const handleSaveEmployee = async (empValues: ManageEmployeeFormValues) => {
    const payload = {
      name: empValues.name,
      email: empValues.email,
      role_id: Number(empValues.role_id),
      department_id: Number(empValues.department_id),
      manager_id: empValues.manager_id ? Number(empValues.manager_id) : null,
      status: empValues.status,
      join_date: empValues.join_date,
      avatar: empValues.avatar,
    };
    if (selectedEmployee) {
      await updateMutation.mutateAsync(payload);
      setSelectedEmployee(null);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  /**
   * View employee full profile dialog
   */
  const handleViewEmployee = (emp: Employee) => {
    setViewingEmployee(emp);
  };

  const employeeColumns = useMemo(
    () => getEmployeeColumns(handleEditEmployee, handleDeleteEmployee, handleViewEmployee),
    [handleDeleteEmployee],
  );

  /**
   * Dynamically calculate active KPI metrics
   */
  const dynamicKpiCards = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "Active").length;
    const inactive = employees.filter((e) => e.status === "Inactive").length;

    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const newHires = employees.filter((e) => {
      if (!e.join_date) return false;
      const join = new Date(e.join_date);
      return join >= sixtyDaysAgo;
    }).length;

    const departmentsCount =
      masterDepartmentsResponse?.data?.length ||
      new Set(employees.map((e) => e.department).filter(Boolean)).size;

    return [
      {
        id: "total-employees",
        title: "Total Employees",
        value: String(total),
        subtext: `Across ${departmentsCount} global department${departmentsCount === 1 ? "" : "s"}`,
        icon: People,
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "active-workforce",
        title: "Active Staff",
        value: String(active),
        subtext: `${total > 0 ? ((active / total) * 100).toFixed(1) : 0}% active status deployment`,
        icon: CheckCircle,
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "inactive-workforce",
        title: "Inactive Staff",
        value: String(inactive),
        subtext: `${total > 0 ? ((inactive / total) * 100).toFixed(1) : 0}% offboarded or inactive`,
        icon: Cancel,
        icon_color: "text-[#f14d4c]",
        icon_bg: "bg-[#f14d4c]/10",
      },
      {
        id: "new-hires",
        title: "New Hires",
        value: String(newHires),
        subtext: "Joined in the last 60 days",
        icon: PersonAdd,
        icon_color: "text-[#ad87ed]",
        icon_bg: "bg-[#ad87ed]/10",
      },
    ];
  }, [employees]);

  /**
   * Computed list of employees based on search query and selected status tab
   */
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || emp.status === statusFilter;
      const matchesDept = departmentFilter === "All" || emp.department === departmentFilter;
      const matchesRole = roleFilter === "All" || emp.role === roleFilter;
      const matchesManager = managerFilter === "All" || emp.manager === managerFilter;

      return matchesSearch && matchesStatus && matchesDept && matchesRole && matchesManager;
    });
  }, [employees, searchTerm, statusFilter, departmentFilter, roleFilter, managerFilter]);

  return (
    <StaggerContainer className="space-y-4">
      <FadeUpItem className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicKpiCards.map((card) => (
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
          Manage team members, roles, and departmental assignments
        </p>
      </FadeUpItem>

      <FadeUpItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <InputBase
            placeholder="Search employees..."
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
            {filterOptions.map((status) => (
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
            variant="contained"
            size="small"
            onClick={() => {
              setSelectedEmployee(null);
              setIsAddDrawerOpen(true);
            }}
            startIcon={<PersonAdd className="!w-4 !h-4" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-3.5 !py-2 !rounded-[5px] shadow-sm"
          >
            Add Employee
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => downloadExcelFromApi("/v1/employees/export", "Employees_Directory.xlsx")}
            startIcon={<FileDownload className="!w-4 !h-4 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px]"
          >
            Export
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            startIcon={<FilterList className="!w-4 !h-4 text-muted-foreground" />}
            endIcon={<KeyboardArrowDown className="!w-4 !h-4 text-muted-foreground" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-3.5 !py-2 !rounded-[5px] shrink-0"
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
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="!rounded-[5px] !text-sm"
                >
                  <MenuItem value="All" className="!text-sm">
                    All Roles
                  </MenuItem>
                  {uniqueRoles.map((role) => (
                    <MenuItem key={role} value={role} className="!text-sm">
                      {role}
                    </MenuItem>
                  ))}
                  {roleFilter !== "All" && !uniqueRoles.includes(roleFilter) && (
                    <MenuItem value={roleFilter} className="!text-sm">
                      {roleFilter}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <Select
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="!rounded-[5px] !text-sm"
                >
                  <MenuItem value="All" className="!text-sm">
                    All Managers
                  </MenuItem>
                  {uniqueManagers.map((manager) => (
                    <MenuItem key={manager} value={manager} className="!text-sm">
                      {manager}
                    </MenuItem>
                  ))}
                  {managerFilter !== "All" && !uniqueManagers.includes(managerFilter) && (
                    <MenuItem value={managerFilter} className="!text-sm">
                      {managerFilter}
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Join Date Range
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
                    setRoleFilter("All");
                    setManagerFilter("All");
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
          data={filteredEmployees}
          columns={employeeColumns}
          pageSize={8}
          loading={isLoading || isFetching}
        />
      </FadeUpItem>

      <ManageEmployee
        open={isAddDrawerOpen}
        onClose={() => {
          setIsAddDrawerOpen(false);
          setSelectedEmployee(null);
        }}
        initialData={selectedEmployee}
        onSubmit={handleSaveEmployee}
      />

      {viewingEmployee && (
        <CustomDialog
          open={Boolean(viewingEmployee)}
          onClose={() => setViewingEmployee(null)}
          title="Employee Profile Details"
          maxWidth="xs"
          actions={
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                const emp = viewingEmployee;
                setViewingEmployee(null);
                handleEditEmployee(emp);
              }}
              className="!text-xs !normal-case !bg-primary !text-primary-foreground"
            >
              Edit Profile
            </Button>
          }
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Avatar
              src={viewingEmployee.avatar || undefined}
              className="!w-12 !h-12 !bg-primary/20 !text-primary !text-lg !font-bold"
            >
              {viewingEmployee.name.charAt(0)}
            </Avatar>
            <div>
              <h4 className="text-base font-semibold text-foreground">{viewingEmployee.name}</h4>
              <p className="text-xs text-muted-foreground">{viewingEmployee.email}</p>
            </div>
            <div className="ml-auto">
              <Chip
                label={viewingEmployee.status}
                size="small"
                color={viewingEmployee.status === "Active" ? "success" : "error"}
                variant="outlined"
                className="!text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Role</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingEmployee.role}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Department</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingEmployee.department}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Manager</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingEmployee.manager}</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-[5px]">
              <span className="text-muted-foreground">Join Date</span>
              <p className="font-semibold text-foreground mt-0.5">{viewingEmployee.join_date}</p>
            </div>
          </div>
        </CustomDialog>
      )}
    </StaggerContainer>
  );
}
