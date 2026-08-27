import type {TinyUIComponent} from '../component/UIComponent'
import {TINYUI_DEFAULT_COMPONENTS} from '../component/UIDefaultComponents'

/** TinyUI 的数据与行为上下文；字段既可以是展示数据，也可以是事件处理函数。 */
export type UIContext = Record<string, unknown>

/** TinyUI 可安全保存为 Ref 或组件根节点的 DOM 元素类型。 */
export type UIElement = HTMLElement | SVGElement

/** 创建 TinyUI 视图时可选的运行环境和组件注册表。 */
export interface TinyUIOptions<State extends UIContext = UIContext> {
    /** 组件名不区分大小写；同名项会覆盖内置默认和 context.components 中的注册。 */
    components?: Record<string, TinyUIComponent<State>>
    /** 指定创建节点所使用的 Document，适用于 iframe、测试和独立文档。 */
    document?: Document
}

/**
 * 合并内置组件、上下文内联组件和显式 options。
 *
 * 优先级依次为内置默认、context.components、options.components。始终返回新对象，
 * 避免调用方修改共享默认表，也不修改调用方持有的注册表。
 */
export function resolveTinyUIOptions<State extends UIContext>(
    context: State,
    options: TinyUIOptions<State>,
): TinyUIOptions<State> {
    const embedded = context.components
    const embeddedComponents = embedded && typeof embedded === 'object'
        ? embedded as Record<string, TinyUIComponent<State>>
        : undefined
    return {
        ...options,
        components: {
            ...TINYUI_DEFAULT_COMPONENTS as Record<string, TinyUIComponent<State>>,
            ...embeddedComponents,
            ...options.components,
        },
    }
}
