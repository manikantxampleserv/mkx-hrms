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
 * Form values for creating or editing a Salary Structure component
 */
export interface SalaryStructureFormValues {
  name: string;
  code: string;
  description: string;
  is_deduction: boolean;
  is_taxable: boolean;
  is_base_salary: boolean;
  calculation_type: "Fixed" | "Percentage";
  default_value: number;
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
 * Calculation type options: Fixed vs Percentage
 */
const calculationTypeOptions: SelectOption[] = [
  { label: "Fixed Amount", value: "Fixed" },
  { label: "Percentage (%)", value: "Percentage" },
];

/**
 * Validation schema for Salary Structure form
 */
const salaryStructureValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Component name is required")
    .min(2, "Must be at least 2 characters"),
  code: Yup.string().trim().required("Component code is required"),
  calculation_type: Yup.string()
    .oneOf(["Fixed", "Percentage"])
    .required("Calculation type is required"),
  default_value: Yup.number()
    .typeError("Default value must be a number")
    .min(0, "Cannot be negative")
    .required("Default value is required"),
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
  is_deduction: false,
  is_taxable: true,
  is_base_salary: false,
  calculation_type: "Fixed",
  default_value: 0,
  status: "Active",
};

/**
 * Drawer component for configuring dynamic salary structures and compensation components
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
          is_deduction: Boolean(initialData.is_deduction),
          is_taxable: initialData.is_taxable !== undefined ? Boolean(initialData.is_taxable) : true,
          is_base_salary: Boolean(initialData.is_base_salary),
          calculation_type: (initialData.calculation_type as "Fixed" | "Percentage") || "Fixed",
          default_value: Number(initialData.default_value) || 0,
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
      title={isEditing ? "Edit Salary Component" : "Add Salary Component"}
      subtitle={
        isEditing
          ? `Modify configuration for ${initialData?.name || ""}`
          : "Define dynamic earnings, deductions, tax treatments, and base salary rules"
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
                ? "Update Component"
                : "Create Component"}
          </Button>
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <Input
          name="name"
          label="Component Name"
          placeholder="e.g. Basic Salary, HRA, Provident Fund, Health Insurance"
          formik={formik}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="code"
            label="Component Code"
            placeholder="e.g. BASIC, HRA, PF, PT"
            formik={formik}
            required
          />

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Component Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  formik.setFieldValue("is_deduction", false);
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-[5px] border transition-all ${
                  !formik.values.is_deduction
                    ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                + Earning (Credit)
              </button>
              <button
                type="button"
                onClick={() => {
                  formik.setFieldValue("is_deduction", true);
                  formik.setFieldValue("is_base_salary", false);
                }}
                className={`px-3 py-2 text-xs font-semibold rounded-[5px] border transition-all ${
                  formik.values.is_deduction
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400"
                    : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                - Deduction (Debit)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            name="calculation_type"
            label="Calculation Method"
            options={calculationTypeOptions}
            formik={formik}
            required
          />

          <Input
            name="default_value"
            label={
              formik.values.calculation_type === "Percentage"
                ? "Default Rate (%)"
                : "Default Amount ($)"
            }
            type="number"
            placeholder="0"
            formik={formik}
            required
          />
        </div>

        {/* Classification Flags Box */}
        <div className="border border-border/80 rounded-[5px] p-4 flex flex-col gap-3 bg-secondary/10">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Component Classification & Tax Properties
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-2.5 rounded-[5px] border border-border bg-background cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={formik.values.is_base_salary}
                disabled={formik.values.is_deduction}
                onChange={(e) => {
                  formik.setFieldValue("is_base_salary", e.target.checked);
                  if (e.target.checked) formik.setFieldValue("is_deduction", false);
                }}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Is Base Salary</span>
                <span className="text-[11px] text-muted-foreground">
                  Used for daily rate & LOP calculations
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2.5 rounded-[5px] border border-border bg-background cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={formik.values.is_taxable}
                onChange={(e) => formik.setFieldValue("is_taxable", e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-foreground">Is Taxable</span>
                <span className="text-[11px] text-muted-foreground">
                  Subject to regular income tax deductions
                </span>
              </div>
            </label>
          </div>
        </div>

        <ActiveInactiveField name="status" label="Status" formik={formik} required />

        <Input
          name="description"
          label="Description / Formula Notes"
          placeholder="e.g. Mandatory statutory provident fund contribution matching 12% of basic salary"
          multiline
          rows={2}
          formik={formik}
        />
      </form>
    </AppDrawer>
  );
};

export default ManageSalaryStructureDrawer;
