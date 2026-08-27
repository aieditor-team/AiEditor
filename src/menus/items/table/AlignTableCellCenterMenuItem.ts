import { AlignCenter } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 表格单元格居中菜单项，封装对应的 Tiptap 命令。 */
export class AlignTableCellCenterMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-align-center', label: 'Align cell text center', icon: AlignCenter,
      execute: ({ editor }) => { editor.chain().focus().setTextAlign('center').run() },
      isActive: ({ editor }) => editor.isActive({ textAlign: 'center' }),
      isEnabled: ({ editor }) => editor.isActive('table') && editor.can().setTextAlign('center'),
    })
  }
}
