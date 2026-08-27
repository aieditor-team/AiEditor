import type {UIContext} from '../core/UIContext'
import {LucideIcon} from './LucideIcon'
import type {TinyUIComponent} from './UIComponent'

/**
 * 所有 TinyUI 视图自动可用的内置组件。
 *
 * 注册表保持冻结，避免某个编辑器实例修改全局行为。调用方仍可通过 context.components
 * 或 html() 的显式 options 在单个视图内覆盖同名组件。
 */
export const TINYUI_DEFAULT_COMPONENTS: Readonly<Record<string, TinyUIComponent<UIContext>>> = Object.freeze({
    LucideIcon,
})
