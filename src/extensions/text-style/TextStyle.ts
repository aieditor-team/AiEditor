import { TextStyle as TTextStyle, type TextStyleOptions as TTextStyleOptions } from '@tiptap/extension-text-style'

/** 字体、字号、颜色等行内样式共享的无语义容器标记。 */
export type TextStyleOptions = TTextStyleOptions
export const TextStyle = TTextStyle.extend<TextStyleOptions>({})
