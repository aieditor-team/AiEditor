import {autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom'
import {Check, ChevronDown, createElement, Palette, PanelTop} from 'lucide'
import {clampFloatingPosition, MenuItem, resolveMenuFloatingOffset, resolveMenuFloatingPlacement, type ColorPaletteOption, type MenuContext} from '../../core'

let highlightBlockSequence = 0

const createColors = (values: readonly string[]): ColorPaletteOption[] => values.map((value) => ({
    label: value || 'Default',
    value,
}))

export const defaultHighlightBlockBorderColors = createColors([
    '', '#dfe1e5', '#f28b82', '#fbbc70', '#fff475', '#ccff90', '#a7ffeb', '#8ab4f8', '#a78bfa',
])

export const defaultHighlightBlockBackgroundColors = createColors([
    '', '#f1f3f4', '#fce8e6', '#fef3e2', '#fffde7', '#eef7dc', '#e0f2df', '#e8f0fe', '#eee7fc',
])

/** 块高亮菜单可选的背景色与边框色集合。 */
export interface HighlightBlockMenuOptions {
    borderColors?: ColorPaletteOption[]
    backgroundColors?: ColorPaletteOption[]
}

/** 工具栏版本包含开关，浮动版本只展示颜色入口。 */
export type HighlightBlockMenuVariant = 'toolbar' | 'floating'

/** 切换高亮块，并提供边框色与背景色的双层色板。 */
/** 高亮块开关与颜色配置复合菜单。 */
export class HighlightBlockMenuItem extends MenuItem {
    private readonly options: Required<HighlightBlockMenuOptions>
    private trigger: HTMLButtonElement | null = null
    private toggle: HTMLButtonElement | null = null
    private panel: HTMLElement | null = null
    private stopAutoUpdate: (() => void) | undefined
    private readonly variant: HighlightBlockMenuVariant
    private readonly getTargetPosition: (() => number | null) | undefined

    constructor(
        options: HighlightBlockMenuOptions = {},
        variant: HighlightBlockMenuVariant = 'toolbar',
        getTargetPosition?: () => number | null,
    ) {
        super(variant === 'toolbar' ? 'highlight-block' : 'highlight-block-floating-colors')
        this.variant = variant
        this.getTargetPosition = getTargetPosition
        this.options = {
            borderColors: options.borderColors ?? defaultHighlightBlockBorderColors,
            backgroundColors: options.backgroundColors ?? defaultHighlightBlockBackgroundColors,
        }
        if (!this.options.borderColors.length || !this.options.backgroundColors.length) {
            throw new Error('HighlightBlockMenuItem requires border and background colors')
        }
    }

    /** 根据变体创建触发器和背景/边框两个颜色分区。 */
    render(context: MenuContext): HTMLElement {
        const translate = (value: string) => context.i18n.t(value)
        const wrapper = document.createElement('div')
        const toggle = document.createElement('button')
        const trigger = document.createElement('button')
        const panel = document.createElement('div')
        const panelId = `aieditor-highlight-block-${++highlightBlockSequence}`

        wrapper.className = `aieditor__highlight-block-menu aieditor__highlight-block-menu--${this.variant}`
        toggle.type = 'button'
        toggle.className = 'aieditor__tool aieditor__highlight-block-toggle'
        toggle.title = translate('Highlight block')
        toggle.setAttribute('aria-label', translate('Toggle highlight block'))
        toggle.append(createElement(PanelTop, {'aria-hidden': 'true'}))

        trigger.type = 'button'
        trigger.className = 'aieditor__highlight-block-trigger'
        trigger.title = translate('Highlight block colors')
        trigger.setAttribute('aria-label', translate('Highlight block colors'))
        trigger.setAttribute('aria-haspopup', 'menu')
        trigger.setAttribute('aria-expanded', 'false')
        trigger.setAttribute('aria-controls', panelId)
        if (this.variant === 'floating') trigger.append(createElement(Palette, {'aria-hidden': 'true'}))
        const chevron = createElement(ChevronDown, {'aria-hidden': 'true'})
        chevron.classList.add('aieditor__menu-chevron')
        trigger.append(chevron)

        panel.id = panelId
        panel.className = 'aieditor__highlight-block-panel'
        panel.setAttribute('role', 'menu')
        panel.setAttribute('aria-label', translate('Highlight block colors'))
        panel.hidden = true
        panel.append(
            this.createSection(translate('Border color'), 'borderColor', this.options.borderColors, translate),
            this.createSection(translate('Background color'), 'backgroundColor', this.options.backgroundColors, translate),
        )

        const reset = document.createElement('button')
        reset.type = 'button'
        reset.className = 'aieditor__highlight-block-reset'
        reset.dataset.highlightBlockReset = ''
        reset.setAttribute('role', 'menuitem')
        reset.textContent = translate('Reset to default')
        panel.append(reset)

        if (this.variant === 'toolbar') {
            wrapper.append(toggle)
            this.toggle = toggle
            this.listen(toggle, 'mousedown', (event) => event.preventDefault())
            this.listen(toggle, 'click', () => context.editor.chain().focus().toggleHighlightBlock().run())
        }
        wrapper.append(trigger)
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
        this.listen(panel, 'click', (event) => {
            const swatch = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-highlight-block-color]')
            if (swatch && panel.contains(swatch)) {
                const attribute = swatch.dataset.highlightBlockColor as 'borderColor' | 'backgroundColor'
                this.setStyle(context, {
                    [attribute]: swatch.dataset.colorValue || null,
                })
                this.close()
                return
            }
            if ((event.target as Element | null)?.closest('[data-highlight-block-reset]')) {
                this.setStyle(context, {borderColor: null, backgroundColor: null})
                this.close()
            }
        })
        this.listen(panel, 'keydown', (event) => this.handlePanelKeydown(event))
        this.listen(document.documentElement, 'click', (event) => {
            const target = event.target as Node | null
            if (target && !wrapper.contains(target) && !panel.contains(target)) this.close()
        })
        return wrapper
    }

    /** 从当前高亮块读取颜色，并同步开关、色块和触发器预览。 */
    update(context: MenuContext): void {
        if (!this.trigger || !this.panel) return
        const active = context.editor.isActive('highlightBlock')
        const enabled = context.editor.isEditable
        const targetPosition = this.getTargetPosition?.()
        const targetNode = targetPosition == null ? undefined : context.editor.state.doc.nodeAt(targetPosition)
        const attributes = targetNode?.type.name === 'highlightBlock'
            ? targetNode.attrs
            : context.editor.getAttributes('highlightBlock')
        if (this.toggle) {
            this.toggle.disabled = !enabled || !context.editor.can().toggleHighlightBlock()
            this.toggle.classList.toggle('is-active', active)
            this.toggle.setAttribute('aria-pressed', String(active))
        }
        this.trigger.disabled = !enabled
        this.panel.querySelectorAll<HTMLButtonElement>('[data-highlight-block-color]').forEach((item) => {
            const attribute = item.dataset.highlightBlockColor ?? ''
            const selected = (attributes[attribute] ?? '') === (item.dataset.colorValue ?? '')
            item.classList.toggle('is-active', selected)
            item.setAttribute('aria-checked', String(selected))
        })
    }

    /** 停止定位并移除颜色面板。 */
    destroy(): void {
        this.close()
        this.panel?.remove()
        this.panel = null
        this.trigger = null
        this.toggle = null
        super.destroy()
    }

    /** 供浮动菜单判断子面板是否占用交互。 */
    isOpen(): boolean {
        return Boolean(this.panel && !this.panel.hidden)
    }

    /** 创建背景或边框颜色的一组单选色块。 */
    private createSection(
        label: string,
        attribute: 'borderColor' | 'backgroundColor',
        colors: ColorPaletteOption[],
        translate: (value: string) => string,
    ): HTMLElement {
        const section = document.createElement('section')
        const heading = document.createElement('div')
        const grid = document.createElement('div')
        section.className = 'aieditor__highlight-block-section'
        heading.className = 'aieditor__highlight-block-label'
        heading.textContent = label
        grid.className = 'aieditor__highlight-block-grid'
        grid.setAttribute('role', 'group')
        grid.setAttribute('aria-label', label)
        colors.forEach((color) => {
            const swatch = document.createElement('button')
            swatch.type = 'button'
            swatch.className = 'aieditor__highlight-block-swatch'
            swatch.dataset.highlightBlockColor = attribute
            swatch.dataset.colorValue = color.value
            swatch.title = translate(color.label)
            swatch.setAttribute('aria-label', translate(color.label))
            swatch.setAttribute('aria-checked', 'false')
            swatch.setAttribute('role', 'menuitemradio')
            swatch.style.setProperty('--aieditor-swatch-color', color.value || 'transparent')
            if (!color.value) swatch.classList.add('is-empty')
            swatch.append(createElement(Check, {'aria-hidden': 'true'}))
            grid.append(swatch)
        })
        section.append(heading, grid)
        return section
    }

    /** 激活时更新节点属性，未激活时创建带目标样式的新高亮块。 */
    private setStyle(
        context: MenuContext,
        attributes: {borderColor?: string | null; backgroundColor?: string | null},
    ): void {
        const position = this.getTargetPosition?.()
        const node = position == null ? undefined : context.editor.state.doc.nodeAt(position)
        if (position != null && node?.type.name === 'highlightBlock') {
            context.editor.view.dispatch(context.editor.state.tr.setNodeMarkup(position, undefined, {
                ...node.attrs,
                ...attributes,
            }))
            return
        }
        context.editor.chain().focus().setHighlightBlockStyle(attributes).run()
    }

    /** 打开颜色面板并按需聚焦第一个色块。 */
    private open(focusFirst = false): void {
        if (!this.trigger || !this.panel || this.trigger.disabled || !this.panel.hidden) return
        this.panel.hidden = false
        this.trigger.setAttribute('aria-expanded', 'true')
        this.stopAutoUpdate = autoUpdate(this.trigger, this.panel, () => this.updatePosition())
        if (focusFirst) this.getItems()[0]?.focus()
    }

    /** 关闭面板并停止锚点跟随。 */
    private close(returnFocus = false): void {
        if (!this.trigger || !this.panel) return
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        this.panel.hidden = true
        this.trigger.setAttribute('aria-expanded', 'false')
        if (returnFocus) this.trigger.focus()
    }

    /** 在二维色块网格中处理方向键和首尾导航。 */
    private handlePanelKeydown(event: KeyboardEvent): void {
        if (event.key === 'Escape') {
            event.preventDefault()
            this.close(true)
            return
        }
        const items = this.getItems()
        const index = items.indexOf(document.activeElement as HTMLButtonElement)
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

    /** 返回所有可选颜色命令。 */
    private getItems(): HTMLButtonElement[] {
        return this.panel
            ? [...this.panel.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"], [role="menuitem"]')]
            : []
    }

    /** 计算颜色面板的固定坐标并处理视口碰撞。 */
    private async updatePosition(): Promise<void> {
        if (!this.trigger || !this.panel || this.panel.hidden) return
        const {x, y} = await computePosition(this.trigger, this.panel, {
            placement: resolveMenuFloatingPlacement(this.trigger, 'bottom-start'),
            strategy: 'fixed',
            middleware: [offset(({placement}) => resolveMenuFloatingOffset(this.trigger!, placement)), flip(), shift({padding: 8})],
        })
        if (!this.panel || this.panel.hidden) return
        const position = clampFloatingPosition(this.panel, x, y)
        Object.assign(this.panel.style, {left: `${position.x}px`, top: `${position.y}px`})
    }
}
