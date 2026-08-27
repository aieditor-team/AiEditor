import {Extension, getStyleProperty} from '@tiptap/core'

export interface LetterSpacingOptions {
    /** 可以应用字间距属性的 Mark 类型。 */
    types: string[]
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        letterSpacing: {
            setLetterSpacing: (letterSpacing: string) => ReturnType
            unsetLetterSpacing: () => ReturnType
        }
    }
}

/**
 * 将 CSS letter-spacing 作为 TextStyle 属性保存。
 * 字距属于字符级格式而非段落格式，因此与字体、字号和颜色共用 textStyle mark；DOCX SDK
 * 会把 px/pt 换算为 w:spacing 的 1/20 磅单位。
 */
export const LetterSpacing = Extension.create<LetterSpacingOptions>({
    name: 'letterSpacing',

    addOptions() {
        return {types: ['textStyle']}
    },

    addGlobalAttributes() {
        return [{
            types: this.options.types,
            attributes: {
                letterSpacing: {
                    default: null,
                    parseHTML: (element) => getStyleProperty(element, 'letter-spacing') ?? element.style.letterSpacing,
                    renderHTML: (attributes) => attributes.letterSpacing
                        ? {style: `letter-spacing: ${attributes.letterSpacing}`}
                        : {},
                },
            },
        }]
    },

    addCommands() {
        return {
            setLetterSpacing: (letterSpacing: string) => ({chain}) => chain()
                .setMark('textStyle', {letterSpacing})
                .run(),
            unsetLetterSpacing: () => ({chain, commands, state}) => {
                if (state.selection.empty) {
                    // 光标选区使用 storedMarks。若 textStyle 只剩字距一个属性，直接移除整个
                    // mark；否则仅清空字距，以免顺带删除字体、字号或颜色。
                    const textStyle = (state.storedMarks ?? state.selection.$from.marks())
                        .find((mark) => mark.type.name === 'textStyle')
                    const hasOtherAttributes = Object.entries(textStyle?.attrs ?? {})
                        .some(([name, value]) => name !== 'letterSpacing' && value != null)
                    if (!hasOtherAttributes) return commands.unsetMark('textStyle')
                }

                return chain()
                    // 非空选区先把属性置空，再由 removeEmptyTextStyle 清理空 mark。
                    .setMark('textStyle', {letterSpacing: null})
                    .removeEmptyTextStyle()
                    .run()
            },
        }
    },
})
