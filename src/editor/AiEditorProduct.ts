import type {Editor, Extensions} from '@tiptap/core'
import type {AiEditorI18n} from '../i18n'
import type {MenuItem} from '../menus/core'
import type {Uploader} from '../uploader'

/** 注入核心编辑器的产品 Tiptap 扩展集合。 */
export type AiEditorProductExtensions = Extensions

/** 产品气泡菜单 Surface 的生命周期契约。 */
export interface AiEditorProductBubbleMenu {
    /** 气泡菜单挂载的根节点。 */
    readonly element: HTMLElement
    /** 驱动该气泡菜单的 Tiptap 扩展。 */
    readonly extension: NonNullable<Extensions[number]>
    /** 可选的菜单显示名称，用于宿主界面或无障碍标识。 */
    readonly label?: string
    /** 挂载菜单并绑定编辑器和国际化上下文。 */
    mount(editor: Editor, i18n: AiEditorI18n): void
    /** 根据当前编辑器状态刷新菜单。 */
    update(): void
    /** 释放菜单创建的 DOM、监听器和其他资源。 */
    destroy(): void
    /** 返回当前菜单要展示的操作项。 */
    getItems(): readonly MenuItem[]
}

/** 核心提供给产品界面的运行时上下文，避免 AiEditor 内出现产品分支。 */
export interface AiEditorProductContext {
    /** 当前 Tiptap 编辑器实例。 */
    readonly editor: Editor
    /** 当前编辑器使用的国际化实例。 */
    readonly i18n: AiEditorI18n
    /** 编辑器模板的根节点。 */
    readonly root: HTMLElement
    /** 编辑器正文内容节点。 */
    readonly content: HTMLElement
    /** 默认模板提供的 Sidebar 宿主节点。 */
    readonly sidebar?: HTMLElement
    /** 默认 Sidebar 启用时，承载产品能力按钮的稳定 rail 插槽。 */
    sidebarRail?: HTMLElement
    /** 默认 Sidebar 启用时，承载产品面板的稳定内容插槽。 */
    sidebarContent?: HTMLElement
    /** 当前编辑器配置的上传器；未配置时为 undefined。 */
    readonly uploader: Uploader | undefined
}

/** 工具栏和气泡菜单之外的产品界面 Surface 生命周期契约。 */
export interface AiEditorProductSurface {
    /** 创建并挂载产品界面。 */
    mount(context: AiEditorProductContext): void
    /** 编辑器状态变化时刷新产品界面。 */
    update(context: AiEditorProductContext): void
    /** 释放产品界面创建的全部资源。 */
    destroy(): void
}
