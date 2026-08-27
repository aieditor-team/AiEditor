import type {UIElement} from './UIContext'

interface UIRefRegistration {
    readonly element: UIElement
    previous?: UIRefRegistration
    next?: UIRefRegistration
}

interface UIRefStack {
    first?: UIRefRegistration
    last?: UIRefRegistration
}

/**
 * 一棵 UIView 内所有 Runtime 共享的 Ref 所有权表。
 *
 * 条件、列表和组件可能临时用同一个名称覆盖已有 Ref。注册表按创建顺序保存仍然
 * 存活的所有者；最上层所有者销毁后，会自动恢复前一个仍存活的元素。这样失败
 * 编译只需销毁临时 Runtime，无需在每次结构更新前复制完整 refs 对象。
 */
export class UIRefRegistry {
    private readonly registrations = new Map<string, UIRefStack>()
    private readonly refs: Record<string, UIElement>

    constructor(refs: Record<string, UIElement>) {
        this.refs = refs
    }

    /** 注册一个 Ref，并返回可重复调用的精确注销函数。 */
    register(name: string, element: UIElement): () => void {
        const registration: UIRefRegistration = {element}
        let stack = this.registrations.get(name)
        if (!stack) {
            stack = {first: registration, last: registration}
            this.registrations.set(name, stack)
        } else {
            registration.previous = stack.last
            stack.last!.next = registration
            stack.last = registration
        }
        this.refs[name] = element

        let active = true
        return () => {
            if (!active) return
            active = false
            const current = this.registrations.get(name)
            if (!current) return
            const wasLatest = current.last === registration
            if (registration.previous) registration.previous.next = registration.next
            else current.first = registration.next
            if (registration.next) registration.next.previous = registration.previous
            else current.last = registration.previous
            registration.previous = undefined
            registration.next = undefined

            if (!current.first) this.registrations.delete(name)
            // 调用方直接改写 refs 时不抢回所有权；只有仍指向被注销元素时才恢复。
            if (!wasLatest || this.refs[name] !== element) return
            if (current.last) this.refs[name] = current.last.element
            else delete this.refs[name]
        }
    }
}
