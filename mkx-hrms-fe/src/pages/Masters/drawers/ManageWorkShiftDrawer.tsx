import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, CircularProgress } from "@mui/material";
import { AccessTime, Close, Edit } from "@mui/icons-material";
import { AppDrawer } from "shared/Drawer";
import { Input } from "shared/Input";
import { ActiveInactiveField } from "shared/ActiveInactiveField";
import type { MasterWorkShift } from "services/masters";

/**
 * Form values for creating or editing a Work Shift
 */
export interface WorkShiftFormValues {
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  grace_mins: number;
  description: string;
  status: "Active" | "Inactive";
}

/**
 * Props for ManageWorkShiftDrawer
 */
export interface ManageWorkShiftDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: WorkShiftFormValues) => Promise<void> | void;
  initialData?: MasterWorkShift | null;
}

/**
 * Validation schema for Work Shift form
 */
const workShiftValidationSchema = Yup.object({
  name: Yup.string().trim().required("Shift name is required").min(2, "Must be at least 2 characters"),
  code: Yup.string().trim().required("Code is required"),
  start_time: Yup.string().trim().required("Start time is required"),
  end_time: Yup.string().trim().required("End time is required"),
  grace_mins: Yup.number().required("Grace period is required").min(0, "Min 0 mins"),
  description: Yup.string().trim().optional(),
  status: Yup.string().oneOf(["Active", "Inactive"]).required("Status is required"),
});

/**
 * Initial empty values for work shift form
 */
const defaultInitialValues: WorkShiftFormValues = {
  name: "",
  code: "",
  start_time: "09:00 AM",
  end_time: "06:00 PM",
  grace_mins: 15,
  description: "",
  status: "Active",
};

/**
 * Drawer component for configuring work shifts and attendance grace windows with Formik and Yup validation
 *
 * @param props - Component configuration properties
 * @returns Rendered AppDrawer containing work shift form
 */
export const ManageWorkShiftDrawer: React.FC<ManageWorkShiftDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const formik = useFormik<WorkShiftFormValues>({
    initialValues: initialData
      ? {
          name: initialData.name || "",
          code: initialData.code || "",
          start_time: initialData.start_time || "09:00 AM",
          end_time: initialData.end_time || "06:00 PM",
          grace_mins: initialData.grace_mins ?? 15,
          description: initialData.description || "",
          status: initialData.status || "Active",
        }
      : defaultInitialValues,
    enableReinitialize: true,
    validationSchema: workShiftValidationSchema,
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
      title={isEditing ? "Edit Work Shift" : "Add New Work Shift"}
      subtitle={
        isEditing
          ? `Modify working hours and grace period for ${initialData?.name || ""}`
          : "Define daily work schedule hours and late punch-in grace tolerances"
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
                <AccessTime className="!w-4 !h-4" />
              )
            }
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-4 !py-2 !rounded-[5px] shadow-sm"
          >
            {formik.isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Update Shift"
                : "Create Shift"}
          </Button>
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <Input
          name="name"
          label="Shift Name"
          placeholder="e.g. Standard Day Shift, Night Shift, Weekend Rotational"
          formik={formik}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="code"
            label="Shift Code"
            placeholder="e.g. SHIFT-GEN"
            formik={formik}
            required
          />

          <Input
            name="grace_mins"
            label="Grace Tolerance (Mins)"
            type="number"
            placeholder="15"
            formik={formik}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="start_time"
            label="Start Time"
            placeholder="09:00 AM"
            formik={formik}
            required
          />

          <Input
            name="end_time"
            label="End Time"
            placeholder="06:00 PM"
            formik={formik}
            required
          />
        </div>

        <ActiveInactiveField
          name="status"
          label="Status"
          formik={formik}
          required
        />

        <Input
          name="description"
          label="Description / Policy Notes"
          placeholder="Shift details, break schedules, and overtime rules"
          multiline
          rows={3}
          formik={formik}
        />
      </form>
    </AppDrawer>
  );
};
