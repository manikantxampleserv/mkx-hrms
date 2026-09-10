import { useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Collapse } from "@mui/material";
import { cn } from "utils";
import { NavLink, useLocation } from "react-router-dom";
import { navItems, type NavItem } from "mock/navItems";

/**
 * Interface properties for the Sidebar component
 */
interface SidebarProps {
  /** Flag determining if sidebar is collapsed into mini-icon mode */
  isCollapsed: boolean;
  /** Function callback to toggle collapse state */
  toggleCollapse: () => void;
}

/**
 * Enterprise collapsible sidebar navigation component with support for
 * nested accordion sub-menus, active path highlighting, and collapse toggle.
 *
 * @param props - Component properties
 * @returns Rendered Sidebar element
 */
export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  const location = useLocation();

  /**
   * Tracks open/closed status of navigation items with children
   */
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    for (const item of navItems) {
      if (item.children) {
        const isChildActive = item.children.some((c) => location.pathname.startsWith(c.href));
        if (isChildActive) {
          initialState[item.title] = true;
        }
      }
    }
    return initialState;
  });

  /**
   * Automatically expand parent menu if active route matches any child
   */
  useEffect(() => {
    for (const item of navItems) {
      if (item.children) {
        const isChildActive = item.children.some((c) => location.pathname.startsWith(c.href));
        if (isChildActive) {
          setOpenSubMenus((prev) => ({
            ...prev,
            [item.title]: true,
          }));
        }
      }
    }
  }, [location.pathname]);

  /**
   * Toggles accordion expansion for items with children
   *
   * @param title - Title of the navigation item
   */
  const handleToggleSubMenu = (title: string) => {
    if (isCollapsed) {
      toggleCollapse();
      setOpenSubMenus((prev) => ({
        ...prev,
        [title]: true,
      }));
      return;
    }

    setOpenSubMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out flex flex-col",
        isCollapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-sidebar-primary shadow-sm">
            <Users className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col gap-1 transition-all duration-300 opacity-100 w-auto overflow-hidden justify-center">
              <span className="font-bold text-md text-sidebar-foreground whitespace-nowrap leading-none tracking-tight mb-0.5">
                HRMs Automations
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
                <span className="text-[10px] font-bold text-sidebar-secondary uppercase tracking-wider whitespace-nowrap leading-none">
                  AI Powered
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item: NavItem) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const isSubMenuOpen = Boolean(openSubMenus[item.title]);
          const isAnyChildActive = hasChildren
            ? Boolean(item.children?.some((c) => location.pathname.startsWith(c.href)))
            : false;

          if (hasChildren) {
            return (
              <div key={item.title} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleToggleSubMenu(item.title)}
                  className={cn(
                    "flex items-center gap-3 py-2.5 rounded-md text-sm font-medium group relative w-full transition-colors text-left",
                    isAnyChildActive
                      ? "bg-sidebar-accent/70 text-sidebar-foreground"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                    isCollapsed ? "justify-center px-0 w-11 mx-auto" : "px-3",
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary transition-opacity duration-200",
                      isAnyChildActive ? "opacity-100" : "opacity-0",
                    )}
                  ></span>
                  <Icon
                    className={cn(
                      "!w-5 !h-5 shrink-0 transition-transform duration-200",
                      isAnyChildActive && "text-sidebar-primary",
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span
                        className={cn(
                          "whitespace-nowrap transition-all duration-300 flex-1",
                          isAnyChildActive && "text-sidebar-primary font-semibold",
                        )}
                      >
                        {item.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
                          isSubMenuOpen && "rotate-180 text-sidebar-foreground",
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Submenu Items Dropdown via MUI Collapse */}
                {!isCollapsed && item.children && (
                  <Collapse in={isSubMenuOpen} timeout="auto" unmountOnExit>
                    <div className="pl-2 pr-1  flex flex-col space-y-0.5 border-l border-sidebar-border ml-5 my-1">
                      {item.children.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <NavLink
                            key={subItem.href}
                            to={subItem.href}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-2.5 p-2 rounded-md text-xs font-medium transition-colors relative",
                                isActive
                                  ? "bg-sidebar-accent text-sidebar-primary font-semibold shadow-xs"
                                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                {SubIcon && (
                                  <SubIcon
                                    className={cn(
                                      "!w-4 !h-4 shrink-0 transition-colors",
                                      isActive ? "text-sidebar-primary" : "text-muted-foreground",
                                    )}
                                  />
                                )}
                                <span className="truncate">{subItem.title}</span>
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  </Collapse>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 py-2.5 rounded-md text-sm font-medium group relative",
                  isActive ? "bg-sidebar-accent text-sidebar-foreground" : "text-muted-foreground",
                  isCollapsed ? "justify-center px-0 w-11 mx-auto" : "px-3 w-full",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                  ></span>
                  <Icon
                    className={cn(
                      "!w-5 !h-5 shrink-0 transition-transform duration-200",
                      isActive && "text-sidebar-primary",
                    )}
                  />
                  {!isCollapsed && (
                    <span
                      className={cn(
                        "whitespace-nowrap transition-all duration-300 opacity-100",
                        isActive && "text-sidebar-primary",
                      )}
                    >
                      {item.title}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={toggleCollapse}
          className={cn(
            "flex items-center gap-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200",
            isCollapsed ? "justify-center px-0 w-11 mx-auto" : "px-3 w-full justify-center",
          )}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
