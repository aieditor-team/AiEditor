import { PanelTop } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 切换表头行菜单项，封装对应的 Tiptap 命令。 */
export class ToggleTableHeaderRowMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-toggle-header-row', label: 'Toggle header row', icon: PanelTop,
      execute: ({ editor }) => { editor.chain().focus().toggleHeaderRow().run() },
      isActive: ({ editor }) => editor.isActive('tableHeader'),
      isEnabled: ({ editor }) => editor.can().toggleHeaderRow(),
    })
  }
}
