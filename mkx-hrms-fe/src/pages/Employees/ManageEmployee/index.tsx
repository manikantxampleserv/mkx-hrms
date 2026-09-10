import { Close, Edit, PersonAdd } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { useFormik } from "formik";
import React from "react";
import { useGetEmployeeFilters, useGetEmployees } from "services/employees";
import { useGetMasterDepartments, useGetMasterRoles } from "services/masters";
import { CustomDatePicker } from "shared/DatePicker";
import { AppDrawer } from "shared/Drawer";
import { ImagePicker } from "shared/ImagePicker";
import { Input } from "shared/Input";
import { Select, type SelectOption } from "shared/Select";
import { ActiveInactiveField } from "shared/ActiveInactiveField";
import * as Yup from "yup";

/**
 * Data contract for the Add Employee form values
 */
export interface ManageEmployeeFormValues {
  /** Full legal or preferred employee name */
  name: string;
  /** Work email address */
  email: string;
  /** Selected Role ID */
  role_id: number | "";
  /** Selected Department ID */
  department_id: number | "";
  /** Initial employment status */
  status: "Active" | "Inactive";
  /** Designated reporting manager employee database ID */
  manager_id: number | "" | null;
  /** Official company join date (YYYY-MM-DD) */
  join_date: string;
  /** Optional profile picture base64 string */
  avatar?: string;
}

/**
 * Props for the ManageEmployee component
 */
export interface ManageEmployeeProps {
  /** Visibility state of the drawer */
  open: boolean;
  /** Callback to close the drawer */
  onClose: () => void;
  /** Callback fired with the newly created or updated employee record */
  onSubmit: (employee: ManageEmployeeFormValues) => Promise<void> | void;
  /** Optional initial employee data when editing */
  initialData?: (Partial<ManageEmployeeFormValues> & {
    id?: string;
    db_id?: number;
    role?: string;
    department?: string;
    manager?: string;
  }) | null;
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
  manager_id: Yup.number().nullable().optional(),
  join_date: Yup.string().required("Join date is required"),
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
  avatar: "",
};

/**
 * Drawer form dialog component for provisioning or editing an employee
 * using Formik and Yup validation.
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

  /**
   * Dynamic department options loaded strictly from Master Departments
   */
  const departmentOptions: SelectOption[] = React.useMemo(() => {
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
  const roleOptions: SelectOption[] = React.useMemo(() => {
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
  const managerOptions: SelectOption[] = React.useMemo(() => {
    const employees = employeesResponse?.data || [];
    return employees
      .filter((emp) => !initialData?.db_id || emp.db_id !== initialData.db_id)
      .map((emp) => ({ label: emp.name, value: emp.db_id || 0 }))
      .filter((m) => m.value > 0);
  }, [employeesResponse?.data, initialData?.db_id]);

  const initialRoleId = React.useMemo(() => {
    if (initialData?.role_id) return initialData.role_id;
    if (initialData?.role) {
      const match = roleOptions.find(
        (r) => r.label.toLowerCase() === initialData.role?.toLowerCase(),
      );
      if (match) return match.value as number;
    }
    return (roleOptions[0]?.value as number) ?? "";
  }, [initialData?.role_id, initialData?.role, roleOptions]);

  const initialDeptId = React.useMemo(() => {
    if (initialData?.department_id) return initialData.department_id;
    if (initialData?.department) {
      const match = departmentOptions.find(
        (d) => d.label.toLowerCase() === initialData.department?.toLowerCase(),
      );
      if (match) return match.value as number;
    }
    return (departmentOptions[0]?.value as number) ?? "";
  }, [initialData?.department_id, initialData?.department, departmentOptions]);

  const initialManagerId = React.useMemo(() => {
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
          status: initialData.status || "Active",
          manager_id: initialManagerId,
          join_date: initialData.join_date || new Date().toISOString().split("T")[0],
          avatar: initialData.avatar || "",
        }
      : {
          ...initialValues,
          department_id: (departmentOptions[0]?.value as number) ?? "",
          role_id: (roleOptions[0]?.value as number) ?? "",
        },
    enableReinitialize: true,
    validationSchema: employeeValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit(values);
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
          ? "Update the personal and organizational details for this team member."
          : "Fill in the personal and organizational details to onboard a new team member."
      }
      width={600}
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
            formik={formik}
          />

          <CustomDatePicker<ManageEmployeeFormValues>
            name="join_date"
            label="Join Date"
            formik={formik}
          />
        </div>

        <ActiveInactiveField<ManageEmployeeFormValues>
          name="status"
          label="Employment Status"
          formik={formik}
          required
        />
      </form>
    </AppDrawer>
  );
};

export default ManageEmployee;
