import type { Editor } from '@tiptap/core'
import type { FunctionTool } from 'openai/resources/responses/responses'
import type { AiEditorContext, AiEditorToolName } from '../../types'

/** Tool 本地执行后的统一结果。 */
export interface EditorToolExecution {
  /** 序列化后返回给模型的 Function Calling 输出。 */
  output: Record<string, unknown>
  /** 修改型 Tool 额外生成的待审批提案。 */
  proposal?: import('../../types').AiEditorToolProposal
}

/**
 * 所有编辑器 Tool 的抽象基类。
 *
 * 子类同时描述模型可见的 Function 定义和本地执行逻辑。只读 Tool 只实现 `execute`；
 * 修改型 Tool 继承 EditorMutationTool，并覆写 `apply` 提交编辑器事务。
 */
export abstract class EditorTool {
  /** 稳定的 Function 名称，也是 Registry 的唯一键。 */
  abstract readonly name: AiEditorToolName
  /** 给模型阅读的能力与使用场景说明。 */
  abstract readonly description: string
  /** 模型调用参数的 JSON Schema。 */
  abstract readonly parameters: FunctionTool['parameters']

  /** 将类属性转换成 OpenAI Responses API 的 FunctionTool 定义。 */
  get definition(): FunctionTool {
    return {
      type: 'function',
      name: this.name,
      description: this.description,
      strict: false,
      parameters: this.parameters,
    }
  }

  abstract execute(
    arguments_: Record<string, unknown>,
    context: AiEditorContext,
  ): EditorToolExecution

  /**
   * 应用修改型 Tool 的参数。默认实现明确拒绝调用，防止只读 Tool 被误当作修改操作。
   * 参数名前缀 `_` 表示基类契约需要但当前默认实现不会使用。
   */
  apply(_editor: Editor, _arguments: Record<string, unknown>): void {
    throw new Error(`${this.name} is read-only and cannot be applied.`)
  }
}
