import type {UIBinding} from './UIBinding'

/**
 * 一次 update 调用内的同步去重队列。
 *
 * 队列使用 Set，确保同一个 Binding 即使被重复加入也只执行一次。flush 前先
 * 清空 pending，因此 Binding 更新期间发生的嵌套调度不会污染当前快照。若某项
 * 抛错，尚未执行的后续项会保留到下一轮，并以全量语义恢复。
 */
export class UIUpdateQueue {
    private readonly pending = new Set<UIBinding>()
    /** 上一轮因前序 Binding 抛错而没有机会执行的任务。 */
    private recovery: UIBinding[] = []

    /** 将 Binding 加入本轮更新，重复调用不会产生重复任务。 */
    enqueue(binding: UIBinding): void {
        this.pending.add(binding)
    }

    /** 同步执行当前快照中的全部 Binding，并转发本轮变化键。 */
    flush(changed: ReadonlySet<string> | null): void {
        const bindings = Array.from(this.pending)
        this.pending.clear()
        const recovery = this.recovery
        this.recovery = []
        // 正常热路径没有恢复任务，不额外分配 Set。
        const recovering = recovery.length > 0 ? new Set(recovery) : undefined

        for (let index = 0; index < recovery.length; index += 1) {
            try {
                recovery[index].update(null)
            } catch (error) {
                this.recovery = recovery.slice(index + 1)
                bindings.forEach((binding) => {
                    if (!recovering?.has(binding)) this.recovery.push(binding)
                })
                throw error
            }
        }

        for (let index = 0; index < bindings.length; index += 1) {
            const binding = bindings[index]
            if (recovering?.has(binding)) continue
            try {
                binding.update(changed)
            } catch (error) {
                // 当前 Binding 已经得到执行机会；只保留下游未执行项，避免非法结构值
                // 在无关 Patch 中被强制重试，同时保证被中断的普通 Binding 最终补刷。
                for (let remaining = index + 1; remaining < bindings.length; remaining += 1) {
                    if (!recovering?.has(bindings[remaining])) this.recovery.push(bindings[remaining])
                }
                throw error
            }
        }
    }

    /** shouldUpdate 等调度阶段异常时，把已选任务转成下一轮的全量恢复任务。 */
    deferPending(): void {
        const seen = new Set(this.recovery)
        this.pending.forEach((binding) => {
            if (!seen.has(binding)) this.recovery.push(binding)
        })
        this.pending.clear()
    }

    /** 丢弃尚未执行的任务，主要用于 Runtime 销毁。 */
    clear(): void {
        this.pending.clear()
        this.recovery = []
    }
}
