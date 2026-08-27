import { Code as TCode, type CodeOptions as TCodeOptions } from '@tiptap/extension-code'

/** 行内代码标记的本地适配层，与代码块节点保持职责分离。 */
export type CodeOptions = TCodeOptions
export const Code = TCode.extend<CodeOptions>({})
