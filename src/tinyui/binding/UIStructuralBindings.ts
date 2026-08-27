import {UIBinding} from '../core/UIBinding'
import type {UIContext} from '../core/UIContext'
import {UIRuntime} from '../core/UIRuntime'
import type {UIExpression} from '../resolver/UIResolver'

/** 结构 Binding 用于编译克隆元素的回调签名。 */
export type UIElementCompiler<State extends UIContext> = (
    element: HTMLElement,
    runtime: UIRuntime<State>,
) => void

/** `each` 声明拆分后的局部变量名和集合表达式。 */
export interface UIEachExpression {
    readonly itemName: string
    readonly indexName: string
    readonly collectionExpression: string
}

interface UIEachEntry<State extends UIContext> {
    readonly anchor: Comment
    readonly element: HTMLElement
    readonly runtime: UIRuntime<State>
    readonly item: unknown
}

/**
 * 解析 `item in items` 或 `item, index in items`。
 * 未显式声明索引时使用 `$index`，项目名与索引名不能相同。
 */
export function parseEachExpression<State extends UIContext>(
    expression: string,
    runtime: UIRuntime<State>,
): UIEachExpression {
    const match = expression.trim().match(
        /^([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?\s+in\s+(.+)$/,
    )
    if (!match) {
        throw new Error(`Invalid TinyUI each expression: "${expression}". Use "item in items".`)
    }
    const indexName = match[2] ?? '$index'
    if (match[1] === indexName) {
        throw new Error(`TinyUI each item and index names must be different: "${expression}".`)
    }
    return {
        itemName: match[1],
        indexName,
        collectionExpression: runtime.resolver.assertExpression(match[3]),
    }
}

/**
 * `if` 结构绑定：用注释锚点替换模板元素，并按条件创建或销毁完整子 Runtime。
 *
 * 新分支先在脱离主 DOM 的 DocumentFragment 中编译。编译失败时会销毁已创建的
 * Binding 并恢复 Ref 快照，页面仍保留更新前的 DOM 和运行状态。
 */
export class UIIfBinding<State extends UIContext> extends UIBinding {
    readonly dependencies: ReadonlySet<string>
    readonly updateOnEveryPatch = true
    private readonly anchor: Comment
    private readonly source: HTMLElement
    private readonly expression: UIExpression
    private readonly runtime: UIRuntime<State>
    private readonly compileElement: UIElementCompiler<State>
    private mounted: {element: HTMLElement, runtime: UIRuntime<State>} | undefined

    constructor(
        element: HTMLElement,
        expression: string,
        runtime: UIRuntime<State>,
        compileElement: UIElementCompiler<State>,
    ) {
        super()
        this.expression = runtime.resolver.compileExpression(expression)
        this.runtime = runtime
        this.compileElement = compileElement
        this.dependencies = this.expression.dependencies
        this.anchor = element.ownerDocument.createComment(`if:${expression}`)
        this.source = element.cloneNode(true) as HTMLElement
        this.source.removeAttribute('if')
        element.parentNode?.replaceChild(this.anchor, element)
    }

    update(changed: ReadonlySet<string> | null): void {
        if (!super.shouldUpdate(changed)) {
            this.mounted?.runtime.update(changed)
            return
        }
        const visible = Boolean(this.expression.evaluate(this.runtime))
        if (visible && !this.mounted) {
            const element = this.source.cloneNode(true) as HTMLElement
            const fragment = this.anchor.ownerDocument.createDocumentFragment()
            const childRuntime = new UIRuntime(
                this.runtime.context,
                this.runtime.locals,
                this.runtime.refs,
                this.runtime.options,
                this.runtime.resolver,
                this.runtime.components,
                this.runtime.refRegistry,
            )
            fragment.append(element)
            try {
                this.compileElement(element, childRuntime)
            } catch (error) {
                childRuntime.destroy()
                throw error
            }
            this.anchor.parentNode?.insertBefore(fragment, this.anchor.nextSibling)
            this.mounted = {element, runtime: childRuntime}
        } else if (!visible && this.mounted) {
            this.mounted.runtime.destroy()
            this.mounted.element.remove()
            this.mounted = undefined
        } else {
            this.mounted?.runtime.update(changed)
        }
    }

    /** 销毁当前条件分支及锚点；子 Runtime 会负责清理事件、组件和 Ref。 */
    destroy(): void {
        this.mounted?.runtime.destroy()
        this.mounted?.element.remove()
        this.mounted = undefined
        this.anchor.remove()
    }
}

/**
 * `each` 列表绑定，每个条目拥有独立 locals 和子 Runtime。
 *
 * 新数组会复用 Object.is 相同的连续前缀，再在脱离 DOM 的 Fragment 中编译变化
 * 后缀。同一数组引用仍完整重建，以兼容原地修改。若编译失败，则销毁临时
 * Runtime、恢复 Ref，并保留原列表。
 */
export class UIEachBinding<State extends UIContext> extends UIBinding {
    readonly dependencies: ReadonlySet<string>
    readonly updateOnEveryPatch = true
    private readonly anchor: Comment
    private readonly endAnchor: Comment
    private readonly source: HTMLElement
    private readonly expression: UIEachExpression
    private readonly collectionExpression: UIExpression
    private readonly runtime: UIRuntime<State>
    private readonly compileElement: UIElementCompiler<State>
    private entries: Array<UIEachEntry<State>> = []
    private collection: unknown[] | undefined
    private refreshEntries = false

    constructor(
        element: HTMLElement,
        expression: UIEachExpression,
        runtime: UIRuntime<State>,
        compileElement: UIElementCompiler<State>,
    ) {
        super()
        this.expression = expression
        this.collectionExpression = runtime.resolver.compileExpression(expression.collectionExpression)
        this.runtime = runtime
        this.compileElement = compileElement
        this.dependencies = this.collectionExpression.dependencies
        this.anchor = element.ownerDocument.createComment(`each:${expression.collectionExpression}`)
        this.endAnchor = element.ownerDocument.createComment(`/each:${expression.collectionExpression}`)
        this.source = element.cloneNode(true) as HTMLElement
        this.source.removeAttribute('each')
        element.parentNode?.replaceChild(this.anchor, element)
        this.anchor.parentNode?.insertBefore(this.endAnchor, this.anchor.nextSibling)
    }

    update(changed: ReadonlySet<string> | null): void {
        if (!super.shouldUpdate(changed)) {
            const forwarded = this.refreshEntries ? null : changed
            this.entries.forEach((entry) => entry.runtime.update(forwarded))
            this.refreshEntries = false
            return
        }
        let collection: unknown
        try {
            collection = this.collectionExpression.evaluate(this.runtime)
        } catch (error) {
            this.refreshEntries = true
            throw error
        }
        if (collection === null || collection === undefined) {
            this.clear()
            return
        }
        if (!Array.isArray(collection)) {
            this.refreshEntries = true
            throw new TypeError(
                `TinyUI each expression "${this.expression.collectionExpression}" must resolve to an array.`,
            )
        }
        // 新数组采用不可变数据语义：从头复用 Object.is 相同的条目，覆盖聊天消息
        // append 等常见场景。同一数组引用仍完整重建，以兼容显式 update() 刷新原地修改。
        let reusableCount = 0
        if (collection !== this.collection) {
            const limit = Math.min(collection.length, this.entries.length)
            while (reusableCount < limit
                && Object.is(collection[reusableCount], this.entries[reusableCount].item)) {
                reusableCount += 1
            }
        }

        const fragment = this.anchor.ownerDocument.createDocumentFragment()
        const nextEntries: Array<UIEachEntry<State>> = []
        try {
            for (let index = reusableCount; index < collection.length; index += 1) {
                const item = collection[index]
                const element = this.source.cloneNode(true) as HTMLElement
                const entryAnchor = this.anchor.ownerDocument.createComment(`each-entry:${index}`)
                const locals = {
                    ...this.runtime.locals,
                    [this.expression.itemName]: item,
                    [this.expression.indexName]: index,
                }
                const childRuntime = new UIRuntime(
                    this.runtime.context,
                    locals,
                    this.runtime.refs,
                    this.runtime.options,
                    this.runtime.resolver,
                    this.runtime.components,
                    this.runtime.refRegistry,
                )
                fragment.append(entryAnchor, element)
                nextEntries.push({anchor: entryAnchor, element, runtime: childRuntime, item})
                this.compileElement(element, childRuntime)
            }
        } catch (error) {
            nextEntries.forEach((entry) => entry.runtime.destroy())
            this.refreshEntries = true
            throw error
        }

        const reusableEntries = this.entries.slice(0, reusableCount)
        const removedEntries = this.entries.slice(reusableCount)
        const reference = removedEntries[0]?.anchor ?? this.endAnchor
        try {
            if (nextEntries.length > 0) {
                const parent = this.anchor.parentNode
                if (!parent) throw new Error('TinyUI each anchor is detached.')
                // 新后缀先插入旧后缀之前；提交成功后才销毁旧 Runtime 和 DOM。
                parent.insertBefore(fragment, reference)
            }
        } catch (error) {
            nextEntries.forEach((entry) => entry.runtime.destroy())
            this.refreshEntries = true
            throw error
        }
        this.removeEntries(removedEntries)
        this.entries = [...reusableEntries, ...nextEntries]
        this.collection = collection
        const forwarded = this.refreshEntries ? null : changed
        reusableEntries.forEach((entry) => entry.runtime.update(forwarded))
        this.refreshEntries = false
    }

    destroy(): void {
        this.clear()
        this.anchor.remove()
        this.endAnchor.remove()
    }

    /** 释放全部条目 Runtime，并从 DOM 移除对应元素。 */
    private clear(): void {
        this.removeEntries(this.entries)
        this.entries = []
        this.collection = undefined
        this.refreshEntries = false
    }

    private removeEntries(entries: readonly UIEachEntry<State>[]): void {
        entries.forEach((entry) => {
            entry.runtime.destroy()
            entry.element.remove()
            entry.anchor.remove()
        })
    }
}
