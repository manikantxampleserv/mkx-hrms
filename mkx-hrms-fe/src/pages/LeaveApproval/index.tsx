import {
  CheckCircle,
  DarkMode,
  ErrorOutlined,
  EventNote,
  LightMode,
  Shield,
} from "@mui/icons-material";
import { Button, CircularProgress, IconButton } from "@mui/material";
import axios from "axios";
import { useTheme } from "context/ThemeContext/useTheme";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

type PageState = "loading" | "valid" | "invalid" | "success";

interface LeaveDetails {
  id: string;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
}

/**
 * Standalone mobile-responsive page for managers to approve or reject a leave
 * via a one-time token link delivered in an email.
 */
export default function LeaveApproval() {
  const { token } = useParams<{ token: string }>();
  const { theme, setTheme } = useTheme();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [leaveDetails, setLeaveDetails] = useState<LeaveDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successAction, setSuccessAction] = useState<"Approved" | "Rejected" | "">("");

  const verifyToken = useCallback(async () => {
    if (!token) {
      setErrorMessage("No token found in this link. Please use the exact link from your email.");
      setPageState("invalid");
      return;
    }
    try {
      const res = await axios.get(`/api/v1/leaves/approval/${token}`);
      setLeaveDetails(res.data?.data ?? null);
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
   * Submit the approval or rejection
   */
  const handleAction = async (status: "Approved" | "Rejected") => {
    setIsSubmitting(true);
    try {
      await axios.post(`/api/v1/leaves/approval/${token}`, { status });
      toast.success(`Leave ${status.toLowerCase()} successfully.`);
      setSuccessAction(status);
      setPageState("success");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        `Failed to ${status.toLowerCase()} leave. Please try again.`;
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
              Manager Tools
            </span>
          </div>
        </div>

        {pageState === "loading" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <CircularProgress size={36} className="!text-primary" />
            <p className="text-sm text-muted-foreground">Loading request details...</p>
          </div>
        )}

        {pageState === "invalid" && (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <ErrorOutlined className="!w-7 !h-7 !text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Action Unavailable</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{errorMessage}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              You may close this window or return to your dashboard.
            </p>
          </div>
        )}

        {pageState === "success" && (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="!w-7 !h-7 !text-success" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Request {successAction}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The leave request has been successfully {successAction.toLowerCase()}. The employee
                will be notified.
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">You may safely close this window.</p>
          </div>
        )}

        {pageState === "valid" && leaveDetails && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                Review Leave Request
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Please review the details below and approve or reject the request.
              </p>
            </div>

            <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <EventNote className="!w-5 !h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Employee
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {leaveDetails.employee_name}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="!w-5 !h-5" />
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Leave Type
                  </div>
                  <div className="text-sm text-foreground">{leaveDetails.leave_type}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="!w-5 !h-5" />
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Duration
                  </div>
                  <div className="text-sm text-foreground">
                    {leaveDetails.start_date} to {leaveDetails.end_date} ({leaveDetails.days_count}{" "}
                    days)
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="!w-5 !h-5" />
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Reason
                  </div>
                  <div className="text-sm text-foreground">{leaveDetails.reason}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outlined"
                fullWidth
                disabled={isSubmitting}
                onClick={() => handleAction("Rejected")}
                className="!border-destructive !text-destructive hover:!bg-destructive/10 !normal-case !font-semibold !rounded-[5px]"
              >
                Reject Request
              </Button>
              <Button
                variant="contained"
                fullWidth
                disabled={isSubmitting}
                onClick={() => handleAction("Approved")}
                className="!bg-primary hover:!bg-primary/90 !text-primary-foreground !normal-case !font-semibold !rounded-[5px] !shadow-md !shadow-primary/20"
              >
                Approve Request
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
