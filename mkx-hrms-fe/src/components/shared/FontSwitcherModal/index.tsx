import { Check, Close, RestartAlt, Search, TextFields } from "@mui/icons-material";
import { Button, Chip, IconButton, InputAdornment, InputBase } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { CustomDialog } from "../CustomDialog";
import { type FontCategory, type FontOption } from "../../../config/fonts";
import { useFontContext } from "contexts/FontContext";

/**
 * Props for the FontSwitcherModal component
 */
export interface FontSwitcherModalProps {
  /** Modal open state */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
}

/**
 * Filter categories available in the font switcher
 */
const CATEGORIES: FontCategory[] = [
  "All",
  "Geometric",
  "Modern Sans",
  "Display",
  "Corporate",
  "Serif",
  "Monospace",
];

/**
 * Number of font items per page in scroll pagination
 */
const PAGE_SIZE = 20;

/**
 * Modal dialog enabling runtime search, preview, scroll pagination, and global application of Google Fonts
 *
 * @param props - FontSwitcherModalProps
 * @returns React element rendering font switcher modal
 */
export function FontSwitcherModal({ open, onClose }: FontSwitcherModalProps) {
  const { font: activeFont, setFont, fonts, resetToDefault, isFetchingCatalog } = useFontContext();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<FontCategory>("All");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  /**
   * Reset pagination visible count whenever search query or category changes
   */
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedCategory]);

  /**
   * Filtered fonts based on category and search query.
   * Displays all matching fonts in the selected category when no search is entered,
   * and narrows down to specific matches when searching.
   */
  const filteredFonts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const hasSearch = query.length > 0;

    const matches = fonts.filter((f: FontOption) => {
      const matchesCategory = selectedCategory === "All" || f.category === selectedCategory;
      const matchesSearch =
        !hasSearch ||
        f.name.toLowerCase().includes(query) ||
        f.family.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    if (hasSearch) {
      const exactMatch = matches.some(
        (f: FontOption) => f.family.toLowerCase() === query || f.name.toLowerCase() === query,
      );
      if (!exactMatch) {
        const customTitle = searchQuery.trim();
        return [
          {
            name: customTitle,
            family: customTitle,
            category: (selectedCategory === "All" ? "Display" : selectedCategory) as FontCategory,
            tag: "Searched",
            previewText: "MKX Human Capital Intelligence",
          },
          ...matches,
        ];
      }
    }

    return matches;
  }, [fonts, selectedCategory, searchQuery]);

  /**
   * Paginated slice of filtered fonts for responsive scroll rendering
   */
  const displayedFonts = useMemo(() => {
    return filteredFonts.slice(0, visibleCount);
  }, [filteredFonts, visibleCount]);

  /**
   * Handles container scroll to paginate and load more fonts dynamically
   *
   * @param event - UI scroll event from container
   */
  const handleScroll = (event: React.UIEvent<HTMLDivElement>): void => {
    const target = event.currentTarget;
    const threshold = 60;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - threshold) {
      if (visibleCount < filteredFonts.length) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredFonts.length));
      }
    }
  };

  /**
   * Handles selecting a font from the catalog
   *
   * @param fontName - Name of the selected font
   */
  const handleSelectFont = async (fontName: string): Promise<void> => {
    await setFont(fontName);
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      paperClassName="!max-h-[85vh] !flex !flex-col !overflow-hidden !rounded-[8px]"
      contentClassName="!p-4 !space-y-4 !overflow-hidden !flex-1 !flex !flex-col"
      actionsClassName="!px-5 !py-3 !border-t !border-border !flex !items-center !justify-between !bg-card !shrink-0"
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[5px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TextFields className="!w-4 !h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground leading-tight">
                Global Typography
              </span>
              <Chip
                label={
                  isFetchingCatalog ? "Syncing Google Fonts..." : `${fonts.length} Google Fonts`
                }
                size="small"
                className="!h-4.5 !text-[10px] !bg-primary/10 !text-primary !font-semibold !rounded-[4px]"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-normal">
              Search and preview any Google font to apply across the entire HRMS platform
            </p>
          </div>
        </div>
      }
      headerRight={
        <Button
          size="small"
          variant="outlined"
          startIcon={<RestartAlt className="!w-3.5 !h-3.5" />}
          onClick={resetToDefault}
          className="!text-xs !normal-case !rounded-[5px] !border-border !text-muted-foreground hover:!text-foreground !px-2.5 !py-1"
        >
          Reset to Normal
        </Button>
      }
      actions={
        <>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Active Global Font:</span>
            <Chip
              label={activeFont === "Default" ? "System Normal (Default)" : activeFont}
              size="small"
              className="!h-6 !text-xs !bg-secondary !font-medium !text-foreground !rounded-[5px]"
            />
          </div>
          <Button
            size="small"
            variant="contained"
            onClick={onClose}
            className="!rounded-[5px] !normal-case !text-xs !bg-primary !text-primary-foreground !px-5 !py-1.5 !font-medium"
          >
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-3 shrink-0">
        <InputBase
          placeholder="Search Google Fonts (e.g. Poppins, Inter, Caveat, Syne, Outfit)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9.5 pl-3.5 pr-4 rounded-[5px] bg-secondary border border-border text-sm text-foreground [&_input]:p-0 [&_input::placeholder]:text-muted-foreground [&_input::placeholder]:opacity-100 transition-all duration-200 focus-within:border-primary"
          startAdornment={
            <InputAdornment position="start">
              <Search className="!w-4 !h-4 text-muted-foreground" />
            </InputAdornment>
          }
          endAdornment={
            searchQuery ? (
              <IconButton size="small" onClick={() => setSearchQuery("")} className="!p-1">
                <Close className="!w-3.5 !h-3.5 text-muted-foreground hover:text-foreground" />
              </IconButton>
            ) : null
          }
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-[5px] text-xs font-medium transition-all shrink-0 cursor-pointer border ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-secondary/60 text-muted-foreground border-border/60 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div
        onScroll={handleScroll}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 max-h-[360px] pr-1"
      >
        {isFetchingCatalog && fonts.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 py-14 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-foreground text-sm">Syncing Google Fonts...</span>
            <span className="text-muted-foreground">
              Fetching catalog from Google Fonts directory
            </span>
          </div>
        ) : filteredFonts.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 py-14 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-[5px] bg-secondary/80 flex items-center justify-center text-muted-foreground">
              <Search className="!w-5 !h-5" />
            </div>
            <span className="font-semibold text-foreground text-sm">No fonts found</span>
            <span className="max-w-xs text-muted-foreground">
              {searchQuery.trim()
                ? `No results found for "${searchQuery.trim()}". Try another search keyword.`
                : "No fonts available matching the selected category filter."}
            </span>
          </div>
        ) : (
          displayedFonts.map((fontItem) => {
            const isSelected = activeFont.toLowerCase() === fontItem.family.toLowerCase();

            return (
              <div
                key={fontItem.family}
                onClick={() => void handleSelectFont(fontItem.family)}
                className={`p-3.5 rounded-[8px] border transition-all cursor-pointer flex flex-col justify-between gap-2.5 min-h-[86px] ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border bg-card hover:border-border/80 hover:bg-secondary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{fontItem.name}</span>
                    {fontItem.tag && (
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[4px] bg-secondary text-muted-foreground">
                        {fontItem.tag}
                      </span>
                    )}
                  </div>
                  {isSelected ? (
                    <div className="w-4.5 h-4.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="!w-3 !h-3" />
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{fontItem.category}</span>
                  )}
                </div>

                <div
                  className="text-xs text-muted-foreground truncate"
                  style={{ fontFamily: `"${fontItem.family}", sans-serif` }}
                >
                  {fontItem.previewText || "The quick brown fox jumps over the lazy dog."}
                </div>
              </div>
            );
          })
        )}

        {filteredFonts.length > visibleCount && (
          <div className="col-span-1 sm:col-span-2 py-2 text-center text-xs text-muted-foreground">
            Scroll to load more fonts ({displayedFonts.length} of {filteredFonts.length})
          </div>
        )}
      </div>
    </CustomDialog>
  );
}
