import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, CircularProgress } from "@mui/material";
import { AccountBalanceWallet, Close, Edit } from "@mui/icons-material";
import { AppDrawer } from "shared/Drawer";
import { Input } from "shared/Input";
import { Select, type SelectOption } from "shared/Select";
import { ActiveInactiveField } from "shared/ActiveInactiveField";
import type { MasterSalaryStructure } from "services/masters";

/**
 * Form values for creating or editing a Salary Structure
 */
export interface SalaryStructureFormValues {
  name: string;
  code: string;
  description: string;
  basic_percentage: number;
  hra_percentage: number;
  da_percentage: number;
  special_allowance: number;
  pf_percentage: number;
  tax_deduction_type: "Standard" | "New Regime" | "Old Regime";
  status: "Active" | "Inactive";
}

/**
 * Props for ManageSalaryStructureDrawer
 */
export interface ManageSalaryStructureDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SalaryStructureFormValues) => Promise<void> | void;
  initialData?: MasterSalaryStructure | null;
}

/**
 * Tax deduction options
 */
const taxOptions: SelectOption[] = [
  { label: "Standard Regime", value: "Standard" },
  { label: "New Tax Regime (Section 115BAC)", value: "New Regime" },
  { label: "Old Tax Regime with Deductions", value: "Old Regime" },
];

/**
 * Validation schema for Salary Structure form
 */
const salaryStructureValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Structure name is required")
    .min(2, "Must be at least 2 characters"),
  code: Yup.string().trim().required("Code is required"),
  basic_percentage: Yup.number()
    .required("Basic % is required")
    .min(0, "Min 0%")
    .max(100, "Max 100%"),
  hra_percentage: Yup.number().required("HRA % is required").min(0, "Min 0%").max(100, "Max 100%"),
  da_percentage: Yup.number().required("DA % is required").min(0, "Min 0%").max(100, "Max 100%"),
  special_allowance: Yup.number().required("Special Allowance % is required").min(0, "Min 0%"),
  pf_percentage: Yup.number().required("PF % is required").min(0, "Min 0%").max(100, "Max 100%"),
  tax_deduction_type: Yup.string()
    .oneOf(["Standard", "New Regime", "Old Regime"])
    .required("Tax type is required"),
  description: Yup.string().trim().optional(),
  status: Yup.string().oneOf(["Active", "Inactive"]).required("Status is required"),
});

/**
 * Initial empty values for salary structure form
 */
const defaultInitialValues: SalaryStructureFormValues = {
  name: "",
  code: "",
  description: "",
  basic_percentage: 50,
  hra_percentage: 20,
  da_percentage: 10,
  special_allowance: 20,
  pf_percentage: 12,
  tax_deduction_type: "Standard",
  status: "Active",
};

/**
 * Drawer component for configuring compensation and salary structures with Formik and Yup validation
 *
 * @param props - Component configuration properties
 * @returns Rendered AppDrawer containing salary structure form
 */
export const ManageSalaryStructureDrawer: React.FC<ManageSalaryStructureDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);

  const formik = useFormik<SalaryStructureFormValues>({
    initialValues: initialData
      ? {
          name: initialData.name || "",
          code: initialData.code || "",
          description: initialData.description || "",
          basic_percentage: initialData.basic_percentage ?? 50,
          hra_percentage: initialData.hra_percentage ?? 20,
          da_percentage: initialData.da_percentage ?? 10,
          special_allowance: initialData.special_allowance ?? 20,
          pf_percentage: initialData.pf_percentage ?? 12,
          tax_deduction_type:
            (initialData.tax_deduction_type as "Standard" | "New Regime" | "Old Regime") ||
            "Standard",
          status: initialData.status || "Active",
        }
      : defaultInitialValues,
    enableReinitialize: true,
    validationSchema: salaryStructureValidationSchema,
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
      title={isEditing ? "Edit Salary Structure" : "Add New Salary Structure"}
      subtitle={
        isEditing
          ? `Modify allowance and deduction components for ${initialData?.name || ""}`
          : "Define payroll formula rules, percentage splits, and statutory deduction rates"
      }
      width={600}
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
                <AccountBalanceWallet className="!w-4 !h-4" />
              )
            }
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-4 !py-2 !rounded-[5px] shadow-sm"
          >
            {formik.isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Update Structure"
                : "Create Structure"}
          </Button>
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <Input
          name="name"
          label="Structure Name"
          placeholder="e.g. Standard Full-Time, Executive C-Suite, Intern"
          formik={formik}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="code"
            label="Structure Code"
            placeholder="e.g. SAL-STD"
            formik={formik}
            required
          />

          <Select
            name="tax_deduction_type"
            label="Tax Regime"
            options={taxOptions}
            formik={formik}
            required
          />
        </div>

        {/* Breakdown Breakdown Grid */}
        <div className="border border-border/80 rounded-[5px] p-4 flex flex-col gap-3.5 bg-secondary/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Earnings Percentage Components (% of CTC)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              name="basic_percentage"
              label="Basic Salary %"
              type="number"
              placeholder="50"
              formik={formik}
              required
            />

            <Input
              name="hra_percentage"
              label="HRA %"
              type="number"
              placeholder="20"
              formik={formik}
              required
            />

            <Input
              name="da_percentage"
              label="DA %"
              type="number"
              placeholder="10"
              formik={formik}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Input
              name="special_allowance"
              label="Special Allowance %"
              type="number"
              placeholder="20"
              formik={formik}
              required
            />

            <Input
              name="pf_percentage"
              label="Provident Fund (PF) %"
              type="number"
              placeholder="12"
              formik={formik}
              required
            />
          </div>
        </div>

        <ActiveInactiveField name="status" label="Status" formik={formik} required />

        <Input
          name="description"
          label="Description / Applicability Notes"
          placeholder="Which employee bands or departments this salary structure applies to"
          multiline
          rows={3}
          formik={formik}
        />
      </form>
    </AppDrawer>
  );
};
