import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "mkx-hrms-secret-jwt-key-2026";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as string;

/**
 * Payload carried by generated authentication JSON Web Tokens
 */
export interface AuthTokenPayload {
  id: number;
  email: string;
  role?: string;
  employee_db_id?: number;
  employee_code?: string;
}

/**
 * Hash plain text password using bcrypt salt
 *
 * @param password - Plain text password to hash
 * @returns Cryptographically hashed password string
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain text password against stored bcrypt hash
 *
 * @param password - Plain text password input
 * @param hash - Hashed password stored in database
 * @returns Boolean indicating whether passwords match
 */
export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a signed JWT authentication token
 *
 * @param payload - User identity payload to sign into token
 * @returns Signed JWT string
 */
export const generateToken = (payload: AuthTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as unknown as number,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verify and decode an incoming JWT token
 *
 * @param token - Bearer token string to verify
 * @returns Decoded token payload or null if invalid or expired
 */
export const verifyToken = (token: string): (JwtPayload & AuthTokenPayload) | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload & AuthTokenPayload;
  } catch {
    return null;
  }
};
