import {existsSync, readdirSync, readFileSync} from 'node:fs'
import {join, relative} from 'node:path'
import {describe, expect, it} from 'vitest'

const sourceRoot = join(process.cwd(), 'src')
const stylesRoot = join(sourceRoot, 'styles')
const styleFiles = [
    'tokens.css',
    'editor.css',
    'menu.css',
    'media.css',
    'table.css',
    'ai-chat.css',
    'aieditor.css',
]

function collectTypeScriptFiles(directory: string): string[] {
    return readdirSync(directory, {withFileTypes: true}).flatMap((entry) => {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) return collectTypeScriptFiles(path)
        return entry.isFile() && entry.name.endsWith('.ts') ? [path] : []
    })
}

describe('source directory boundaries', () => {
    it('keeps composed UI capabilities under features and removes legacy surface folders', () => {
        for (const feature of ['toolbar', 'bubble', 'floating', 'sidebar', 'block-drag', 'upload']) {
            expect(existsSync(join(sourceRoot, 'features', feature)), `missing feature: ${feature}`).toBe(true)
        }

        for (const legacy of [
            'menus/surfaces',
            'extensions/core',
            'extensions/rich-content',
            'extensions/menu',
            'extensions/node-views',
            'extensions/block-drag-menu',
        ]) {
            expect(existsSync(join(sourceRoot, legacy)), `legacy directory still exists: ${legacy}`).toBe(false)
        }
    })

    it('prevents document extensions from importing UI composition or editor runtime layers', () => {
        const violations = collectTypeScriptFiles(join(sourceRoot, 'extensions')).flatMap((file) => {
            const source = readFileSync(file, 'utf8')
            const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
            return imports
                .filter((specifier) => /(?:^|\/)(?:editor|features|menus)(?:\/|$)/.test(specifier))
                // Mention 的 Portal 需要同步实例主题；该叶子模块只含 WeakMap 状态，不依赖 Editor 门面。
                .filter((specifier) => specifier !== '../../editor/AiEditorTheme')
                .map((specifier) => `${relative(sourceRoot, file)} -> ${specifier}`)
        })

        expect(violations).toEqual([])
    })

    it('keeps styles CSS-only and exposes one complete public stylesheet entry', () => {
        const actualEntries = readdirSync(stylesRoot, {withFileTypes: true})
        const actualFiles = actualEntries.map((entry) => entry.name).sort()

        expect(actualEntries.every((entry) => entry.isFile())).toBe(true)
        expect(actualFiles).toEqual([...styleFiles].sort())
        expect(existsSync(join(sourceRoot, 'editor', 'AiEditorTheme.ts'))).toBe(true)

        const entrySource = readFileSync(join(stylesRoot, 'aieditor.css'), 'utf8')
        const imports = [...entrySource.matchAll(/@import\s+['"]\.\/([^'"]+)['"]\s*;/g)]
            .map((match) => match[1])

        expect(imports).toEqual(styleFiles.slice(0, -1))
        expect(entrySource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@import[^;]+;/g, '').trim()).toBe('')

        for (const file of styleFiles.slice(0, -1)) {
            const source = readFileSync(join(stylesRoot, file), 'utf8')
            expect(source.trim().length, `empty stylesheet: ${file}`).toBeGreaterThan(0)
            expect(source).not.toMatch(/@import\b/)
        }
    })
})
