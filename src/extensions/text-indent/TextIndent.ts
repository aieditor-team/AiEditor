import {Extension, getStyleProperty} from '@tiptap/core'
import type {EditorState} from '@tiptap/pm/state'

export interface TextIndentOptions {
    /** 可以应用首行缩进的块节点名称。 */
    types: string[]
    /** 最大缩进层级。 */
    maxLevel: number
    /** 每级缩进对应的 em 数。 */
    step: number
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        textIndent: {
            setIndent: (level: number) => ReturnType
            increaseIndent: () => ReturnType
            decreaseIndent: () => ReturnType
            unsetIndent: () => ReturnType
        }
    }
}

function getCurrentIndent(state: EditorState, types: string[]): number | null {
    const {$from} = state.selection
    for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth)
        if (types.includes(node.type.name)) return Number(node.attrs.indent) || 0
    }
    return null
}

/** 为段落和标题提供可持久化的多级首行缩进。 */
export const TextIndent = Extension.create<TextIndentOptions>({
    name: 'textIndent',

    addOptions() {
        return {types: ['heading', 'paragraph'], maxLevel: 8, step: 2}
    },

    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                indent: {
                    default: null,
                    parseHTML: (element) => {
                        const maxLevel = Math.max(1, Math.round(this.options.maxLevel) || 8)
                        const step = this.options.step > 0 ? this.options.step : 2
                        const dataLevel = Number(
                            element.getAttribute('data-text-indent') ?? element.getAttribute('data-indent'),
                        )
                        if (Number.isFinite(dataLevel) && dataLevel > 0) {
                            return Math.min(maxLevel, Math.round(dataLevel))
                        }
                        const textIndent = getStyleProperty(element, 'text-indent') ?? element.style.textIndent
                        const em = Number.parseFloat(textIndent)
                        return textIndent?.endsWith('em') && em > 0
                            ? Math.min(maxLevel, Math.round(em / step))
                            : null
                    },
                    renderHTML: (attributes) => {
                        const maxLevel = Math.max(1, Math.round(this.options.maxLevel) || 8)
                        const step = this.options.step > 0 ? this.options.step : 2
                        const level = Math.min(maxLevel, Math.max(0, Number(attributes.indent) || 0))
                        return level
                            ? {'data-text-indent': String(level), style: `text-indent: ${level * step}em`}
                            : {}
                    },
                },
            },
        }]
    },

    addCommands() {
        return {
            setIndent: (level: number) => ({state, commands}) => {
                const current = getCurrentIndent(state, this.options.types)
                if (current === null) return false
                const maxLevel = Math.max(1, Math.round(this.options.maxLevel) || 8)
                const next = Math.min(maxLevel, Math.max(0, Math.round(level)))
                if (next === current) return false
                return this.options.types
                    .map((type) => commands.updateAttributes(type, {indent: next || null}))
                    .some(Boolean)
            },
            increaseIndent: () => ({state, commands}) => {
                const current = getCurrentIndent(state, this.options.types)
                const maxLevel = Math.max(1, Math.round(this.options.maxLevel) || 8)
                if (current === null || current >= maxLevel) return false
                return commands.setIndent(current + 1)
            },
            decreaseIndent: () => ({state, commands}) => {
                const current = getCurrentIndent(state, this.options.types)
                if (current === null || current <= 0) return false
                return commands.setIndent(current - 1)
            },
            unsetIndent: () => ({state, commands}) => {
                const current = getCurrentIndent(state, this.options.types)
                if (current === null || current <= 0) return false
                return this.options.types
                    .map((type) => commands.resetAttributes(type, 'indent'))
                    .some(Boolean)
            },
        }
    },

    addKeyboardShortcuts() {
        return {
            'Mod-]': () => this.editor.commands.increaseIndent(),
            'Mod-[': () => this.editor.commands.decreaseIndent(),
        }
    },
})
