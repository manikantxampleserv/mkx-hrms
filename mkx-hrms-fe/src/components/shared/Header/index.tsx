import {
  CalendarToday,
  Check,
  DoneAll,
  EventAvailable,
  KeyboardArrowDown,
  Logout,
  NotificationsNone,
  Payment,
  Person,
  Settings as SettingsIcon,
  TextFields,
  WorkOutlined,
} from "@mui/icons-material";
import {
  Avatar,
  Badge,
  Button,
  Chip,
  Divider,
  IconButton,
  ListItemIcon,
  MenuItem,
  Tooltip,
} from "@mui/material";
import { useTheme } from "context/ThemeContext/useTheme";
import { useAuth } from "contexts/AuthContext";
import { useFontContext } from "contexts/FontContext";
import { Moon, Sun } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowMenu } from "../ArrowMenu";
import { FontSwitcherModal } from "../FontSwitcherModal";

/**
 * Interface definition for in-app HRMS notifications
 */
interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: "leave" | "recruitment" | "payroll" | "attendance";
}

/**
 * Available timeframe preset filter options
 */
const timeframeOptions = ["Today", "Last 7 days", "Last 30 days", "This Quarter", "Year to Date"];

/**
 * Initial sample notification entries
 */
const initialNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "New Leave Application",
    message: "Sarah Jenkins requested 3 days of Annual PTO for next week.",
    time: "10 mins ago",
    unread: true,
    type: "leave",
  },
  {
    id: "notif-2",
    title: "Candidate Shortlisted",
    message: "Alex Rivera moved to Final Interview for Senior React Developer.",
    time: "45 mins ago",
    unread: true,
    type: "recruitment",
  },
  {
    id: "notif-3",
    title: "Payroll Cycle Ready",
    message: "September mid-cycle salary payroll draft generated for 48 employees.",
    time: "2 hours ago",
    unread: true,
    type: "payroll",
  },
  {
    id: "notif-4",
    title: "Attendance Alert",
    message: "3 employees flagged with remote check-ins after 09:30 AM.",
    time: "5 hours ago",
    unread: false,
    type: "attendance",
  },
];

/**
 * Standard Header component with interactive Date Filter, Theme Toggle, Notification Popover, and Profile Menu.
 */
export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedTimeframe, setSelectedTimeframe] = useState("Last 30 days");
  const [timeframeAnchorEl, setTimeframeAnchorEl] = useState<HTMLElement | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLElement | null>(null);

  const { font } = useFontContext();
  const [fontModalOpen, setFontModalOpen] = useState(false);

  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLElement | null>(null);

  const isDark =
    theme === "dark" || (theme === "system" && document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  /**
   * Toggle a notification's unread status
   */
  const handleToggleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: !item.unread } : item)),
    );
  };

  /**
   * Mark all notifications as read
   */
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  /**
   * Render semantic icon badge based on notification category
   */
  const getNotificationIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "leave":
        return <EventAvailable className="!w-4 !h-4 !text-emerald-500" />;
      case "recruitment":
        return <WorkOutlined className="!w-4 !h-4 !text-sky-500" />;
      case "payroll":
        return <Payment className="!w-4 !h-4 !text-amber-500" />;
      case "attendance":
        return <NotificationsNone className="!w-4 !h-4 !text-purple-500" />;
    }
  };

  /**
   * Determine the page title from current URL pathname
   */
  const getPageTitle = (): string => {
    if (location.pathname.startsWith("/employees")) return "Employees";
    if (location.pathname.startsWith("/reports")) return "Reports";
    if (location.pathname.startsWith("/settings")) return "Settings";
    if (location.pathname.startsWith("/attendance")) return "Attendance";
    if (location.pathname.startsWith("/leaves")) return "Leaves";
    if (location.pathname.startsWith("/recruitment")) return "Recruitment";
    if (location.pathname.startsWith("/payroll")) return "Payroll";
    return "Overview";
  };

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>

        {/* Dynamic Date Range Menu */}
        <Button
          size="small"
          onClick={(e: MouseEvent<HTMLButtonElement>) => setTimeframeAnchorEl(e.currentTarget)}
          endIcon={<KeyboardArrowDown className="!w-4 !h-4 !text-muted-foreground" />}
          startIcon={<CalendarToday className="!w-3.5 !h-3.5 !text-muted-foreground" />}
          className="!hidden md:!inline-flex !text-xs !normal-case !text-muted-foreground hover:!text-foreground !bg-secondary/40 hover:!bg-secondary/80 !border !border-border/60 !rounded-[5px] !px-2.5 !py-1 !font-normal transition-colors"
        >
          {selectedTimeframe}
        </Button>

        <ArrowMenu
          anchorEl={timeframeAnchorEl}
          open={Boolean(timeframeAnchorEl)}
          onClose={() => setTimeframeAnchorEl(null)}
          arrowPosition="right"
          arrowOffsetY={-10}
          paperClassName="!min-w-[160px] !p-1"
        >
          {timeframeOptions.map((option) => (
            <MenuItem
              key={option}
              onClick={() => {
                setSelectedTimeframe(option);
                setTimeframeAnchorEl(null);
              }}
              className={`!text-xs !py-1 !px-3 !rounded-[5px] flex items-center !justify-between ${
                selectedTimeframe === option
                  ? "!bg-secondary !font-semibold !text-foreground"
                  : "!text-muted-foreground hover:!text-foreground hover:!bg-secondary/50"
              }`}
            >
              <span>{option}</span>
              {selectedTimeframe === option && <Check className="!w-3.5 !h-3.5 !text-primary" />}
            </MenuItem>
          ))}
        </ArrowMenu>
      </div>

      <div className="flex items-center gap-3">
        {/* Dynamic Notifications Popover Menu */}
        <IconButton
          onClick={(e: MouseEvent<HTMLButtonElement>) => setNotificationAnchorEl(e.currentTarget)}
          aria-label="View notifications"
        >
          <Badge
            color="primary"
            variant={unreadCount > 0 ? "dot" : "standard"}
            className="[&_.MuiBadge-badge]:animate-pulse"
          >
            <NotificationsNone className="!w-5 !h-5" />
          </Badge>
        </IconButton>

        <ArrowMenu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={() => setNotificationAnchorEl(null)}
          arrowPosition="right"
          paperClassName="!w-[360px] sm:!w-[380px] !p-0"
        >
          <div className="px-4 pt-1 pb-3 border-b border-border flex items-center justify-between bg-card relative z-10 rounded-t-[5px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} New`}
                  size="small"
                  className="!h-5 !text-[10px] !bg-primary/10 !text-primary !font-semibold"
                />
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                size="small"
                variant="text"
                startIcon={<DoneAll className="!w-3.5 !h-3.5" />}
                onClick={handleMarkAllRead}
                className="!text-[11px] !normal-case !text-muted-foreground hover:!text-foreground !p-0 !min-w-0"
              >
                Mark all read
              </Button>
            )}
          </div>

          <div className="max-h-[340px] overflow-y-auto custom-scrollbar divide-y divide-border/40 p-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No notifications at this time
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleToggleNotificationRead(n.id)}
                  className={`p-3 rounded-[5px] transition-colors cursor-pointer flex gap-3 ${
                    n.unread
                      ? "bg-secondary/40 hover:bg-secondary/70"
                      : "hover:bg-secondary/30 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs ${
                          n.unread
                            ? "font-semibold text-foreground"
                            : "font-medium text-muted-foreground"
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                  </div>
                  {n.unread && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 pb-1 pt-3 border-t border-border bg-card/50 flex items-center justify-between">
            <Button
              size="small"
              variant="text"
              onClick={() => {
                setNotificationAnchorEl(null);
                navigate("/settings");
              }}
              className="!text-xs !normal-case !text-muted-foreground hover:!text-foreground !w-full"
            >
              Notification Preferences
            </Button>
          </div>
        </ArrowMenu>

        {/* Dynamic User Profile Menu */}
        <IconButton
          onClick={(e: MouseEvent<HTMLButtonElement>) => setProfileAnchorEl(e.currentTarget)}
          aria-label="User account menu"
          className="!p-1 !rounded-[5px] ring-2 ring-transparent"
        >
          <Avatar
            variant="rounded"
            src={user?.avatar || undefined}
            className="!w-9 !h-9 !bg-chart-1 !text-black !text-xs !font-semibold cursor-pointer"
          >
            {user ? `${user.first_name[0] || ""}${user.last_name[0] || ""}` : "MK"}
          </Avatar>
        </IconButton>

        <ArrowMenu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={() => setProfileAnchorEl(null)}
          arrowPosition="right"
          paperClassName="!w-60 !px-1"
        >
          <div className="px-2 pb-1.5 pt-0.5 flex items-center gap-3 border-b border-border/50 mb-1 relative z-10">
            <Avatar
              variant="rounded"
              src={user?.avatar || undefined}
              className="!w-8 !h-8 !bg-chart-1 !text-black !text-xs !font-semibold"
            >
              {user ? `${user.first_name[0] || ""}${user.last_name[0] || ""}` : "MK"}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground truncate">
                {user?.name || "Mustafa Khan"}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {user?.email || "admin@mkx.dev"}
              </span>
            </div>
          </div>

          <MenuItem
            onClick={() => {
              setProfileAnchorEl(null);
              navigate("/settings");
            }}
            className="!text-xs !py-2 !px-2.5 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70 flex items-center gap-2.5"
          >
            <ListItemIcon className="!min-w-0 !text-muted-foreground">
              <Person className="!w-4 !h-4" />
            </ListItemIcon>
            <span className="text-xs">My Profile</span>
          </MenuItem>

          <MenuItem
            onClick={() => {
              setProfileAnchorEl(null);
              navigate("/settings");
            }}
            className="!text-xs !py-2 !px-2.5 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70 flex items-center gap-2.5"
          >
            <ListItemIcon className="!min-w-0 !text-muted-foreground">
              <SettingsIcon className="!w-4 !h-4" />
            </ListItemIcon>
            <span className="text-xs">Settings & Security</span>
          </MenuItem>

          <Divider className="!my-1 !border-border/60" />

          <MenuItem
            onClick={() => {
              setProfileAnchorEl(null);
              toggleTheme();
            }}
            className="!text-xs !py-2 !px-2.5 !gap-1 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <ListItemIcon className="!min-w-0 !text-muted-foreground">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </ListItemIcon>
              <span className="text-xs">Appearance</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded">
              {isDark ? "Dark" : "Light"}
            </span>
          </MenuItem>

          <MenuItem
            onClick={() => {
              setProfileAnchorEl(null);
              setFontModalOpen(true);
            }}
            className="!text-xs !py-2 !px-2.5 !gap-1 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <ListItemIcon className="!min-w-0 !text-muted-foreground">
                <TextFields className="w-4 h-4" />
              </ListItemIcon>
              <span className="text-xs">Typography</span>
            </div>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded truncate max-w-[80px]">
              {font === "Default" ? "Normal" : font}
            </span>
          </MenuItem>

          <Divider className="!my-1 !border-border/60" />

          <MenuItem
            onClick={() => {
              setProfileAnchorEl(null);
              logout();
            }}
            className="!text-xs !py-2 !px-2.5 !rounded-[5px] !text-destructive hover:!bg-destructive/10 flex items-center gap-2.5"
          >
            <ListItemIcon className="!min-w-0 !text-destructive">
              <Logout className="!w-4 !h-4 text-destructive" />
            </ListItemIcon>
            <span className="text-xs font-medium text-destructive">Log out</span>
          </MenuItem>
        </ArrowMenu>
      </div>

      <FontSwitcherModal open={fontModalOpen} onClose={() => setFontModalOpen(false)} />
    </header>
  );
}
