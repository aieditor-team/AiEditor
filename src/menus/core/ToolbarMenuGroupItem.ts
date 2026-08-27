import {autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom'
import {ChevronDown, createElement, type IconNode} from 'lucide'
import type {MenuContext} from '../../menus/core'
import {isFloatingAnchorVisible, MenuItem, resolveMenuFloatingOffset, resolveMenuFloatingPlacement} from '../../menus/core'
import {
    hasOpenToolbarMenuGroupPortal,
    toolbarMenuGroupPortalContains,
} from './ToolbarMenuGroupLifecycle'

let toolbarMenuGroupSequence = 0

export interface ToolbarMenuGroupItemOptions {
    id: string
    label: string
    icon?: IconNode
    items: MenuItem[]
}

/** 将多个现有工具包装为一个带 Portal 面板的工具栏下拉组。 */
export class ToolbarMenuGroupItem extends MenuItem {
    private readonly options: ToolbarMenuGroupItemOptions
    private trigger: HTMLButtonElement | null = null
    private panel: HTMLElement | null = null
    private stopAutoUpdate: (() => void) | undefined

    constructor(options: ToolbarMenuGroupItemOptions) {
        super(options.id)
        if (!options.items.length) throw new Error(`ToolbarMenuGroupItem "${options.id}" requires items`)
        this.options = options
    }

    /** 挂载组内项目，收集其 body Portal，并把按钮装饰为菜单命令。 */
    render(context: MenuContext): HTMLElement {
        const document = context.editor.view.dom.ownerDocument
        const wrapper = document.createElement('div')
        const trigger = document.createElement('button')
        const label = document.createElement('span')
        const panel = document.createElement('div')
        const panelId = `aieditor-toolbar-menu-group-${++toolbarMenuGroupSequence}`
        const translatedLabel = context.i18n.t(this.options.label)

        wrapper.className = 'aieditor__toolbar-menu-group'
        trigger.type = 'button'
        trigger.className = 'aieditor__toolbar-menu-group-trigger'
        trigger.title = translatedLabel
        trigger.setAttribute('aria-label', translatedLabel)
        trigger.setAttribute('aria-haspopup', 'menu')
        trigger.setAttribute('aria-expanded', 'false')
        trigger.setAttribute('aria-controls', panelId)
        if (this.options.icon) {
            const icon = createElement(this.options.icon, {'aria-hidden': 'true'})
            icon.classList.add('aieditor__toolbar-menu-group-icon')
            trigger.append(icon)
        }
        label.className = 'aieditor__toolbar-menu-group-trigger-label'
        label.textContent = translatedLabel
        const chevron = createElement(ChevronDown, {'aria-hidden': 'true'})
        chevron.classList.add('aieditor__menu-chevron')
        trigger.append(label, chevron)

        panel.id = panelId
        panel.className = 'aieditor__toolbar-menu-group-panel'
        panel.setAttribute('role', 'menu')
        panel.setAttribute('aria-label', translatedLabel)
        panel.hidden = true
        document.body.append(panel)

        this.options.items.forEach((item) => {
            // 记录挂载前 body 子节点，新增加的 Portal 自动归属于当前工具组。
            const existingBodyChildren = new Set(document.body.children)
            item.mount(panel, context)
            document.body.querySelectorAll<HTMLElement>(':scope > *').forEach((element) => {
                if (existingBodyChildren.has(element)) return
                const owners = new Set((element.dataset.toolbarMenuGroupOwner ?? '').split(' ').filter(Boolean))
                owners.add(panelId)
                element.dataset.toolbarMenuGroupOwner = [...owners].join(' ')
            })
            const itemElement = panel.lastElementChild as HTMLElement | null
            if (itemElement) this.decorateItem(itemElement)
        })

        wrapper.append(trigger)
        this.trigger = trigger
        this.panel = panel

        this.listen(trigger, 'mousedown', (event) => event.preventDefault())
        this.listen(trigger, 'click', (event) => {
            event.stopPropagation()
            panel.hidden ? this.open() : this.close()
        })
        this.listen(trigger, 'keydown', (event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            event.preventDefault()
            this.open(event.key === 'ArrowDown' ? 'first' : 'last')
        })
        this.listen(panel, 'click', (event) => {
            if (!(event.target instanceof Element)) return
            const command = event.target.closest<HTMLButtonElement>('button')
            // 带子弹层的命令保留当前菜单作为层级上下文；普通命令执行后直接关闭。
            const popup = command?.getAttribute('aria-haspopup')
            if (command && !popup) this.close()
        })
        this.listen(panel, 'keydown', (event) => this.handlePanelKeydown(event))
        this.listen(document.documentElement, 'click', (event) => {
            const target = event.target as Node | null
            if (!target || wrapper.contains(target) || panel.contains(target)) return
            if (toolbarMenuGroupPortalContains(panelId, target)) return
            this.close()
        }, {capture: true})
        this.listen(document.documentElement, 'keydown', (event) => {
            if (event.key !== 'Escape' || panel.hidden) return
            if (panel.querySelector('[aria-haspopup][aria-expanded="true"]')) return
            if (hasOpenToolbarMenuGroupPortal(panelId, document)) return
            event.preventDefault()
            event.stopImmediatePropagation()
            this.close(true)
        })
        return wrapper
    }

    /** 汇总子项的可用与激活状态到组入口。 */
    update(context: MenuContext): void {
        this.options.items.forEach((item) => item.update(context))
        if (!this.trigger || !this.panel) return
        const commands = this.getCommands()
        const enabled = commands.some((command) => !command.disabled)
        const active = Boolean(this.panel.querySelector('.is-active, [aria-pressed="true"]'))
        this.trigger.disabled = !enabled
        this.trigger.classList.toggle('is-active', active)
        if (!enabled) this.close()
    }

    /** 销毁全部子项及其 Portal，并移除组面板。 */
    destroy(): void {
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        this.options.items.forEach((item) => item.destroy())
        this.panel?.remove()
        this.panel = null
        this.trigger = null
        super.destroy()
    }

    /** 为组内工具补齐菜单 role、可读标签和统一布局类。 */
    private decorateItem(element: HTMLElement): void {
        element.dataset.toolbarMenuGroupItem = ''
        const command = element.matches('button')
            ? element as HTMLButtonElement
            : element.querySelector<HTMLButtonElement>('button')
        if (!command) return
        command.classList.add('aieditor__toolbar-menu-group-command')
        command.setAttribute('role', 'menuitem')
        command.removeAttribute('title')
        if (command.querySelector('.aieditor__toolbar-menu-group-trigger-label')) return
        const label = document.createElement('span')
        label.className = 'aieditor__toolbar-menu-group-command-label'
        label.textContent = command.getAttribute('aria-label') ?? ''
        const chevron = command.querySelector('.aieditor__menu-chevron')
        if (chevron) chevron.before(label)
        else command.append(label)
    }

    /** 打开组面板；键盘入口可指定聚焦首项或末项。 */
    private open(focus: 'first' | 'last' | false = false): void {
        if (!this.trigger || !this.panel || this.trigger.disabled) return
        this.panel.hidden = false
        this.trigger.setAttribute('aria-expanded', 'true')
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = autoUpdate(this.trigger, this.panel, () => void this.updatePosition())
        void this.updatePosition()
        if (focus) {
            const commands = this.getCommands()
            const command = focus === 'first' ? commands[0] : commands.at(-1)
            command?.focus()
        }
    }

    /** 关闭组面板并按需恢复入口焦点。 */
    private close(returnFocus = false): void {
        if (!this.trigger || !this.panel) return
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        this.panel.hidden = true
        this.trigger.setAttribute('aria-expanded', 'false')
        if (returnFocus) this.trigger.focus()
    }

    /** 定位组面板；父级隐藏后主动关闭，避免面板漂移。 */
    private async updatePosition(): Promise<void> {
        if (!this.trigger || !this.panel || this.panel.hidden) return
        if (!isFloatingAnchorVisible(this.trigger)) {
            this.close()
            return
        }
        const {x, y, placement} = await computePosition(this.trigger, this.panel, {
            placement: resolveMenuFloatingPlacement(this.trigger, 'bottom-start'),
            strategy: 'fixed',
            middleware: [offset(({placement}) => resolveMenuFloatingOffset(this.trigger!, placement)), flip(), shift({padding: 8})],
        })
        if (!this.trigger || !this.panel || this.panel.hidden) return
        if (!isFloatingAnchorVisible(this.trigger)) {
            this.close()
            return
        }
        this.panel.dataset.toolbarSubmenuPlacement = placement.startsWith('left') ? 'left-start' : 'right-start'
        Object.assign(this.panel.style, {left: `${x}px`, top: `${y}px`})
    }

    /** 处理组内纵向导航，并让 Escape 优先交给仍打开的子 Portal。 */
    private handlePanelKeydown(event: KeyboardEvent): void {
        const commands = this.getCommands()
        if (!commands.length) return
        const document = this.panel?.ownerDocument ?? globalThis.document
        const index = commands.indexOf(document.activeElement as HTMLButtonElement)
        if (event.key === 'Escape') {
            const hasOpenChildPanel = this.panel && document.querySelector(
                `[data-toolbar-menu-group-owner~="${this.panel.id}"]:not([hidden]):not([role="dialog"])`,
            )
            if (hasOpenChildPanel) return
            event.preventDefault()
            event.stopPropagation()
            this.close(true)
            return
        }
        const destinations: Record<string, number> = {
            ArrowDown: (index + 1) % commands.length,
            ArrowUp: (index - 1 + commands.length) % commands.length,
            Home: 0,
            End: commands.length - 1,
        }
        const destination = destinations[event.key]
        if (destination === undefined) return
        event.preventDefault()
        commands[destination]?.focus()
    }

    /** 返回组面板内当前可执行的按钮。 */
    private getCommands(): HTMLButtonElement[] {
        return this.panel
            ? [...this.panel.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
            : []
    }
}
