/**
 * 所有 DOM 绑定的公共基类。
 *
 * dependencies 保存绑定依赖的顶层上下文键。UIView.update(patch) 会把 patch
 * 的键传给 Runtime，只调度相交的绑定；changed 为 null 表示显式全量刷新。
 */
export abstract class UIBinding {
    /** 触发当前绑定重新计算的顶层上下文键。 */
    abstract readonly dependencies: ReadonlySet<string>

    /**
     * 是否接收每个非全量 Patch。
     * 结构 Binding 用它向子 Runtime 转发其他字段变化；普通 Binding 应保持 false。
     */
    readonly updateOnEveryPatch: boolean = false

    /** 永不参与状态调度，例如触发时动态读取处理函数的事件 Binding。 */
    readonly skipUpdateScheduling: boolean = false

    /** 判断本次状态变化是否可能影响当前绑定。 */
    shouldUpdate(changed: ReadonlySet<string> | null): boolean {
        if (changed === null) return true
        for (const dependency of this.dependencies) {
            if (changed.has(dependency)) return true
        }
        return false
    }

    /** 重新解析当前值并按需写入 DOM。 */
    abstract update(changed: ReadonlySet<string> | null): void

    /** 释放事件监听器、子 Runtime 或当前绑定持有的其他资源。 */
    destroy(): void {}
}
