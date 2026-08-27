import type {Editor, Extensions} from '@tiptap/core'
import type {AiEditorI18n} from '../i18n'
import type {MenuItem} from '../menus/core'
import type {Uploader} from '../uploader'

/** 注入核心编辑器的产品 Tiptap 扩展集合。 */
export type AiEditorProductExtensions = Extensions

/** 产品气泡菜单 Surface 的生命周期契约。 */
export interface AiEditorProductBubbleMenu {
    readonly element: HTMLElement
    readonly extension: NonNullable<Extensions[number]>
    readonly label?: string
    mount(editor: Editor, i18n: AiEditorI18n): void
    update(): void
    destroy(): void
    getItems(): readonly MenuItem[]
}

/** 核心提供给产品界面的运行时上下文，避免 AiEditor 内出现产品分支。 */
export interface AiEditorProductContext {
    readonly editor: Editor
    readonly i18n: AiEditorI18n
    readonly root: HTMLElement
    readonly content: HTMLElement
    readonly sidebar?: HTMLElement
    /** Stable rail slot for product capability buttons, when the default sidebar is enabled. */
    sidebarRail?: HTMLElement
    /** Stable main slot for product panels, when the default sidebar is enabled. */
    sidebarContent?: HTMLElement
    readonly uploader: Uploader | undefined
}

/** 工具栏和气泡菜单之外的产品界面 Surface 生命周期契约。 */
export interface AiEditorProductSurface {
    mount(context: AiEditorProductContext): void
    update(context: AiEditorProductContext): void
    destroy(): void
}
