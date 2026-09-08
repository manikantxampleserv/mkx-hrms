import React, { useState, useMemo, useCallback } from "react";
import { TextField, IconButton, type TextFieldProps } from "@mui/material";
import { Visibility, VisibilityOff, Search } from "@mui/icons-material";
import { getIn, type FormikProps } from "formik";
import { cn } from "utils";

/**
 * Properties for the custom Formik-integrated Input component
 *
 * @template TFormValues - Structure of Formik form values
 */
export interface CustomInputProps<TFormValues = Record<string, unknown>> extends Omit<
  TextFieldProps,
  "onChange" | "value"
> {
  /** Optional Formik bag instance for automated value and error binding */
  formik?: FormikProps<TFormValues>;
  /** Field name matching the Formik schema key */
  name: string;
  /** Explicit value if used outside Formik */
  value?: string | number;
  /** Explicit onChange handler if used outside Formik */
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /** Direct setter function for the field value */
  setValue?: (value: string | number) => void;
}

/**
 * Standardized Material UI text field component with automatic Formik integration,
 * built-in password visibility toggle, date picker styling, and error handling.
 *
 * @template TFormValues - The form values model
 * @param props - Configuration properties for the Input component
 * @returns The rendered TextField component
 */
export function Input<TFormValues = Record<string, unknown>>({
  name,
  label,
  type = "text",
  formik,
  value,
  onChange,
  setValue,
  fullWidth = true,
  size = "small",
  required = false,
  className,
  slotProps,
  ...rest
}: CustomInputProps<TFormValues>): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle changes across Formik, custom setter, or standard event handler
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      if (formik) {
        formik.setFieldValue(name, newValue);
      } else if (setValue) {
        setValue(newValue);
      } else if (onChange) {
        onChange(event);
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

  /**
   * Resolve active value from Formik state or external prop
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
   * Determine input type, toggling between text and password when applicable
   */
  const effectiveType = useMemo(() => {
    if (type === "password") {
      return showPassword ? "text" : "password";
    }
    return type;
  }, [type, showPassword]);

  return (
    <TextField
      fullWidth={fullWidth}
      size={size}
      name={name}
      id={name}
      label={label}
      type={effectiveType}
      value={currentValue}
      onChange={handleChange}
      onBlur={formik?.handleBlur}
      error={Boolean(error)}
      helperText={errorMessage}
      required={required}
      slotProps={{
        htmlInput: {
          required: false,
        },
        inputLabel: {
          shrink: type === "date" ? true : undefined,
        },
        input: {
          ...(type === "search" && {
            endAdornment: <Search className="!w-4 !h-4 text-muted-foreground" />,
          }),
          ...(type === "password" && {
            endAdornment: (
              <IconButton
                size="small"
                onClick={() => setShowPassword((prev) => !prev)}
                className="!p-1 !text-muted-foreground hover:!text-foreground"
                aria-label={showPassword ? "hide password" : "show password"}
              >
                {showPassword ? (
                  <VisibilityOff className="!w-4 !h-4" />
                ) : (
                  <Visibility className="!w-4 !h-4" />
                )}
              </IconButton>
            ),
          }),
        },
        ...slotProps,
      }}
      className={cn("[&_.MuiOutlinedInput-root]:!rounded-[5px]", className)}
      {...rest}
    />
  );
}

export default Input;
