import type {UIContext} from '../core/UIContext'
import type {UIView} from '../core/UIView'

/** 每次组件 render 调用可使用的宿主环境。 */
export interface UIComponentContext<State extends UIContext = UIContext> {
    /** 组件标签子节点的全新克隆；组件可以读取、移动或丢弃，不影响后续渲染。 */
    readonly children: DocumentFragment
    /** 创建当前 TinyUI 视图的 Document，应优先用它创建组件 DOM。 */
    readonly document: Document
    /** 父视图原始状态对象的只读引用；更新仍应由父 UIView 发起。 */
    readonly state: State
}

/**
 * 组件允许返回的渲染结果。
 * Node 包含 Element、Text 和 DocumentFragment；UIView 会在父组件销毁时一并销毁。
 */
export type UIComponentResult = Node | UIView | string | number | null | undefined

/** 使用对象和 render 方法声明的 TinyUI 组件。 */
export interface UIComponent<State extends UIContext = UIContext> {
    /** render 直接读取 context.state 时必须声明对应属性路径。 */
    readonly dependencies?: readonly string[]
    render(props: Record<string, unknown>, context: UIComponentContext<State>): UIComponentResult
}

/** 使用普通函数声明的 TinyUI 组件。 */
export interface UIComponentFunction<State extends UIContext = UIContext> {
    (
        props: Record<string, unknown>,
        context: UIComponentContext<State>,
    ): UIComponentResult

    /** render 直接读取 context.state 时必须声明对应属性路径。 */
    readonly dependencies?: readonly string[]
}

/** TinyUI 组件既可以是渲染函数，也可以是带 render 方法的对象。 */
export type TinyUIComponent<State extends UIContext = UIContext> =
    | UIComponent<State>
    | UIComponentFunction<State>

/** 统一调用函数组件和对象组件。 */
export function renderComponent<State extends UIContext>(
    component: TinyUIComponent<State>,
    props: Record<string, unknown>,
    context: UIComponentContext<State>,
): UIComponentResult {
    return typeof component === 'function'
        ? component(props, context)
        : component.render(props, context)
}
