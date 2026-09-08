import { AccessTime, Cancel, CheckCircle, Info, Refresh } from "@mui/icons-material";
import { Avatar, Chip, IconButton, InputAdornment, InputBase } from "@mui/material";
import { Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useGetAllActivities, type RecentActivity } from "services/dashboard";
import { AppDrawer } from "shared/Drawer";

/**
 * Props for the ActivityAuditDrawer component
 */
export interface ActivityAuditDrawerProps {
  open: boolean;
  onClose: () => void;
}

const statusIconMap: Record<string, React.ElementType> = {
  success: CheckCircle,
  warning: AccessTime,
  error: Cancel,
  info: Info,
};

/**
 * Slide-out drawer displaying comprehensive audit log of all system mutations
 *
 * @param props - Component configuration props
 * @returns Rendered drawer component
 */
export function ActivityAuditDrawer({
  open,
  onClose,
}: ActivityAuditDrawerProps): React.ReactElement {
  const [search, setSearch] = useState("");
  const { data: response, isLoading, refetch } = useGetAllActivities(search);

  const activities: RecentActivity[] = useMemo(() => response?.data || [], [response]);

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title="Activity Audit Log"
      subtitle="Real-time audit tracking of system modifications and entity state changes"
      width={540}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <InputBase
            placeholder="Search activities by name, status, or change..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-9 pl-3 pr-4 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100"
            startAdornment={
              <InputAdornment position="start">
                <Search className="!w-4 !h-4 text-muted-foreground" />
              </InputAdornment>
            }
          />
          <IconButton
            size="small"
            onClick={() => refetch()}
            disabled={isLoading}
            className="!text-muted-foreground hover:!text-foreground !border !border-border !rounded-[5px] !w-9 !h-9"
          >
            <Refresh className={`!w-4 !h-4 ${isLoading ? "animate-spin" : ""}`} />
          </IconButton>
        </div>

        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {isLoading ? "Loading activity records..." : "No matching activity logs found."}
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = statusIconMap[activity.status_type] || CheckCircle;

              return (
                <div
                  key={activity.id}
                  className="flex items-start justify-between p-3.5 rounded-lg bg-card/60 border border-border hover:bg-secondary/40 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      variant="rounded"
                      className="!w-9 !h-9 !text-xs !font-bold shrink-0 !rounded-[6px]"
                      style={{
                        backgroundColor: activity.bg_alpha || "rgba(0, 177, 216, 0.15)",
                        color:
                          activity.status_type === "success"
                            ? "#10b981"
                            : activity.status_type === "warning"
                              ? "#f59e0b"
                              : activity.status_type === "error"
                                ? "#ef4444"
                                : "#3b82f6",
                      }}
                    >
                      {activity.initials}
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {activity.name}
                      </p>
                      <p className="text-xs text-muted-foreground leading-snug break-words max-w-[280px] sm:max-w-[320px]">
                        {activity.subtext}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Chip
                      icon={<Icon className="!w-3 !h-3" />}
                      label={activity.status_label}
                      size="small"
                      variant="outlined"
                      color={
                        activity.status_type === "info"
                          ? "default"
                          : (activity.status_type as "success" | "warning" | "error" | "default")
                      }
                      className="!text-[11px] !h-6"
                    />
                    {activity.time_ago && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {activity.time_ago}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppDrawer>
  );
}
