import { Dropcursor as TDropcursor, type DropcursorOptions as TDropcursorOptions } from '@tiptap/extensions'

/** 拖放内容时显示插入位置指示线的本地适配扩展。 */
export type DropcursorOptions = TDropcursorOptions
export const Dropcursor = TDropcursor.extend<DropcursorOptions>({})
