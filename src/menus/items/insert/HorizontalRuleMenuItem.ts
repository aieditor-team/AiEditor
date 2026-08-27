import {autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom'
import {Check, ChevronDown, ChevronRight, createElement, Minus, Palette} from 'lucide'
import type {HorizontalRuleAttributes, HorizontalRuleStyle} from '../../../extensions/horizontal-rule/HorizontalRule'
import {defaultHorizontalRuleAttributes} from '../../../extensions/horizontal-rule/HorizontalRule'
import {CustomColorPicker} from '../../core/CustomColorPicker'
import type {MenuContext} from '../../core'
import {isFloatingAnchorVisible, MenuItem, resolveMenuFloatingOffset, resolveMenuFloatingPlacement} from '../../core'
import {defaultStandardColors, defaultThemeColors} from '../text/ColorMenuItems'

interface DividerStyleOption {
  label: string
  value: HorizontalRuleStyle
}

const dividerStyles: DividerStyleOption[] = [
  {label: 'Solid line', value: 'solid'},
  {label: 'Dotted line', value: 'dotted'},
  {label: 'Dashed line', value: 'dashed'},
  {label: 'Long dashed line', value: 'long-dashed'},
  {label: 'Dash dot line', value: 'dash-dot'},
  {label: 'Dash dot dot line', value: 'dash-dot-dot'},
  {label: 'Double line', value: 'double'},
  {label: 'Triple line', value: 'triple'},
  {label: 'Thin thick line', value: 'thin-thick'},
  {label: 'Thick thin line', value: 'thick-thin'},
  {label: 'Wavy line', value: 'wavy'},
  {label: 'Double wavy line', value: 'double-wavy'},
  {label: 'Shadow line', value: 'shadow'},
]

export const defaultHorizontalRuleThicknesses = [.25, .5, .75, 1, 1.5, 2.25, 3, 4.5, 6] as const

let horizontalRuleMenuSequence = 0

/** 可选择线型、颜色和粗细，并可修改当前选中分隔线的菜单。 */
export class HorizontalRuleMenuItem extends MenuItem {
  private trigger: HTMLButtonElement | null = null
  private panel: HTMLElement | null = null
  private colorPanel: HTMLElement | null = null
  private thicknessPanel: HTMLElement | null = null
  private colorTrigger: HTMLButtonElement | null = null
  private thicknessTrigger: HTMLButtonElement | null = null
  private customColorPicker: CustomColorPicker | null = null
  private stopMainAutoUpdate: (() => void) | undefined
  private stopSubmenuAutoUpdate: (() => void) | undefined
  private attributes: Required<HorizontalRuleAttributes> = {...defaultHorizontalRuleAttributes}
  private context: MenuContext | null = null

  constructor() {
    super('horizontal-rule')
  }

  /** 创建主触发器、线型列表和两级颜色/粗细 Portal，并注册统一关闭逻辑。 */
  render(context: MenuContext): HTMLElement {
    this.context = context
    const t = (value: string) => context.i18n.t(value)
    const wrapper = document.createElement('div')
    const trigger = document.createElement('button')
    const panel = document.createElement('div')
    const panelId = `aieditor-horizontal-rule-${++horizontalRuleMenuSequence}`
    wrapper.className = 'aieditor__horizontal-rule-menu'
    trigger.type = 'button'
    trigger.className = 'aieditor__tool aieditor__horizontal-rule-trigger'
    trigger.title = t('Horizontal rule')
    trigger.setAttribute('aria-label', t('Horizontal rule'))
    trigger.setAttribute('aria-haspopup', 'menu')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-controls', panelId)
    trigger.append(
      createElement(Minus, {'aria-hidden': 'true'}),
      createElement(ChevronDown, {'aria-hidden': 'true', class: 'aieditor__menu-chevron'}),
    )

    panel.id = panelId
    panel.className = 'aieditor__horizontal-rule-panel'
    panel.setAttribute('role', 'menu')
    panel.setAttribute('aria-label', t('Horizontal rule'))
    panel.hidden = true
    panel.append(this.createNoneOption(t))
    dividerStyles.forEach((option) => panel.append(this.createStyleOption(option, t)))

    const settings = document.createElement('div')
    settings.className = 'aieditor__horizontal-rule-settings'
    const colorTrigger = this.createSubmenuTrigger(t('Divider color'), 'color')
    const thicknessTrigger = this.createSubmenuTrigger(t('Divider thickness'), 'thickness')
    settings.append(colorTrigger, thicknessTrigger)
    panel.append(settings)

    const colorPanel = this.createColorPanel(t)
    const thicknessPanel = this.createThicknessPanel(t)
    colorPanel.id = `${panelId}-color`
    thicknessPanel.id = `${panelId}-thickness`
    colorTrigger.setAttribute('aria-controls', colorPanel.id)
    thicknessTrigger.setAttribute('aria-controls', thicknessPanel.id)
    // 子菜单挂到 body 避免被工具组裁剪，aria-controls 用于递归继承完整 Portal 归属链。
    document.body.append(panel, colorPanel, thicknessPanel)
    wrapper.append(trigger)
    this.trigger = trigger
    this.panel = panel
    this.colorPanel = colorPanel
    this.thicknessPanel = thicknessPanel
    this.colorTrigger = colorTrigger
    this.thicknessTrigger = thicknessTrigger
    this.customColorPicker = new CustomColorPicker({
      translate: t,
      onApply: (value) => {
        this.applyAttributes({color: value})
        this.closeSubmenus()
      },
      onCancel: () => undefined,
    })
    const moreColorTrigger = colorPanel.querySelector<HTMLElement>('.aieditor__horizontal-rule-more-color')
    if (moreColorTrigger) this.customColorPicker.connect(moreColorTrigger)

    this.listen(trigger, 'mousedown', (event) => event.preventDefault())
    this.listen(trigger, 'click', () => panel.hidden ? this.open() : this.close())
    this.listen(trigger, 'keydown', (event) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      event.preventDefault()
      this.open(event.key === 'ArrowDown' ? 'first' : 'last')
    })
    this.listen(panel, 'keydown', (event) => this.handlePanelKeydown(event, panel, trigger))
    this.listen(colorPanel, 'keydown', (event) => this.handlePanelKeydown(event, colorPanel, colorTrigger))
    this.listen(thicknessPanel, 'keydown', (event) => this.handlePanelKeydown(event, thicknessPanel, thicknessTrigger))
    this.listen(colorTrigger, 'click', (event) => this.openSubmenu(colorTrigger, colorPanel, event.detail === 0))
    this.listen(thicknessTrigger, 'click', (event) => this.openSubmenu(thicknessTrigger, thicknessPanel, event.detail === 0))
    this.listen(document.documentElement, 'click', (event) => {
      const target = event.target as Node | null
      if (target && !wrapper.contains(target) && !panel.contains(target)
        && !colorPanel.contains(target) && !thicknessPanel.contains(target)
        && !this.customColorPicker?.contains(target)) this.close()
    })
    return wrapper
  }

  /** 从当前分隔线节点读取属性，并同步按钮可用、激活与选中状态。 */
  update(context: MenuContext): void {
    if (!this.trigger || !this.panel) return
    const active = context.editor.isActive('horizontalRule')
    if (active) {
      const current = context.editor.getAttributes('horizontalRule') as HorizontalRuleAttributes
      this.attributes = {
        lineStyle: current.lineStyle ?? defaultHorizontalRuleAttributes.lineStyle,
        color: current.color ?? defaultHorizontalRuleAttributes.color,
        thickness: current.thickness ?? defaultHorizontalRuleAttributes.thickness,
      }
    }
    this.trigger.disabled = !context.editor.isEditable
    this.trigger.classList.toggle('is-active', active)
    this.trigger.setAttribute('aria-pressed', String(active))
    this.syncSelection(active)
  }

  /** 停止所有定位监听并移除三个 Portal 与自定义选色器。 */
  destroy(): void {
    this.close()
    this.customColorPicker?.destroy()
    this.customColorPicker = null
    this.panel?.remove()
    this.colorPanel?.remove()
    this.thicknessPanel?.remove()
    this.panel = null
    this.colorPanel = null
    this.thicknessPanel = null
    this.trigger = null
    this.context = null
    super.destroy()
  }

  /** 创建“无分隔线”动作；仅在光标位于分隔线节点时可执行删除。 */
  private createNoneOption(t: (value: string) => string): HTMLButtonElement {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'aieditor__horizontal-rule-option aieditor__horizontal-rule-none'
    item.setAttribute('role', 'menuitem')
    item.dataset.dividerAction = 'remove'
    item.textContent = t('No divider')
    this.listen(item, 'mousedown', (event) => event.preventDefault())
    this.listen(item, 'click', () => {
      if (this.context?.editor.isActive('horizontalRule')) this.context.editor.chain().focus().deleteSelection().run()
      this.close()
    })
    return item
  }

  /** 创建带预览的线型单选项。 */
  private createStyleOption(option: DividerStyleOption, t: (value: string) => string): HTMLButtonElement {
    const item = document.createElement('button')
    const check = createElement(Check, {'aria-hidden': 'true'})
    const preview = document.createElement('span')
    item.type = 'button'
    item.className = 'aieditor__horizontal-rule-option aieditor__horizontal-rule-style-option'
    item.dataset.dividerStyle = option.value
    item.title = t(option.label)
    item.setAttribute('aria-label', t(option.label))
    item.setAttribute('role', 'menuitemradio')
    item.setAttribute('aria-checked', 'false')
    check.classList.add('aieditor__horizontal-rule-check')
    preview.className = 'aieditor__horizontal-rule-preview'
    preview.dataset.dividerStyle = option.value
    item.append(check, preview)
    this.listen(item, 'mousedown', (event) => event.preventDefault())
    this.listen(item, 'click', () => {
      this.attributes.lineStyle = option.value
      this.context?.editor.chain().focus().setHorizontalRuleStyle(this.attributes).run()
      this.close()
    })
    return item
  }

  /** 创建颜色或粗细的二级菜单入口。 */
  private createSubmenuTrigger(label: string, type: 'color' | 'thickness'): HTMLButtonElement {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'aieditor__horizontal-rule-setting'
    item.dataset.dividerSetting = type
    item.setAttribute('role', 'menuitem')
    item.setAttribute('aria-haspopup', 'menu')
    item.setAttribute('aria-expanded', 'false')
    const labelElement = document.createElement('span')
    labelElement.textContent = label
    const value = document.createElement('span')
    value.className = 'aieditor__horizontal-rule-setting-value'
    value.dataset.dividerSettingValue = type
    item.append(labelElement, value, createElement(ChevronRight, {'aria-hidden': 'true'}))
    this.listen(item, 'mousedown', (event) => event.preventDefault())
    return item
  }

  /** 创建主题色、标准色及精确选色入口组成的颜色面板。 */
  private createColorPanel(t: (value: string) => string): HTMLElement {
    const panel = document.createElement('div')
    panel.className = 'aieditor__horizontal-rule-submenu aieditor__horizontal-rule-color-panel'
    panel.setAttribute('role', 'menu')
    panel.setAttribute('aria-label', t('Divider color'))
    panel.hidden = true
    panel.append(this.createColorSection(t('Theme colors'), defaultThemeColors))
    panel.append(this.createColorSection(t('Standard colors'), defaultStandardColors))
    const more = document.createElement('button')
    more.type = 'button'
    more.className = 'aieditor__horizontal-rule-more-color'
    more.setAttribute('role', 'menuitem')
    more.append(createElement(Palette, {'aria-hidden': 'true'}), document.createTextNode(t('More colors')), createElement(ChevronRight, {'aria-hidden': 'true'}))
    this.listen(more, 'click', () => this.customColorPicker?.open(more, this.attributes.color))
    panel.append(more)
    return panel
  }

  /** 创建一组可键盘选择的颜色色块。 */
  private createColorSection(label: string, colors: {label: string, value: string}[]): HTMLElement {
    const section = document.createElement('section')
    const heading = document.createElement('div')
    const grid = document.createElement('div')
    section.className = 'aieditor__horizontal-rule-color-section'
    heading.className = 'aieditor__horizontal-rule-color-label'
    heading.textContent = label
    grid.className = 'aieditor__horizontal-rule-color-grid'
    grid.setAttribute('role', 'group')
    colors.forEach((color) => {
      const swatch = document.createElement('button')
      swatch.type = 'button'
      swatch.className = 'aieditor__horizontal-rule-color-swatch'
      swatch.dataset.dividerColor = color.value
      swatch.style.backgroundColor = color.value
      swatch.title = color.label
      swatch.setAttribute('aria-label', color.label)
      swatch.setAttribute('role', 'menuitemradio')
      swatch.setAttribute('aria-checked', 'false')
      this.listen(swatch, 'click', () => {
        this.applyAttributes({color: color.value})
        this.closeSubmenus()
      })
      grid.append(swatch)
    })
    section.append(heading, grid)
    return section
  }

  /** 创建带实际像素高度预览的粗细单选面板。 */
  private createThicknessPanel(t: (value: string) => string): HTMLElement {
    const panel = document.createElement('div')
    panel.className = 'aieditor__horizontal-rule-submenu aieditor__horizontal-rule-thickness-panel'
    panel.setAttribute('role', 'menu')
    panel.setAttribute('aria-label', t('Divider thickness'))
    panel.hidden = true
    defaultHorizontalRuleThicknesses.forEach((thickness) => {
      const item = document.createElement('button')
      const check = createElement(Check, {'aria-hidden': 'true'})
      const label = document.createElement('span')
      const preview = document.createElement('span')
      item.type = 'button'
      item.className = 'aieditor__horizontal-rule-thickness-option'
      item.dataset.dividerThickness = String(thickness)
      item.setAttribute('role', 'menuitemradio')
      item.setAttribute('aria-checked', 'false')
      check.classList.add('aieditor__horizontal-rule-check')
      label.textContent = `${thickness} ${t('pt')}`
      preview.className = 'aieditor__horizontal-rule-thickness-preview'
      preview.style.height = `${thickness}px`
      item.append(check, label, preview)
      this.listen(item, 'click', () => {
        this.applyAttributes({thickness})
        this.closeSubmenus()
      })
      panel.append(item)
    })
    return panel
  }

  /** 更新本地默认值；选中现有分隔线时同时写回节点属性。 */
  private applyAttributes(attributes: HorizontalRuleAttributes): void {
    Object.assign(this.attributes, attributes)
    if (this.context?.editor.isActive('horizontalRule')) {
      this.context.editor.chain().focus().updateHorizontalRuleStyle(attributes).run()
    }
    this.syncSelection(Boolean(this.context?.editor.isActive('horizontalRule')))
  }

  /** 根据当前属性统一刷新线型、色块、粗细和入口摘要。 */
  private syncSelection(active: boolean): void {
    this.panel?.querySelectorAll<HTMLButtonElement>('[data-divider-style]').forEach((item) => {
      const selected = item.dataset.dividerStyle === this.attributes.lineStyle
      item.classList.toggle('is-active', selected)
      item.setAttribute('aria-checked', String(selected))
    })
    const remove = this.panel?.querySelector<HTMLButtonElement>('[data-divider-action="remove"]')
    if (remove) remove.disabled = !active
    this.colorPanel?.querySelectorAll<HTMLButtonElement>('[data-divider-color]').forEach((item) => {
      const selected = item.dataset.dividerColor === this.attributes.color
      item.classList.toggle('is-active', selected)
      item.setAttribute('aria-checked', String(selected))
    })
    this.thicknessPanel?.querySelectorAll<HTMLButtonElement>('[data-divider-thickness]').forEach((item) => {
      const selected = Number(item.dataset.dividerThickness) === Number(this.attributes.thickness)
      item.classList.toggle('is-active', selected)
      item.setAttribute('aria-checked', String(selected))
    })
    const colorValue = this.colorTrigger?.querySelector<HTMLElement>('[data-divider-setting-value="color"]')
    if (colorValue) {
      colorValue.className = 'aieditor__horizontal-rule-setting-value aieditor__horizontal-rule-color-value'
      colorValue.style.backgroundColor = this.attributes.color || 'currentColor'
    }
    const thicknessValue = this.thicknessTrigger?.querySelector<HTMLElement>('[data-divider-setting-value="thickness"]')
    if (thicknessValue) thicknessValue.textContent = `${this.attributes.thickness} ${this.context?.i18n.t('pt') ?? 'pt'}`
  }

  /** 打开主面板并持续跟随触发按钮；键盘打开时按方向移动焦点。 */
  private open(focus: 'first' | 'last' | false = false): void {
    if (!this.trigger || !this.panel || this.trigger.disabled) return
    this.panel.hidden = false
    this.trigger.setAttribute('aria-expanded', 'true')
    this.stopMainAutoUpdate?.()
    const placement = resolveMenuFloatingPlacement(this.trigger, 'bottom-start') as 'bottom-start' | 'right-start'
    this.stopMainAutoUpdate = autoUpdate(this.trigger, this.panel, () => void this.positionPanel(this.trigger!, this.panel!, placement))
    void this.positionPanel(this.trigger, this.panel, placement)
    if (focus) {
      const items = this.getItems(this.panel)
      ;(focus === 'first' ? items[0] : items.at(-1))?.focus()
    }
  }

  /** 关闭整条分隔线菜单链。 */
  private close(returnFocus = false): void {
    this.stopMainAutoUpdate?.()
    this.stopMainAutoUpdate = undefined
    this.closeSubmenus()
    this.customColorPicker?.close()
    if (this.panel) this.panel.hidden = true
    this.trigger?.setAttribute('aria-expanded', 'false')
    if (returnFocus) this.trigger?.focus()
  }

  /** 保证颜色和粗细互斥打开，并将二级面板定位到主面板侧边。 */
  private openSubmenu(anchor: HTMLButtonElement, panel: HTMLElement, focusFirst = false): void {
    const wasOpen = !panel.hidden
    this.closeSubmenus()
    if (wasOpen) return
    panel.hidden = false
    anchor.setAttribute('aria-expanded', 'true')
    this.stopSubmenuAutoUpdate = autoUpdate(anchor, panel, () => void this.positionPanel(anchor, panel, 'right-start'))
    void this.positionPanel(anchor, panel, 'right-start')
    if (focusFirst) this.getItems(panel)[0]?.focus()
  }

  /** 关闭二级菜单并停止其 Floating UI 监听。 */
  private closeSubmenus(returnFocus = false): void {
    this.stopSubmenuAutoUpdate?.()
    this.stopSubmenuAutoUpdate = undefined
    this.colorPanel && (this.colorPanel.hidden = true)
    this.thicknessPanel && (this.thicknessPanel.hidden = true)
    this.colorTrigger?.setAttribute('aria-expanded', 'false')
    this.thicknessTrigger?.setAttribute('aria-expanded', 'false')
    if (returnFocus) (this.colorTrigger?.getAttribute('aria-expanded') === 'true' ? this.colorTrigger : this.thicknessTrigger)?.focus()
  }

  /** 计算并钳制面板坐标；锚点隐藏时关闭弹层，禁止漂移到视口原点。 */
  private async positionPanel(anchor: HTMLElement, panel: HTMLElement, placement: 'bottom-start' | 'right-start'): Promise<void> {
    if (!isFloatingAnchorVisible(anchor)) {
      panel === this.panel ? this.close() : this.closeSubmenus()
      return
    }
    const position = await computePosition(anchor, panel, {
      placement,
      strategy: 'fixed',
      middleware: [offset(({placement: resolvedPlacement}) => resolveMenuFloatingOffset(this.trigger!, resolvedPlacement)), flip(), shift({padding: 8})],
    })
    if (panel.hidden) return
    if (!isFloatingAnchorVisible(anchor)) {
      panel === this.panel ? this.close() : this.closeSubmenus()
      return
    }
    const left = Math.max(8, Math.min(position.x, window.innerWidth - panel.offsetWidth - 8))
    const top = Math.max(8, Math.min(position.y, window.innerHeight - panel.offsetHeight - 8))
    Object.assign(panel.style, {left: `${left}px`, top: `${top}px`})
  }

  /** 处理主面板与二级面板的 Escape、方向键及首尾导航。 */
  private handlePanelKeydown(event: KeyboardEvent, panel: HTMLElement, returnTarget: HTMLElement): void {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (panel === this.panel) this.close(true)
      else {
        this.closeSubmenus()
        returnTarget.focus()
      }
      return
    }
    if (panel !== this.panel && event.key === 'ArrowLeft') {
      event.preventDefault()
      this.closeSubmenus()
      returnTarget.focus()
      return
    }
    if (panel === this.panel && event.key === 'ArrowRight') {
      const setting = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-divider-setting]')
      if (setting) {
        event.preventDefault()
        const submenu = setting.dataset.dividerSetting === 'color' ? this.colorPanel : this.thicknessPanel
        if (submenu) this.openSubmenu(setting, submenu, true)
        return
      }
    }
    const items = this.getItems(panel)
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    const destinations: Record<string, number> = {
      ArrowDown: (index + 1) % items.length,
      ArrowRight: (index + 1) % items.length,
      ArrowUp: (index - 1 + items.length) % items.length,
      ArrowLeft: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }
    const destination = destinations[event.key]
    if (destination === undefined || !items.length) return
    event.preventDefault()
    items[destination]?.focus()
  }

  /** 返回当前面板内可参与 roving focus 的可用菜单项。 */
  private getItems(panel: HTMLElement): HTMLButtonElement[] {
    return [...panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  }
}
