import type {Editor} from '@tiptap/core'
import type {AiEditorI18n} from '../../i18n'
import {MenuBar, MenuItem, SeparatorMenuItem, type MenuItemConfig} from '../../menus/core'
import {ToolbarOverflowMenu} from './ToolbarOverflowMenu'
import {resolveToolbarItems} from './resolve-toolbar-items'

export type ToolbarStyle = 'classic' | 'compact' | 'ribbon'
export type ToolbarSize = 'small' | 'default' | 'large'
export type ToolbarOverflow = 'wrap' | 'scroll' | 'menu'

export type ToolbarMenusConfig = readonly MenuItemConfig[]
    | ((defaults: MenuItem[]) => readonly MenuItemConfig[])

export interface ToolbarOptions {
    style?: ToolbarStyle
    size?: ToolbarSize
    /** 宽度不足时自动换行、保持单行滚动，或把行尾工具收入“更多”菜单。 */
    overflow?: ToolbarOverflow
    /** 工具栏菜单内容与顺序；"|" 在 Ribbon 中作为无标题分组边界。 */
    menus?: ToolbarMenusConfig
    /** 滚动编辑器内容时是否将工具栏吸附在浏览器顶部。 */
    sticky?: boolean
    /** sticky 模式距视口顶部的像素偏移，用于避让宿主页面的固定头部。 */
    stickyOffset?: number
}

/** 编辑器顶部工具栏 Surface，负责把 MenuBar 生命周期连接到 Tiptap。 */
export class ToolbarMenu {
    private readonly container: HTMLElement
    private items: MenuItem[]
    private style: ToolbarStyle
    private size: ToolbarSize
    private overflow: ToolbarOverflow
    private readonly availableItems: readonly MenuItem[]
    private sticky = false
    private stickyOffset = 0
    private menuBar: MenuBar | undefined
    private i18n: AiEditorI18n | undefined
    private overflowMenu: ToolbarOverflowMenu | undefined

    /** 保存容器和初始菜单配置，实际挂载延迟到 mount。 */
    constructor(
        container: HTMLElement,
        items: MenuItem[] = [],
        options: ToolbarOptions = {},
        availableItems: readonly MenuItem[] = items,
    ) {
        this.container = container
        this.items = items
        this.availableItems = [...availableItems]
        this.style = 'compact'
        this.size = 'default'
        this.overflow = 'wrap'
        this.setStyle(options.style ?? 'compact')
        this.setSize(options.size ?? 'default')
        this.setOverflow(options.overflow ?? 'wrap')
        this.setSticky(options.sticky ?? true, options.stickyOffset ?? 0)
    }

    /** 为指定编辑器创建 MenuBar。 */
    mount(editor: Editor, i18n: AiEditorI18n): void {
        if (this.menuBar) throw new Error('ToolbarMenu is already mounted')
        this.i18n = i18n
        this.menuBar = new MenuBar(
            this.container,
            {editor, i18n},
            this.items,
            () => this.applyLayout(),
        )
        this.overflowMenu = new ToolbarOverflowMenu(this.container, editor, i18n.t('More'))
        this.applyLayout()
    }

    /** 返回当前 MenuBar 项目；未挂载时返回初始配置。 */
    getItems(): readonly MenuItem[] {
        return [...this.items]
    }

    /** 使用与初始化 menus 相同的配置格式动态替换菜单。 */
    setItems(configs: readonly MenuItemConfig[]): void {
        if (!this.menuBar) throw new Error('ToolbarMenu must be mounted before setting items')
        const poolById = new Map(this.availableItems.map((item) => [item.id, item]))
        this.items.forEach((item) => poolById.set(item.id, item))
        const nextItems = resolveToolbarItems(configs, [...poolById.values()])
        this.overflowMenu?.restore()
        this.items = nextItems
        this.menuBar.setItems(nextItems)
        this.applyLayout()
    }

    /** 返回当前工具栏视觉风格。 */
    getStyle(): ToolbarStyle {
        return this.style
    }

    /** 在运行时切换工具栏风格，不会重建菜单项或丢失编辑器状态。 */
    setStyle(style: ToolbarStyle): void {
        if (!['classic', 'compact', 'ribbon'].includes(style)) {
            throw new Error(`Unsupported ToolbarStyle: "${String(style)}"`)
        }
        this.overflowMenu?.restore()
        this.style = style
        this.container.dataset.toolbarStyle = style
        this.applyLayout()
    }

    /** 返回当前工具栏控件尺寸。 */
    getSize(): ToolbarSize {
        return this.size
    }

    /** 在小、默认、大三档之间切换工具栏控件尺寸。 */
    setSize(size: ToolbarSize): void {
        if (!['small', 'default', 'large'].includes(size)) {
            throw new Error(`Unsupported ToolbarSize: "${String(size)}"`)
        }
        this.size = size
        this.container.dataset.toolbarSize = size
        this.overflowMenu?.schedule()
    }

    getOverflow(): ToolbarOverflow {
        return this.overflow
    }

    setOverflow(overflow: ToolbarOverflow): void {
        if (!['wrap', 'scroll', 'menu'].includes(overflow)) {
            throw new Error(`Unsupported ToolbarOverflow: "${String(overflow)}"`)
        }
        this.overflowMenu?.restore()
        this.overflow = overflow
        this.container.dataset.toolbarOverflow = overflow
        if (overflow === 'menu') this.overflowMenu?.schedule()
    }

    /** 返回工具栏是否在滚动时吸附于视口顶部。 */
    isSticky(): boolean {
        return this.sticky
    }

    /** 开启或关闭视口吸附，可同时更新用于避让宿主固定头部的顶部偏移。 */
    setSticky(sticky: boolean, offset = this.stickyOffset): void {
        if (!Number.isFinite(offset) || offset < 0) {
            throw new Error(`Toolbar sticky offset must be a non-negative finite number: "${String(offset)}"`)
        }
        this.sticky = sticky
        this.stickyOffset = offset
        this.container.dataset.toolbarSticky = String(sticky)
        this.container.style.setProperty('--aieditor-toolbar-sticky-offset', `${offset}px`)
        const root = this.container.closest<HTMLElement>('.aieditor')
        if (root) root.dataset.toolbarSticky = String(sticky)
    }

    /** 同步所有工具栏项目状态。 */
    update(): void {
        this.menuBar?.update()
    }

    /** 销毁 MenuBar 并释放菜单项资源。 */
    destroy(): void {
        this.overflowMenu?.destroy()
        this.overflowMenu = undefined
        this.menuBar?.destroy()
        this.menuBar = undefined
        this.i18n = undefined
    }

    /** 根据菜单项稳定 ID 组织 ribbon DOM；其他风格保持菜单原始顺序。 */
    private applyLayout(): void {
        if (!this.menuBar) return
        this.overflowMenu?.restore()

        const elements = new Map<string, HTMLElement>()
        this.container.querySelectorAll<HTMLElement>('[data-menu-item]').forEach((element) => {
            const id = element.dataset.menuItem
            if (id) elements.set(id, element)
        })
        const document = this.container.ownerDocument
        const fragment = document.createDocumentFragment()

        if (this.style !== 'ribbon') {
            this.menuBar.getItems().forEach((item) => {
                const element = elements.get(item.id)
                if (!element) return
                element.hidden = false
                element.removeAttribute('aria-hidden')
                fragment.append(element)
            })
            this.container.replaceChildren(fragment)
            if (this.overflow === 'menu') this.overflowMenu?.schedule()
            return
        }

        let groupItems: HTMLElement[] = []
        let groupIndex = 0
        const appendGroup = (): void => {
            if (!groupItems.length) return
            fragment.append(this.createGroup(groupIndex++, groupItems))
            groupItems = []
        }
        this.menuBar.getItems().forEach((item) => {
            const element = elements.get(item.id)
            if (!element) return
            if (item instanceof SeparatorMenuItem) {
                appendGroup()
                element.hidden = true
                element.setAttribute('aria-hidden', 'true')
                fragment.append(element)
                return
            }
            element.hidden = false
            element.removeAttribute('aria-hidden')
            groupItems.push(element)
        })
        appendGroup()
        this.container.replaceChildren(fragment)
        if (this.overflow === 'menu') this.overflowMenu?.schedule()
    }

    private createGroup(index: number, items: HTMLElement[]): HTMLElement {
        const document = this.container.ownerDocument
        const group = document.createElement('div')
        const body = document.createElement('div')
        group.className = 'aieditor__toolbar-group'
        group.dataset.toolbarGroup = `ribbon-group-${index}`
        group.setAttribute('role', 'group')
        group.setAttribute('aria-label', `${this.i18n?.t('Formatting tools') ?? 'Formatting tools'} ${index + 1}`)
        body.className = 'aieditor__toolbar-group-body'
        body.append(...items)
        group.append(body)
        return group
    }
}
