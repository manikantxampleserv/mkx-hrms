/**
 * ANSI Escape Codes for CLI styling
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

const getTime = () => {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
    .format(new Date())
    .toLowerCase();
};

/**
 * Shared Backend Logger Utility
 */
export const logger = {
  info: (message: string) => {
    console.log(
      `${colors.dim}${getTime()}${colors.reset} ${colors.cyan}[INFO] ${colors.reset}${message}`,
    );
  },

  success: (message: string) => {
    console.log(
      `${colors.dim}${getTime()}${colors.reset} ${colors.green}[SUCCESS] ${colors.reset}${message}`,
    );
  },

  warn: (message: string) => {
    console.warn(
      `${colors.dim}${getTime()}${colors.reset} ${colors.yellow}[WARN] ${colors.reset}${message}`,
    );
  },

  error: (message: string, error?: unknown) => {
    console.error(
      `${colors.dim}${getTime()}${colors.reset} ${colors.red}[ERROR] ${message}${colors.reset}`,
    );
    if (error) {
      console.error(error);
    }
  },

  server: (port: number | string) => {
    console.log(
      `${colors.dim}${getTime()} ${colors.reset}${colors.bright}${colors.cyan}[Server]${colors.reset}${colors.blue} Server is listening on port ${port}${colors.reset}`,
    );
  },

  shutdown: () => {
    console.log(
      `${colors.dim}${getTime()}${colors.reset} ${colors.red}[SHUTDOWN] Shutting down gracefully...${colors.reset}`,
    );
  },
};
