import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, CircularProgress, FormControlLabel, Switch } from "@mui/material";
import { Close, Edit, EventNote } from "@mui/icons-material";
import { AppDrawer } from "shared/Drawer";
import { Input } from "shared/Input";
import { ActiveInactiveField } from "shared/ActiveInactiveField";
import type { MasterLeaveType } from "services/masters";

/**
 * Form values for creating or editing a Leave Type
 */
export interface LeaveTypeFormValues {
  name: string;
  code: string;
  days_per_year: number;
  is_paid: boolean;
  color: string;
  description: string;
  status: "Active" | "Inactive";
}

/**
 * Props for ManageLeaveTypeDrawer
 */
export interface ManageLeaveTypeDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: LeaveTypeFormValues) => Promise<void> | void;
  initialData?: MasterLeaveType | null;
}

/**
 * Color palette presets for leave types
 */
const presetColors = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6366f1",
];

/**
 * Validation schema for Leave Type form
 */
const leaveTypeValidationSchema = Yup.object({
  name: Yup.string().trim().required("Leave type name is required").min(2, "Must be at least 2 characters"),
  code: Yup.string().trim().required("Code is required"),
  days_per_year: Yup.number().required("Allocated days per year is required").min(0, "Must be at least 0"),
  is_paid: Yup.boolean().default(true),
  color: Yup.string().trim().optional(),
  description: Yup.string().trim().optional(),
  status: Yup.string().oneOf(["Active", "Inactive"]).required("Status is required"),
});

/**
 * Initial empty values for leave type form
 */
const defaultInitialValues: LeaveTypeFormValues = {
  name: "",
  code: "",
  days_per_year: 12,
  is_paid: true,
  color: "#3b82f6",
  description: "",
  status: "Active",
};

/**
 * Drawer component for configuring workforce leave types with Formik and Yup validation
 *
 * @param props - Component configuration properties
 * @returns Rendered AppDrawer containing leave type form
 */
export const ManageLeaveTypeDrawer: React.FC<ManageLeaveTypeDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const formik = useFormik<LeaveTypeFormValues>({
    initialValues: initialData
      ? {
          name: initialData.name || "",
          code: initialData.code || "",
          days_per_year: initialData.days_per_year ?? 12,
          is_paid: initialData.is_paid ?? true,
          color: initialData.color || "#3b82f6",
          description: initialData.description || "",
          status: initialData.status || "Active",
        }
      : defaultInitialValues,
    enableReinitialize: true,
    validationSchema: leaveTypeValidationSchema,
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
      title={isEditing ? "Edit Leave Type" : "Add New Leave Type"}
      subtitle={
        isEditing
          ? `Modify leave entitlement criteria for ${initialData?.name || ""}`
          : "Configure a new leave category, allocation days, and payment policies"
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
                <EventNote className="!w-4 !h-4" />
              )
            }
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-4 !py-2 !rounded-[5px] shadow-sm"
          >
            {formik.isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Update Leave Type"
                : "Create Leave Type"}
          </Button>
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <Input
          name="name"
          label="Leave Type Name"
          placeholder="e.g. Casual Leave, Sick Leave, Maternity Leave"
          formik={formik}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="code"
            label="Leave Code"
            placeholder="e.g. CL, SL, EL"
            formik={formik}
            required
          />

          <Input
            name="days_per_year"
            label="Annual Days"
            type="number"
            placeholder="12"
            formik={formik}
            required
          />
        </div>

        <div className="border border-border/80 rounded-[5px] p-3.5 flex items-center justify-between bg-secondary/20">
          <div>
            <div className="text-xs font-semibold text-foreground">Paid Leave</div>
            <div className="text-[11px] text-muted-foreground">
              {formik.values.is_paid
                ? "Salary is paid during this leave"
                : "Unpaid / Loss of Pay leave"}
            </div>
          </div>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.is_paid}
                onChange={(e) => formik.setFieldValue("is_paid", e.target.checked)}
                size="small"
                color="primary"
              />
            }
            label=""
            className="!m-0"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Badge / Calendar Color Indicator
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => formik.setFieldValue("color", color)}
                className="w-7 h-7 rounded-full border-2 transition-transform duration-150 hover:scale-110 flex items-center justify-center cursor-pointer"
                style={{
                  backgroundColor: color,
                  borderColor: formik.values.color === color ? "#ffffff" : "transparent",
                  boxShadow:
                    formik.values.color === color
                      ? `0 0 0 2px ${color}`
                      : "none",
                }}
              />
            ))}
          </div>
        </div>

        <ActiveInactiveField
          name="status"
          label="Status"
          formik={formik}
          required
        />

        <Input
          name="description"
          label="Description / Policy Guidelines"
          placeholder="Guidance on when and how this leave type may be utilized"
          multiline
          rows={3}
          formik={formik}
        />
      </form>
    </AppDrawer>
  );
};
