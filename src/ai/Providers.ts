import type {ClientOptions} from 'openai'

/** OpenAI-compatible supplier metadata used to fill in endpoint and model defaults. */
export interface AiProviderDefinition {
    /** Stable identifier used by AiServiceConfig.provider. */
    id: string
    /** Human-readable supplier name. */
    name: string
    /** OpenAI-compatible API endpoint. */
    baseURL?: ClientOptions['baseURL']
    /** Default model; callers may override it per editor instance. */
    model: string
}

/** Built-in suppliers. Endpoints are only used when the caller explicitly selects one. */
export const AI_PROVIDERS: readonly AiProviderDefinition[] = [
    {id: 'openai', name: 'OpenAI', model: 'gpt-4o-mini'},
    {id: 'deepseek', name: 'DeepSeek', baseURL: 'https://api.deepseek.com', model: 'deepseek-chat'},
    {id: 'qwen', name: '通义千问', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus'},
    {id: 'zhipu', name: '智谱清言', baseURL: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash'},
    {id: 'moonshot', name: 'Moonshot', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k'},
]

const providers = new Map(AI_PROVIDERS.map((provider) => [provider.id, provider]))

/** Register or replace a supplier for applications that use another OpenAI-compatible endpoint. */
export function registerAiProvider(provider: AiProviderDefinition): void {
    if (!provider.id.trim()) throw new Error('AI provider id cannot be empty')
    if (!provider.name.trim()) throw new Error('AI provider name cannot be empty')
    if (!provider.model.trim()) throw new Error('AI provider model cannot be empty')
    providers.set(provider.id, Object.freeze({...provider}))
}

/** Return a snapshot of all built-in and registered suppliers. */
export function getAiProviders(): readonly AiProviderDefinition[] {
    return [...providers.values()]
}

export function getAiProvider(id: string): AiProviderDefinition | undefined {
    return providers.get(id)
}
