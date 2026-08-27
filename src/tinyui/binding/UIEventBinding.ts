import {UIBinding} from '../core/UIBinding'
import type {UIRuntime} from '../core/UIRuntime'
import type {UIContext} from '../core/UIContext'
import type {UIExpression} from '../resolver/UIResolver'

/** 解析后的事件声明，分离行为修饰符与 addEventListener 选项。 */
export interface UIEventDescriptor {
    readonly eventName: string
    readonly expression: string
    readonly modifiers: readonly string[]
    readonly options: AddEventListenerOptions
}

const EVENT_MODIFIERS = new Set(['capture', 'once', 'passive', 'prevent', 'self', 'stop'])

/**
 * 解析 `@event.modifier` 语法并提前拒绝未知、重复或互斥的修饰符。
 * 空表达式默认使用事件名，例如 `@click` 等价于 `@click="click"`。
 */
export function parseUIEvent<State extends UIContext>(
    attribute: Attr,
    runtime: UIRuntime<State>,
): UIEventDescriptor {
    const [eventName, ...modifiers] = attribute.name.slice(1).split('.')
    if (!eventName) throw new Error('TinyUI event names cannot be empty.')
    const unknownModifier = modifiers.find((modifier) => !EVENT_MODIFIERS.has(modifier))
    if (unknownModifier) throw new Error(`Unknown TinyUI event modifier: "${unknownModifier}".`)
    if (new Set(modifiers).size !== modifiers.length) {
        throw new Error(`TinyUI event modifiers cannot be repeated: "${attribute.name}".`)
    }
    if (modifiers.includes('passive') && modifiers.includes('prevent')) {
        throw new Error('TinyUI event modifiers passive and prevent cannot be used together.')
    }
    return {
        eventName,
        expression: runtime.resolver.assertExpression(attribute.value || eventName),
        modifiers,
        options: {
            capture: modifiers.includes('capture'),
            passive: modifiers.includes('passive'),
        },
    }
}

/**
 * DOM 事件绑定。
 *
 * 监听器触发时才从 context 解析处理函数，因此替换同名函数无需重新绑定事件。
 * `.once` 由绑定自行销毁，而非交给浏览器 options.once：这样 `.self.once` 只有
 * 在事件确实来自当前元素时才会消耗一次机会。
 */
export class UIEventBinding<State extends UIContext = UIContext> extends UIBinding {
    readonly dependencies = new Set<string>()
    readonly skipUpdateScheduling = true
    private readonly element: Element
    private readonly descriptor: UIEventDescriptor
    private readonly listener: EventListener
    private readonly handlerExpression: UIExpression

    constructor(
        element: Element,
        descriptor: UIEventDescriptor,
        runtime: UIRuntime<State>,
    ) {
        super()
        this.element = element
        this.descriptor = descriptor
        this.handlerExpression = runtime.resolver.compileExpression(descriptor.expression)
        const self = descriptor.modifiers.includes('self')
        const prevent = descriptor.modifiers.includes('prevent')
        const stop = descriptor.modifiers.includes('stop')
        const once = descriptor.modifiers.includes('once')
        this.listener = (event): void => {
            if (self && event.target !== element) return
            if (prevent) event.preventDefault()
            if (stop) event.stopPropagation()
            try {
                const handler = this.handlerExpression.evaluate(runtime)
                if (typeof handler !== 'function') {
                    throw new TypeError(`TinyUI event handler "${descriptor.expression}" is not a function.`)
                }
                handler.call(runtime.context, event)
            } finally {
                if (once) this.destroy()
            }
        }
        element.addEventListener(descriptor.eventName, this.listener, descriptor.options)
    }

    /** 事件绑定没有渲染阶段更新。 */
    update(): void {}

    /** 移除与注册时 eventName、listener 和 options 完全对应的监听器。 */
    destroy(): void {
        this.element.removeEventListener(this.descriptor.eventName, this.listener, this.descriptor.options)
    }
}
