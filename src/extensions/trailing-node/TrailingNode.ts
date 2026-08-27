import { TrailingNode as TTrailingNode, type TrailingNodeOptions as TTrailingNodeOptions } from '@tiptap/extensions'

/** 在不可继续输入的末尾块之后补充可编辑段落，保证用户始终能追加内容。 */
export type TrailingNodeOptions = TTrailingNodeOptions
export const TrailingNode = TTrailingNode.extend<TrailingNodeOptions>({})
