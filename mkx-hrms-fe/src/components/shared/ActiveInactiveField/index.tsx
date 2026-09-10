import { FormControl, FormControlLabel, FormLabel, RadioGroup } from "@mui/material";
import type { FormikProps } from "formik";
import React from "react";
import CustomRadio from "shared/CustomRadio";

/**
 * Properties for the ActiveInactiveField component.
 *
 * @template TFormValues - The form values structure managed by Formik.
 */
export interface ActiveInactiveFieldProps<TFormValues = Record<string, unknown>> {
  /** Optional Formik bag instance */
  formik?: FormikProps<TFormValues>;
  /** Field name in the form values */
  name: string;
  /** Field label to display */
  label?: string;
  /** Whether field is marked as required with an asterisk */
  required?: boolean;
  /** Additional container styling class names */
  className?: string;
  /** Whether the controls are disabled */
  disabled?: boolean;
  /** Controlled value when used without Formik */
  value?: string;
  /** Change callback when used without Formik */
  onChange?: (value: string) => void;
  /** Explicit active value representation (default: "Active" or "Y" if form uses Y/N) */
  activeValue?: string;
  /** Explicit inactive value representation (default: "Inactive" or "N" if form uses Y/N) */
  inactiveValue?: string;
}

/**
 * ## ActiveInactiveField
 *
 * Custom form field component for selecting Active/Inactive status using radio buttons.
 * Integrates with Formik for form management and validation, or can be used standalone.
 * Uses CustomRadio component for consistent styling with project theme.
 *
 * @template TFormValues - Structure of Formik form values
 * @param {ActiveInactiveFieldProps<TFormValues>} props - Props for the ActiveInactiveField component.
 * @returns {React.ReactElement} The rendered Active/Inactive radio field component.
 */
export const ActiveInactiveField = <TFormValues = Record<string, unknown>,>({
  formik,
  name,
  label = "Status",
  required = false,
  className = "",
  disabled = false,
  value,
  onChange,
  activeValue,
  inactiveValue,
}: ActiveInactiveFieldProps<TFormValues>): React.ReactElement => {
  /** Formik values extraction without using any */
  const formikRecord = formik?.values as Record<string, unknown> | undefined;
  const formikVal = formikRecord?.[name] as string | undefined;
  const rawValue = value !== undefined ? value : formikVal;

  /** Support both Y/N and Active/Inactive conventions seamlessly */
  const isYnConvention = rawValue === "Y" || rawValue === "N" || activeValue === "Y";
  const resolvedActive = activeValue ?? (isYnConvention ? "Y" : "Active");
  const resolvedInactive = inactiveValue ?? (isYnConvention ? "N" : "Inactive");

  const currentValue =
    rawValue !== undefined && rawValue !== null && rawValue !== ""
      ? String(rawValue)
      : resolvedActive;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (formik) {
      void formik.setFieldValue(name, newValue);
    } else if (onChange) {
      onChange(newValue);
    }
  };

  /** Formik error extraction without using any */
  const touchedRecord = formik?.touched as Record<string, unknown> | undefined;
  const errorsRecord = formik?.errors as Record<string, unknown> | undefined;
  const isTouched = Boolean(touchedRecord?.[name]);
  const error = isTouched ? errorsRecord?.[name] : undefined;
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <FormControl
      component="fieldset"
      className={`${className}`}
      error={!!error}
      disabled={disabled}
      focused={false}
    >
      <FormLabel
        component="legend"
        focused={false}
        className="!text-gray-700 dark:!text-zinc-200 !text-sm !font-medium [&.Mui-focused]:!text-gray-700 dark:[&.Mui-focused]:!text-zinc-200"
      >
        {label}
        {required && <span className="font-semibold"> *</span>}
      </FormLabel>
      <RadioGroup
        row
        name={name}
        value={currentValue}
        onChange={handleChange}
        className="!gap-4 pl-1"
      >
        <FormControlLabel
          value={resolvedActive}
          control={<CustomRadio />}
          label={
            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 select-none">
              Active
            </span>
          }
          disabled={disabled}
        />
        <FormControlLabel
          value={resolvedInactive}
          control={<CustomRadio />}
          label={
            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200 select-none">
              Inactive
            </span>
          }
          disabled={disabled}
        />
      </RadioGroup>
      {errorMessage && <span className="!text-red-500 !text-xs !mt-1 !ml-2">{errorMessage}</span>}
    </FormControl>
  );
};

export default ActiveInactiveField;
