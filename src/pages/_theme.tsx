import getSystem from '@/utils/get-system'
const OS = getSystem()

export type ThemePalette = 'red' | 'blue' | 'green' | 'beige'

export const themePalettes: { value: ThemePalette; label: string }[] = [
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'DeepBlue' },
  { value: 'green', label: 'EyeCare' },
  { value: 'beige', label: 'Beige' },
]

type ThemeColors = {
  primary_color: string
  secondary_color: string
  primary_text: string
  secondary_text: string
  info_color: string
  error_color: string
  warning_color: string
  success_color: string
  background_color: string
}

const FONT_FAMILY = `-apple-system, BlinkMacSystemFont,"Microsoft YaHei UI", "Microsoft YaHei", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"${
  OS === 'windows' ? ', twemoji mozilla' : ''
}`

const buildTheme = (colors: ThemeColors) => ({ ...colors, font_family: FONT_FAMILY })

// 4 palettes × 2 modes

// Red - default brand
const red = {
  light: buildTheme({
    primary_color: '#DE3C4B',
    secondary_color: '#FF6B6B',
    primary_text: '#000000',
    secondary_text: '#3C3C4399',
    info_color: '#DE3C4B',
    error_color: '#FF3B30',
    warning_color: '#FF9500',
    success_color: '#06943D',
    background_color: '#F5F5F5',
  }),
  dark: buildTheme({
    primary_color: '#FF4757',
    secondary_color: '#FF6B6B',
    primary_text: '#FFFFFF',
    secondary_text: '#EBEBF599',
    info_color: '#FF4757',
    error_color: '#FF453A',
    warning_color: '#FF9F0A',
    success_color: '#30D158',
    background_color: '#1A1A2E',
  }),
}

// DeepBlue - cool, professional
const blue = {
  light: buildTheme({
    primary_color: '#1E6FDC',
    secondary_color: '#5B9BFF',
    primary_text: '#000000',
    secondary_text: '#3C3C4399',
    info_color: '#1E6FDC',
    error_color: '#FF3B30',
    warning_color: '#FF9500',
    success_color: '#06943D',
    background_color: '#F0F4FA',
  }),
  dark: buildTheme({
    primary_color: '#5B9BFF',
    secondary_color: '#8AB4FF',
    primary_text: '#FFFFFF',
    secondary_text: '#EBEBF599',
    info_color: '#5B9BFF',
    error_color: '#FF453A',
    warning_color: '#FF9F0A',
    success_color: '#30D158',
    background_color: '#0D1B2A',
  }),
}

// EyeCare green - paper-like, low-strain
const green = {
  light: buildTheme({
    primary_color: '#5B8C5A',
    secondary_color: '#7CB07B',
    primary_text: '#2B3A2F',
    secondary_text: '#4A5A4F99',
    info_color: '#5B8C5A',
    error_color: '#C84B3D',
    warning_color: '#D08C2A',
    success_color: '#3D8C4D',
    background_color: '#E8E4D4',
  }),
  dark: buildTheme({
    primary_color: '#7CB07B',
    secondary_color: '#9BCB9A',
    primary_text: '#E8E4D4',
    secondary_text: '#C8C4B499',
    info_color: '#7CB07B',
    error_color: '#E07465',
    warning_color: '#E0A04B',
    success_color: '#6BCB7B',
    background_color: '#2A3328',
  }),
}

// Beige - warm, paper-like
const beige = {
  light: buildTheme({
    primary_color: '#B85C2E',
    secondary_color: '#D4864E',
    primary_text: '#3D2B1F',
    secondary_text: '#5C4A3F99',
    info_color: '#B85C2E',
    error_color: '#C84B3D',
    warning_color: '#D08C2A',
    success_color: '#5B8C5A',
    background_color: '#F5EFE0',
  }),
  dark: buildTheme({
    primary_color: '#D4864E',
    secondary_color: '#E8A06E',
    primary_text: '#F5EFE0',
    secondary_text: '#DCD0B899',
    info_color: '#D4864E',
    error_color: '#E07465',
    warning_color: '#E0A04B',
    success_color: '#7CB07B',
    background_color: '#2D2419',
  }),
}

const allPalettes = { red, blue, green, beige }

export function getThemeByPalette(palette: ThemePalette, mode: 'light' | 'dark') {
  return allPalettes[palette][mode]
}

// Keep old defaultTheme / defaultDarkTheme exports for backward compat
// (defaults to red palette, light mode)
export const defaultTheme = red.light
export const defaultDarkTheme = red.dark

export const defaultThemePalette: ThemePalette = 'red'
