import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AccessTimeOutlined,
  AccountBalanceWalletOutlined,
  AdminPanelSettingsOutlined,
  BadgeOutlined,
  BusinessOutlined,
  EventNoteOutlined,
  TuneOutlined,
} from "@mui/icons-material";
import { FadeUpItem, StaggerContainer } from "shared/animations";
import { DepartmentMasterTab } from "./components/DepartmentMasterTab";
import { RoleMasterTab } from "./components/RoleMasterTab";
import { DesignationMasterTab } from "./components/DesignationMasterTab";
import { SalaryStructureMasterTab } from "./components/SalaryStructureMasterTab";
import { LeaveTypeMasterTab } from "./components/LeaveTypeMasterTab";
import { WorkShiftMasterTab } from "./components/WorkShiftMasterTab";

/**
 * Definition of a master tab configuration
 */
interface MasterTabDef {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

/**
 * Available workforce master configuration tabs
 */
const masterTabs: MasterTabDef[] = [
  {
    key: "departments",
    label: "Departments",
    href: "/masters/departments",
    icon: BusinessOutlined,
    description: "Company organizational divisions, hierarchies, and functional units",
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    href: "/masters/roles",
    icon: AdminPanelSettingsOutlined,
    description: "System user access roles, scope restrictions, and security rights",
  },
  {
    key: "designations",
    label: "Designations",
    href: "/masters/designations",
    icon: BadgeOutlined,
    description: "Official job titles and positional hierarchy within departments",
  },
  {
    key: "salary-structures",
    label: "Salary Structures",
    href: "/masters/salary-structures",
    icon: AccountBalanceWalletOutlined,
    description: "Compensation models, allowance splits, and deduction frameworks",
  },
  {
    key: "leave-types",
    label: "Leave Types",
    href: "/masters/leave-types",
    icon: EventNoteOutlined,
    description: "Time-off policies, annual allocations, and paid leave categories",
  },
  {
    key: "shifts",
    label: "Work Shifts",
    href: "/masters/shifts",
    icon: AccessTimeOutlined,
    description: "Operational working hours, daily schedules, and grace period rules",
  },
];

/**
 * Centralized Masters hub page managing navigation and views across all workforce master entities
 *
 * @returns The rendered Masters page view
 */
export const Masters: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Resolve active master tab based on current URL path
   */
  const activeTabKey = useMemo(() => {
    const path = location.pathname;
    const match = masterTabs.find((t) => path.startsWith(t.href));
    return match ? match.key : "departments";
  }, [location.pathname]);

  const activeTab = useMemo(() => {
    return masterTabs.find((t) => t.key === activeTabKey) || masterTabs[0];
  }, [activeTabKey]);

  return (
    <StaggerContainer className="space-y-5 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <FadeUpItem>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-[5px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <TuneOutlined className="!w-5 !h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Workforce Masters
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{activeTab.description}</p>
            </div>
          </div>
        </div>
      </FadeUpItem>

      {/* Modern Top Tabs Bar */}
      <FadeUpItem>
        <div className="flex items-center gap-1.5 p-1 bg-secondary/30 border border-border rounded-[5px] overflow-x-auto no-scrollbar">
          {masterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTabKey === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate(tab.href)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-[5px] text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className="!w-4 !h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </FadeUpItem>

      {/* Dynamic Tab View Content */}
      <FadeUpItem>
        {activeTabKey === "departments" && <DepartmentMasterTab />}
        {activeTabKey === "roles" && <RoleMasterTab />}
        {activeTabKey === "designations" && <DesignationMasterTab />}
        {activeTabKey === "salary-structures" && <SalaryStructureMasterTab />}
        {activeTabKey === "leave-types" && <LeaveTypeMasterTab />}
        {activeTabKey === "shifts" && <WorkShiftMasterTab />}
      </FadeUpItem>
    </StaggerContainer>
  );
};

export default Masters;
