import type {Editor} from '@tiptap/core'
import {
    BrushCleaning,
    Check,
    Copy,
    CornerDownLeft,
    createElement,
    FileText,
    LoaderCircle,
    Sparkles,
    RefreshCw,
    Replace,
    SendHorizontal,
    Square,
    X
} from 'lucide'
import {marked} from 'marked'
import type {
    AiChatMessage,
    AiContentScope,
    AiEditorToolApplyResult,
    AiEditorToolApproval,
    AiEditorToolProposal,
    AiGenerateRequest,
    AiGenerateResult
} from '../../../ai'
import type {AiEditorProductContext} from '../../../editor/AiEditorProduct'
import {html, type LucideIconNode, type TinyUIView} from '../../../tinyui'
import type {SidebarItem} from '../SidebarSurface'

let aiChatPanelSequence = 0

/** AiSidebarItem 稳定外壳所需的最小响应式状态。消息内容仍由专用安全渲染器维护。 */
interface AiSidebarViewState extends Record<string, unknown> {
    panelId: string
    panelClass: string
    title: string
    clearLabel: string
    latestLabel: string
    contextLabel: string
    documentLabel: string
    selectionLabel: string
    noneLabel: string
    inputLabel: string
    placeholder: string
    scope: AiContentScope
    selectionDisabled: boolean
    inputDisabled: boolean
    sendDisabled: boolean
    clearDisabled: boolean
    scopeDisabled: boolean
    sendLabel: string
    clearIcon: LucideIconNode
    documentIcon: LucideIconNode
    latestIcon: LucideIconNode
    sendIcon: LucideIconNode
    busy: boolean
    latestHidden: boolean
    clear: (event: Event) => void
    submit: (event: Event) => void
    inputKeydown: (event: Event) => void
    inputChanged: (event: Event) => void
    scopeChanged: (event: Event) => void
    messagesScrolled: (event: Event) => void
    scrollToLatest: (event: Event) => void
}

export interface AiSidebarItemOptions {
    id?: string
    welcomeMessage?: string
    placeholder?: string
    instructions?: string
    toolApproval?: AiEditorToolApproval
    generate: (request: AiGenerateRequest) => Promise<AiGenerateResult>
    isConfigured: () => boolean
    applyToolProposal: (proposal: AiEditorToolProposal) => AiEditorToolApplyResult
    onError?: (error: unknown) => void
}

/** AI 对话 Sidebar Item，负责流式响应和 Tool 提案审批。 */
export class AiSidebarItem implements SidebarItem {
    readonly id: string
    readonly label = 'AI assistant'
    private readonly options: Required<Pick<AiSidebarItemOptions, 'welcomeMessage' | 'placeholder' | 'instructions' | 'toolApproval'>> & AiSidebarItemOptions
    private panel: HTMLElement | null = null
    private input: HTMLTextAreaElement | null = null
    private messagesElement: HTMLElement | null = null
    private scopeSelect: HTMLSelectElement | null = null
    private scrollToLatestButton: HTMLButtonElement | null = null
    private view: TinyUIView<AiSidebarViewState> | null = null
    private editor: Editor | null = null
    private messages: AiChatMessage[] = []
    private scope: AiContentScope = 'document'
    private busy = false
    private requestController: AbortController | null = null
    private streamFrame: number | null = null
    private errorMessage: string | null = null
    private noticeMessage: string | null = null
    private lastRequest: { prompt: string; scope: AiContentScope } | null = null
    private events = new AbortController()
    private translate: (value: string) => string = (value) => value

    /** 保存 AI 回调与界面配置，具体 DOM 在 mount 时创建。 */
    constructor(options: AiSidebarItemOptions) {
        this.id = options.id ?? 'ai-chat'
        this.options = {
            ...options,
            welcomeMessage: options.welcomeMessage ?? 'Welcome to AiEditor Assistant. Ask anything about your content.',
            placeholder: options.placeholder ?? 'Ask about this document...',
            instructions: options.instructions ?? 'You are an editing assistant with editor tools. Use read tools to inspect the document. When the user asks to change the document, call the appropriate mutation tool to create a proposal. Never claim a proposed edit was applied before the host processes it.',
            toolApproval: options.toolApproval ?? 'always',
        }
    }

    renderIcon(): Node {
        return createElement(Sparkles, {'aria-hidden': 'true'})
    }

    /** SidebarSurface 提供内容容器；AI Item 只负责聊天面板和业务事件。 */
    mountContent(context: AiEditorProductContext, host: HTMLElement): void {
        if (this.panel) throw new Error(`SidebarItem "${this.id}" is already mounted`)
        if (this.events.signal.aborted) this.events = new AbortController()
        this.translate = (value) => context.i18n.t(value)
        const document = context.editor.view.dom.ownerDocument
        this.editor = context.editor

        const title = this.translate('AI assistant')
        const view = html<AiSidebarViewState>(`
            <section #panel id="{{ panelId }}" class="{{ panelClass }}" role="region" aria-label="{{ title }}">
                <header class="aieditor__ai-chat-header">
                    <strong>{{ title }}</strong>
                    <div class="aieditor__ai-chat-tools">
                        <button #clear type="button" class="aieditor__ai-chat-icon"
                            title="{{ clearLabel }}" aria-label="{{ clearLabel }}"
                            :disabled="clearDisabled" @click="clear">
                            <LucideIcon :icon="clearIcon" />
                        </button>
                    </div>
                </header>
                <div class="aieditor__ai-chat-messages-shell">
                    <div #messages class="aieditor__ai-chat-messages" role="log" aria-live="polite"
                        aria-atomic="false" aria-busy="{{ busy }}" @scroll="messagesScrolled"></div>
                    <button #latest type="button" class="aieditor__ai-chat-icon aieditor__ai-chat-latest"
                        title="{{ latestLabel }}" aria-label="{{ latestLabel }}"
                        hidden="latestHidden" @click="scrollToLatest">
                        <LucideIcon :icon="latestIcon" />
                    </button>
                </div>
                <form class="aieditor__ai-chat-composer" @submit.prevent="submit">
                    <div class="aieditor__ai-chat-composer-meta">
                        <label class="aieditor__ai-chat-scope">
                            <LucideIcon :icon="documentIcon" />
                            <select #scope aria-label="{{ contextLabel }}" :value="scope"
                                :disabled="scopeDisabled" @change="scopeChanged">
                                <option value="document">{{ documentLabel }}</option>
                                <option value="selection" :disabled="selectionDisabled">{{ selectionLabel }}</option>
                                <option value="none">{{ noneLabel }}</option>
                            </select>
                        </label>
                    </div>
                    <div class="aieditor__ai-chat-composer-body">
                        <textarea #input rows="1" placeholder="{{ placeholder }}" aria-label="{{ inputLabel }}"
                            :disabled="inputDisabled" @keydown="inputKeydown" @input="inputChanged"></textarea>
                        <button #send type="submit" class="aieditor__ai-chat-icon aieditor__ai-chat-send"
                            title="{{ sendLabel }}" aria-label="{{ sendLabel }}" :disabled="sendDisabled">
                            <LucideIcon :icon="sendIcon" />
                        </button>
                    </div>
                </form>
            </section>
        `, {
            panelId: `aieditor-ai-chat-${++aiChatPanelSequence}`,
            panelClass: 'aieditor__ai-chat aieditor__ai-chat--sidebar',
            title,
            clearLabel: this.translate('Clear conversation'),
            latestLabel: this.translate('Scroll to latest message'),
            contextLabel: this.translate('AI context'),
            documentLabel: this.translate('Entire document'),
            selectionLabel: this.translate('Current selection'),
            noneLabel: this.translate('No document context'),
            inputLabel: this.translate('Message AI assistant'),
            placeholder: this.translate(this.options.placeholder),
            scope: this.scope,
            selectionDisabled: true,
            inputDisabled: false,
            sendDisabled: true,
            clearDisabled: false,
            scopeDisabled: false,
            sendLabel: this.translate('Send message'),
            clearIcon: BrushCleaning,
            documentIcon: FileText,
            latestIcon: CornerDownLeft,
            sendIcon: SendHorizontal,
            busy: false,
            latestHidden: true,
            clear: () => this.clear(),
            submit: () => {
                if (this.busy) this.stopGenerating()
                else void this.send()
            },
            inputKeydown: (event) => {
                const keyboardEvent = event as KeyboardEvent
                if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
                    keyboardEvent.preventDefault()
                    void this.send()
                }
            },
            inputChanged: () => {
                this.resizeInput()
                this.renderAvailability()
            },
            scopeChanged: (event) => {
                this.scope = (event.currentTarget as HTMLSelectElement).value as AiContentScope
                // 原生 select 已先改变 value；同步 TinyUI context，确保后续回退更新不会被缓存跳过。
                this.view?.update({scope: this.scope})
            },
            messagesScrolled: () => this.updateScrollToLatest(),
            scrollToLatest: () => this.scrollToLatest(),
        }, {document})

        this.view = view
        this.panel = view.root
        this.input = view.refs.input as HTMLTextAreaElement
        this.messagesElement = view.refs.messages as HTMLElement
        this.scopeSelect = view.refs.scope as HTMLSelectElement
        this.scrollToLatestButton = view.refs.latest as HTMLButtonElement
        view.mount(host)
        this.refreshScopeOptions()
        this.renderMessages()
        this.renderAvailability()
    }

    updateContent(context: AiEditorProductContext): void {
        this.editor = context.editor
        this.refreshScopeOptions()
    }

    /** 中止进行中的请求并释放 Sidebar Item DOM 与监听器。 */
    destroy(): void {
        this.requestController?.abort()
        if (this.streamFrame !== null) cancelAnimationFrame(this.streamFrame)
        this.events.abort()
        this.view?.destroy()
        this.view = null
        this.panel = null
        this.input = null
        this.messagesElement = null
        this.scopeSelect = null
        this.scrollToLatestButton = null
        this.editor = null
    }

    /** 清空会话历史，但保留欢迎消息和当前配置。 */
    private clear(): void {
        if (this.busy) return
        this.messages = []
        this.errorMessage = null
        this.noticeMessage = null
        this.lastRequest = null
        this.renderMessages(false, true)
        this.input?.focus()
    }

    /** 发送消息并把流式增量写入临时助手消息。 */
    private async send(): Promise<void> {
        const content = this.input?.value.trim()
        if (!content || this.busy || !this.options.isConfigured()) return

        if (this.input) {
            this.input.value = ''
            this.resizeInput()
        }
        await this.sendPrompt(content, true, this.scope)
    }

    /** 执行一轮请求；重试时复用已经存在的用户消息。 */
    private async sendPrompt(content: string, appendUser: boolean, scope: AiContentScope): Promise<void> {
        if (this.busy || !this.options.isConfigured()) return

        // 重试不重复追加用户消息，并只把目标用户消息之前的内容作为历史上下文。
        const userIndex = appendUser ? this.messages.length : this.findLastUserMessageIndex()
        const history = this.messages.slice(0, Math.max(0, userIndex))
        if (appendUser) this.messages.push({role: 'user', content})
        this.lastRequest = {prompt: content, scope}
        this.errorMessage = null
        this.noticeMessage = null
        const controller = new AbortController()
        this.requestController = controller
        this.setBusy(true)
        this.renderMessages(true, true)
        let streamedText = ''

        try {
            const result = await this.options.generate({
                prompt: content,
                instructions: this.options.instructions,
                scope,
                history,
                stream: true,
                editorTools: true,
                signal: controller.signal,
                onChunk: (chunk) => {
                    if (controller.signal.aborted) return
                    // 流式阶段只更新当前助手消息，完成后再一次性附加 Tool 提案。
                    streamedText += chunk
                    const assistant = this.messages.at(-1)
                    if (assistant?.role === 'assistant') assistant.content = streamedText
                    else this.messages.push({role: 'assistant', content: streamedText})
                    this.queueStreamRender()
                },
            })
            if (controller.signal.aborted) throw new DOMException('Generation aborted', 'AbortError')
            // 某些服务只通过流返回文本，因此最终结果按完整响应、流缓存、兜底文案依次选择。
            const responseText = result.text.trim() || streamedText.trim()
                || this.translate(result.toolProposals?.length ? 'I prepared an editor change for your review.' : 'No response.')
            this.applyAutomaticProposals(result.toolProposals)
            const assistant = this.messages.at(-1)
            if (assistant?.role === 'assistant') {
                assistant.content = responseText
                assistant.toolProposals = result.toolProposals
            } else this.messages.push({role: 'assistant', content: responseText, toolProposals: result.toolProposals})
        } catch (error) {
            if (controller.signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
                this.noticeMessage = this.translate('Generation stopped')
            } else {
                this.errorMessage = error instanceof Error ? error.message : this.translate('AI request failed')
                this.options.onError?.(error)
            }
        } finally {
            // 仅清理本轮 controller，避免较早结束的请求覆盖后续请求状态。
            if (this.streamFrame !== null) cancelAnimationFrame(this.streamFrame)
            this.streamFrame = null
            if (this.requestController === controller) this.requestController = null
            this.setBusy(false)
            this.renderMessages()
            if (!this.panel?.hidden) this.input?.focus()
        }
    }

    /** 中止当前请求；统一的 finally 分支负责恢复输入与按钮状态。 */
    private stopGenerating(): void {
        this.requestController?.abort()
    }

    /** 根据审批策略自动应用无需确认的修改提案。 */
    private applyAutomaticProposals(proposals: AiEditorToolProposal[] = []): void {
        for (const proposal of proposals) {
            if (this.requiresApproval(proposal)) continue
            const result = this.options.applyToolProposal(proposal)
            proposal.message = result.ok ? 'Applied automatically.' : `Automatic apply failed: ${result.message}`
        }
    }

    /** 将 always、never、白名单和函数策略统一转换为布尔判断。 */
    private requiresApproval(proposal: AiEditorToolProposal): boolean {
        const policy = this.options.toolApproval
        if (policy === 'always') return true
        if (policy === 'never') return false
        if (Array.isArray(policy)) return policy.includes(proposal.tool)
        return policy(proposal)
    }

    /** 从消息状态重建对话列表，并保持滚动位置在最新消息。 */
    private renderMessages(loading = false, forceScroll = false): void {
        if (!this.messagesElement) return
        const stickToBottom = forceScroll || this.isNearBottom()
        this.messagesElement.replaceChildren()
        if (!this.messages.length) this.messagesElement.append(this.createMessage('assistant', this.options.welcomeMessage))
        this.messages.forEach((message, index) => {
            this.messagesElement?.append(this.createMessage(message.role, message.content, message.toolProposals, index))
        })
        if (loading) {
            const pending = this.createMessage('assistant', this.translate('Thinking...'))
            pending.classList.add('is-loading')
            pending.prepend(createElement(LoaderCircle, {'aria-hidden': 'true'}))
            this.messagesElement.append(pending)
        }
        if (this.errorMessage) this.messagesElement.append(this.createErrorMessage(this.errorMessage))
        if (this.noticeMessage) this.messagesElement.append(this.createNoticeMessage(this.noticeMessage))
        if (stickToBottom) this.scrollToLatest(false)
        else this.updateScrollToLatest(true)
    }

    /** AI 服务不可用时同步禁用入口和输入区域。 */
    private renderAvailability(): void {
        const configured = this.options.isConfigured()
        const hasPrompt = Boolean(this.input?.value.trim())
        const sendLabel = this.translate(this.busy ? 'Stop generating' : 'Send message')
        this.view?.update({
            panelClass: `aieditor__ai-chat aieditor__ai-chat--sidebar${this.busy ? ' is-busy' : ''}`,
            placeholder: this.translate(configured ? this.options.placeholder : 'Configure an AI service to start chatting'),
            inputDisabled: !configured || this.busy,
            sendDisabled: !configured || (!this.busy && !hasPrompt),
            clearDisabled: this.busy,
            scopeDisabled: !configured || this.busy,
            sendLabel,
            sendIcon: this.busy ? Square : SendHorizontal,
            busy: this.busy,
        })
    }

    /** 锁定输入与发送按钮，防止同一面板并发提交。 */
    private setBusy(busy: boolean): void {
        this.busy = busy
        this.renderAvailability()
    }

    /** 根据内容自动增高输入框，并把最大高度限制为三行左右。 */
    private resizeInput(): void {
        if (!this.input) return
        this.input.style.height = 'auto'
        const height = Math.min(this.input.scrollHeight, 112)
        this.input.style.height = `${Math.max(height, 40)}px`
        this.input.style.overflowY = this.input.scrollHeight > 112 ? 'auto' : 'hidden'
    }

    /** 根据编辑器实时选区启用或禁用“当前选区”上下文。 */
    private refreshScopeOptions(): void {
        if (!this.scopeSelect || !this.editor) return
        const selectionOption = this.scopeSelect.querySelector<HTMLOptionElement>('option[value="selection"]')
        const {from, to} = this.editor.state.selection
        const hasSelection = from !== to && Boolean(this.editor.state.doc.textBetween(from, to, '\n').trim())
        this.view?.update({selectionDisabled: !hasSelection})
        if (selectionOption) selectionOption.disabled = !hasSelection
        if (!hasSelection && this.scope === 'selection') {
            this.scope = 'document'
            this.view?.update({scope: this.scope})
        }
    }

    /** 找到最近一条用户消息，供重试与历史截断使用。 */
    private findLastUserMessageIndex(): number {
        for (let index = this.messages.length - 1; index >= 0; index -= 1) {
            if (this.messages[index].role === 'user') return index
        }
        return 0
    }

    /** 将高频流式 chunk 合并到每帧一次 DOM 重建，避免输入越长越卡。 */
    private queueStreamRender(): void {
        if (this.streamFrame !== null) return
        this.streamFrame = requestAnimationFrame(() => {
            this.streamFrame = null
            this.renderMessages()
        })
    }

    /** 判断用户是否仍停留在消息底部附近，避免强行打断向上阅读。 */
    private isNearBottom(): boolean {
        if (!this.messagesElement) return true
        return this.messagesElement.scrollHeight - this.messagesElement.scrollTop - this.messagesElement.clientHeight < 56
    }

    /** 滚动到最新消息并隐藏快捷滚动按钮。 */
    private scrollToLatest(smooth = true): void {
        if (!this.messagesElement) return
        if (typeof this.messagesElement.scrollTo === 'function') {
            this.messagesElement.scrollTo({
                top: this.messagesElement.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto',
            })
        } else {
            this.messagesElement.scrollTop = this.messagesElement.scrollHeight
        }
        this.updateScrollToLatest(false)
    }

    /** 根据滚动位置同步“回到最新消息”按钮。 */
    private updateScrollToLatest(forceVisible?: boolean): void {
        if (!this.scrollToLatestButton) return
        this.scrollToLatestButton.hidden = forceVisible === undefined ? this.isNearBottom() : !forceVisible
    }

    /** 创建一条消息及其 Tool 提案卡片。 */
    private createMessage(role: AiChatMessage['role'], content: string, proposals: AiEditorToolProposal[] = [], index = -1): HTMLElement {
        const message = document.createElement('div')
        message.className = `aieditor__ai-chat-message is-${role}`
        message.setAttribute('role', 'article')
        message.setAttribute('aria-label', this.translate(role === 'assistant' ? 'AI assistant' : 'You'))
        if (role === 'assistant') {
            const markdown = document.createElement('div')
            markdown.className = 'aieditor__ai-chat-markdown'
            renderMarkdown(markdown, content, this.translate)
            message.append(markdown)
        } else {
            const text = document.createElement('p')
            text.textContent = content
            message.append(text)
        }
        for (const proposal of proposals) message.append(this.createToolProposal(proposal))
        if (role === 'assistant' && index >= 0 && content.trim()) {
            message.append(this.createResponseActions(content, index, proposals))
        }
        return message
    }

    /** 创建复制、插入、替换和重新生成操作，并按当前编辑器状态控制可用性。 */
    private createResponseActions(content: string, index: number, proposals: AiEditorToolProposal[]): HTMLElement {
        const actions = document.createElement('div')
        const copy = this.createIconButton('Copy response', Copy)
        const insert = this.createIconButton('Insert response at cursor', CornerDownLeft)
        const replace = this.createIconButton('Replace selection with response', Replace)
        const retry = this.createIconButton('Regenerate response', RefreshCw)
        const isLastMessage = index === this.messages.length - 1
        const hasSelection = Boolean(this.editor && !this.editor.state.selection.empty)
        const canEdit = Boolean(this.editor?.isEditable) && !this.busy

        actions.className = 'aieditor__ai-response-actions'
        copy.classList.add('aieditor__ai-response-action')
        insert.classList.add('aieditor__ai-response-action')
        replace.classList.add('aieditor__ai-response-action')
        retry.classList.add('aieditor__ai-response-action')
        insert.disabled = !canEdit
        replace.disabled = !canEdit || !hasSelection
        retry.disabled = !isLastMessage || this.busy || proposals.some((proposal) => proposal.status === 'pending')

        this.listen(copy, 'click', () => {
            void this.copyResponse(copy, content)
        })
        this.listen(insert, 'click', () => this.insertResponse(content, false))
        this.listen(replace, 'click', () => this.insertResponse(content, true))
        this.listen(retry, 'click', () => {
            void this.regenerateResponse(index)
        })
        actions.append(copy, insert, replace, retry)
        return actions
    }

    /** 复制回复并短暂把按钮切换为成功状态。 */
    private async copyResponse(button: HTMLButtonElement, content: string): Promise<void> {
        try {
            await copyText(content)
            const label = this.translate('Copied')
            button.title = label
            button.setAttribute('aria-label', label)
            button.replaceChildren(createElement(Check, {'aria-hidden': 'true'}))
        } catch {
            this.errorMessage = this.translate('Could not copy the response')
            this.renderMessages()
        }
    }

    /** 将经过净化的 Markdown 插入光标处，或替换当前非空选区。 */
    private insertResponse(content: string, replaceSelection: boolean): void {
        if (!this.editor?.isEditable || (replaceSelection && this.editor.state.selection.empty)) return
        const chain = this.editor.chain().focus()
        const applied = (replaceSelection ? chain.deleteSelection() : chain)
            .insertContent(markdownToSafeHtml(content))
            .run()
        this.noticeMessage = this.translate(applied
            ? replaceSelection ? 'Selection replaced' : 'Response inserted'
            : 'Could not apply the response')
        this.renderMessages()
    }

    /** 删除最后一条助手回复，并复用对应用户问题与上下文范围重新请求。 */
    private async regenerateResponse(index: number): Promise<void> {
        if (this.busy || index !== this.messages.length - 1) return
        let userIndex = -1
        for (let messageIndex = index - 1; messageIndex >= 0; messageIndex -= 1) {
            if (this.messages[messageIndex].role === 'user') {
                userIndex = messageIndex
                break
            }
        }
        if (userIndex < 0) return
        const prompt = this.messages[userIndex].content
        const scope = this.lastRequest?.scope ?? this.scope
        this.messages.splice(index, 1)
        await this.sendPrompt(prompt, false, scope)
    }

    /** 创建带重试入口的错误提示；重试复用最近一次请求参数。 */
    private createErrorMessage(message: string): HTMLElement {
        const container = document.createElement('div')
        const text = document.createElement('p')
        const retry = this.createIconButton('Retry request', RefreshCw)
        container.className = 'aieditor__ai-chat-error'
        container.setAttribute('role', 'alert')
        text.textContent = `${this.translate('AI request failed')}: ${message}`
        retry.classList.add('aieditor__ai-chat-error-action')
        retry.append(document.createTextNode(this.translate('Retry')))
        retry.disabled = !this.lastRequest || this.busy
        this.listen(retry, 'click', () => {
            const request = this.lastRequest
            if (!request) return
            this.errorMessage = null
            void this.sendPrompt(request.prompt, false, request.scope)
        })
        container.append(text, retry)
        return container
    }

    /** 创建不会打断焦点的状态通知。 */
    private createNoticeMessage(message: string): HTMLElement {
        const notice = document.createElement('p')
        notice.className = 'aieditor__ai-chat-notice'
        notice.setAttribute('role', 'status')
        notice.textContent = message
        return notice
    }

    /** 创建可审批的 Tool 卡片，并在应用/丢弃后同步状态。 */
    private createToolProposal(proposal: AiEditorToolProposal): HTMLElement {
        const container = document.createElement('section')
        const title = document.createElement('strong')
        const description = document.createElement('p')
        const status = document.createElement('span')
        const actions = document.createElement('div')
        const apply = this.createIconButton('Apply editor change', Check)
        const discard = this.createIconButton('Discard editor change', X)

        container.className = 'aieditor__ai-tool-proposal'
        title.textContent = this.translate(proposal.title)
        description.textContent = this.translate(proposal.description)
        const preview = this.createProposalPreview(proposal)
        status.className = `aieditor__ai-tool-status is-${proposal.status}`
        status.textContent = proposal.message
            ? this.translate(proposal.message)
            : this.translate(proposal.status === 'pending' ? 'Waiting for approval' : proposal.status === 'applied' ? 'Applied' : 'Discarded')
        actions.className = 'aieditor__ai-tool-actions'
        apply.disabled = proposal.status !== 'pending'
        discard.disabled = proposal.status !== 'pending'
        apply.append(document.createTextNode(this.translate('Apply')))
        discard.append(document.createTextNode(this.translate('Discard')))
        apply.classList.add('aieditor__ai-tool-action', 'aieditor__ai-tool-action--primary')
        discard.classList.add('aieditor__ai-tool-action', 'aieditor__ai-tool-action--quiet')

        this.listen(apply, 'click', () => {
            const result = this.options.applyToolProposal(proposal)
            proposal.message = result.message
            if (!result.ok) proposal.status = 'pending'
            this.renderMessages()
        })
        this.listen(discard, 'click', () => {
            proposal.status = 'discarded'
            proposal.message = 'Discarded.'
            this.renderMessages()
        })

        actions.append(apply, discard)
        container.append(title, description, preview, status, actions)
        return container
    }

    /** 按 Tool 类型生成差异预览，未知工具回退为简短参数摘要。 */
    private createProposalPreview(proposal: AiEditorToolProposal): HTMLElement {
        const preview = document.createElement('div')
        preview.className = 'aieditor__ai-tool-preview'
        if (proposal.tool === 'apply_text_edits' && Array.isArray(proposal.arguments.edits)) {
            proposal.arguments.edits.forEach((value, index) => {
                if (!value || typeof value !== 'object' || Array.isArray(value)) return
                const edit = value as Record<string, unknown>
                const item = document.createElement('div')
                const label = document.createElement('span')
                const before = document.createElement('del')
                const after = document.createElement('ins')
                item.className = 'aieditor__ai-diff'
                label.className = 'aieditor__ai-diff-label'
                label.textContent = `${this.translate('Change')} ${index + 1}`
                before.textContent = String(edit.old_text ?? '') || this.translate('Empty content')
                after.textContent = String(edit.new_text ?? '') || this.translate('Empty content')
                item.append(label, before, after)
                preview.append(item)
            })
            if (preview.childElementCount) return preview
        }
        if (proposal.tool === 'replace_selection') {
            const before = document.createElement('del')
            const after = document.createElement('ins')
            const oldText = typeof proposal.arguments._selection_text === 'string'
                ? proposal.arguments._selection_text
                : this.readProposalRange(proposal.arguments, '_selection_from', '_selection_to')
            before.textContent = oldText || this.translate('Current selection')
            after.textContent = String(proposal.arguments.text ?? '') || this.translate('Empty content')
            preview.append(before, after)
            return preview
        }
        const text = document.createElement('p')
        text.textContent = this.describeProposal(proposal)
        preview.append(text)
        return preview
    }

    /** 从提案保存的文档坐标读取原文，坐标失效时安全返回空字符串。 */
    private readProposalRange(arguments_: Record<string, unknown>, fromKey: string, toKey: string): string {
        const from = arguments_[fromKey]
        const to = arguments_[toKey]
        if (!this.editor || !Number.isInteger(from) || !Number.isInteger(to)) return ''
        return this.editor.state.doc.textBetween(Number(from), Number(to), '\n')
    }

    /** 把 Tool 参数转换成用户可读的操作摘要。 */
    private describeProposal(proposal: AiEditorToolProposal): string {
        const args = proposal.arguments
        if (proposal.tool === 'replace_selection') return String(args.text ?? '')
        if (proposal.tool === 'insert_content') {
            const positions: Record<string, string> = {
                before_selection: this.translate('Before selection'),
                after_selection: this.translate('After selection'),
                document_end: this.translate('End of document'),
            }
            return `${positions[String(args.position)] ?? this.translate('Insert position')}: ${String(args.content ?? '')}`
        }
        if (proposal.tool === 'apply_formatting') {
            const formats = [
                ...(Array.isArray(args.marks) ? args.marks.map(String) : []),
                typeof args.block_type === 'string' ? args.block_type : '',
                typeof args.alignment === 'string' ? args.alignment : '',
            ].filter(Boolean)
            return formats.join(', ') || this.translate('Formatting change')
        }
        if (proposal.tool === 'apply_text_edits') return `${Array.isArray(args.edits) ? args.edits.length : 0} ${this.translate('text edits')}`
        return proposal.tool
    }

    /** 生成统一的无文字图标按钮，并补齐 title 与无障碍名称。 */
    private createIconButton(label: string, icon: typeof Sparkles): HTMLButtonElement {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'aieditor__ai-chat-icon'
        button.title = this.translate(label)
        button.setAttribute('aria-label', this.translate(label))
        button.append(createElement(icon, {'aria-hidden': 'true'}))
        return button
    }

    private listen<K extends keyof HTMLElementEventMap>(
        target: HTMLElement,
        type: K,
        listener: (event: HTMLElementEventMap[K]) => void,
        options: AddEventListenerOptions = {},
    ): void {
        target.addEventListener(type, listener as EventListener, {...options, signal: this.events.signal})
    }
}

/** 将 AI Markdown 转为安全的展示 HTML；不允许原始 HTML、脚本、事件属性或危险链接。 */
function renderMarkdown(container: HTMLElement, value: string, translate: (value: string) => string, enhance = true): void {
    const rendered = marked.parse(value, {async: false, breaks: true, gfm: true})
    const document = new DOMParser().parseFromString(rendered, 'text/html')
    const allowedTags = new Set(['P', 'BR', 'STRONG', 'EM', 'DEL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'CODE', 'PRE', 'A', 'HR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'INPUT'])
    // 先移除可执行或可提交元素，再对剩余节点执行标签与属性白名单。
    document.body.querySelectorAll('script, style, iframe, object, embed, form, button, textarea, select').forEach((element) => element.remove())
    document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
        if (!allowedTags.has(element.tagName)) {
            element.replaceWith(...element.childNodes)
            return
        }
        for (const attribute of [...element.attributes]) {
            if (attribute.name === 'class') {
                const allowedClass = (element.tagName === 'CODE' && attribute.value.split(/\s+/).every((value) => value.startsWith('language-')))
                    || (element.tagName === 'UL' && attribute.value === 'contains-task-list')
                    || (element.tagName === 'LI' && attribute.value === 'task-list-item')
                if (!allowedClass) element.removeAttribute(attribute.name)
                continue
            }
            const allowedAttribute = ['href', 'title', 'target', 'rel'].includes(attribute.name)
                || (element.tagName === 'INPUT' && ['type', 'checked', 'disabled'].includes(attribute.name))
            if (!allowedAttribute) element.removeAttribute(attribute.name)
        }
        if (element.tagName === 'A') {
            // 只允许显式 Web/邮件链接，并阻断新窗口访问 opener。
            const anchor = element as HTMLAnchorElement
            const href = anchor.getAttribute('href')?.trim() ?? ''
            if (!/^(https?:|mailto:)/i.test(href)) element.removeAttribute('href')
            else {
                anchor.target = '_blank'
                anchor.rel = 'noopener noreferrer'
            }
        }
        if (element.tagName === 'INPUT') {
            const input = element as HTMLInputElement
            if (input.type !== 'checkbox') {
                input.remove()
                return
            }
            input.disabled = true
        }
    })
    container.replaceChildren(...[...document.body.childNodes].map((node) => node.cloneNode(true)))
    if (!enhance) return
    // 增强仅用于聊天展示；插入编辑器的 HTML 不包含这些交互外壳和按钮。
    container.querySelectorAll('table').forEach((table) => {
        const wrapper = document.createElement('div')
        wrapper.className = 'aieditor__ai-markdown-table'
        table.replaceWith(wrapper)
        wrapper.append(table)
    })
    container.querySelectorAll('pre').forEach((pre) => {
        const code = pre.querySelector('code')
        if (!code) return
        const copy = document.createElement('button')
        copy.type = 'button'
        copy.className = 'aieditor__ai-code-copy'
        copy.title = translate('Copy code')
        copy.setAttribute('aria-label', copy.title)
        copy.append(createElement(Copy, {'aria-hidden': 'true'}))
        copy.addEventListener('click', async () => {
            try {
                await copyText(code.textContent ?? '')
                copy.title = translate('Copied')
                copy.setAttribute('aria-label', copy.title)
                copy.replaceChildren(createElement(Check, {'aria-hidden': 'true'}))
            } catch {
                copy.title = translate('Could not copy code')
            }
        })
        pre.append(copy)
    })
}

/** 复用聊天净化逻辑生成可安全插入编辑器的静态 HTML。 */
function markdownToSafeHtml(value: string): string {
    const container = document.createElement('div')
    renderMarkdown(container, value, (text) => text, false)
    return container.innerHTML
}

/** 优先使用异步剪贴板 API，旧环境回退到临时 textarea。 */
async function copyText(value: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        return
    }
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    if (!copied) throw new Error('Copy failed')
}
