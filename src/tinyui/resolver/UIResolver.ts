import type {UIContext} from '../core/UIContext'

/** Resolver 读取数据时使用的全局上下文和 each 局部变量。 */
export interface UIResolutionScope<State extends UIContext = UIContext> {
    readonly context: State
    readonly locals: Record<string, unknown>
}

/** 经过校验和路径拆分、可重复执行的表达式访问器。 */
export interface UIExpression {
    readonly source: string
    readonly dependencies: ReadonlySet<string>

    evaluate(scope: UIResolutionScope): unknown
}

/** 预编译后的字符串插值；evaluate 不再重复解析模板结构。 */
export interface UIInterpolation {
    readonly dependencies: ReadonlySet<string>

    evaluate(scope: UIResolutionScope): string
}

const INTERPOLATION_PATTERN = /\{\{\s*([^{}]+?)\s*\}\}/g
const SIMPLE_PATH_PATTERN = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/

/**
 * TinyUI 的受限表达式解析器。
 *
 * 第一版只接受 foo、foo.bar、foo.bar.baz 和少量字面量，不执行 eval、Function
 * 或任意 JavaScript。这样模板中的表达式只负责寻址，不承担业务计算。
 */
export class UIResolver {
    private readonly expressions = new Map<string, UIExpression>()
    private readonly interpolations = new Map<string, UIInterpolation | null>()

    /** 返回表达式依赖的顶层键，供增量更新筛选 Binding。 */
    dependency(expression: string): string {
        return this.compileExpression(expression).dependencies.values().next().value ?? ''
    }

    /** 校验并规范化表达式；不支持的运算、调用和下标访问会立即报错。 */
    assertExpression(expression: string): string {
        return this.compileExpression(expression).source
    }

    /**
     * 把表达式编译为访问器并按规范化源码缓存。
     *
     * 同一个 UIView 内的根 Runtime、条件分支和列表条目共享 Resolver，因此大量
     * 重复条目只会校验并拆分一次 `item.name`，更新阶段不再执行正则和 split。
     */
    compileExpression(expression: string): UIExpression {
        const source = expression.trim()
        const cached = this.expressions.get(source)
        if (cached) return cached

        const literal = this.parseLiteral(source)
        if (!SIMPLE_PATH_PATTERN.test(source) && !literal.matched) {
            throw new Error(`TinyUI only supports property paths and literals: "${expression}"`)
        }

        const parts = literal.matched ? [] : source.split('.')
        const compiled: UIExpression = {
            source,
            dependencies: new Set(parts.length > 0 ? [parts[0]] : []),
            evaluate: literal.matched
                ? () => literal.value
                : (scope) => {
                    let value: unknown = Object.prototype.hasOwnProperty.call(scope.locals, parts[0])
                        ? scope.locals[parts[0]]
                        : scope.context[parts[0]]
                    for (let index = 1; index < parts.length; index += 1) {
                        if (value === null || value === undefined) return undefined
                        value = (value as Record<string, unknown>)[parts[index]]
                    }
                    return value
                },
        }
        this.expressions.set(source, compiled)
        return compiled
    }

    /**
     * 解析路径或字面量。
     *
     * each 局部变量优先于同名全局字段；中间值为 null/undefined 时返回 undefined，
     * 不继续访问后续属性。
     */
    resolve(expression: string, scope: UIResolutionScope): unknown {
        return this.compileExpression(expression).evaluate(scope)
    }

    /**
     * 把包含 {{ expression }} 的字符串预编译为静态片段和表达式片段。
     * 返回 undefined 表示源字符串没有插值，不需要创建 Binding。
     */
    compileInterpolation(source: string): UIInterpolation | undefined {
        const cached = this.interpolations.get(source)
        if (cached) return cached
        if (this.interpolations.has(source)) return undefined

        const parts: Array<string | UIExpression> = []
        const dependencies = new Set<string>()
        let lastIndex = 0

        for (const match of source.matchAll(INTERPOLATION_PATTERN)) {
            const index = match.index
            if (index > lastIndex) parts.push(source.slice(lastIndex, index))
            const expression = this.compileExpression(match[1])
            parts.push(expression)
            expression.dependencies.forEach((dependency) => dependencies.add(dependency))
            lastIndex = index + match[0].length
        }
        if (parts.length === 0) {
            this.interpolations.set(source, null)
            return undefined
        }
        if (lastIndex < source.length) parts.push(source.slice(lastIndex))

        const interpolation: UIInterpolation = {
            dependencies,
            evaluate: (scope) => {
                let output = ''
                for (const part of parts) {
                    if (typeof part === 'string') {
                        output += part
                    } else {
                        const value = part.evaluate(scope)
                        if (value !== null && value !== undefined) output += String(value)
                    }
                }
                return output
            },
        }
        this.interpolations.set(source, interpolation)
        return interpolation
    }

    /** 解析无需访问上下文的布尔、空值、数字和引号字符串字面量。 */
    private parseLiteral(expression: string): {matched: boolean, value: unknown} {
        const value = expression.trim()
        if (value === 'true') return {matched: true, value: true}
        if (value === 'false') return {matched: true, value: false}
        if (value === 'null') return {matched: true, value: null}
        if (value === 'undefined') return {matched: true, value: undefined}
        if (/^-?(?:\d+|\d*\.\d+)$/.test(value)) return {matched: true, value: Number(value)}
        if ((value.startsWith("'") && value.endsWith("'"))
            || (value.startsWith('"') && value.endsWith('"'))) {
            return {matched: true, value: value.slice(1, -1)}
        }
        return {matched: false, value: undefined}
    }
}
