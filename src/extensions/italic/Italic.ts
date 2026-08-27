import { Italic as TItalic, type ItalicOptions as TItalicOptions } from '@tiptap/extension-italic'

/** 斜体标记的本地适配层。 */
export type ItalicOptions = TItalicOptions
export const Italic = TItalic.extend<ItalicOptions>({})
