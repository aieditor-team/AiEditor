import {Extension, type Attributes, type Editor} from '@tiptap/core'
import {Plugin, PluginKey} from '@tiptap/pm/state'

const paintableMarks = [
    'bold', 'italic', 'underline', 'strike', 'code', 'superscript', 'subscript', 'textStyle', 'highlight',
]
const formatPainterPluginKey = new PluginKey('formatPainter')

interface FormatPainterSnapshot {
    marks: Array<{ type: string; attrs: Attributes }>
    block: {
        type: 'heading' | 'paragraph'
        attrs: Record<string, string | number | boolean | null | undefined>
    }
}

export interface FormatPainterStorage {
    active: boolean
    snapshot: FormatPainterSnapshot | null
}

declare module '@tiptap/core' {
    interface Storage {
        formatPainter: FormatPainterStorage
    }

    interface Commands<ReturnType> {
        formatPainter: {
            /** 捕获当前光标或选区的行内与段落格式，并进入待应用状态。 */
            captureFormat: () => ReturnType
            /** 将已捕获格式应用到当前选区或光标所在文本块。 */
            applyCapturedFormat: () => ReturnType
            /** 取消格式刷状态。 */
            clearFormatPainter: () => ReturnType
        }
    }
}

function getTextBlock(editor: Editor): FormatPainterSnapshot['block'] {
    const {$from} = editor.state.selection
    for (let depth = $from.depth; depth > 0; depth -= 1) {
        const node = $from.node(depth)
        if (node.type.name !== 'heading' && node.type.name !== 'paragraph') continue
        return {
            type: node.type.name,
            attrs: {
                ...(node.type.name === 'heading' ? {level: node.attrs.level} : {}),
                lineHeight: node.attrs.lineHeight ?? null,
                textAlign: node.attrs.textAlign ?? null,
                indent: node.attrs.indent ?? null,
            },
        }
    }
    return {type: 'paragraph', attrs: {lineHeight: null, textAlign: null, indent: null}}
}

function captureSnapshot(editor: Editor): FormatPainterSnapshot {
    const marks = editor.state.selection.$from.marks()
        .filter((mark) => paintableMarks.includes(mark.type.name))
        .map((mark) => ({type: mark.type.name, attrs: {...mark.attrs}}))
    return {marks, block: getTextBlock(editor)}
}

function getTargetRange(editor: Editor): { from: number; to: number } {
    const {selection} = editor.state
    if (!selection.empty) return {from: selection.from, to: selection.to}

    for (let depth = selection.$from.depth; depth > 0; depth -= 1) {
        const node = selection.$from.node(depth)
        if (node.isTextblock) {
            return {from: selection.$from.start(depth), to: selection.$from.end(depth)}
        }
    }
    return {from: selection.from, to: selection.to}
}

/** 一次性格式刷：捕获源格式，并在目标选区 mouseup 后自动应用。 */
export const FormatPainter = Extension.create<Record<string, never>, FormatPainterStorage>({
    name: 'formatPainter',

    addStorage() {
        return {active: false, snapshot: null}
    },

    addCommands() {
        const setActive = (active: boolean, snapshot: FormatPainterSnapshot | null) => {
            this.storage.active = active
            this.storage.snapshot = snapshot
            this.editor.view.dom.classList.toggle('is-format-painter-active', active)
            this.editor.view.dispatch(this.editor.state.tr.setMeta(formatPainterPluginKey, active ? 'capture' : 'clear'))
        }

        return {
            captureFormat: () => () => {
                setActive(true, captureSnapshot(this.editor))
                return true
            },
            applyCapturedFormat: () => () => {
                const snapshot = this.storage.snapshot
                if (!this.storage.active || !snapshot) return false

                const range = getTargetRange(this.editor)
                let chain = this.editor.chain().focus().setTextSelection(range)
                paintableMarks.forEach((mark) => {
                    if (this.editor.schema.marks[mark]) chain = chain.unsetMark(mark)
                })
                snapshot.marks.forEach((mark) => {
                    if (this.editor.schema.marks[mark.type]) chain = chain.setMark(mark.type, mark.attrs)
                })
                chain = chain.setNode(snapshot.block.type, snapshot.block.attrs as Attributes)
                const applied = chain.run()
                if (applied) setActive(false, null)
                return applied
            },
            clearFormatPainter: () => () => {
                if (!this.storage.active && !this.storage.snapshot) return false
                setActive(false, null)
                return true
            },
        }
    },

    addKeyboardShortcuts() {
        return {
            Escape: () => this.storage.active && this.editor.commands.clearFormatPainter(),
        }
    },

    addProseMirrorPlugins() {
        return [new Plugin({
            key: formatPainterPluginKey,
            props: {
                handleDOMEvents: {
                    mouseup: () => {
                        if (!this.storage.active) return false
                        // ProseMirror 会在 mouseup 结束后同步 DOM 选区；下一宏任务才能读取到目标范围。
                        window.setTimeout(() => {
                            if (!this.editor.isDestroyed && this.storage.active) {
                                this.editor.commands.applyCapturedFormat()
                            }
                        }, 0)
                        return false
                    },
                },
            },
        })]
    },

    onDestroy() {
        this.editor.view.dom.classList.remove('is-format-painter-active')
    },
})
