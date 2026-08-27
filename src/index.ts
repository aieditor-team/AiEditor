// 稳定的公共入口；外部使用方不应依赖 src 下的内部目录结构。
import './styles/aieditor.css'

export {Editor} from '@tiptap/core'
export { AiEditor } from './editor/AiEditor'
export { AiEditorOptions } from './editor/AiEditorOptions'
export type {AiEditorOptions as AiEditorOptionsShape} from './editor/AiEditorOptions'
export type {ContentSanitizationOptions} from './editor/AiEditorOptions'
export {
  formatContentSanitizationWarning,
  sanitizeContentForSchema,
  type ContentSanitizationIssue,
  type ContentSanitizationIssueKind,
  type ContentSanitizationResult,
} from './editor/AiEditorContentSanitizer'
export type {
  AiEditorProductBubbleMenu,
  AiEditorProductContext,
  AiEditorProductExtensions,
  AiEditorProductSurface,
} from './editor/AiEditorProduct'
export type {
  DocumentLength,
  DocumentPageFormat,
  DocumentPageFormatName,
  DocumentPageHeaderFooter,
  DocumentPageMargins,
  DocumentPageNumberFormat,
  DocumentPageNumberOptions,
  DocumentPageNumberPosition,
} from './editor/DocumentPageTypes'
export type { AiEditorTheme } from './editor/AiEditorTheme'
export type {
  AiEditorTemplateContext,
  AiEditorTemplateFactory,
  AiEditorTemplateSlots,
} from './editor/AiEditorTemplate'
export type {
  DocumentOutlineItem,
  DocumentOutlinePosition,
} from './editor/AiEditorDocumentOutline'
export {
  DOCUMENT_STYLE_PRESETS,
  extendDocumentStyle,
  resolveDocumentStyle,
  type DocumentBlockquoteStyle,
  type DocumentGridOptions,
  type DocumentHeadingLevel,
  type DocumentHeadingStyle,
  type DocumentTitleStyle,
  type DocumentParagraphStyle,
  type DocumentLinkStyle,
  type DocumentListStyle,
  type DocumentMediaStyle,
  type DocumentPageChromeStyle,
  type DocumentPageFormatOptions,
  type DocumentPageStyle,
  type DocumentRuleStyle,
  type DocumentStyleConfig,
  type DocumentStyleOptions,
  type DocumentStylePreset,
  type DocumentTextStyle,
  type DocumentTableStyle,
  type ResolvedDocumentStyle,
} from './editor/AiEditorDocumentStyle'
export * from './i18n'
export * from './uploader'
export * from './menus'
export * from './features'
export * from './tinyui'
export {
  AiEditorExtensionManager,
  type AiEditorExtensionContext,
} from './editor/runtime/AiEditorExtensionManager'

export {
  applyEditorToolProposal,
  createAiService,
  defaultEditorToolRegistry,
  defaultEditorTools,
  editorFunctionTools,
  editorTools,
  executeEditorFunctionTool,
  ApplyFormattingTool,
  ApplyTextEditsTool,
  EditorMutationTool,
  EditorTool,
  EditorToolRegistry,
  GetEditorContextTool,
  InsertContentTool,
  OpenAiService,
  AI_PROVIDERS,
  getAiProvider,
  getAiProviders,
  registerAiProvider,
  ReplaceSelectionTool,
  SearchDocumentTool,
} from './ai'
export type {
  AiContentScope,
  AiChatMessage,
  AiEditorContext,
  AiEditorToolApplyResult,
  AiEditorToolApproval,
  AiEditorToolName,
  AiEditorToolProposal,
  AiGenerateRequest,
  AiGenerateResult,
  AiService,
  AiServiceConfig,
  CustomAiServiceConfig,
  EditorToolExecution,
  OpenAiServiceConfig,
  AiProviderServiceConfig,
  AiProviderDefinition,
} from './ai'

export * from './extensions'
export type { MentionNodeAttrs } from '@tiptap/extension-mention'
