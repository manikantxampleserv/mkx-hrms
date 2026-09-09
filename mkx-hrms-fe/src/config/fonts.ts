/**
 * Font category classification
 */
export type FontCategory =
  "All" | "Geometric" | "Modern Sans" | "Display" | "Corporate" | "Serif" | "Monospace";

/**
 * Representation of an available font option in the application
 */
export interface FontOption {
  /** Display name of the font */
  name: string;
  /** Primary font family name recognized by Google Fonts and CSS */
  family: string;
  /** Primary category grouping */
  category: FontCategory;
  /** Popularity badge or tag */
  tag?: string;
  /** Short preview snippet to display typography personality */
  previewText?: string;
}

/**
 * Initial Google Fonts catalog pre-loaded across all categories for instant zero-latency availability
 */
export const GOOGLE_FONTS_CATALOG: FontOption[] = [
  { name: "Unbounded", family: "Unbounded", category: "Geometric", tag: "Current", previewText: "MKX Human Capital Intelligence" },
  { name: "Plus Jakarta Sans", family: "Plus Jakarta Sans", category: "Geometric", tag: "Popular", previewText: "Empowering Modern Workforces" },
  { name: "Outfit", family: "Outfit", category: "Geometric", tag: "Trending", previewText: "Seamless Automation & Analytics" },
  { name: "Poppins", family: "Poppins", category: "Geometric", tag: "Classic", previewText: "Clean & Balanced Aesthetics" },
  { name: "Sora", family: "Sora", category: "Geometric", tag: "Crisp", previewText: "Precision-Crafted UI Typography" },
  { name: "Urbanist", family: "Urbanist", category: "Geometric", tag: "Sleek", previewText: "Sophisticated Modern Curves" },
  { name: "Rubik", family: "Rubik", category: "Geometric", tag: "Rounded", previewText: "Subtle Rounded Corners" },
  { name: "Quicksand", family: "Quicksand", category: "Geometric", tag: "Friendly", previewText: "Approachable Modern Shapes" },
  { name: "Montserrat", family: "Montserrat", category: "Geometric", tag: "Popular", previewText: "Inspired by Urban Signage" },
  { name: "Raleway", family: "Raleway", category: "Geometric", tag: "Elegant", previewText: "Sophisticated Weight Scales" },
  { name: "Nunito", family: "Nunito", category: "Geometric", tag: "Rounded", previewText: "Friendly Rounded Terminals" },
  { name: "Jost", family: "Jost", category: "Geometric", tag: "Bauhaus", previewText: "German Geometric Design" },
  { name: "Space Grotesk", family: "Space Grotesk", category: "Geometric", tag: "Tech", previewText: "Future-Ready Enterprise Platform" },
  { name: "Syne", family: "Syne", category: "Geometric", tag: "Avant-garde", previewText: "Bold Expressive Identity" },
  { name: "Schibsted Grotesk", family: "Schibsted Grotesk", category: "Geometric", tag: "Editorial", previewText: "Contemporary Digital Clarity" },
  { name: "Comfortaa", family: "Comfortaa", category: "Geometric", tag: "Smooth", previewText: "Rounded Geometric Rhythm" },
  { name: "Dosis", family: "Dosis", category: "Geometric", tag: "Rounded", previewText: "Distinct Rounded Letterforms" },
  { name: "Exo 2", family: "Exo 2", category: "Geometric", tag: "Sci-fi", previewText: "Technological Precision" },
  { name: "Fredoka", family: "Fredoka", category: "Geometric", tag: "Bold", previewText: "Playful Geometric Curves" },
  { name: "Archivo", family: "Archivo", category: "Geometric", tag: "Editorial", previewText: "Created for Highlights and Data" },
  { name: "Inter", family: "Inter", category: "Modern Sans", tag: "Standard", previewText: "Optimized for Digital Screens" },
  { name: "Manrope", family: "Manrope", category: "Modern Sans", tag: "Clean", previewText: "Contemporary Human Interface" },
  { name: "DM Sans", family: "DM Sans", category: "Modern Sans", tag: "Minimal", previewText: "Efficient, High-Legibility Letters" },
  { name: "Figtree", family: "Figtree", category: "Modern Sans", tag: "Friendly", previewText: "Warm & Contemporary Geometry" },
  { name: "Work Sans", family: "Work Sans", category: "Modern Sans", tag: "Workforce", previewText: "Optimized for Work Environments" },
  { name: "Epilogue", family: "Epilogue", category: "Modern Sans", tag: "Bold", previewText: "Distinctive Editorial Rhythm" },
  { name: "Prompt", family: "Prompt", category: "Modern Sans", tag: "Dynamic", previewText: "Clean Multi-Weight System" },
  { name: "Mulish", family: "Mulish", category: "Modern Sans", tag: "Minimal", previewText: "Versatile Minimalist Sans" },
  { name: "Barlow", family: "Barlow", category: "Modern Sans", tag: "Slightly Rounded", previewText: "California Highway Geometry" },
  { name: "Public Sans", family: "Public Sans", category: "Modern Sans", tag: "Accessible", previewText: "Strong Neutral Design" },
  { name: "Inter Tight", family: "Inter Tight", category: "Modern Sans", tag: "Compact", previewText: "Condensed Interface Typography" },
  { name: "Mukta", family: "Mukta", category: "Modern Sans", tag: "Contemporary", previewText: "Modern Contemporary Proportions" },
  { name: "Karla", family: "Karla", category: "Modern Sans", tag: "Grotesque", previewText: "Subtle Quirky Personality" },
  { name: "Red Hat Display", family: "Red Hat Display", category: "Modern Sans", tag: "Open Source", previewText: "Engineered for Enterprise Identity" },
  { name: "Cabin", family: "Cabin", category: "Modern Sans", tag: "Humanist", previewText: "Humanist Proportions" },
  { name: "Asap", family: "Asap", category: "Modern Sans", tag: "Standardized", previewText: "Identical Line Heights" },
  { name: "Rethink Sans", family: "Rethink Sans", category: "Modern Sans", tag: "Readable", previewText: "Engineered for Modern Web" },
  { name: "Instrument Sans", family: "Instrument Sans", category: "Modern Sans", tag: "Studio", previewText: "Clean Creative Studio Type" },
  { name: "Geist", family: "Geist", category: "Modern Sans", tag: "Developer", previewText: "Precision Swiss Proportions" },
  { name: "Hanken Grotesk", family: "Hanken Grotesk", category: "Modern Sans", tag: "Clean", previewText: "Contemporary Neo-Grotesque" },
  { name: "Roboto", family: "Roboto", category: "Corporate", tag: "Standard", previewText: "Global Default Reliability" },
  { name: "Open Sans", family: "Open Sans", category: "Corporate", tag: "Reliable", previewText: "Friendly & Open Legibility" },
  { name: "Lato", family: "Lato", category: "Corporate", tag: "Warm", previewText: "Harmonious Corporate Classic" },
  { name: "Arimo", family: "Arimo", category: "Corporate", tag: "Metric Compatible", previewText: "Arial-Compatible Precision" },
  { name: "Lexend", family: "Lexend", category: "Corporate", tag: "Readable", previewText: "Designed for Maximum Reading Fluency" },
  { name: "Source Sans 3", family: "Source Sans 3", category: "Corporate", tag: "Professional", previewText: "Adobe Open Source Heritage" },
  { name: "PT Sans", family: "PT Sans", category: "Corporate", tag: "Official", previewText: "Pan-European Typography" },
  { name: "IBM Plex Sans", family: "IBM Plex Sans", category: "Corporate", tag: "Enterprise", previewText: "IBM Global Identity System" },
  { name: "Noto Sans", family: "Noto Sans", category: "Corporate", tag: "Universal", previewText: "Universal Multi-Script Harmony" },
  { name: "Titillium Web", family: "Titillium Web", category: "Corporate", tag: "Technical", previewText: "Italian Design School Origin" },
  { name: "Heebo", family: "Heebo", category: "Corporate", tag: "Clean", previewText: "Hebrew and Latin Precision" },
  { name: "Fira Sans", family: "Fira Sans", category: "Corporate", tag: "Mozilla", previewText: "Designed for Firefox OS" },
  { name: "Assistant", family: "Assistant", category: "Corporate", tag: "Hebrew-Latin", previewText: "Clean & Legible Interfaces" },
  { name: "Overpass", family: "Overpass", category: "Corporate", tag: "Highway", previewText: "Inspired by US Signage" },
  { name: "Play", family: "Play", category: "Corporate", tag: "Mechanical", previewText: "Clean Mechanical Structure" },
  { name: "Tajawal", family: "Tajawal", category: "Corporate", tag: "Bilingual", previewText: "Arabic-Latin Equilibrium" },
  { name: "Ubuntu", family: "Ubuntu", category: "Corporate", tag: "Canonical", previewText: "Modern Open-Source Linux" },
  { name: "Cairo", family: "Cairo", category: "Corporate", tag: "Contemporary", previewText: "Balanced Neo-Naskh Geometry" },
  { name: "Oxygen", family: "Oxygen", category: "Corporate", tag: "KDE", previewText: "KDE Desktop Environment Standard" },
  { name: "Barlow Condensed", family: "Barlow Condensed", category: "Corporate", tag: "Compact", previewText: "Data-Dense Dashboards" },
  { name: "Bebas Neue", family: "Bebas Neue", category: "Display", tag: "Impact", previewText: "BOLD ALL-CAPS HEADLINES" },
  { name: "Bricolage Grotesque", family: "Bricolage Grotesque", category: "Display", tag: "Expressive", previewText: "Expressive Variable Type System" },
  { name: "Alfa Slab One", family: "Alfa Slab One", category: "Display", tag: "Heavy", previewText: "Heavy Contemporary Slab" },
  { name: "Lobster", family: "Lobster", category: "Display", tag: "Script", previewText: "Bold Condensed Script" },
  { name: "Lobster Two", family: "Lobster Two", category: "Display", tag: "Refined", previewText: "Upright Classic Script" },
  { name: "Anton", family: "Anton", category: "Display", tag: "Bold", previewText: "TRADITIONAL ADVERTISING" },
  { name: "Black Ops One", family: "Black Ops One", category: "Display", tag: "Military", previewText: "HEAVY STENCIL IMPACT" },
  { name: "Lilita One", family: "Lilita One", category: "Display", tag: "Fat", previewText: "Pleasantly Plump Display" },
  { name: "Orbitron", family: "Orbitron", category: "Display", tag: "Futuristic", previewText: "CHRONO TECH 2099" },
  { name: "Changa One", family: "Changa One", category: "Display", tag: "Short", previewText: "Heavy Wide Terminals" },
  { name: "Bungee", family: "Bungee", category: "Display", tag: "Signage", previewText: "URBAN STREET SIGNS" },
  { name: "Gravitas One", family: "Gravitas One", category: "Display", tag: "Heavy", previewText: "CONTEMPORARY ADVERTISING" },
  { name: "Teko", family: "Teko", category: "Display", tag: "Condensed", previewText: "TALL HEADLINES & STATS" },
  { name: "Caveat", family: "Caveat", category: "Display", tag: "Handwriting", previewText: "Quick informal handwriting notes" },
  { name: "Pacifico", family: "Pacifico", category: "Display", tag: "Surf", previewText: "1950s American Surf Culture" },
  { name: "Dancing Script", family: "Dancing Script", category: "Display", tag: "Casual", previewText: "Lively bouncing calligraphic letters" },
  { name: "Righteous", family: "Righteous", category: "Display", tag: "Art Deco", previewText: "Grid-Based Art Deco Display" },
  { name: "Shrikhand", family: "Shrikhand", category: "Display", tag: "Retro", previewText: "Vibrant Gujarati Hand-Painted" },
  { name: "Permanent Marker", family: "Permanent Marker", category: "Display", tag: "Marker", previewText: "HEAVY FELT-TIP MARKER" },
  { name: "Abril Fatface", family: "Abril Fatface", category: "Display", tag: "Didone", previewText: "Dramatic High-Contrast Titling" },
  { name: "Playfair Display", family: "Playfair Display", category: "Serif", tag: "Luxury", previewText: "Timeless Editorial Refinement" },
  { name: "Lora", family: "Lora", category: "Serif", tag: "Contemporary", previewText: "Calm and Contemporary Serifs" },
  { name: "Merriweather", family: "Merriweather", category: "Serif", tag: "Warm", previewText: "Pleasant Screen Reading Experience" },
  { name: "Roboto Slab", family: "Roboto Slab", category: "Serif", tag: "Geometric", previewText: "Geometric Slab-Serif Foundation" },
  { name: "Cormorant Garamond", family: "Cormorant Garamond", category: "Serif", tag: "Classical", previewText: "Traditional French Renaissance" },
  { name: "Libre Baskerville", family: "Libre Baskerville", category: "Serif", tag: "Optimized", previewText: "Web-Optimized 19th Century" },
  { name: "PT Serif", family: "PT Serif", category: "Serif", tag: "Universal", previewText: "Editorial Standard for Extended Reading" },
  { name: "Fraunces", family: "Fraunces", category: "Serif", tag: "Vintage", previewText: "Wonky 20th Century Heritage" },
  { name: "Noto Serif", family: "Noto Serif", category: "Serif", tag: "Universal", previewText: "Harmonious Serifs for Global Scripts" },
  { name: "EB Garamond", family: "EB Garamond", category: "Serif", tag: "Revival", previewText: "Faithful Garamont 1592 Revival" },
  { name: "Instrument Serif", family: "Instrument Serif", category: "Serif", tag: "Studio", previewText: "High-Contrast Contemporary Elegance" },
  { name: "Bitter", family: "Bitter", category: "Serif", tag: "Slab", previewText: "Comfortable Reading Experience" },
  { name: "Crimson Text", family: "Crimson Text", category: "Serif", tag: "Book", previewText: "Book Production Traditions" },
  { name: "Source Serif 4", family: "Source Serif 4", category: "Serif", tag: "Adobe", previewText: "Digital-First Text Typography" },
  { name: "Cinzel", family: "Cinzel", category: "Serif", tag: "Roman", previewText: "CLASSICAL ROMAN INSCRIPTIONS" },
  { name: "Newsreader", family: "Newsreader", category: "Serif", tag: "Longform", previewText: "Long-Form Digital Publication" },
  { name: "Slabo 27px", family: "Slabo 27px", category: "Serif", tag: "Pixel-Tuned", previewText: "Custom Size-Tuned Slab" },
  { name: "Arvo", family: "Arvo", category: "Serif", tag: "Geometric", previewText: "Geometric Slab-Serif Hybrid" },
  { name: "Bodoni Moda", family: "Bodoni Moda", category: "Serif", tag: "Fashion", previewText: "Dramatic Extreme Contrast" },
  { name: "Spectral", family: "Spectral", category: "Serif", tag: "Production", previewText: "Screen-First Reading Comfort" },
  { name: "JetBrains Mono", family: "JetBrains Mono", category: "Monospace", tag: "Code", previewText: "0123456789 HRMS_ENGINE.INIT()" },
  { name: "Fira Code", family: "Fira Code", category: "Monospace", tag: "Ligatures", previewText: "const mkx = async () => true;" },
  { name: "Space Mono", family: "Space Mono", category: "Monospace", tag: "Retro", previewText: "SYSTEM_STATUS: ALL OPERATIONAL" },
  { name: "Roboto Mono", family: "Roboto Mono", category: "Monospace", tag: "Engineered", previewText: "def calculate_payroll(emp_id):" },
  { name: "Inconsolata", family: "Inconsolata", category: "Monospace", tag: "Print", previewText: "echo 'Enterprise HRMS v2.0';" },
  { name: "Source Code Pro", family: "Source Code Pro", category: "Monospace", tag: "Adobe", previewText: "interface EmployeeRecord<T> {}" },
  { name: "IBM Plex Mono", family: "IBM Plex Mono", category: "Monospace", tag: "Enterprise", previewText: "SELECT * FROM workforce_metrics;" },
  { name: "Geist Mono", family: "Geist Mono", category: "Monospace", tag: "Developer", previewText: "git commit -m 'feat: typography'" },
  { name: "Share Tech Mono", family: "Share Tech Mono", category: "Monospace", tag: "Terminal", previewText: "BOOT_SEQUENCE_OK: READY" },
  { name: "Courier Prime", family: "Courier Prime", category: "Monospace", tag: "Screenplay", previewText: "FADE IN: A MODERN WORKPLACE." },
  { name: "VT323", family: "VT323", category: "Monospace", tag: "8-Bit", previewText: "LOAD '*' ,8 ,1 RUN READY" },
  { name: "Cutive Mono", family: "Cutive Mono", category: "Monospace", tag: "Typewriter", previewText: "Executive Memorandum Confidential" },
  { name: "Anonymous Pro", family: "Anonymous Pro", category: "Monospace", tag: "Programmer", previewText: "0O1lI| {}[]() != == >= <=" },
  { name: "Overpass Mono", family: "Overpass Mono", category: "Monospace", tag: "Technical", previewText: "PORT 5174 LISTENING ON 0.0.0.0" },
  { name: "DM Mono", family: "DM Mono", category: "Monospace", tag: "Minimal", previewText: "JSON.stringify({ status: 200 })" },
  { name: "Red Hat Mono", family: "Red Hat Mono", category: "Monospace", tag: "Open Source", previewText: "sudo systemctl restart mkx-hrms" },
];

/**
 * Storage key constant for persisting font preference
 */
export const FONT_STORAGE_KEY = "mkx-hrms-global-font";

/**
 * Standard system typography fallback stack used when no custom font is selected
 */
export const SYSTEM_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Default fallback font identifier representing standard system fonts
 */
export const DEFAULT_FONT_FAMILY = "Default";

/**
 * Map of preloaded or active link elements to avoid duplicate DOM insertions
 */
const loadedFontsSet = new Set<string>();

/**
 * Removes all dynamically injected Google Font stylesheet links from the document head
 */
export function removeInjectedGoogleFonts(): void {
  if (typeof document === "undefined") return;
  const links = document.querySelectorAll("link[id^='google-font-']");
  links.forEach((link) => link.remove());
  loadedFontsSet.clear();
}

/**
 * Dynamically loads a Google Font stylesheet by injecting a `<link>` tag into document.head
 *
 * @param fontFamily - The exact font family name as defined on Google Fonts
 * @returns Promise resolving to boolean indicating whether stylesheet was successfully injected/loaded
 */
export function injectGoogleFontLink(fontFamily: string): Promise<boolean> {
  if (typeof document === "undefined") {
    return Promise.resolve(false);
  }

  const cleanFamily = fontFamily.trim().replace(/^["']|["']$/g, "");
  if (
    !cleanFamily ||
    cleanFamily.toLowerCase() === "default" ||
    cleanFamily.toLowerCase() === "system default"
  ) {
    return Promise.resolve(true);
  }

  if (loadedFontsSet.has(cleanFamily)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const encodedFamily = encodeURIComponent(cleanFamily);
    const linkId = `google-font-${cleanFamily.toLowerCase().replace(/\s+/g, "-")}`;

    if (document.getElementById(linkId)) {
      loadedFontsSet.add(cleanFamily);
      resolve(true);
      return;
    }

    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@200;300;400;500;600;700;800;900&display=swap`;

    link.onload = () => {
      loadedFontsSet.add(cleanFamily);
      resolve(true);
    };

    link.onerror = () => {
      resolve(false);
    };

    document.head.appendChild(link);
  });
}

/**
 * Raw font item definition returned by Google Fonts metadata API
 */
interface RawGoogleFontItem {
  id: string;
  family: string;
  category: string;
  popularity?: number;
}

/**
 * Keywords for identifying geometric sans-serif font families
 */
const GEOMETRIC_KEYWORDS: string[] = [
  "poppins",
  "outfit",
  "jakarta",
  "sora",
  "montserrat",
  "urbanist",
  "raleway",
  "nunito",
  "rubik",
  "quicksand",
  "grotesk",
  "syne",
  "comfortaa",
];

/**
 * Keywords for identifying corporate and neutral font families
 */
const CORPORATE_KEYWORDS: string[] = [
  "roboto",
  "open sans",
  "inter",
  "lato",
  "source sans",
  "noto",
  "work sans",
  "pt sans",
  "arimo",
  "lexend",
];

/**
 * Maps raw API category to standard UI font category
 *
 * @param apiCategory - Category string from API
 * @param family - Font family name for sub-classification
 * @returns Normalized FontCategory
 */
function mapCategory(apiCategory?: string, family?: string): FontCategory {
  const cat = apiCategory?.toLowerCase() ?? "";
  const name = family?.toLowerCase() ?? "";

  if (cat === "serif") {
    return "Serif";
  }
  if (cat === "monospace") {
    return "Monospace";
  }
  if (cat === "display" || cat === "handwriting") {
    return "Display";
  }

  if (GEOMETRIC_KEYWORDS.some((keyword) => name.includes(keyword))) {
    return "Geometric";
  }
  if (CORPORATE_KEYWORDS.some((keyword) => name.includes(keyword))) {
    return "Corporate";
  }

  return "Modern Sans";
}

/**
 * Dynamically fetches all 1,500+ Google Fonts from open Google Fonts directory
 *
 * @returns Promise resolving to an array of all Google Fonts
 */
export async function fetchAllGoogleFonts(): Promise<FontOption[]> {
  if (typeof window === "undefined") {
    return GOOGLE_FONTS_CATALOG;
  }

  try {
    const cached = sessionStorage.getItem("mkx_all_google_fonts");
    if (cached) {
      const parsed = JSON.parse(cached) as FontOption[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    return GOOGLE_FONTS_CATALOG;
  }

  try {
    const response = await fetch("https://gwfh.mranftl.com/api/fonts");
    if (!response.ok) {
      return GOOGLE_FONTS_CATALOG;
    }

    const data = (await response.json()) as RawGoogleFontItem[];
    if (!Array.isArray(data) || data.length === 0) {
      return GOOGLE_FONTS_CATALOG;
    }

    const mapped: FontOption[] = data.map((item) => {
      let tag: string | undefined;
      if (item.popularity && item.popularity <= 20) {
        tag = "Top 20";
      } else if (item.popularity && item.popularity <= 60) {
        tag = "Popular";
      }

      return {
        name: item.family,
        family: item.family,
        category: mapCategory(item.category, item.family),
        tag,
        previewText: "MKX Human Capital Intelligence",
      };
    });

    try {
      sessionStorage.setItem("mkx_all_google_fonts", JSON.stringify(mapped));
    } catch {
      return mapped;
    }

    return mapped;
  } catch {
    return GOOGLE_FONTS_CATALOG;
  }
}
