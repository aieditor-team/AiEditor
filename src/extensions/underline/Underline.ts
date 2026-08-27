import { Underline as TUnderline, type UnderlineOptions as TUnderlineOptions } from '@tiptap/extension-underline'

/** 下划线标记的本地适配层。 */
export type UnderlineOptions = TUnderlineOptions
export const Underline = TUnderline.extend<UnderlineOptions>({})
