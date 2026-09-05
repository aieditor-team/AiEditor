import type {AiEditorProductContext, AiEditorProductSurface} from '../../editor/AiEditorProduct'

/** Sidebar 条目挂载内容后返回的清理函数。 */
export type SidebarItemCleanup = () => void

/** Sidebar 承载的一个能力项；所有布局和交互 DOM 均由 Surface 统一管理。 */
export interface SidebarItem {
    /** 条目的稳定唯一标识，同时用于生成 DOM data 属性。 */
    readonly id: string
    /** 条目按钮的显示名称，也用于无障碍标签和国际化查找。 */
    readonly label: string

    /** 返回要渲染到 rail 按钮中的图标节点。 */
    renderIcon(context: AiEditorProductContext): Node

    /** 渲染到 SidebarSurface 创建的稳定内容容器中。 */
    mountContent(context: AiEditorProductContext, host: HTMLElement): void | SidebarItemCleanup

    /** 编辑器上下文变化时刷新条目内容。 */
    updateContent?(context: AiEditorProductContext, host: HTMLElement): void

    /** 条目从未激活变为激活时调用。 */
    onActivate?(context: AiEditorProductContext, host: HTMLElement): void

    /** 条目从激活变为未激活时调用。 */
    onDeactivate?(context: AiEditorProductContext, host: HTMLElement): void

    /** 释放条目自行创建的资源。 */
    destroy(): void
}

export interface SidebarOptions {
    items?: readonly SidebarItem[]
    /** 初始显示的能力项；false 表示初始折叠内容区域。 */
    defaultItem?: string | false
    /** 展开状态下 Sidebar 的宽度，包含 rail；默认为 380px。 */
    width?: number | string
}

interface MountedSidebarItem {
    /** 已注册的 Sidebar 条目。 */
    item: SidebarItem
    /** 对应的 rail 按钮。 */
    rail: HTMLButtonElement
    /** 对应的内容容器。 */
    content: HTMLElement
    /** mountContent 返回的清理函数。 */
    cleanup?: SidebarItemCleanup
}

/** 用于生成 Sidebar 内容面板唯一 DOM ID 的全局序号。 */
let sidebarPanelSequence = 0

/** 通用的右侧能力容器，与 toolbar 菜单生命周期完全解耦。 */
export class SidebarSurface implements AiEditorProductSurface {
    /** 经过构造函数校验的条目配置。 */
    private readonly items: readonly SidebarItem[]
    /** 初始激活的条目；undefined 表示使用第一个条目。 */
    private readonly defaultItem: string | false | undefined
    /** 展开状态下 Sidebar 的 CSS 宽度值。 */
    private readonly expandedWidth: string
    /** 已完成挂载的条目及其 DOM 引用。 */
    private mountedItems: MountedSidebarItem[] = []
    /** Sidebar 宿主节点。 */
    private host: HTMLElement | undefined
    /** rail 按钮容器。 */
    private rail: HTMLElement | undefined
    /** 内容面板容器。 */
    private body: HTMLElement | undefined
    /** 编辑器模板根节点，用于同步折叠状态和宽度。 */
    private root: HTMLElement | undefined
    /** 当前挂载时使用的产品上下文。 */
    private context: AiEditorProductContext | undefined
    /** 当前激活条目的 ID；undefined 表示 Sidebar 已折叠。 */
    private activeItemId: string | undefined
    /** 统一管理 Sidebar 按钮监听器的取消控制器。 */
    private events = new AbortController()

    /** 创建 Sidebar，并校验条目 ID 和默认条目配置。 */
    constructor(options: SidebarOptions = {}) {
        this.items = options.items ?? []
        this.defaultItem = options.defaultItem
        this.expandedWidth = typeof options.width === 'number' ? `${options.width}px` : options.width ?? '380px'

        const ids = new Set<string>()
        for (const item of this.items) {
            if (!item.id.trim()) throw new Error('SidebarItem id cannot be empty')
            if (ids.has(item.id)) throw new Error(`Duplicate SidebarItem id: "${item.id}"`)
            ids.add(item.id)
        }
        if (typeof this.defaultItem === 'string' && !ids.has(this.defaultItem)) {
            throw new Error(`Unknown default SidebarItem: "${this.defaultItem}"`)
        }
    }

    /** 创建 Sidebar DOM、挂载所有条目，并应用初始激活状态。 */
    mount(context: AiEditorProductContext): void {
        if (this.host) throw new Error('SidebarSurface is already mounted')
        if (!this.items.length || !context.sidebar) return
        if (this.events.signal.aborted) this.events = new AbortController()

        const document = context.editor.view.dom.ownerDocument
        const rail = document.createElement('nav')
        const body = document.createElement('div')
        rail.className = 'aieditor__sidebar-rail'
        rail.setAttribute('aria-label', context.i18n.t('Sidebar tools'))
        body.className = 'aieditor__sidebar-body'

        this.host = context.sidebar
        this.root = context.root
        this.rail = rail
        this.body = body
        this.context = context
        this.host.classList.add('aieditor__sidebar')
        this.host.append(body, rail)
        context.sidebarRail = rail
        context.sidebarContent = body

        try {
            for (const item of this.items) {
                const itemRail = document.createElement('button')
                const itemContent = document.createElement('div')
                itemRail.type = 'button'
                itemRail.className = 'aieditor__sidebar-rail-button'
                itemRail.dataset.sidebarItem = item.id
                itemRail.title = context.i18n.t(item.label)
                itemRail.setAttribute('aria-label', context.i18n.t(item.label))
                itemRail.setAttribute('aria-pressed', 'false')
                itemRail.append(item.renderIcon(context))
                itemContent.className = 'aieditor__sidebar-item-content'
                itemContent.dataset.sidebarPanel = item.id
                itemContent.id = `aieditor-sidebar-panel-${++sidebarPanelSequence}`
                itemContent.setAttribute('role', 'region')
                itemContent.setAttribute('aria-label', context.i18n.t(item.label))
                itemRail.setAttribute('aria-controls', itemContent.id)
                const mounted: MountedSidebarItem = {item, rail: itemRail, content: itemContent}
                this.mountedItems.push(mounted)
                const cleanup = item.mountContent(context, itemContent)
                if (typeof cleanup === 'function') mounted.cleanup = cleanup
                this.listen(itemRail, 'click', () => this.toggle(item.id))
                rail.append(itemRail)
                body.append(itemContent)
            }
        } catch (error) {
            this.destroy()
            throw error
        }

        const initialItem = this.defaultItem === false ? undefined : this.defaultItem ?? this.items[0]?.id
        this.setActiveItem(initialItem)
    }

    /** 将最新编辑器上下文转发给已挂载条目。 */
    update(context: AiEditorProductContext): void {
        this.mountedItems.forEach(({item, content}) => item.updateContent?.(context, content))
    }

    /** 按条目、DOM 和上下文的依赖顺序释放 Sidebar 资源。 */
    destroy(): void {
        this.events.abort()
        this.mountedItems.forEach(({item, cleanup}) => {
            try {
                cleanup?.()
            } finally {
                item.destroy()
            }
        })
        this.mountedItems = []
        this.rail?.remove()
        this.body?.remove()
        this.host?.classList.remove('is-collapsed')

        if (this.root) {
            this.root.classList.remove('is-sidebar-collapsed')
            delete this.root.dataset.aieditorSidebarState
            this.root.style.removeProperty('--aieditor-sidebar-width')
        }
        if (this.context) {
            if (this.context.sidebarRail === this.rail) this.context.sidebarRail = undefined
            if (this.context.sidebarContent === this.body) this.context.sidebarContent = undefined
        }

        this.host = undefined
        this.rail = undefined
        this.body = undefined
        this.root = undefined
        this.context = undefined
        this.activeItemId = undefined
    }

    /** 切换条目；再次点击当前条目时折叠 Sidebar。 */
    private toggle(itemId: string): void {
        this.setActiveItem(this.activeItemId === itemId ? undefined : itemId)
    }

    /** 同步激活条目、ARIA 状态、面板可见性及整体折叠样式。 */
    private setActiveItem(itemId: string | undefined): void {
        this.activeItemId = itemId
        const collapsed = itemId === undefined
        for (const mounted of this.mountedItems) {
            const active = mounted.item.id === itemId
            const wasActive = mounted.rail.classList.contains('is-active')
            mounted.rail.classList.toggle('is-active', active)
            mounted.rail.setAttribute('aria-pressed', String(active))
            mounted.content.hidden = !active
            if (active && !wasActive) mounted.item.onActivate?.(this.context!, mounted.content)
            if (!active && wasActive) mounted.item.onDeactivate?.(this.context!, mounted.content)
        }
        this.host?.classList.toggle('is-collapsed', collapsed)
        this.root?.classList.toggle('is-sidebar-collapsed', collapsed)
        if (this.root) {
            this.root.dataset.aieditorSidebarState = collapsed ? 'collapsed' : 'expanded'
            this.root.style.setProperty('--aieditor-sidebar-width', collapsed ? '42px' : this.expandedWidth)
        }
    }

    /** 使用统一的 AbortSignal 注册监听器，销毁时一次性取消。 */
    private listen<K extends keyof HTMLElementEventMap>(
        target: HTMLElement,
        type: K,
        listener: (event: HTMLElementEventMap[K]) => void,
    ): void {
        target.addEventListener(type, listener as EventListener, {signal: this.events.signal})
    }
}
