import { Highlight as THighlight, type HighlightOptions as THighlightOptions } from '@tiptap/extension-highlight'

/** 行内高亮标记适配层；与块级高亮 HighlightBlock 相互独立。 */
export type HighlightOptions = THighlightOptions
export const Highlight = THighlight.extend<HighlightOptions>({})
