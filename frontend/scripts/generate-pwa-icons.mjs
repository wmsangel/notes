#!/usr/bin/env node
/**
 * Генерирует pwa-192x192.png и pwa-512x512.png для PWA (Chrome требует правильные размеры).
 * Запуск: node scripts/generate-pwa-icons.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PNG } from 'pngjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public')

// Цвет темы #6366f1
const R = 99, G = 102, B = 241, A = 255

function createIcon(size) {
  const png = new PNG({ width: size, height: size })
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2
      png.data[i] = R
      png.data[i + 1] = G
      png.data[i + 2] = B
      png.data[i + 3] = A
    }
  }
  return PNG.sync.write(png)
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const file = path.join(outDir, `pwa-${size}x${size}.png`)
  fs.writeFileSync(file, createIcon(size))
  console.log('Created', file)
}
