import { Paragraph as TParagraph, type ParagraphOptions as TParagraphOptions } from '@tiptap/extension-paragraph'

/** 普通段落节点，是编辑器正文与尾随空段落的基础块类型。 */
export type ParagraphOptions = TParagraphOptions
export const Paragraph = TParagraph.extend<ParagraphOptions>({
    addAttributes() {
        return {
            ...this.parent?.(),
            documentRole: {
                default: null,
                parseHTML: (element) => element.getAttribute('data-document-role'),
                renderHTML: (attributes) => attributes.documentRole
                    ? {'data-document-role': attributes.documentRole}
                    : {},
            },
        }
    },
})
