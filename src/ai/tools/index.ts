import { EditorToolRegistry } from './core'
import {
  ApplyFormattingTool,
  ApplyTextEditsTool,
  GetEditorContextTool,
  InsertContentTool,
  ReplaceSelectionTool,
  SearchDocumentTool,
} from './implementations'

/** AiEditor 默认向模型开放的六个 Tool 实例。只读 Tool 排在修改型 Tool 前便于维护和检查。 */
export const defaultEditorTools = [
  new GetEditorContextTool(),
  new SearchDocumentTool(),
  new ReplaceSelectionTool(),
  new InsertContentTool(),
  new ApplyFormattingTool(),
  new ApplyTextEditsTool(),
] as const

/** 默认 Registry 是兼容旧版函数式 API 与 AI 对话的共享入口。 */
export const defaultEditorToolRegistry = new EditorToolRegistry(defaultEditorTools)

// 同时导出抽象层和具体实现，允许使用方构造自己的 Registry。
export * from './core'
export * from './implementations'
