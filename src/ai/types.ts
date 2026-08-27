import type {Editor} from '@tiptap/core'

/** AI 请求可以携带给模型的编辑器内容范围。 */
export type AiContentScope = 'document' | 'selection' | 'none'

/**
 * AI 对话中的一条历史消息。
 *
 * `toolProposals` 只出现在助手消息上，用于让界面渲染待确认或已执行的编辑器操作。
 */
export interface AiChatMessage {
    /** 消息发送方。当前不包含 system，系统指令通过 AiGenerateRequest.instructions 传递。 */
    role: 'user' | 'assistant'
    /** 已完成的消息正文；流式生成期间由上层 UI 逐步拼接。 */
    content: string
    /** 本轮模型调用产生的编辑器变更提案。 */
    toolProposals?: AiEditorToolProposal[]
}

/** AiEditor 内置且允许暴露给模型的 Function Calling 名称。 */
export type AiEditorToolName =
    | 'get_editor_context'
    | 'search_document'
    | 'replace_selection'
    | 'insert_content'
    | 'apply_formatting'
    | 'apply_text_edits'

export type AiEditorToolApproval =
/** 所有修改型 Tool 都需要用户确认。 */
    | 'always'
    /** 所有修改型 Tool 都自动执行。 */
    | 'never'
    /** 仅数组中列出的 Tool 需要用户确认。 */
    | AiEditorToolName[]
    /** 返回 true 表示该提案需要用户确认。 */
    | ((proposal: AiEditorToolProposal) => boolean)

/**
 * 修改型 Tool 的可持久化提案。
 *
 * Tool 在生成提案时不会立即修改编辑器。上层根据审批策略决定自动应用，
 * 还是将它显示给用户。`documentVersion` 用于避免把过期提案应用到已变化的文档。
 */
export interface AiEditorToolProposal {
    /** 单次提案的唯一标识，用于 UI 列表和审批操作。 */
    id: string
    /** 创建此提案的 Tool。 */
    tool: AiEditorToolName
    /** 面向用户的简短标题。 */
    title: string
    /** 面向用户的操作说明。 */
    description: string
    /** 已校验并补充内部位置字段的 Tool 参数。 */
    arguments: Record<string, unknown>
    /** 创建提案时的编辑器文档版本。 */
    documentVersion: number
    /** 提案当前的生命周期状态。 */
    status: 'pending' | 'applied' | 'discarded'
    /** UI 可展示的执行结果或失败原因。 */
    message?: string
}

/** 应用编辑器 Tool 提案后的统一返回值。 */
export interface AiEditorToolApplyResult {
    ok: boolean
    message: string
}

/**
 * 每次 AI 请求的编辑器快照。
 *
 * 除 `editor` 外，其余字段都代表请求发起时的状态。自定义服务应优先使用这些快照字段，
 * 避免异步请求结束后读取到与请求开始时不一致的内容。
 */
export interface AiEditorContext {
    /** 底层 Tiptap Editor，主要供内置 Tool 读取结构化文档。 */
    editor: Editor
    /** 请求发起时的完整 HTML。 */
    html: string
    /** 请求发起时的完整纯文本。 */
    text: string
    /** 当前选区纯文本；光标选区时为空字符串。 */
    selectedText: string
    /** ProseMirror 文档坐标中的选区范围。 */
    selection: { from: number; to: number }
    /** AiEditor 维护的单调递增文档版本。 */
    documentVersion: number
}

/** 一次文本生成或 AI 对话请求。 */
export interface AiGenerateRequest {
    /** 用户本轮输入或单次写作指令。 */
    prompt: string
    /** 作为模型级指令发送的提示词。 */
    instructions?: string
    /** 自动附加选区、全文或不附加编辑器内容。 */
    scope?: AiContentScope
    /** 供自定义服务透传的业务元数据，内置 OpenAI 服务不会主动解释。 */
    metadata?: Record<string, unknown>
    /** 已完成的对话历史，不应包含当前 prompt。 */
    history?: AiChatMessage[]
    /** 强制启用流式请求。提供 onChunk 时也会自动使用流式请求。 */
    stream?: boolean
    /** 每收到一段文本增量时调用。 */
    onChunk?: (chunk: string) => void
    /** 是否向模型暴露内置编辑器 Function Calling。 */
    editorTools?: boolean
    /** 用于取消网络请求和后续 Tool 调用循环。 */
    signal?: AbortSignal
}

/** AI 服务的标准生成结果。 */
export interface AiGenerateResult<Raw = unknown> {
    /** 最终拼接完成的助手文本。 */
    text: string
    /** 服务商原始响应，便于高级调用方读取用量等信息。 */
    raw?: Raw
    /** 本轮 Function Calling 生成的编辑器变更提案。 */
    toolProposals?: AiEditorToolProposal[]
}

/** 所有 AI 服务实现都必须满足的最小接口。 */
export interface AiService {
    generate(request: AiGenerateRequest, context: AiEditorContext): Promise<AiGenerateResult>
}

/** 不要求兼容 OpenAI 协议的自定义 AI 服务配置。 */
export interface CustomAiServiceConfig {
    provider: 'custom'

    /** 允许直接返回字符串，createAiService 会把它标准化为 AiGenerateResult。 */
    generate(request: AiGenerateRequest, context: AiEditorContext): Promise<AiGenerateResult | string>
}

/** Configuration for a built-in or registered OpenAI-compatible supplier. */
export type AiProviderServiceConfig = Omit<import('./OpenAiService').OpenAiServiceConfig, 'provider'> & {
    provider: string | import('./Providers').AiProviderDefinition
}

/** AiEditor 构造函数可接受的声明式 AI 服务配置。 */
export type AiServiceConfig = import('./OpenAiService').OpenAiServiceConfig | AiProviderServiceConfig | CustomAiServiceConfig
