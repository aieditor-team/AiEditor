import { Bold as TBold, type BoldOptions as TBoldOptions } from '@tiptap/extension-bold'

/** 粗体标记的本地适配层；公开稳定类型并隔离上游实现名称。 */
export type BoldOptions = TBoldOptions
export const Bold = TBold.extend<BoldOptions>({})
