import type { AiEditorContext } from '../../types'
import { EditorTool, type EditorToolExecution } from '../core/EditorTool'
import { objectSchema } from '../core/tool-utils'

/**
 * 读取当前编辑器上下文的只读 Tool。
 *
 * 返回纯文本、选区、活动格式和标题大纲，让模型先了解文档状态再决定是否调用修改型 Tool。
 */
export class GetEditorContextTool extends EditorTool {
  readonly name = 'get_editor_context' as const
  readonly description = 'Read the current document, selection, active block, formatting marks, outline, and document version.'
  readonly parameters = objectSchema({})

  /** 构造适合模型消费的轻量上下文，不返回体积较大的 ProseMirror JSON。 */
  execute(_arguments: Record<string, unknown>, context: AiEditorContext): EditorToolExecution {
    const outline: Array<{ level: number; text: string; position: number }> = []
    // descendants 提供节点在 ProseMirror 文档中的绝对位置，后续 Tool 可以直接引用。
    context.editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'heading') {
        outline.push({ level: Number(node.attrs.level), text: node.textContent, position })
      }
    })

    return {
      output: {
        document_version: context.documentVersion,
        document_text: context.text,
        selection: context.selection,
        selected_text: context.selectedText,
        active_block: context.editor.state.selection.$from.parent.type.name,
        // storedMarks 表示光标处即将输入的格式；存在文本选区时则读取选区起点的 Marks。
        active_marks: context.editor.state.storedMarks?.map((mark) => mark.type.name)
          ?? context.editor.state.selection.$from.marks().map((mark) => mark.type.name),
        outline,
      },
    }
  }
}
