import {UIBinding} from '../core/UIBinding'
import type {UIRuntime} from '../core/UIRuntime'
import type {UIContext} from '../core/UIContext'
import type {UIExpression} from '../resolver/UIResolver'

const PROPERTY_NAMES = new WeakMap<object, Map<string, string>>()

/**
 * 把 `:property="expression"` 同步到 DOM Property，而不是同名 Attribute。
 *
 * HTML 解析会把属性名转成小写，例如 :readOnly 会变成 :readonly。构造时会沿
 * 元素原型链查找真实的 camelCase 属性名；找不到时保留原名，支持宿主自定义属性。
 */
export class UIPropertyBinding<State extends UIContext = UIContext> extends UIBinding {
    readonly dependencies: ReadonlySet<string>
    private readonly element: HTMLElement
    private readonly property: string
    private readonly expression: UIExpression
    private readonly runtime: UIRuntime<State>
    private readonly coerce: ((value: unknown) => unknown) | undefined
    private current: unknown = Symbol('uninitialized')

    constructor(
        element: HTMLElement,
        property: string,
        expression: string,
        runtime: UIRuntime<State>,
        coerce?: (value: unknown) => unknown,
    ) {
        super()
        this.element = element
        this.property = this.resolvePropertyName(element, property)
        this.expression = runtime.resolver.compileExpression(expression)
        this.runtime = runtime
        this.coerce = coerce
        this.dependencies = this.expression.dependencies
    }

    /** 解析并可选转换值，结果未变化时跳过 DOM Property 写入。 */
    update(): void {
        const resolved = this.expression.evaluate(this.runtime)
        const value = this.coerce ? this.coerce(resolved) : resolved
        if (Object.is(this.current, value)) return
        ;(this.element as unknown as Record<string, unknown>)[this.property] = value
        // setter 可能由宿主自定义并抛错；只有写入成功后才能提交缓存，保证相同值可重试。
        this.current = value
    }

    /** 在实例及其原型链上匹配 Property 名称，并按元素原型缓存结果。 */
    private resolvePropertyName(element: HTMLElement, requested: string): string {
        if (requested in element) return requested
        const normalized = requested.toLowerCase()

        const ownMatch = Object.getOwnPropertyNames(element)
            .find((name) => name.toLowerCase() === normalized)
        if (ownMatch) return ownMatch

        const prototype = Object.getPrototypeOf(element) as object | null
        if (!prototype) return requested
        let names = PROPERTY_NAMES.get(prototype)
        if (!names) {
            names = new Map()
            PROPERTY_NAMES.set(prototype, names)
        }
        const cached = names.get(normalized)
        if (cached) return cached

        let target: object | null = prototype
        while (target) {
            const match = Object.getOwnPropertyNames(target)
                .find((name) => name.toLowerCase() === normalized)
            if (match) {
                names.set(normalized, match)
                return match
            }
            target = Object.getPrototypeOf(target) as object | null
        }
        names.set(normalized, requested)
        return requested
    }
}
