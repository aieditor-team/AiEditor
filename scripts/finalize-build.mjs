import {createHash} from 'node:crypto'
import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'

const declarationPath = fileURLToPath(new URL('../dist/index.d.ts', import.meta.url))
const commonJsDeclarationPath = fileURLToPath(new URL('../dist/index.d.cts', import.meta.url))
const stylePath = fileURLToPath(new URL('../dist/style.css', import.meta.url))
const assetsPath = fileURLToPath(new URL('../dist/assets/', import.meta.url))

await copyFile(declarationPath, commonJsDeclarationPath)

const style = await readFile(stylePath, 'utf8')
const fontAssets = new Map()
const externalizedStyle = style.replace(
  /data:font\/(woff2?|ttf|otf);base64,([A-Za-z0-9+/=]+)/gi,
  (_dataUrl, extension, encoded) => {
    const contents = Buffer.from(encoded, 'base64')
    const hash = createHash('sha256').update(contents).digest('hex').slice(0, 12)
    const normalizedExtension = extension.toLowerCase()
    const filename = `katex-font-${hash}.${normalizedExtension}`
    fontAssets.set(filename, contents)
    return `./assets/${filename}`
  },
)

if (fontAssets.size > 0) {
  await mkdir(assetsPath, {recursive: true})
  await Promise.all([...fontAssets].map(([filename, contents]) =>
    writeFile(new URL(filename, new URL('../dist/assets/', import.meta.url)), contents)))
  await writeFile(stylePath, externalizedStyle)
}
