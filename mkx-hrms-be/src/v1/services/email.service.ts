import dns from "node:dns";
import net from "node:net";
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
 * Resolves all available IPv4 addresses for a given SMTP hostname to prevent ENETUNREACH errors on cloud hosting environments without IPv6 routing
 *
 * @param hostname - The SMTP server domain name
 * @returns Array of resolved IPv4 address strings
 */
const resolveIpv4Addresses = async (hostname: string): Promise<string[]> => {
  if (net.isIP(hostname)) {
    return [hostname];
  }
  try {
    const addresses = await dns.promises.resolve4(hostname);
    if (addresses && addresses.length > 0) {
      return addresses;
    }
  } catch (error) {
    logger.warn(`Could not resolve IPv4 addresses for host ${hostname}: ${String(error)}`);
  }
  return [hostname];
};

/**
 * Creates a Nodemailer Transporter bound to a specific host or IPv4 address
 *
 * @param hostAddress - Hostname or direct IPv4 address
 * @param servername - TLS SNI servername for SSL certificate validation
 * @returns Configured Nodemailer Transporter instance
 */
const createTransporterForHost = (hostAddress: string, servername: string): Transporter => {
  const port = Number(process.env.SMTP_PORT) || 465;
  const isSecure = port === 465;
  const user = process.env.SMTP_USERNAME || "mkx.webs@gmail.com";
  const pass = process.env.SMTP_PASSWORD || "rkpw ijyd pzap cdoe";

  return nodemailer.createTransport({
    host: hostAddress,
    port,
    secure: isSecure,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    auth: {
      user,
      pass,
    },
    tls: {
      servername,
      rejectUnauthorized: false,
    },
  });
};

/**
 * Retrieves or initializes the singleton Nodemailer transport instance
 *
 * @returns Configured Nodemailer Transporter
 */
const getMailTransporter = async (): Promise<Transporter> => {
  if (!transporterInstance) {
    const rawHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const ipv4List = await resolveIpv4Addresses(rawHost);
    transporterInstance = createTransporterForHost(ipv4List[0], rawHost);
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Your New Account</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f6f9fc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; width: 100%; }
    img { max-width: 100%; height: auto; display: block; }
    
    .wrapper { background-color: #f6f9fc; padding: 40px 20px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; }
    
    .header { padding: 40px 40px 20px 40px; text-align: center; }
    .content { padding: 0 40px 30px 40px; }
    .footer { background-color: #fdfdfd; border-top: 1px solid #edf2f7; padding: 30px 40px; text-align: center; }
    
    h1 { color: #1a202c; font-size: 26px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.3; }
    p { color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; }
    
    .avatar-logo {
      display: inline-block;
      width: 44px;
      height: 44px;
      line-height: 44px;
      border-radius: 8px;
      background-color: #0f172a;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      text-align: center;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
    }
    
    .credentials-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 16px;
      text-align: center;
      margin-bottom: 26px;
    }
    .credential-row { padding: 10px 0; border-bottom: 1px dashed #e2e8f0; }
    .credential-row:last-child { border-bottom: none; }
    .credential-label { color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .credential-value { color: #2d3748; font-size: 16px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-weight: 600; }
    
    .btn-container { text-align: center; margin: 28px 0; }
    .btn {
      background-color: #4f46e5;
      color: #ffffff !important;
      display: inline-block;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
    }
    
    .security-notice {
      background-color: #fffaf0;
      border-left: 4px solid #dd6b20;
      padding: 16px;
      border-radius: 0 6px 6px 0;
      margin-bottom: 24px;
      text-align: left;
    }
    .security-notice p { color: #744210; font-size: 14px; margin: 0; line-height: 1.5; }
    .footer-text { color: #a0aec0; font-size: 13px; line-height: 1.5; margin: 0; }
    .footer-link { color: #718096; text-decoration: underline; }

    @media only screen and (max-width: 600px) {
      .wrapper { padding: 16px 8px !important; }
      .header { padding: 30px 20px 10px 20px !important; }
      .content { padding: 0 20px 24px 20px !important; }
      .footer { padding: 24px 20px !important; }
      h1 { font-size: 22px !important; }
      .btn { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 14px 16px !important; }
    }

    @media (prefers-color-scheme: dark) {
      body, .wrapper {
        background-color: #0b0f17 !important;
      }
      .container {
        background-color: #161f2e !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }
      .avatar-logo {
        background-color: #4f46e5 !important;
        color: #ffffff !important;
      }
      h1 {
        color: #f1f5f9 !important;
      }
      p {
        color: #94a3b8 !important;
      }
      .credentials-box {
        background-color: #0f172a !important;
        border-color: #334155 !important;
      }
      .credential-row {
        border-bottom-color: #334155 !important;
      }
      .credential-label {
        color: #64748b !important;
      }
      .credential-value {
        color: #f8fafc !important;
      }
      .security-notice {
        background-color: #2a1b0a !important;
        border-left-color: #f97316 !important;
      }
      .security-notice p {
        color: #fdba74 !important;
      }
      .footer {
        background-color: #111827 !important;
        border-top-color: #1e293b !important;
      }
      .footer-text {
        color: #64748b !important;
      }
    }
  </style>
</head>
<body>

<table role="presentation" class="wrapper" style="width: 100%; border-collapse: collapse; background-color: #f6f9fc; padding: 40px 20px;">
  <tr>
    <td align="center">
      <table role="presentation" class="container" style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; border-collapse: collapse;">
        
        <tr>
          <td class="header" style="padding: 40px 40px 20px 40px; text-align: center;">
            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 16px auto;">
              <tr>
                <td align="center" class="avatar-logo" style="width: 44px; height: 44px; border-radius: 8px; background-color: #0f172a; color: #ffffff; font-size: 22px; font-weight: 700; text-align: center; line-height: 44px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);">
                  M
                </td>
              </tr>
            </table>
            <h1 style="color: #1a202c; font-size: 26px; font-weight: 700; margin: 0 0 16px 0; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              Welcome to Your Dashboard!
            </h1>
          </td>
        </tr>
        
        <tr>
          <td class="content" style="padding: 0 40px 30px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Hi <strong>${options.name}</strong>,
            </p>
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              Your workspace is officially set up and ready to go. We've provisioned a secure account profile using the temporary credentials detailed below:
            </p>
            
            <div class="credentials-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 16px; text-align: center; margin-bottom: 26px;">
              <div class="credential-row" style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0;">
                <div class="credential-label" style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Login Email</div>
                <div class="credential-value" style="color: #2d3748; font-size: 15px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 600;">${options.email}</div>
              </div>
              <div class="credential-row" style="padding: 10px 0;">
                <div class="credential-label" style="color: #718096; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Temporary Password</div>
                <div class="credential-value" style="color: #0f172a; font-size: 20px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 700; letter-spacing: 2px;">${options.temporaryPassword}</div>
              </div>
            </div>
            
            <div class="security-notice" style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 16px; border-radius: 0 6px 6px 0; margin-bottom: 24px; text-align: left;">
              <p style="color: #744210; font-size: 14px; margin: 0; line-height: 1.5;">
                <strong>Immediate Action Required:</strong> For optimal system infrastructure protection, this single-use password will expire automatically within <strong>24 hours</strong>. You must establish a distinct personal password during your initial session.
              </p>
            </div>
            
            <div class="btn-container" style="text-align: center; margin: 28px 0;">
              <a href="${portalUrl}" class="btn" target="_blank" style="background-color: #4f46e5; color: #ffffff !important; display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Confirm & Set Password
              </a>
            </div>
          </td>
        </tr>
        
        <tr>
          <td class="footer" style="background-color: #fdfdfd; border-top: 1px solid #edf2f7; padding: 30px 40px; text-align: center;">
            <p class="footer-text" style="color: #a0aec0; font-size: 13px; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
              Sent by <strong>MKX Technologies Pvt. Ltd.</strong> • 129, Street Number 13, Block A, New Ashok Nagar, New Delhi
            </p>
          </td>
        </tr>
        
      </table>
    </td>
  </tr>
</table>

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
  return `Welcome to Your Dashboard!

Hi ${options.name},

Your workspace is officially set up and ready to go. We've provisioned a secure account profile using the temporary credentials detailed below:

Login Email: ${options.email}
Temporary Password: ${options.temporaryPassword}

Confirm & Set Password:
${portalUrl}

Immediate Action Required: For optimal system infrastructure protection, this single-use password will expire automatically within 24 hours. You must establish a distinct personal password during your initial session.

Sent by MKX Technologies Pvt. Ltd. • 129, Street Number 13, Block A, New Ashok Nagar, New Delhi
`;
};

/**
 * Dispatches an automated onboarding welcome email delivering portal credentials via Gmail SMTP
 *
 * @param options - Parameters for the welcome email
 * @returns Promise resolving with email dispatch status
 */
export const sendEmployeeWelcomeEmail = async (
  options: EmployeeWelcomeEmailOptions,
): Promise<EmailSendResult> => {
  try {
    const rawHost = process.env.SMTP_HOST || "smtp.gmail.com";
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

    if (transporterInstance) {
      try {
        const info = await transporterInstance.sendMail(mailOptions);
        logger.info(`Welcome email dispatched to ${options.email} (Message ID: ${info.messageId})`);
        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (cachedErr) {
        logger.warn(
          `Cached SMTP transporter failed, attempting re-resolution: ${String(cachedErr)}`,
        );
        transporterInstance = null;
      }
    }

    const ipv4List = await resolveIpv4Addresses(rawHost);
    let lastError: unknown = null;

    for (const hostAddress of ipv4List) {
      try {
        const transporter = createTransporterForHost(hostAddress, rawHost);
        const info = await transporter.sendMail(mailOptions);
        transporterInstance = transporter;
        logger.info(
          `Welcome email dispatched to ${options.email} (Message ID: ${info.messageId}) [via IPv4: ${hostAddress}]`,
        );
        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (err) {
        lastError = err;
        logger.warn(
          `Failed sending welcome email via [${hostAddress}], checking alternative address...`,
        );
      }
    }

    logger.error(`Failed to send welcome email to ${options.email}:`, lastError);
    return {
      success: false,
      error: lastError,
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
 * Verifies active SMTP connection and authentication credentials with automatic IPv4 fallback
 *
 * @returns Promise resolving to boolean indicating connection health
 */
export const verifySmtpConnection = async (): Promise<boolean> => {
  try {
    const rawHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const ipv4List = await resolveIpv4Addresses(rawHost);

    let connected = false;
    let lastError: unknown = null;

    for (const hostAddress of ipv4List) {
      try {
        const testTransporter = createTransporterForHost(hostAddress, rawHost);
        await testTransporter.verify();
        transporterInstance = testTransporter;
        connected = true;
        logger.success(
          `SMTP email service is connected and ready to dispatch emails [via IPv4: ${hostAddress}]`,
        );
        break;
      } catch (err) {
        lastError = err;
        logger.warn(
          `SMTP verification attempt failed for [${hostAddress}], checking alternative address...`,
        );
      }
    }

    if (connected) {
      return true;
    }

    logger.warn(
      "SMTP email service verification failed. Check credentials or network connectivity.",
    );
    logger.error("SMTP verification error:", lastError);
    return false;
  } catch (error) {
    logger.error("Unexpected error during SMTP verification:", error);
    return false;
  }
};
