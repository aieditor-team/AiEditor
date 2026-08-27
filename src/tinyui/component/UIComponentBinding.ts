import {UIBinding} from '../core/UIBinding'
import type {UIContext, UIElement} from '../core/UIContext'
import type {UIRuntime} from '../core/UIRuntime'
import {UIEventBinding, parseUIEvent, type UIEventDescriptor} from '../binding/UIEventBinding'
import {renderComponent, type TinyUIComponent} from './UIComponent'
import type {UIView} from '../core/UIView'
import type {UIExpression} from '../resolver/UIResolver'

/**
 * 自定义组件占位标签对应的 Binding。
 *
 * 组件更新先计算 Props、调用 render 并校验结果，全部成功后才移除旧输出，因此
 * render 或结果校验失败不会破坏当前 DOM。Ref 与声明在组件标签上的事件都绑定
 * 到返回结果中的第一个 Element，既支持 HTMLElement，也支持 SVGElement。
 */
export class UIComponentBinding<State extends UIContext> extends UIBinding {
    readonly dependencies = new Set<string>()
    private readonly anchor: Comment
    private readonly childTemplate: DocumentFragment
    private readonly propFactories: Array<[string, () => unknown]> = []
    private readonly stateExpressions: UIExpression[] = []
    private readonly events: UIEventDescriptor[] = []
    private readonly refName: string | undefined
    private readonly element: HTMLElement
    private readonly component: TinyUIComponent<State>
    private readonly runtime: UIRuntime<State>
    private rendered: Node[] = []
    private renderedView: UIView | undefined
    private eventBindings: UIEventBinding<State>[] = []
    private refCleanup: (() => void) | undefined
    private signature: unknown[] | undefined

    constructor(
        element: HTMLElement,
        component: TinyUIComponent<State>,
        runtime: UIRuntime<State>,
    ) {
        super()
        this.element = element
        this.component = component
        this.runtime = runtime
        this.anchor = element.ownerDocument.createComment(`component:${element.localName}`)
        // 保存未经 TinyUI 编译的原始子节点；每次 render 都会得到一份独立克隆。
        this.childTemplate = element.ownerDocument.createDocumentFragment()
        Array.from(element.childNodes).forEach((child) => this.childTemplate.append(child.cloneNode(true)))

        for (const dependency of component.dependencies ?? []) {
            const expression = runtime.resolver.compileExpression(dependency)
            if (expression.dependencies.size === 0) {
                throw new Error(`TinyUI component dependencies must be property paths: "${dependency}".`)
            }
            expression.dependencies.forEach((name) => this.dependencies.add(name))
            this.stateExpressions.push(expression)
        }

        let refName: string | undefined
        for (const attribute of Array.from(element.attributes)) {
            if (attribute.name.startsWith('#')) {
                refName = attribute.name.slice(1)
            } else if (attribute.name.startsWith('@')) {
                this.events.push(parseUIEvent(attribute, runtime))
            } else if (attribute.name.startsWith(':')) {
                const expression = runtime.resolver.compileExpression(attribute.value)
                expression.dependencies.forEach((dependency) => this.dependencies.add(dependency))
                this.propFactories.push([attribute.name.slice(1), () => expression.evaluate(runtime)])
            } else {
                const interpolation = runtime.resolver.compileInterpolation(attribute.value)
                if (interpolation) {
                    interpolation.dependencies.forEach((dependency) => this.dependencies.add(dependency))
                    this.propFactories.push([attribute.name, () => interpolation.evaluate(runtime)])
                } else {
                    this.propFactories.push([attribute.name, () => attribute.value])
                }
            }
        }
        this.refName = refName
        element.parentNode?.replaceChild(this.anchor, element)
    }

    /** 根据 Props 的 Object.is 签名决定是否重新渲染，并事务性替换组件输出。 */
    update(): void {
        // 热路径避免 Object.fromEntries、map 和 Object.values 产生多组短命数组。
        const props: Record<string, unknown> = {}
        const nextSignature: unknown[] = []
        for (const [name, factory] of this.propFactories) {
            const value = factory()
            props[name] = value
            nextSignature.push(value)
        }
        for (const expression of this.stateExpressions) {
            nextSignature.push(expression.evaluate(this.runtime))
        }
        if (this.dependencies.size > 0 && this.signature && this.signature.length === nextSignature.length
            && this.signature.every((value, index) => Object.is(value, nextSignature[index]))) return
        const result = renderComponent(this.component, props, {
            children: this.childTemplate.cloneNode(true) as DocumentFragment,
            document: this.element.ownerDocument,
            state: this.runtime.context,
        })

        let nextRendered: Node[] = []
        let nextView: UIView | undefined
        let insertion: Node | undefined
        if (result === null || result === undefined) {
            // 空结果表示组件有意清除上一次输出。
        } else if (typeof result === 'string' || typeof result === 'number') {
            nextRendered = [this.element.ownerDocument.createTextNode(String(result))]
        } else if (this.isView(result)) {
            nextView = result
            nextRendered = [result.root]
        } else if (this.isNode(result) && result.nodeType === 11) {
            nextRendered = Array.from(result.childNodes)
            insertion = result
        } else if (this.isNode(result)) {
            nextRendered = [result]
        } else {
            throw new TypeError(`TinyUI component <${this.element.localName}> returned an invalid render result.`)
        }
        const rootElement = nextRendered.find((node): node is UIElement => node.nodeType === 1)
        if (this.events.length > 0 && !rootElement) {
            nextView?.destroy()
            throw new Error(`TinyUI component <${this.element.localName}> must render an element to receive events.`)
        }

        const sameOutput = nextView === this.renderedView
            && nextRendered.length === this.rendered.length
            && nextRendered.every((node, index) => node === this.rendered[index])
        if (sameOutput) {
            // 组件可以自行更新并复用同一个 Node/UIView；保留事件、Ref 和挂载状态。
            this.signature = nextSignature
            return
        }

        insertion ??= nextRendered[0]
        let nextRefCleanup: (() => void) | undefined
        const nextEventBindings: UIEventBinding<State>[] = []
        try {
            if (this.refName && rootElement) {
                nextRefCleanup = this.runtime.refRegistry.register(this.refName, rootElement)
            }
            if (rootElement) {
                this.events.forEach((event) => {
                    nextEventBindings.push(new UIEventBinding(rootElement, event, this.runtime))
                })
            }
            if (insertion) {
                const parent = this.anchor.parentNode
                if (!parent) throw new Error(`TinyUI component <${this.element.localName}> anchor is detached.`)
                // 候选结果先插在旧输出前；只有插入成功后才清理旧输出。
                parent.insertBefore(insertion, this.rendered[0] ?? this.anchor.nextSibling)
            }
        } catch (error) {
            nextEventBindings.forEach((binding) => binding.destroy())
            nextRefCleanup?.()
            nextView?.destroy()
            throw error
        }

        this.removeRendered()
        this.signature = nextSignature
        this.rendered = nextRendered
        this.renderedView = nextView
        this.refCleanup = nextRefCleanup
        this.eventBindings = nextEventBindings
    }

    /** 清理组件事件、Ref、嵌套 UIView、返回节点及内部锚点。 */
    destroy(): void {
        this.removeRendered()
        this.anchor.remove()
    }

    /** 只移除当前组件拥有的输出，不影响锚点后的兄弟节点。 */
    private removeRendered(): void {
        this.eventBindings.splice(0).forEach((binding) => binding.destroy())
        this.refCleanup?.()
        this.refCleanup = undefined
        this.renderedView?.destroy()
        if (!this.renderedView) {
            this.rendered.forEach((node) => node.parentNode?.removeChild(node))
        }
        this.rendered = []
        this.renderedView = undefined
    }

    /** 跨 iframe 的 Node 不一定共享 instanceof 链，因此使用稳定的 DOM 结构特征判断。 */
    private isNode(value: unknown): value is Node {
        return typeof value === 'object' && value !== null
            && typeof (value as Node).nodeType === 'number'
            && typeof (value as Node).cloneNode === 'function'
    }

    /** UIView 保持结构判断以兼容包的多份实例，同时严格校验其 root。 */
    private isView(value: unknown): value is UIView {
        if (typeof value !== 'object' || value === null) return false
        const candidate = value as Partial<UIView>
        return this.isNode(candidate.root)
            && typeof candidate.update === 'function'
            && typeof candidate.destroy === 'function'
    }
}
