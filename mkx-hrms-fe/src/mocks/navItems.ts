import type { SvgIconComponent } from "@mui/icons-material";
import {
  AccessTimeOutlined,
  AccountBalanceWalletOutlined,
  AdminPanelSettingsOutlined,
  ArticleOutlined,
  BadgeOutlined,
  BarChartOutlined,
  BusinessOutlined,
  DashboardOutlined,
  EventBusyOutlined,
  EventNoteOutlined,
  HowToRegOutlined,
  PaymentsOutlined,
  PeopleOutlined,
  SettingsOutlined,
  TuneOutlined,
  WorkHistory,
} from "@mui/icons-material";

/**
 * Interface representing a sub-navigation item within a parent category
 */
export interface NavSubItem {
  /** The display label for the sub-item */
  title: string;
  /** The routing path */
  href: string;
  /** Optional MUI icon component */
  icon?: SvgIconComponent;
}

/**
 * Interface representing a navigation item in the sidebar
 */
export interface NavItem {
  /** The display label for the navigation item */
  title: string;
  /** The routing path */
  href: string;
  /** The MUI icon component to display */
  icon: SvgIconComponent;
  /** Optional nested sub-navigation items */
  children?: NavSubItem[];
}

/**
 * Navigation items configuration for the sidebar
 */
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: DashboardOutlined },
  { title: "Employees", href: "/employees", icon: PeopleOutlined },
  { title: "Attendance", href: "/attendance", icon: HowToRegOutlined },
  { title: "Leaves", href: "/leaves", icon: EventBusyOutlined },
  { title: "Recruitment", href: "/recruitment", icon: WorkHistory },
  { title: "Payroll", href: "/payroll", icon: PaymentsOutlined },
  {
    title: "Masters",
    href: "/masters",
    icon: TuneOutlined,
    children: [
      { title: "Departments", href: "/masters/departments", icon: BusinessOutlined },
      { title: "Roles & Permissions", href: "/masters/roles", icon: AdminPanelSettingsOutlined },
      { title: "Designations", href: "/masters/designations", icon: BadgeOutlined },
      { title: "Salary Structures", href: "/masters/salary-structures", icon: AccountBalanceWalletOutlined },
      { title: "Leave Types", href: "/masters/leave-types", icon: EventNoteOutlined },
      { title: "Work Shifts", href: "/masters/shifts", icon: AccessTimeOutlined },
    ],
  },
  { title: "Reports", href: "/reports", icon: BarChartOutlined },
  { title: "Blogs", href: "/blogs", icon: ArticleOutlined },
  { title: "Settings", href: "/settings", icon: SettingsOutlined },
];
