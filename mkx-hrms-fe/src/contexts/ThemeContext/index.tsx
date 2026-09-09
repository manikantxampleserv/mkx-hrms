import { createTheme, ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import { useContext, useEffect, useMemo, useState } from "react";
import { FontContext } from "../FontContext";
import { type Theme, ThemeProviderContext } from "./useTheme";

/**
 * Props for the ThemeProvider component.
 */
type ThemeProviderProps = {
  /** The children nodes to wrap with the theme contexts */
  children: React.ReactNode;
  /** The default theme to use if none is saved in local storage */
  defaultTheme?: Theme;
  /** The local storage key used to persist the user's theme preference */
  storageKey?: string;
};

/**
 * ThemeProvider component that synchronizes HTML class-based theming (for Tailwind)
 * with the Material-UI (MUI) theme provider.
 *
 * @param props - The properties for the ThemeProvider
 * @returns The wrapped application with active theme contexts
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );

  const [isDark, setIsDark] = useState(false);

  /**
   * Handle HTML dark mode class and isDark state
   */
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    const determineDark = (t: Theme) => {
      if (t === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
      return t === "dark";
    };

    const currentIsDark = determineDark(theme);
    setIsDark(currentIsDark);
    root.classList.add(currentIsDark ? "dark" : "light");

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (t: Theme) => {
      localStorage.setItem(storageKey, t);
      setTheme(t);
    },
  };

  const fontContext = useContext(FontContext);
  const activeFont = fontContext?.font || "Default";

  /**
   * MUI Theme integration synced with current `isDark` and `activeFont`
   */
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDark ? "dark" : "light",
          primary: {
            main: isDark ? "#eee" : "#18181b",
            contrastText: isDark ? "#020203" : "#fafafa",
          },
          warning: {
            main: isDark ? "#ff8b25" : "#f59e0b",
            contrastText: isDark ? "#050607" : "#ffffff",
          },
          success: {
            main: isDark ? "#45ba50" : "#10b981",
            contrastText: isDark ? "#050607" : "#ffffff",
          },
          error: {
            main: isDark ? "#f14d4c" : "#ef4444",
            contrastText: isDark ? "#050607" : "#ffffff",
          },
          background: {
            default: "transparent",
            paper: isDark ? "#050607" : "#ffffff",
          },
        },
        shape: {
          borderRadius: 5,
        },
        typography: {
          fontFamily:
            !activeFont || activeFont === "Default"
              ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              : `"${activeFont}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
          button: {
            textTransform: "capitalize",
          },
        },
        components: {
          MuiButton: {
            defaultProps: {
              disableElevation: true,
            },
            styleOverrides: {
              root: {
                textTransform: "capitalize",
              },
            },
          },
          MuiAvatar: {
            styleOverrides: {
              root: {
                borderRadius: "5px",
              },
            },
          },
          MuiBadge: {
            styleOverrides: {
              badge: {
                fontWeight: "bold",
                fontSize: "10px",
                borderRadius: "5px",
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: "5px",
                fontWeight: 500,
                padding: "0 5px",
              },
              outlined: {
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "color-mix(in srgb, currentColor 20%, transparent)",
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none !important",
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: "12px !important",
                overflow: "hidden !important",
                backgroundColor: "color-mix(in srgb, currentColor 10%, transparent) !important",
                "&:hover": {
                  backgroundColor: "color-mix(in srgb, currentColor 20%, transparent) !important",
                },
                "& .MuiTouchRipple-root": {
                  borderRadius: "12px !important",
                  overflow: "hidden !important",
                },
                "& .MuiTouchRipple-child": {
                  borderRadius: "12px !important",
                },
                "& .MuiTouchRipple-ripple": {
                  borderRadius: "12px !important",
                },
              },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: {
                borderBottom: "1px solid var(--border)",
                color: "var(--foreground)",
                padding: "20px 24px",
              },
              head: {
                color: "var(--muted-foreground)",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                backgroundColor: "var(--card)",
                padding: "16px 24px",
              },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                "&:last-child td, &:last-child th": { border: 0 },
                "&:hover": { backgroundColor: "var(--muted)" },
                transition: "background-color 0.2s ease",
              },
            },
          },
          MuiTablePagination: {
            styleOverrides: {
              root: {
                color: "var(--muted-foreground)",
                "& .MuiTablePagination-selectIcon": { color: "var(--muted-foreground)" },
                "& .MuiTablePagination-select": { color: "var(--foreground)", fontWeight: 500 },
                "& .MuiTablePagination-menuItem": { color: "var(--foreground)" },
                "& .MuiTablePagination-displayedRows": { color: "var(--muted-foreground)" },
                "& .MuiIconButton-root": {
                  color: "var(--foreground)",
                  backgroundColor: "transparent !important",
                },
                "& .MuiIconButton-root:hover": {
                  backgroundColor: "var(--secondary) !important",
                },
                "& .Mui-disabled": { opacity: 0.3 },
              },
            },
          },
        },
      }),
    [isDark, activeFont],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <MUIThemeProvider theme={muiTheme}>{children}</MUIThemeProvider>
    </ThemeProviderContext.Provider>
  );
}
