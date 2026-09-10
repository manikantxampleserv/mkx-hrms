import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, CircularProgress } from "@mui/material";
import { Business, Close, Edit } from "@mui/icons-material";
import { AppDrawer } from "shared/Drawer";
import { Input } from "shared/Input";
import ActiveInactiveField from "shared/ActiveInactiveField";
import type { MasterDepartment } from "services/masters";

/**
 * Form values for creating or editing a Department
 */
export interface DepartmentFormValues {
  name: string;
  code: string;
  description: string;
  status: "Active" | "Inactive";
}

/**
 * Props for ManageDepartmentDrawer
 */
export interface ManageDepartmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: DepartmentFormValues) => Promise<void> | void;
  initialData?: MasterDepartment | null;
}

/**
 * Validation schema for Department form
 */
const departmentValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Department name is required")
    .min(2, "Must be at least 2 characters"),
  code: Yup.string().trim().optional(),
  description: Yup.string().trim().optional(),
  status: Yup.string().oneOf(["Active", "Inactive"]).required("Status is required"),
});

/**
 * Initial empty values for department form
 */
const defaultInitialValues: DepartmentFormValues = {
  name: "",
  code: "",
  description: "",
  status: "Active",
};

/**
 * Drawer component for creating and updating departments with Formik and Yup validation
 *
 * @param props - Component configuration properties
 * @returns Rendered AppDrawer containing Formik form
 */
export const ManageDepartmentDrawer: React.FC<ManageDepartmentDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const formik = useFormik<DepartmentFormValues>({
    initialValues: initialData
      ? {
          name: initialData.name || "",
          code: initialData.code || "",
          description: initialData.description || "",
          status: initialData.status || "Active",
        }
      : defaultInitialValues,
    enableReinitialize: true,
    validationSchema: departmentValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit(values);
        resetForm();
        onClose();
      } catch (err: unknown) {
        setSubmitting(false);
      }
    },
  });

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Department" : "Add New Department"}
      subtitle={
        isEditing
          ? `Update organization unit details for ${initialData?.name || ""}`
          : "Create a new department unit to organize employees and designations"
      }
      width={580}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={formik.isSubmitting}
            startIcon={<Close className="!w-4 !h-4" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-4 !py-2 !rounded-[5px]"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => formik.handleSubmit()}
            disabled={formik.isSubmitting || !formik.isValid}
            startIcon={
              formik.isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : isEditing ? (
                <Edit className="!w-4 !h-4" />
              ) : (
                <Business className="!w-4 !h-4" />
              )
            }
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-4 !py-2 !rounded-[5px] shadow-sm"
          >
            {formik.isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Update Department"
                : "Create Department"}
          </Button>
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <Input
          name="name"
          label="Department Name"
          placeholder="e.g. Engineering, Sales, Human Resources"
          formik={formik}
          required
        />

        <Input
          name="code"
          label="Department Code"
          placeholder="e.g. DEP-001 or ENG (Optional)"
          formik={formik}
        />

        <ActiveInactiveField name="status" label="Status" formik={formik} required />

        <Input
          name="description"
          label="Description"
          placeholder="Brief summary of functions and goals of this department"
          multiline
          rows={3}
          formik={formik}
        />
      </form>
    </AppDrawer>
  );
};
