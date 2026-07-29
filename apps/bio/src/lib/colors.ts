const toLinear = (channel: number) => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

export function hexToRgb(hex: string) {
  const value = hex.trim().replace("#", "")

  if (!/^[\da-f]{3}$|^[\da-f]{6}$/i.test(value)) {
    return null
  }

  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : value

  const number = Number.parseInt(normalized, 16)

  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  }
}

export function getRelativeLuminance(hex: string) {
  const rgb = hexToRgb(hex)

  if (!rgb) {
    return 1
  }

  return (
    0.2126 * toLinear(rgb.r) +
    0.7152 * toLinear(rgb.g) +
    0.0722 * toLinear(rgb.b)
  )
}
