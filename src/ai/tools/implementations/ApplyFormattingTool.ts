import type {Editor} from '@tiptap/core'
import type {AiEditorContext} from '../../types'
import {EditorMutationTool} from '../core/EditorMutationTool'
import {clampInteger, objectSchema, requireEnum, requireInteger} from '../core/tool-utils'

/** 允许模型应用的文本 Marks 白名单，避免调用任意未注册扩展。 */
const allowedMarks = ['bold', 'italic', 'underline', 'strike', 'code']

/** 提议为指定文档范围添加 Marks、块类型或文本对齐。 */
export class ApplyFormattingTool extends EditorMutationTool {
    readonly name = 'apply_formatting' as const
    readonly description = 'Propose formatting a document range. The host applies its configured approval policy.'
    readonly parameters = objectSchema({
        from: {type: 'integer', minimum: 0, description: 'Start position. Defaults to the current selection.'},
        to: {type: 'integer', minimum: 0, description: 'End position. Defaults to the current selection.'},
        marks: {type: 'array', items: {type: 'string', enum: allowedMarks}},
        block_type: {type: 'string', enum: ['paragraph', 'heading', 'blockquote', 'codeBlock']},
        heading_level: {type: 'integer', minimum: 1, maximum: 6},
        alignment: {type: 'string', enum: ['left', 'center', 'right', 'justify']},
    })
    protected readonly proposalTitle = 'Apply formatting'
    protected readonly proposalDescription = 'Apply formatting to a document range.'

    /** 校验格式名称和范围，并将最终范围保存到提案内部参数。 */
    protected prepareArguments(arguments_: Record<string, unknown>, context: AiEditorContext): void {
        // 模型没有显式给出范围时，使用请求发起时的当前选区。
        const from = Number.isInteger(arguments_.from) ? Number(arguments_.from) : context.selection.from
        const to = Number.isInteger(arguments_.to) ? Number(arguments_.to) : context.selection.to
        if (from < 0 || to < from) throw new Error('Invalid formatting range')
        if (to > context.editor.state.doc.content.size) {
            throw new Error('The formatting range is outside the document')
        }
        arguments_._range_from = from
        arguments_._range_to = to

        const marks = Array.isArray(arguments_.marks) ? arguments_.marks : []
        if (marks.some((mark) => typeof mark !== 'string' || !allowedMarks.includes(mark))) {
            throw new Error('Unsupported formatting mark')
        }
        if (arguments_.block_type !== undefined) {
            requireEnum(arguments_, 'block_type', ['paragraph', 'heading', 'blockquote', 'codeBlock'])
        }
        if (arguments_.alignment !== undefined) {
            requireEnum(arguments_, 'alignment', ['left', 'center', 'right', 'justify'])
        }
        if (!marks.length && arguments_.block_type === undefined && arguments_.alignment === undefined) {
            throw new Error('No formatting operation was provided')
        }
    }

    /** 将多个格式命令组合到同一个 chain 中并一次性提交。 */
    apply(editor: Editor, arguments_: Record<string, unknown>): void {
        const from = requireInteger(arguments_, '_range_from')
        const to = requireInteger(arguments_, '_range_to')
        let chain = editor.chain().focus().setTextSelection({from, to})
        const marks = Array.isArray(arguments_.marks)
            ? arguments_.marks.filter((mark): mark is string => typeof mark === 'string')
            : []
        // setMark 使用扩展注册名，名称已在 prepareArguments 中经过白名单校验。
        for (const mark of marks) chain = chain.setMark(mark)
        if (typeof arguments_.block_type === 'string') {
            // blockquote 是包裹节点，其他支持类型则直接替换当前文本块类型。
            if (arguments_.block_type === 'blockquote') chain = chain.wrapIn('blockquote')
            else {
                const attrs = arguments_.block_type === 'heading'
                    ? {level: clampInteger(arguments_.heading_level, 2, 1, 6)}
                    : undefined
                chain = chain.setNode(arguments_.block_type, attrs)
            }
        }
        if (typeof arguments_.alignment === 'string') chain = chain.setTextAlign(arguments_.alignment)
        if (!chain.run()) throw new Error('Could not apply formatting.')
    }
}
