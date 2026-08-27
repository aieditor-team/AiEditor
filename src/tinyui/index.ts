/**
 * TinyUI 的公共导出边界。
 * 外部调用方应从 `aieditor` 包入口导入；这里集中导出门面 API、扩展点和可测试内核。
 */
export {TinyUI, html} from './core/TinyUI'
export {UIView, type TinyUIView} from './core/UIView'
export type {UIContext, UIContext as TinyUIState, UIElement, TinyUIOptions} from './core/UIContext'
export {UIBinding} from './core/UIBinding'
export {UIUpdateQueue} from './core/UIUpdateQueue'
export {
    UIResolver,
    type UIExpression,
    type UIInterpolation,
    type UIResolutionScope,
} from './resolver/UIResolver'
export {UITemplate} from './template/UITemplate'
export {UITemplateParser} from './template/UITemplateParser'
export {UITextBinding} from './binding/UITextBinding'
export {UIAttributeBinding} from './binding/UIAttributeBinding'
export {UIPropertyBinding} from './binding/UIPropertyBinding'
export {UIEventBinding, type UIEventDescriptor} from './binding/UIEventBinding'
export type {
    UIComponent,
    UIComponentContext,
    UIComponentContext as TinyUIComponentContext,
    UIComponentFunction,
    UIComponentResult,
    UIComponentResult as TinyUIComponentResult,
    TinyUIComponent,
} from './component/UIComponent'
export {LucideIcon, type LucideIconNode} from './component/LucideIcon'
export {TINYUI_DEFAULT_COMPONENTS} from './component/UIDefaultComponents'
