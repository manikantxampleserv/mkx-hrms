import React, { useMemo, useState } from "react";
import {
  AccountBalanceWallet,
  Add,
  Cancel,
  CheckCircle,
  Delete,
  Edit,
  MoreHoriz,
  Payments,
  Search,
} from "@mui/icons-material";
import { Button, Chip, IconButton, InputAdornment, InputBase, MenuItem } from "@mui/material";
import { ArrowMenu } from "shared/ArrowMenu";
import { CustomDialog } from "shared/CustomDialog";
import { DataTable, type ColumnDef } from "shared/DataTable";
import { StatsCard } from "shared/StatsCard";
import {
  useCreateMasterSalaryStructure,
  useDeleteMasterSalaryStructure,
  useGetMasterSalaryStructures,
  useUpdateMasterSalaryStructure,
  type MasterSalaryStructure,
} from "services/masters";
import {
  ManageSalaryStructureDrawer,
  type SalaryStructureFormValues,
} from "../drawers/ManageSalaryStructureDrawer";

/**
 * Filter status choices matching Employee directory pattern
 */
type StatusFilter = "All" | "Active" | "Inactive";
const filterOptions: StatusFilter[] = ["All", "Active", "Inactive"];

/**
 * Row actions menu component for Salary Structure item
 */
interface SalaryStructureRowActionsProps {
  row: MasterSalaryStructure;
  onEdit: (item: MasterSalaryStructure) => void;
  onDelete: (item: MasterSalaryStructure) => void;
}

/**
 * Individual salary structure row actions component with custom popup menu
 *
 * @param props - Component props
 * @returns Rendered row action menu
 */
const SalaryStructureRowActions: React.FC<SalaryStructureRowActionsProps> = ({
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
 * Salary structure master view component matching Employee section patterns
 *
 * @returns Rendered SalaryStructureMasterTab view
 */
export const SalaryStructureMasterTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterSalaryStructure | null>(null);
  const [deletingItem, setDeletingItem] = useState<MasterSalaryStructure | null>(null);

  const {
    data: res,
    isLoading,
    isFetching,
    refetch,
  } = useGetMasterSalaryStructures({
    search: searchTerm,
    status: statusFilter,
  });

  const createMutation = useCreateMasterSalaryStructure(() => {
    refetch();
  });

  const updateMutation = useUpdateMasterSalaryStructure(editingItem?.id || 0, () => {
    refetch();
  });

  const deleteMutation = useDeleteMasterSalaryStructure(() => {
    refetch();
    setDeletingItem(null);
  });

  const structures: MasterSalaryStructure[] = res?.data || [];

  /**
   * Dynamically calculate active KPI metrics matching Employee section pattern
   */
  const dynamicKpiCards = useMemo(() => {
    const total = structures.length;
    const active = structures.filter((s) => s.status === "Active").length;
    const inactive = structures.filter((s) => s.status === "Inactive").length;
    const totalEarnings = structures.filter((s) => !s.is_deduction).length;
    const totalDeductions = structures.filter((s) => s.is_deduction).length;

    return [
      {
        id: "total-structures",
        title: "Total Components",
        value: String(total),
        subtext: "Salary structures configured",
        icon: AccountBalanceWallet,
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "active-packages",
        title: "Active Components",
        value: String(active),
        subtext: `${total > 0 ? ((active / total) * 100).toFixed(1) : 0}% active in payroll formulas`,
        icon: CheckCircle,
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "inactive-packages",
        title: "Inactive Components",
        value: String(inactive),
        subtext: `${total > 0 ? ((inactive / total) * 100).toFixed(1) : 0}% disabled components`,
        icon: Cancel,
        icon_color: "text-[#f14d4c]",
        icon_bg: "bg-[#f14d4c]/10",
      },
      {
        id: "earnings-count",
        title: "Earnings / Deductions",
        value: `${totalEarnings} / ${totalDeductions}`,
        subtext: "Configured component balance",
        icon: Payments,
        icon_color: "text-[#ad87ed]",
        icon_bg: "bg-[#ad87ed]/10",
      },
    ];
  }, [structures]);

  /**
   * Submits form values to either create or update salary structure
   *
   * @param values - Form values
   */
  const handleFormSubmit = async (values: SalaryStructureFormValues) => {
    const payload = {
      name: values.name,
      code: values.code,
      description: values.description,
      is_deduction: values.is_deduction,
      is_taxable: values.is_taxable,
      is_base_salary: values.is_base_salary,
      calculation_type: values.calculation_type,
      default_value: Number(values.default_value),
      status: values.status,
    };

    if (editingItem) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  /**
   * Column definitions matching Employee table layout and chip styling
   */
  const columns: ColumnDef<MasterSalaryStructure>[] = [
    {
      header: "COMPONENT NAME",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-[5px] flex items-center justify-center shrink-0 ${row.is_deduction ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}
          >
            <AccountBalanceWallet className="!w-4 !h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">{row.name}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{row.code}</span>
          </div>
        </div>
      ),
      width: "25%",
    },
    {
      header: "TYPE",
      cell: (row) => (
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-[4px] border ${
            row.is_deduction
              ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {row.is_deduction ? "Deduction (-)" : "Earning (+)"}
        </span>
      ),
      width: "15%",
    },
    {
      header: "CLASSIFICATION",
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.is_base_salary && (
            <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-primary/10 border border-primary/20 text-primary font-semibold">
              Base Salary
            </span>
          )}
          <span
            className={`text-[11px] px-2 py-0.5 rounded-[4px] border font-medium ${
              row.is_taxable
                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
            }`}
          >
            {row.is_taxable ? "Taxable" : "Tax Exempt"}
          </span>
        </div>
      ),
      width: "20%",
    },
    {
      header: "CALCULATION & DEFAULT",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <span className="font-medium text-muted-foreground">{row.calculation_type}:</span>
          <span className="font-semibold">
            {row.calculation_type === "Percentage"
              ? `${Number(row.default_value || 0)}%`
              : `$${Number(row.default_value || 0).toLocaleString()}`}
          </span>
        </div>
      ),
      width: "20%",
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
        <SalaryStructureRowActions
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
            placeholder="Search salary structures..."
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
            Add Structure
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={structures}
        columns={columns}
        loading={isLoading || isFetching}
        pageSize={10}
      />

      {/* Form Drawer */}
      <ManageSalaryStructureDrawer
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
        title="Delete Salary Structure"
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
              {deleteMutation.isPending ? "Deleting..." : "Delete Structure"}
            </Button>
          </div>
        }
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to delete salary structure{" "}
          <strong className="text-foreground">{deletingItem?.name}</strong>?
        </p>
      </CustomDialog>
    </div>
  );
};
