import type { SvgIconComponent } from "@mui/icons-material";
import {
  ArticleOutlined,
  BarChartOutlined,
  DashboardOutlined,
  EventBusyOutlined,
  HowToRegOutlined,
  PaymentsOutlined,
  PeopleOutlined,
  SettingsOutlined,
  WorkHistory,
} from "@mui/icons-material";

/**
 * Interface representing a single navigation item in the sidebar
 */
export interface NavItem {
  /** The display label for the navigation item */
  title: string;
  /** The routing path */
  href: string;
  /** The MUI icon component to display */
  icon: SvgIconComponent;
}

/**
 * Mock data for the sidebar navigation items
 */
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: DashboardOutlined },
  { title: "Employees", href: "/employees", icon: PeopleOutlined },
  { title: "Attendance", href: "/attendance", icon: HowToRegOutlined },
  { title: "Leaves", href: "/leaves", icon: EventBusyOutlined },
  { title: "Recruitment", href: "/recruitment", icon: WorkHistory },
  { title: "Payroll", href: "/payroll", icon: PaymentsOutlined },
  { title: "Reports", href: "/reports", icon: BarChartOutlined },
  { title: "Blogs", href: "/blogs", icon: ArticleOutlined },
  { title: "Settings", href: "/settings", icon: SettingsOutlined },
];
