import crypto from "node:crypto";
import { Employee, User, Candidate } from "@prisma/client";
import { prisma } from "../../libraries/prisma";
import { CreateEmployeeInput } from "../../types/employee.types";
import { hashPassword } from "./auth.service";
import { generateTemporaryPassword } from "./email.service";

/**
 * Result returned upon employee creation and user provisioning
 */
export interface ProvisionedEmployeeResult {
  employee: Employee;
  user: User;
  temporaryPassword: string;
  /** One-time set-password token to embed in the welcome email URL */
  setPasswordToken: string;
}

/**
 * Result returned upon candidate onboarding and user provisioning
 */
export interface OnboardCandidateResult {
  employee: Employee;
  user: User;
  candidate: Candidate;
  temporaryPassword: string;
}

/**
 * Standard default notification preferences initialized for new employees and users
 */
export const DEFAULT_NOTIFICATION_PREFERENCES = [
  {
    preference_key: "deal_updates",
    label: "Deal Updates",
    description: "Receive alerts when deal status changes",
    default_email: true,
    default_push: true,
  },
  {
    preference_key: "team_activity",
    label: "Team Activity",
    description: "Daily digests of employee status changes",
    default_email: true,
    default_push: false,
  },
  {
    preference_key: "payroll_alerts",
    label: "Payroll Alerts",
    description: "Notifications for salary disbursements and cycles",
    default_email: true,
    default_push: true,
  },
  {
    preference_key: "leave_requests",
    label: "Leave Requests",
    description: "Time-off approval and status updates",
    default_email: true,
    default_push: true,
  },
];

/**
 * Splits a full name string into first and last name components
 *
 * @param fullName - The full name string (e.g., "Sarah Chen")
 * @returns An object containing first_name and last_name
 */
export const parseNameComponents = (
  fullName: string,
): { first_name: string; last_name: string } => {
  const parts = fullName.trim().split(/\s+/);
  const first_name = parts[0] || "";
  const last_name = parts.slice(1).join(" ") || "";
  return { first_name, last_name };
};

/**
 * Provision an Employee and automatically create the corresponding User
 * with identical credentials, profile attributes, and default notification preferences.
 *
 * @param input - The employee creation input payload
 * @returns An object containing both the created employee and user records with temporary credentials
 */
export const createEmployeeWithUser = async (
  input: CreateEmployeeInput,
): Promise<ProvisionedEmployeeResult> => {
  const { first_name: parsedFirst, last_name: parsedLast } = parseNameComponents(input.name);
  const firstName = input.first_name || parsedFirst;
  const lastName = input.last_name || parsedLast;

  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await hashPassword(temporaryPassword);
  const setPasswordToken = crypto.randomBytes(48).toString("hex");
  const setPasswordExpires = new Date(Date.now() + 48 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        employee_id: input.employee_id,
        first_name: firstName,
        last_name: lastName,
        email: input.email,
        password_hash: hashedPassword,
        avatar: input.avatar ?? null,
        role_id: input.role_id ?? null,
        status: (input.status ?? "Active").toLowerCase(),
        timezone: input.timezone ?? "UTC (GMT+00:00)",
        password_reset_token: setPasswordToken,
        password_reset_expires: setPasswordExpires,
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
      include: {
        notification_preferences: true,
      },
    });

    const employee = await tx.employee.create({
      data: {
        employee_id: input.employee_id,
        name: input.name,
        first_name: firstName,
        last_name: lastName,
        email: input.email,
        role_id: input.role_id ?? null,
        department_id: input.department_id ?? null,
        status: input.status ?? "Active",
        manager_id: input.manager_id ?? null,
        join_date: new Date(input.join_date),
        avatar: input.avatar ?? null,
        user_id: user.id,
      },
    });

    return { employee, user, temporaryPassword, setPasswordToken };
  });
};

/**
 * Onboards a candidate into the workforce directory by creating their Employee & User records
 * and transitioning the Candidate record to Hired/Onboarded status.
 *
 * @param candidateId - The database ID of the candidate being onboarded
 * @param additionalInfo - Additional workforce provisioning details (employee_id, manager, join_date, role, etc.)
 * @returns An object containing the onboarded employee, user records with temporary credentials, and updated candidate
 */
export const onboardCandidateToEmployee = async (
  candidateId: number,
  additionalInfo?: {
    employee_id?: string;
    manager_name?: string;
    manager_id?: number;
    role_id?: number;
    department_id?: number;
    join_date?: Date | string;
    department?: string;
    role?: string;
  },
): Promise<OnboardCandidateResult> => {
  return prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new Error(`Candidate with id ${candidateId} not found`);
    }

    if (candidate.employee_id) {
      throw new Error(`Candidate ${candidate.name} is already onboarded as an employee`);
    }

    const totalEmployees = await tx.employee.count();
    const generatedEmployeeId =
      additionalInfo?.employee_id ||
      `EMP-${String(totalEmployees + 1).padStart(3, "0")}`;

    const { first_name: parsedFirst, last_name: parsedLast } = parseNameComponents(candidate.name);

    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    let deptId = additionalInfo?.department_id ?? null;
    if (!deptId && (additionalInfo?.department || candidate.department)) {
      const dbDept = await tx.department.findFirst({
        where: { name: additionalInfo?.department || candidate.department },
      });
      if (dbDept) deptId = dbDept.id;
    }

    let roleId = additionalInfo?.role_id ?? null;
    if (!roleId && (additionalInfo?.role || candidate.position)) {
      const dbRole = await tx.role.findFirst({
        where: { name: additionalInfo?.role || candidate.position },
      });
      if (dbRole) roleId = dbRole.id;
    }

    let mgrId = additionalInfo?.manager_id ?? null;
    if (!mgrId && additionalInfo?.manager_name) {
      const dbMgr = await tx.employee.findFirst({
        where: { name: additionalInfo.manager_name },
      });
      if (dbMgr) mgrId = dbMgr.id;
    }

    const user = await tx.user.create({
      data: {
        employee_id: generatedEmployeeId,
        first_name: parsedFirst,
        last_name: parsedLast,
        email: candidate.email,
        password_hash: hashedPassword,
        avatar: candidate.avatar,
        status: "active",
        role_id: roleId,
        timezone: "UTC (GMT+00:00)",
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
      include: {
        notification_preferences: true,
      },
    });

    const employee = await tx.employee.create({
      data: {
        employee_id: generatedEmployeeId,
        name: candidate.name,
        first_name: parsedFirst,
        last_name: parsedLast,
        email: candidate.email,
        role_id: roleId,
        department_id: deptId,
        status: "Active",
        manager_id: mgrId,
        join_date: additionalInfo?.join_date ? new Date(additionalInfo.join_date) : new Date(),
        avatar: candidate.avatar,
        user_id: user.id,
      },
    });

    const updatedCandidate = await tx.candidate.update({
      where: { id: candidateId },
      data: {
        stage: "Hired",
        status: "Onboarded",
        onboarded_at: new Date(),
        employee_id: employee.id,
      },
    });

    return {
      employee,
      user,
      candidate: updatedCandidate,
      temporaryPassword,
    };
  });
};

