import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, existsSync, writeFileSync as wfs } from 'fs'
import { execSync } from 'child_process'
import { resolve } from 'path'

const ICO_PATH = 'C:\\Users\\Administrator\\Pictures\\jiang.ico'
const ICONS_DIR = resolve(import.meta.dirname, '..', 'src-tauri', 'icons')
const ASSETS_DIR = resolve(import.meta.dirname, '..', 'src', 'assets', 'image')
const WORK_DIR = resolve(import.meta.dirname, '..', '.icon-work')

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
  if (!existsSync(ICO_PATH)) {
    throw new Error(`Source ico not found: ${ICO_PATH}`)
  }

  mkdirSync(ICONS_DIR, { recursive: true })
  mkdirSync(ASSETS_DIR, { recursive: true })
  mkdirSync(WORK_DIR, { recursive: true })

  // 1) Pillow -> master PNG (1024x1024 with transparent bg)
  const masterPng = resolve(WORK_DIR, 'jiang-1024.png')
  execSync(
    `python -c "from PIL import Image; im = Image.open(r'${ICO_PATH}').convert('RGBA'); im.resize((1024,1024), Image.LANCZOS).save(r'${masterPng}')"`,
    { stdio: 'inherit' },
  )
  console.log(`  ✓ master PNG: ${masterPng}`)

  const masterBuffer = readFileSync(masterPng)

  // 2) sharp -> all Tauri sizes
  for (const { name, size } of ICON_SIZES) {
    await sharp(masterBuffer)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(resolve(ICONS_DIR, name))
    console.log(`  ✓ ${name} (${size}x${size})`)
  }

  // 3) wordmark (RedClash text logo for sidebar)
  const wordmark = `<svg viewBox="0 0 240 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="36" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="currentColor">RedClash</text>
</svg>`
  writeFileSync(resolve(ASSETS_DIR, 'logo.svg'), wordmark, 'utf-8')

  // 4) Tray icons - use small PNG of the same artwork
  // tray icons are 16x16/32x32 - generate 32x32 monochrome + colored versions
  const trayNames = [
    { name: 'tray-icon.ico', mode: 'color' },
    { name: 'tray-icon-mono.ico', mode: 'mono' },
    { name: 'tray-icon-tun.ico', mode: 'color' },
    { name: 'tray-icon-tun-mono.ico', mode: 'mono' },
    { name: 'tray-icon-tun-mono-new.ico', mode: 'mono' },
    { name: 'tray-icon-sys.ico', mode: 'color' },
    { name: 'tray-icon-sys-mono.ico', mode: 'mono' },
    { name: 'tray-icon-sys-mono-new.ico', mode: 'mono' },
  ]
  // 4b) Tray icons - render to PNG buffer first, then use Pillow to write multi-size ICO
  // (sharp 0.34 has no ICO encoder; we already have Pillow installed for reading the source)
  // Use a Python script file (PowerShell escaping of -c arg is fragile on Windows)
  const trayScriptPath = resolve(WORK_DIR, '_tray_icos.py')
  const trayLines: string[] = ['from PIL import Image', `src = Image.open(r'${masterPng}').convert('RGBA')`]
  for (const { name, mode } of trayNames) {
    const targetPath = resolve(ICONS_DIR, name)
    trayLines.push(`_im = src.resize((32, 32), Image.LANCZOS)`)
    if (mode === 'mono') trayLines.push(`_im = _im.convert('LA').convert('RGBA')`)
    trayLines.push(`_im.save(r'${targetPath}', format='ICO', sizes=[(16, 16), (32, 32)])`)
    trayLines.push(`print('wrote ${targetPath}')`)
  }
  wfs(trayScriptPath, trayLines.join('\n'))
  execSync(`python "${trayScriptPath}"`, { stdio: 'inherit' })
  for (const { name, mode } of trayNames) console.log(`  ✓ ${name} (${mode})`)

  // 5) icon.ico - Tauri reads this as the .exe icon. Pillow writes a real multi-size ICO
  // (Windows Resource Compiler needs format 3.00).
  const icoPath = resolve(ICONS_DIR, 'icon.ico')
  const iconScriptPath = resolve(WORK_DIR, '_main_ico.py')
  wfs(
    iconScriptPath,
    [
      'from PIL import Image',
      `src = Image.open(r'${masterPng}').convert('RGBA')`,
      `sizes = [16, 32, 48, 64, 128, 256]`,
      `imgs = [src.resize((s, s), Image.LANCZOS) for s in sizes]`,
      `imgs[0].save(r'${icoPath}', format='ICO', sizes=[(s, s) for s in sizes])`,
      `print('wrote ${icoPath}')`,
    ].join('\n'),
  )
  execSync(`python "${iconScriptPath}"`, { stdio: 'inherit' })
  console.log('  ✓ icon.ico (multi-size proper ICO)')

  // 6) Save the source PNG in assets for use in splash/UI
  const sourcePng = resolve(ASSETS_DIR, 'icon.png')
  writeFileSync(sourcePng, await sharp(masterBuffer).resize(512, 512).png().toBuffer())
  console.log('  ✓ assets/icon.png')

  console.log('\nDone.')
}

generateIcons().catch((err) => {
  console.error(err)
  process.exit(1)
})
