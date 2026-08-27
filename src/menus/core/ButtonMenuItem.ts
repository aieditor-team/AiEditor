import { createElement, type IconNode } from 'lucide'
import type { MenuContext } from './MenuContext'
import { MenuItem } from './MenuItem'

export interface ButtonMenuItemOptions {
  id: string
  label: string
  icon?: IconNode
  text?: string
  execute: (context: MenuContext) => void
  isActive?: (context: MenuContext) => boolean
  isEnabled?: (context: MenuContext) => boolean
}

/** 将一个编辑器命令封装为带图标、激活和禁用状态的按钮菜单项。 */
export class ButtonMenuItem extends MenuItem {
  private readonly options: ButtonMenuItemOptions

  constructor(options: ButtonMenuItemOptions) {
    super(options.id)
    this.options = options
  }

  /** 创建按钮并阻止 mousedown 抢走编辑器选区。 */
  render(context: MenuContext): HTMLElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'aieditor__tool'
    const label = context.i18n.t(this.options.label)
    button.setAttribute('aria-label', label)
    button.title = label

    if (this.options.icon) {
      button.append(createElement(this.options.icon, { 'aria-hidden': 'true' }))
    } else {
      button.classList.add('aieditor__tool--text')
      button.textContent = context.i18n.t(this.options.text ?? this.options.label)
    }

    this.listen(button, 'mousedown', (event) => event.preventDefault())
    // disabled 状态由 update 同步；这里仍做保护，避免程序化 click 绕过状态。
    this.listen(button, 'click', () => {
      if (!button.disabled) this.execute(context)
    })
    return button
  }

  /** 执行调用方提供的命令。 */
  execute(context: MenuContext): void {
    this.options.execute(context)
  }

  /** 根据编辑器状态同步 aria-pressed 和 disabled。 */
  update(context: MenuContext): void {
    const button = this.element as HTMLButtonElement | null
    if (!button) return
    const active = this.options.isActive?.(context) ?? false
    button.classList.toggle('is-active', active)
    button.disabled = !(this.options.isEnabled?.(context) ?? true)

    if (this.options.isActive) button.setAttribute('aria-pressed', String(active))
    else button.removeAttribute('aria-pressed')
  }
}
