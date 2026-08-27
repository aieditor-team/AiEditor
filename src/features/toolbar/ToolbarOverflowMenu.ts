import {autoUpdate, computePosition, flip, offset, shift} from '@floating-ui/dom'
import {ChevronDown, createElement, Ellipsis} from 'lucide'
import {applyEditorTheme} from '../../editor/AiEditorTheme'
import type {Editor} from '@tiptap/core'
import {
    hasOpenToolbarMenuGroupPortal,
    setToolbarMenuGroupPortalOwner,
    toolbarMenuGroupPortalContains,
} from '../../menus/core/ToolbarMenuGroupLifecycle'

let toolbarOverflowSequence = 0

interface OverflowItemDecoration {
    command: HTMLButtonElement
    commandHadGroupClass: boolean
    elementGroupItem: string | undefined
    label: HTMLElement | undefined
    role: string | null
    title: string | null
}

interface RibbonOverflowItem {
    element: HTMLElement
    sourceBody: HTMLElement
    sourceGroup: HTMLElement
    sourceIndex: number
}

interface RibbonOverflowGroup {
    element: HTMLElement
    body: HTMLElement
}

/** 把单行工具栏尾部放不下的直接子元素动态组装为一个工具组。 */
export class ToolbarOverflowMenu {
    private readonly container: HTMLElement
    private readonly group: HTMLElement
    private readonly trigger: HTMLButtonElement
    private readonly panel: HTMLElement
    private readonly observer: ResizeObserver
    private readonly events = new AbortController()
    private readonly decorations = new Map<HTMLElement, OverflowItemDecoration>()
    private readonly ribbonItems: RibbonOverflowItem[] = []
    private readonly ribbonOverflowGroups = new Map<HTMLElement, RibbonOverflowGroup>()
    private stopAutoUpdate: (() => void) | undefined
    private frame: number | undefined
    private observedWidth = -1

    constructor(container: HTMLElement, editor: Editor, label: string) {
        this.container = container
        const document = container.ownerDocument
        this.group = document.createElement('div')
        this.trigger = document.createElement('button')
        this.panel = document.createElement('div')
        const panelId = `aieditor-toolbar-overflow-group-${++toolbarOverflowSequence}`
        const icon = createElement(Ellipsis, {'aria-hidden': 'true'})
        const triggerLabel = document.createElement('span')
        const chevron = createElement(ChevronDown, {'aria-hidden': 'true'})

        this.group.className = 'aieditor__toolbar-menu-group aieditor__toolbar-overflow-group'
        this.group.setAttribute('role', 'group')
        this.group.setAttribute('aria-label', label)
        this.trigger.type = 'button'
        this.trigger.className = 'aieditor__toolbar-menu-group-trigger aieditor__toolbar-overflow-trigger'
        this.trigger.title = label
        this.trigger.setAttribute('aria-label', label)
        this.trigger.setAttribute('aria-haspopup', 'menu')
        this.trigger.setAttribute('aria-expanded', 'false')
        this.trigger.setAttribute('aria-controls', panelId)
        icon.classList.add('aieditor__toolbar-menu-group-icon')
        triggerLabel.className = 'aieditor__toolbar-menu-group-trigger-label'
        triggerLabel.textContent = label
        chevron.classList.add('aieditor__menu-chevron')
        this.trigger.append(icon, triggerLabel, chevron)
        this.group.append(this.trigger)

        // 保留 toolbar 类以继承当前 style/size 变量，表面则使用工具组面板。
        this.panel.id = panelId
        this.panel.className = 'aieditor__toolbar aieditor__toolbar-menu-group-panel aieditor__toolbar-overflow-panel'
        this.panel.setAttribute('role', 'menu')
        this.panel.setAttribute('aria-label', label)
        this.panel.dataset.toolbarSubmenuPlacement = 'left-start'
        this.panel.hidden = true
        applyEditorTheme(this.panel, editor)
        document.body.append(this.panel)

        this.trigger.addEventListener('mousedown', (event) => event.preventDefault(), {signal: this.events.signal})
        this.trigger.addEventListener('click', (event) => {
            event.stopPropagation()
            this.panel.hidden ? this.open() : this.close()
        }, {signal: this.events.signal})
        this.panel.addEventListener('click', (event) => this.handlePanelClick(event), {signal: this.events.signal})
        this.panel.addEventListener('keydown', (event) => this.handlePanelKeydown(event), {signal: this.events.signal})
        // 捕获阶段先判断 Portal 归属，避免子菜单尚未处理点击时外层“更多”提前关闭。
        document.documentElement.addEventListener('click', (event) => {
            const target = event.target as Node | null
            if (!target || this.group.contains(target) || this.panel.contains(target)) return
            if (toolbarMenuGroupPortalContains(panelId, target)) return
            this.close()
        }, {capture: true, signal: this.events.signal})
        document.documentElement.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape' || this.panel.hidden) return
            if (this.panel.querySelector('[aria-haspopup][aria-expanded="true"]')) return
            if (hasOpenToolbarMenuGroupPortal(panelId, document)) return
            event.preventDefault()
            event.stopImmediatePropagation()
            this.close()
            this.trigger.focus()
        }, {signal: this.events.signal})
        this.observer = new ResizeObserver(([entry]) => {
            const width = entry?.contentRect.width ?? container.clientWidth
            if (Math.abs(width - this.observedWidth) < 0.5) return
            this.observedWidth = width
            this.schedule()
        })
        this.observer.observe(container)
    }

    /** 在外部重排前把项目放回工具栏，保证 MenuBar 始终可以找到全部已挂载元素。 */
    restore(): void {
        this.close()
        this.container.querySelectorAll<HTMLElement>('[data-toolbar-overflow-edge]').forEach((element) => {
            delete element.dataset.toolbarOverflowEdge
        })
        this.restoreRibbonItems()
        const items = [...this.panel.children].filter((element): element is HTMLElement => element instanceof HTMLElement)
        items.forEach((element) => {
            setToolbarMenuGroupPortalOwner(element, this.panel.id, false)
            this.restoreItem(element)
        })
        this.group.remove()
        if (items.length) this.container.append(...items)
    }

    /** 根据当前容器宽度重新选择需要移入“更多”的尾部项目。 */
    refresh(): void {
        this.restore()
        this.panel.dataset.toolbarStyle = this.container.dataset.toolbarStyle ?? 'compact'
        this.panel.dataset.toolbarSize = this.container.dataset.toolbarSize ?? 'default'

        // 工具栏本身尚未溢出时不预留“更多”的宽度，避免过早折叠。
        if (this.container.scrollWidth <= this.container.clientWidth) return

        this.group.hidden = false
        this.container.append(this.group)

        if (this.panel.dataset.toolbarStyle === 'ribbon') {
            this.refreshRibbon()
            return
        }

        const candidates = [...this.container.children]
            .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== this.group)
        // 从尾部逐项折叠，尽可能保留用户最先配置的常用工具。
        for (let index = candidates.length - 1; index >= 0 && this.container.scrollWidth > this.container.clientWidth; index -= 1) {
            const element = candidates[index]
            this.panel.prepend(element)
            this.decorateItem(element)
            setToolbarMenuGroupPortalOwner(element, this.panel.id, true)
        }
        const hasItems = this.panel.childElementCount > 0
        this.group.hidden = !hasItems
        if (!hasItems) this.group.remove()
    }

    /** Ribbon 每两项形成一列，按末列逐步折叠以充分利用剩余宽度。 */
    /** 功能区按两行一列折叠，避免只移动半列造成视觉断裂。 */
    private refreshRibbon(): void {
        const groups = [...this.container.children].filter((element): element is HTMLElement => (
            element instanceof HTMLElement && element.classList.contains('aieditor__toolbar-group')
        ))
        while (this.container.scrollWidth > this.container.clientWidth) {
            const sourceGroup = [...groups].reverse().find((element) => (
                Boolean(element.querySelector(':scope > .aieditor__toolbar-group-body')?.childElementCount)
            ))
            if (!sourceGroup) break
            const sourceBody = sourceGroup.querySelector<HTMLElement>(':scope > .aieditor__toolbar-group-body')
            if (!sourceBody) break
            const children = [...sourceBody.children].filter((element): element is HTMLElement => element instanceof HTMLElement)
            const columnSize = children.length % 2 || 2
            const column = children.slice(-columnSize)
            const overflowGroup = this.getRibbonOverflowGroup(sourceGroup)

            column.forEach((element) => {
                this.ribbonItems.push({
                    element,
                    sourceBody,
                    sourceGroup,
                    sourceIndex: children.indexOf(element),
                })
                setToolbarMenuGroupPortalOwner(element, this.panel.id, true)
            })
            overflowGroup.body.prepend(...column)
            if (!sourceBody.childElementCount) {
                sourceGroup.dataset.toolbarOverflowEmpty = ''
                sourceGroup.setAttribute('aria-hidden', 'true')
            }
        }

        if (!this.ribbonItems.length) {
            this.group.remove()
            return
        }
        const edgeGroup = [...groups].reverse().find((element) => (
            Boolean(element.querySelector(':scope > .aieditor__toolbar-group-body')?.childElementCount)
        ))
        if (edgeGroup) edgeGroup.dataset.toolbarOverflowEdge = ''
    }

    /** 在更多面板中复刻无标题功能区分组，并缓存源组到副本的映射。 */
    private getRibbonOverflowGroup(sourceGroup: HTMLElement): RibbonOverflowGroup {
        const existing = this.ribbonOverflowGroups.get(sourceGroup)
        if (existing) return existing

        const document = this.container.ownerDocument
        const element = document.createElement('div')
        const body = document.createElement('div')
        element.className = 'aieditor__toolbar-group'
        element.dataset.toolbarGroup = sourceGroup.dataset.toolbarGroup ?? ''
        element.setAttribute('role', 'group')
        element.setAttribute('aria-label', sourceGroup.getAttribute('aria-label') ?? '')
        body.className = 'aieditor__toolbar-group-body'
        element.append(body)
        this.panel.prepend(element)

        const overflowGroup = {element, body}
        this.ribbonOverflowGroups.set(sourceGroup, overflowGroup)
        return overflowGroup
    }

    /** 按原索引把功能区项目放回各自分组。 */
    private restoreRibbonItems(): void {
        if (!this.ribbonItems.length) return
        const sourceGroups = new Set(this.ribbonItems.map(({sourceGroup}) => sourceGroup))
        sourceGroups.forEach((sourceGroup) => {
            const items = this.ribbonItems
                .filter((item) => item.sourceGroup === sourceGroup)
                .sort((left, right) => left.sourceIndex - right.sourceIndex)
            items.forEach(({element, sourceBody}) => {
                setToolbarMenuGroupPortalOwner(element, this.panel.id, false)
                sourceBody.append(element)
            })
            delete sourceGroup.dataset.toolbarOverflowEmpty
            sourceGroup.removeAttribute('aria-hidden')
        })
        this.ribbonOverflowGroups.forEach(({element}) => element.remove())
        this.ribbonOverflowGroups.clear()
        this.ribbonItems.length = 0
    }

    /** 将连续 ResizeObserver 通知合并到下一动画帧。 */
    schedule(): void {
        if (this.frame !== undefined) cancelAnimationFrame(this.frame)
        this.frame = requestAnimationFrame(() => {
            this.frame = undefined
            if (this.container.dataset.toolbarOverflow === 'menu') this.refresh()
        })
    }

    /** 恢复工具栏原始 DOM、停止观察并移除 Portal。 */
    destroy(): void {
        if (this.frame !== undefined) cancelAnimationFrame(this.frame)
        this.restore()
        this.observer.disconnect()
        this.events.abort()
        this.stopAutoUpdate?.()
        this.panel.remove()
    }

    /** 将普通工具按钮临时装饰成带文字的菜单命令，并记录可逆快照。 */
    private decorateItem(element: HTMLElement): void {
        if (this.panel.dataset.toolbarStyle === 'ribbon' || this.decorations.has(element)) return
        const command = element.matches('button')
            ? element as HTMLButtonElement
            : element.querySelector<HTMLButtonElement>('button')
        if (!command) return
        const decoration: OverflowItemDecoration = {
            command,
            commandHadGroupClass: command.classList.contains('aieditor__toolbar-menu-group-command'),
            elementGroupItem: element.dataset.toolbarMenuGroupItem,
            label: undefined,
            role: command.getAttribute('role'),
            title: command.getAttribute('title'),
        }
        element.dataset.toolbarMenuGroupItem = ''
        command.classList.add('aieditor__toolbar-menu-group-command')
        command.setAttribute('role', 'menuitem')
        command.removeAttribute('title')
        if (!command.querySelector('.aieditor__toolbar-menu-group-trigger-label')) {
            const label = this.container.ownerDocument.createElement('span')
            label.className = 'aieditor__toolbar-menu-group-command-label aieditor__toolbar-overflow-command-label'
            label.textContent = command.getAttribute('aria-label') ?? decoration.title ?? element.dataset.menuItem ?? ''
            const chevron = command.querySelector('.aieditor__menu-chevron')
            if (chevron) chevron.before(label)
            else command.append(label)
            decoration.label = label
        }
        this.decorations.set(element, decoration)
    }

    /** 移除更多菜单装饰，恢复按钮原始 role、title 和类名。 */
    private restoreItem(element: HTMLElement): void {
        const decoration = this.decorations.get(element)
        if (!decoration) return
        decoration.label?.remove()
        if (!decoration.commandHadGroupClass) decoration.command.classList.remove('aieditor__toolbar-menu-group-command')
        if (decoration.role === null) decoration.command.removeAttribute('role')
        else decoration.command.setAttribute('role', decoration.role)
        if (decoration.title === null) decoration.command.removeAttribute('title')
        else decoration.command.setAttribute('title', decoration.title)
        if (decoration.elementGroupItem === undefined) delete element.dataset.toolbarMenuGroupItem
        else element.dataset.toolbarMenuGroupItem = decoration.elementGroupItem
        this.decorations.delete(element)
    }

    /** 普通命令执行后关闭；拥有子弹层的命令保留层级上下文。 */
    private handlePanelClick(event: MouseEvent): void {
        if (!(event.target instanceof Element)) return
        const command = event.target.closest<HTMLButtonElement>('button')
        if (!command || !this.panel.contains(command)) return
        const popup = command.getAttribute('aria-haspopup')
        if (!popup) this.close()
    }

    /** 打开更多面板并开始跟随工具栏尾部按钮。 */
    private open(): void {
        if (!this.panel.childElementCount) return
        this.panel.hidden = false
        this.trigger.setAttribute('aria-expanded', 'true')
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = autoUpdate(this.trigger, this.panel, () => void this.updatePosition())
        void this.updatePosition()
    }

    /** 关闭更多面板并停止自动定位。 */
    private close(): void {
        this.stopAutoUpdate?.()
        this.stopAutoUpdate = undefined
        this.panel.hidden = true
        this.trigger.setAttribute('aria-expanded', 'false')
    }

    /** 经典/标准模式锚定按钮，功能区模式锚定整条工具栏。 */
    private async updatePosition(): Promise<void> {
        if (this.panel.hidden) return
        const anchor = this.panel.dataset.toolbarStyle === 'ribbon' ? this.container : this.trigger
        const {x, y} = await computePosition(anchor, this.panel, {
            placement: 'bottom-end',
            strategy: 'fixed',
            middleware: [offset(6), flip(), shift({padding: 8})],
        })
        if (!this.panel.hidden) Object.assign(this.panel.style, {left: `${x}px`, top: `${y}px`})
    }

    /** 在更多菜单命令之间处理上下方向键和首尾跳转。 */
    private handlePanelKeydown(event: KeyboardEvent): void {
        const commands = [...this.panel.querySelectorAll<HTMLButtonElement>('.aieditor__toolbar-menu-group-command:not(:disabled)')]
        if (!commands.length) return
        const index = commands.indexOf(document.activeElement as HTMLButtonElement)
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
}
