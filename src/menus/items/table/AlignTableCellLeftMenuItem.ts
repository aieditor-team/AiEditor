import { AlignLeft } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 表格单元格左对齐菜单项，封装对应的 Tiptap 命令。 */
export class AlignTableCellLeftMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-align-left', label: 'Align cell text left', icon: AlignLeft,
      execute: ({ editor }) => { editor.chain().focus().setTextAlign('left').run() },
      isActive: ({ editor }) => editor.isActive({ textAlign: 'left' }),
      isEnabled: ({ editor }) => editor.isActive('table') && editor.can().setTextAlign('left'),
    })
  }
}
