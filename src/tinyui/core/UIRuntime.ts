import type {TinyUIOptions, UIContext, UIElement} from './UIContext'
import {UIBinding} from './UIBinding'
import {UIUpdateQueue} from './UIUpdateQueue'
import {UIResolver} from '../resolver/UIResolver'
import type {TinyUIComponent} from '../component/UIComponent'
import {UIRefRegistry} from './UIRefRegistry'

/**
 * 单棵已编译模板子树的内部运行环境。
 *
 * 根视图、if 分支和 each 条目各自拥有 Runtime，但共享 context 与 refs。
 * locals 只保存 each 产生的局部变量，从而让 item.name 与全局字段使用同一解析器。
 */
export class UIRuntime<State extends UIContext = UIContext> {
    /** 当前子树直接拥有的 Binding。 */
    readonly bindings: UIBinding[] = []
    /** 不属于具体 Binding 的清理函数，例如普通元素 Ref。 */
    readonly cleanups: Array<() => void> = []
    readonly resolver: UIResolver
    readonly components: ReadonlyMap<string, TinyUIComponent<State>>
    readonly context: State
    readonly locals: Record<string, unknown>
    readonly refs: Record<string, UIElement>
    readonly options: TinyUIOptions<State>
    /** 根视图及其所有结构子 Runtime 共享的 Ref 所有权表。 */
    readonly refRegistry: UIRefRegistry
    private readonly updateQueue = new UIUpdateQueue()
    private readonly bindingsByDependency = new Map<string, Set<UIBinding>>()
    private readonly indexedBindings = new Set<UIBinding>()
    private readonly bindingsForEveryPatch = new Set<UIBinding>()
    private readonly dynamicallyFilteredBindings = new Set<UIBinding>()

    constructor(
        context: State,
        locals: Record<string, unknown>,
        refs: Record<string, UIElement>,
        options: TinyUIOptions<State>,
        resolver = new UIResolver(),
        components?: ReadonlyMap<string, TinyUIComponent<State>>,
        refRegistry?: UIRefRegistry,
    ) {
        this.context = context
        this.locals = locals
        this.refs = refs
        this.options = options
        this.resolver = resolver
        this.refRegistry = refRegistry ?? new UIRefRegistry(refs)
        this.components = components ?? new Map(
            Object.entries(options.components ?? {}).map(([name, component]) => [name.toLowerCase(), component]),
        )
    }

    /** 使用当前 context 和局部变量解析受限表达式。 */
    resolve(expression: string): unknown {
        return this.resolver.resolve(expression, this)
    }

    /** 注册并立即完成 Binding 的首次渲染。 */
    add(binding: UIBinding): void {
        this.bindings.push(binding)
        if (binding.skipUpdateScheduling) {
            binding.update(null)
            return
        }
        if (binding.updateOnEveryPatch) {
            this.bindingsForEveryPatch.add(binding)
        } else if (binding.shouldUpdate !== UIBinding.prototype.shouldUpdate) {
            // 保留自定义 UIBinding 覆盖 shouldUpdate() 的兼容行为；内置热路径不进入此集合。
            this.dynamicallyFilteredBindings.add(binding)
        } else {
            this.indexedBindings.add(binding)
            binding.dependencies.forEach((dependency) => {
                let bindings = this.bindingsByDependency.get(dependency)
                if (!bindings) {
                    bindings = new Set()
                    this.bindingsByDependency.set(dependency, bindings)
                }
                bindings.add(binding)
            })
        }
        binding.update(null)
    }

    /** 通过反向依赖索引直接选择 Binding，并在同一队列中去重刷新。 */
    update(changed: ReadonlySet<string> | null): void {
        try {
            if (changed === null) {
                this.indexedBindings.forEach((binding) => this.updateQueue.enqueue(binding))
                this.bindingsForEveryPatch.forEach((binding) => this.updateQueue.enqueue(binding))
                this.dynamicallyFilteredBindings.forEach((binding) => {
                    if (binding.shouldUpdate(null)) this.updateQueue.enqueue(binding)
                })
            } else {
                this.bindingsForEveryPatch.forEach((binding) => this.updateQueue.enqueue(binding))
                changed.forEach((dependency) => {
                    this.bindingsByDependency.get(dependency)?.forEach((binding) => this.updateQueue.enqueue(binding))
                })
                this.dynamicallyFilteredBindings.forEach((binding) => {
                    if (binding.shouldUpdate(changed)) this.updateQueue.enqueue(binding)
                })
            }
        } catch (error) {
            this.updateQueue.deferPending()
            throw error
        }
        this.updateQueue.flush(changed)
    }

    /** 以可重复调用的方式释放当前子树持有的全部资源。 */
    destroy(): void {
        this.updateQueue.clear()
        this.bindings.splice(0).forEach((binding) => binding.destroy())
        this.cleanups.splice(0).forEach((cleanup) => cleanup())
        this.bindingsByDependency.clear()
        this.indexedBindings.clear()
        this.bindingsForEveryPatch.clear()
        this.dynamicallyFilteredBindings.clear()
    }
}
