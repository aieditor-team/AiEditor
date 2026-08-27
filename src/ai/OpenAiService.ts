import OpenAI from 'openai'
import type {ClientOptions} from 'openai'
import type {
    Response,
    ResponseCreateParamsNonStreaming,
    ResponseFunctionToolCall,
    ResponseInput
} from 'openai/resources/responses/responses'
import {editorFunctionTools, executeEditorFunctionTool} from './editor-tools'
import {getAiProvider} from './Providers'
import type {AiProviderDefinition} from './Providers'
import type {AiEditorContext, AiEditorToolProposal, AiGenerateRequest, AiGenerateResult, AiService} from './types'

type OpenAiResponseOptions = Omit<ResponseCreateParamsNonStreaming, 'input' | 'instructions' | 'model' | 'stream'>

/**
 * OpenAI Responses API 服务配置。
 *
 * 除 `provider` 和 `model` 外，大部分字段会原样传给官方 OpenAI SDK。
 * OpenAI 协议兼容服务可以通过 `baseURL` 接入；浏览器环境必须显式设置
 * `dangerouslyAllowBrowser`，生产环境仍应优先通过服务端代理保护 API Key。
 */
export interface OpenAiServiceConfig {
    /** 用于 createAiService 判别配置类型。 */
    /** Built-in or registered supplier identifier. */
    provider: string | AiProviderDefinition
    /** Optional instance configuration for several application-specific suppliers. */
    providers?: readonly AiProviderDefinition[]
    /** Responses API 使用的模型名称。 */
    model?: string
    apiKey?: ClientOptions['apiKey']
    baseURL?: ClientOptions['baseURL']
    client?: OpenAI
    organization?: ClientOptions['organization']
    project?: ClientOptions['project']
    timeout?: ClientOptions['timeout']
    maxRetries?: ClientOptions['maxRetries']
    defaultHeaders?: ClientOptions['defaultHeaders']
    fetch?: ClientOptions['fetch']
    fetchOptions?: ClientOptions['fetchOptions']
    dangerouslyAllowBrowser?: boolean
    /** 合并到每次 responses.create 调用中的额外参数。核心字段由服务内部接管。 */
    response?: OpenAiResponseOptions
    /** 完全自定义发送给模型的 input 文本。 */
    buildInput?: (request: AiGenerateRequest, context: AiEditorContext) => string
}

/** 基于官方 OpenAI SDK 的 AiService 实现。 */
export class OpenAiService implements AiService {
    readonly client: OpenAI
    private readonly config: OpenAiServiceConfig

    /** 创建或复用 OpenAI Client，并保留生成阶段需要的服务配置。 */
    constructor(config: OpenAiServiceConfig) {
        const provider = typeof config.provider === 'string'
            ? getAiProvider(config.provider)
            : config.provider
        const model = config.model ?? provider?.model
        if (!model?.trim()) throw new Error('OpenAiService requires a model')
        this.config = {...config, model}
        this.client = config.client ?? new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL ?? provider?.baseURL,
            organization: config.organization,
            project: config.project,
            timeout: config.timeout,
            maxRetries: config.maxRetries,
            defaultHeaders: config.defaultHeaders,
            fetch: config.fetch,
            fetchOptions: config.fetchOptions,
            dangerouslyAllowBrowser: config.dangerouslyAllowBrowser,
        })
    }

    /**
     * 执行一次生成请求。
     *
     * 普通生成分为流式和非流式两条路径；启用 `editorTools` 时进入多轮
     * Function Calling 循环，由模型决定何时停止调用 Tool 并返回最终文本。
     */
    async generate(request: AiGenerateRequest, context: AiEditorContext): Promise<AiGenerateResult<Response | undefined>> {
        if (!request.prompt.trim()) throw new Error('AI prompt cannot be empty')

        if (request.editorTools) return this.generateWithEditorTools(request, context)

        // 只要调用方提供 onChunk，就按流式请求处理，避免 UI 等到完整响应后才更新。
        if (request.stream || request.onChunk) {
            const stream = await this.client.responses.create({
                ...this.config.response,
                model: this.config.model,
                instructions: request.instructions,
                input: this.config.buildInput?.(request, context) ?? this.buildInput(request, context),
                stream: true,
            }, {signal: request.signal})
            let text = ''
            for await (const event of stream) {
                // Responses 流还包含生命周期、Tool 等事件；普通文本生成只消费文本增量。
                if (event.type !== 'response.output_text.delta') continue
                text += event.delta
                request.onChunk?.(event.delta)
            }
            return {text}
        }

        const response = await this.client.responses.create({
            ...this.config.response,
            model: this.config.model,
            instructions: request.instructions,
            input: this.config.buildInput?.(request, context) ?? this.buildInput(request, context),
            stream: false,
        }, {signal: request.signal})

        return {text: response.output_text, raw: response}
    }

    /**
     * 运行带编辑器 Tool 的 Responses API 调用循环。
     *
     * 每一轮把模型返回的 function_call 在本地执行，再把 function_call_output 追加到
     * 下一轮 input。修改型 Tool 只产生提案，不会绕过宿主应用的审批策略直接改文档。
     */
    private async generateWithEditorTools(
        request: AiGenerateRequest,
        context: AiEditorContext,
    ): Promise<AiGenerateResult<Response | undefined>> {
        const initialInput = this.config.buildInput?.(request, context) ?? this.buildInput(request, context)
        let input: ResponseInput = [{role: 'user', content: initialInput}]
        let finalResponse: Response | undefined
        let text = ''
        const toolProposals: AiEditorToolProposal[] = []

        // 设置硬上限，防止模型持续调用 Tool 导致无界请求和费用增长。
        for (let round = 0; round < 8; round += 1) {
            if (request.stream || request.onChunk) {
                const stream = await this.client.responses.create({
                    ...this.config.response,
                    model: this.config.model,
                    instructions: request.instructions,
                    input,
                    tools: editorFunctionTools,
                    stream: true,
                }, {signal: request.signal})
                for await (const event of stream) {
                    if (event.type === 'response.output_text.delta') {
                        text += event.delta
                        request.onChunk?.(event.delta)
                    }
                    // 完成事件携带完整 output，其中包含后续需要处理的 function_call。
                    if (event.type === 'response.completed') finalResponse = event.response
                }
            } else {
                finalResponse = await this.client.responses.create({
                    ...this.config.response,
                    model: this.config.model,
                    instructions: request.instructions,
                    input,
                    tools: editorFunctionTools,
                    stream: false,
                }, {signal: request.signal})
                text += finalResponse.output_text
            }

            if (!finalResponse) throw new Error('AI response stream ended before completion')
            const calls = finalResponse.output.filter((item): item is ResponseFunctionToolCall => item.type === 'function_call')
            // 没有新的 Tool 调用表示模型已完成本轮任务，可以把文本和提案交还给对话 UI。
            if (!calls.length) return {text: text || finalResponse.output_text, raw: finalResponse, toolProposals}

            const outputs: ResponseInput = calls.map((call) => {
                try {
                    const execution = executeEditorFunctionTool(call.name, call.arguments, context)
                    if (execution.proposal) toolProposals.push(execution.proposal)
                    return {
                        type: 'function_call_output',
                        call_id: call.call_id,
                        output: JSON.stringify(execution.output)
                    }
                } catch (error) {
                    // Tool 参数错误需要作为输出返回模型，让模型有机会修正参数，而不是中断整轮对话。
                    return {
                        type: 'function_call_output',
                        call_id: call.call_id,
                        output: JSON.stringify({
                            ok: false,
                            error: error instanceof Error ? error.message : 'Tool execution failed'
                        }),
                    }
                }
            })
            // Responses API 要求保留上一轮 output，并在其后附加对应 call_id 的 Tool 输出。
            input = [...input, ...finalResponse.output, ...outputs] as ResponseInput
            finalResponse = undefined
        }

        throw new Error('AI exceeded the maximum editor tool call rounds')
    }

    /**
     * 根据 scope 组装默认模型输入。
     * `none` 适合与文档无关的对话；未显式指定时，有选区优先使用选区，否则使用全文。
     */
    private buildInput(request: AiGenerateRequest, context: AiEditorContext): string {
        const scope = request.scope ?? (context.selectedText ? 'selection' : 'document')
        const conversation = request.history?.length
            ? `${request.history.map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`).join('\n')}\nUser: ${request.prompt}`
            : request.prompt
        if (scope === 'none') return conversation

        // 这里发送纯文本而非 HTML，避免标记噪声干扰常规写作请求。
        const content = scope === 'selection' ? context.selectedText : context.text
        const label = scope === 'selection' ? 'Selected text' : 'Document'
        return `${conversation}\n\n${label}:\n${content}`
    }
}
