import type {AiEditorContext, AiEditorToolProposal} from '../../types'
import {EditorTool, type EditorToolExecution} from './EditorTool'

/**
 * 所有“会修改编辑器”的 Tool 基类。
 *
 * execute 阶段只校验参数并创建提案，真正修改文档的 apply 由具体 Tool 实现。
 * 这一分离保证 UI 可以统一执行人工审批、自动执行和过期检查。
 */
export abstract class EditorMutationTool extends EditorTool {
    /** 提案卡片中展示的标题与说明。 */
    protected abstract readonly proposalTitle: string
    protected abstract readonly proposalDescription: string

    /** 校验并冻结参数，然后创建状态为 pending 的变更提案。 */
    execute(arguments_: Record<string, unknown>, context: AiEditorContext): EditorToolExecution {
        // 子类可将当前选区等瞬时状态写入内部参数，确保审批后仍使用生成提案时的位置。
        this.prepareArguments(arguments_, context)
        const proposal: AiEditorToolProposal = {
            // 浏览器通常支持 randomUUID；降级路径兼容较旧运行环境和部分测试环境。
            id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            tool: this.name,
            title: this.proposalTitle,
            description: this.proposalDescription,
            arguments: arguments_,
            documentVersion: context.documentVersion,
            status: 'pending',
        }

        // 模型只需要知道提案已创建；是否应用由宿主审批策略决定。
        return {
            output: {ok: true, status: 'pending_user_approval', proposal_id: proposal.id},
            proposal,
        }
    }

    /** 校验模型参数，并按需补充 apply 阶段使用的内部参数。 */
    protected abstract prepareArguments(
        arguments_: Record<string, unknown>,
        context: AiEditorContext,
    ): void
}
