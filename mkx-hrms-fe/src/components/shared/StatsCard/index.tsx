import React from "react";
import { cn } from "utils";

/**
 * Properties for the shared StatsCard component
 */
export interface StatsCardProps {
  /** Optional unique identifier */
  id?: string;
  /** Primary label / metric title displayed at the bottom of the stack */
  title: string;
  /** Prominent statistic value */
  value: string | number;
  /** Top descriptive subtext / context */
  subtext?: string;
  /** Icon component (MUI / Lucide / React.memo) or pre-rendered element */
  icon?: React.ElementType | React.ReactNode;
  /** Icon color styling class */
  iconColor?: string;
  /** Icon container background class */
  iconBg?: string;
  /** Additional container class names */
  className?: string;
}

/**
 * Shared StatsCard component adhering to the HRMS metric dashboard layout:
 * Subtext on top, bold metric value in middle, label on bottom, and colored icon badge on right.
 *
 * @param props - Configuration properties for the StatsCard
 * @returns The rendered StatsCard component
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  icon: IconOrElement,
  iconColor = "text-primary",
  iconBg = "bg-primary/10",
  className,
}) => {
  /**
   * Helper to render icon whether provided as a component type or JSX element
   */
  const renderIcon = () => {
    if (!IconOrElement) return null;
    if (React.isValidElement(IconOrElement)) {
      return IconOrElement;
    }
    const Component = IconOrElement as React.ElementType;
    return <Component className="!w-5 !h-5" />;
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-all flex flex-col justify-between shadow-sm",
        className,
      )}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>

          <h3 className="text-xl font-bold text-foreground tracking-tight">{value}</h3>
          {subtext && (
            <p className="text-xs text-muted-foreground truncate" title={subtext}>
              {subtext}
            </p>
          )}
        </div>
        {IconOrElement && (
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              iconBg,
              iconColor,
            )}
          >
            {renderIcon()}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
