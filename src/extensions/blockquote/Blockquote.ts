import { Blockquote as TBlockquote, type BlockquoteOptions as TBlockquoteOptions } from '@tiptap/extension-blockquote'

/** 保留 Tiptap 原始引用块行为，并提供统一的本地扩展入口，便于后续集中覆写。 */
export type BlockquoteOptions = TBlockquoteOptions
export const Blockquote = TBlockquote.extend<BlockquoteOptions>({})
