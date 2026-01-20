import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MessageFontSettings {
  // Text thường (normal text)
  normalFont: string;
  normalFontSize: number;
  // Text trong dấu " " (dialogue/talk)
  dialogueFont: string;
  dialogueFontSize: number;
  // Text in nghiêng * * (italic/emphasis)
  italicFont: string;
  italicFontSize: number;
  // Text trong tag ` và ``` (code)
  codeFont: string;
  codeFontSize: number;
}

// Popular Google Fonts with good Unicode/multilingual support
export const POPULAR_GOOGLE_FONTS = [
  // Serif fonts
  { name: "Lora", category: "serif" },
  { name: "Playfair Display", category: "serif" },
  { name: "Merriweather", category: "serif" },
  { name: "Crimson Text", category: "serif" },
  { name: "EB Garamond", category: "serif" },
  { name: "Cormorant Garamond", category: "serif" },
  { name: "Libre Baskerville", category: "serif" },
  { name: "Source Serif Pro", category: "serif" },
  { name: "Noto Serif", category: "serif" },

  // Sans-serif fonts
  { name: "Roboto", category: "sans-serif" },
  { name: "Open Sans", category: "sans-serif" },
  { name: "Lato", category: "sans-serif" },
  { name: "Montserrat", category: "sans-serif" },
  { name: "Poppins", category: "sans-serif" },
  { name: "Nunito", category: "sans-serif" },
  { name: "Raleway", category: "sans-serif" },
  { name: "Inter", category: "sans-serif" },
  { name: "Noto Sans", category: "sans-serif" },
  { name: "Source Sans Pro", category: "sans-serif" },

  // Display/Decorative fonts
  { name: "Dancing Script", category: "cursive" },
  { name: "Pacifico", category: "cursive" },
  { name: "Great Vibes", category: "cursive" },
  { name: "Caveat", category: "cursive" },
  { name: "Satisfy", category: "cursive" },

  // Monospace fonts
  { name: "Fira Code", category: "monospace" },
  { name: "JetBrains Mono", category: "monospace" },
  { name: "Source Code Pro", category: "monospace" },
  { name: "Roboto Mono", category: "monospace" },
  { name: "IBM Plex Mono", category: "monospace" },
];

// Default font settings
const DEFAULT_FONT_SETTINGS: MessageFontSettings = {
  normalFont: "",
  normalFontSize: 16,
  dialogueFont: "",
  dialogueFontSize: 16,
  italicFont: "",
  italicFontSize: 16,
  codeFont: "",
  codeFontSize: 14,
};

interface MessageFontStore {
  fontSettings: MessageFontSettings;
  customFonts: string[];
  loadedFonts: Set<string>;
  updateFontSettings: (settings: Partial<MessageFontSettings>) => void;
  resetFontSettings: () => void;
  addCustomFont: (fontName: string) => void;
  removeCustomFont: (fontName: string) => void;
  loadGoogleFont: (fontName: string) => void;
  getFontCSS: () => string;
}

export const useMessageFontStore = create<MessageFontStore>()(
  persist(
    (set, get) => ({
      fontSettings: DEFAULT_FONT_SETTINGS,
      customFonts: [],
      loadedFonts: new Set<string>(),

      updateFontSettings: (settings) => {
        const { fontSettings, loadGoogleFont } = get();
        const newSettings = { ...fontSettings, ...settings };

        // Load any new fonts
        if (settings.normalFont && settings.normalFont !== fontSettings.normalFont) {
          loadGoogleFont(settings.normalFont);
        }
        if (settings.dialogueFont && settings.dialogueFont !== fontSettings.dialogueFont) {
          loadGoogleFont(settings.dialogueFont);
        }
        if (settings.italicFont && settings.italicFont !== fontSettings.italicFont) {
          loadGoogleFont(settings.italicFont);
        }
        if (settings.codeFont && settings.codeFont !== fontSettings.codeFont) {
          loadGoogleFont(settings.codeFont);
        }

        set({ fontSettings: newSettings });
      },

      resetFontSettings: () => set({ fontSettings: DEFAULT_FONT_SETTINGS }),

      addCustomFont: (fontName) => {
        const { customFonts, loadGoogleFont } = get();
        const trimmedName = fontName.trim();
        if (trimmedName && !customFonts.includes(trimmedName)) {
          set({ customFonts: [...customFonts, trimmedName] });
          loadGoogleFont(trimmedName);
        }
      },

      removeCustomFont: (fontName) => {
        const { customFonts } = get();
        set({ customFonts: customFonts.filter(f => f !== fontName) });
      },

      loadGoogleFont: (fontName) => {
        if (!fontName || typeof window === "undefined") return;

        const { loadedFonts } = get();
        if (loadedFonts.has(fontName)) return;

        // Create link element for Google Fonts
        const formattedName = fontName.replace(/\s+/g, "+");
        const link = document.createElement("link");
        link.href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;500;600;700&display=swap`;
        link.rel = "stylesheet";
        link.id = `google-font-${formattedName}`;

        // Check if already loaded
        if (!document.getElementById(link.id)) {
          document.head.appendChild(link);
        }

        // Update loaded fonts set
        const newLoadedFonts = new Set(loadedFonts);
        newLoadedFonts.add(fontName);
        set({ loadedFonts: newLoadedFonts });
      },

      getFontCSS: () => {
        const { fontSettings } = get();
        let css = "";

        if (fontSettings.normalFont) {
          css += `--message-normal-font: '${fontSettings.normalFont}', serif;\n`;
        }
        if (fontSettings.dialogueFont) {
          css += `--message-dialogue-font: '${fontSettings.dialogueFont}', serif;\n`;
        }
        if (fontSettings.italicFont) {
          css += `--message-italic-font: '${fontSettings.italicFont}', serif;\n`;
        }
        if (fontSettings.codeFont) {
          css += `--message-code-font: '${fontSettings.codeFont}', monospace;\n`;
        }

        css += `--message-normal-size: ${fontSettings.normalFontSize}px;\n`;
        css += `--message-dialogue-size: ${fontSettings.dialogueFontSize}px;\n`;
        css += `--message-italic-size: ${fontSettings.italicFontSize}px;\n`;
        css += `--message-code-size: ${fontSettings.codeFontSize}px;\n`;

        return css;
      },
    }),
    {
      name: "message-fonts",
      partialize: (state) => ({
        fontSettings: state.fontSettings,
        customFonts: state.customFonts,
      }),
    },
  ),
);

// Helper function to get all available fonts
export function getAllAvailableFonts(customFonts: string[]): { name: string; category: string; isCustom?: boolean }[] {
  const fonts: { name: string; category: string; isCustom?: boolean }[] = [...POPULAR_GOOGLE_FONTS];
  customFonts.forEach(font => {
    if (!fonts.some(f => f.name === font)) {
      fonts.push({ name: font, category: "custom", isCustom: true });
    }
  });
  return fonts;
}
