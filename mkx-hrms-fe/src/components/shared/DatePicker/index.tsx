import React, { useMemo, useCallback } from "react";
import { DatePicker, type DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { getIn, type FormikProps } from "formik";
import { cn } from "utils";

dayjs.extend(customParseFormat);

/**
 * Properties for the CustomDatePicker component
 *
 * @template TFormValues - Structure of Formik form values if used within Formik
 */
export interface CustomDatePickerProps<TFormValues = Record<string, unknown>>
  extends Omit<DatePickerProps, "value" | "onChange"> {
  /** Optional field identifier matching the Formik schema key */
  name?: string;
  /** Optional Formik bag instance for automatic value binding and error handling */
  formik?: FormikProps<TFormValues>;
  /** Selected date value as an ISO string (YYYY-MM-DD), Date, Dayjs, or null */
  value?: string | Date | Dayjs | null;
  /** Callback triggered when date value changes; provides both ISO string and Dayjs object */
  onChange?: (value: string, dayjsValue: Dayjs | null) => void;
  /** Direct setter function accepting string date representation */
  setValue?: (value: string) => void;
  /** Label for the text field */
  label?: string;
  /** Custom display format, defaults to DD/MM/YYYY */
  format?: string;
  /** Custom CSS class names applied to the text field */
  className?: string;
  /** Size variant for the underlying input */
  size?: "small" | "medium";
  /** Whether the field should span full width */
  fullWidth?: boolean;
}

/**
 * Standardized Material UI DatePicker component with seamless Formik integration,
 * DD/MM/YYYY default format, theme-compliant 5px border-radius, and error handling.
 *
 * @template TFormValues - The form values model
 * @param props - Configuration properties for CustomDatePicker
 * @returns The rendered DatePicker component
 */
export function CustomDatePicker<TFormValues = Record<string, unknown>>({
  name,
  label,
  formik,
  value,
  onChange,
  setValue,
  format = "DD/MM/YYYY",
  size = "small",
  fullWidth = true,
  className,
  slotProps,
  ...rest
}: CustomDatePickerProps<TFormValues>): React.ReactElement {
  /**
   * Convert external value or Formik state to a valid Dayjs object
   */
  const parsedValue = useMemo<Dayjs | null>(() => {
    let rawValue: unknown = value;
    if (formik && name) {
      rawValue = getIn(formik.values, name);
    }
    if (!rawValue) return null;
    if (dayjs.isDayjs(rawValue)) return rawValue.isValid() ? rawValue : null;
    if (typeof rawValue === "string") {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawValue)) {
        const parsed = dayjs(rawValue, "DD/MM/YYYY");
        return parsed.isValid() ? parsed : null;
      }
      const parsed = dayjs(rawValue);
      return parsed.isValid() ? parsed : null;
    }
    const parsed = dayjs(rawValue as Date);
    return parsed.isValid() ? parsed : null;
  }, [value, formik, name]);

  /**
   * Handle date change and propagate to Formik, custom setter, or standard onChange callback
   */
  const handleChange = useCallback(
    (newDate: Dayjs | null) => {
      const formattedDate = newDate && newDate.isValid() ? newDate.format("YYYY-MM-DD") : "";
      if (formik && name) {
        formik.setFieldValue(name, formattedDate);
      }
      if (setValue) {
        setValue(formattedDate);
      }
      if (onChange) {
        onChange(formattedDate, newDate);
      }
    },
    [formik, name, setValue, onChange],
  );

  /**
   * Extract Formik error state for this specific field name
   */
  const error = useMemo(() => {
    if (!formik || !name) return false;
    const isTouched = Boolean(getIn(formik.touched, name));
    const err = getIn(formik.errors, name);
    return isTouched && Boolean(err);
  }, [formik, name]);

  /**
   * Extract human-readable error message string
   */
  const errorMessage = useMemo(() => {
    if (!formik || !name) return undefined;
    const isTouched = Boolean(getIn(formik.touched, name));
    const err = getIn(formik.errors, name);
    return isTouched && typeof err === "string" ? err : undefined;
  }, [formik, name]);

  return (
    <DatePicker
      label={label}
      format={format}
      value={parsedValue}
      onChange={handleChange}
      slotProps={{
        ...slotProps,
        textField: {
          size,
          fullWidth,
          name,
          error: Boolean(error),
          helperText: errorMessage,
          className: cn("[&_.MuiOutlinedInput-root]:!rounded-[5px]", className),
          ...slotProps?.textField,
        },
        popper: {
          sx: { zIndex: 1400 },
          ...slotProps?.popper,
        },
      }}
      {...rest}
    />
  );
}

/**
 * Properties for the CustomDateRangePicker component
 */
export interface CustomDateRangePickerProps {
  /** Start date string (YYYY-MM-DD) */
  startDate?: string;
  /** End date string (YYYY-MM-DD) */
  endDate?: string;
  /** Callback triggered when start date changes */
  onStartDateChange?: (date: string) => void;
  /** Callback triggered when end date changes */
  onEndDateChange?: (date: string) => void;
  /** Start date label, defaults to "From" */
  startLabel?: string;
  /** End date label, defaults to "To" */
  endLabel?: string;
  /** Custom display format, defaults to DD/MM/YYYY */
  format?: string;
  /** Size of input fields */
  size?: "small" | "medium";
  /** Custom wrapper class */
  className?: string;
}

/**
 * Standardized Date Range picker with side-by-side From and To inputs formatted as DD/MM/YYYY
 *
 * @param props - Configuration properties for CustomDateRangePicker
 * @returns Rendered date range input grid
 */
export function CustomDateRangePicker({
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  startLabel = "From",
  endLabel = "To",
  format = "DD/MM/YYYY",
  size = "small",
  className = "grid grid-cols-2 gap-2",
}: CustomDateRangePickerProps): React.ReactElement {
  return (
    <div className={className}>
      <CustomDatePicker
        label={startLabel}
        format={format}
        value={startDate}
        onChange={(val) => onStartDateChange?.(val)}
        size={size}
      />
      <CustomDatePicker
        label={endLabel}
        format={format}
        value={endDate}
        onChange={(val) => onEndDateChange?.(val)}
        size={size}
      />
    </div>
  );
}

export default CustomDatePicker;
