import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, "src/assets/Knowledge L'avenir_files/knowledgelavenir1.png")
const tmp = path.join(root, 'public', '.favicon-tmp.png')
const publicDir = path.join(root, 'public')

function run(args) {
  execSync(`npx --yes sharp-cli ${args}`, { cwd: root, stdio: 'inherit' })
}

// Crop to top logo mark (853×696 source): centered square with icon + wordmark
run(`extract 120 20 620 520 --input "${src}" --output "${tmp}"`)
run(`flatten "#ffffff" --input "${tmp}" --output "${tmp}"`)
run(`normalise --input "${tmp}" --output "${tmp}"`)
run(`modulate --brightness 1.35 --saturation 1.1 --input "${tmp}" --output "${tmp}"`)

for (const [size, name] of [
  [32, 'favicon.png'],
  [48, 'favicon-48.png'],
  [192, 'apple-touch-icon.png'],
]) {
  run(
    `resize ${size} ${size} --fit contain --background "#ffffff" --input "${tmp}" --output "${path.join(publicDir, name)}"`,
  )
}

run(
  `resize 200 52 --fit inside --background "#ffffff" --input "${tmp}" --output "${path.join(publicDir, 'logo-nav.png')}"`,
)

fs.unlinkSync(tmp)
console.log('Favicons built from knowledgelavenir1.png')
