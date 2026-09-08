import { createContext, useContext } from "react";

/**
 * Defines the available theme modes.
 * - `dark`: Forces the application into dark mode.
 * - `light`: Forces the application into light mode.
 * - `system`: Syncs the theme with the user's operating system preferences.
 */
export type Theme = "dark" | "light" | "system";

/**
 * Defines the shape of the context state for the ThemeProvider.
 */
export type ThemeProviderState = {
  /** The currently active theme mode */
  theme: Theme;
  /** Function to update the active theme mode */
  setTheme: (theme: Theme) => void;
};

/**
 * Default fallback state for the ThemeProvider context.
 */
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

/**
 * React Context instance for the ThemeProvider.
 */
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Custom hook to safely consume the ThemeProvider context.
 *
 * @throws {Error} If called from a component that is not a descendant of ThemeProvider.
 * @returns {ThemeProviderState} The current theme state and updater function.
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
