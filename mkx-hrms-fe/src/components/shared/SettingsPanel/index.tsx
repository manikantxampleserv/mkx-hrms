import * as React from "react";
import { cn } from "utils";

/**
 * Props for the SettingsPanel container.
 */
interface SettingsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The title of the settings section */
  title: string;
  /** A brief description of what these settings do */
  description?: string;
}

/**
 * A shared layout component for creating configuration panels and settings cards.
 * Uses semantic theme variables for light/dark mode support.
 */
export function SettingsPanel({
  title,
  description,
  children,
  className,
  ...props
}: SettingsPanelProps) {
  return (
    <div
      className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}
      {...props}
    >
      <div className="px-6 py-5 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/**
 * A sub-component for organizing settings into distinct row items (e.g., a label + a toggle/input).
 */
export function SettingsRow({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border last:border-0 last:pb-0 first:pt-0",
        className,
      )}
    >
      <div className="flex-1">
        <label className="block text-sm font-medium text-foreground">{label}</label>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
