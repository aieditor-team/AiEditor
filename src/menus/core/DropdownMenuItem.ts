import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { Check, ChevronDown, createElement, type IconNode } from 'lucide'
import type { MenuContext } from './MenuContext'
import {clampFloatingPosition, resolveMenuFloatingOffset, resolveMenuFloatingPlacement} from './FloatingPlacement'
import { MenuItem } from './MenuItem'

let dropdownSequence = 0

export interface DropdownMenuOption {
  label: string
  value: string
  icon?: IconNode
  style?: Partial<CSSStyleDeclaration>
}

export type DropdownIndicatorPosition = 'start' | 'end'

export interface DropdownMenuItemOptions {
  id: string
  label: string
  /** 仅将触发器改为图标 + 下拉箭头；菜单选项仍保持原有文字或图标布局。 */
  triggerIcon?: IconNode
  options: DropdownMenuOption[]
  execute: (context: MenuContext, value: string) => void
  getValue?: (context: MenuContext) => string
  isEnabled?: (context: MenuContext) => boolean
  /** single 用于状态选项；none 用于粘贴等一次性命令。 */
  selectionMode?: 'single' | 'none'
  /** 触发器和选项仅显示图标，文字仍作为无障碍名称和 tooltip。 */
  iconOnly?: boolean
  /** 选中状态对勾的位置；图标菜单默认在开头，文字菜单默认在末尾。 */
  indicatorPosition?: DropdownIndicatorPosition
}

/** 使用 Floating UI 定位的可访问下拉菜单。 */
export class DropdownMenuItem extends MenuItem {
  private readonly options: DropdownMenuItemOptions
  private trigger: HTMLButtonElement | null = null
  private panel: HTMLElement | null = null
  private stopAutoUpdate: (() => void) | undefined

  constructor(options: DropdownMenuItemOptions) {
    super(options.id)
    if (!options.options.length) throw new Error(`DropdownMenuItem "${options.id}" requires options`)
    this.options = options
  }

  /** 创建触发按钮和 Portal 面板，并注册键盘与外部点击处理。 */
  render(context: MenuContext): HTMLElement {
    const translate = (value: string) => context.i18n.t(value)
    const wrapper = document.createElement('div')
    const trigger = document.createElement('button')
    const panel = document.createElement('div')
    const panelId = `aieditor-dropdown-${++dropdownSequence}`
    const indicatorPosition = this.options.indicatorPosition ?? (this.options.iconOnly ? 'start' : 'end')
    const selectionMode = this.options.selectionMode ?? 'single'
    wrapper.className = 'aieditor__dropdown'

    trigger.type = 'button'
    trigger.className = 'aieditor__dropdown-trigger'
    if (this.options.iconOnly || this.options.triggerIcon) trigger.classList.add('aieditor__dropdown-trigger--icon')
    trigger.title = translate(this.options.label)
    trigger.setAttribute('aria-label', translate(this.options.label))
    trigger.setAttribute('aria-haspopup', 'menu')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-controls', panelId)
    trigger.innerHTML = '<span data-dropdown-label></span>'
    const chevron = createElement(ChevronDown, { 'aria-hidden': 'true' })
    chevron.classList.add('aieditor__menu-chevron')
    trigger.append(chevron)

    panel.id = panelId
    panel.className = 'aieditor__dropdown-panel'
    if (this.options.iconOnly) panel.classList.add('aieditor__dropdown-panel--icon')
    panel.setAttribute('role', 'menu')
    panel.setAttribute('aria-label', translate(this.options.label))
    panel.hidden = true

    for (const option of this.options.options) {
      const item = document.createElement('button')
      const label = document.createElement('span')
      const check = createElement(Check, { 'aria-hidden': 'true' })
      check.classList.add('aieditor__dropdown-check')
      item.type = 'button'
      item.className = 'aieditor__dropdown-option'
      item.classList.add(`aieditor__dropdown-option--indicator-${indicatorPosition}`)
      item.dataset.value = option.value
      item.setAttribute('role', selectionMode === 'single' ? 'menuitemradio' : 'menuitem')
      if (selectionMode === 'single') item.setAttribute('aria-checked', 'false')
      if (option.icon) {
        const icon = createElement(option.icon, { 'aria-hidden': 'true' })
        icon.classList.add('aieditor__dropdown-option-icon')
        if (this.options.iconOnly) {
          item.classList.add('aieditor__dropdown-option--icon')
          item.setAttribute('aria-label', translate(option.label))
          item.title = translate(option.label)
        }
        label.textContent = translate(option.label)
        const optionContent = this.options.iconOnly ? [icon] : [icon, label]
        const content = selectionMode === 'single'
          ? indicatorPosition === 'start' ? [check, ...optionContent] : [...optionContent, check]
          : optionContent
        item.append(...content)
      } else {
        label.textContent = translate(option.label)
        if (option.style) Object.assign(label.style, option.style)
        const content = selectionMode === 'single'
          ? indicatorPosition === 'start' ? [check, label] : [label, check]
          : [label]
        item.append(...content)
      }

      this.listen(item, 'click', () => {
        this.close()
        this.execute(context, option.value)
      })
      panel.append(item)
    }

    wrapper.append(trigger)
    // 面板挂到 body，避免被编辑器的 overflow 裁剪；样式通过专用类名保持隔离。
    document.body.append(panel)
    this.trigger = trigger
    this.panel = panel

    this.listen(trigger, 'mousedown', (event) => event.preventDefault())
    this.listen(trigger, 'click', () => panel.hidden ? this.open() : this.close())
    this.listen(trigger, 'keydown', (event) => {
      if (event.key !== 'ArrowDown') return
      event.preventDefault()
      this.open(true)
    })
    this.listen(panel, 'keydown', (event) => this.handlePanelKeydown(event))
    this.listen(document.documentElement, 'click', (event) => {
      const target = event.target as Node | null
      if (target && !wrapper.contains(target) && !panel.contains(target)) this.close()
    })
    return wrapper
  }

  /** 执行选项命令。 */
  execute(context: MenuContext, value = ''): void {
    this.options.execute(context, value)
  }

  /** 更新当前标签、选中项及可用状态。 */
  update(context: MenuContext): void {
    if (!this.trigger || !this.panel) return
    const value = this.options.getValue?.(context) ?? ''
    const selected = this.options.options.find((option) => option.value === value)
    const label = this.trigger.querySelector<HTMLElement>('[data-dropdown-label]')
    if (label) {
      label.removeAttribute('style')
      label.replaceChildren()
      const triggerIcon = this.options.triggerIcon ?? (this.options.iconOnly ? selected?.icon : undefined)
      if (triggerIcon) {
        const icon = createElement(triggerIcon, { 'aria-hidden': 'true' })
        icon.classList.add('aieditor__dropdown-trigger-icon')
        label.append(icon)
      } else {
        label.textContent = context.i18n.t(selected?.label ?? this.options.label)
        if (selected?.style) Object.assign(label.style, selected.style)
      }
    }
    this.trigger.disabled = !(this.options.isEnabled?.(context) ?? true)

    if ((this.options.selectionMode ?? 'single') === 'none') return
    this.panel.querySelectorAll<HTMLButtonElement>('[data-value]').forEach((item) => {
      const active = item.dataset.value === value
      item.classList.toggle('is-active', active)
      item.setAttribute('aria-checked', String(active))
    })
  }

  /** 停止定位监听并移除 Portal 面板。 */
  destroy(): void {
    this.close()
    this.panel?.remove()
    this.panel = null
    this.trigger = null
    super.destroy()
  }

  /** 打开面板并启动 Floating UI 的滚动/尺寸自动更新。 */
  private open(focusFirst = false): void {
    if (!this.trigger || !this.panel || this.trigger.disabled || !this.panel.hidden) return
    this.panel.hidden = false
    this.trigger.setAttribute('aria-expanded', 'true')
    this.stopAutoUpdate = autoUpdate(this.trigger, this.panel, () => this.updatePosition())
    if (focusFirst) this.getOptions()[0]?.focus()
  }

  /** 关闭面板并按需把焦点还给触发按钮。 */
  private close(returnFocus = false): void {
    if (!this.trigger || !this.panel) return
    this.stopAutoUpdate?.()
    this.stopAutoUpdate = undefined
    this.panel.hidden = true
    this.trigger.setAttribute('aria-expanded', 'false')
    if (returnFocus) this.trigger.focus()
  }

  /** 计算固定定位坐标，并在异步计算结束后确认面板仍然有效。 */
  private async updatePosition(): Promise<void> {
    if (!this.trigger || !this.panel || this.panel.hidden) return
    this.panel.style.minWidth = `${this.trigger.offsetWidth}px`
    const { x, y } = await computePosition(this.trigger, this.panel, {
      placement: resolveMenuFloatingPlacement(this.trigger, 'bottom-start'),
      strategy: 'fixed',
      middleware: [offset(({placement}) => resolveMenuFloatingOffset(this.trigger!, placement)), flip(), shift({ padding: 8 })],
    })
    if (!this.panel || this.panel.hidden) return
    const position = clampFloatingPosition(this.panel, x, y)
    Object.assign(this.panel.style, { left: `${position.x}px`, top: `${position.y}px` })
  }

  /** 实现 Escape、上下方向键、Home 和 End 导航。 */
  private handlePanelKeydown(event: KeyboardEvent): void {
    const items = this.getOptions()
    if (!items.length) return
    const index = items.indexOf(document.activeElement as HTMLButtonElement)

    if (event.key === 'Escape') {
      event.preventDefault()
      this.close(true)
      return
    }

    const destinations: Record<string, number> = {
      ArrowDown: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }
    const destination = destinations[event.key]
    if (destination === undefined) return
    event.preventDefault()
    items[destination]?.focus()
  }

  private getOptions(): HTMLButtonElement[] {
    return this.panel ? [...this.panel.querySelectorAll<HTMLButtonElement>('[data-value]')] : []
  }
}
