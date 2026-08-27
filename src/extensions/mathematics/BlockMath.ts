import {BlockMath as TBlockMath, type BlockMathOptions as TBlockMathOptions} from '@tiptap/extension-mathematics'
import {InputRule, PasteRule} from '@tiptap/core'
import {DEFAULT_MATH_INPUT_OPTIONS, delimiterPair, delimiterRegex, mathText, type MathInputOptions} from './MathOptions'
import {createMathNodeView} from './MathNodeView'

/** 独占一行的数学公式节点，渲染参数由 Mathematics 组合扩展统一下发。 */
export type BlockMathOptions = TBlockMathOptions & MathInputOptions
export const BlockMath = TBlockMath.extend<BlockMathOptions>({
    addOptions() {
        return {...this.parent?.(), ...DEFAULT_MATH_INPUT_OPTIONS}
    },
    addInputRules() {
        const rules = this.parent?.() ?? []
        const [start, end] = delimiterPair('block', this.options)
        if (start === '$$' && end === '$$') rules.push(new InputRule({
            find: new RegExp(`${delimiterRegex('block', this.options)}$`),
            handler: ({state, range, match}) => {
                const latex = match[1]?.trim()
                if (latex) {
                    state.tr.replaceWith(range.from, range.to, this.type.create({latex}))
                }
            },
        }))
        else rules.push(new InputRule({
            find: new RegExp(`${delimiterRegex('block', this.options)}$`),
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
        const expression = this.options.delimiters === 'dollar' || this.options.delimiters === undefined
            ? String.raw`(?<!\$)\$\$([\s\S]+?)\$\$(?!\$)`
            : delimiterRegex('block', this.options)
        if (expression) rules.push(new PasteRule({
            find: new RegExp(expression, 'g'),
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
        return (props) => createMathNodeView({node: props.node, editor: this.editor, getPos: props.getPos, block: true, katexOptions: this.options.katexOptions, translate: this.options.translate})
    },
})
