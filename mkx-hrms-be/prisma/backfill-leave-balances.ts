import "dotenv/config";
import { prisma } from "../src/libraries/prisma";

/**
 * Backfill script: initialise leave balances for all existing employees
 * that do not yet have a balance record for the current year.
 *
 * Run once with: npx tsx prisma/backfill-leave-balances.ts
 */
async function main(): Promise<void> {
  const currentYear = new Date().getFullYear();

  const [employees, activeLeaveTypes] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.leaveType.findMany({
      where: { status: "Active" },
      select: { id: true, name: true, days_per_year: true },
    }),
  ]);

  console.log(
    `Found ${employees.length} employees and ${activeLeaveTypes.length} active leave types.`,
  );

  let created = 0;
  let skipped = 0;

  for (const emp of employees) {
    const result = await prisma.leaveBalance.createMany({
      data: activeLeaveTypes.map((lt) => ({
        employee_id: emp.id,
        leave_type_id: lt.id,
        year: currentYear,
        allocated: lt.days_per_year,
        used: 0,
        remaining: lt.days_per_year,
      })),
      skipDuplicates: true,
    });

    const empCreated = result.count;
    const empSkipped = activeLeaveTypes.length - empCreated;
    created += empCreated;
    skipped += empSkipped;

    console.log(
      `  [${emp.id}] ${emp.name} — created: ${empCreated}, skipped (already existed): ${empSkipped}`,
    );
  }

  console.log(`\nDone. Total created: ${created}, total skipped: ${skipped}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
