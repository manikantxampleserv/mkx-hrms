import "dotenv/config";
import { prisma } from "../src/libraries/prisma";
import { hashPassword } from "../src/v1/services/auth.service";

/**
 * Seed core system roles and link administrative permissions
 *
 * @returns Map of role names to their primary key identifiers
 */
const seedRolesAndPermissions = async (): Promise<Record<string, number>> => {
  const rolesData = [
    { name: "Admin", description: "Full system administrative access" },
    { name: "Manager", description: "People and department management access" },
    { name: "Employee", description: "Standard workforce employee self-service" },
    { name: "HR Specialist", description: "People operations and recruitment access" },
  ];

  const roleMap: Record<string, number> = {};

  for (const role of rolesData) {
    const record = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    roleMap[role.name] = record.id;
  }

  const permissionsData = [
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
    { name: "masters:read", module: "Masters", description: "View company master tables" },
    {
      name: "masters:write",
      module: "Masters",
      description: "Manage company master configurations",
    },
  ];

  for (const perm of permissionsData) {
    const record = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });

    if (roleMap["Admin"]) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: roleMap["Admin"],
            permission_id: record.id,
          },
        },
        update: {},
        create: {
          role_id: roleMap["Admin"],
          permission_id: record.id,
        },
      });
    }
  }

  return roleMap;
};

/**
 * Seed enterprise departments
 *
 * @returns Map of department names to their primary key identifiers
 */
const seedDepartments = async (): Promise<Record<string, number>> => {
  const departmentsData = [
    {
      name: "Engineering",
      code: "ENG",
      description: "Software development and engineering operations",
    },
    { name: "Product", code: "PRD", description: "Product strategy, roadmaps, and lifecycle" },
    { name: "Design", code: "DSG", description: "Product UI/UX design and creative brand systems" },
    {
      name: "Infrastructure",
      code: "INF",
      description: "Cloud infrastructure, DevOps, and reliability",
    },
    {
      name: "Leadership",
      code: "LDR",
      description: "Executive leadership and strategic direction",
    },
    { name: "People Ops", code: "HR", description: "Human resources, workplace, and talent ops" },
    {
      name: "Marketing",
      code: "MKT",
      description: "Growth, brand marketing, and content strategy",
    },
    { name: "Sales", code: "SLS", description: "Revenue operations, partnerships, and accounts" },
  ];

  const deptMap: Record<string, number> = {};

  for (const dept of departmentsData) {
    const record = await prisma.department.upsert({
      where: { name: dept.name },
      update: { code: dept.code, description: dept.description },
      create: dept,
    });
    deptMap[dept.name] = record.id;
  }

  return deptMap;
};

/**
 * Seed foundational designations mapped to departments
 *
 * @param deptMap - Map of department names to primary keys
 */
const seedDesignations = async (deptMap: Record<string, number>): Promise<void> => {
  const designationsData = [
    {
      title: "Senior Software Engineer",
      code: "SSE",
      department: "Engineering",
      description: "Senior core engineering role",
    },
    {
      title: "Engineering Manager",
      code: "EM",
      department: "Engineering",
      description: "Technical engineering management",
    },
    {
      title: "Lead Product Manager",
      code: "LPM",
      department: "Product",
      description: "Product lifecycle ownership",
    },
    {
      title: "Product Designer",
      code: "PD",
      department: "Design",
      description: "User experience and visual design",
    },
    {
      title: "DevOps Engineer",
      code: "DOE",
      department: "Infrastructure",
      description: "Cloud and site reliability engineering",
    },
    {
      title: "VP of Leadership",
      code: "VP",
      department: "Leadership",
      description: "Executive leadership role",
    },
    {
      title: "HR Specialist",
      code: "HRS",
      department: "People Ops",
      description: "People operations and talent acquisition",
    },
    {
      title: "Account Executive",
      code: "AE",
      department: "Sales",
      description: "Enterprise sales and accounts",
    },
  ];

  for (const des of designationsData) {
    const departmentId = deptMap[des.department] ?? null;
    await prisma.designation.upsert({
      where: { code: des.code },
      update: { title: des.title, department_id: departmentId, description: des.description },
      create: {
        title: des.title,
        code: des.code,
        department_id: departmentId,
        description: des.description,
        status: "Active",
      },
    });
  }
};

/**
 * Seed organizational leave policy types
 */
const seedLeaveTypes = async (): Promise<void> => {
  const leaveTypesData = [
    {
      name: "Casual Leave",
      code: "CL",
      days_per_year: 12,
      is_paid: true,
      color: "#4f46e5",
      description: "Standard personal leave entitlement",
    },
    {
      name: "Sick Leave",
      code: "SL",
      days_per_year: 10,
      is_paid: true,
      color: "#06b6d4",
      description: "Medical absence and recovery leave",
    },
    {
      name: "Annual PTO",
      code: "PTO",
      days_per_year: 18,
      is_paid: true,
      color: "#10b981",
      description: "Annual paid time off vacation",
    },
    {
      name: "Maternity Leave",
      code: "ML",
      days_per_year: 90,
      is_paid: true,
      color: "#ec4899",
      description: "Maternal childcare leave",
    },
    {
      name: "Paternity Leave",
      code: "PL",
      days_per_year: 15,
      is_paid: true,
      color: "#8b5cf6",
      description: "Paternal childcare leave",
    },
  ];

  for (const item of leaveTypesData) {
    await prisma.leaveType.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        days_per_year: item.days_per_year,
        is_paid: item.is_paid,
        color: item.color,
        description: item.description,
      },
      create: {
        name: item.name,
        code: item.code,
        days_per_year: item.days_per_year,
        is_paid: item.is_paid,
        color: item.color,
        description: item.description,
        status: "Active",
      },
    });
  }
};

/**
 * Seed individual salary structure components
 */
const seedSalaryStructures = async (): Promise<void> => {
  const salaryStructuresData = [
    {
      name: "Basic Salary",
      code: "BASIC",
      is_deduction: false,
      is_taxable: true,
      is_base_salary: true,
      calculation_type: "Fixed",
      default_value: 0,
      description: "Base salary component",
    },
    {
      name: "House Rent Allowance",
      code: "HRA",
      is_deduction: false,
      is_taxable: false,
      is_base_salary: false,
      calculation_type: "Percentage",
      default_value: 20,
      description: "House rent allowance — 20% of basic",
    },
    {
      name: "Dearness Allowance",
      code: "DA",
      is_deduction: false,
      is_taxable: true,
      is_base_salary: false,
      calculation_type: "Percentage",
      default_value: 10,
      description: "Dearness allowance — 10% of basic",
    },
    {
      name: "Special Allowance",
      code: "SPECIAL",
      is_deduction: false,
      is_taxable: true,
      is_base_salary: false,
      calculation_type: "Fixed",
      default_value: 0,
      description: "Discretionary special allowance",
    },
    {
      name: "Provident Fund",
      code: "PF",
      is_deduction: true,
      is_taxable: false,
      is_base_salary: false,
      calculation_type: "Percentage",
      default_value: 12,
      description: "Employee provident fund — 12% of basic",
    },
    {
      name: "Professional Tax",
      code: "PTAX",
      is_deduction: true,
      is_taxable: false,
      is_base_salary: false,
      calculation_type: "Fixed",
      default_value: 200,
      description: "Monthly professional tax deduction",
    },
  ];

  for (const item of salaryStructuresData) {
    await prisma.salaryStructure.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        is_deduction: item.is_deduction,
        is_taxable: item.is_taxable,
        is_base_salary: item.is_base_salary,
        calculation_type: item.calculation_type,
        default_value: item.default_value,
        description: item.description,
      },
      create: {
        name: item.name,
        code: item.code,
        is_deduction: item.is_deduction,
        is_taxable: item.is_taxable,
        is_base_salary: item.is_base_salary,
        calculation_type: item.calculation_type,
        default_value: item.default_value,
        description: item.description,
        status: "Active",
      },
    });
  }
};

/**
 * Seed operational work shifts
 */
const seedWorkShifts = async (): Promise<void> => {
  const workShiftsData = [
    {
      name: "General Day Shift",
      code: "SH-GEN",
      start_time: "09:00 AM",
      end_time: "06:00 PM",
      grace_mins: 15,
      description: "Standard company operational business hours",
    },
    {
      name: "Morning Shift",
      code: "SH-MORN",
      start_time: "07:00 AM",
      end_time: "04:00 PM",
      grace_mins: 15,
      description: "Early morning operations schedule",
    },
    {
      name: "Evening Shift",
      code: "SH-EVE",
      start_time: "02:00 PM",
      end_time: "11:00 PM",
      grace_mins: 15,
      description: "Afternoon to evening coverage schedule",
    },
    {
      name: "Night Shift",
      code: "SH-NGT",
      start_time: "10:00 PM",
      end_time: "07:00 AM",
      grace_mins: 15,
      description: "Overnight night shift coverage",
    },
  ];

  for (const shift of workShiftsData) {
    await prisma.workShift.upsert({
      where: { code: shift.code },
      update: {
        name: shift.name,
        start_time: shift.start_time,
        end_time: shift.end_time,
        grace_mins: shift.grace_mins,
        description: shift.description,
      },
      create: {
        name: shift.name,
        code: shift.code,
        start_time: shift.start_time,
        end_time: shift.end_time,
        grace_mins: shift.grace_mins,
        description: shift.description,
        status: "Active",
      },
    });
  }
};

/**
 * Ensure default administrator user exists if the user directory is empty
 *
 * @param roleId - Primary key identifier of Admin role
 * @param departmentId - Primary key identifier of Engineering department
 */
const ensureDefaultAdminUser = async (roleId: number, departmentId: number): Promise<void> => {
  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0) {
    return;
  }

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

  await prisma.employee.create({
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

  console.log(`Default administrator provisioned: ${adminUser.email}`);
};

/**
 * Main master data seeding execution routine
 */
const main = async (): Promise<void> => {
  console.log("Starting master data seeder...");

  console.log("1/6 Seeding roles and permissions...");
  const roleMap = await seedRolesAndPermissions();

  console.log("2/6 Seeding departments...");
  const deptMap = await seedDepartments();

  console.log("3/6 Seeding designations...");
  await seedDesignations(deptMap);

  console.log("4/6 Seeding leave types...");
  await seedLeaveTypes();

  console.log("5/6 Seeding salary structures...");
  await seedSalaryStructures();

  console.log("6/6 Seeding work shifts...");
  await seedWorkShifts();

  await ensureDefaultAdminUser(roleMap["Admin"], deptMap["Engineering"]);

  console.log("Master data seeding completed successfully!");
};

main()
  .catch((e: unknown) => {
    console.error("Master data seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
