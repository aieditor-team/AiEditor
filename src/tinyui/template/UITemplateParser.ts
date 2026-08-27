import type {UIContext, UIElement} from '../core/UIContext'
import type {UIBinding} from '../core/UIBinding'
import type {UIRuntime} from '../core/UIRuntime'
import {UITextBinding} from '../binding/UITextBinding'
import {UIAttributeBinding} from '../binding/UIAttributeBinding'
import {UIPropertyBinding} from '../binding/UIPropertyBinding'
import {UIEventBinding, parseUIEvent} from '../binding/UIEventBinding'
import {UIEachBinding, UIIfBinding, parseEachExpression} from '../binding/UIStructuralBindings'
import {UIComponentBinding} from '../component/UIComponentBinding'
import type {TinyUIComponent} from '../component/UIComponent'
import type {UITemplate} from './UITemplate'

/**
 * 遍历 UITemplate DOM，并把声明式语法转换为具体 UIBinding。
 *
 * 解析优先级固定为 each -> if -> component -> 普通属性/子节点。结构指令会接管
 * 整个元素，因此识别后必须立即返回，避免同一节点被重复编译。
 */
export class UITemplateParser<State extends UIContext> {
    /** 编译模板根节点，返回当前根 Runtime 直接持有的 Binding。 */
    parse(template: UITemplate, runtime: UIRuntime<State>): readonly UIBinding[] {
        this.compileElement(template.root, runtime)
        return runtime.bindings
    }

    /** 根据 Node 类型分派文本插值或元素编译；注释等其他节点保持原样。 */
    private compileNode(node: Node, runtime: UIRuntime<State>): void {
        if (node.nodeType === Node.TEXT_NODE) {
            const interpolation = runtime.resolver.compileInterpolation((node as Text).data)
            if (interpolation) runtime.add(new UITextBinding(node as Text, interpolation, runtime))
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            this.compileElement(node as HTMLElement, runtime)
        }
    }

    /** 识别结构指令、组件或普通元素，并递归编译子节点。 */
    private compileElement(element: HTMLElement, runtime: UIRuntime<State>): void {
        const each = element.getAttribute('each')
        if (each !== null) {
            runtime.add(new UIEachBinding(
                element,
                parseEachExpression(each, runtime),
                runtime,
                (child, childRuntime) => this.compileElement(child, childRuntime),
            ))
            return
        }
        const condition = element.getAttribute('if')
        if (condition !== null) {
            runtime.add(new UIIfBinding(
                element,
                runtime.resolver.assertExpression(condition),
                runtime,
                (child, childRuntime) => this.compileElement(child, childRuntime),
            ))
            return
        }
        const component = this.findComponent(element, runtime)
        if (component) {
            runtime.add(new UIComponentBinding(element, component, runtime))
            return
        }
        this.compileAttributes(element, runtime)
        Array.from(element.childNodes).forEach((child) => this.compileNode(child, runtime))
    }

    /** 把 #ref、@event、:property、hidden 和普通属性插值转换为 Binding。 */
    private compileAttributes(element: HTMLElement, runtime: UIRuntime<State>): void {
        for (const attribute of Array.from(element.attributes)) {
            if (attribute.name.startsWith('#')) {
                this.registerRef(element, attribute.name.slice(1), runtime)
                element.removeAttribute(attribute.name)
            } else if (attribute.name.startsWith('@')) {
                runtime.add(new UIEventBinding(element, parseUIEvent(attribute, runtime), runtime))
                element.removeAttribute(attribute.name)
            } else if (attribute.name.startsWith(':')) {
                const expression = runtime.resolver.assertExpression(attribute.value)
                runtime.add(new UIPropertyBinding(element, attribute.name.slice(1), expression, runtime))
                element.removeAttribute(attribute.name)
            } else if (attribute.name === 'hidden' && attribute.value) {
                const expression = runtime.resolver.assertExpression(attribute.value)
                runtime.add(new UIPropertyBinding(element, 'hidden', expression, runtime, Boolean))
            } else {
                const interpolation = runtime.resolver.compileInterpolation(attribute.value)
                if (interpolation) {
                    runtime.add(new UIAttributeBinding(element, attribute.name, interpolation, runtime))
                }
            }
        }
    }

    /** 注册普通元素 Ref，并把条件/列表销毁时的清理动作挂到所属 Runtime。 */
    private registerRef(element: UIElement, name: string, runtime: UIRuntime<State>): void {
        if (!name) throw new Error('TinyUI ref names cannot be empty.')
        runtime.cleanups.push(runtime.refRegistry.register(name, element))
    }

    /** 按 HTML 标签名不区分大小写地查找已注册组件。 */
    private findComponent(element: HTMLElement, runtime: UIRuntime<State>): TinyUIComponent<State> | undefined {
        return runtime.components.get(element.localName.toLowerCase())
    }
}
