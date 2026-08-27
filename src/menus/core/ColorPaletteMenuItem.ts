import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom'
import { Check, ChevronDown, ChevronRight, createElement, Palette, type IconNode } from 'lucide'
import type { MenuContext } from './MenuContext'
import {
  clampFloatingPosition,
  isFloatingAnchorVisible,
  resolveMenuFloatingOffset,
  resolveMenuFloatingPlacement,
} from './FloatingPlacement'
import { CustomColorPicker } from './CustomColorPicker'
import { MenuItem } from './MenuItem'

let colorPaletteSequence = 0

/** 调色板中的可选颜色；label 用于提示和无障碍名称。 */
export interface ColorPaletteOption {
  label: string
  value: string
}

/** 分别配置主题色与标准色的完整调色板。 */
export interface ColorPaletteConfig {
  colors?: ColorPaletteOption[]
  standardColors?: ColorPaletteOption[]
  recentLimit?: number
}

/** 简写数组只提供主题色；对象形式可同时提供标准色。 */
export type ColorPaletteSetting = ColorPaletteOption[] | ColorPaletteConfig

/** 通用文字颜色菜单的行为和视觉配置。 */
export interface ColorPaletteMenuItemOptions {
  id: string
  label: string
  paletteLabel?: string
  icon: IconNode
  colors: ColorPaletteOption[]
  standardColors?: ColorPaletteOption[]
  recentLimit?: number
  getValue: (context: MenuContext) => string
  execute: (context: MenuContext, value: string) => void
  isEnabled?: (context: MenuContext) => boolean
}

/** WPS 风格色板下拉菜单，包含清除、主题色、标准色和最近使用。 */
/**
 * 带主动作、调色板、最近颜色和精确选色器的复合菜单项。
 * 字体色、背景色和高亮色共用该状态机，仅注入不同的读写命令。
 */
export class ColorPaletteMenuItem extends MenuItem {
  private readonly options: ColorPaletteMenuItemOptions
  private readonly recentColors: ColorPaletteOption[] = []
  private selectedValue = ''
  private primary: HTMLButtonElement | null = null
  private trigger: HTMLButtonElement | null = null
  private panel: HTMLElement | null = null
  private recentSection: HTMLElement | null = null
  private recentGrid: HTMLElement | null = null
  private customPicker: CustomColorPicker | null = null
  private stopAutoUpdate: (() => void) | undefined
  private translate = (value: string): string => value

  constructor(options: ColorPaletteMenuItemOptions) {
    super(options.id)
    if (!options.colors.length) throw new Error(`ColorPaletteMenuItem "${options.id}" requires colors`)
    this.options = options
  }

  /** 创建分裂按钮、Portal 调色板与精确选色器。 */
  render(context: MenuContext): HTMLElement {
    this.translate = (value) => context.i18n.t(value)
    const wrapper = document.createElement('div')
    const primary = document.createElement('button')
    const trigger = document.createElement('button')
    const panel = document.createElement('div')
    const panelId = `aieditor-color-palette-${++colorPaletteSequence}`
    wrapper.className = 'aieditor__color-menu'

    primary.type = 'button'
    primary.className = 'aieditor__color-primary'
    primary.title = this.translate(this.options.label)
    primary.setAttribute('aria-label', this.translate(this.options.label))
    const icon = createElement(this.options.icon, { 'aria-hidden': 'true' })
    icon.classList.add('aieditor__color-trigger-icon')
    const indicator = document.createElement('span')
    indicator.className = 'aieditor__color-trigger-indicator is-empty'
    indicator.dataset.colorIndicator = ''
    primary.append(icon, indicator)

    trigger.type = 'button'
    trigger.className = 'aieditor__color-trigger'
    trigger.title = this.translate(this.options.paletteLabel ?? this.options.label)
    trigger.setAttribute('aria-label', this.translate(this.options.paletteLabel ?? this.options.label))
    trigger.setAttribute('aria-haspopup', 'menu')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-controls', panelId)
    const chevron = createElement(ChevronDown, { 'aria-hidden': 'true' })
    chevron.classList.add('aieditor__menu-chevron')
    trigger.append(chevron)

    panel.id = panelId
    panel.className = 'aieditor__color-panel'
    panel.setAttribute('role', 'menu')
    panel.setAttribute('aria-label', this.translate(this.options.label))
    panel.hidden = true

    const defaultItem = document.createElement('button')
    defaultItem.type = 'button'
    defaultItem.className = 'aieditor__color-default'
    defaultItem.dataset.colorValue = ''
    defaultItem.setAttribute('role', 'menuitemradio')
    defaultItem.setAttribute('aria-checked', 'false')
    const defaultCheck = createElement(Check, { 'aria-hidden': 'true' })
    defaultCheck.classList.add('aieditor__color-check')
    const defaultLabel = document.createElement('span')
    defaultLabel.textContent = this.translate('Default')
    defaultItem.append(defaultLabel, defaultCheck)
    panel.append(defaultItem)

    panel.append(this.createSection('Theme colors', this.options.colors))
    if (this.options.standardColors?.length) {
      panel.append(this.createSection('Standard colors', this.options.standardColors))
    }

    const { section, grid } = this.createEmptySection('Recent colors')
    section.hidden = true
    panel.append(section)
    this.recentSection = section
    this.recentGrid = grid

    const moreColors = document.createElement('button')
    moreColors.type = 'button'
    moreColors.className = 'aieditor__color-more'
    moreColors.setAttribute('role', 'menuitem')
    moreColors.setAttribute('aria-haspopup', 'dialog')
    moreColors.append(
      createElement(Palette, { 'aria-hidden': 'true' }),
      Object.assign(document.createElement('span'), { textContent: this.translate('More colors') }),
      createElement(ChevronRight, { 'aria-hidden': 'true' }),
    )
    panel.append(moreColors)

    document.body.append(panel)
    wrapper.append(primary, trigger)
    this.primary = primary
    this.trigger = trigger
    this.panel = panel
    this.customPicker = new CustomColorPicker({
      onApply: (value) => {
        this.rememberColor({ label: value, value })
        this.selectColor(value)
        this.close()
        this.execute(context, value)
      },
      onCancel: () => undefined,
      translate: this.translate,
    })
    this.customPicker.connect(moreColors)

    this.listen(primary, 'mousedown', (event) => event.preventDefault())
    this.listen(primary, 'click', () => {
      this.close()
      this.execute(context, this.selectedValue)
    })
    this.listen(trigger, 'mousedown', (event) => event.preventDefault())
    this.listen(trigger, 'click', () => panel.hidden ? this.open() : this.close())
    this.listen(trigger, 'keydown', (event) => {
      if (event.key !== 'ArrowDown') return
      event.preventDefault()
      this.open(true)
    })
    this.listen(panel, 'keydown', (event) => this.handlePanelKeydown(event))
    this.listen(panel, 'click', (event) => {
      const item = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-color-value]')
      if (!item || !panel.contains(item)) return
      const value = item.dataset.colorValue ?? ''
      if (value) this.rememberColor({ label: item.getAttribute('aria-label') ?? value, value })
      this.selectColor(value)
      this.close()
      this.execute(context, value)
    })
    this.listen(moreColors, 'click', () => {
      this.customPicker?.open(moreColors, this.selectedValue)
    })
    this.listen(document.documentElement, 'click', (event) => {
      const target = event.target as Node | null
      if (target && !wrapper.contains(target) && !panel.contains(target) && !this.customPicker?.contains(target)) this.close()
    })
    return wrapper
  }

  /** 执行宿主传入的颜色命令。 */
  execute(context: MenuContext, value = ''): void {
    this.options.execute(context, value)
  }

  /** 从编辑器读取当前颜色，并同步按钮指示条和选中项。 */
  update(context: MenuContext): void {
    if (!this.primary || !this.trigger || !this.panel) return
    const enabled = this.options.isEnabled?.(context) ?? true
    this.primary.disabled = !enabled
    this.trigger.disabled = !enabled
    this.selectedValue = this.options.getValue(context) ?? ''
    this.syncSelectedColor()
  }

  /** 停止定位并移除调色板与精确选色 Portal。 */
  destroy(): void {
    this.close()
    this.customPicker?.destroy()
    this.customPicker = null
    this.panel?.remove()
    this.panel = null
    this.primary = null
    this.trigger = null
    this.recentSection = null
    this.recentGrid = null
    super.destroy()
  }

  /** 创建带标题的一组固定颜色。 */
  private createSection(label: string, colors: ColorPaletteOption[]): HTMLElement {
    const { section, grid } = this.createEmptySection(label)
    colors.forEach((color) => grid.append(this.createSwatch(color)))
    return section
  }

  /** 创建可延后填充的颜色区域，供最近颜色复用。 */
  private createEmptySection(label: string): { section: HTMLElement; grid: HTMLElement } {
    const section = document.createElement('section')
    const heading = document.createElement('div')
    const grid = document.createElement('div')
    section.className = 'aieditor__color-section'
    heading.className = 'aieditor__color-section-label'
    heading.textContent = this.translate(label)
    grid.className = 'aieditor__color-grid'
    grid.setAttribute('role', 'group')
    grid.setAttribute('aria-label', this.translate(label))
    section.append(heading, grid)
    return { section, grid }
  }

  /** 创建单个颜色色块及其选中语义。 */
  private createSwatch(color: ColorPaletteOption): HTMLButtonElement {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'aieditor__color-swatch'
    item.dataset.colorValue = color.value
    item.title = this.translate(color.label)
    item.setAttribute('aria-label', this.translate(color.label))
    item.setAttribute('role', 'menuitemradio')
    item.setAttribute('aria-checked', 'false')
    item.style.setProperty('--aieditor-swatch-color', color.value)
    const check = createElement(Check, { 'aria-hidden': 'true' })
    check.classList.add('aieditor__color-check')
    item.append(check)
    return item
  }

  /** 将自定义或最近使用颜色置顶，并限制历史数量。 */
  private rememberColor(color: ColorPaletteOption): void {
    const limit = Math.max(0, this.options.recentLimit ?? 8)
    if (!limit) return
    const existing = this.recentColors.findIndex((item) => item.value === color.value)
    if (existing >= 0) this.recentColors.splice(existing, 1)
    this.recentColors.unshift(color)
    this.recentColors.splice(limit)
    if (!this.recentGrid || !this.recentSection) return
    this.recentGrid.replaceChildren(...this.recentColors.map((item) => this.createSwatch(item)))
    this.recentSection.hidden = false
  }

  /** 更新本地选中值并刷新所有视觉状态。 */
  private selectColor(value: string): void {
    this.selectedValue = value
    this.syncSelectedColor()
  }

  /** 同步主按钮颜色条和调色板单选状态。 */
  private syncSelectedColor(): void {
    const indicator = this.primary?.querySelector<HTMLElement>('[data-color-indicator]')
    if (indicator) {
      indicator.style.backgroundColor = this.selectedValue || 'transparent'
      indicator.classList.toggle('is-empty', !this.selectedValue)
    }
    this.panel?.querySelectorAll<HTMLButtonElement>('[data-color-value]').forEach((item) => {
      const active = item.dataset.colorValue === this.selectedValue
      item.classList.toggle('is-active', active)
      item.setAttribute('aria-checked', String(active))
    })
  }

  /** 打开调色板并启动锚点跟随。 */
  private open(focusFirst = false): void {
    if (!this.trigger || !this.panel || this.trigger.disabled || !this.panel.hidden) return
    this.panel.hidden = false
    this.trigger.setAttribute('aria-expanded', 'true')
    this.stopAutoUpdate = autoUpdate(this.trigger, this.panel, () => this.updatePosition())
    void this.updatePosition()
    if (focusFirst) this.getItems()[0]?.focus()
  }

  /** 关闭调色板以及它拥有的精确选色器。 */
  private close(returnFocus = false): void {
    if (!this.trigger || !this.panel) return
    this.stopAutoUpdate?.()
    this.stopAutoUpdate = undefined
    this.customPicker?.close()
    this.panel.hidden = true
    this.trigger.setAttribute('aria-expanded', 'false')
    if (returnFocus) this.trigger.focus()
  }

  /** 计算 Portal 坐标，并在锚点隐藏时关闭整条菜单链。 */
  private async updatePosition(): Promise<void> {
    if (!this.trigger || !this.panel || this.panel.hidden) return
    if (!isFloatingAnchorVisible(this.trigger)) {
      this.close()
      return
    }
    const { x, y } = await computePosition(this.trigger, this.panel, {
      placement: resolveMenuFloatingPlacement(this.trigger, 'bottom-start'),
      strategy: 'fixed',
      middleware: [offset(({placement}) => resolveMenuFloatingOffset(this.trigger!, placement)), flip(), shift({ padding: 8 })],
    })
    if (!this.trigger || !this.panel || this.panel.hidden) return
    if (!isFloatingAnchorVisible(this.trigger)) {
      this.close()
      return
    }
    const position = clampFloatingPosition(this.panel, x, y)
    Object.assign(this.panel.style, { left: `${position.x}px`, top: `${position.y}px` })
  }

  /** 处理 Escape、方向键与 Home/End 调色板导航。 */
  private handlePanelKeydown(event: KeyboardEvent): void {
    const items = this.getItems()
    if (!items.length) return
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'Escape') {
      event.preventDefault()
      this.close(true)
      return
    }
    const destinations: Record<string, number> = {
      ArrowRight: (index + 1) % items.length,
      ArrowDown: (index + 1) % items.length,
      ArrowLeft: (index - 1 + items.length) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }
    const destination = destinations[event.key]
    if (destination === undefined) return
    event.preventDefault()
    items[destination]?.focus()
  }

  /** 返回当前可聚焦的调色板命令。 */
  private getItems(): HTMLButtonElement[] {
    return this.panel ? [...this.panel.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"], [role="menuitem"]')] : []
  }
}
