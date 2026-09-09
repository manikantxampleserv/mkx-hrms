import "dotenv/config";
import { prisma } from "../src/libraries/prisma";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../src/v1/services/employee.service";

/**
 * Seed roles and system permissions
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
 */
const seedDepartments = async (): Promise<Record<string, number>> => {
  const departmentsData = [
    { name: "Engineering", description: "Software development and engineering operations" },
    { name: "Product", description: "Product strategy, roadmaps, and lifecycle" },
    { name: "Design", description: "Product UI/UX design and creative brand systems" },
    { name: "Infrastructure", description: "Cloud infrastructure, DevOps, and reliability" },
    { name: "Leadership", description: "Executive leadership and strategic direction" },
    { name: "People Ops", description: "Human resources, workplace, and talent ops" },
    { name: "Marketing", description: "Growth, brand marketing, and content strategy" },
    { name: "Sales", description: "Revenue operations, partnerships, and accounts" },
  ];

  const deptMap: Record<string, number> = {};

  for (const dept of departmentsData) {
    const record = await prisma.department.upsert({
      where: { name: dept.name },
      update: { description: dept.description },
      create: dept,
    });
    deptMap[dept.name] = record.id;
  }

  return deptMap;
};

/**
 * Seed workforce employees and corresponding users with default preferences
 */
const seedEmployeesAndUsers = async (
  roleMap: Record<string, number>,
  deptMap: Record<string, number>,
): Promise<Record<string, number>> => {
  const employeesData = [
    {
      employee_id: "EMP-001",
      name: "Sarah Chen",
      first_name: "Sarah",
      last_name: "Chen",
      email: "sarah.c@mkx.com",
      role: "Senior Developer",
      roleName: "Employee",
      department: "Engineering",
      status: "Active" as const,
      manager_name: "David Lee",
      join_date: new Date("2024-01-15"),
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
    {
      employee_id: "EMP-002",
      name: "Mike Johnson",
      first_name: "Mike",
      last_name: "Johnson",
      email: "mike.j@mkx.com",
      role: "Product Manager",
      roleName: "Manager",
      department: "Product",
      status: "Active" as const,
      manager_name: "Sarah Chen",
      join_date: new Date("2024-01-22"),
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    {
      employee_id: "EMP-003",
      name: "Emily Davis",
      first_name: "Emily",
      last_name: "Davis",
      email: "emily.d@mkx.com",
      role: "UX Designer",
      roleName: "Employee",
      department: "Design",
      status: "Active" as const,
      manager_name: "Mike Johnson",
      join_date: new Date("2024-02-01"),
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    },
    {
      employee_id: "EMP-004",
      name: "James Wilson",
      first_name: "James",
      last_name: "Wilson",
      email: "james.w@mkx.com",
      role: "QA Engineer",
      roleName: "Employee",
      department: "Engineering",
      status: "Inactive" as const,
      manager_name: "Sarah Chen",
      join_date: new Date("2024-01-10"),
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
    {
      employee_id: "EMP-005",
      name: "Michael Chen",
      first_name: "Michael",
      last_name: "Chen",
      email: "m.chen@mkx.com",
      role: "DevOps Lead",
      roleName: "Manager",
      department: "Infrastructure",
      status: "Active" as const,
      manager_name: "David Lee",
      join_date: new Date("2024-01-18"),
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    },
    {
      employee_id: "EMP-006",
      name: "Jennifer Park",
      first_name: "Jennifer",
      last_name: "Park",
      email: "jpark@mkx.com",
      role: "Frontend Engineer",
      roleName: "Employee",
      department: "Engineering",
      status: "Active" as const,
      manager_name: "Sarah Chen",
      join_date: new Date("2024-01-28"),
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    },
    {
      employee_id: "EMP-007",
      name: "David Lee",
      first_name: "David",
      last_name: "Lee",
      email: "david@mkx.com",
      role: "VP of Engineering",
      roleName: "Admin",
      department: "Leadership",
      status: "Active" as const,
      manager_name: "Board of Directors",
      join_date: new Date("2024-02-05"),
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    },
    {
      employee_id: "EMP-008",
      name: "Lisa Park",
      first_name: "Lisa",
      last_name: "Park",
      email: "lisa.p@mkx.com",
      role: "HR Specialist",
      roleName: "HR Specialist",
      department: "People Ops",
      status: "Active" as const,
      manager_name: "David Lee",
      join_date: new Date("2024-02-10"),
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    },
  ];

  const employeeMap: Record<string, number> = {};

  for (const emp of employeesData) {
    const roleId = roleMap[emp.roleName] ?? null;
    const departmentId = deptMap[emp.department] ?? null;

    const user = await prisma.user.upsert({
      where: { employee_id: emp.employee_id },
      update: {
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        avatar: emp.avatar,
        status: emp.status.toLowerCase(),
        role_id: roleId,
      },
      create: {
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        avatar: emp.avatar,
        status: emp.status.toLowerCase(),
        timezone: "UTC (GMT+00:00)",
        role_id: roleId,
        password_hash: "$2a$10$e8w6a2180K6Kmsd.RdfgEOi3zF68x.6p5tq5dK20uDquB.PZqU6O6",
        notification_preferences: {
          create: DEFAULT_NOTIFICATION_PREFERENCES.map((pref) => ({
            preference_key: pref.preference_key,
            label: pref.label,
            description: pref.description,
            default_email: pref.default_email,
            default_push: pref.default_push,
          })),
        },
      },
    });

    const employeeRecord = await prisma.employee.upsert({
      where: { employee_id: emp.employee_id },
      update: {
        name: emp.name,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        role: emp.role,
        role_id: roleId,
        department: emp.department,
        department_id: departmentId,
        status: emp.status,
        manager_name: emp.manager_name,
        join_date: emp.join_date,
        avatar: emp.avatar,
        user_id: user.id,
      },
      create: {
        employee_id: emp.employee_id,
        name: emp.name,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        role: emp.role,
        role_id: roleId,
        department: emp.department,
        department_id: departmentId,
        status: emp.status,
        manager_name: emp.manager_name,
        join_date: emp.join_date,
        avatar: emp.avatar,
        user_id: user.id,
      },
    });

    employeeMap[emp.employee_id] = employeeRecord.id;
  }

  if (employeeMap["EMP-007"]) {
    if (employeeMap["EMP-001"]) {
      await prisma.employee.update({
        where: { id: employeeMap["EMP-001"] },
        data: { manager_id: employeeMap["EMP-007"] },
      });
    }
    if (employeeMap["EMP-005"]) {
      await prisma.employee.update({
        where: { id: employeeMap["EMP-005"] },
        data: { manager_id: employeeMap["EMP-007"] },
      });
    }
    if (employeeMap["EMP-008"]) {
      await prisma.employee.update({
        where: { id: employeeMap["EMP-008"] },
        data: { manager_id: employeeMap["EMP-007"] },
      });
    }
  }

  if (employeeMap["EMP-001"]) {
    if (employeeMap["EMP-002"]) {
      await prisma.employee.update({
        where: { id: employeeMap["EMP-002"] },
        data: { manager_id: employeeMap["EMP-001"] },
      });
    }
    if (employeeMap["EMP-004"]) {
      await prisma.employee.update({
        where: { id: employeeMap["EMP-004"] },
        data: { manager_id: employeeMap["EMP-001"] },
      });
    }
    if (employeeMap["EMP-006"]) {
      await prisma.employee.update({
        where: { id: employeeMap["EMP-006"] },
        data: { manager_id: employeeMap["EMP-001"] },
      });
    }
  }

  if (employeeMap["EMP-002"] && employeeMap["EMP-003"]) {
    await prisma.employee.update({
      where: { id: employeeMap["EMP-003"] },
      data: { manager_id: employeeMap["EMP-002"] },
    });
  }

  return employeeMap;
};

/**
 * Seed daily attendance records
 */
const seedAttendance = async (employeeMap: Record<string, number>): Promise<void> => {
  const attendanceData = [
    {
      record_id: "ATT-001",
      emp_id: "EMP-001",
      check_in: "08:52 AM",
      check_out: "05:30 PM",
      work_hours: "8h 38m",
      status: "Present",
      location: "HQ - San Francisco",
    },
    {
      record_id: "ATT-002",
      emp_id: "EMP-002",
      check_in: "09:35 AM",
      check_out: "In Progress",
      work_hours: "6h 15m",
      status: "Late",
      location: "HQ - San Francisco",
    },
    {
      record_id: "ATT-003",
      emp_id: "EMP-003",
      check_in: "09:00 AM",
      check_out: "05:15 PM",
      work_hours: "8h 15m",
      status: "Remote",
      location: "Remote - New York",
    },
    {
      record_id: "ATT-004",
      emp_id: "EMP-004",
      check_in: "--:--",
      check_out: "--:--",
      work_hours: "0h 00m",
      status: "Absent",
      location: "Unaccounted",
    },
    {
      record_id: "ATT-005",
      emp_id: "EMP-005",
      check_in: "08:45 AM",
      check_out: "05:00 PM",
      work_hours: "8h 15m",
      status: "Present",
      location: "HQ - San Francisco",
    },
    {
      record_id: "ATT-006",
      emp_id: "EMP-006",
      check_in: "09:05 AM",
      check_out: "In Progress",
      work_hours: "6h 45m",
      status: "Remote",
      location: "Remote - Seattle",
    },
    {
      record_id: "ATT-007",
      emp_id: "EMP-007",
      check_in: "08:30 AM",
      check_out: "06:00 PM",
      work_hours: "9h 30m",
      status: "Present",
      location: "HQ - San Francisco",
    },
    {
      record_id: "ATT-008",
      emp_id: "EMP-008",
      check_in: "09:20 AM",
      check_out: "In Progress",
      work_hours: "6h 30m",
      status: "Late",
      location: "HQ - San Francisco",
    },
  ];

  for (const item of attendanceData) {
    const employeeId = employeeMap[item.emp_id];
    if (employeeId) {
      await prisma.attendance.upsert({
        where: { record_id: item.record_id },
        update: {
          check_in: item.check_in,
          check_out: item.check_out,
          work_hours: item.work_hours,
          status: item.status,
          location: item.location,
        },
        create: {
          record_id: item.record_id,
          employee_id: employeeId,
          check_in: item.check_in,
          check_out: item.check_out,
          work_hours: item.work_hours,
          status: item.status,
          location: item.location,
        },
      });
    }
  }
};

/**
 * Seed leave requests
 */
const seedLeaves = async (employeeMap: Record<string, number>): Promise<void> => {
  const leavesData = [
    {
      leave_code: "LEV-001",
      emp_id: "EMP-001",
      leave_type: "Annual PTO",
      start_date: new Date("2024-09-12"),
      end_date: new Date("2024-09-16"),
      days_count: 5,
      reason: "Annual family holiday trip",
      status: "Approved",
      applied_on: new Date("2024-08-29"),
    },
    {
      leave_code: "LEV-002",
      emp_id: "EMP-002",
      leave_type: "Sick Leave",
      start_date: new Date("2024-09-03"),
      end_date: new Date("2024-09-05"),
      days_count: 3,
      reason: "Flu and medical recovery",
      status: "Approved",
      applied_on: new Date("2024-09-02"),
    },
    {
      leave_code: "LEV-003",
      emp_id: "EMP-003",
      leave_type: "Casual Leave",
      start_date: new Date("2024-09-15"),
      end_date: new Date("2024-09-16"),
      days_count: 2,
      reason: "Personal family commitment",
      status: "Pending",
      applied_on: new Date("2024-09-01"),
    },
    {
      leave_code: "LEV-004",
      emp_id: "EMP-004",
      leave_type: "Annual PTO",
      start_date: new Date("2024-10-01"),
      end_date: new Date("2024-10-10"),
      days_count: 8,
      reason: "Relocation and personal move",
      status: "Rejected",
      applied_on: new Date("2024-08-25"),
    },
    {
      leave_code: "LEV-005",
      emp_id: "EMP-005",
      leave_type: "Annual PTO",
      start_date: new Date("2024-09-20"),
      end_date: new Date("2024-09-24"),
      days_count: 4,
      reason: "Attending technical conference",
      status: "Pending",
      applied_on: new Date("2024-09-02"),
    },
    {
      leave_code: "LEV-006",
      emp_id: "EMP-006",
      leave_type: "Parental Leave",
      start_date: new Date("2024-10-15"),
      end_date: new Date("2024-11-15"),
      days_count: 22,
      reason: "Maternity leave cycle",
      status: "Approved",
      applied_on: new Date("2024-08-15"),
    },
    {
      leave_code: "LEV-007",
      emp_id: "EMP-007",
      leave_type: "Casual Leave",
      start_date: new Date("2024-09-08"),
      end_date: new Date("2024-09-09"),
      days_count: 2,
      reason: "Executive board offsite",
      status: "Approved",
      applied_on: new Date("2024-08-30"),
    },
    {
      leave_code: "LEV-008",
      emp_id: "EMP-008",
      leave_type: "Sick Leave",
      start_date: new Date("2024-09-04"),
      end_date: new Date("2024-09-05"),
      days_count: 2,
      reason: "Dental procedure & recovery",
      status: "Pending",
      applied_on: new Date("2024-09-03"),
    },
  ];

  for (const item of leavesData) {
    const employeeId = employeeMap[item.emp_id];
    if (employeeId) {
      await prisma.leave.upsert({
        where: { leave_code: item.leave_code },
        update: {
          leave_type: item.leave_type,
          start_date: item.start_date,
          end_date: item.end_date,
          days_count: item.days_count,
          reason: item.reason,
          status: item.status,
          applied_on: item.applied_on,
        },
        create: {
          leave_code: item.leave_code,
          employee_id: employeeId,
          leave_type: item.leave_type,
          start_date: item.start_date,
          end_date: item.end_date,
          days_count: item.days_count,
          reason: item.reason,
          status: item.status,
          applied_on: item.applied_on,
        },
      });
    }
  }
};

/**
 * Seed monthly payroll disbursements
 */
const seedPayroll = async (employeeMap: Record<string, number>): Promise<void> => {
  const payrollData = [
    {
      payroll_code: "PAY-001",
      emp_id: "EMP-001",
      base_salary: 9500,
      allowance: 850,
      net_pay: 8420,
      status: "Processed",
      pay_date: new Date("2024-08-31"),
    },
    {
      payroll_code: "PAY-002",
      emp_id: "EMP-002",
      base_salary: 8800,
      allowance: 600,
      net_pay: 7820,
      status: "Processed",
      pay_date: new Date("2024-08-31"),
    },
    {
      payroll_code: "PAY-003",
      emp_id: "EMP-003",
      base_salary: 7900,
      allowance: 500,
      net_pay: 7120,
      status: "Pending",
      pay_date: new Date("2024-09-15"),
    },
    {
      payroll_code: "PAY-004",
      emp_id: "EMP-004",
      base_salary: 6500,
      allowance: 0,
      net_pay: 5850,
      status: "On Hold",
      pay_date: new Date("2024-08-31"),
    },
    {
      payroll_code: "PAY-005",
      emp_id: "EMP-005",
      base_salary: 9200,
      allowance: 750,
      net_pay: 8180,
      status: "Processed",
      pay_date: new Date("2024-08-31"),
    },
    {
      payroll_code: "PAY-006",
      emp_id: "EMP-006",
      base_salary: 7400,
      allowance: 400,
      net_pay: 6680,
      status: "Pending",
      pay_date: new Date("2024-09-15"),
    },
    {
      payroll_code: "PAY-007",
      emp_id: "EMP-007",
      base_salary: 14500,
      allowance: 1200,
      net_pay: 12450,
      status: "Processed",
      pay_date: new Date("2024-08-31"),
    },
    {
      payroll_code: "PAY-008",
      emp_id: "EMP-008",
      base_salary: 6200,
      allowance: 350,
      net_pay: 5610,
      status: "Processed",
      pay_date: new Date("2024-08-31"),
    },
  ];

  for (const item of payrollData) {
    const employeeId = employeeMap[item.emp_id];
    if (employeeId) {
      await prisma.payroll.upsert({
        where: { payroll_code: item.payroll_code },
        update: {
          base_salary: item.base_salary,
          allowance: item.allowance,
          net_pay: item.net_pay,
          status: item.status,
          pay_date: item.pay_date,
        },
        create: {
          payroll_code: item.payroll_code,
          employee_id: employeeId,
          base_salary: item.base_salary,
          allowance: item.allowance,
          net_pay: item.net_pay,
          status: item.status,
          pay_date: item.pay_date,
        },
      });
    }
  }
};

/**
 * Seed recruitment pipeline candidates
 */
const seedCandidates = async (): Promise<void> => {
  const candidatesData = [
    {
      candidate_code: "CAN-101",
      name: "Alex Rivera",
      email: "alex.r@example.com",
      position: "Senior React Developer",
      department: "Engineering",
      stage: "Interviewing",
      experience: "6 yrs",
      rating: 4.9,
      status: "Active",
      applied_date: new Date("2024-08-26"),
    },
    {
      candidate_code: "CAN-102",
      name: "Sophia Martinez",
      email: "sophia.m@example.com",
      position: "Lead Product Designer",
      department: "Design",
      stage: "Offered",
      experience: "7 yrs",
      rating: 4.8,
      status: "Offered",
      applied_date: new Date("2024-08-19"),
    },
    {
      candidate_code: "CAN-103",
      name: "Daniel Kim",
      email: "daniel.k@example.com",
      position: "DevOps Engineer",
      department: "Infrastructure",
      stage: "Interviewing",
      experience: "4 yrs",
      rating: 4.6,
      status: "In Review",
      applied_date: new Date("2024-08-29"),
    },
    {
      candidate_code: "CAN-104",
      name: "Rachel Green",
      email: "rachel.g@example.com",
      position: "QA Automation Lead",
      department: "Engineering",
      stage: "Screening",
      experience: "5 yrs",
      rating: 4.5,
      status: "Active",
      applied_date: new Date("2024-09-01"),
    },
    {
      candidate_code: "CAN-105",
      name: "Marcus Vance",
      email: "marcus.v@example.com",
      position: "Technical Recruiter",
      department: "People Ops",
      stage: "Hired",
      experience: "3 yrs",
      rating: 4.9,
      status: "Active",
      applied_date: new Date("2024-08-10"),
    },
    {
      candidate_code: "CAN-106",
      name: "Elena Rostova",
      email: "elena.r@example.com",
      position: "Engineering Manager",
      department: "Engineering",
      stage: "Interviewing",
      experience: "9 yrs",
      rating: 4.7,
      status: "In Review",
      applied_date: new Date("2024-08-22"),
    },
    {
      candidate_code: "CAN-107",
      name: "Liam O'Connor",
      email: "liam.o@example.com",
      position: "Solutions Architect",
      department: "Engineering",
      stage: "Offered",
      experience: "8 yrs",
      rating: 5.0,
      status: "Offered",
      applied_date: new Date("2024-08-15"),
    },
    {
      candidate_code: "CAN-108",
      name: "Chloe Zhao",
      email: "chloe.z@example.com",
      position: "Product Marketing Manager",
      department: "Marketing",
      stage: "Screening",
      experience: "4 yrs",
      rating: 4.3,
      status: "Rejected",
      applied_date: new Date("2024-08-28"),
    },
  ];

  for (const item of candidatesData) {
    await prisma.candidate.upsert({
      where: { candidate_code: item.candidate_code },
      update: {
        name: item.name,
        email: item.email,
        position: item.position,
        department: item.department,
        stage: item.stage,
        experience: item.experience,
        rating: item.rating,
        status: item.status,
        applied_date: item.applied_date,
      },
      create: item,
    });
  }
};

/**
 * Seed historical HR and executive reports
 */
const seedReports = async (): Promise<void> => {
  const reportsData = [
    {
      report_code: "rep-1",
      title: "Monthly Payroll & Compensation Summary",
      category: "Payroll",
      date: new Date("2024-01-20"),
      status: "download",
    },
    {
      report_code: "rep-2",
      title: "Q4 Employee Performance & KPI Review",
      category: "Performance",
      date: new Date("2024-01-18"),
      status: "download",
    },
    {
      report_code: "rep-3",
      title: "Workforce Headcount & Attrition Forecast",
      category: "Workforce",
      date: new Date("2024-01-15"),
      status: "download",
    },
    {
      report_code: "rep-4",
      title: "Quarterly Attendance & Leave Audit",
      category: "Attendance",
      date: new Date("2024-01-12"),
      status: "generating",
    },
    {
      report_code: "rep-5",
      title: "Talent Acquisition & Sourcing Analysis",
      category: "Recruitment",
      date: new Date("2024-01-10"),
      status: "download",
    },
  ];

  for (const item of reportsData) {
    await prisma.report.upsert({
      where: { report_code: item.report_code },
      update: {
        title: item.title,
        category: item.category,
        date: item.date,
        status: item.status,
      },
      create: item,
    });
  }
};

/**
 * Seed enterprise system integrations
 */
const seedIntegrations = async (): Promise<void> => {
  const integrationsData = [
    {
      key: "salesforce",
      name: "Salesforce CRM",
      description: "Sync employee deal attribution and performance targets",
      short_code: "SF",
      connected: true,
      last_sync: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      key: "google-workspace",
      name: "Google Workspace",
      description: "Synchronize company directory, calendar, and single sign-on",
      short_code: "GW",
      connected: true,
      last_sync: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      key: "slack",
      name: "Slack Enterprise",
      description: "Push instant notifications, leave requests, and milestone alerts",
      short_code: "SL",
      connected: false,
      last_sync: null,
    },
    {
      key: "github",
      name: "GitHub Enterprise",
      description: "Track engineer productivity, repo access, and code metrics",
      short_code: "GH",
      connected: false,
      last_sync: null,
    },
  ];

  for (const item of integrationsData) {
    await prisma.integration.upsert({
      where: { key: item.key },
      update: {
        name: item.name,
        description: item.description,
        short_code: item.short_code,
        connected: item.connected,
        last_sync: item.last_sync,
      },
      create: item,
    });
  }
};

/**
 * Seed dashboard recent activities
 */
const seedActivityLogs = async (employeeMap: Record<string, number>): Promise<void> => {
  const activitiesData = [
    {
      emp_id: "EMP-001",
      initials: "S",
      name: "Sarah Chen (Leave Req)",
      subtext: "Engineering • 2 hours ago",
      status_label: "Approved",
      status_type: "success",
      bg_alpha: "rgba(69, 186, 80, 0.1)",
    },
    {
      emp_id: "EMP-002",
      initials: "M",
      name: "Mike Johnson (New Hire)",
      subtext: "Sales • 5 hours ago",
      status_label: "Onboarding",
      status_type: "warning",
      bg_alpha: "rgba(255, 139, 37, 0.1)",
    },
    {
      emp_id: "EMP-003",
      initials: "E",
      name: "Emily Davis (Expense)",
      subtext: "Marketing • 1 day ago",
      status_label: "Pending",
      status_type: "warning",
      bg_alpha: "rgba(255, 139, 37, 0.1)",
    },
    {
      emp_id: "EMP-004",
      initials: "J",
      name: "James Wilson (Leave Req)",
      subtext: "HR & Ops • 2 days ago",
      status_label: "Rejected",
      status_type: "error",
      bg_alpha: "rgba(241, 77, 76, 0.1)",
    },
  ];

  for (const item of activitiesData) {
    const employeeId = employeeMap[item.emp_id] ?? null;
    await prisma.activityLog.create({
      data: {
        employee_id: employeeId,
        initials: item.initials,
        name: item.name,
        subtext: item.subtext,
        status_label: item.status_label,
        status_type: item.status_type,
        bg_alpha: item.bg_alpha,
      },
    });
  }
};

/**
 * Seed initial sample blog articles
 */
const seedBlogPosts = async (): Promise<void> => {
  const existingCount = await prisma.blogPost.count();
  if (existingCount > 0) return;

  const blogs = [
    {
      title: "Welcome to MKX HRMS 2.0: Modern Workforce Automation",
      slug: "welcome-to-mkx-hrms-2-0",
      category: "Company News",
      status: "Published",
      author_name: "Sarah Connor",
      cover_image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800",
      excerpt:
        "Announcing the official rollout of MKX HRMS 2.0 with dynamic workforce analytics, streamlined attendance tracking, and enhanced communication feeds.",
      content:
        "<h2>Next-Generation People Operations</h2><p>We are thrilled to launch MKX HRMS 2.0 to empower our teams across all departments. Built with modern technology, sleek dark-mode interfaces, and real-time synchronization, this platform marks a major milestone in our company journey.</p><h3>Key Capabilities</h3><ul><li><strong>Dynamic Workforce Analytics:</strong> Monitor headcount, retention trends, and team distributions in real-time.</li><li><strong>Seamless Time & Leave Management:</strong> Submit leave requests, log hours, and track approvals with ease.</li><li><strong>Integrated Recruitment Pipeline:</strong> Sourcing, reviewing, and onboarding talent collaboratively.</li></ul><blockquote>Our goal is to make every employee's daily workflow frictionless and transparent.</blockquote><p>Explore the features, customize your settings, and reach out to the HR Operations team for any questions.</p>",
      published_at: new Date("2026-08-15"),
    },
    {
      title: "Engineering Culture: Scaling Our Distributed Architecture",
      slug: "engineering-culture-scaling-distributed-architecture",
      category: "Engineering",
      status: "Published",
      author_name: "David Lee",
      cover_image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800",
      excerpt:
        "Insights from our engineering leads on how we maintain high availability, clean domain architecture, and continuous delivery across cross-functional squads.",
      content:
        "<h2>Building for Scale and Reliability</h2><p>Over the past year, our engineering team has doubled in size while maintaining sub-second API latencies and zero unplanned downtime. Here are the core pillars that guide our engineering practices:</p><h3>1. Strict Type Safety</h3><p>We mandate comprehensive TypeScript types across all services and client interfaces, eliminating entire categories of runtime bugs.</p><h3>2. Domain-Driven Modular Services</h3><p>Separation of concerns between payroll, workforce directory, and telemetry services ensures clean boundaries and independent deployments.</p><h3>3. Automated CI/CD</h3><p>Every pull request undergoes automated linting, typechecking, and regression testing before merging to main.</p>",
      published_at: new Date("2026-08-28"),
    },
    {
      title: "Updated Annual Leave Policy and Floating Holidays Guide 2026",
      slug: "updated-annual-leave-policy-2026",
      category: "HR Policy",
      status: "Published",
      author_name: "Elena Rostova",
      cover_image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800",
      excerpt:
        "Detailed overview of the 2026 vacation policy revisions, wellness days, remote working allowances, and rollover guidelines.",
      content:
        "<h2>Work-Life Harmony at MKX</h2><p>We believe that rest and rejuvenation are essential for sustained creativity and focus. This guide outlines the updated 2026 guidelines for all full-time and remote team members.</p><h3>Vacation Entitlement</h3><p>Full-time team members receive 24 days of paid annual leave, in addition to statutory national holidays and 3 floating cultural observance days.</p><h3>Rollover Rules</h3><p>Up to 5 unused leave days can be carried forward into Q1 of the following calendar year.</p><blockquote>Please submit leave requests at least 5 business days in advance to facilitate squad planning.</blockquote>",
      published_at: new Date("2026-09-01"),
    },
    {
      title: "Q4 Company Hackathon & Innovation Showcase",
      slug: "q4-company-hackathon-innovation-showcase",
      category: "Culture & Events",
      status: "Draft",
      author_name: "Marcus Vance",
      cover_image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800",
      excerpt:
        "Get ready for the annual 48-hour innovation hackathon where cross-disciplinary teams build AI-driven prototypes and compete for company prizes.",
      content:
        "<h2>Innovate, Collaborate, Build</h2><p>The annual MKX Hackathon returns this November! Whether you are an engineer, designer, product manager, or HR specialist, this is your opportunity to form multidisciplinary squads and prototype groundbreaking solutions.</p><h3>Hackathon Themes</h3><ul><li>AI-Assisted Workplace Automation</li><li>Eco-Conscious Operations</li><li>Customer Delight & Experience</li></ul><p>Stay tuned for registration details and squad formation guidelines coming next week!</p>",
      published_at: null,
    },
  ];

  for (const post of blogs) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }
};

/**
 * Main seeding execution routine
 */
const main = async (): Promise<void> => {
  console.log("🌱 Starting HRMS database seeder...");

  console.log("1/7 Seeding roles and permissions...");
  const roleMap = await seedRolesAndPermissions();

  console.log("2/7 Seeding departments...");
  const deptMap = await seedDepartments();

  console.log("3/7 Seeding workforce employees, users & notification preferences...");
  const employeeMap = await seedEmployeesAndUsers(roleMap, deptMap);

  console.log("4/7 Seeding daily attendance logs...");
  await seedAttendance(employeeMap);

  console.log("5/7 Seeding employee leave requests...");
  await seedLeaves(employeeMap);

  console.log("6/7 Seeding monthly payroll disbursements...");
  await seedPayroll(employeeMap);

  console.log("7/7 Seeding candidates, reports, integrations & dashboard activity logs...");
  await seedCandidates();
  await seedReports();
  await seedIntegrations();
  await seedActivityLogs(employeeMap);

  console.log("8/8 Seeding sample blog articles...");
  await seedBlogPosts();

  console.log("✅ HRMS database seeding completed successfully!");
};

main()
  .catch((e: unknown) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
