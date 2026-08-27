import { HardBreak as THardBreak, type HardBreakOptions as THardBreakOptions } from '@tiptap/extension-hard-break'

/** 硬换行节点的本地适配层，用于区分 Shift+Enter 与新段落。 */
export type HardBreakOptions = THardBreakOptions
export const HardBreak = THardBreak.extend<HardBreakOptions>({})
