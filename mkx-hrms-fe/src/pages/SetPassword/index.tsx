import {
  CheckCircle,
  DarkMode,
  ErrorOutlined,
  LightMode,
  Lock,
  Shield,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { Button, CircularProgress, IconButton, InputAdornment, InputBase } from "@mui/material";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useTheme } from "context/ThemeContext/useTheme";

type PageState = "loading" | "valid" | "invalid" | "success";

/**
 * Standalone mobile-responsive page for new employees to set their password
 * via a one-time token link delivered in the welcome email.
 *
 * @returns Rendered SetPassword page
 */
export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [firstName, setFirstName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get("token") ?? "";

  const verifyToken = useCallback(async () => {
    if (!token) {
      setErrorMessage("No token found in this link. Please use the link from your welcome email.");
      setPageState("invalid");
      return;
    }
    try {
      const res = await axios.get(`/api/v1/auth/set-password?token=${token}`);
      setFirstName(res.data?.data?.firstName ?? "");
      setPageState("valid");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "This link is invalid or has expired.";
      setErrorMessage(msg);
      setPageState("invalid");
    }
  }, [token]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  /**
   * Submit the new password to the backend using the one-time token
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/api/v1/auth/set-password", { token, password, confirmPassword });
      toast.success("Password set successfully. Please sign in.");
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to set password. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00b1d8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5">
        <IconButton
          onClick={toggleTheme}
          size="small"
          className="!bg-secondary !border !border-border !text-foreground !rounded-[5px] hover:!bg-accent"
        >
          {theme === "dark" ? (
            <LightMode className="!w-4 !h-4 text-[#ff8b25]" />
          ) : (
            <DarkMode className="!w-4 !h-4 text-muted-foreground" />
          )}
        </IconButton>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm sm:max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 sm:p-8 shadow-2xl z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-[5px] bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-sm text-foreground tracking-tight">
              HRMs Automations
            </span>
            <span className="block text-[10px] uppercase font-mono text-muted-foreground tracking-widest">
              Enterprise Suite
            </span>
          </div>
        </div>

        {pageState === "loading" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <CircularProgress size={36} className="!text-primary" />
            <p className="text-sm text-muted-foreground">Verifying your invitation link...</p>
          </div>
        )}

        {pageState === "invalid" && (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <ErrorOutlined className="!w-7 !h-7 !text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Link Expired or Invalid</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Please contact your HR administrator to resend the invitation.
            </p>
          </div>
        )}

        {pageState === "success" && (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="!w-7 !h-7 !text-success" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Password Set!</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your password has been saved successfully. You can now sign in to your workspace.
              </p>
            </div>
            <Button
              variant="contained"
              onClick={() => navigate("/login")}
              className="!mt-2 !rounded-[5px] !bg-primary hover:!bg-primary/90 !text-primary-foreground !font-semibold !text-sm !px-6 !py-2 !normal-case !shadow-md !shadow-primary/20"
            >
              Go to Sign In
            </Button>
          </div>
        )}

        {pageState === "valid" && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {firstName ? `Welcome, ${firstName}` : "Set Your Password"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Create a secure password to access your workspace. You can change it anytime from
                Settings.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  New Password
                </label>
                <InputBase
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Minimum 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start" className="!ml-3">
                      <Lock className="!w-4 !h-4 text-muted-foreground" />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end" className="!mr-2">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        className="!text-muted-foreground hover:!text-foreground"
                      >
                        {showPassword ? (
                          <VisibilityOff className="!w-4 !h-4" />
                        ) : (
                          <Visibility className="!w-4 !h-4" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                  className="w-full h-10 px-3 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all focus-within:!border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Confirm Password
                </label>
                <InputBase
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start" className="!ml-3">
                      <Lock className="!w-4 !h-4 text-muted-foreground" />
                    </InputAdornment>
                  }
                  endAdornment={
                    <InputAdornment position="end" className="!mr-2">
                      <IconButton
                        size="small"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="!text-muted-foreground hover:!text-foreground"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff className="!w-4 !h-4" />
                        ) : (
                          <Visibility className="!w-4 !h-4" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  }
                  className="w-full h-10 px-3 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all focus-within:!border-primary"
                />
                {confirmPassword.length > 0 && (
                  <p
                    className={`text-[11px] mt-1 ${password === confirmPassword ? "text-success" : "text-destructive"}`}
                  >
                    {password === confirmPassword
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                className="!w-full !h-10 !rounded-[5px] !bg-primary hover:!bg-primary/90 !text-primary-foreground !font-semibold !text-sm !shadow-md !shadow-primary/20 !normal-case transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <CircularProgress size={16} className="!text-primary-foreground" />
                    <span>Setting Password...</span>
                  </div>
                ) : (
                  "Set Password & Sign In"
                )}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-border text-center">
              <span className="text-[11px] text-muted-foreground">
                Secured by 256-bit SSL &amp; Enterprise JWT Token Architecture
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
