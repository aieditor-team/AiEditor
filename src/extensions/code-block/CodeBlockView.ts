import {createElement, Check, ChevronDown, Copy} from 'lucide'
import type {Node as ProseMirrorNode} from '@tiptap/pm/model'
import type {EditorView, NodeView, ViewMutationRecord} from '@tiptap/pm/view'
import type {CodeBlockLanguageOption} from './CodeBlockLowlight'
import {appendBlockBoundaryControls} from '../shared/BlockBoundaryControls'

export interface CodeBlockViewOptions {
  actions: boolean
  HTMLAttributes: Record<string, unknown>
  languageClassPrefix?: string | null
  languages: CodeBlockLanguageOption[]
  translate: (value: string) => string
}

/** 优先使用 Clipboard API；旧浏览器回退到隐藏 textarea 和 execCommand。 */
export async function copyCodeText(value: string, ownerDocument: Document): Promise<void> {
  const clipboard = ownerDocument.defaultView?.navigator.clipboard
  if (clipboard?.writeText) {
    await clipboard.writeText(value)
    return
  }

  const textarea = ownerDocument.createElement('textarea')
  textarea.value = value
  textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;'
  ownerDocument.body.append(textarea)
  textarea.select()
  const copied = ownerDocument.execCommand?.('copy') ?? false
  textarea.remove()
  if (!copied) throw new Error('Copy failed')
}

/** 带语言选择和复制操作区的代码块 NodeView。 */
export class CodeBlockView implements NodeView {
  readonly dom: HTMLElement
  readonly contentDOM: HTMLElement
  private readonly pre: HTMLElement
  private readonly actions: HTMLElement
  private readonly copyButton: HTMLButtonElement
  private readonly languageControl: HTMLElement
  private readonly languageButton: HTMLButtonElement
  private readonly languageMenu: HTMLElement
  private readonly events = new AbortController()
  private readonly view: EditorView
  private readonly getPos: () => number | undefined
  private readonly options: CodeBlockViewOptions
  private readonly editableObserver: MutationObserver
  private readonly removeBoundaryControls: () => void
  private node: ProseMirrorNode
  private resetTimer: number | undefined

  constructor(
    node: ProseMirrorNode,
    view: EditorView,
    getPos: () => number | undefined,
    options: CodeBlockViewOptions,
  ) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.options = options
    const document = view.dom.ownerDocument
    const wrapper = document.createElement('div')
    const pre = document.createElement('pre')
    const code = document.createElement('code')
    const actions = document.createElement('div')
    const languageSelector = this.createLanguageSelector(document)
    const copyButton = this.createAction('copy', 'Copy code', Copy)

    wrapper.className = 'aieditor__code-block'
    actions.className = 'aieditor__code-block-actions'
    actions.contentEditable = 'false'
    actions.setAttribute('role', 'group')
    actions.setAttribute('aria-label', this.options.translate('Code block actions'))
    pre.append(code)
    actions.append(languageSelector.control, copyButton)
    // 操作区可以按配置关闭，边界段落按钮则始终作为块级编辑能力保留。
    wrapper.append(...(this.options.actions ? [actions, pre] : [pre]))

    this.dom = wrapper
    this.pre = pre
    this.contentDOM = code
    this.actions = actions
    this.copyButton = copyButton
    this.languageControl = languageSelector.control
    this.languageButton = languageSelector.button
    this.languageMenu = languageSelector.menu
    this.editableObserver = new (document.defaultView?.MutationObserver ?? MutationObserver)(() => this.syncEditableState())
    this.editableObserver.observe(view.dom, {attributes: true, attributeFilter: ['contenteditable']})
    this.applyHTMLAttributes()
    this.updateLanguageClass()
    this.syncEditableState()
    this.removeBoundaryControls = appendBlockBoundaryControls(wrapper, view, () => {
      const position = this.getPos()
      return typeof position === 'number' ? {position, nodeSize: this.node.nodeSize} : undefined
    })

    actions.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
    }, {signal: this.events.signal})
    languageSelector.button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (!this.view.editable) return
      this.setLanguageMenuOpen(this.languageMenu.hasAttribute('hidden'))
    }, {signal: this.events.signal})
    languageSelector.button.addEventListener('keydown', (event) => this.handleLanguageTriggerKeydown(event), {signal: this.events.signal})
    languageSelector.menu.addEventListener('keydown', (event) => this.handleLanguageMenuKeydown(event), {signal: this.events.signal})
    languageSelector.menu.addEventListener('click', (event) => {
      const option = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-code-language-value]')
      if (!option) return
      event.preventDefault()
      event.stopPropagation()
      this.selectLanguage(option.dataset.codeLanguageValue ?? '')
    }, {signal: this.events.signal})
    document.addEventListener('pointerdown', (event) => {
      if (!this.languageMenu.hidden && !this.languageControl.contains(event.target as Node | null)) this.setLanguageMenuOpen(false)
    }, {signal: this.events.signal})
    copyButton.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      void this.copyCode()
    }, {signal: this.events.signal})
  }

  /** 复用当前 NodeView，仅同步节点快照和语言 class。 */
  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) return false
    this.node = node
    this.updateLanguageClass()
    this.syncEditableState()
    return true
  }

  /** 操作按钮的事件由 NodeView 自己处理，不交给 ProseMirror。 */
  stopEvent(event: Event): boolean {
    const target = event.target as Element | null
    return this.actions.contains(target) || Boolean(target?.closest('.aieditor__block-boundary-button'))
  }

  /** 只观察真正的 code 内容；按钮状态变化不应触发文档 DOM 解析。 */
  ignoreMutation(mutation: ViewMutationRecord): boolean {
    if (mutation.type === 'selection') return false
    return !this.contentDOM.contains(mutation.target)
  }

  destroy(): void {
    this.events.abort()
    this.editableObserver.disconnect()
    this.removeBoundaryControls()
    if (this.resetTimer !== undefined) this.ownerWindow.clearTimeout(this.resetTimer)
  }

  private get ownerWindow(): Window {
    return this.dom.ownerDocument.defaultView ?? window
  }

  private createAction(
    action: 'copy',
    label: string,
    icon: Parameters<typeof createElement>[0],
  ): HTMLButtonElement {
    const button = this.view.dom.ownerDocument.createElement('button')
    const translated = this.options.translate(label)
    button.type = 'button'
    button.className = 'aieditor__code-block-action'
    button.dataset.codeBlockAction = action
    button.title = translated
    button.setAttribute('aria-label', translated)
    button.append(createElement(icon, {'aria-hidden': 'true'}))
    return button
  }

  private createLanguageSelector(document: Document): {
    control: HTMLElement
    button: HTMLButtonElement
    menu: HTMLElement
  } {
    const control = document.createElement('div')
    const button = document.createElement('button')
    const value = document.createElement('span')
    const menu = document.createElement('div')
    const languages: Array<CodeBlockLanguageOption | null> = [
      null,
      ...this.options.languages,
    ]

    control.className = 'aieditor__code-language'
    button.type = 'button'
    button.className = 'aieditor__code-language-trigger'
    button.dataset.codeBlockAction = 'language'
    button.setAttribute('aria-haspopup', 'listbox')
    button.setAttribute('aria-expanded', 'false')
    value.className = 'aieditor__code-language-value'
    button.append(value, createElement(ChevronDown, {'aria-hidden': 'true'}))

    menu.className = 'aieditor__code-language-menu'
    menu.hidden = true
    menu.setAttribute('role', 'listbox')
    menu.setAttribute('aria-label', this.options.translate('Code language'))
    languages.forEach((language) => {
      const option = document.createElement('button')
      const source = language?.name ?? 'Auto'
      option.type = 'button'
      option.className = 'aieditor__code-language-option'
      option.dataset.codeLanguageValue = language?.value ?? ''
      option.dataset.codeLanguageLabel = source
      option.setAttribute('role', 'option')
      option.setAttribute('aria-selected', 'false')
      option.textContent = this.options.translate(source)
      menu.append(option)
    })
    control.append(button, menu)
    return {control, button, menu}
  }

  private applyHTMLAttributes(): void {
    Object.entries(this.options.HTMLAttributes).forEach(([name, value]) => {
      if (value !== undefined && value !== null && value !== false) this.pre.setAttribute(name, String(value))
    })
  }

  private updateLanguageClass(): void {
    const prefix = this.options.languageClassPrefix
    const language = this.node.attrs.language as string | null
    this.contentDOM.className = language && prefix ? `${prefix}${language}` : ''
    this.updateLanguageControl()
  }

  private updateLanguageControl(): void {
    if (!this.languageButton || !this.languageMenu) return
    const language = (this.node.attrs.language as string | null) ?? ''
    const source = this.options.languages.find((item) => item.value === language)?.name ?? (language || 'Auto')
    const translated = this.options.translate(source)
    const value = this.languageButton.querySelector('.aieditor__code-language-value')
    if (value instanceof HTMLElement) {
      value.dataset.codeLanguageLabel = source
      value.textContent = translated
    }
    this.languageButton.title = `${this.options.translate('Code language')}: ${translated}`
    this.languageButton.setAttribute('aria-label', this.languageButton.title)
    this.languageMenu.querySelectorAll<HTMLElement>('[data-code-language-value]').forEach((option) => {
      option.setAttribute('aria-selected', String(option.dataset.codeLanguageValue === language))
    })
  }

  private setLanguageMenuOpen(open: boolean, focusSelected = false): void {
    if (open && !this.view.editable) return
    this.languageMenu.hidden = !open
    this.languageButton.setAttribute('aria-expanded', String(open))
    if (!open) return
    const target = focusSelected
      ? this.languageMenu.querySelector<HTMLButtonElement>('[aria-selected="true"]')
      : null
    ;(target ?? this.languageMenu.querySelector<HTMLButtonElement>('[data-code-language-value]'))?.focus()
  }

  private handleLanguageTriggerKeydown(event: KeyboardEvent): void {
    if (!this.view.editable || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return
    event.preventDefault()
    event.stopPropagation()
    this.setLanguageMenuOpen(true, event.key === 'ArrowDown')
    if (event.key === 'ArrowUp') this.languageMenu.querySelector<HTMLButtonElement>('[data-code-language-value]:last-child')?.focus()
  }

  private handleLanguageMenuKeydown(event: KeyboardEvent): void {
    const options = [...this.languageMenu.querySelectorAll<HTMLButtonElement>('[data-code-language-value]')]
    const current = options.indexOf(event.target as HTMLButtonElement)
    let next = current
    if (event.key === 'Escape') {
      event.preventDefault()
      this.setLanguageMenuOpen(false)
      this.languageButton.focus()
      return
    }
    if (event.key === 'ArrowDown') next = (current + 1) % options.length
    else if (event.key === 'ArrowUp') next = (current - 1 + options.length) % options.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = options.length - 1
    else return
    event.preventDefault()
    event.stopPropagation()
    options[next]?.focus()
  }

  private selectLanguage(language: string): void {
    if (!this.view.editable) return
    const position = this.getPos()
    if (!Number.isInteger(position)) return
    const transaction = this.view.state.tr.setNodeMarkup(position!, undefined, {...this.node.attrs, language: language || null})
    this.view.dispatch(transaction)
    this.setLanguageMenuOpen(false)
    this.view.focus()
  }

  /** 只读时保留复制能力，但语言只能作为静态信息查看。 */
  private syncEditableState(): void {
    const editable = this.view.editable
    this.languageButton.disabled = !editable
    this.languageButton.setAttribute('aria-disabled', String(!editable))
    if (!editable) this.setLanguageMenuOpen(false)
  }

  private async copyCode(): Promise<void> {
    if (this.resetTimer !== undefined) this.ownerWindow.clearTimeout(this.resetTimer)
    try {
      await copyCodeText(this.node.textContent, this.dom.ownerDocument)
      if (this.events.signal.aborted) return
      this.setCopyButtonState('Copied', Check)
    } catch {
      if (this.events.signal.aborted) return
      this.setCopyButtonState('Could not copy code', Copy)
    }
    this.resetTimer = this.ownerWindow.setTimeout(() => {
      if (!this.events.signal.aborted) this.setCopyButtonState('Copy code', Copy)
    }, 1600)
  }

  private setCopyButtonState(label: string, icon: Parameters<typeof createElement>[0]): void {
    const translated = this.options.translate(label)
    this.copyButton.title = translated
    this.copyButton.setAttribute('aria-label', translated)
    this.copyButton.replaceChildren(createElement(icon, {'aria-hidden': 'true'}))
  }
}
