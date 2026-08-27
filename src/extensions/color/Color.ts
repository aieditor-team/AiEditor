import { Color as TColor, type ColorOptions as TColorOptions } from '@tiptap/extension-text-style'

/** 将前景色属性附着到 TextStyle 标记，供字体颜色菜单读写。 */
export type ColorOptions = TColorOptions
export const Color = TColor.extend<ColorOptions>({})
