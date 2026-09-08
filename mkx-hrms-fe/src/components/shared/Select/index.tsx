import React, { useMemo, useCallback } from "react";
import { TextField, MenuItem, type TextFieldProps } from "@mui/material";
import { getIn, type FormikProps } from "formik";

/**
 * Standard option item for the Select component
 */
export interface SelectOption {
  /** Display label for the option */
  label: string;
  /** Primitive value assigned when selected */
  value: string | number;
  /** Optional flag indicating disabled state */
  disabled?: boolean;
  /** Optional flag indicating hidden state in menu */
  hidden?: boolean;
}

/**
 * Properties for the minimal Formik-integrated Select component
 *
 * @template TFormValues - Structure of the parent Formik form values
 */
export interface CustomSelectProps<TFormValues = Record<string, unknown>> extends Omit<
  TextFieldProps,
  "onChange" | "value"
> {
  /** Field identifier matching Formik key */
  name: string;
  /** Label displayed above/floating over the select */
  label?: string;
  /** Array of selectable option items */
  options: SelectOption[];
  /** Optional Formik bag instance */
  formik?: FormikProps<TFormValues>;
  /** Explicit value if used outside Formik */
  value?: string | number;
  /** Explicit onChange handler */
  onValueChange?: (value: string | number) => void;
  /** Custom setter */
  setValue?: (value: string | number) => void;
  /** Optional placeholder text */
  placeholder?: string;
}

/**
 * Clean, minimal Select component built on Material UI TextField with automatic Formik integration,
 * theme-compliant 5px border-radius, and built-in error handling.
 *
 * @template TFormValues - The form values model
 * @param props - Configuration options for Select
 * @returns The rendered Select component
 */
export function Select<TFormValues = Record<string, unknown>>({
  name,
  label,
  options,
  formik,
  value,
  onValueChange,
  setValue,
  placeholder,
  fullWidth = true,
  size = "small",
  required = false,
  disabled = false,
  slotProps,
  ...rest
}: CustomSelectProps<TFormValues>): React.ReactElement {
  /**
   * Handle selection changes and propagate to Formik or explicit callbacks
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      if (formik) {
        formik.setFieldValue(name, newValue);
      } else if (setValue) {
        setValue(newValue);
      }
      if (onValueChange) {
        onValueChange(newValue);
      }
    },
    [formik, name, setValue, onValueChange],
  );

  /**
   * Extract Formik error state for this specific field
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

  /**
   * Current selected value from Formik or prop
   */
  const currentValue = useMemo(() => {
    if (value !== undefined) return value;
    if (formik && name) {
      const formValue = getIn(formik.values, name);
      return formValue !== undefined && formValue !== null ? formValue : "";
    }
    return "";
  }, [value, formik, name]);

  /**
   * Safe options list guaranteeing that if currentValue is provided but not yet present
   * in the options (e.g. while options are being fetched asynchronously), a hidden fallback
   * item is provided to prevent MUI Select from emitting out-of-range warnings.
   */
  const effectiveOptions = useMemo(() => {
    if (
      currentValue !== "" &&
      currentValue !== undefined &&
      currentValue !== null &&
      !options.some((opt) => String(opt.value) === String(currentValue))
    ) {
      return [
        ...options,
        {
          label: String(currentValue),
          value: currentValue,
          disabled: false,
          hidden: true,
        },
      ];
    }
    return options;
  }, [options, currentValue]);

  return (
    <TextField
      select
      fullWidth={fullWidth}
      size={size}
      name={name}
      id={name}
      label={label}
      value={currentValue}
      onChange={handleChange}
      onBlur={formik?.handleBlur}
      error={Boolean(error)}
      helperText={errorMessage}
      required={required}
      disabled={disabled}
      slotProps={{
        htmlInput: {
          required: false,
        },
        select: {
          displayEmpty: Boolean(placeholder),
          renderValue: (selected) => {
            if (!selected && placeholder) {
              return <span className="text-muted-foreground">{placeholder}</span>;
            }
            const match = effectiveOptions.find((opt) => opt.value === selected);
            return match ? match.label : String(selected);
          },
          MenuProps: {
            slotProps: {
              paper: {
                className:
                  "!bg-white dark:!bg-black !border !border-border dark:!border-zinc-800 !rounded-[5px] !shadow-xl",
              },
            },
          },
        },
        ...slotProps,
      }}
      className="[&_.MuiOutlinedInput-root]:!rounded-[5px]"
      {...rest}
    >
      {effectiveOptions.map((option) => (
        <MenuItem
          key={String(option.value)}
          value={option.value}
          disabled={option.disabled}
          style={option.hidden ? { display: "none" } : undefined}
          className="!text-sm !py-2 hover:!bg-secondary/80 focus:!bg-secondary !rounded-[5px] !mx-1 !my-0.5 transition-colors"
        >
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default Select;
