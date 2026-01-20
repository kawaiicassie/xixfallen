import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/app/i18n";
import { useMessageFontStore, POPULAR_GOOGLE_FONTS, getAllAvailableFonts } from "@/contexts/MessageFontStore";
import { toast } from "react-hot-toast";

interface FontSettingsEditorProps {
  onViewSwitch?: () => void;
}

type FontCategory = "all" | "serif" | "sans-serif" | "cursive" | "monospace" | "custom";

interface FontOption {
  name: string;
  category: string;
  isCustom?: boolean;
}

export const FontSettingsEditor: React.FC<FontSettingsEditorProps> = ({ onViewSwitch }) => {
  const { t, fontClass, serifFontClass } = useLanguage();
  const { fontSettings, customFonts, updateFontSettings, resetFontSettings, addCustomFont, loadGoogleFont } = useMessageFontStore();

  const [customFontInput, setCustomFontInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<FontCategory>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeDropdown]);

  // Load all fonts on mount
  useEffect(() => {
    if (fontSettings.normalFont) loadGoogleFont(fontSettings.normalFont);
    if (fontSettings.dialogueFont) loadGoogleFont(fontSettings.dialogueFont);
    if (fontSettings.italicFont) loadGoogleFont(fontSettings.italicFont);
    if (fontSettings.codeFont) loadGoogleFont(fontSettings.codeFont);
    customFonts.forEach(font => loadGoogleFont(font));
  }, []);

  const availableFonts = getAllAvailableFonts(customFonts);

  const filteredFonts = (category: FontCategory): FontOption[] => {
    if (category === "all") return availableFonts;
    if (category === "custom") return availableFonts.filter(f => f.isCustom);
    return availableFonts.filter(f => f.category === category);
  };

  const handleAddCustomFont = () => {
    const trimmed = customFontInput.trim();
    if (trimmed) {
      addCustomFont(trimmed);
      setCustomFontInput("");
      toast.success(t("fontSettings.fontAdded") || "Font added successfully");
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Settings are auto-saved via zustand persist
      toast.success(t("characterChat.saveSuccess") || "Settings saved successfully");
      if (onViewSwitch) {
        onViewSwitch();
      }
    } catch (error) {
      console.error("Failed to save font settings:", error);
      toast.error(t("characterChat.saveFailed") || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetFontSettings();
    toast.success(t("fontSettings.reset") || "Settings reset to default");
  };

  const renderFontSelector = (
    label: string,
    description: string,
    fontKey: "normalFont" | "dialogueFont" | "italicFont" | "codeFont",
    sizeKey: "normalFontSize" | "dialogueFontSize" | "italicFontSize" | "codeFontSize",
    defaultCategory: FontCategory = "all",
  ) => {
    const currentFont = fontSettings[fontKey];
    const currentSize = fontSettings[sizeKey];
    const isOpen = activeDropdown === fontKey;

    return (
      <div className="mb-6 p-4 rounded-lg bg-[#1a1816]/50 border border-[#534741]/30 hover:border-[#534741]/60 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className={`text-sm font-medium text-[#eae6db] ${fontClass}`}>{label}</h4>
            <p className={`text-xs text-[#a18d6f] mt-1 ${fontClass}`}>{description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Font Selector */}
          <div className="flex-1 relative" ref={isOpen ? dropdownRef : undefined}>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setActiveDropdown(isOpen ? null : fontKey)}
                className="flex-1 px-3 py-2 bg-gradient-to-br from-[#1a1816] via-[#252220] to-[#1a1816] text-[#eae6db] rounded-lg border border-[#534741]/60 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 text-left flex items-center justify-between"
                style={{ fontFamily: currentFont ? `'${currentFont}', serif` : "inherit" }}
              >
                <span className="truncate">
                  {currentFont || (t("fontSettings.defaultFont") || "Default (System)")}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Size Selector - inline with font selector */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className={`text-xs text-[#a18d6f] whitespace-nowrap ${fontClass}`}>
                  {t("fontSettings.size") || "Size"}:
                </label>
                <input
                  type="number"
                  min="10"
                  max="32"
                  value={currentSize}
                  onChange={(e) => updateFontSettings({ [sizeKey]: parseInt(e.target.value) || 16 })}
                  className="w-16 px-2 py-1.5 bg-[#1a1816] text-[#eae6db] rounded border border-[#534741]/60 focus:border-amber-500/60 focus:outline-none text-sm text-center"
                />
                <span className="text-xs text-[#a18d6f]">px</span>
              </div>
            </div>

            {isOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-[#1a1816] border border-[#534741] rounded-lg shadow-xl overflow-hidden z-50">
                {/* Category Filter */}
                <div className="flex gap-1 p-2 border-b border-[#534741]/50 overflow-x-auto fantasy-scrollbar">
                  {(["all", "serif", "sans-serif", "cursive", "monospace", "custom"] as FontCategory[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterCategory(cat);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                        filterCategory === cat
                          ? "bg-amber-500/20 text-pink-300 border border-amber-500/30"
                          : "text-[#a18d6f] hover:text-[#eae6db] hover:bg-[#2a261f]"
                      }`}
                    >
                      {t(`fontSettings.category.${cat}`) || cat}
                    </button>
                  ))}
                </div>

                {/* Font List */}
                <div className="max-h-48 overflow-y-auto fantasy-scrollbar">
                  {/* Default option */}
                  <button
                    onClick={() => {
                      updateFontSettings({ [fontKey]: "" });
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[#2a261f] transition-colors ${
                      !currentFont ? "text-pink-300 bg-amber-500/10" : "text-[#eae6db]"
                    }`}
                  >
                    {t("fontSettings.defaultFont") || "Default (System)"}
                  </button>

                  {filteredFonts(filterCategory).map((font) => (
                    <button
                      key={font.name}
                      onClick={() => {
                        updateFontSettings({ [fontKey]: font.name });
                        setActiveDropdown(null);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-[#2a261f] transition-colors flex items-center justify-between ${
                        currentFont === font.name ? "text-pink-300 bg-amber-500/10" : "text-[#eae6db]"
                      }`}
                      style={{ fontFamily: `'${font.name}', ${font.category}` }}
                    >
                      <span>{font.name}</span>
                      {font.isCustom && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                          {t("fontSettings.custom") || "Custom"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {currentFont && (
          <div className="mt-3 p-3 rounded bg-[#0f0e0d] border border-[#534741]/20">
            <p
              className="text-[#eae6db]"
              style={{
                fontFamily: `'${currentFont}', serif`,
                fontSize: `${currentSize}px`,
              }}
            >
              {t("fontSettings.preview") || "The quick brown fox jumps over the lazy dog. 日本語 한국어 Tiếng Việt"}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`p-2 sm:p-4 ${fontClass} relative`}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/30 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
              <polyline points="4 7 4 4 20 4 20 7"></polyline>
              <line x1="9" y1="20" x2="15" y2="20"></line>
              <line x1="12" y1="4" x2="12" y2="20"></line>
            </svg>
          </div>
          <h3 className={`text-base sm:text-lg font-semibold ${serifFontClass} bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-pink-400 to-purple-300`}>
            {t("fontSettings.title") || "Message Fonts"}
          </h3>
        </div>

        {/* Add Custom Font */}
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-transparent border border-purple-500/20">
          <h4 className={`text-sm font-medium text-[#eae6db] mb-2 ${fontClass}`}>
            {t("fontSettings.addCustomFont") || "Add Custom Font from Google Fonts"}
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={customFontInput}
              onChange={(e) => setCustomFontInput(e.target.value)}
              placeholder={t("fontSettings.customFontPlaceholder") || "Enter font name (e.g., Roboto Slab)"}
              className="flex-1 px-3 py-2 bg-[#1a1816] text-[#eae6db] rounded-lg border border-[#534741]/60 focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 text-sm"
            />
            <button
              onClick={handleAddCustomFont}
              disabled={!customFontInput.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 text-purple-300 rounded-lg border border-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
          <p className={`text-xs text-[#8a8a8a] mt-2 ${fontClass}`}>
            {t("fontSettings.customFontHelp") || "Enter the exact font name from Google Fonts. Supports Unicode and multilingual characters."}
          </p>
        </div>

        {/* Font Selectors */}
        {renderFontSelector(
          t("fontSettings.normalText") || "Normal Text",
          t("fontSettings.normalTextDesc") || "Font for regular message text",
          "normalFont",
          "normalFontSize",
        )}

        {renderFontSelector(
          t("fontSettings.dialogueText") || "Dialogue Text",
          t("fontSettings.dialogueTextDesc") || "Font for text in quotation marks \" \"",
          "dialogueFont",
          "dialogueFontSize",
          "serif",
        )}

        {renderFontSelector(
          t("fontSettings.italicText") || "Italic/Emphasis Text",
          t("fontSettings.italicTextDesc") || "Font for italic text in * * (actions, thoughts)",
          "italicFont",
          "italicFontSize",
          "cursive",
        )}

        {renderFontSelector(
          t("fontSettings.codeText") || "Code Text",
          t("fontSettings.codeTextDesc") || "Font for code in ` and ``` blocks",
          "codeFont",
          "codeFontSize",
          "monospace",
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-[#2a261f] hover:bg-[#333] text-[#a18d6f] hover:text-[#eae6db] rounded-lg border border-[#534741]/50 transition-all duration-300 text-sm"
          >
            {t("fontSettings.resetDefault") || "Reset to Default"}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 group relative px-6 py-2 bg-gradient-to-r from-[#1f1c1a] to-[#13100e] hover:from-[#282521] hover:to-[#1a1613] text-[#e9c08d] hover:text-[#f6daae] rounded-lg transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-[#f8b758]/20 border border-[#403a33] ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSaving ? (
                <svg className="animate-spin h-4 w-4 text-[#e9c08d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
              )}
              <span>{isSaving ? (t("characterChat.saving") || "Saving...") : (t("characterChat.saveChanges") || "Save Changes")}</span>
            </span>
          </button>
        </div>
      </div>

    </div>
  );
};
