import { OpenAiService, type OpenAiServiceConfig } from './OpenAiService'
import {registerAiProvider} from './Providers'
export {AI_PROVIDERS, getAiProvider, getAiProviders, registerAiProvider, type AiProviderDefinition} from './Providers'
import type {
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
  AiProviderServiceConfig,
  CustomAiServiceConfig,
} from './types'

/**
 * 将声明式配置或现成的 AiService 实例统一转换为 AiService。
 *
 * OpenAI 配置由 OpenAiService 负责初始化 SDK；自定义配置的返回值允许是字符串，
 * 这里将其标准化，确保 AiEditor 后续只处理 AiGenerateResult。
 */
export function createAiService(config: AiService | AiServiceConfig): AiService {
  if ('provider' in config) {
    if ('generate' in config) {
      return {
        async generate(request, context) {
          const result = await config.generate(request, context)
          return typeof result === 'string' ? { text: result } : result
        },
      }
    }
    config.providers?.forEach(registerAiProvider)
    return new OpenAiService(config)
  }
  return config
}

// AI 模块的公共出口。调用方不需要依赖内部文件布局。
export { OpenAiService }
export {
  applyEditorToolProposal,
  editorFunctionTools,
  editorTools,
  executeEditorFunctionTool,
} from './editor-tools'
export {
  ApplyFormattingTool,
  ApplyTextEditsTool,
  defaultEditorToolRegistry,
  defaultEditorTools,
  EditorMutationTool,
  EditorTool,
  EditorToolRegistry,
  rebaseEditorToolProposal,
  GetEditorContextTool,
  InsertContentTool,
  ReplaceSelectionTool,
  SearchDocumentTool,
  type EditorToolExecution,
} from './tools'
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
  AiProviderServiceConfig,
  CustomAiServiceConfig,
  OpenAiServiceConfig,
}
