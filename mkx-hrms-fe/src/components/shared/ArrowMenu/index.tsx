import { Menu, type MenuProps } from "@mui/material";

interface ArrowMenuProps extends MenuProps {
  /**
   * The position of the arrow relative to the menu paper.
   * Also configures the default transform/anchor origin to match.
   */
  arrowPosition?: "left" | "center" | "right";
  /**
   * Distance of the arrow from the left or right edge in pixels.
   * Only applicable when arrowPosition is "left" or "right".
   */
  arrowOffsetX?: number;
  /**
   * Vertical distance of the arrow from the top edge in pixels.
   * Defaults to -6.5px which perfectly sits atop the menu paper.
   */
  arrowOffsetY?: number;
  /**
   * Additional class names to apply to the MUI Paper element.
   */
  paperClassName?: string;
}

/**
 * A standard Material UI Menu enhanced with a crisp, theme-aware pointing arrow
 * that matches the modern card aesthetic in both light and dark modes.
 */
export function ArrowMenu({
  arrowPosition = "right",
  arrowOffsetX = 11,
  arrowOffsetY = -6.5,
  paperClassName = "",
  children,
  ...props
}: ArrowMenuProps) {
  const getArrowStyle = () => {
    const baseStyle = { top: arrowOffsetY };
    switch (arrowPosition) {
      case "left":
        return { ...baseStyle, left: arrowOffsetX };
      case "right":
        return { ...baseStyle, right: arrowOffsetX };
      case "center":
        return { ...baseStyle, left: "50%", transform: "translateX(-50%)" };
      default:
        return { ...baseStyle, right: arrowOffsetX };
    }
  };

  return (
    <Menu
      transformOrigin={{ horizontal: arrowPosition, vertical: "top" }}
      anchorOrigin={{ horizontal: arrowPosition, vertical: "bottom" }}
      {...props}
      slotProps={{
        ...props.slotProps,
        paper: {
          ...(typeof props.slotProps?.paper === "object" ? props.slotProps.paper : {}),
          elevation: 0,
          className: `!bg-card !border !border-border !rounded-[5px] shadow-xl !mt-2.5 !overflow-visible relative ${paperClassName}`,
        },
      }}
    >
      <div className="absolute pointer-events-none z-30" style={getArrowStyle()}>
        <svg width="14" height="7" viewBox="0 0 14 7">
          <polygon points="0,7 7,0 14,7" fill="var(--card)" />
          <polyline points="0,7 7,0 14,7" fill="none" stroke="var(--border)" strokeWidth="1" />
          <line x1="1" y1="7" x2="13" y2="7" stroke="var(--card)" strokeWidth="1.5" />
        </svg>
      </div>
      {children}
    </Menu>
  );
}
