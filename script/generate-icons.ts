import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

const ICONS_DIR = resolve(import.meta.dirname, '..', 'src-tauri', 'icons')
const ASSETS_DIR = resolve(import.meta.dirname, '..', 'src', 'assets', 'image')

const LOGO_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2D1B1E"/>
      <stop offset="100%" stop-color="#1A1A2E"/>
    </linearGradient>
  </defs>
  <!-- Rounded square background -->
  <rect x="32" y="32" width="448" height="448" rx="96" ry="96" fill="url(#bg)"/>
  <!-- Red accent bar -->
  <rect x="96" y="96" width="320" height="16" rx="8" fill="#DE3C4B"/>
  <!-- Lightning bolt (simplified) -->
  <path d="M280 160 L200 280 L240 280 L220 360 L340 240 L290 240 L330 160 Z" fill="#FF4757"/>
</svg>`

// SVG for wordmark (logo.svg in assets)
const WORDMARK_SVG = `<svg viewBox="0 0 240 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 8 L20 8 L32 36 L34 36 L46 8 L54 8 L36 48 L26 48 Z" fill="#FF4757"/>
  <text x="68" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#E0E0E0">RedClash</text>
</svg>`

const ICON_SIZES = [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
  { name: 'icon.png', size: 512 },
  { name: 'Square30x30Logo.png', size: 30 },
  { name: 'Square44x44Logo.png', size: 44 },
  { name: 'Square71x71Logo.png', size: 71 },
  { name: 'Square89x89Logo.png', size: 89 },
  { name: 'Square107x107Logo.png', size: 107 },
  { name: 'Square142x142Logo.png', size: 142 },
  { name: 'Square150x150Logo.png', size: 150 },
  { name: 'Square284x284Logo.png', size: 284 },
  { name: 'Square310x310Logo.png', size: 310 },
  { name: 'StoreLogo.png', size: 56 },
]

async function generateIcons() {
  mkdirSync(ICONS_DIR, { recursive: true })
  mkdirSync(ASSETS_DIR, { recursive: true })

  // Generate app SVGs
  writeFileSync(resolve(ASSETS_DIR, 'logo.svg'), WORDMARK_SVG, 'utf-8')
  writeFileSync(resolve(ICONS_DIR, 'logo.svg'), LOGO_SVG, 'utf-8')

  // Generate PNGs at all sizes
  for (const { name, size } of ICON_SIZES) {
    await sharp(Buffer.from(LOGO_SVG))
      .resize(size, size)
      .png()
      .toFile(resolve(ICONS_DIR, name))
    console.log(`  ✓ ${name} (${size}x${size})`)
  }

  // Generate icon.ico (multi-res ICO from various sizes)
  const iconBuffer = await sharp(Buffer.from(LOGO_SVG))
    .resize(256, 256)
    .png()
    .toBuffer()

  // For ICO we'll write a single 256px PNG as icon.ico (simplified approach)
  // Tauri supports PNG as icon.ico on Windows
  writeFileSync(resolve(ICONS_DIR, 'icon.ico'), iconBuffer)
  console.log('  ✓ icon.ico')

  // Generate tray icons (simplified - single color versions)
  const traySvg = LOGO_SVG.replace('#FF4757', '#FFFFFF').replace('#DE3C4B', '#DE3C4B')
  const trayMonoSvg = LOGO_SVG.replace('#FF4757', '#CCCCCC').replace('#DE3C4B', '#666666')

  const trayNames = [
    'tray-icon.ico', 'tray-icon-tun.ico', 'tray-icon-sys.ico',
    'tray-icon-mono.ico', 'tray-icon-tun-mono.ico', 'tray-icon-sys-mono.ico',
    'tray-icon-tun-mono-new.ico', 'tray-icon-sys-mono-new.ico',
  ]

  for (const name of trayNames) {
    const svg = name.includes('mono') ? trayMonoSvg : traySvg
    const buf = await sharp(Buffer.from(svg)).resize(32, 32).png().toBuffer()
    writeFileSync(resolve(ICONS_DIR, name), buf)
    console.log(`  ✓ ${name}`)
  }
}

generateIcons().catch(console.error)
