import type React from "react";
import { Drawer as MuiDrawer, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

/**
 * Props for the AppDrawer shared component
 */
export interface AppDrawerProps {
  /** Flag determining whether the drawer is visible */
  open: boolean;
  /** Callback fired when drawer requests to close */
  onClose: () => void;
  /** Main header title displayed at the top */
  title: string;
  /** Optional descriptive subtitle */
  subtitle?: string;
  /** Inner content body */
  children: React.ReactNode;
  /** Optional sticky footer actions area */
  footer?: React.ReactNode;
  /** Drawer width in pixels or CSS value (default 500px) */
  width?: number | string;
}

/**
 * Shared Material UI Drawer component with standardized header, close button,
 * scrollable body, and optional action footer conforming to the 5px border-radius theme.
 * Explicitly styled for crisp pure white in light mode and OLED pure black in dark mode.
 *
 * @param props - Configuration properties for the drawer
 * @returns The rendered Drawer component
 */
export const AppDrawer: React.FC<AppDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 500,
}) => {
  return (
    <MuiDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          className: "!bg-black/40 dark:!bg-black/70 !backdrop-blur-xs",
        },
        paper: {
          className:
            "!bg-white dark:!bg-black !border-l !border-border dark:!border-zinc-800 !text-foreground !flex !flex-col !h-full !shadow-2xl",
          style: {
            width: typeof width === "number" ? `${width}px` : width,
            maxWidth: "100vw",
          },
        },
      }}
    >
      {/* Header with Title, Subtitle, and Close Action */}
      <div className="flex items-center justify-between p-3 border-b border-border dark:border-zinc-800 shrink-0 bg-white dark:bg-black">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <IconButton
          onClick={onClose}
          size="small"
          aria-label="close drawer"
          className="!text-muted-foreground hover:!text-foreground hover:!bg-secondary dark:hover:!bg-zinc-900 !rounded-[5px] !p-1.5 transition-colors"
        >
          <Close className="!w-5 !h-5" />
        </IconButton>
      </div>

      {/* Scrollable Form/Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-white dark:bg-black">{children}</div>

      {/* Sticky Footer Actions Area */}
      {footer && (
        <div className="p-3 border-t border-border dark:border-zinc-800 bg-white dark:bg-black backdrop-blur-sm shrink-0 flex items-center justify-end gap-3">
          {footer}
        </div>
      )}
    </MuiDrawer>
  );
};
