import { constants } from 'node:fs'
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

if (process.env.TAURI_ENV_PLATFORM !== 'android') {
  process.exit(0)
}

const rootDir = resolve(import.meta.dirname, '..')
const coreSource = resolve(
  rootDir,
  'src-tauri',
  'sidecar',
  'verge-mihomo-aarch64-linux-android',
)
const appDir = resolve(rootDir, 'src-tauri', 'gen', 'android', 'app')
const coreDestination = resolve(
  appDir,
  'src',
  'main',
  'jniLibs',
  'arm64-v8a',
  'libverge_mihomo.so',
)
const manifestPath = resolve(appDir, 'src', 'main', 'AndroidManifest.xml')

await access(coreSource, constants.R_OK)
await mkdir(dirname(coreDestination), { recursive: true })
await copyFile(coreSource, coreDestination)

let manifest = await readFile(manifestPath, 'utf8')
if (!manifest.includes('android:extractNativeLibs')) {
  manifest = manifest.replace(
    '<application',
    '<application android:extractNativeLibs="true"',
  )
  await writeFile(manifestPath, manifest)
}
