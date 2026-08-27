import type { Editor } from '@tiptap/core'
import type { AiEditorContext } from '../../types'
import { EditorMutationTool } from '../core/EditorMutationTool'
import { objectSchema, requireEnum, requireInteger, requireString } from '../core/tool-utils'

/** 提议在选区前后或文档末尾插入纯文本，且不删除已有内容。 */
export class InsertContentTool extends EditorMutationTool {
  readonly name = 'insert_content' as const
  readonly description = 'Propose inserting plain text before or after the current selection, or at the end of the document.'
  readonly parameters = objectSchema({
    position: { type: 'string', enum: ['before_selection', 'after_selection', 'document_end'] },
    content: { type: 'string', description: 'Plain text to insert.' },
  }, ['position', 'content'])
  protected readonly proposalTitle = 'Insert content'
  protected readonly proposalDescription = 'Insert AI-generated content without removing existing text.'

  /** 将模型提供的语义位置转换为创建提案时的 ProseMirror 绝对坐标。 */
  protected prepareArguments(arguments_: Record<string, unknown>, context: AiEditorContext): void {
    const position = requireEnum(arguments_, 'position', [
      'before_selection',
      'after_selection',
      'document_end',
    ])
    requireString(arguments_, 'content')
    // 冻结插入点，防止等待审批期间选区移动后插入到意外位置。
    arguments_._insert_position = position === 'before_selection'
      ? context.selection.from
      : position === 'after_selection'
        ? context.selection.to
        : context.editor.state.doc.content.size
  }

  /** 在冻结的坐标处插入纯文本节点。 */
  apply(editor: Editor, arguments_: Record<string, unknown>): void {
    const position = requireInteger(arguments_, '_insert_position')
    const content = requireString(arguments_, 'content', true)
    if (!editor.chain().focus().insertContentAt(position, { type: 'text', text: content }).run()) {
      throw new Error('Could not insert the content.')
    }
  }
}
