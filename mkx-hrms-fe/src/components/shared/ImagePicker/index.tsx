import React, { useRef, useCallback, useMemo } from "react";
import { Avatar, Button, Typography, Box } from "@mui/material";
import { CloudUpload, Delete } from "@mui/icons-material";
import { getIn, type FormikProps } from "formik";

/**
 * Properties for the custom ImagePicker component
 *
 * @template TFormValues - The Formik form values model
 */
export interface ImagePickerProps<TFormValues = Record<string, unknown>> {
  /** Field name in Formik values */
  name: string;
  /** Optional field label */
  label?: string;
  /** Optional Formik bag instance */
  formik?: FormikProps<TFormValues>;
  /** Explicit value when used outside Formik */
  value?: string;
  /** Explicit change callback when an image is selected */
  onChange?: (base64Data: string) => void;
  /** Fallback placeholder initials */
  initials?: string;
  /** Helper text displayed below upload controls */
  helperText?: string;
}

/**
 * Custom image file picker component with avatar preview, Formik integration,
 * base64 encoding, and theme-compliant 5px button styling.
 *
 * @template TFormValues - The form values model
 * @param props - Configuration properties for the ImagePicker
 * @returns The rendered ImagePicker component
 */
export function ImagePicker<TFormValues = Record<string, unknown>>({
  name,
  label,
  formik,
  value,
  onChange,
  initials = "EMP",
  helperText = "PNG, JPG, or WebP (max. 2MB)",
}: ImagePickerProps<TFormValues>): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Resolve active image value from Formik or prop
   */
  const currentImage = useMemo(() => {
    if (value !== undefined) return value;
    if (formik && name) {
      const val = getIn(formik.values, name);
      return typeof val === "string" ? val : "";
    }
    return "";
  }, [value, formik, name]);

  /**
   * Extract Formik error state for this field
   */
  const error = useMemo(() => {
    if (!formik || !name) return undefined;
    const isTouched = Boolean(getIn(formik.touched, name));
    const err = getIn(formik.errors, name);
    return isTouched && typeof err === "string" ? err : undefined;
  }, [formik, name]);

  /**
   * Process selected file, encode as data URL, and assign to field
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (formik) {
          formik.setFieldValue(name, result);
        }
        if (onChange) {
          onChange(result);
        }
      };
      reader.readAsDataURL(file);
    },
    [formik, name, onChange],
  );

  /**
   * Clear the currently selected image
   */
  const handleRemove = useCallback(() => {
    if (formik) {
      formik.setFieldValue(name, "");
    }
    if (onChange) {
      onChange("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [formik, name, onChange]);

  return (
    <Box className="flex flex-col gap-2">
      {label && (
        <Typography variant="body2" className="!text-xs !font-medium !text-foreground">
          {label}
        </Typography>
      )}

      <div className="flex items-center gap-4 p-3.5 bg-secondary/50 dark:bg-black border border-border dark:border-zinc-800 rounded-[5px]">
        <Avatar
          src={currentImage || undefined}
          variant="rounded"
          className="!w-14 !h-14 !bg-secondary dark:!bg-zinc-900 !text-foreground !font-semibold !rounded-[5px] !border !border-border dark:!border-zinc-800 shrink-0"
        >
          {initials}
        </Avatar>

        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              variant="outlined"
              size="small"
              startIcon={<CloudUpload className="!w-4 !h-4 text-muted-foreground" />}
              onClick={() => fileInputRef.current?.click()}
              className="!text-xs !normal-case !font-medium !border-border dark:!border-zinc-800 !bg-card dark:!bg-black !text-foreground hover:!bg-secondary dark:hover:!bg-zinc-900 !rounded-[5px] !px-3 !py-1.5"
            >
              Upload Photo
            </Button>

            {currentImage && (
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<Delete className="!w-4 !h-4" />}
                onClick={handleRemove}
                className="!text-xs !normal-case !font-medium !border-destructive/30 !bg-destructive/10 !text-destructive hover:!bg-destructive/20 !rounded-[5px] !px-2.5 !py-1.5"
              >
                Remove
              </Button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground">{helperText}</p>
          {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
        </div>
      </div>
    </Box>
  );
}

export default ImagePicker;
