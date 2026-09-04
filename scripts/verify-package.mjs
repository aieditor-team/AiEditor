import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const temporaryRoot = mkdtempSync(join(tmpdir(), 'aieditor-package-'))
const projectPackage = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'))

const run = (command, args, cwd) => execFileSync(command, args, {
  cwd,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
})

try {
  const packResult = JSON.parse(run('npm', [
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    temporaryRoot,
  ], projectRoot))[0]
  const packagePaths = packResult.files.map(({path}) => path)
  const requiredPaths = [
    'CHANGELOG.md',
    'LICENSE',
    'MIGRATION.md',
    'README.md',
    'assets/image/aieditor.png',
    'dist/index.cjs',
    'dist/index.d.cts',
    'dist/index.d.ts',
    'dist/index.js',
    'dist/style.css',
    'package.json',
  ]

  for (const requiredPath of requiredPaths) {
    assert(packagePaths.includes(requiredPath), `Missing package file: ${requiredPath}`)
  }

  const unexpectedPaths = packagePaths.filter((path) =>
    !path.startsWith('dist/') && !requiredPaths.includes(path))
  assert.deepEqual(unexpectedPaths, [], `Unexpected package files: ${unexpectedPaths.join(', ')}`)
  const internalBuildPaths = packagePaths.filter((path) =>
    path.startsWith('dist/demos/') || path.startsWith('dist/tests/'))
  assert.deepEqual(internalBuildPaths, [], `Internal declarations were packed: ${internalBuildPaths.join(', ')}`)
  const publicStyles = readFileSync(join(projectRoot, 'dist/style.css'), 'utf8')
  assert(publicStyles.includes('.katex'), 'KaTeX styles are missing from dist/style.css')
  assert(!publicStyles.includes('data:font/'), 'Font assets must not be inlined in dist/style.css')
  const fontAssets = packagePaths.filter((path) =>
    path.startsWith('dist/assets/') && /\.(woff2?|ttf|otf)$/.test(path))
  assert(fontAssets.length > 0, 'KaTeX font assets are missing from the package')

  const consumerRoot = join(temporaryRoot, 'consumer')
  mkdirSync(consumerRoot)
  writeFileSync(join(consumerRoot, 'package.json'), JSON.stringify({
    name: 'aieditor-package-smoke-test',
    private: true,
    type: 'module',
  }, null, 2))

  const tarballPath = join(temporaryRoot, packResult.filename)
  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    tarballPath,
  ], consumerRoot)

  run('node', [
    '--input-type=module',
    '--eval',
    "const pkg = await import('aieditor'); if (typeof pkg.AiEditor !== 'function') throw new Error('ESM export is missing')",
  ], consumerRoot)
  run('node', [
    '--input-type=commonjs',
    '--eval',
    "const pkg = require('aieditor'); if (typeof pkg.AiEditor !== 'function') throw new Error('CommonJS export is missing')",
  ], consumerRoot)
  run('node', [
    '--input-type=module',
    '--eval',
    "if (!import.meta.resolve('aieditor/style.css').endsWith('/dist/style.css')) throw new Error('CSS export is invalid')",
  ], consumerRoot)

  writeFileSync(join(consumerRoot, 'consumer.ts'), [
    "import {AiEditor, type AiEditorOptionsShape} from 'aieditor'",
    'declare const options: AiEditorOptionsShape',
    'void AiEditor',
    'void options',
  ].join('\n'))
  run(process.execPath, [
    join(projectRoot, 'node_modules/typescript/bin/tsc'),
    '--noEmit',
    '--strict',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    '--target',
    'ES2023',
    'consumer.ts',
  ], consumerRoot)

  const packedPackage = JSON.parse(readFileSync(
    join(consumerRoot, 'node_modules/aieditor/package.json'),
    'utf8',
  ))
  assert.equal(packedPackage.version, projectPackage.version)

  console.log(`Verified ${packResult.filename}: ${packagePaths.length} files, ${packResult.size} bytes`)
} finally {
  rmSync(temporaryRoot, {recursive: true, force: true})
}
