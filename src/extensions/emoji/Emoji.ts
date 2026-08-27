import { Emoji as TEmoji, type EmojiOptions as TEmojiOptions } from '@tiptap/extension-emoji'

/** 将短代码与实际表情渲染连接起来的 Emoji 节点适配层。 */
export type EmojiOptions = TEmojiOptions
export const Emoji = TEmoji.extend<EmojiOptions>({})
