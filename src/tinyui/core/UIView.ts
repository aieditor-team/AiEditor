import type {UIContext, UIElement} from './UIContext'
import type {UIBinding} from './UIBinding'
import type {UIRuntime} from './UIRuntime'

/**
 * 一次 html() 调用产生的可挂载视图。
 *
 * UIView 持有稳定的根元素、原始 context、Ref 表和内部 Runtime。unmount 只把
 * 根节点移出 DOM，仍允许再次 mount；destroy 才会永久释放 Binding 与监听器。
 */
export class UIView<State extends UIContext = UIContext> {
    /** 模板唯一的根元素。 */
    readonly root: HTMLElement
    /** 调用方传入的同一个上下文对象；update 会在该对象上做浅合并。 */
    readonly context: State
    /** 由 #name 收集的元素；条件或列表子树销毁时对应项会同步清理。 */
    readonly refs: Record<string, UIElement>
    private readonly runtime: UIRuntime<State>
    private destroyed = false
    private updating = false
    private scheduled = false
    private scheduleVersion = 0
    private pendingFullUpdate = false
    private readonly pendingKeys = new Set<string>()

    constructor(root: HTMLElement, context: State, runtime: UIRuntime<State>) {
        this.root = root
        this.context = context
        this.refs = runtime.refs
        this.runtime = runtime
    }

    /** 当前根 Runtime 直接注册的 Binding 只读视图，主要用于诊断和测试。 */
    get bindings(): readonly UIBinding[] {
        return this.runtime.bindings
    }

    /** 把根元素追加到容器；已销毁的视图不能再次挂载。 */
    mount(parent: ParentNode): void {
        this.assertActive('mount')
        parent.appendChild(this.root)
    }

    /** 仅从当前父节点移除根元素，不销毁状态和事件，可随后重新 mount。 */
    unmount(): void {
        this.root.remove()
    }

    /**
     * 浅合并状态并增量刷新受影响的 Binding。
     *
     * 无参数调用 update() 会进行一次全量检查，适合调用方直接修改了 context
     * 字段的情况。嵌套对象仍建议以新引用替换，便于组件 Props 判断变化。
     */
    update(patch: Partial<State> = {}): void {
        this.assertActive('update')
        if (this.updating) {
            throw new Error('Cannot update a TinyUI view synchronously during TinyUI rendering. Use scheduleUpdate().')
        }
        const changed = this.applyPatch(patch)
        if (this.scheduled) {
            this.mergePending(changed)
            this.flushPending()
        } else {
            this.runUpdate(changed)
        }
    }

    /**
     * 合并同一微任务内的多次状态更新，适合 AI 流式文本等高频场景。
     * context 会立即浅合并，DOM 在当前同步任务结束后统一刷新；同步 update() 会
     * 立即接管并冲刷尚未执行的调度更新。
     */
    scheduleUpdate(patch: Partial<State> = {}): void {
        this.assertActive('scheduleUpdate')
        this.mergePending(this.applyPatch(patch))
        if (this.scheduled) return

        this.scheduled = true
        const version = ++this.scheduleVersion
        queueMicrotask(() => {
            if (this.destroyed || version !== this.scheduleVersion) return
            this.flushPending()
        })
    }

    /** 永久释放监听器、结构子树和组件，并从 DOM 移除根元素。 */
    destroy(): void {
        if (this.destroyed) return
        this.destroyed = true
        this.scheduleVersion += 1
        this.scheduled = false
        this.pendingFullUpdate = false
        this.pendingKeys.clear()
        this.runtime.destroy()
        this.root.remove()
    }

    private assertActive(action: string): void {
        if (this.destroyed) throw new Error(`Cannot ${action} a destroyed TinyUI view.`)
    }

    private applyPatch(patch: Partial<State>): ReadonlySet<string> | null {
        const keys = Object.keys(patch)
        Object.assign(this.context, patch)
        return keys.length === 0 ? null : new Set(keys)
    }

    private mergePending(changed: ReadonlySet<string> | null): void {
        if (changed === null) {
            this.pendingFullUpdate = true
        } else {
            changed.forEach((key) => this.pendingKeys.add(key))
        }
    }

    private flushPending(): void {
        this.scheduleVersion += 1
        this.scheduled = false
        const changed = this.pendingFullUpdate ? null : new Set(this.pendingKeys)
        this.pendingFullUpdate = false
        this.pendingKeys.clear()
        this.runUpdate(changed)
    }

    /** 防止同一 UIView 在 Binding 提交尚未结束时被同步重入。 */
    private runUpdate(changed: ReadonlySet<string> | null): void {
        this.updating = true
        try {
            this.runtime.update(changed)
        } finally {
            this.updating = false
        }
    }
}

export type TinyUIView<State extends UIContext = UIContext> = UIView<State>
