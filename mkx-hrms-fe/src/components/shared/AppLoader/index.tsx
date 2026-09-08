import { useEffect, useState } from "react";
import { Users } from "lucide-react";

/**
 * Configuration properties for AppLoader component
 */
interface AppLoaderProps {
  /** Optional custom brand title */
  brandTitle?: string;
  /** Optional initial progress override */
  initialProgress?: number;
}

/**
 * Fullscreen application loader matching the branded ghost-skeleton design
 * with animated pulsing dots, smooth progress bar, and frosted backdrop.
 * Displayed while verifying JWT session via the `/v1/auth/me` endpoint.
 *
 * @param props - Configuration properties
 * @returns Rendered AppLoader overlay
 */
export function AppLoader({
  brandTitle = "HRMs Automations",
  initialProgress = 15,
}: AppLoaderProps) {
  const [progress, setProgress] = useState<number>(initialProgress);

  /**
   * Smoothly increment progress while authentication session is validating
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          return 95;
        }
        /** Increment in organic steps */
        const step = Math.floor(Math.random() * 8) + 3;
        return Math.min(95, prev + step);
      });
    }, 160);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background select-none">
      {/** Background Ghost Layout providing the realistic blurred application outline */}
      <div className="flex h-screen w-full opacity-35 blur-[2.5px] pointer-events-none">
        {/** Ghost Sidebar */}
        <div className="w-[260px] h-full border-r border-border bg-card/50 p-4 flex flex-col gap-6 shrink-0 hidden md:flex">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-muted/80" />
            <div className="w-28 h-4 rounded bg-muted/60" />
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <div className="w-4 h-4 rounded bg-muted/70" />
                <div className="w-24 h-3.5 rounded bg-muted/50" />
              </div>
            ))}
          </div>
        </div>

        {/** Ghost Main View */}
        <div className="flex-1 flex flex-col">
          {/** Ghost Header */}
          <div className="h-16 border-b border-border bg-card/40 flex items-center justify-between px-6">
            <div className="w-36 h-4 rounded bg-muted/60" />
            <div className="flex items-center gap-3">
              <div className="w-40 h-8 rounded bg-muted/50" />
              <div className="w-8 h-8 rounded-full bg-muted/70" />
            </div>
          </div>

          {/** Ghost Content */}
          <div className="flex-1 p-6 space-y-6">
            {/** 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-[5px] border border-border bg-card/60 p-4 flex justify-between items-center"
                >
                  <div className="space-y-2">
                    <div className="w-20 h-3 rounded bg-muted/60" />
                    <div className="w-12 h-6 rounded bg-muted/80" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted/50" />
                </div>
              ))}
            </div>

            {/** Ghost Table Rows */}
            <div className="rounded-[5px] border border-border bg-card/60 p-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <div className="w-48 h-8 rounded bg-muted/60" />
                <div className="flex gap-2">
                  <div className="w-20 h-8 rounded bg-muted/50" />
                  <div className="w-20 h-8 rounded bg-muted/50" />
                </div>
              </div>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 border-b border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted/70" />
                    <div className="space-y-1">
                      <div className="w-28 h-3 rounded bg-muted/60" />
                      <div className="w-36 h-2.5 rounded bg-muted/40" />
                    </div>
                  </div>
                  <div className="w-20 h-3 rounded bg-muted/50" />
                  <div className="w-16 h-5 rounded-full bg-muted/60" />
                  <div className="w-24 h-3 rounded bg-muted/50" />
                  <div className="w-6 h-6 rounded bg-muted/40" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/** Frosted Glass Overlay with Centered Branded Widget */}
      <div className="absolute inset-0 bg-background/80 dark:bg-background/90 backdrop-blur-[8px] z-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
          {/** App Brand Badge and Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-black text-xl shadow-md">
              <Users className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-sans">
              {brandTitle}
            </span>
          </div>

          {/** Three Pulsing Dots */}
          <div className="flex items-center justify-center gap-2 my-4">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.32s]" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.16s]" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
          </div>

          {/** Percentage Indicator */}
          <span className="text-xs font-semibold text-muted-foreground mb-2 tracking-tight">
            {progress}% complete
          </span>

          {/** Horizontal Progress Track and Animated Bar */}
          <div className="w-64 sm:w-72 h-1.5 rounded-full bg-muted/80 overflow-hidden relative border border-border/40">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200 ease-out shadow-[0_0_8px_rgba(var(--primary),0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/** Subtext Label */}
          <span className="text-xs text-muted-foreground mt-3 tracking-wide">Loading...</span>
        </div>
      </div>
    </div>
  );
}
