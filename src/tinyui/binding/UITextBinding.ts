import {UIBinding} from '../core/UIBinding'
import type {UIRuntime} from '../core/UIRuntime'
import type {UIContext} from '../core/UIContext'
import type {UIInterpolation} from '../resolver/UIResolver'

/** 将插值结果同步到 Text 节点的绑定。 */
export class UITextBinding<State extends UIContext = UIContext> extends UIBinding {
    readonly dependencies: ReadonlySet<string>
    private readonly node: Text
    private readonly interpolation: UIInterpolation
    private readonly runtime: UIRuntime<State>
    private current: unknown = Symbol('uninitialized')

    constructor(
        node: Text,
        interpolation: UIInterpolation,
        runtime: UIRuntime<State>,
    ) {
        super()
        this.node = node
        this.interpolation = interpolation
        this.runtime = runtime
        this.dependencies = interpolation.dependencies
    }

    /** 仅在最终字符串变化时写入 node.data，避免产生无意义的 DOM Mutation。 */
    update(): void {
        const value = this.interpolation.evaluate(this.runtime)
        if (Object.is(this.current, value)) return
        this.node.data = value
        this.current = value
    }
}
