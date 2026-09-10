import {
  DarkMode,
  LightMode,
  Lock,
  Mail,
  Visibility,
  VisibilityOff,
  Shield,
  CheckCircle,
  TrendingUp,
} from "@mui/icons-material";
import {
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  InputAdornment,
  InputBase,
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "contexts/AuthContext";
import { useTheme } from "context/ThemeContext/useTheme";
import { StaggerContainer, FadeUpItem } from "shared/animations";

/**
 * Demo credential role definition
 */
interface DemoCredential {
  label: string;
  role: string;
  email: string;
  color: string;
}

const DEMO_ACCOUNTS: DemoCredential[] = [
  {
    label: "Admin",
    role: "System Administrator",
    email: "admin@mkx.monster",
    color: "bg-[#ad87ed]/10 text-[#ad87ed] border-[#ad87ed]/30 hover:bg-[#ad87ed]/20",
  },
];

/**
 * Enterprise Login Page component providing secure authentication with JWT
 *
 * @returns Rendered Login page
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/dashboard";

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back! Authentication successful.");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid email or password";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Auto-fill demo account credentials
   */
  const handleSelectDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("admin@123");
    toast.success(`Demo credentials loaded for ${demoEmail}`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambient Glow Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00b1d8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Controls: Theme Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <IconButton
          onClick={toggleTheme}
          size="small"
          className="!bg-secondary !border !border-border !text-foreground !rounded-[5px] hover:!bg-accent transition-colors"
        >
          {theme === "dark" ? (
            <LightMode className="!w-4 !h-4 text-[#ff8b25]" />
          ) : (
            <DarkMode className="!w-4 !h-4 text-muted-foreground" />
          )}
        </IconButton>
      </div>

      <StaggerContainer className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Column: Brand & Value Highlights */}
        <FadeUpItem className="lg:col-span-5 hidden lg:flex flex-col justify-between h-full py-8 pr-4">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[5px] bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg text-foreground tracking-tight">
                  HRMs Automations
                </span>
                <span className="block text-[10px] uppercase font-mono text-muted-foreground tracking-widest">
                  Enterprise Suite
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-foreground tracking-tight leading-tight mb-4">
              Modern People Operations & Workforce Intelligence
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Integrated human resource platform streamlining attendance tracking, multi-tier
              payroll disbursements, talent recruitment pipelines, and performance audits.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-[5px] bg-card border border-border">
                <CheckCircle className="!w-5 !h-5 !text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Role-Based Access Control
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Granular permissions across Executive Leadership, Managers, and Staff.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-[5px] bg-card border border-border">
                <TrendingUp className="!w-5 !h-5 !text-[#00b1d8] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Real-Time Data Sync</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Instant recalculations for daily punctuality, leaves, and bonus metrics.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} MKX Technologies Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </FadeUpItem>

        {/* Right Column: Modern Glassmorphic Login Card */}
        <FadeUpItem className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Mobile Brand Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-[5px] bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">HRMs Automations</span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground tracking-tight">Sign In</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your authorized credentials to access your workspace
              </p>
            </div>

            {/* Quick Demo Credentials Bar */}
            <div className="mb-6 p-3 rounded-[5px] bg-secondary/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                  Quick Demo Accounts
                </span>
                <span className="text-[10px] text-muted-foreground">Click to fill</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {DEMO_ACCOUNTS.map((demo) => (
                  <button
                    key={demo.label}
                    type="button"
                    onClick={() => handleSelectDemo(demo.email)}
                    className={`px-3 py-2 rounded-[5px] border text-xs font-medium text-center transition-all ${demo.color}`}
                  >
                    <span className="block font-semibold">{demo.label}</span>
                    <span className="block text-[10px] opacity-80 truncate">{demo.role} ({demo.email})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <InputBase
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start" className="!ml-3">
                        <Mail className="!w-4 !h-4 text-muted-foreground" />
                      </InputAdornment>
                    }
                    className="w-full h-10 px-3 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all focus-within:!border-primary"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-foreground">Password</label>
                  <button
                    type="button"
                    onClick={() =>
                      toast("Please contact your IT administrator to reset credentials.", {
                        icon: "🔒",
                      })
                    }
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <InputBase
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
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
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    size="small"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="!p-0 !text-muted-foreground [&.Mui-checked]:!text-primary"
                  />
                  <span className="text-xs text-muted-foreground">Keep me signed in</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                className="!w-full !h-10 !rounded-[5px] !bg-primary hover:!bg-primary/90 !text-primary-foreground !font-semibold !text-sm !shadow-md !shadow-primary/20 transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <CircularProgress size={18} className="!text-primary-foreground" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border text-center">
              <span className="text-[11px] text-muted-foreground">
                Secured by 256-bit SSL & Enterprise JWT Token Architecture
              </span>
            </div>
          </div>
        </FadeUpItem>
      </StaggerContainer>
    </div>
  );
}
