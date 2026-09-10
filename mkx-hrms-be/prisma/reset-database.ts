import "dotenv/config";
import { prisma } from "../src/libraries/prisma";
import { hashPassword } from "../src/v1/services/auth.service";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../src/v1/services/employee.service";

/**
 * Reset and clear all database tables, resetting autoincrement sequences
 */
const clearDatabase = async (): Promise<void> => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "activity_logs",
      "attendance",
      "blogs",
      "candidates",
      "leaves",
      "notification_preferences",
      "payrolls",
      "reports",
      "integrations",
      "employees",
      "users",
      "role_permissions",
      "permissions",
      "designations",
      "departments",
      "leave_types",
      "salary_structures",
      "work_shifts",
      "roles"
    RESTART IDENTITY CASCADE;
  `);
};

/**
 * Seed core system roles and link administrative permissions
 *
 * @returns Map of role names to their primary key identifiers
 */
const seedCoreRolesAndPermissions = async (): Promise<Record<string, number>> => {
  const roles = [
    { name: "Admin", description: "Full system administrative access" },
    { name: "Manager", description: "People and department management access" },
    { name: "Employee", description: "Standard workforce employee self-service" },
    { name: "HR Specialist", description: "People operations and recruitment access" },
  ];

  const roleMap: Record<string, number> = {};
  for (const role of roles) {
    const created = await prisma.role.create({ data: role });
    roleMap[role.name] = created.id;
  }

  const permissions = [
    { name: "users:read", module: "Users", description: "View user directory" },
    { name: "users:write", module: "Users", description: "Manage user profiles" },
    { name: "employees:read", module: "Employees", description: "View workforce directory" },
    { name: "employees:write", module: "Employees", description: "Manage employee records" },
    { name: "attendance:read", module: "Attendance", description: "View attendance logs" },
    { name: "attendance:write", module: "Attendance", description: "Log daily attendance" },
    { name: "leaves:read", module: "Leaves", description: "View leave requests" },
    { name: "leaves:write", module: "Leaves", description: "Apply and manage leaves" },
    { name: "payroll:read", module: "Payroll", description: "View payroll disbursements" },
    { name: "payroll:write", module: "Payroll", description: "Process payroll cycles" },
    { name: "recruitment:read", module: "Recruitment", description: "View candidate pipeline" },
    { name: "recruitment:write", module: "Recruitment", description: "Manage candidates" },
    { name: "reports:read", module: "Reports", description: "View and export reports" },
    { name: "settings:manage", module: "Settings", description: "Manage company settings" },
  ];

  for (const perm of permissions) {
    const createdPerm = await prisma.permission.create({ data: perm });
    if (roleMap["Admin"]) {
      await prisma.rolePermission.create({
        data: {
          role_id: roleMap["Admin"],
          permission_id: createdPerm.id,
        },
      });
    }
  }

  return roleMap;
};

/**
 * Seed initial company department
 *
 * @returns Primary key of created department
 */
const seedInitialDepartment = async (): Promise<number> => {
  const dept = await prisma.department.create({
    data: {
      name: "Engineering",
      code: "ENG",
      description: "Software development and technology operations",
      status: "Active",
    },
  });
  return dept.id;
};

/**
 * Provision solitary administrative user with database ID 1 and linked employee profile
 *
 * @param roleId - Primary key identifier of Admin role
 * @param departmentId - Primary key identifier of Engineering department
 */
const seedSingleAdminUser = async (roleId: number, departmentId: number): Promise<void> => {
  const hashedPassword = await hashPassword("admin@123");

  const adminUser = await prisma.user.create({
    data: {
      employee_id: "EMP001",
      first_name: "Admin",
      last_name: "MKX",
      email: "admin@mkx.monster",
      password_hash: hashedPassword,
      role_id: roleId,
      status: "active",
      timezone: "Asia/Kolkata",
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      employee_id: "EMP001",
      name: "Admin MKX",
      first_name: "Admin",
      last_name: "MKX",
      email: "admin@mkx.monster",
      role_id: roleId,
      department_id: departmentId,
      status: "Active",
      join_date: new Date(),
      user_id: adminUser.id,
    },
  });

  for (const pref of DEFAULT_NOTIFICATION_PREFERENCES) {
    await prisma.notificationPreference.create({
      data: {
        user_id: adminUser.id,
        preference_key: pref.preference_key,
        label: pref.label,
        description: pref.description,
        default_email: pref.default_email,
        default_push: pref.default_push,
      },
    });
  }

  console.log(`Single user provisioned with DB ID: ${adminUser.id} (${adminUser.email})`);
  console.log(
    `Linked employee record created with DB ID: ${adminEmployee.id} (${adminEmployee.employee_id})`,
  );
};

/**
 * Main execution handler to reset the database and establish the single user
 */
const run = async (): Promise<void> => {
  console.log("Clearing all data from database...");
  await clearDatabase();
  console.log("Database cleared and autoincrement sequences restarted to 1.");

  console.log("Setting up foundational roles, permissions, and department...");
  const roleMap = await seedCoreRolesAndPermissions();
  const departmentId = await seedInitialDepartment();

  console.log("Creating single administrator account...");
  await seedSingleAdminUser(roleMap["Admin"], departmentId);

  console.log("Database reset completed successfully!");
};

run()
  .catch((err: unknown) => {
    console.error("Error resetting database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
