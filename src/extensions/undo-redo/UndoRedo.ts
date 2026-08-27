import { UndoRedo as TUndoRedo, type UndoRedoOptions as TUndoRedoOptions } from '@tiptap/extensions'

/** ProseMirror 历史记录适配层，为工具栏撤销与重做命令提供状态。 */
export type UndoRedoOptions = TUndoRedoOptions
export const UndoRedo = TUndoRedo.extend<UndoRedoOptions>({})
