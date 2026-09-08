import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { FadeUpItem } from "shared/animations";
import { cn } from "utils";

/**
 * Properties for the MetricCard component
 */
interface MetricCardProps {
  /** Metric card label title */
  title: string;
  /** Primary metric display value */
  value: string | number;
  /** Optional trend percentage or subtext */
  trend?: string;
  /** Flag indicating positive upward trend */
  trendUp?: boolean;
  /** Optional right-aligned icon */
  icon?: ReactNode;
}

/**
 * MetricCard component for displaying key statistics without interactive hover effects.
 *
 * @param props - Component configuration props
 * @returns The rendered MetricCard element
 */
export function MetricCard({ title, value, trend, trendUp, icon }: MetricCardProps) {
  return (
    <FadeUpItem className="relative bg-card border border-border rounded-xl p-5 shadow-sm overflow-hidden">
      <div className="relative">
        <div className="flex items-start justify-between mb-1">
          <span className="text-sm text-muted-foreground font-medium">{title}</span>
          {icon && (
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              {icon}
            </div>
          )}
        </div>

        <div className="flex items-end gap-3">
          <span className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            {value}
          </span>

          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium mb-1",
                trendUp ? "text-success" : "text-destructive",
              )}
            >
              {trendUp ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend}</span>
            </div>
          )}
        </div>
      </div>
    </FadeUpItem>
  );
}

export default MetricCard;
