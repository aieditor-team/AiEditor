import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import {resolveMenuFloatingOffset, resolveMenuFloatingPlacement} from './FloatingPlacement'

let floatingDialogSequence = 0

/** 对话框关闭原因，用于区分提交表单和放弃编辑。 */
export type FloatingDialogCloseReason = 'apply' | 'cancel'

/** 浮动对话框的无障碍标题、初始焦点和关闭回调。 */
export interface FloatingDialogOptions {
  labelledBy: string
  initialFocus?: HTMLElement
  onClose?: (reason: FloatingDialogCloseReason) => void
}

/** 锚定触发按钮的非模态 Dialog，统一管理定位、焦点和关闭行为。 */
export class FloatingDialog {
  readonly element: HTMLElement
  private readonly trigger: HTMLButtonElement
  private readonly form: HTMLFormElement
  private readonly options: FloatingDialogOptions
  private readonly events = new AbortController()
  private stopAutoUpdate: (() => void) | undefined

  constructor(trigger: HTMLButtonElement, form: HTMLFormElement, options: FloatingDialogOptions) {
    this.trigger = trigger
    this.form = form
    this.options = options

    const ownerDocument = trigger.ownerDocument
    const panel = ownerDocument.createElement('div')
    panel.id = `aieditor-floating-dialog-${++floatingDialogSequence}`
    panel.className = 'aieditor__dialog'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-labelledby', options.labelledBy)
    panel.hidden = true
    panel.append(form)
    ownerDocument.body.append(panel)
    this.element = panel

    trigger.setAttribute('aria-haspopup', 'dialog')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-controls', panel.id)

    form.addEventListener('submit', (event) => {
      event.preventDefault()
      const submitter = event.submitter as HTMLButtonElement | null
      this.close(submitter?.value === 'cancel' ? 'cancel' : 'apply')
    }, { signal: this.events.signal })

    panel.addEventListener('keydown', (event) => this.handleKeydown(event), { signal: this.events.signal })
    // 监听 documentElement 可覆盖编辑器之外的点击，并由 contains 排除触发器和面板内部交互。
    ownerDocument.documentElement.addEventListener('click', (event) => {
      const target = event.target as Node | null
      if (target && !trigger.contains(target) && !panel.contains(target)) this.close('cancel', false)
    }, { signal: this.events.signal })
  }

  /** 当前面板是否处于可见状态。 */
  get open(): boolean {
    return !this.element.hidden
  }

  /** 显示面板并持续跟随触发按钮的位置。 */
  show(): void {
    if (this.open || this.trigger.disabled) return
    this.element.hidden = false
    this.trigger.setAttribute('aria-expanded', 'true')
    this.stopAutoUpdate = autoUpdate(this.trigger, this.element, () => this.updatePosition())
    void this.updatePosition()
    this.options.initialFocus?.focus()
  }

  /** 关闭面板；Escape/取消时默认把焦点还给触发按钮。 */
  close(reason: FloatingDialogCloseReason = 'cancel', returnFocus = reason === 'cancel'): void {
    if (!this.open) return
    this.stopAutoUpdate?.()
    this.stopAutoUpdate = undefined
    this.element.hidden = true
    this.trigger.setAttribute('aria-expanded', 'false')
    this.options.onClose?.(reason)
    if (returnFocus) this.trigger.focus()
  }

  /** 停止 Floating UI 自动更新并移除 Portal、监听器和触发器关联属性。 */
  destroy(): void {
    this.close('cancel', false)
    this.events.abort()
    this.element.remove()
    this.trigger.removeAttribute('aria-controls')
    this.trigger.setAttribute('aria-expanded', 'false')
  }

  /** 计算锚点位置，并再次限制在视口安全边距内。 */
  private async updatePosition(): Promise<void> {
    if (!this.open) return
    const { x, y } = await computePosition(this.trigger, this.element, {
      placement: resolveMenuFloatingPlacement(this.trigger, 'bottom-start'),
      strategy: 'fixed',
      middleware: [offset(({placement}) => resolveMenuFloatingOffset(this.trigger, placement)), flip(), shift({ padding: 8 })],
    })
    if (!this.open) return
    const padding = 8
    const ownerWindow = this.element.ownerDocument.defaultView ?? window
    const maxX = Math.max(padding, ownerWindow.innerWidth - this.element.offsetWidth - padding)
    const maxY = Math.max(padding, ownerWindow.innerHeight - this.element.offsetHeight - padding)
    Object.assign(this.element.style, {
      left: `${Math.min(Math.max(padding, x), maxX)}px`,
      top: `${Math.min(Math.max(padding, y), maxY)}px`,
    })
  }

  /** 处理 Escape 关闭和非模态面板内部的 Tab 循环。 */
  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      this.close('cancel')
      return
    }
    if (event.key !== 'Tab') return

    const focusable = this.getFocusableElements()
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && this.element.ownerDocument.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && this.element.ownerDocument.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  /** 获取表单内当前可交互且可见的焦点目标。 */
  private getFocusableElements(): HTMLElement[] {
    return [...this.form.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hidden)
  }
}
