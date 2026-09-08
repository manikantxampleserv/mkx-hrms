import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { cn } from "utils";
import { NavLink } from "react-router-dom";
import { navItems } from "mock/navItems";

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out flex flex-col",
        isCollapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
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

      <nav className="flex-1 p-3 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
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
