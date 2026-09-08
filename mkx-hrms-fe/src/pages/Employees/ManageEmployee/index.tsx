import { Close, Edit, PersonAdd } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { useFormik } from "formik";
import React from "react";
import { useGetEmployeeFilters, useGetEmployees } from "services/employees";
import { CustomDatePicker } from "shared/DatePicker";
import { AppDrawer } from "shared/Drawer";
import { ImagePicker } from "shared/ImagePicker";
import { Input } from "shared/Input";
import { Select, type SelectOption } from "shared/Select";
import * as Yup from "yup";

/**
 * Data contract for the Add Employee form values
 */
export interface ManageEmployeeFormValues {
  /** Full legal or preferred employee name */
  name: string;
  /** Work email address */
  email: string;
  /** Job designation / title */
  role: string;
  /** Department assignment */
  department: string;
  /** Initial employment status */
  status: "Active" | "On Leave" | "Terminated";
  /** Designated reporting manager */
  manager: string;
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
  initialData?: ManageEmployeeFormValues | null;
}

/**
 * Status options for selection
 */
const statusOptions: SelectOption[] = [
  { label: "Active", value: "Active" },
  { label: "On Leave", value: "On Leave" },
  { label: "Terminated", value: "Terminated" },
];

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
  role: Yup.string().trim().required("Role / Job title is required"),
  department: Yup.string().required("Department selection is required"),
  status: Yup.string()
    .oneOf(["Active", "On Leave", "Terminated"])
    .required("Employment status is required"),
  manager: Yup.string().trim().required("Reporting manager is required"),
  join_date: Yup.string().required("Join date is required"),
});

/**
 * Initial empty form values
 */
const initialValues: ManageEmployeeFormValues = {
  name: "",
  email: "",
  role: "",
  department: "",
  status: "Active",
  manager: "",
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

  /**
   * Dynamic department options loaded directly from PostgreSQL
   */
  const departmentOptions: SelectOption[] = React.useMemo(() => {
    const depts = filtersResponse?.data?.departments || [];
    return depts.map((dept) => ({ label: dept, value: dept }));
  }, [filtersResponse?.data?.departments]);

  const defaultDepartment = filtersResponse?.data?.departments?.[0] || "";

  const roleOptions: SelectOption[] = React.useMemo(() => {
    const roles = filtersResponse?.data?.roles || [];
    return roles.map((r) => ({ label: r, value: r }));
  }, [filtersResponse?.data?.roles]);

  const managerOptions: SelectOption[] = React.useMemo(() => {
    const employees = employeesResponse?.data || [];
    return employees.map((emp) => ({ label: emp.name, value: emp.name }));
  }, [employeesResponse?.data]);

  const formik = useFormik<ManageEmployeeFormValues>({
    initialValues: initialData
      ? {
          name: initialData.name || "",
          email: initialData.email || "",
          role: initialData.role || "",
          department: initialData.department || defaultDepartment,
          status: initialData.status || "Active",
          manager: initialData.manager || "",
          join_date: initialData.join_date || new Date().toISOString().split("T")[0],
          avatar: initialData.avatar || "",
        }
      : { ...initialValues, department: defaultDepartment },
    enableReinitialize: true,
    validationSchema: employeeValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit(values);
        resetForm();
        onClose();
      } catch (err: any) {
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
      <form onSubmit={formik.handleSubmit} className="space-y-4">
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
            name="role"
            label="Job Title / Role"
            options={roleOptions}
            required
            formik={formik}
          />

          <Select<ManageEmployeeFormValues>
            name="department"
            label="Department"
            options={departmentOptions}
            required
            formik={formik}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select<ManageEmployeeFormValues>
            name="manager"
            label="Reporting Manager"
            options={managerOptions}
            required
            formik={formik}
          />

          <CustomDatePicker<ManageEmployeeFormValues>
            name="join_date"
            label="Join Date"
            formik={formik}
          />
        </div>

        <Select<ManageEmployeeFormValues>
          name="status"
          label="Employment Status"
          options={statusOptions}
          required
          formik={formik}
        />
      </form>
    </AppDrawer>
  );
};

export default ManageEmployee;
