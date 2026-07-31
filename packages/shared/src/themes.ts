import type { ButtonShape, ButtonStyle } from "./schemas/index"

const defaultThemeName = "Pearl White"

export const fonts = [
  // 🧼 Modern Sans-Serif
  {
    category: "sans",
    name: "Inter",
    fontFamily: "'Inter Variable', sans-serif",
    className: "font-inter",
  },
  {
    category: "sans",
    name: "DM Sans",
    fontFamily: "'DM Sans Variable', sans-serif",
    className: "font-dm-sans",
  },
  {
    category: "sans",
    name: "Manrope",
    fontFamily: "'Manrope Variable', sans-serif",
    className: "font-manrope",
  },
  {
    category: "sans",
    name: "Plus Jakarta Sans",
    fontFamily: "'Plus Jakarta Sans Variable', sans-serif",
    className: "font-plus-jakarta-sans",
  },
  {
    category: "sans",
    name: "Outfit",
    fontFamily: "'Outfit Variable', sans-serif",
    className: "font-outfit",
  },
  {
    category: "sans",
    name: "Poppins",
    fontFamily: "'Poppins', sans-serif",
    className: "font-poppins",
  },
  {
    category: "sans",
    name: "Montserrat",
    fontFamily: "'Montserrat Variable', sans-serif",
    className: "font-montserrat",
  },

  // 📚 Serif
  {
    category: "serif",
    name: "Playfair Display",
    fontFamily: "'Playfair Display Variable', serif",
    className: "font-playfair-display",
  },
  {
    category: "serif",
    name: "Merriweather",
    fontFamily: "'Merriweather Variable', serif",
    className: "font-merriweather",
  },
  {
    category: "serif",
    name: "Libre Baskerville",
    fontFamily: "'Libre Baskerville', serif",
    className: "font-libre-baskerville",
  },
  {
    category: "serif",
    name: "Lora",
    fontFamily: "'Lora Variable', serif",
    className: "font-lora",
  },

  // 🎯 Display / Bold
  {
    category: "display",
    name: "Bebas Neue",
    fontFamily: "'Bebas Neue', sans-serif",
    className: "font-bebas-neue",
  },
  {
    category: "display",
    name: "Anton",
    fontFamily: "'Anton', sans-serif",
    className: "font-anton",
  },
  {
    category: "display",
    name: "Archivo Black",
    fontFamily: "'Archivo Black', sans-serif",
    className: "font-archivo-black",
  },
  {
    category: "display",
    name: "Space Grotesk",
    fontFamily: "'Space Grotesk Variable', sans-serif",
    className: "font-space-grotesk",
  },
]

/**
 * Theme settings for a Linktree-style profile page.
 * `buttonShape` controls the silhouette of each link button:
 * square = sharp corners, rounded = soft corners, pill = fully capsule-shaped.
 * `buttonStyle` controls the visual treatment:
 * solid = filled button, outline = transparent fill with a border,
 * shadow = filled button with depth from a drop shadow,
 * ghost = low-emphasis transparent button with minimal chrome,
 * paper = flat cutout/card-like button,
 * 3d = solid button with a slightly detached solid shadow offset to the right
 * to create a raised, layered look.
 */
export type Theme = {
  name: string
  backgroundColor: string
  fontFamily: string
  textColor: string
  buttonShape: ButtonShape
  buttonStyle: ButtonStyle
  buttonColor: string
  buttonTextColor: string
}

export const basicThemes: Theme[] = [
  {
    name: "Midnight Slate",
    backgroundColor: "#0F172A",
    fontFamily: "Manrope",
    textColor: "#F1F5F9",
    buttonShape: "pill",
    buttonStyle: "outline",
    buttonColor: "#3B82F6",
    buttonTextColor: "#3B82F6",
  },
  {
    name: "Pearl White",
    backgroundColor: "#FFFFFF",
    fontFamily: "Inter",
    textColor: "#1E293B",
    buttonShape: "pill",
    buttonStyle: "solid",
    buttonColor: "#1E293B",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Sage Calm",
    backgroundColor: "#F0F4F3",
    fontFamily: "Plus Jakarta Sans",
    textColor: "#334155",
    buttonShape: "rounded",
    buttonStyle: "shadow",
    buttonColor: "#4F7942",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Warm Sand",
    backgroundColor: "#FEF7ED",
    fontFamily: "DM Sans",
    textColor: "#44403C",
    buttonShape: "rounded",
    buttonStyle: "solid",
    buttonColor: "#92400E",
    buttonTextColor: "#FFFFFF",
  },
]

export const themes: Theme[] = [
  ...basicThemes,
  {
    name: "Indigo Depth",
    backgroundColor: "#1E1B4B",
    fontFamily: "Manrope",
    textColor: "#E0E7FF",
    buttonShape: "rounded",
    buttonStyle: "3d",
    buttonColor: "#818CF8",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Soft Blush",
    backgroundColor: "#FDF2F8",
    fontFamily: "Outfit",
    textColor: "#831843",
    buttonShape: "rounded",
    buttonStyle: "solid",
    buttonColor: "#EC4899",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Forest Night",
    backgroundColor: "#052E16",
    fontFamily: "Plus Jakarta Sans",
    textColor: "#DCFCE7",
    buttonShape: "pill",
    buttonStyle: "ghost",
    buttonColor: "#22C55E",
    buttonTextColor: "#22C55E",
  },
  {
    name: "Graphite",
    backgroundColor: "#18181B",
    fontFamily: "Inter",
    textColor: "#FAFAFA",
    buttonShape: "square",
    buttonStyle: "paper",
    buttonColor: "#27272A",
    buttonTextColor: "#FAFAFA",
  },
  {
    name: "Terra Cotta",
    backgroundColor: "#FFF7ED",
    fontFamily: "Poppins",
    textColor: "#431407",
    buttonShape: "pill",
    buttonStyle: "solid",
    buttonColor: "#EA580C",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Amethyst",
    backgroundColor: "#FAF5FF",
    fontFamily: "Outfit",
    textColor: "#3B0764",
    buttonShape: "rounded",
    buttonStyle: "solid",
    buttonColor: "#9333EA",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Steel Blue",
    backgroundColor: "#F0F9FF",
    fontFamily: "Manrope",
    textColor: "#0C4A6E",
    buttonShape: "rounded",
    buttonStyle: "solid",
    buttonColor: "#0284C7",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Slate Gray",
    backgroundColor: "#F8FAFC",
    fontFamily: "DM Sans",
    textColor: "#334155",
    buttonShape: "pill",
    buttonStyle: "outline",
    buttonColor: "#64748B",
    buttonTextColor: "#64748B",
  },

  // Editorial themes
  {
    name: "Editorial Cream",
    backgroundColor: "#FDFCF8",
    fontFamily: "Playfair Display",
    textColor: "#1C1917",
    buttonShape: "square",
    buttonStyle: "outline",
    buttonColor: "#1C1917",
    buttonTextColor: "#1C1917",
  },
  {
    name: "Editorial Invert",
    backgroundColor: "#1C1917",
    fontFamily: "Playfair Display",
    textColor: "#FDFCF8",
    buttonShape: "square",
    buttonStyle: "solid",
    buttonColor: "#FDFCF8",
    buttonTextColor: "#1C1917",
  },
  {
    name: "Magazine Luxe",
    backgroundColor: "#F5F3EF",
    fontFamily: "Lora",
    textColor: "#292524",
    buttonShape: "rounded",
    buttonStyle: "solid",
    buttonColor: "#78716C",
    buttonTextColor: "#FFFFFF",
  },

  // Real Estate themes
  {
    name: "Luxury Estate",
    backgroundColor: "#FAFAF9",
    fontFamily: "DM Sans",
    textColor: "#1C1917",
    buttonShape: "pill",
    buttonStyle: "solid",
    buttonColor: "#1C1917",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Modern Home",
    backgroundColor: "#18181B",
    fontFamily: "Inter",
    textColor: "#FAFAFA",
    buttonShape: "rounded",
    buttonStyle: "outline",
    buttonColor: "#A1A1AA",
    buttonTextColor: "#A1A1AA",
  },
  {
    name: "Coastal Retreat",
    backgroundColor: "#F0FDFA",
    fontFamily: "Plus Jakarta Sans",
    textColor: "#134E4A",
    buttonShape: "rounded",
    buttonStyle: "shadow",
    buttonColor: "#0D9488",
    buttonTextColor: "#FFFFFF",
  },
  {
    name: "Urban Loft",
    backgroundColor: "#292524",
    fontFamily: "Manrope",
    textColor: "#FAFAFA",
    buttonShape: "square",
    buttonStyle: "paper",
    buttonColor: "#44403C",
    buttonTextColor: "#FAFAFA",
  },
]

export function getDefaultTheme() {
  const theme = themes.find((t) => t.name === defaultThemeName)
  if (!theme) {
    throw new Error(`Default theme '${defaultThemeName}' not found`)
  }

  return theme
}

export function getUserPageFontClassName(fontName: string) {
  return fonts.find((font) => font.name === fontName)?.className ?? "font-sans"
}

export function getUserPageFontTracking(fontName: string) {
  switch (fontName) {
    case "Bebas Neue":
      return {
        heading: "tracking-[0.02em]",
        body: "tracking-[0.01em]",
      }
    case "Anton":
      return {
        heading: "tracking-[0.025em]",
        body: "tracking-[0.015em]",
      }
    case "Archivo Black":
      return {
        heading: "tracking-[0.005em]",
        body: "tracking-normal",
      }
    default:
      return {
        heading: "tracking-[-0.03em]",
        body: "tracking-normal",
      }
  }
}
