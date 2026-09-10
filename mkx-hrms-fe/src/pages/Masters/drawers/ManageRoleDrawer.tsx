import React, { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, CircularProgress, Checkbox, FormControlLabel } from "@mui/material";
import { AdminPanelSettings, Close, Edit } from "@mui/icons-material";
import { AppDrawer } from "shared/Drawer";
import { Input } from "shared/Input";
import { ActiveInactiveField } from "shared/ActiveInactiveField";
import { useGetMasterPermissions, type MasterRole, type MasterPermission } from "services/masters";

/**
 * Form values for creating or editing a Role
 */
export interface RoleFormValues {
  name: string;
  description: string;
  status: "Active" | "Inactive";
  permission_ids: number[];
}

/**
 * Props for ManageRoleDrawer
 */
export interface ManageRoleDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: RoleFormValues) => Promise<void> | void;
  initialData?: MasterRole | null;
}

/**
 * Validation schema for Role form
 */
const roleValidationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("Role name is required")
    .min(2, "Must be at least 2 characters"),
  description: Yup.string().trim().optional(),
  status: Yup.string().oneOf(["Active", "Inactive"]).required("Status is required"),
  permission_ids: Yup.array().of(Yup.number()).default([]),
});

/**
 * Initial empty values for role form
 */
const defaultInitialValues: RoleFormValues = {
  name: "",
  description: "",
  status: "Active",
  permission_ids: [],
};

/**
 * Drawer component for configuring system roles and permissions with Formik and Yup validation
 *
 * @param props - Component configuration properties
 * @returns Rendered AppDrawer containing role form and permission matrix
 */
export const ManageRoleDrawer: React.FC<ManageRoleDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData);
  const { data: permissionsRes, isLoading: permissionsLoading } = useGetMasterPermissions();
  const allPermissions: MasterPermission[] = permissionsRes?.data || [];

  /**
   * Group system permissions by module
   */
  const permissionsByModule = useMemo(() => {
    const groups: Record<string, MasterPermission[]> = {};
    for (const perm of allPermissions) {
      const mod = perm.module || "General";
      if (!groups[mod]) {
        groups[mod] = [];
      }
      groups[mod].push(perm);
    }
    return groups;
  }, [allPermissions]);

  const formik = useFormik<RoleFormValues>({
    initialValues: initialData
      ? {
          name: initialData.name || "",
          description: initialData.description || "",
          status: initialData.status || "Active",
          permission_ids: initialData.permissions?.map((p) => p.id) || [],
        }
      : defaultInitialValues,
    enableReinitialize: true,
    validationSchema: roleValidationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit(values);
        resetForm();
        onClose();
      } catch (err: unknown) {
        setSubmitting(false);
      }
    },
  });

  /**
   * Toggles an individual permission ID in the selection list
   *
   * @param permissionId - The permission ID to toggle
   */
  const handleTogglePermission = (permissionId: number) => {
    const current = formik.values.permission_ids;
    if (current.includes(permissionId)) {
      formik.setFieldValue(
        "permission_ids",
        current.filter((id) => id !== permissionId),
      );
    } else {
      formik.setFieldValue("permission_ids", [...current, permissionId]);
    }
  };

  /**
   * Toggles all permissions in a specific module
   *
   * @param modulePermissions - Array of permissions for this module
   */
  const handleToggleModule = (modulePermissions: MasterPermission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    const allSelected = moduleIds.every((id) => formik.values.permission_ids.includes(id));
    if (allSelected) {
      formik.setFieldValue(
        "permission_ids",
        formik.values.permission_ids.filter((id) => !moduleIds.includes(id)),
      );
    } else {
      const merged = Array.from(new Set([...formik.values.permission_ids, ...moduleIds]));
      formik.setFieldValue("permission_ids", merged);
    }
  };

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Role & Permissions" : "Add New Role"}
      subtitle={
        isEditing
          ? `Modify permissions and access scope for ${initialData?.name || ""}`
          : "Define a new access role and grant granular functional permissions"
      }
      width={640}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={formik.isSubmitting}
            startIcon={<Close className="!w-4 !h-4" />}
            className="!border-border !bg-secondary !text-muted-foreground hover:!text-foreground !text-xs !normal-case !font-normal !px-4 !py-2 !rounded-[5px]"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => formik.handleSubmit()}
            disabled={formik.isSubmitting || !formik.isValid}
            startIcon={
              formik.isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : isEditing ? (
                <Edit className="!w-4 !h-4" />
              ) : (
                <AdminPanelSettings className="!w-4 !h-4" />
              )
            }
            className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !text-xs !normal-case !font-semibold !px-4 !py-2 !rounded-[5px] shadow-sm"
          >
            {formik.isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Update Role"
                : "Create Role"}
          </Button>
        </div>
      }
    >
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
        <Input
          name="name"
          label="Role Name"
          placeholder="e.g. HR Manager, Team Lead, Billing Specialist"
          formik={formik}
          required
        />

        <ActiveInactiveField name="status" label="Status" formik={formik} required />

        <Input
          name="description"
          label="Description"
          placeholder="Describe the scope and responsibilities of this role"
          multiline
          rows={2}
          formik={formik}
        />

        <div className="pt-2 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Assigned Permissions</span>
            <span className="text-xs text-muted-foreground font-medium">
              {formik.values.permission_ids.length} of {allPermissions.length} selected
            </span>
          </div>

          {permissionsLoading ? (
            <div className="flex justify-center py-6">
              <CircularProgress size={24} />
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-1">
              {Object.entries(permissionsByModule).map(([mod, perms]) => {
                const modIds = perms.map((p) => p.id);
                const isAllSelected = modIds.every((id) =>
                  formik.values.permission_ids.includes(id),
                );

                return (
                  <div
                    key={mod}
                    className="border border-border/80 rounded-[5px] p-3 bg-secondary/20 dark:bg-zinc-900/40 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        {mod} Module
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleModule(perms)}
                        className="text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors"
                      >
                        {isAllSelected ? "Deselect All" : "Select All"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {perms.map((perm) => {
                        const isChecked = formik.values.permission_ids.includes(perm.id);
                        return (
                          <FormControlLabel
                            key={perm.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.id)}
                                className="!p-1"
                              />
                            }
                            label={
                              <span className="text-xs text-foreground select-none">
                                {perm.name}
                              </span>
                            }
                            className="!m-0"
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </AppDrawer>
  );
};
