import type {Editor} from '@tiptap/core'
import {CellSelection} from '@tiptap/pm/tables'

/**
 * 读取当前单元格选择中一致的属性值。
 * 多选值不一致时返回空字符串，让菜单显示为“默认/混合”而不是误报某个颜色或对齐方式。
 */
export function getSelectedTableCellAttribute(editor: Editor, name: string): string {
  const {selection} = editor.state
  if (selection instanceof CellSelection) {
    const values = new Set<string>()
    selection.forEachCell((cell) => values.add(String(cell.attrs[name] ?? '')))
    return values.size === 1 ? [...values][0] ?? '' : ''
  }
  const type = editor.isActive('tableHeader') ? 'tableHeader' : 'tableCell'
  return String(editor.getAttributes(type)[name] ?? '')
}

export function canSetTableCellAttribute(editor: Editor): boolean {
  return editor.isEditable && editor.isActive('table')
    && (editor.state.selection instanceof CellSelection
      || editor.isActive('tableCell')
      || editor.isActive('tableHeader'))
}
