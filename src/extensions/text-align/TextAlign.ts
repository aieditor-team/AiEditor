import { TextAlign as TTextAlign, type TextAlignOptions as TTextAlignOptions } from '@tiptap/extension-text-align'

/** 为配置的块节点提供左、中、右及两端对齐属性。 */
export type TextAlignOptions = TTextAlignOptions
export const TextAlign = TTextAlign.extend<TextAlignOptions>({})
