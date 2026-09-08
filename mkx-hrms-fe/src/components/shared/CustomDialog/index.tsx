import type React from "react";
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

/**
 * Props for CustomDialog shared modal component
 */
export interface CustomDialogProps {
  /** Flag determining whether the dialog is visible */
  open: boolean;
  /** Callback fired when dialog requests to close */
  onClose: () => void;
  /** Main header title displayed at top or custom ReactNode */
  title?: React.ReactNode;
  /** Optional descriptive subtitle below the title */
  subtitle?: string;
  /** Optional custom element rendered in header before close button */
  headerRight?: React.ReactNode;
  /** Inner content body */
  children: React.ReactNode;
  /** Optional footer action buttons */
  actions?: React.ReactNode;
  /** Max width breakpoint for the dialog window */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;
  /** Whether the dialog stretches to full width up to maxWidth */
  fullWidth?: boolean;
  /** Optional custom CSS classes for dialog paper container */
  paperClassName?: string;
  /** Optional custom CSS classes for content body */
  contentClassName?: string;
  /** Optional custom CSS classes for actions footer */
  actionsClassName?: string;
  /** Whether to render top-right close icon button (default: true) */
  showCloseButton?: boolean;
}

/**
 * Shared CustomDialog component standardizing modal architecture across all modules.
 * Features unified dark/light theming, clean backdrop blur, customizable header with close icon,
 * scrollable content container, and bottom actions container.
 *
 * @param props - Dialog configuration properties
 * @returns The rendered Dialog component
 */
export const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  headerRight,
  children,
  actions,
  maxWidth = "xs",
  fullWidth = true,
  paperClassName = "",
  contentClassName = "",
  actionsClassName = "",
  showCloseButton = true,
}) => {
  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      slotProps={{
        backdrop: {
          className: "!bg-black/50 dark:!bg-black/75 !backdrop-blur-[2px]",
        },
        paper: {
          className: `!bg-card !border !border-border !rounded-[8px] !text-foreground !shadow-2xl overflow-hidden ${paperClassName}`.trim(),
        },
      }}
    >
      {(title || showCloseButton || headerRight) && (
        <DialogTitle className="!flex !items-center !justify-between !border-b !border-border !py-3.5 !px-5 !gap-3">
          <div className="flex flex-col min-w-0 flex-1">
            {typeof title === "string" ? (
              <span className="text-base font-semibold text-foreground truncate">{title}</span>
            ) : (
              title
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerRight}
            {showCloseButton && (
              <IconButton
                size="small"
                onClick={onClose}
                aria-label="Close dialog"
                className="!text-muted-foreground hover:!text-foreground !p-1"
              >
                <Close className="!w-4 !h-4" />
              </IconButton>
            )}
          </div>
        </DialogTitle>
      )}

      <DialogContent className={`!p-5 space-y-4 ${contentClassName}`.trim()}>
        {children}
      </DialogContent>

      {actions && (
        <DialogActions className={`!px-5 !py-3 !border-t !border-border !gap-2 ${actionsClassName}`.trim()}>
          {actions}
        </DialogActions>
      )}
    </MuiDialog>
  );
};
