import type {Editor} from '@tiptap/core'
import type {AiEditorContext} from '../../types'
import {EditorMutationTool} from '../core/EditorMutationTool'
import {objectSchema, requireInteger, requireString} from '../core/tool-utils'

/** 校验后的单处纯文本替换，坐标均为 ProseMirror 文档位置。 */
interface NormalizedTextEdit {
    from: number
    to: number
    oldText: string
    newText: string
}

/** 提议在一个编辑器事务中应用多处互不重叠的文本替换。 */
export class ApplyTextEditsTool extends EditorMutationTool {
    readonly name = 'apply_text_edits' as const
    readonly description = 'Propose multiple plain-text replacements as one atomic editor transaction. The host applies its configured approval policy.'
    readonly parameters = objectSchema({
        edits: {
            type: 'array',
            minItems: 1,
            items: objectSchema({
                from: {type: 'integer', minimum: 0},
                to: {type: 'integer', minimum: 0},
                old_text: {type: 'string'},
                new_text: {type: 'string'},
            }, ['from', 'to', 'old_text', 'new_text']),
        },
    }, ['edits'])
    protected readonly proposalTitle = 'Apply text edits'
    protected readonly proposalDescription = 'Apply multiple text changes as one undoable operation.'

    /** 在创建提案时完成结构、范围和重叠检查。 */
    protected prepareArguments(arguments_: Record<string, unknown>, context: AiEditorContext): void {
        this.normalizeEdits(arguments_, context.editor.state.doc.content.size)
    }

    /** 再次校验参数与原文，然后通过单个 transaction 原子应用全部替换。 */
    apply(editor: Editor, arguments_: Record<string, unknown>): void {
        const edits = this.normalizeEdits(arguments_, editor.state.doc.content.size)
            // 从后向前替换，前方尚未处理的坐标不会因后方文本长度变化而偏移。
            .sort((first, second) => second.from - first.from)
        for (const edit of edits) {
            // documentVersion 是第一层并发保护；原文比对进一步防止范围指向非预期内容。
            if (editor.state.doc.textBetween(edit.from, edit.to, '\n') !== edit.oldText) {
                throw new Error('The text for one or more edits no longer matches.')
            }
        }
        const applied = editor.chain().focus().command(({tr}) => {
            // 所有 insertText 共用同一个 transaction，因此用户只需撤销一次。
            for (const edit of edits) tr.insertText(edit.newText, edit.from, edit.to)
            return true
        }).run()
        if (!applied) throw new Error('Could not apply text edits.')
    }

    /** 将 unknown 参数收窄为可靠的文本替换数组，并拒绝越界或重叠范围。 */
    private normalizeEdits(
        arguments_: Record<string, unknown>,
        documentSize: number,
    ): NormalizedTextEdit[] {
        if (!Array.isArray(arguments_.edits) || !arguments_.edits.length) {
            throw new Error('edits must be a non-empty array')
        }
        const edits = arguments_.edits.map((value) => {
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                throw new Error('Each edit must be an object')
            }
            const edit = value as Record<string, unknown>
            const from = requireInteger(edit, 'from')
            const to = requireInteger(edit, 'to')
            const oldText = requireString(edit, 'old_text', true)
            const newText = requireString(edit, 'new_text', true)
            if (from < 0 || to < from || to > documentSize) {
                throw new Error('An edit range is outside the document')
            }
            return {from, to, oldText, newText}
        })
        // 使用副本升序检查重叠，同时保留调用方原始顺序供后续自行决定应用顺序。
        const ordered = [...edits].sort((first, second) => first.from - second.from)
        for (let index = 1; index < ordered.length; index += 1) {
            if (ordered[index].from < ordered[index - 1].to) {
                throw new Error('Text edit ranges cannot overlap')
            }
        }
        return edits
    }
}
