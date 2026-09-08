import cron from "node-cron";
import { prisma } from "../../libraries/prisma";
import { logger } from "../../utils/logger";

/**
 * Generates default attendance records for all active employees for the current day.
 * If an employee is on approved leave, sets their status to 'On Leave', otherwise sets to 'Absent'.
 */
export const generateDailyAttendance = async () => {
  logger.info("Starting daily attendance generation job...");
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get all active employees
    const activeEmployees = await prisma.employee.findMany({
      where: { status: "Active" },
    });

    // 2. Get all approved leaves overlapping with today
    const activeLeaves = await prisma.leave.findMany({
      where: {
        status: "Approved",
        start_date: { lte: today },
        end_date: { gte: today },
      },
    });

    const employeesOnLeave = new Set(activeLeaves.map((l) => l.employee_id));

    // 3. Prepare and insert default attendance records
    let createdCount = 0;
    const dateString = today.toISOString().split("T")[0]; // YYYY-MM-DD

    for (const emp of activeEmployees) {
      const recordId = `ATT-${emp.id}-${dateString}`;
      
      // Check if it already exists (to prevent duplicates if the script runs multiple times)
      const exists = await prisma.attendance.findUnique({
        where: { record_id: recordId },
      });
      
      if (!exists) {
        await prisma.attendance.create({
          data: {
            record_id: recordId,
            employee_id: emp.id,
            date: today,
            status: employeesOnLeave.has(emp.id) ? "On Leave" : "Absent",
            location: "Office", // Default location
            check_in: null,
            check_out: null,
            work_hours: null,
          }
        });
        createdCount++;
      }
    }

    logger.info(`Daily attendance generation completed. Created ${createdCount} new records.`);
  } catch (error) {
    logger.error("Failed to generate daily attendance:", error);
  }
};

/**
 * Initializes and schedules all background cron jobs.
 */
export const initCronJobs = () => {
  logger.info("Initializing background cron jobs...");
  
  // Schedule to run every day at 00:00 (Midnight)
  cron.schedule("0 0 * * *", () => {
    generateDailyAttendance();
  });
};
