import { Strike as TStrike, type StrikeOptions as TStrikeOptions } from '@tiptap/extension-strike'

/** 删除线标记的本地适配层。 */
export type StrikeOptions = TStrikeOptions
export const Strike = TStrike.extend<StrikeOptions>({})
