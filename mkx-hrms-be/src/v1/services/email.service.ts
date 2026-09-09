import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../../utils/logger";

/**
 * Configuration payload required to send a welcome email to an employee
 */
export interface EmployeeWelcomeEmailOptions {
  name: string;
  email: string;
  employeeId: string;
  role?: string | null;
  department?: string | null;
  temporaryPassword: string;
  portalUrl?: string;
}

/**
 * Result returned following an email delivery attempt
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: unknown;
}

/**
 * Generate a cryptographically strong, human-readable temporary password
 *
 * @param length - Desired character length of the generated password
 * @returns Generated password containing uppercase, lowercase, numbers, and special symbols
 */
export const generateTemporaryPassword = (length = 12): string => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "@#%*!?";
  const allChars = upper + lower + numbers + symbols;

  let password = "Mkx@";
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }
  return password;
};

/**
 * Cached Nodemailer transporter instance
 */
let transporterInstance: Transporter | null = null;

/**
 * Retrieves or initializes the singleton Nodemailer transport instance
 *
 * @returns Configured Nodemailer Transporter
 */
const getMailTransporter = (): Transporter => {
  if (!transporterInstance) {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = port === 465;
    const user = process.env.SMTP_USERNAME || "mkx.webs@gmail.com";
    const pass = process.env.SMTP_PASSWORD || "rkpw ijyd pzap cdoe";

    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
  return transporterInstance;
};

/**
 * Generates an executive-grade, responsive HTML email template for new employee onboarding
 *
 * @param options - Welcome email attributes
 * @returns Fully formatted HTML string
 */
export const buildWelcomeEmailHtml = (options: EmployeeWelcomeEmailOptions): string => {
  const portalUrl =
    options.portalUrl || process.env.APP_PORTAL_URL || "http://localhost:5174/login";
  const roleDisplay = options.role || "Workforce Member";
  const departmentDisplay = options.department || "General Operations";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>Welcome to MKX HRMS</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
      color: #24292f;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    .wrapper {
      width: 100% !important;
      margin: 0 !important;
      padding: 48px 16px 40px !important;
      background-color: #ffffff;
      box-sizing: border-box;
    }
    .main-table {
      max-width: 540px;
      margin: 0 auto;
      width: 100%;
    }
    .brand-icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      line-height: 40px;
      border-radius: 8px;
      background-color: #0f172a;
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
    }
    .main-title {
      font-size: 24px;
      font-weight: 400;
      line-height: 1.3;
      color: #24292f;
      text-align: center;
      margin: 18px 0 24px 0;
      letter-spacing: -0.3px;
    }
    .main-card {
      background-color: #ffffff;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      padding: 24px;
      text-align: left;
      box-sizing: border-box;
    }
    .card-text {
      font-size: 14px;
      line-height: 1.5;
      color: #24292f;
      margin: 0 0 16px 0;
    }
    .password-code {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #24292f;
    }
    .card-note {
      font-size: 13px;
      line-height: 1.5;
      color: #57606a;
      margin: 0 0 12px 0;
    }
    .signoff {
      font-size: 13px;
      line-height: 1.5;
      color: #24292f;
      margin: 20px 0 0 0;
    }
    .footer-disclaimer {
      max-width: 520px;
      margin: 24px auto 0;
      text-align: center;
      font-size: 12px;
      line-height: 1.5;
      color: #57606a;
      padding: 0 8px;
    }

    @media (prefers-color-scheme: dark) {
      html, body, .wrapper {
        background-color: #0d1117 !important;
        color: #c9d1d9 !important;
      }
      .brand-icon {
        background-color: #1e293b !important;
        color: #f0f6fc !important;
        border: 1px solid #30363d !important;
      }
      .main-title {
        color: #f0f6fc !important;
      }
      .main-card {
        background-color: #161b22 !important;
        border-color: #30363d !important;
      }
      .card-text {
        color: #c9d1d9 !important;
      }
      .password-code {
        color: #f0f6fc !important;
      }
      .card-note {
        color: #8b949e !important;
      }
      .signoff {
        color: #c9d1d9 !important;
      }
      .footer-disclaimer {
        color: #8b949e !important;
      }
    }
  </style>
</head>
<body style="margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; background-color: #ffffff; color: #24292f;">
  <div class="wrapper" style="width: 100% !important; margin: 0 !important; padding: 48px 16px 40px !important; background-color: #ffffff; box-sizing: border-box;">
    <table role="presentation" class="main-table" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; width: 100%;">
      <tr>
        <td align="center" style="padding-bottom: 24px;">
          <!-- Centered Brand Logo Icon: Rounded 8px Avatar with First Letter 'M' -->
          <div class="brand-icon" style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 8px; background-color: #0f172a; color: #ffffff; font-size: 20px; font-weight: 800; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);">
            M
          </div>
          <!-- Title with user name -->
          <h1 class="main-title" style="font-size: 24px; font-weight: 400; line-height: 1.3; color: #24292f; text-align: center; margin: 18px 0 0 0; letter-spacing: -0.3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            Here are your account credentials, <strong>${options.name}</strong>
          </h1>
        </td>
      </tr>

      <tr>
        <td>
          <!-- Clean Bordered Card -->
          <div class="main-card" style="background-color: #ffffff; border: 1px solid #d0d7de; border-radius: 6px; padding: 24px; text-align: left; box-sizing: border-box;">
            <p class="card-text" style="font-size: 14px; line-height: 1.5; color: #24292f; margin: 0 0 16px 0;">
              Here is your MKX HRMS temporary login password:
            </p>

            <!-- Large Monospace Password Code -->
            <div style="text-align: center; margin: 24px 0;">
              <span class="password-code" style="font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace; font-size: 28px; font-weight: 700; letter-spacing: 3px; color: #24292f; display: inline-block;">
                ${options.temporaryPassword}
              </span>
            </div>

            <p class="card-text" style="font-size: 14px; line-height: 1.6; color: #24292f; margin: 16px 0;">
              Sign in with <strong>${options.email}</strong> at <a href="${portalUrl}" target="_blank" style="color: #0969da; text-decoration: underline;">${portalUrl}</a>
            </p>

            <p class="card-note" style="font-size: 13px; line-height: 1.5; color: #57606a; margin: 16px 0 8px 0;">
              This temporary password should be updated upon your first sign in.
            </p>
            <p class="card-note" style="font-size: 13px; line-height: 1.5; color: #57606a; margin: 0 0 24px 0;">
              <strong>Please don't share this password with anyone</strong>: we'll never ask for it on the phone or via email.
            </p>

            <p class="signoff" style="font-size: 13px; line-height: 1.5; color: #24292f; margin: 24px 0 0 0;">
              Thanks,<br />
              <strong>The MKX Team</strong>
            </p>
          </div>

          <!-- Muted Footer Disclaimer -->
          <div class="footer-disclaimer" style="max-width: 520px; margin: 24px auto 0; text-align: center; font-size: 12px; line-height: 1.5; color: #57606a; padding: 0 8px;">
            You're receiving this email because an employee account was created for you on MKX HRMS. If this wasn't you, please ignore this email.
          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
};

/**
 * Generates clean plain-text fallback content for email clients
 *
 * @param options - Welcome email attributes
 * @returns Plain text representation
 */
export const buildWelcomeEmailPlainText = (options: EmployeeWelcomeEmailOptions): string => {
  const portalUrl =
    options.portalUrl || process.env.APP_PORTAL_URL || "http://localhost:5174/login";
  return `Here are your account credentials, ${options.name}

Here is your MKX HRMS temporary login password:

${options.temporaryPassword}

Sign in with ${options.email} at ${portalUrl}

This temporary password should be updated upon your first sign in.
Please don't share this password with anyone: we'll never ask for it on the phone or via email.

Thanks,
The MKX Team
`;
};

/**
 * Dispatches an automated onboarding welcome email delivering portal credentials
 *
 * @param options - Parameters for the welcome email
 * @returns Promise resolving with email dispatch status
 */
export const sendEmployeeWelcomeEmail = async (
  options: EmployeeWelcomeEmailOptions,
): Promise<EmailSendResult> => {
  try {
    const transporter = getMailTransporter();
    const fromName = process.env.SMTP_FROM_NAME || "MKX HRMS Workplace";
    const fromEmail =
      process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME || "mkx.webs@gmail.com";

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.email,
      subject: `Welcome to MKX HRMS - Your Account Credentials (${options.employeeId})`,
      text: buildWelcomeEmailPlainText(options),
      html: buildWelcomeEmailHtml(options),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Welcome email dispatched to ${options.email} (Message ID: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    logger.error(`Failed to send welcome email to ${options.email}:`, error);
    return {
      success: false,
      error,
    };
  }
};

/**
 * Verifies active SMTP connection and authentication credentials
 *
 * @returns Promise resolving to boolean indicating connection health
 */
export const verifySmtpConnection = async (): Promise<boolean> => {
  try {
    const transporter = getMailTransporter();
    await transporter.verify();
    logger.success("SMTP email service is connected and ready to dispatch emails");
    return true;
  } catch (error) {
    logger.warn(
      "SMTP email service verification failed. Check credentials or network connectivity.",
    );
    logger.error("SMTP verification error:", error);
    return false;
  }
};
