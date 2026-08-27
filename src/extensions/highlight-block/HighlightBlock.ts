import {InputRule, mergeAttributes, Node} from '@tiptap/core'

/** 高亮块扩展允许合并到根节点的自定义 HTML 属性。 */
export interface HighlightBlockOptions {
    HTMLAttributes: Record<string, unknown>
}

/** 每个高亮块独立持久化的边框色和背景色。 */
export interface HighlightBlockAttributes {
    borderColor?: string | null
    backgroundColor?: string | null
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        highlightBlock: {
            setHighlightBlock: (attributes?: HighlightBlockAttributes) => ReturnType
            toggleHighlightBlock: () => ReturnType
            unsetHighlightBlock: () => ReturnType
            setHighlightBlockStyle: (attributes: HighlightBlockAttributes) => ReturnType
            resetHighlightBlockStyle: () => ReturnType
        }
    }
}

/** 匹配行首输入的 Markdown 风格高亮块标记。 */
export const highlightBlockInputRegex = /^\s*:::\s$/

/** 可容纳段落、标题和列表等块级内容的高亮容器。 */
export const HighlightBlock = Node.create<HighlightBlockOptions>({
    name: 'highlightBlock',
    group: 'block',
    content: 'block+',
    defining: true,

    addOptions() {
        return {HTMLAttributes: {}}
    },

    addAttributes() {
        return {
            borderColor: {
                default: null,
                parseHTML: (element) => element.style.borderColor || null,
                renderHTML: (attributes) => attributes.borderColor
                    ? {style: `border-color: ${attributes.borderColor}`}
                    : {},
            },
            backgroundColor: {
                default: null,
                parseHTML: (element) => element.style.backgroundColor || null,
                renderHTML: (attributes) => attributes.backgroundColor
                    ? {style: `background-color: ${attributes.backgroundColor}`}
                    : {},
            },
        }
    },

    parseHTML() {
        return [{tag: 'div[data-type="highlight-block"]'}]
    },

    renderHTML({HTMLAttributes}) {
        return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
            'data-type': 'highlight-block',
        }), 0]
    },

    addCommands() {
        return {
            setHighlightBlock: (attributes = {}) => ({commands}) => commands.wrapIn(this.name, attributes),
            toggleHighlightBlock: () => ({commands}) => commands.toggleWrap(this.name),
            unsetHighlightBlock: () => ({commands}) => commands.lift(this.name),
            setHighlightBlockStyle: (attributes) => ({commands, editor}) => editor.isActive(this.name)
                ? commands.updateAttributes(this.name, attributes)
                : commands.wrapIn(this.name, attributes),
            resetHighlightBlockStyle: () => ({commands}) => commands.updateAttributes(this.name, {
                borderColor: null,
                backgroundColor: null,
            }),
        }
    },

    addInputRules() {
        return [new InputRule({
            find: highlightBlockInputRegex,
            handler: ({state, range, chain}) => {
                const {$from} = state.selection
                // 已位于高亮块中时不再嵌套相同容器。
                for (let depth = $from.depth; depth > 0; depth -= 1) {
                    if ($from.node(depth).type === this.type) return null
                }

                chain()
                    .deleteRange(range)
                    .setTextSelection(range.from)
                    .wrapIn(this.name)
                    .run()
            },
        })]
    },

    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const {selection} = this.editor.state
                const {$from, empty} = selection
                if (!empty || $from.parent.type.name !== 'paragraph' || $from.parent.textContent.trim() !== ':::') {
                    return false
                }

                // InputRule 不一定覆盖组合输入场景，因此 Enter 再处理一次完整的 ::: 段落。
                const position = $from.start()
                const chain = this.editor.chain()
                    .deleteRange({from: position, to: $from.end()})
                    .setTextSelection(position)
                // 块内输入 ::: 表示退出，普通段落输入则表示创建高亮块。
                return this.editor.isActive(this.name)
                    ? chain.liftEmptyBlock().run()
                    : chain.wrapIn(this.name).run()
            },
        }
    },
})
