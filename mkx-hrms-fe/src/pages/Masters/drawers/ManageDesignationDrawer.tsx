import React, { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, CircularProgress } from "@mui/material";
import { Badge, Close, Edit } from "@mui/icons-material";
import { AppDrawer } from "shared/Drawer";
import { Input } from "shared/Input";
import { Select, type SelectOption } from "shared/Select";
import ActiveInactiveField from "shared/ActiveInactiveField";
import {
  useGetMasterDepartments,
  type MasterDesignation,
} from "services/masters";

/**
 * Form values for creating or editing a Designation
 */
export interface DesignationFormValues {
  title: string;
  code: string;
  department_id: number | string;
  description: string;
  status: "Active" | "Inactive";
}

/**
 * Props for ManageDesignationDrawer
 */
export interface ManageDesignationDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: DesignationFormValues) => Promise<void> | void;
  initialData?: MasterDesignation | null;
}

/**
 * Validation schema for Designation form
 */
const designationValidationSchema = Yup.object({
  title: Yup.string().trim().required("Designation title is required").min(2, "Must be at least 2 characters"),
  code: Yup.string().trim().optional(),
  department_id: Yup.mixed().optional(),
  description: Yup.string().trim().optional(),
  status: Yup.string().oneOf(["Active", "Inactive"]).required("Status is required"),
});

/**
 * Initial empty values for designation form
 */
const defaultInitialValues: DesignationFormValues = {
  title: "",
  code: "",
  department_id: "",
  description: "",
  status: "Active",
};

/**
 * Drawer component for configuring workforce job designations with Formik and Yup validation
 *
 * @param props - Component configuration properties
 * @returns Rendered AppDrawer containing designation form
 */
export const ManageDesignationDrawer: React.FC<ManageDesignationDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);
  const { data: deptRes } = useGetMasterDepartments();

  /**
   * Department select options
   */
  const departmentOptions: SelectOption[] = useMemo(() => {
    const list = deptRes?.data || [];
    const opts: SelectOption[] = [{ label: "None / Cross-Department", value: "" }];
    for (const d of list) {
      opts.push({ label: `${d.name} (${d.code})`, value: d.id });
    }
    return opts;
  }, [deptRes?.data]);

  const formik = useFormik<DesignationFormValues>({
    initialValues: initialData
      ? {
          title: initialData.title || "",
          code: initialData.code || "",
          department_id: initialData.department_id !== null && initialData.department_id !== undefined ? initialData.department_id : "",
          description: initialData.description || "",
          status: initialData.status || "Active",
        }
      : defaultInitialValues,
    enableReinitialize: true,
    validationSchema: designationValidationSchema,
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
      title={isEditing ? "Edit Designation" : "Add New Designation"}
      subtitle={
        isEditing
          ? `Modify position details and department assignment for ${initialData?.title || ""}`
          : "Define a job title / designation and link it to an organizational department"
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
                <Badge className="!w-4 !h-4" />
              )
            }
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-4 !py-2 !rounded-[5px] shadow-sm"
          >
            {formik.isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Update Designation"
                : "Create Designation"}
          </Button>
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <Input
          name="title"
          label="Designation Title"
          placeholder="e.g. Senior Software Engineer, Account Manager"
          formik={formik}
          required
        />

        <Input
          name="code"
          label="Designation Code"
          placeholder="e.g. DES-001 or SSE (Optional)"
          formik={formik}
        />

        <Select
          name="department_id"
          label="Department"
          options={departmentOptions}
          formik={formik}
        />

        <ActiveInactiveField
          name="status"
          label="Status"
          formik={formik}
          required
        />

        <Input
          name="description"
          label="Job Description"
          placeholder="Core job responsibilities and competency requirements"
          multiline
          rows={3}
          formik={formik}
        />
      </form>
    </AppDrawer>
  );
};
