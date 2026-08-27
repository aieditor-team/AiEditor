import { FontFamily as TFontFamily, type FontFamilyOptions as TFontFamilyOptions } from '@tiptap/extension-text-style'

/** 在 TextStyle 标记上记录字体族，菜单仅负责选择合法配置值。 */
export type FontFamilyOptions = TFontFamilyOptions
export const FontFamily = TFontFamily.extend<FontFamilyOptions>({})
