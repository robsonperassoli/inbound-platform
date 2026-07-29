const loadedFonts = new Set<string>()

type FontName =
  | "Inter"
  | "DM Sans"
  | "Manrope"
  | "Plus Jakarta Sans"
  | "Outfit"
  | "Poppins"
  | "Montserrat"
  | "Playfair Display"
  | "Merriweather"
  | "Libre Baskerville"
  | "Lora"
  | "Bebas Neue"
  | "Anton"
  | "Archivo Black"
  | "Space Grotesk"

const fontLoaders: Record<FontName, () => Promise<unknown>> = {
  Inter: () => import("@fontsource-variable/inter"),
  "DM Sans": () => import("@fontsource-variable/dm-sans"),
  Manrope: () => import("@fontsource-variable/manrope"),
  "Plus Jakarta Sans": () => import("@fontsource-variable/plus-jakarta-sans"),
  Outfit: () => import("@fontsource-variable/outfit"),
  Poppins: () => import("@fontsource/poppins"),
  Montserrat: () => import("@fontsource-variable/montserrat"),
  "Playfair Display": () => import("@fontsource-variable/playfair-display"),
  Merriweather: () => import("@fontsource-variable/merriweather"),
  "Libre Baskerville": () => import("@fontsource/libre-baskerville"),
  Lora: () => import("@fontsource-variable/lora"),
  "Bebas Neue": () => import("@fontsource/bebas-neue"),
  Anton: () => import("@fontsource/anton"),
  "Archivo Black": () => import("@fontsource/archivo-black"),
  "Space Grotesk": () => import("@fontsource-variable/space-grotesk"),
}

export async function loadFont(fontName: string) {
  if (loadedFonts.has(fontName)) return

  const loader = fontLoaders[fontName as FontName]
  if (!loader) {
    console.warn(`Font "${fontName}" not found in fontLoaders`)
    return
  }

  await loader()
  loadedFonts.add(fontName)
}
