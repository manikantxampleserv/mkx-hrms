import {
  AccountBalanceWallet,
  ArrowBack,
  Badge,
  CalendarMonth,
  CheckCircle,
  Edit,
  Email,
  LocationOn,
  Paid,
  Person,
  Phone,
  ReceiptLong,
  Schedule,
  SupervisorAccount,
  Work,
} from "@mui/icons-material";
import { Avatar, Button, Chip, Tab, Tabs } from "@mui/material";
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useGetEmployeeById,
  useUpdateEmployee,
  type Employee,
} from "services/employees";
import { AppLoader } from "shared/AppLoader";
import { CustomDialog } from "shared/CustomDialog";
import { StatsCard } from "shared/StatsCard";
import { ManageEmployee, type ManageEmployeeFormValues } from "../ManageEmployee";
import { GenerateEmployeeSalaryDialog } from "./GenerateEmployeeSalaryDialog";

/**
 * Tab identifiers supported on Employee Detail workspace
 */
type DetailTab = "overview" | "compensation" | "payroll" | "shift";

/**
 * Dedicated Employee Detail Page component providing comprehensive employee records,
 * personal and organizational data, compensation structure breakdown,
 * and direct salary calculation & generation workflow.
 *
 * @returns The rendered Employee Detail view
 */
export default function EmployeeDetail(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState<boolean>(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState<boolean>(false);
  const [viewingPayslip, setViewingPayslip] = useState<
    NonNullable<Employee["payrolls"]>[number] | null
  >(null);

  const {
    data: employeeResponse,
    isLoading,
    refetch: refetchEmployee,
  } = useGetEmployeeById(id);
  const employee = employeeResponse?.data;

  const updateEmployee = useUpdateEmployee(employee?.id || "", () => {
    refetchEmployee();
    setIsEditDrawerOpen(false);
  });

  /**
   * Financial summary metrics calculated across employee's active salary structures
   */
  const { totalGross, totalDeductions, netSalary, earningsCount, deductionsCount } =
    useMemo(() => {
      let gross = 0;
      let deductions = 0;
      let earn = 0;
      let ded = 0;

      const structures = employee?.salary_structures || [];
      structures.forEach((item) => {
        const amt = Number(item.amount) || 0;
        if (item.salary_structure?.is_deduction) {
          deductions += amt;
          ded += 1;
        } else {
          gross += amt;
          earn += 1;
        }
      });

      return {
        totalGross: gross,
        totalDeductions: deductions,
        netSalary: Math.max(0, gross - deductions),
        earningsCount: earn,
        deductionsCount: ded,
      };
    }, [employee?.salary_structures]);

  /**
   * Handles saving edited profile from the drawer
   *
   * @param values - Form values submitted from ManageEmployee drawer
   */
  const handleSaveEdit = async (values: ManageEmployeeFormValues) => {
    if (!employee) return;
    await updateEmployee.mutateAsync({
      name: values.name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      role_id: Number(values.role_id) || undefined,
      department_id: Number(values.department_id) || undefined,
      shift_id: values.shift_id ? Number(values.shift_id) : undefined,
      status: values.status,
      manager_id: values.manager_id ? Number(values.manager_id) : undefined,
      join_date: values.join_date,
      birth_date: values.birth_date || undefined,
      avatar: values.avatar,
      salary_structures: values.salary_structures,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AppLoader />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Person className="!w-16 !h-16 text-muted-foreground/30" />
        <h3 className="text-lg font-bold text-foreground">Employee Record Not Found</h3>
        <p className="text-xs text-muted-foreground max-w-sm text-center">
          The employee ID &quot;{id}&quot; does not exist or may have been deleted.
        </p>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate("/employees")}
          startIcon={<ArrowBack className="!w-4 !h-4" />}
          className="!bg-primary !text-primary-foreground !text-xs !normal-case !rounded-[5px]"
        >
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top Breadcrumb and Back Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Button
            variant="text"
            size="small"
            onClick={() => navigate("/employees")}
            startIcon={<ArrowBack className="!w-4 !h-4" />}
            className="!text-muted-foreground hover:!text-foreground !text-xs !normal-case !p-0 !min-w-0 font-medium"
          >
            Employees
          </Button>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-semibold">{employee.name}</span>
          <span className="text-muted-foreground text-[11px]">({employee.id})</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outlined"
            size="small"
            onClick={() => setIsEditDrawerOpen(true)}
            startIcon={<Edit className="!w-4 !h-4" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !rounded-[5px] !px-3.5 !py-1.5"
          >
            Edit Profile
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={() => setIsSalaryDialogOpen(true)}
            startIcon={<Paid className="!w-4 !h-4" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !rounded-[5px] !px-4 !py-1.5 shadow-sm"
          >
            Generate Salary
          </Button>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="p-6 rounded-[5px] bg-card border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Avatar
            src={employee.avatar || undefined}
            variant="rounded"
            className="!w-20 !h-20 !text-2xl !font-bold !bg-primary/10 !text-primary !border !border-primary/20 shrink-0"
          >
            {employee.name.charAt(0)}
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-foreground tracking-tight">{employee.name}</h2>
              <Chip
                label={employee.id}
                size="small"
                className="!text-[11px] !font-mono !bg-secondary !border !border-border !text-muted-foreground !h-5"
              />
              <Chip
                icon={<CheckCircle className="!w-3 !h-3" />}
                label={employee.status}
                size="small"
                color={employee.status === "Active" ? "success" : "error"}
                variant="outlined"
                className="!h-5 !text-[11px] !font-medium"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Work className="!w-3.5 !h-3.5 text-primary" />
                <span className="font-semibold text-foreground">{employee.role}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Badge className="!w-3.5 !h-3.5" />
                <span>{employee.department}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Schedule className="!w-3.5 !h-3.5" />
                <span>
                  {employee.shift || "General Shift"}
                  {employee.shift_time ? ` (${employee.shift_time})` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Email className="!w-3.5 !h-3.5 text-muted-foreground/70" />
                {employee.email}
              </span>
              {employee.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="!w-3.5 !h-3.5 text-muted-foreground/70" />
                  {employee.phone}
                </span>
              )}
              {employee.manager && employee.manager !== "None" && (
                <span className="flex items-center gap-1">
                  <SupervisorAccount className="!w-3.5 !h-3.5 text-muted-foreground/70" />
                  Manager: <strong className="text-foreground">{employee.manager}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Monthly Earnings Widget */}
        <div className="p-4 rounded-[5px] bg-secondary/30 border border-border flex flex-col gap-1 min-w-[220px] self-stretch md:self-auto justify-center">
          <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
            Net Monthly Compensation
          </span>
          <span className="text-2xl font-black text-foreground tracking-tight">
            ${netSalary.toLocaleString()}
          </span>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 pt-1 border-t border-border/60">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              +${totalGross.toLocaleString()} Gross
            </span>
            <span className="text-rose-500 font-medium">
              -${totalDeductions.toLocaleString()} Ded.
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <Tabs
          value={activeTab}
          onChange={(_, val: DetailTab) => setActiveTab(val)}
          className="[&_.MuiTabs-indicator]:!bg-primary"
        >
          <Tab
            value="overview"
            label="Overview & Personal"
            className="!text-xs !normal-case !font-semibold !min-h-[44px]"
          />
          <Tab
            value="compensation"
            label={`Salary Structures (${(employee.salary_structures || []).length})`}
            className="!text-xs !normal-case !font-semibold !min-h-[44px]"
          />
          <Tab
            value="payroll"
            label={`Payroll History (${(employee.payrolls || []).length})`}
            className="!text-xs !normal-case !font-semibold !min-h-[44px]"
          />
          <Tab
            value="shift"
            label="Shift & Organization"
            className="!text-xs !normal-case !font-semibold !min-h-[44px]"
          />
        </Tabs>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Gross Pay"
              value={`$${totalGross.toLocaleString()}`}
              subtext={`${earningsCount} active earning items`}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-500/10"
              icon={AccountBalanceWallet}
            />
            <StatsCard
              title="Total Deductions"
              value={`-$${totalDeductions.toLocaleString()}`}
              subtext={`${deductionsCount} deduction items`}
              iconColor="text-rose-500"
              iconBg="bg-rose-500/10"
              icon={AccountBalanceWallet}
            />
            <StatsCard
              title="Net Monthly Salary"
              value={`$${netSalary.toLocaleString()}`}
              subtext="Base take-home estimate"
              iconColor="text-primary"
              iconBg="bg-primary/10"
              icon={Paid}
            />
            <StatsCard
              title="Tenure / Join Date"
              value={employee.join_date || "—"}
              subtext="Date of employment"
              iconColor="text-amber-500"
              iconBg="bg-amber-500/10"
              icon={CalendarMonth}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Details Card */}
            <div className="p-5 rounded-[5px] bg-card border border-border flex flex-col gap-4">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border flex items-center gap-2">
                <Person className="!w-4 !h-4 text-primary" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Full Name</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{employee.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Email Address</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{employee.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Phone Number</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {employee.phone || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Date of Birth</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {employee.birth_date || "Not specified"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Residential Address</span>
                  <span className="font-semibold text-foreground mt-0.5 block flex items-start gap-1">
                    <LocationOn className="!w-3.5 !h-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                    {employee.address || "No address on record"}
                  </span>
                </div>
              </div>
            </div>

            {/* Employment & Organizational Details */}
            <div className="p-5 rounded-[5px] bg-card border border-border flex flex-col gap-4">
              <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border flex items-center gap-2">
                <Work className="!w-4 !h-4 text-primary" />
                Employment & Organizational Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Department</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {employee.department}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Role / Designation</span>
                  <span className="font-semibold text-foreground mt-0.5 block">{employee.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Work Shift</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {employee.shift || "General Shift"}
                    {employee.shift_time ? ` (${employee.shift_time})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Reporting Manager</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {employee.manager || "None Assigned"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Employment Status</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {employee.status}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">User Account Linked</span>
                  <span className="font-semibold text-foreground mt-0.5 block">
                    {employee.user ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Active Account ({employee.user.email})
                      </span>
                    ) : (
                      <span className="text-muted-foreground font-normal">No User Login</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPENSATION & SALARY STRUCTURES */}
      {activeTab === "compensation" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Assigned Salary Structures & Allowances
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Itemized breakdown of fixed earnings, recurring allowances, and mandatory deductions.
              </p>
            </div>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsEditDrawerOpen(true)}
              startIcon={<Edit className="!w-4 !h-4" />}
              className="!text-xs !normal-case !border-primary !text-primary hover:!bg-primary/10 font-semibold !rounded-[5px] !px-3.5 !py-1.5"
            >
              Modify Structure Items
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900/70 border-b border-border text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    <th className="py-3 px-4 min-w-[240px]">Structure Component</th>
                    <th className="py-3 px-4 min-w-[100px]">Category</th>
                    <th className="py-3 px-4 min-w-[100px]">Tax Status</th>
                    <th className="py-3 px-4 min-w-[110px]">Calculation</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">Monthly Amount ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(!employee.salary_structures || employee.salary_structures.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                        <AccountBalanceWallet className="!w-10 !h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <span className="font-medium block">No salary structures assigned yet</span>
                        <span className="text-[11px] text-muted-foreground/70 block mt-0.5">
                          Click &quot;Modify Structure Items&quot; above to configure compensation for
                          this employee.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    employee.salary_structures.map((item, idx) => {
                      const master = item.salary_structure;
                      const isDeduction = master?.is_deduction;
                      const isBase = master?.is_base_salary;

                      return (
                        <tr
                          key={idx}
                          className="hover:bg-secondary/20 transition-colors text-xs"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-[5px] bg-secondary border border-border flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                                {master?.name ? master.name.charAt(0).toUpperCase() : "S"}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground">
                                  {master?.name || `Structure #${item.salary_structure_id}`}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  {master?.code}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-xs">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                isDeduction
                                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              }`}
                            >
                              {isDeduction ? "Deduction" : "Earning"}
                            </span>
                            {isBase && (
                              <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                Base
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                            {master?.is_taxable ? "Taxable" : "Exempt"}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-xs text-muted-foreground">
                            {master?.calculation_type || "Fixed"}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">
                            ${Number(item.amount).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {employee.salary_structures && employee.salary_structures.length > 0 && (
              <div className="grid grid-cols-3 gap-2 p-4 bg-secondary/30 border-t border-border text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Total Gross Pay</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ${totalGross.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Total Deductions</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                    -${totalDeductions.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">Net Monthly Pay</span>
                  <span className="font-bold text-primary text-sm">
                    ${netSalary.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL & PAYSLIP HISTORY */}
      {activeTab === "payroll" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Payroll & Payslip History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Past generated salaries, disbursed payslips, and attendance-adjusted disbursements.
              </p>
            </div>
            <Button
              variant="contained"
              size="small"
              onClick={() => setIsSalaryDialogOpen(true)}
              startIcon={<Paid className="!w-4 !h-4" />}
              className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !rounded-[5px] !px-3.5 !py-1.5 shadow-sm"
            >
              Generate New Salary
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900/70 border-b border-border text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    <th className="py-3 px-4 min-w-[130px]">Payslip Code</th>
                    <th className="py-3 px-4 min-w-[120px]">Period</th>
                    <th className="py-3 px-4 min-w-[100px]">Working Days</th>
                    <th className="py-3 px-4 min-w-[100px]">LOP Days</th>
                    <th className="py-3 px-4 min-w-[120px]">Gross Pay</th>
                    <th className="py-3 px-4 min-w-[120px]">Deductions</th>
                    <th className="py-3 px-4 min-w-[120px]">Net Salary</th>
                    <th className="py-3 px-4 min-w-[100px]">Status</th>
                    <th className="py-3 px-4 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(!employee.payrolls || employee.payrolls.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-xs text-muted-foreground">
                        <ReceiptLong className="!w-10 !h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <span className="font-medium block">No payroll records generated yet</span>
                        <span className="text-[11px] text-muted-foreground/70 block mt-0.5">
                          Click &quot;Generate New Salary&quot; above to calculate and issue a payslip
                          for this employee.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    employee.payrolls.map((payroll) => (
                      <tr
                        key={payroll.id}
                        className="hover:bg-secondary/20 transition-colors text-xs"
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          {payroll.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground">
                          {payroll.month}/{payroll.year}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {payroll.working_days ?? "—"} days
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${
                              (payroll.lop_days || 0) > 0 ? "text-rose-500" : "text-muted-foreground"
                            }`}
                          >
                            {payroll.lop_days || 0} days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {payroll.gross_pay}
                        </td>
                        <td className="py-3 px-4 text-rose-500 font-medium">
                          -{payroll.total_deductions}
                        </td>
                        <td className="py-3 px-4 text-foreground font-bold text-sm">
                          {payroll.net_pay}
                        </td>
                        <td className="py-3 px-4">
                          <Chip
                            label={payroll.status}
                            size="small"
                            color={
                              payroll.status === "Paid"
                                ? "success"
                                : payroll.status === "Processed"
                                ? "info"
                                : "warning"
                            }
                            variant="outlined"
                            className="!h-5 !text-[11px] !font-medium"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setViewingPayslip(payroll)}
                            className="!text-[11px] !normal-case !py-0.5 !px-2 !rounded-[4px] !border-border !text-muted-foreground hover:!text-foreground"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SHIFT & ORGANIZATION */}
      {activeTab === "shift" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-[5px] bg-card border border-border flex flex-col gap-4">
            <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border flex items-center gap-2">
              <Schedule className="!w-4 !h-4 text-primary" />
              Work Shift Configuration
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Shift Name</span>
                <span className="font-semibold text-foreground">
                  {employee.shift || "General Shift"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Operating Hours</span>
                <span className="font-semibold text-foreground">
                  {employee.shift_time || "09:00 - 18:00"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Shift Code</span>
                <span className="font-mono text-muted-foreground">
                  {employee.shift_rel?.code || "GEN"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Grace Period Allowed</span>
                <span className="font-semibold text-foreground">
                  {employee.shift_rel?.grace_mins ?? 15} minutes
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-[5px] bg-card border border-border flex flex-col gap-4">
            <h3 className="text-sm font-bold text-foreground pb-2 border-b border-border flex items-center gap-2">
              <SupervisorAccount className="!w-4 !h-4 text-primary" />
              Reporting Structure & Hierarchy
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Department</span>
                <span className="font-semibold text-foreground">{employee.department}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Designation / Role</span>
                <span className="font-semibold text-foreground">{employee.role}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Direct Supervisor</span>
                <span className="font-semibold text-foreground">{employee.manager}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Join Date</span>
                <span className="font-semibold text-foreground">{employee.join_date}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Generation Dialog */}
      <GenerateEmployeeSalaryDialog
        open={isSalaryDialogOpen}
        onClose={() => setIsSalaryDialogOpen(false)}
        employee={employee}
        onSuccess={() => refetchEmployee()}
      />

      {/* Edit Employee Drawer */}
      <ManageEmployee
        open={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        initialData={employee}
        onSubmit={handleSaveEdit}
      />

      {/* Payslip View Dialog */}
      {viewingPayslip && (
        <CustomDialog
          open={Boolean(viewingPayslip)}
          onClose={() => setViewingPayslip(null)}
          title={`Payslip Details — ${viewingPayslip.id}`}
          maxWidth="sm"
          actions={
            <Button
              variant="outlined"
              size="small"
              onClick={() => setViewingPayslip(null)}
              className="!border-border !text-muted-foreground hover:!text-foreground !text-xs !normal-case !rounded-[5px]"
            >
              Close
            </Button>
          }
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3 bg-secondary/30 rounded-[5px] border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted-foreground block">Period</span>
                <span className="font-bold text-foreground">
                  {viewingPayslip.month}/{viewingPayslip.year}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Pay Date</span>
                <span className="font-bold text-foreground">{viewingPayslip.pay_date}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Status</span>
                <Chip
                  label={viewingPayslip.status}
                  size="small"
                  color="success"
                  variant="outlined"
                  className="!h-5 !text-[10px]"
                />
              </div>
            </div>

            {viewingPayslip.items && viewingPayslip.items.length > 0 && (
              <div className="border border-border rounded overflow-hidden">
                <div className="bg-secondary/40 px-3 py-1.5 font-semibold text-[11px] text-muted-foreground border-b border-border flex justify-between">
                  <span>Structure Item</span>
                  <span>Amount</span>
                </div>
                <div className="divide-y divide-border/60 max-h-48 overflow-y-auto">
                  {viewingPayslip.items.map((item, idx) => (
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
                        <span>{item.name}</span>
                      </div>
                      <span
                        className={
                          item.category === "Deduction"
                            ? "text-rose-500 font-medium"
                            : "text-emerald-600 dark:text-emerald-400 font-medium"
                        }
                      >
                        {item.category === "Deduction" ? "-" : ""}${item.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 p-3 rounded-[5px] bg-secondary/20 border border-border">
              <div>
                <span className="text-[10px] text-muted-foreground block">Gross Pay</span>
                <span className="font-bold text-foreground">{viewingPayslip.gross_pay}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Total Deductions</span>
                <span className="font-bold text-rose-500">-{viewingPayslip.total_deductions}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Net Disbursed</span>
                <span className="font-bold text-primary text-sm">{viewingPayslip.net_pay}</span>
              </div>
            </div>
          </div>
        </CustomDialog>
      )}
    </div>
  );
}
