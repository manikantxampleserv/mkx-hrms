import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_FONT_FAMILY,
  FONT_STORAGE_KEY,
  GOOGLE_FONTS_CATALOG,
  fetchAllGoogleFonts,
  injectGoogleFontLink,
  removeInjectedGoogleFonts,
  SYSTEM_FONT_STACK,
  type FontOption,
} from "../../config/fonts";

/**
 * Shape of the Font Context state and operations
 */
export interface FontContextType {
  /** The currently active font family */
  font: string;
  /** Set and apply a new font globally */
  setFont: (fontName: string) => Promise<void>;
  /** Temporary font being previewed in the font switcher */
  previewFont: string | null;
  /** Set temporary font preview */
  setPreviewFont: (fontName: string | null) => void;
  /** Indicates whether a font stylesheet is currently loading */
  isLoading: boolean;
  /** Indicates whether the full Google Fonts library is currently loading */
  isFetchingCatalog: boolean;
  /** The list of curated and available fonts */
  fonts: FontOption[];
  /** Reset to default font */
  resetToDefault: () => void;
}

/**
 * Initial fallback context value
 */
const initialContextValue: FontContextType = {
  font: DEFAULT_FONT_FAMILY,
  setFont: async () => {},
  previewFont: null,
  setPreviewFont: () => {},
  isLoading: false,
  isFetchingCatalog: false,
  fonts: GOOGLE_FONTS_CATALOG,
  resetToDefault: () => {},
};

/**
 * React Context instance for global font configuration
 */
export const FontContext = createContext<FontContextType>(initialContextValue);

/**
 * Applies the font family CSS variable to document root
 *
 * @param fontFamily - Target font family name
 */
function applyFontFamilyToDocument(fontFamily: string): void {
  if (typeof document === "undefined") return;
  const clean = fontFamily.trim().replace(/^["']|["']$/g, "");
  if (!clean || clean.toLowerCase() === "default" || clean.toLowerCase() === "system default") {
    document.documentElement.style.setProperty("--font-family", SYSTEM_FONT_STACK);
    return;
  }
  const fontStack = `"${clean}", ${SYSTEM_FONT_STACK}`;
  document.documentElement.style.setProperty("--font-family", fontStack);
}

/**
 * Props for the FontProvider component
 */
export interface FontProviderProps {
  /** Child nodes wrapped by provider */
  children: React.ReactNode;
  /** Optional initial default font */
  defaultFont?: string;
}

/**
 * Provider component managing dynamic global font loading and application
 *
 * @param props - FontProvider props
 * @returns Wrapped component tree
 */
export function FontProvider({ children, defaultFont = DEFAULT_FONT_FAMILY }: FontProviderProps) {
  const [font, setFontState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(FONT_STORAGE_KEY);
      if (saved) return saved;
    }
    return defaultFont;
  });

  const [previewFont, setPreviewFont] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fonts, setFonts] = useState<FontOption[]>(GOOGLE_FONTS_CATALOG);
  const [isFetchingCatalog, setIsFetchingCatalog] = useState<boolean>(false);

  /**
   * Fetch all 1,500+ Google Fonts dynamically
   */
  useEffect(() => {
    let isMounted = true;
    const loadFullCatalog = async () => {
      setIsFetchingCatalog(true);
      try {
        const fullCatalog = await fetchAllGoogleFonts();
        if (isMounted && fullCatalog.length > 0) {
          setFonts(fullCatalog);
        }
      } finally {
        if (isMounted) {
          setIsFetchingCatalog(false);
        }
      }
    };

    void loadFullCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Sets and persists the global application font
   *
   * @param newFont - Font family to apply
   */
  const setFont = async (newFont: string): Promise<void> => {
    const cleanFont = newFont.trim().replace(/^["']|["']$/g, "");
    if (!cleanFont || cleanFont.toLowerCase() === "default") {
      resetToDefault();
      return;
    }

    setIsLoading(true);
    try {
      await injectGoogleFontLink(cleanFont);
      setFontState(cleanFont);
      localStorage.setItem(FONT_STORAGE_KEY, cleanFont);
      applyFontFamilyToDocument(cleanFont);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets typography by removing all custom fonts, clearing storage, and reverting to normal system default
   */
  const resetToDefault = (): void => {
    setFontState(DEFAULT_FONT_FAMILY);
    localStorage.removeItem(FONT_STORAGE_KEY);
    removeInjectedGoogleFonts();
    applyFontFamilyToDocument(DEFAULT_FONT_FAMILY);
  };

  /**
   * Initialize initial font on mount
   */
  useEffect(() => {
    applyFontFamilyToDocument(font);
    void injectGoogleFontLink(font);
  }, [font]);

  const value: FontContextType = {
    font,
    setFont,
    previewFont,
    setPreviewFont,
    isLoading,
    isFetchingCatalog,
    fonts,
    resetToDefault,
  };

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

/**
 * Hook to consume the global font context
 *
 * @throws {Error} If called outside of a FontProvider
 * @returns {FontContextType} Font context state and methods
 */
export function useFontContext(): FontContextType {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error("useFontContext must be used within a FontProvider");
  }
  return context;
}
