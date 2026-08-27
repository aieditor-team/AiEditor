import {UIBinding} from '../core/UIBinding'
import type {UIRuntime} from '../core/UIRuntime'
import type {UIContext} from '../core/UIContext'
import type {UIInterpolation} from '../resolver/UIResolver'

/** 将字符串插值结果同步到 HTML/SVG Attribute 的绑定。 */
export class UIAttributeBinding<State extends UIContext = UIContext> extends UIBinding {
    readonly dependencies: ReadonlySet<string>
    private readonly element: Element
    private readonly name: string
    private readonly interpolation: UIInterpolation
    private readonly runtime: UIRuntime<State>
    private current: unknown = Symbol('uninitialized')

    constructor(
        element: Element,
        name: string,
        interpolation: UIInterpolation,
        runtime: UIRuntime<State>,
    ) {
        super()
        this.element = element
        this.name = name
        this.interpolation = interpolation
        this.runtime = runtime
        this.dependencies = interpolation.dependencies
    }

    /** 缓存上次结果；值未变化时不重复调用 setAttribute。 */
    update(): void {
        const value = this.interpolation.evaluate(this.runtime)
        if (Object.is(this.current, value)) return
        this.element.setAttribute(this.name, value)
        this.current = value
    }
}
