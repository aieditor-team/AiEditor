import type {Editor} from '@tiptap/core'

/** 当前选中的图片节点类型；块级与行内图片使用不同命令。 */
export type ActiveImageType = 'image' | 'inlineImage'

/** 按优先级识别当前图片类型，非图片选区返回 undefined。 */
export function getActiveImageType(editor: Editor): ActiveImageType | undefined {
  if (editor.isActive('image')) return 'image'
  if (editor.isActive('inlineImage')) return 'inlineImage'
  return undefined
}
