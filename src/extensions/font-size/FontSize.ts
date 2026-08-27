import { FontSize as TFontSize, type FontSizeOptions as TFontSizeOptions } from '@tiptap/extension-text-style'

/** 在 TextStyle 标记上记录字号，保持序列化 HTML 可移植。 */
export type FontSizeOptions = TFontSizeOptions
export const FontSize = TFontSize.extend<FontSizeOptions>({})
