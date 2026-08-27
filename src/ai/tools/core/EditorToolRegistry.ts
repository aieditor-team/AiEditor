import type { Editor } from '@tiptap/core'
import type { FunctionTool } from 'openai/resources/responses/responses'
import type { AiEditorContext, AiEditorToolApplyResult, AiEditorToolProposal } from '../../types'
import type { EditorTool, EditorToolExecution } from './EditorTool'
import { parseArguments } from './tool-utils'

interface PositionMapping {
  map(position: number, association?: number): number
}

/**
 * 将同一文档版本产生的待处理提案映射到一次已应用事务之后。
 * 原文快照保持不变，应用时仍会再次校验重叠修改造成的语义冲突。
 */
export function rebaseEditorToolProposal(
  proposal: AiEditorToolProposal,
  mapping: PositionMapping,
  documentVersion: number,
): void {
  const args = proposal.arguments
  const mapInteger = (key: string, association = 1): void => {
    if (Number.isInteger(args[key])) args[key] = mapping.map(args[key] as number, association)
  }
  mapInteger('_selection_from', 1)
  mapInteger('_selection_to', -1)
  mapInteger('_insert_position', 1)
  mapInteger('_range_from', 1)
  mapInteger('_range_to', -1)
  if (Array.isArray(args.edits)) {
    args.edits.forEach((value) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return
      const edit = value as Record<string, unknown>
      if (Number.isInteger(edit.from)) edit.from = mapping.map(edit.from as number, 1)
      if (Number.isInteger(edit.to)) edit.to = mapping.map(edit.to as number, -1)
    })
  }
  proposal.documentVersion = documentVersion
}

/**
 * Tool 的注册、查找、调用和提案应用中心。
 *
 * Registry 隔离 OpenAI 的字符串参数与具体 Tool 类，同时集中处理重复名称、未知 Tool、
 * 文档版本冲突和异常转换，避免这些规则散落在对话 UI 中。
 */
export class EditorToolRegistry {
  readonly tools: readonly EditorTool[]
  private readonly toolsByName: ReadonlyMap<string, EditorTool>

  /** 注册 Tool 并建立名称索引；名称重复会造成模型调用歧义，因此初始化时直接失败。 */
  constructor(tools: readonly EditorTool[]) {
    this.tools = tools
    const toolsByName = new Map<string, EditorTool>()
    for (const tool of tools) {
      if (toolsByName.has(tool.name)) throw new Error(`Duplicate editor tool: ${tool.name}`)
      toolsByName.set(tool.name, tool)
    }
    this.toolsByName = toolsByName
  }

  /** 当前 Registry 中全部可发送给 OpenAI Responses API 的定义。 */
  get definitions(): FunctionTool[] {
    return this.tools.map((tool) => tool.definition)
  }

  /** 根据模型返回的名称和 JSON 字符串分发本地 Tool。 */
  execute(name: string, rawArguments: string, context: AiEditorContext): EditorToolExecution {
    const tool = this.toolsByName.get(name)
    if (!tool) return { output: { ok: false, error: `Unknown editor tool: ${name}` } }
    return tool.execute(parseArguments(rawArguments), context)
  }

  /**
   * 应用已经通过审批的修改提案。
   *
   * 必须同时满足“仍处于 pending”和“文档版本未变化”。即使位置仍然合法，
   * 也不能把旧提案静默应用到新文档，因为它的语义上下文可能已经失效。
   */
  apply(
    editor: Editor,
    documentVersion: number,
    proposal: AiEditorToolProposal,
  ): AiEditorToolApplyResult {
    if (proposal.status !== 'pending') return { ok: false, message: 'This proposal is no longer pending.' }
    if (proposal.documentVersion !== documentVersion) {
      return { ok: false, message: 'The document changed. Ask AI to create a new proposal.' }
    }

    const tool = this.toolsByName.get(proposal.tool)
    if (!tool) return { ok: false, message: `Unknown editor tool: ${proposal.tool}` }

    try {
      // 具体 Tool 应通过一个 chain/transaction 完成修改，以保证一次 Undo 可以整体撤销。
      tool.apply(editor, proposal.arguments)
      proposal.status = 'applied'
      return { ok: true, message: 'Applied to the document.' }
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Could not apply this proposal.',
      }
    }
  }
}
