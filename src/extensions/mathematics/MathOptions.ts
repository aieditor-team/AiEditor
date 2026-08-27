import type {KatexOptions} from 'katex'

/** 数学公式输入规则和纯文本转换支持的定界符模式。 */
export type MathDelimiters = 'dollar' | 'bracket' | {
    inlineRegex?: string
    blockRegex?: string
    inlineStart?: string
    inlineEnd?: string
    blockStart?: string
    blockEnd?: string
}

export function delimiterRegex(mode: 'inline' | 'block', options: MathInputOptions): string | undefined {
    const delimiters = options.delimiters ?? 'dollar'
    if (typeof delimiters === 'object') {
        const custom = mode === 'inline' ? delimiters.inlineRegex : delimiters.blockRegex
        if (custom) return custom
    }
    const [start, end] = delimiterPair(mode, options)
    if (start === '$' && end === '$') return mode === 'inline'
        ? String.raw`(?<!\$)\$((?:[^$\\]|\\.)+?)\$(?!\$)`
        : String.raw`(?<!\$)\$\$\$([^$\n]+?)\$\$\$(?!\$)`
    return `${escapeRegex(start)}([\\s\\S]+?)${escapeRegex(end)}`
}

export type MathRenderTextMode = 'none' | 'raw-latex' | { placeholder: string }

export interface MathInputOptions {
    /** 输入或粘贴公式时使用的定界符，默认为美元符号语法。 */
    delimiters?: MathDelimiters
    /** editor.getText() 返回的公式文本形式，默认为原始 LaTeX 源码。 */
    renderTextMode?: MathRenderTextMode
    /** KaTeX 渲染配置。 */
    katexOptions?: KatexOptions
    /** 点击编辑公式浮层中的本地化文案转换函数。 */
    translate?: (value: string) => string
}

export const DEFAULT_MATH_INPUT_OPTIONS: Required<Pick<MathInputOptions, 'delimiters' | 'renderTextMode'>> = {
    delimiters: 'dollar',
    renderTextMode: 'raw-latex',
}

export function delimiterPair(mode: 'inline' | 'block', options: MathInputOptions): [string, string] {
    const delimiters = options.delimiters ?? 'dollar'
    if (delimiters === 'bracket') return mode === 'inline' ? ['\\(', '\\)'] : ['\\[', '\\]']
    if (delimiters === 'dollar') return mode === 'inline' ? ['$', '$'] : ['$$', '$$']
    return mode === 'inline'
        ? [delimiters.inlineStart ?? '$', delimiters.inlineEnd ?? '$']
        : [delimiters.blockStart ?? '$$', delimiters.blockEnd ?? '$$']
}

export function mathText(node: { attrs: { latex?: unknown } }, options: MathInputOptions): string {
    if (options.renderTextMode === 'none') return ''
    if (typeof options.renderTextMode === 'object') return options.renderTextMode.placeholder
    return typeof node.attrs.latex === 'string' ? node.attrs.latex : ''
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
