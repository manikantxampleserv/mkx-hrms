import { Close, Edit, PersonAdd, Delete, Add, AccountBalanceWallet } from "@mui/icons-material";
import { Button, CircularProgress, IconButton } from "@mui/material";
import { useFormik } from "formik";
import React, { useState, useEffect, useMemo } from "react";
import {
  useGetEmployeeFilters,
  useGetEmployees,
  useGetEmployeeSalaryStructures,
} from "services/employees";
import {
  useGetMasterDepartments,
  useGetMasterRoles,
  useGetMasterWorkShifts,
  useGetMasterSalaryStructures,
} from "services/masters";
import { CustomDatePicker } from "shared/DatePicker";
import { AppDrawer } from "shared/Drawer";
import { ImagePicker } from "shared/ImagePicker";
import { Input } from "shared/Input";
import { Select, type SelectOption } from "shared/Select";
import { ActiveInactiveField } from "shared/ActiveInactiveField";
import * as Yup from "yup";

/**
 * Data contract for an assigned salary structure row inside the employee form
 */
export interface AssignedSalaryStructureRow {
  salary_structure_id: number;
  amount: number;
  status?: string;
}

/**
 * Data contract for the Add/Edit Employee form values
 */
export interface ManageEmployeeFormValues {
  name: string;
  email: string;
  role_id: number | "";
  department_id: number | "";
  shift_id?: number | "" | null;
  status: "Active" | "Inactive";
  manager_id: number | "" | null;
  join_date: string;
  birth_date?: string;
  address?: string;
  phone?: string;
  avatar?: string;
  salary_structures?: AssignedSalaryStructureRow[];
}

/**
 * Props for the ManageEmployee component
 */
export interface ManageEmployeeProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (employee: ManageEmployeeFormValues) => Promise<void> | void;
  initialData?:
    | (Partial<ManageEmployeeFormValues> & {
        id?: string;
        db_id?: number;
        role?: string;
        department?: string;
        shift?: string;
        manager?: string;
      })
    | null;
}

/**
 * Yup schema defining validation rules for employee creation
 */
const employeeValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Full name is required")
    .min(2, "Name must be at least 2 characters"),
  email: Yup.string()
    .trim()
    .email("Must be a valid email address")
    .required("Work email is required"),
  role_id: Yup.number()
    .typeError("Role selection is required")
    .required("Role selection is required"),
  department_id: Yup.number()
    .typeError("Department selection is required")
    .required("Department selection is required"),
  status: Yup.string().oneOf(["Active", "Inactive"]).required("Employment status is required"),
  manager_id: Yup.number()
    .typeError("Reporting manager is required")
    .required("Reporting manager is required"),
  join_date: Yup.string().required("Join date is required"),
  birth_date: Yup.string().optional(),
  address: Yup.string().trim().optional(),
  phone: Yup.string()
    .trim()
    .matches(/^[0-9+\-\s()]*$/, "Phone number can only contain numbers, spaces, and + - ( )")
    .min(8, "Phone number must be at least 8 characters")
    .max(16, "Phone number cannot exceed 16 characters")
    .optional(),
});

/**
 * Initial empty form values
 */
const initialValues: ManageEmployeeFormValues = {
  name: "",
  email: "",
  role_id: "",
  department_id: "",
  status: "Active",
  manager_id: "",
  join_date: new Date().toISOString().split("T")[0],
  birth_date: "",
  address: "",
  phone: "",
  avatar: "",
  salary_structures: [],
};

/**
 * Drawer form dialog component for provisioning or editing an employee
 * Supports dynamic assignment of multiple salary structures, base salaries, and deductions.
 *
 * @param props - Component configuration props
 * @returns The rendered ManageEmployee
 */
export const ManageEmployee: React.FC<ManageEmployeeProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const { data: filtersResponse } = useGetEmployeeFilters();
  const { data: employeesResponse } = useGetEmployees();
  const { data: masterDepartmentsResponse } = useGetMasterDepartments();
  const { data: masterRolesResponse } = useGetMasterRoles();
  const { data: masterWorkShiftsResponse } = useGetMasterWorkShifts();
  const { data: masterSalaryStructuresResponse } = useGetMasterSalaryStructures();
  const { data: existingStructuresResponse } = useGetEmployeeSalaryStructures(initialData?.db_id);

  const [assignedStructures, setAssignedStructures] = useState<AssignedSalaryStructureRow[]>([]);

  const masterSalaryStructures = useMemo(
    () => masterSalaryStructuresResponse?.data || [],
    [masterSalaryStructuresResponse?.data],
  );

  /**
   * Sync assigned salary structures when editing employee or loaded from server
   */
  useEffect(() => {
    if (existingStructuresResponse?.data && existingStructuresResponse.data.length > 0) {
      setAssignedStructures(
        existingStructuresResponse.data.map((item) => ({
          salary_structure_id: item.salary_structure_id,
          amount: Number(item.amount),
          status: item.status || "Active",
        })),
      );
    } else if (initialData?.salary_structures && initialData.salary_structures.length > 0) {
      setAssignedStructures(initialData.salary_structures);
    } else if (!isEditing && masterSalaryStructures.length > 0) {
      const defaults = masterSalaryStructures
        .filter((s) => s.status === "Active" && s.is_base_salary)
        .map((s) => ({
          salary_structure_id: s.id,
          amount: Number(s.default_value) || 3000,
          status: "Active",
        }));
      setAssignedStructures(defaults);
    }
  }, [existingStructuresResponse?.data, initialData, isEditing, masterSalaryStructures]);

  /**
   * Options for selecting salary structures in table rows
   */
  const structureOptions: SelectOption[] = useMemo(() => {
    return masterSalaryStructures
      .filter((s) => s.status === "Active")
      .map((s) => ({
        label: s.name,
        value: s.id,
        sublabel: `${s.code} • ${s.is_deduction ? "Deduction" : "Earning"}`,
        avatar: s.name.charAt(0).toUpperCase(),
      }));
  }, [masterSalaryStructures]);

  /**
   * Calculate live financial metrics across assigned components
   */
  const { totalGross, totalDeductions, netSalary } = useMemo(() => {
    let gross = 0;
    let deductions = 0;

    assignedStructures.forEach((item) => {
      const master = masterSalaryStructures.find((m) => m.id === item.salary_structure_id);
      const amt = Number(item.amount) || 0;
      if (master?.is_deduction) {
        deductions += amt;
      } else {
        gross += amt;
      }
    });

    const net = Math.max(0, gross - deductions);
    return {
      totalGross: gross,
      totalDeductions: deductions,
      netSalary: net,
    };
  }, [assignedStructures, masterSalaryStructures]);

  /**
   * Adds a new salary structure row to the itemized compensation table
   */
  const handleAddStructureRow = () => {
    const assignedIds = new Set(assignedStructures.map((s) => s.salary_structure_id));
    const available = masterSalaryStructures.find(
      (s) => !assignedIds.has(s.id) && s.status === "Active",
    );
    const targetId = available ? available.id : masterSalaryStructures[0]?.id || 0;
    const targetMaster = masterSalaryStructures.find((s) => s.id === targetId);

    setAssignedStructures((prev) => [
      ...prev,
      {
        salary_structure_id: targetId,
        amount: targetMaster ? Number(targetMaster.default_value) || 0 : 0,
        status: "Active",
      },
    ]);
  };

  /**
   * Updates the selected salary structure for a specific row
   *
   * @param index - Target row index
   * @param structureId - Selected structure id
   */
  const handleRowStructureChange = (index: number, structureId: number) => {
    const master = masterSalaryStructures.find((s) => s.id === structureId);
    setAssignedStructures((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        salary_structure_id: structureId,
        amount: master ? Number(master.default_value) || 0 : updated[index].amount,
      };
      return updated;
    });
  };

  /**
   * Updates the numerical amount for a specific row
   *
   * @param index - Target row index
   * @param amount - Newly entered numerical amount
   */
  const handleRowAmountChange = (index: number, amount: number) => {
    setAssignedStructures((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        amount: Math.max(0, amount),
      };
      return updated;
    });
  };

  /**
   * Removes a compensation row from the table
   *
   * @param index - Target row index to remove
   */
  const handleRemoveRow = (index: number) => {
    setAssignedStructures((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Dynamic shift options loaded strictly from Master Work Shifts
   */
  const shiftOptions: SelectOption[] = useMemo(() => {
    const shifts = masterWorkShiftsResponse?.data || [];
    return shifts
      .filter((s) => s.status === "Active" || s.id === initialData?.shift_id)
      .map((s) => ({
        label: `${s.name} (${s.start_time} - ${s.end_time})`,
        value: s.id,
      }));
  }, [masterWorkShiftsResponse?.data, initialData?.shift_id]);

  /**
   * Dynamic department options loaded strictly from Master Departments
   */
  const departmentOptions: SelectOption[] = useMemo(() => {
    const depts = masterDepartmentsResponse?.data || [];
    const activeDepts = depts
      .filter((dept) => dept.status === "Active" || dept.id === initialData?.department_id)
      .map((dept) => ({ label: dept.name, value: dept.id }));

    if (activeDepts.length > 0) {
      return activeDepts;
    }

    return (filtersResponse?.data?.departments || []).map((dept, idx) => ({
      label: dept,
      value: idx + 1,
    }));
  }, [
    masterDepartmentsResponse?.data,
    filtersResponse?.data?.departments,
    initialData?.department_id,
  ]);

  /**
   * Dynamic role options loaded strictly from Master Roles table
   */
  const roleOptions: SelectOption[] = useMemo(() => {
    const roles = masterRolesResponse?.data || [];
    const activeRoles = roles
      .filter((role) => role.status === "Active" || role.id === initialData?.role_id)
      .map((role) => ({ label: role.name, value: role.id }));

    if (activeRoles.length > 0) {
      return activeRoles;
    }

    return (filtersResponse?.data?.roles || []).map((r, idx) => ({
      label: r,
      value: idx + 1,
    }));
  }, [masterRolesResponse?.data, filtersResponse?.data?.roles, initialData?.role_id]);

  /**
   * Dynamic manager options loaded from existing employees
   */
  const managerOptions: SelectOption[] = useMemo(() => {
    const employees = employeesResponse?.data || [];
    return employees
      .filter((emp) => !initialData?.db_id || emp.db_id !== initialData.db_id)
      .map((emp) => {
        const initials =
          `${emp.first_name?.charAt(0) || ""}${emp.last_name?.charAt(0) || ""}`.toUpperCase() ||
          emp.name.charAt(0).toUpperCase();
        return {
          label: emp.name,
          value: emp.db_id || 0,
          sublabel: emp.email,
          avatar: emp.avatar || initials,
        };
      })
      .filter((m) => (m.value as number) > 0);
  }, [employeesResponse?.data, initialData?.db_id]);

  const initialRoleId = useMemo(() => {
    if (initialData?.role_id) return initialData.role_id;
    if (initialData?.role) {
      const match = roleOptions.find(
        (r) => r.label.toLowerCase() === initialData.role?.toLowerCase(),
      );
      if (match) return match.value as number;
    }
    return (roleOptions[0]?.value as number) ?? "";
  }, [initialData?.role_id, initialData?.role, roleOptions]);

  const initialDeptId = useMemo(() => {
    if (initialData?.department_id) return initialData.department_id;
    if (initialData?.department) {
      const match = departmentOptions.find(
        (d) => d.label.toLowerCase() === initialData.department?.toLowerCase(),
      );
      if (match) return match.value as number;
    }
    return (departmentOptions[0]?.value as number) ?? "";
  }, [initialData?.department_id, initialData?.department, departmentOptions]);

  const initialShiftId = useMemo(() => {
    if (initialData?.shift_id) return initialData.shift_id;
    if (initialData?.shift) {
      const match = shiftOptions.find((s) =>
        s.label.toLowerCase().includes(initialData.shift?.toLowerCase() || ""),
      );
      if (match) return match.value as number;
    }
    return (shiftOptions[0]?.value as number) ?? "";
  }, [initialData?.shift_id, initialData?.shift, shiftOptions]);

  const initialManagerId = useMemo(() => {
    if (initialData?.manager_id) return initialData.manager_id;
    if (initialData?.manager && initialData.manager !== "None") {
      const match = managerOptions.find(
        (m) => m.label.toLowerCase() === initialData.manager?.toLowerCase(),
      );
      if (match) return match.value as number;
    }
    return "";
  }, [initialData?.manager_id, initialData?.manager, managerOptions]);

  const formik = useFormik<ManageEmployeeFormValues>({
    initialValues: initialData
      ? {
          name: initialData.name || "",
          email: initialData.email || "",
          role_id: initialRoleId,
          department_id: initialDeptId,
          shift_id: initialShiftId,
          status: initialData.status || "Active",
          manager_id: initialManagerId,
          join_date: initialData.join_date || new Date().toISOString().split("T")[0],
          birth_date: initialData.birth_date || "",
          address: initialData.address || "",
          phone: initialData.phone || "",
          avatar: initialData.avatar || "",
          salary_structures: assignedStructures,
        }
      : {
          ...initialValues,
          department_id: (departmentOptions[0]?.value as number) ?? "",
          role_id: (roleOptions[0]?.value as number) ?? "",
          shift_id: (shiftOptions[0]?.value as number) ?? "",
          salary_structures: assignedStructures,
        },
    enableReinitialize: true,
    validationSchema: employeeValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit({
          ...values,
          salary_structures: assignedStructures,
        });
        resetForm();
        onClose();
      } catch (err: unknown) {
      } finally {
        setSubmitting(false);
      }
    },
  });

  /**
   * Handle safe modal close and form reset
   */
  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <AppDrawer
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit Employee" : "Add New Employee"}
      subtitle={
        isEditing
          ? "Update personal, organizational, and compensation details for this team member."
          : "Fill in personal, organizational, and compensation structures to onboard a team member."
      }
      width={820}
      footer={
        <>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={formik.isSubmitting}
            startIcon={<Close className="!w-4 !h-4" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-4 !py-2 !rounded-[5px]"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
            startIcon={
              formik.isSubmitting ? (
                <CircularProgress size={14} color="inherit" />
              ) : isEditing ? (
                <Edit className="!w-4 !h-4" />
              ) : (
                <PersonAdd className="!w-4 !h-4" />
              )
            }
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-4 !py-2 !rounded-[5px] shadow-sm"
          >
            {formik.isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Save Employee"}
          </Button>
        </>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <ImagePicker<ManageEmployeeFormValues>
          name="avatar"
          label="Profile Picture"
          formik={formik}
          initials={formik.values.name ? formik.values.name.charAt(0).toUpperCase() : "EMP"}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input<ManageEmployeeFormValues>
            name="name"
            label="Full Name"
            placeholder="e.g. Sarah Connor"
            required
            formik={formik}
          />

          <Input<ManageEmployeeFormValues>
            name="email"
            label="Work Email"
            type="email"
            placeholder="e.g. sarah@mkx.com"
            required
            formik={formik}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select<ManageEmployeeFormValues>
            name="role_id"
            label="Role"
            options={roleOptions}
            required
            formik={formik}
          />

          <Select<ManageEmployeeFormValues>
            name="department_id"
            label="Department"
            options={departmentOptions}
            required
            formik={formik}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select<ManageEmployeeFormValues>
            name="manager_id"
            label="Reporting Manager"
            options={managerOptions}
            required
            formik={formik}
          />

          <Select<ManageEmployeeFormValues>
            name="shift_id"
            label="Work Shift"
            options={shiftOptions}
            placeholder="Select assigned shift"
            formik={formik}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CustomDatePicker<ManageEmployeeFormValues>
            name="join_date"
            label="Join Date"
            formik={formik}
          />

          <CustomDatePicker<ManageEmployeeFormValues>
            name="birth_date"
            label="Date of Birth"
            formik={formik}
          />
        </div>

        <div className="border border-border/80 rounded-[5px] p-4 flex flex-col gap-3 bg-secondary/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Salary Structures & Compensation Items
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure earnings, allowances, deductions, and base pay for this employee.
              </p>
            </div>
            <Button
              variant="outlined"
              size="small"
              onClick={handleAddStructureRow}
              startIcon={<Add className="!w-4 !h-4" />}
              className="!text-xs !normal-case !border-primary !text-primary hover:!bg-primary/10 font-semibold !rounded-[5px] !px-3 !py-1.5"
            >
              Add Item
            </Button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-zinc-900/70 border-b border-border text-xs font-semibold text-slate-700 dark:text-zinc-200">
                    <th className="py-3 px-3.5 min-w-[240px]">Structure Component</th>
                    <th className="py-3 px-3.5 min-w-[100px]">Category</th>
                    <th className="py-3 px-3.5 min-w-[100px]">Tax Status</th>
                    <th className="py-3 px-3.5 min-w-[110px]">Calculation</th>
                    <th className="py-3 px-3.5 min-w-[130px]">Monthly Amount</th>
                    <th className="py-3 px-3.5 text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assignedStructures.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                        <AccountBalanceWallet className="!w-10 !h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <span className="font-medium block">
                          No compensation items assigned yet
                        </span>
                        <span className="text-[11px] text-muted-foreground/70 block mt-0.5">
                          Click &quot;+ Add Item&quot; above to assign a salary structure.
                        </span>
                      </td>
                    </tr>
                  ) : (
                    assignedStructures.map((row, idx) => {
                      const master = masterSalaryStructures.find(
                        (s) => s.id === row.salary_structure_id,
                      );
                      const isDeduction = master?.is_deduction;
                      const isBase = master?.is_base_salary;

                      return (
                        <tr key={idx} className="hover:bg-secondary/20 transition-colors text-xs">
                          <td className="py-2.5 px-3.5">
                            <Select
                              name={`salary_structure_${idx}`}
                              options={structureOptions}
                              value={row.salary_structure_id}
                              onValueChange={(val) => handleRowStructureChange(idx, Number(val))}
                              size="small"
                              placeholder="Select component"
                            />
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap text-xs text-foreground font-medium">
                            {isDeduction ? "Deduction" : "Earning"}
                            {isBase && (
                              <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                Base
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap text-xs text-muted-foreground">
                            {master?.is_taxable ? "Taxable" : "Exempt"}
                          </td>
                          <td className="py-2.5 px-3.5 whitespace-nowrap text-xs text-muted-foreground">
                            {master?.calculation_type || "Fixed"}
                          </td>
                          <td className="py-2.5 px-3.5">
                            <Input
                              name={`amount_${idx}`}
                              type="number"
                              value={row.amount}
                              onChange={(e) =>
                                handleRowAmountChange(idx, Number(e.target.value) || 0)
                              }
                              placeholder="0.00"
                              size="small"
                              className="w-28"
                            />
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveRow(idx)}
                              className="!bg-red-50 dark:!bg-red-950/40 hover:!bg-red-100 dark:hover:!bg-red-900/60 !text-red-500 !border !border-red-100 dark:!border-red-900/40 !rounded-[5px] !w-9 !h-9 !p-0"
                              title="Delete Item"
                            >
                              <Delete className="!w-4 !h-4" />
                            </IconButton>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {assignedStructures.length > 0 && (
              <div className="grid grid-cols-3 gap-2 p-3 bg-secondary/30 border-t border-border text-xs">
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
                  <span className="font-bold text-foreground text-sm">
                    ${netSalary.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input<ManageEmployeeFormValues>
            name="phone"
            type="tel"
            label="Phone Number"
            placeholder="e.g. +1 234 567 8900"
            formik={formik}
          />

          <ActiveInactiveField<ManageEmployeeFormValues>
            name="status"
            label="Employment Status"
            formik={formik}
            required
          />
        </div>

        <Input<ManageEmployeeFormValues>
          type="textarea"
          name="address"
          label="Residential Address"
          placeholder="e.g. 123 Main St, Springfield, IL 62701"
          formik={formik}
        />
      </form>
    </AppDrawer>
  );
};

export default ManageEmployee;
