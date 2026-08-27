import { AlignRight } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 表格单元格右对齐菜单项，封装对应的 Tiptap 命令。 */
export class AlignTableCellRightMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-align-right', label: 'Align cell text right', icon: AlignRight,
      execute: ({ editor }) => { editor.chain().focus().setTextAlign('right').run() },
      isActive: ({ editor }) => editor.isActive({ textAlign: 'right' }),
      isEnabled: ({ editor }) => editor.isActive('table') && editor.can().setTextAlign('right'),
    })
  }
}
