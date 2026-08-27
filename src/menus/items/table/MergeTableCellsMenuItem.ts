import { TableCellsMerge } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 合并表格单元格菜单项，封装对应的 Tiptap 命令。 */
export class MergeTableCellsMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-merge-cells', label: 'Merge cells', icon: TableCellsMerge,
      execute: ({ editor }) => { editor.chain().focus().mergeCells().run() },
      isEnabled: ({ editor }) => editor.can().mergeCells(),
    })
  }
}
