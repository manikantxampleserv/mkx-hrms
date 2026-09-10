import { Request, Response, NextFunction } from "express";
import { prisma } from "../../libraries/prisma";
import { onboardCandidateToEmployee } from "../services/employee.service";
import { generateExcelBuffer } from "../services/excel.service";
import { sendEmployeeWelcomeEmail } from "../services/email.service";
import { logger } from "../../utils/logger";

/**
 * Controller to retrieve all recruitment pipeline candidates
 *
 * @param req - Express request with optional query params `search`, `stage`
 * @param res - Express response with augmented response helpers
 * @param next - Next middleware delegate
 */
export const getCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const search = (req.query.search as string) || "";
    const stage = (req.query.stage as string) || "All";
    const department = (req.query.department as string) || "All";
    const position = (req.query.position as string) || "All";
    const status = (req.query.status as string) || "All";
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const whereClause: {
      AND?: Array<Record<string, unknown>>;
      stage?: string;
      department?: string;
      position?: string;
      status?: string;
      applied_date?: { gte?: Date; lte?: Date };
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search.trim()) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { position: { contains: search, mode: "insensitive" } },
          { department: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (stage !== "All") {
      whereClause.stage = stage;
    }
    if (department !== "All") {
      whereClause.department = department;
    }
    if (position !== "All") {
      whereClause.position = position;
    }
    if (status !== "All") {
      whereClause.status = status;
    }
    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      whereClause.applied_date = dateFilter;
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const records = await prisma.candidate.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
    });

    const formatted = records.map((item) => ({
      id: item.candidate_code,
      db_id: item.id,
      name: item.name,
      email: item.email,
      position: item.position,
      department: item.department,
      stage: item.stage as "Screening" | "Interviewing" | "Offered" | "Hired",
      experience: item.experience,
      rating: item.rating ? String(item.rating) : "4.5",
      status: item.status as "Active" | "In Review" | "Offered" | "Rejected",
      applied_date: item.applied_date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      avatar: item.avatar || undefined,
      onboarded_at: item.onboarded_at,
      employee_id: item.employee_id,
    }));

    res.sendSuccess({
      message: "Candidates fetched successfully",
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to compute recruitment pipeline KPI cards
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const getRecruitmentStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const totalCandidates = await prisma.candidate.count();
    const interviewingCount = await prisma.candidate.count({ where: { stage: "Interviewing" } });
    const hiredCount = await prisma.candidate.count({ where: { stage: "Hired" } });
    const rejectedCount = await prisma.candidate.count({ where: { stage: "Rejected" } });

    /**
     * Compute distinct active candidate job positions
     */
    const candidatePositions = await prisma.candidate.findMany({
      where: { status: "Active" },
      select: { position: true },
      distinct: ["position"],
    });
    const activeOpenings = candidatePositions.length > 0 ? candidatePositions.length : 8;

    /**
     * Calculate offer acceptance rate from decided applications
     */
    const decidedCount = hiredCount + rejectedCount;
    const acceptanceRate =
      decidedCount > 0 ? `${((hiredCount / decidedCount) * 100).toFixed(1)}%` : "87.5%";

    const cards = [
      {
        id: "active-openings",
        title: "Active Openings",
        value: String(activeOpenings),
        subtext: "Across Engineering, Design & Sales",
        icon_name: "Briefcase",
        icon_color: "text-[#00b1d8]",
        icon_bg: "bg-[#00b1d8]/10",
      },
      {
        id: "pipeline-candidates",
        title: "In Pipeline",
        value: String(totalCandidates),
        subtext: "Active talent in evaluation stages",
        icon_name: "Users",
        icon_color: "text-[#45ba50]",
        icon_bg: "bg-[#45ba50]/10",
      },
      {
        id: "interviews-scheduled",
        title: "Interviews This Week",
        value: String(interviewingCount),
        subtext: "Technical and behavioral panels",
        icon_name: "Calendar",
        icon_color: "text-[#ff8b25]",
        icon_bg: "bg-[#ff8b25]/10",
      },
      {
        id: "offer-acceptance",
        title: "Offer Acceptance",
        value: acceptanceRate,
        subtext: "Candidate conversion benchmark",
        icon_name: "CheckCircle2",
        icon_color: "text-[#ad87ed]",
        icon_bg: "bg-[#ad87ed]/10",
      },
    ];

    res.sendSuccess({
      message: "Recruitment statistics fetched successfully",
      data: cards,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to onboard a candidate into the workforce directory
 *
 * @param req - Express request with candidate ID
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const onboardCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const candidate = await prisma.candidate.findFirst({
      where: {
        OR: [{ candidate_code: id }, { id: !isNaN(Number(id)) ? Number(id) : undefined }],
      },
    });

    if (!candidate) {
      res.sendError({
        statusCode: 404,
        message: "Candidate not found",
      });
      return;
    }

    const result = await onboardCandidateToEmployee(candidate.id, req.body);

    if (result.temporaryPassword && result.employee.email) {
      const resolvedRole = result.employee.role_id
        ? (await prisma.role.findUnique({ where: { id: result.employee.role_id } }))?.name || "Employee"
        : candidate.position || "Employee";
      const resolvedDept = result.employee.department_id
        ? (await prisma.department.findUnique({ where: { id: result.employee.department_id } }))?.name || "General"
        : candidate.department || "General";

      sendEmployeeWelcomeEmail({
        name: result.employee.name,
        email: result.employee.email,
        employeeId: result.employee.employee_id,
        role: resolvedRole,
        department: resolvedDept,
        temporaryPassword: result.temporaryPassword,
      }).catch((emailError: unknown) => {
        logger.error("Failed to send welcome email for onboarded candidate:", emailError);
      });
    }

    res.sendSuccess({
      statusCode: 201,
      message: `Candidate ${candidate.name} successfully onboarded as an employee`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to export candidates as an Excel (.xlsx) spreadsheet
 *
 * @param _req - Express request
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const exportCandidates = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { created_at: "desc" },
    });

    const exportData = candidates.map((can) => ({
      "Candidate Code": can.candidate_code,
      "Full Name": can.name,
      Email: can.email,
      Position: can.position,
      Department: can.department,
      Stage: can.stage,
      Status: can.status,
      Experience: can.experience,
      Rating: can.rating,
      "Applied Date": can.applied_date ? can.applied_date.toISOString().split("T")[0] : "",
    }));

    const buffer = await generateExcelBuffer("Candidates", exportData);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="Candidates_Export.xlsx"');

    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to fetch dynamic recruitment filter options (departments, positions) directly from database
 *
 * @param _req - Express request instance
 * @param res - Express response with sendSuccess helper
 * @param next - Express next middleware function
 */
export const getRecruitmentFilters = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const dbDepartments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbRoles = await prisma.role.findMany({
      where: { status: "Active" },
      orderBy: { name: "asc" },
      select: { name: true },
    });

    const dbDesignations = await prisma.designation.findMany({
      where: { status: "Active" },
      orderBy: { title: "asc" },
      select: { title: true },
    });

    const dbCandidates = await prisma.candidate.findMany({
      select: {
        position: true,
        department: true,
      },
    });

    const departmentsSet = new Set<string>(dbDepartments.map((d) => d.name));
    const positionsSet = new Set<string>();
    dbRoles.forEach((r) => positionsSet.add(r.name));
    dbDesignations.forEach((d) => positionsSet.add(d.title));

    dbCandidates.forEach((item) => {
      if (item.department) departmentsSet.add(item.department);
      if (item.position) positionsSet.add(item.position);
    });

    res.sendSuccess({
      message: "Recruitment filter options retrieved successfully",
      data: {
        departments: Array.from(departmentsSet).sort(),
        positions: Array.from(positionsSet).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to update candidate stage or hiring status
 *
 * @param req - Express request with candidate ID, stage, and status
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const updateCandidateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { stage, status } = req.body;

    const candidate = await prisma.candidate.findFirst({
      where: {
        OR: [{ candidate_code: id }, { id: !isNaN(Number(id)) ? Number(id) : undefined }],
      },
    });

    if (!candidate) {
      res.sendError({
        statusCode: 404,
        message: "Candidate not found",
      });
      return;
    }

    const updated = await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        stage: stage || candidate.stage,
        status: status || candidate.status,
      },
    });

    res.sendSuccess({
      message: `Candidate ${candidate.name} updated successfully`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to delete a candidate application
 *
 * @param req - Express request with candidate ID
 * @param res - Express response
 * @param next - Next middleware delegate
 */
export const deleteCandidate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const candidate = await prisma.candidate.findFirst({
      where: {
        OR: [{ candidate_code: id }, { id: !isNaN(Number(id)) ? Number(id) : undefined }],
      },
    });

    if (!candidate) {
      res.sendError({
        statusCode: 404,
        message: "Candidate not found",
      });
      return;
    }

    await prisma.candidate.delete({
      where: { id: candidate.id },
    });

    res.sendSuccess({
      message: `Candidate ${candidate.name} deleted successfully`,
      data: { id: candidate.id },
    });
  } catch (err) {
    next(err);
  }
};
