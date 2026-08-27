import type { Editor } from '@tiptap/core'
import type { AiEditorContext, AiEditorToolApplyResult, AiEditorToolProposal } from './types'
import {
  defaultEditorToolRegistry,
  defaultEditorTools,
  type EditorToolExecution,
} from './tools'

/** 默认 Tool 类实例，供需要检查或扩展 Tool 集合的调用方使用。 */
export const editorTools = defaultEditorTools

/** OpenAI Responses API 可直接消费的 Function Tool 定义。 */
export const editorFunctionTools = defaultEditorToolRegistry.definitions

/**
 * 执行模型发起的 Tool 调用。
 *
 * 该函数只负责解析、校验和生成结果/提案。修改型 Tool 不会在这里直接改变编辑器，
 * 从而给宿主应用保留审批机会。
 */
export function executeEditorFunctionTool(
  name: string,
  rawArguments: string,
  context: AiEditorContext,
): EditorToolExecution {
  return defaultEditorToolRegistry.execute(name, rawArguments, context)
}

/**
 * 将已经审批通过的修改提案应用到编辑器。
 * Registry 会先验证提案状态和文档版本，再交给对应 Tool 执行实际事务。
 */
export function applyEditorToolProposal(
  editor: Editor,
  documentVersion: number,
  proposal: AiEditorToolProposal,
): AiEditorToolApplyResult {
  return defaultEditorToolRegistry.apply(editor, documentVersion, proposal)
}
