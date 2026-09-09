import cron from "node-cron";
import { prisma } from "../../libraries/prisma";
import { logger } from "../../utils/logger";

/**
 * Result structure returned by daily attendance initialization
 */
export interface DailyAttendanceInitResult {
  createdCount: number;
  totalActive: number;
  date: string;
}

/**
 * Generates default attendance records for all active employees for the current day.
 * If an employee is on approved leave, sets their status to 'On Leave', otherwise sets to 'Absent'.
 *
 * @param targetDateStr - Optional target calendar date (YYYY-MM-DD), defaults to today in Asia/Kolkata
 * @returns Result object with created count, total active employees, and target date
 */
export const generateDailyAttendance = async (
  targetDateStr?: string,
): Promise<DailyAttendanceInitResult> => {
  logger.info("Starting daily attendance generation job...");
  try {
    const dateString =
      targetDateStr || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    const todayDate = new Date(`${dateString}T00:00:00.000Z`);

    const activeEmployees = await prisma.employee.findMany({
      where: {
        status: "Active",
      },
    });

    const activeLeaves = await prisma.leave.findMany({
      where: {
        status: "Approved",
        start_date: { lte: todayDate },
        end_date: { gte: todayDate },
      },
    });

    const employeesOnLeave = new Set(activeLeaves.map((l) => l.employee_id));

    let createdCount = 0;

    for (const emp of activeEmployees) {
      const recordId = `ATT-${emp.id}-${dateString}`;

      const exists = await prisma.attendance.findUnique({
        where: { record_id: recordId },
      });

      if (!exists) {
        await prisma.attendance.create({
          data: {
            record_id: recordId,
            employee_id: emp.id,
            date: todayDate,
            status: employeesOnLeave.has(emp.id) ? "On Leave" : "Absent",
            location: "Office",
            check_in: null,
            check_out: null,
            work_hours: null,
          },
        });
        createdCount++;
      }
    }

    logger.info(`Daily attendance generation completed. Created ${createdCount} new records.`);
    return {
      createdCount,
      totalActive: activeEmployees.length,
      date: dateString,
    };
  } catch (error) {
    logger.error("Failed to generate daily attendance:", error);
    throw error;
  }
};

/**
 * Initializes and schedules all background cron jobs.
 */
export const initCronJobs = () => {
  logger.info("Initializing background cron jobs...");

  cron.schedule("0 0 * * *", () => {
    generateDailyAttendance();
  });
};
