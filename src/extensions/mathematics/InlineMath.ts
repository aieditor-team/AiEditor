import {InlineMath as TInlineMath, type InlineMathOptions as TInlineMathOptions} from '@tiptap/extension-mathematics'
import {InputRule, PasteRule} from '@tiptap/core'
import {DEFAULT_MATH_INPUT_OPTIONS, delimiterPair, delimiterRegex, mathText, type MathInputOptions} from './MathOptions'
import {createMathNodeView} from './MathNodeView'

/** 可嵌入段落文字流中的数学公式节点。 */
export type InlineMathOptions = TInlineMathOptions & MathInputOptions
export const InlineMath = TInlineMath.extend<InlineMathOptions>({
    addOptions() {
        return {...this.parent?.(), ...DEFAULT_MATH_INPUT_OPTIONS}
    },
    addInputRules() {
        const rules = this.parent?.() ?? []
        const [start, end] = delimiterPair('inline', this.options)
        if (start === '$' && end === '$') rules.push(new InputRule({
            find: new RegExp(`${delimiterRegex('inline', this.options)}$`),
            handler: ({state, range, match}) => {
                const latex = match[1]?.trim()
                if (latex) {
                    state.tr.replaceWith(range.from, range.to, this.type.create({latex}))
                }
            },
        }))
        if (start !== '$' || end !== '$') rules.push(new InputRule({
            find: new RegExp(`${delimiterRegex('inline', this.options)}$`),
            handler: ({state, range, match}) => {
                const latex = match[1]?.trim()
                if (latex) {
                    state.tr.replaceWith(range.from, range.to, this.type.create({latex}))
                }
            },
        }))
        return rules
    },
    addPasteRules() {
        const rules = this.parent?.() ?? []
        const [start, end] = delimiterPair('inline', this.options)
        if (start === '$' && end === '$') rules.push(new PasteRule({
            find: new RegExp(delimiterRegex('inline', this.options) ?? '', 'g'),
            handler: ({chain, range, match}) => {
                chain().insertContentAt(range, {type: this.name, attrs: {latex: match[1]?.trim()}}).run()
            },
        }))
        return rules
    },
    renderText({node}) {
        return mathText(node, this.options)
    },
    addNodeView() {
        return (props) => createMathNodeView({node: props.node, editor: this.editor, getPos: props.getPos, block: false, katexOptions: this.options.katexOptions, translate: this.options.translate})
    },
})
