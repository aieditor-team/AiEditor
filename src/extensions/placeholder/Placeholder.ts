import { Placeholder as TPlaceholder, type PlaceholderOptions as TPlaceholderOptions } from '@tiptap/extension-placeholder'

/** 空文档和空节点的占位提示扩展，不会把提示文字写入文档内容。 */
export type PlaceholderOptions = TPlaceholderOptions
export const Placeholder = TPlaceholder.extend<PlaceholderOptions>({})
