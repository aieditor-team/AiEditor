import { TableCellsSplit } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 拆分表格单元格菜单项，封装对应的 Tiptap 命令。 */
export class SplitTableCellMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-split-cell', label: 'Split cell', icon: TableCellsSplit,
      execute: ({ editor }) => { editor.chain().focus().splitCell().run() },
      isEnabled: ({ editor }) => editor.can().splitCell(),
    })
  }
}
