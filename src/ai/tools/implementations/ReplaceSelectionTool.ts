import type { Editor } from '@tiptap/core'
import type { AiEditorContext } from '../../types'
import { EditorMutationTool } from '../core/EditorMutationTool'
import { objectSchema, requireInteger, requireString } from '../core/tool-utils'

/** 提议用纯文本替换请求发起时的活动选区。 */
export class ReplaceSelectionTool extends EditorMutationTool {
  readonly name = 'replace_selection' as const
  readonly description = 'Propose replacing the current text selection. The host applies its configured approval policy.'
  readonly parameters = objectSchema({
    text: { type: 'string', description: 'Replacement plain text.' },
  }, ['text'])
  protected readonly proposalTitle = 'Replace selection'
  protected readonly proposalDescription = 'Replace the selected text with AI-generated content.'

  /** 校验替换文本，并将当前选区冻结到提案内部参数。 */
  protected prepareArguments(arguments_: Record<string, unknown>, context: AiEditorContext): void {
    requireString(arguments_, 'text', true)
    if (context.selection.from === context.selection.to) {
      throw new Error('replace_selection requires an active text selection')
    }
    // 审批时用户的当前选区可能已经变化，因此不能在 apply 阶段重新读取 selection。
    arguments_._selection_from = context.selection.from
    arguments_._selection_to = context.selection.to
    arguments_._selection_text = context.editor.state.doc.textBetween(
      context.selection.from,
      context.selection.to,
      '\n',
    )
  }

  /** 用一次 Tiptap chain 替换冻结的范围，使操作可被一次 Undo 撤销。 */
  apply(editor: Editor, arguments_: Record<string, unknown>): void {
    const from = requireInteger(arguments_, '_selection_from')
    const to = requireInteger(arguments_, '_selection_to')
    const text = requireString(arguments_, 'text', true)
    if (!editor.chain().focus().insertContentAt({ from, to }, { type: 'text', text }).run()) {
      throw new Error('Could not replace the selection.')
    }
  }
}
