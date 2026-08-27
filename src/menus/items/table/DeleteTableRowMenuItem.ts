import { Rows3 } from 'lucide'
import { ButtonMenuItem, type MenuContext } from '../../core'

/** 删除表格行菜单项，封装对应的 Tiptap 命令。 */
export class DeleteTableRowMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-delete-row', label: 'Delete row', icon: Rows3,
      execute: ({ editor }) => { editor.chain().focus().deleteRow().run() },
      isEnabled: ({ editor }) => editor.can().deleteRow(),
    })
  }

  render(context: MenuContext): HTMLElement {
    const button = super.render(context)
    button.classList.add('aieditor__tool--danger')
    return button
  }
}
