import React, { useMemo, useState } from "react";
import {
  Add,
  AdminPanelSettings,
  Cancel,
  CheckCircle,
  Delete,
  Edit,
  MoreHoriz,
  People,
  Search,
} from "@mui/icons-material";
import { Button, Chip, IconButton, InputAdornment, InputBase, MenuItem } from "@mui/material";
import { ArrowMenu } from "shared/ArrowMenu";
import { CustomDialog } from "shared/CustomDialog";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { StatsCard } from "shared/StatsCard";
import {
  useCreateMasterRole,
  useDeleteMasterRole,
  useGetMasterRoles,
  useUpdateMasterRole,
  type MasterRole,
} from "services/masters";
import { ManageRoleDrawer, type RoleFormValues } from "../drawers/ManageRoleDrawer";

/**
 * Filter status choices matching Employee directory pattern
 */
type StatusFilter = "All" | "Active" | "Inactive";
const filterOptions: StatusFilter[] = ["All", "Active", "Inactive"];

/**
 * Row actions menu component for Role item
 */
interface RoleRowActionsProps {
  row: MasterRole;
  onEdit: (role: MasterRole) => void;
  onDelete: (role: MasterRole) => void;
}

/**
 * Individual role row actions component with custom popup menu
 *
 * @param props - Component props
 * @returns Rendered row action menu
 */
const RoleRowActions: React.FC<RoleRowActionsProps> = ({ row, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton
        size="small"
        className="!text-muted-foreground hover:!text-foreground"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <MoreHoriz />
      </IconButton>
      <ArrowMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        arrowPosition="right"
        paperClassName="!min-w-[140px]"
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onEdit(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-muted-foreground hover:!text-foreground hover:!bg-secondary/70"
        >
          <Edit className="!w-4 !h-4" />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(row);
          }}
          className="!text-xs !py-2 !px-3 !gap-2 !rounded-[5px] !text-destructive hover:!bg-destructive/10"
        >
          <Delete className="!w-4 !h-4 text-destructive" />
          <span className="text-destructive font-medium">Delete</span>
        </MenuItem>
      </ArrowMenu>
    </>
  );
};

/**
 * Role and permission master view component matching Employee section patterns
 *
 * @returns Rendered RoleMasterTab view
 */
export const RoleMasterTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<MasterRole | null>(null);
  const [deletingRole, setDeletingRole] = useState<MasterRole | null>(null);

  const {
    data: roleRes,
    isLoading,
    isFetching,
    refetch,
  } = useGetMasterRoles({
    search: searchTerm,
    status: statusFilter,
  });

  const createMutation = useCreateMasterRole(() => {
    refetch();
  });

  const updateMutation = useUpdateMasterRole(editingRole?.id || 0, () => {
    refetch();
  });

  const deleteMutation = useDeleteMasterRole(() => {
    refetch();
    setDeletingRole(null);
  });

  const roles: MasterRole[] = roleRes?.data || [];

  /**
   * Dynamically calculate active KPI metrics matching Employee section pattern
   */
  const dynamicKpiCards = useMemo(() => {
    const total = roles.length;
    const active = roles.filter((r) => r.status === "Active").length;
    const inactive = roles.filter((r) => r.status === "Inactive").length;
    const totalUsers = roles.reduce((acc, r) => acc + (r.user_count || 0), 0);

    return [
      {
        id: "total-roles",
        title: "Total Roles",
        value: String(total),
        subtext: "System authorization levels",
        icon: AdminPanelSettings,
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "active-roles",
        title: "Active Roles",
        value: String(active),
        subtext: `${total > 0 ? ((active / total) * 100).toFixed(1) : 0}% active policy deployment`,
        icon: CheckCircle,
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "inactive-roles",
        title: "Inactive Roles",
        value: String(inactive),
        subtext: `${total > 0 ? ((inactive / total) * 100).toFixed(1) : 0}% archived or disabled`,
        icon: Cancel,
        icon_color: "text-[#f14d4c]",
        icon_bg: "bg-[#f14d4c]/10",
      },
      {
        id: "assigned-users",
        title: "Assigned Users",
        value: String(totalUsers),
        subtext: "Total accounts mapped to roles",
        icon: People,
        icon_color: "text-[#ad87ed]",
        icon_bg: "bg-[#ad87ed]/10",
      },
    ];
  }, [roles]);

  /**
   * Submits form values to either create or update role
   *
   * @param values - Form values
   */
  const handleFormSubmit = async (values: RoleFormValues) => {
    if (editingRole) {
      await updateMutation.mutateAsync({
        name: values.name,
        description: values.description,
        status: values.status,
        permission_ids: values.permission_ids,
      });
    } else {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description,
        status: values.status,
        permission_ids: values.permission_ids,
      });
    }
  };

  /**
   * Column definitions matching Employee table layout and chip styling
   */
  const columns: ColumnDef<MasterRole>[] = [
    {
      header: "ROLE NAME",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[5px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <AdminPanelSettings className="!w-4 !h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">{row.name}</span>
            <span className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {row.description || "System Access Role"}
            </span>
          </div>
        </div>
      ),
      width: "25%",
    },
    {
      header: "PERMISSIONS GRANTED",
      cell: (row) => {
        const perms = row.permissions || [];
        return (
          <div className="flex items-center gap-1.5 flex-wrap max-w-[340px]">
            {perms.slice(0, 3).map((p) => (
              <span
                key={p.id}
                className="text-[11px] px-2 py-0.5 rounded-[4px] bg-secondary/80 text-foreground border border-border/60"
              >
                {p.name}
              </span>
            ))}
            {perms.length > 3 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-primary/10 text-primary font-semibold">
                +{perms.length - 3} more
              </span>
            )}
            {perms.length === 0 && (
              <span className="text-xs text-muted-foreground italic">No permissions mapped</span>
            )}
          </div>
        );
      },
      width: "35%",
    },
    {
      header: "USERS ASSIGNED",
      cell: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-secondary text-foreground">
          {row.user_count} Assigned
        </span>
      ),
      width: "15%",
    },
    {
      header: "STATUS",
      cell: (row) => {
        if (row.status === "Active") {
          return (
            <Chip
              icon={<CheckCircle className="!w-3.5 !h-3.5" />}
              label="Active"
              size="small"
              color="success"
              variant="outlined"
              className="!h-6 !text-xs !bg-success/10 !border-success/20 !font-medium"
            />
          );
        }
        return (
          <Chip
            icon={<Cancel className="!w-3.5 !h-3.5" />}
            label="Inactive"
            size="small"
            color="error"
            variant="outlined"
            className="!h-6 !text-xs !bg-destructive/10 !border-destructive/20 !font-medium"
          />
        );
      },
      width: "15%",
    },
    {
      header: "ACTION",
      align: "right",
      cell: (row) => (
        <RoleRowActions
          row={row}
          onEdit={(role) => {
            setEditingRole(role);
            setDrawerOpen(true);
          }}
          onDelete={(role) => setDeletingRole(role)}
        />
      ),
      width: "5%",
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Metric Cards matching Employee Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicKpiCards.map((card) => (
          <StatsCard
            key={card.id}
            title={card.title}
            value={card.value}
            subtext={card.subtext}
            icon={card.icon}
            iconBg={card.icon_bg}
            iconColor={card.icon_color}
          />
        ))}
      </div>



      {/* Action Toolbar matching Employee Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <InputBase
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 h-9 pl-3 pr-4 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all duration-200"
            startAdornment={
              <InputAdornment position="start">
                <Search className="!w-4 !h-4 text-muted-foreground" />
              </InputAdornment>
            }
          />

          <div className="flex items-center gap-1 bg-card/60 p-0.5 h-9 rounded-[5px] border border-border/50 box-border">
            {filterOptions.map((status) => (
              <Button
                key={status}
                size="small"
                onClick={() => setStatusFilter(status)}
                className={`${
                  statusFilter === status
                    ? "!bg-accent !text-accent-foreground"
                    : "!text-muted-foreground"
                }`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setEditingRole(null);
              setDrawerOpen(true);
            }}
            startIcon={<Add className="!w-4 !h-4" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-3.5 !py-2 !rounded-[5px] shadow-sm"
          >
            Add Role
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable data={roles} columns={columns} loading={isLoading || isFetching} pageSize={10} />

      {/* Form Drawer */}
      <ManageRoleDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingRole(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingRole}
      />

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        open={Boolean(deletingRole)}
        onClose={() => setDeletingRole(null)}
        title="Delete Role"
        maxWidth="xs"
        actions={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setDeletingRole(null)}
              className="!border-border !text-foreground !rounded-[5px] !text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={() => {
                if (deletingRole) {
                  deleteMutation.mutate(deletingRole.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="!bg-destructive !text-destructive-foreground !rounded-[5px] !text-xs !font-semibold"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Role"}
            </Button>
          </div>
        }
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to delete role{" "}
          <strong className="text-foreground">{deletingRole?.name}</strong>?
          {deletingRole && deletingRole.user_count > 0 && (
            <span className="block mt-2 text-destructive font-medium">
              Note: This role is currently assigned to {deletingRole.user_count} active accounts.
            </span>
          )}
        </p>
      </CustomDialog>
    </div>
  );
};
