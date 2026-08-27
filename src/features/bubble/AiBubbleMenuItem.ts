import { computePosition, flip, offset, shift } from '@floating-ui/dom'
import { ArrowRight, CircleAlert, createElement, FilePenLine, Languages, ListPlus, LoaderCircle, Replace, Share2, Sparkles, SpellCheck2, Trash2, WandSparkles } from 'lucide'
import type { AiGenerateRequest, AiGenerateResult } from '../../ai'
import { MenuItem, type MenuContext } from '../../menus/core'

interface AiAction {
  id: string
  label: string
  prompt: string
  icon: typeof WandSparkles
}

const actions: AiAction[] = [
  { id: 'improve', label: 'Improve writing', prompt: 'Improve the writing while preserving its meaning and tone. Return only the revised text.', icon: WandSparkles },
  { id: 'proofread', label: 'Fix spelling & grammar', prompt: 'Correct spelling, grammar, punctuation, and usage. Return only the corrected text.', icon: SpellCheck2 },
  { id: 'simplify', label: 'Simplify', prompt: 'Make this clearer and easier to understand without losing important information. Return only the revised text.', icon: FilePenLine },
  { id: 'expand', label: 'Make longer', prompt: 'Expand this with useful detail while preserving the original meaning and tone. Return only the revised text.', icon: Sparkles },
  { id: 'translate', label: 'Translate', prompt: 'Translate this into English. If it is already English, translate it into Simplified Chinese. Return only the translation.', icon: Languages },
  { id: 'summarize', label: 'Summarize', prompt: 'Summarize this concisely. Return only the summary.', icon: Share2 },
]

export interface AiBubbleMenuItemOptions {
  generate: (request: AiGenerateRequest) => Promise<AiGenerateResult>
  isConfigured: () => boolean
  onError?: (error: unknown) => void
}

/** 选区 Bubble Menu 中的 AI 写作入口，生成后由用户选择追加、替换或丢弃。 */
export class AiBubbleMenuItem extends MenuItem {
  private readonly options: AiBubbleMenuItemOptions
  private panel: HTMLElement | null = null
  private input: HTMLInputElement | null = null
  private trigger: HTMLButtonElement | null = null
  private context: MenuContext | null = null
  private selection: { from: number; to: number; text: string } | null = null
  private result: string | null = null
  private busy = false
  private requestController: AbortController | null = null
  private requestSequence = 0

  constructor(options: AiBubbleMenuItemOptions) {
    super('bubble-ai')
    this.options = options
  }

  /** 创建触发按钮、指令面板、预设动作和结果预览区域。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const document = context.editor.view.dom.ownerDocument
    const trigger = document.createElement('button')
    const panel = document.createElement('div')
    const promptForm = document.createElement('form')
    const input = document.createElement('input')
    const submit = document.createElement('button')
    const hint = document.createElement('p')
    const actionList = document.createElement('div')
    const preview = document.createElement('div')
    const decisionList = document.createElement('div')

    trigger.type = 'button'
    trigger.className = 'aieditor__tool aieditor__ai-trigger'
    trigger.title = translate('AI actions')
    trigger.setAttribute('aria-label', translate('AI actions'))
    trigger.setAttribute('aria-haspopup', 'dialog')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.append(createElement(Sparkles, { 'aria-hidden': 'true' }))

    panel.className = 'aieditor__ai-menu'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', translate('AI writing actions'))
    panel.hidden = true
    promptForm.className = 'aieditor__ai-prompt'
    input.type = 'text'
    input.placeholder = translate('Tell AI what to do...')
    input.setAttribute('aria-label', translate('AI instruction'))
    submit.type = 'submit'
    submit.className = 'aieditor__ai-submit'
    submit.title = translate('Run instruction')
    submit.setAttribute('aria-label', translate('Run AI instruction'))
    submit.append(createElement(ArrowRight, { 'aria-hidden': 'true' }))
    hint.className = 'aieditor__ai-hint'
    actionList.className = 'aieditor__ai-actions'
    actionList.setAttribute('role', 'menu')
    preview.className = 'aieditor__ai-preview'
    preview.setAttribute('role', 'status')
    preview.setAttribute('aria-live', 'polite')
    preview.hidden = true
    decisionList.className = 'aieditor__ai-decisions'
    decisionList.hidden = true

    const decisions = [
      { label: 'Append', icon: ListPlus, apply: () => this.applyResult('append') },
      { label: 'Replace', icon: Replace, apply: () => this.applyResult('replace') },
      { label: 'Discard', icon: Trash2, apply: () => this.discardResult() },
    ]
    for (const decision of decisions) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'aieditor__ai-decision'
      button.append(createElement(decision.icon, { 'aria-hidden': 'true' }), document.createTextNode(translate(decision.label)))
      this.listen(button, 'click', decision.apply)
      decisionList.append(button)
    }

    for (const action of actions) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'aieditor__ai-action'
      button.dataset.aiAction = action.id
      button.setAttribute('role', 'menuitem')
      button.append(createElement(action.icon, { 'aria-hidden': 'true' }), document.createTextNode(translate(action.label)))
      this.listen(button, 'click', () => this.run(action.prompt))
      actionList.append(button)
    }

    promptForm.append(input, submit)
    panel.append(promptForm, preview, hint, actionList, decisionList)
    // 面板挂到 body，避免被 Bubble Menu 本身的尺寸和 overflow 裁剪。
    document.body.append(panel)
    this.trigger = trigger
    this.panel = panel
    this.input = input
    this.context = context

    this.listen(trigger, 'mousedown', (event) => event.preventDefault())
    this.listen(trigger, 'click', () => panel.hidden ? this.open() : this.close())
    this.listen(promptForm, 'submit', (event) => {
      event.preventDefault()
      const prompt = input.value.trim()
      if (prompt) this.run(prompt)
    })
    this.listen(panel, 'keydown', (event) => {
      if (event.key === 'Escape') this.close(true)
    })
    this.listen(document.documentElement, 'mousedown', (event) => {
      const target = event.target as Node | null
      if (target && !panel.contains(target) && !trigger.contains(target)) this.close()
    })
    this.renderAvailability()
    return trigger
  }

  /** 中止生成、停止自动定位并移除 Portal 面板。 */
  destroy(): void {
    this.requestSequence += 1
    this.requestController?.abort()
    this.requestController = null
    this.busy = false
    this.panel?.remove()
    this.panel = null
    this.input = null
    this.trigger = null
    this.context = null
    super.destroy()
  }

  /** 冻结当前选区并打开 AI 操作面板。 */
  private async open(): Promise<void> {
    if (!this.panel || !this.trigger || !this.context) return
    const { from, to } = this.context.editor.state.selection
    this.selection = { from, to, text: this.context.editor.state.doc.textBetween(from, to, '\n') }
    this.discardResult(false)
    this.panel.hidden = false
    this.trigger.setAttribute('aria-expanded', 'true')
    this.renderAvailability()
    await this.updatePosition()
    this.input?.focus()
  }

  /** 关闭面板、清除未应用结果并按需恢复按钮焦点。 */
  private close(returnFocus = false): void {
    if (!this.panel || this.busy) return
    this.panel.hidden = true
    this.trigger?.setAttribute('aria-expanded', 'false')
    if (returnFocus) this.trigger?.focus()
  }

  /** 针对冻结选区执行一次 AI 请求并进入结果确认状态。 */
  private async run(prompt: string): Promise<void> {
    if (!this.context || !this.selection || this.busy || !this.options.isConfigured()) return
    const controller = new AbortController()
    const sequence = ++this.requestSequence
    this.requestController = controller
    this.setBusy(true)
    this.setMessage('Working...', false)
    try {
      const result = await this.options.generate({ prompt, scope: 'selection', signal: controller.signal })
      if (controller.signal.aborted || sequence !== this.requestSequence || !this.context) return
      const text = result.text.trim()
      if (!text) throw new Error('The AI service returned an empty response')
      this.result = text
      this.setBusy(false)
      this.showResult()
    } catch (error) {
      if (controller.signal.aborted || sequence !== this.requestSequence) return
      this.setBusy(false)
      this.setMessage(error instanceof Error ? error.message : 'AI request failed', true)
      this.options.onError?.(error)
    } finally {
      if (this.requestController === controller) this.requestController = null
    }
  }

  /** 根据 AI 服务配置同步按钮和错误提示。 */
  private renderAvailability(): void {
    const configured = this.options.isConfigured()
    this.panel?.querySelectorAll<HTMLButtonElement>('.aieditor__ai-action, .aieditor__ai-submit').forEach((button) => {
      button.disabled = !configured || this.busy
    })
    this.panel?.querySelectorAll<HTMLButtonElement>('.aieditor__ai-decision').forEach((button) => {
      button.disabled = this.busy || !this.result
    })
    if (this.input) this.input.disabled = !configured || this.busy
    const message = this.result
      ? 'Review the result, then choose how to apply it.'
      : configured ? 'Enter an instruction or choose an action below.' : 'Configure an AI service to use these actions.'
    this.setMessage(message, !configured)
  }

  /** 生成期间锁定输入和动作，避免重入。 */
  private setBusy(busy: boolean): void {
    this.busy = busy
    this.panel?.classList.toggle('is-busy', busy)
    const submit = this.panel?.querySelector<HTMLButtonElement>('.aieditor__ai-submit')
    if (submit) {
      submit.replaceChildren(createElement(busy ? LoaderCircle : ArrowRight, { 'aria-hidden': 'true' }))
    }
    this.renderAvailability()
  }

  private setMessage(message: string, error: boolean): void {
    const hint = this.panel?.querySelector<HTMLElement>('.aieditor__ai-hint')
    if (!hint) return
    hint.replaceChildren()
    if (error) hint.append(createElement(CircleAlert, { 'aria-hidden': 'true' }))
    hint.append(hint.ownerDocument.createTextNode(this.context?.i18n.t(message) ?? message))
    hint.classList.toggle('is-error', error)
  }

  /** 从动作列表切换到生成结果预览。 */
  private showResult(): void {
    if (!this.panel || !this.result) return
    const preview = this.panel.querySelector<HTMLElement>('.aieditor__ai-preview')
    const actions = this.panel.querySelector<HTMLElement>('.aieditor__ai-actions')
    const decisions = this.panel.querySelector<HTMLElement>('.aieditor__ai-decisions')
    if (!preview || !actions || !decisions) return
    preview.textContent = this.result
    preview.hidden = false
    actions.hidden = true
    decisions.hidden = false
    this.renderAvailability()
    decisions.querySelector<HTMLButtonElement>('.aieditor__ai-decision')?.focus()
    this.updatePosition()
  }

  /** 将结果追加到选区后或替换选区，只有用户明确操作才修改编辑器。 */
  private applyResult(mode: 'append' | 'replace'): void {
    if (!this.context || !this.selection || !this.result || this.busy) return
    const { editor } = this.context
    if (!editor.isEditable) {
      this.setMessage('Editor is read-only.', true)
      return
    }
    const { from, to, text: originalText } = this.selection
    if (editor.state.doc.textBetween(from, to, '\n') !== originalText) {
      this.setMessage('The document changed. Select the text again before applying this result.', true)
      return
    }

    const range = mode === 'replace' ? { from, to } : { from: to, to }
    const text = mode === 'append' ? ` ${this.result}` : this.result
    editor.chain().focus().insertContentAt(range, { type: 'text', text }).run()
    this.result = null
    this.close()
  }

  /** 丢弃临时结果并回到 AI 动作列表。 */
  private discardResult(focusInput = true): void {
    if (!this.panel) return
    this.result = null
    const preview = this.panel.querySelector<HTMLElement>('.aieditor__ai-preview')
    const actions = this.panel.querySelector<HTMLElement>('.aieditor__ai-actions')
    const decisions = this.panel.querySelector<HTMLElement>('.aieditor__ai-decisions')
    if (preview) {
      preview.textContent = ''
      preview.hidden = true
    }
    if (actions) actions.hidden = false
    if (decisions) decisions.hidden = true
    this.renderAvailability()
    if (focusInput) this.input?.focus()
    this.updatePosition()
  }

  /** 根据触发按钮位置计算面板坐标，并处理视口碰撞。 */
  private async updatePosition(): Promise<void> {
    if (!this.trigger || !this.panel || this.panel.hidden) return
    const { x, y } = await computePosition(this.trigger, this.panel, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [offset(8), flip(), shift({ padding: 8 })],
    })
    if (!this.panel || this.panel.hidden) return
    Object.assign(this.panel.style, { left: `${x}px`, top: `${y}px` })
  }
}
