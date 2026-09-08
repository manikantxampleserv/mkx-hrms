import "dotenv/config";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./libraries/prisma";
import { logger } from "./utils/logger";
import { responseMiddleware } from "./middlewares/response.middleware";
import { activityTrackingMiddleware } from "./middlewares/activity.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import v1Routes from "./v1/routes";

const app: Express = express();
const PORT = process.env.PORT || 3000;

/**
 * Standard global middlewares
 */
app.use(express.json({ limit: "50mb" }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

/**
 * Standard API response decorator middleware
 */
app.use(responseMiddleware);

/**
 * Automated mutation and entity diff tracking middleware
 */
app.use(activityTrackingMiddleware);

/**
 * Root and health check endpoints (handles Render platform health check pings)
 */
app.all("/", (_req: Request, res: Response) => {
  res.sendSuccess({
    message: "MKX HRMS Backend API is live",
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.sendSuccess({
    message: "Service is healthy",
    data: { status: "ok" },
  });
});

/**
 * V1 API Routes (accessible via /api/v1 and /v1)
 */
app.use("/api/v1", v1Routes);
app.use("/v1", v1Routes);

/**
 * 404 Unhandled routes fallback handler
 */
app.use(notFoundHandler);

/**
 * Global centralized error handling middleware
 */
app.use(errorHandler);

import { initCronJobs } from "./v1/services/cron.service";

/**
 * Initialize background jobs
 */
initCronJobs();

/**
 * Graceful shutdown procedure
 */
const gracefulShutdown = async () => {
  logger.shutdown();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

app.listen(PORT, () => {
  logger.server(PORT);
});
