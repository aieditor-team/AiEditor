import {
    CodeBlockLowlight as TCodeBlockLowlight,
    type CodeBlockLowlightOptions as TCodeBlockLowlightOptions
} from '@tiptap/extension-code-block-lowlight'
import {mergeAttributes, textblockTypeInputRule} from '@tiptap/core'
import {TextSelection} from '@tiptap/pm/state'
import {CodeBlockView} from './CodeBlockView'

export interface CodeBlockLanguageOption {
    /** 语言菜单中显示的名称。 */
    name: string
    /** 写入 codeBlock language 属性和 HTML class 的规范值。 */
    value: string
    /** 输入代码围栏时可使用的简称，例如 js、ts、py。 */
    aliases?: string[]
}

export interface CodeBlockConfig {
    /** 是否显示语言选择和复制操作。 */
    actions?: boolean
    /** 自定义语言菜单、顺序和输入别名；高亮语言仍需在 lowlight 中注册。 */
    languages?: CodeBlockLanguageOption[]
    /** 未指定或无法识别围栏语言时使用的默认语言。 */
    defaultLanguage?: string | null
    /** 是否允许在代码块中使用 Tab 和 Shift+Tab 调整缩进。 */
    enableTabIndentation?: boolean
    /** 一个缩进对应的空格数。 */
    tabSize?: number
}

/** 使用 lowlight 完成语法高亮的代码块节点适配层。 */
export interface CodeBlockLowlightOptions extends TCodeBlockLowlightOptions {
    /** 是否在代码块右上角显示语言选择和复制操作。 */
    actions: boolean
    /** 语言菜单配置；null 表示根据 lowlight 已注册语言自动生成。 */
    languages: CodeBlockLanguageOption[] | null
    /** NodeView 中不可通过编辑器菜单上下文获取翻译器，因此由扩展配置注入。 */
    translate: (value: string) => string
}

export const codeBlockBacktickInputRegex = /^[`·]{3}([A-Za-z0-9_+#.-]+)?[\s\n]$/
export const codeBlockTildeInputRegex = /^[~～]{3}([A-Za-z0-9_+#.-]+)?[\s\n]$/

const LANGUAGE_LABELS: Record<string, string> = {
    arduino: 'Arduino',
    bash: 'Bash',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    css: 'CSS',
    diff: 'Diff',
    go: 'Go',
    graphql: 'GraphQL',
    ini: 'INI',
    java: 'Java',
    javascript: 'JavaScript',
    json: 'JSON',
    kotlin: 'Kotlin',
    less: 'Less',
    lua: 'Lua',
    makefile: 'Makefile',
    markdown: 'Markdown',
    objectivec: 'Objective-C',
    perl: 'Perl',
    php: 'PHP',
    'php-template': 'PHP Template',
    plaintext: 'Plain Text',
    python: 'Python',
    'python-repl': 'Python REPL',
    r: 'R',
    ruby: 'Ruby',
    rust: 'Rust',
    scss: 'SCSS',
    shell: 'Shell',
    sql: 'SQL',
    swift: 'Swift',
    typescript: 'TypeScript',
    vbnet: 'VB.NET',
    wasm: 'WebAssembly',
    xml: 'HTML / XML',
    yaml: 'YAML',
}

const LANGUAGE_ALIASES: Record<string, string[]> = {
    bash: ['sh'],
    cpp: ['cc', 'c++', 'hpp', 'cxx'],
    csharp: ['cs', 'c#'],
    javascript: ['js', 'jsx', 'mjs', 'cjs'],
    markdown: ['md'],
    objectivec: ['objc', 'objective-c'],
    plaintext: ['text', 'txt'],
    python: ['py'],
    ruby: ['rb'],
    rust: ['rs'],
    typescript: ['ts', 'tsx'],
    xml: ['html', 'xhtml', 'svg'],
    yaml: ['yml'],
}

/** 根据 lowlight 注册表生成稳定、可展示并带常用别名的语言配置。 */
export function createCodeBlockLanguageOptions(languages: string[]): CodeBlockLanguageOption[] {
    const ordered = [
        ...languages.filter((value) => value === 'plaintext'),
        ...languages.filter((value) => value !== 'plaintext'),
    ]
    return ordered.map((value) => ({
        name: LANGUAGE_LABELS[value] ?? value.replace(/(^|[-_])([a-z])/g, (_, separator: string, letter: string) => `${separator ? ' ' : ''}${letter.toUpperCase()}`),
        value,
        aliases: LANGUAGE_ALIASES[value],
    }))
}

/** 将菜单值或围栏别名转换为规范语言名，避免导出 language-js 之类的不稳定值。 */
export function normalizeCodeBlockLanguage(
    value: string | null | undefined,
    languages: CodeBlockLanguageOption[],
    defaultLanguage: string | null | undefined = null,
): string | null {
    const normalized = value?.trim().toLowerCase()
    if (!normalized || normalized === 'auto') return defaultLanguage ?? null
    const language = languages.find((item) => item.value.toLowerCase() === normalized
        || item.aliases?.some((alias) => alias.toLowerCase() === normalized))
    return language?.value ?? defaultLanguage ?? null
}

export const CodeBlockLowlight = TCodeBlockLowlight.extend<CodeBlockLowlightOptions>({
    addOptions() {
        return {
            ...(this.parent?.() as CodeBlockLowlightOptions),
            actions: true,
            languages: null,
            enableTabIndentation: true,
            tabSize: 2,
            translate: (value) => value,
        }
    },

    addCommands() {
        return {
            ...this.parent?.(),
            toggleCodeBlock: (attributes) => ({commands, state, chain}) => {
                const {from, to, empty} = state.selection
                if (!empty && !this.editor.isActive(this.name)) {
                    const paragraphs: string[] = []
                    let onlyParagraphs = true

                    state.doc.nodesBetween(from, to, (node, position) => {
                        if (node.type === state.schema.nodes.paragraph) {
                            const contentFrom = position + 1
                            const selectedFrom = Math.max(from, contentFrom) - contentFrom
                            const selectedTo = Math.min(to, contentFrom + node.content.size) - contentFrom
                            paragraphs.push(node.textBetween(Math.max(0, selectedFrom), Math.max(0, selectedTo), '\n'))
                            return false
                        }
                        if (node.isTextblock) {
                            onlyParagraphs = false
                            return false
                        }
                        return true
                    })

                    if (onlyParagraphs && paragraphs.length > 1) {
                        return chain().command(({tr}) => {
                            const content = paragraphs.join('\n')
                            const codeBlock = this.type.create(attributes, content ? state.schema.text(content) : undefined)
                            tr.replaceRangeWith(from, to, codeBlock)
                            const cursor = Math.min(from + 1, tr.doc.content.size)
                            tr.setSelection(TextSelection.near(tr.doc.resolve(cursor)))
                            return true
                        }).run()
                    }
                }
                return commands.toggleNode(this.name, 'paragraph', attributes)
            },
        }
    },

    addInputRules() {
        const languages = this.options.languages
            ?? createCodeBlockLanguageOptions(this.options.lowlight?.listLanguages?.() ?? [])
        const attributes = (match: RegExpMatchArray) => ({
            language: normalizeCodeBlockLanguage(match[1], languages, this.options.defaultLanguage),
        })
        return [
            textblockTypeInputRule({find: codeBlockBacktickInputRegex, type: this.type, getAttributes: attributes}),
            textblockTypeInputRule({find: codeBlockTildeInputRegex, type: this.type, getAttributes: attributes}),
        ]
    },

    addNodeView() {
        return ({node, view, getPos, HTMLAttributes}) => new CodeBlockView(node, view, getPos, {
            actions: this.options.actions,
            HTMLAttributes: mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
            languageClassPrefix: this.options.languageClassPrefix,
            languages: this.options.languages
                ?? createCodeBlockLanguageOptions(this.options.lowlight?.listLanguages?.() ?? []),
            translate: this.options.translate,
        })
    },
})
