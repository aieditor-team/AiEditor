import { Document as TDocument } from '@tiptap/extension-document'

/** 编辑器文档根节点；通过本地扩展实例保证后续可安全追加 schema 能力。 */
export const Document = TDocument.extend({})
