// Post-build patch for @originjs/vite-plugin-federation CSS bug:
// The plugin generates `e.forEach(...)` where `e` can be undefined
// when no CSS files exist for an exposed module. This replaces it
// with `(e||[]).forEach(...)` to make it safe.
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const mfe = process.argv[2]
if (!mfe) { console.error('Usage: node patch-remote.js <mfe-dir>'); process.exit(1) }

// Always resolve relative to this script's directory (client/), not cwd
const dir = join(__dirname, mfe, 'dist', 'assets')
const files = readdirSync(dir).filter(f => f.endsWith('.js'))

let patched = 0
for (const file of files) {
  const path = join(dir, file)
  const original = readFileSync(path, 'utf8')
  // Replace bare `e.forEach(` in CSS-loading context with null-safe version
  // e might be undefined, a string, or an array — normalise to array
  const fixed = original.replaceAll('e.forEach(e=>{', '(Array.isArray(e)?e:e?[e]:[]).forEach(e=>{')
  if (fixed !== original) {
    writeFileSync(path, fixed)
    console.log(`✅ Patched ${file}`)
    patched++
  }
}
if (patched === 0) console.log('ℹ️  No patch needed in', mfe)
