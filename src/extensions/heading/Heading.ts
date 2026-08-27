import { Heading as THeading, type HeadingOptions as THeadingOptions } from '@tiptap/extension-heading'

export type HeadingOptions = THeadingOptions
/**
 * 标题节点除上游级别能力外，额外保存文档角色。
 * `documentRole` 用于区分普通标题与文档标题等版式语义，并透传到 HTML。
 */
export const Heading = THeading.extend<HeadingOptions>({
    addAttributes() {
        return {
            ...this.parent?.(),
            // 使用 data 属性持久化，避免样式类名变化时丢失结构语义。
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
