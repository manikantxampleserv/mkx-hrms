import React, { useMemo, useState } from "react";
import {
  Add,
  Badge,
  Cancel,
  CheckCircle,
  Delete,
  Edit,
  MoreHoriz,
  People,
  Search,
} from "@mui/icons-material";
import {
  Button,
  Chip,
  IconButton,
  InputAdornment,
  InputBase,
  MenuItem,
} from "@mui/material";
import { ArrowMenu } from "shared/ArrowMenu";
import { CustomDialog } from "shared/CustomDialog";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { StatsCard } from "shared/StatsCard";
import {
  useCreateMasterDesignation,
  useDeleteMasterDesignation,
  useGetMasterDesignations,
  useUpdateMasterDesignation,
  type MasterDesignation,
} from "services/masters";
import {
  ManageDesignationDrawer,
  type DesignationFormValues,
} from "../drawers/ManageDesignationDrawer";

/**
 * Filter status choices matching Employee directory pattern
 */
type StatusFilter = "All" | "Active" | "Inactive";
const filterOptions: StatusFilter[] = ["All", "Active", "Inactive"];

/**
 * Row actions menu component for Designation item
 */
interface DesignationRowActionsProps {
  row: MasterDesignation;
  onEdit: (item: MasterDesignation) => void;
  onDelete: (item: MasterDesignation) => void;
}

/**
 * Individual designation row actions component with custom popup menu
 *
 * @param props - Component props
 * @returns Rendered row action menu
 */
const DesignationRowActions: React.FC<DesignationRowActionsProps> = ({
  row,
  onEdit,
  onDelete,
}) => {
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
 * Designation master view component matching Employee section patterns
 *
 * @returns Rendered DesignationMasterTab view
 */
export const DesignationMasterTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDesignation | null>(null);
  const [deletingItem, setDeletingItem] = useState<MasterDesignation | null>(null);

  const {
    data: res,
    isLoading,
    isFetching,
    refetch,
  } = useGetMasterDesignations({
    search: searchTerm,
    status: statusFilter,
  });

  const createMutation = useCreateMasterDesignation(() => {
    refetch();
  });

  const updateMutation = useUpdateMasterDesignation(editingItem?.id || 0, () => {
    refetch();
  });

  const deleteMutation = useDeleteMasterDesignation(() => {
    refetch();
    setDeletingItem(null);
  });

  const designations: MasterDesignation[] = res?.data || [];

  /**
   * Dynamically calculate active KPI metrics matching Employee section pattern
   */
  const dynamicKpiCards = useMemo(() => {
    const total = designations.length;
    const active = designations.filter((d) => d.status === "Active").length;
    const inactive = designations.filter((d) => d.status === "Inactive").length;
    const totalEmployees = designations.reduce((acc, d) => acc + (d.employee_count || 0), 0);

    return [
      {
        id: "total-designations",
        title: "Total Designations",
        value: String(total),
        subtext: "Standard job titles defined",
        icon: Badge,
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "active-designations",
        title: "Active Titles",
        value: String(active),
        subtext: `${total > 0 ? ((active / total) * 100).toFixed(1) : 0}% available for assignment`,
        icon: CheckCircle,
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "inactive-designations",
        title: "Inactive Titles",
        value: String(inactive),
        subtext: `${total > 0 ? ((inactive / total) * 100).toFixed(1) : 0}% archived or legacy`,
        icon: Cancel,
        icon_color: "text-[#f14d4c]",
        icon_bg: "bg-[#f14d4c]/10",
      },
      {
        id: "staff-in-positions",
        title: "Active Job Holders",
        value: String(totalEmployees),
        subtext: "Staff mapped to job titles",
        icon: People,
        icon_color: "text-[#ad87ed]",
        icon_bg: "bg-[#ad87ed]/10",
      },
    ];
  }, [designations]);

  /**
   * Submits form values to either create or update designation
   *
   * @param values - Form values
   */
  const handleFormSubmit = async (values: DesignationFormValues) => {
    const deptId = values.department_id ? Number(values.department_id) : null;
    if (editingItem) {
      await updateMutation.mutateAsync({
        title: values.title,
        code: values.code,
        department_id: deptId,
        description: values.description,
        status: values.status,
      });
    } else {
      await createMutation.mutateAsync({
        title: values.title,
        code: values.code,
        department_id: deptId,
        description: values.description,
        status: values.status,
      });
    }
  };

  /**
   * Column definitions matching Employee table layout and chip styling
   */
  const columns: ColumnDef<MasterDesignation>[] = [
    {
      header: "DESIGNATION / TITLE",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[5px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Badge className="!w-4 !h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">{row.title}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{row.code}</span>
          </div>
        </div>
      ),
      width: "28%",
    },
    {
      header: "DEPARTMENT",
      cell: (row) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-[4px] bg-secondary border border-border/80 text-foreground">
          {row.department_name}
        </span>
      ),
      width: "20%",
    },
    {
      header: "DESCRIPTION",
      cell: (row) => (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-[300px]">
          {row.description || "No description specified"}
        </span>
      ),
      width: "27%",
    },
    {
      header: "EMPLOYEES",
      cell: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-secondary text-foreground">
          {row.employee_count} Active
        </span>
      ),
      width: "10%",
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
      width: "10%",
    },
    {
      header: "ACTION",
      align: "right",
      cell: (row) => (
        <DesignationRowActions
          row={row}
          onEdit={(item) => {
            setEditingItem(item);
            setDrawerOpen(true);
          }}
          onDelete={(item) => setDeletingItem(item)}
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
            placeholder="Search designations..."
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
              setEditingItem(null);
              setDrawerOpen(true);
            }}
            startIcon={<Add className="!w-4 !h-4" />}
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-3.5 !py-2 !rounded-[5px] shadow-sm"
          >
            Add Designation
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={designations}
        columns={columns}
        loading={isLoading || isFetching}
        pageSize={10}
      />

      {/* Form Drawer */}
      <ManageDesignationDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
      />

      {/* Delete Confirmation Dialog */}
      <CustomDialog
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        title="Delete Designation"
        maxWidth="xs"
        actions={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setDeletingItem(null)}
              className="!border-border !text-foreground !rounded-[5px] !text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={() => {
                if (deletingItem) {
                  deleteMutation.mutate(deletingItem.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="!bg-destructive !text-destructive-foreground !rounded-[5px] !text-xs !font-semibold"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Designation"}
            </Button>
          </div>
        }
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to delete designation{" "}
          <strong className="text-foreground">{deletingItem?.title}</strong>?
        </p>
      </CustomDialog>
    </div>
  );
};
