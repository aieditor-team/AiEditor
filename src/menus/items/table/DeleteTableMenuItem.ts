import { Trash2 } from 'lucide'
import { ButtonMenuItem, type MenuContext } from '../../core'

/** 删除表格菜单项，封装对应的 Tiptap 命令。 */
export class DeleteTableMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-delete', label: 'Delete table', icon: Trash2,
      execute: ({ editor }) => { editor.chain().focus().deleteTable().run() },
      isEnabled: ({ editor }) => editor.can().deleteTable(),
    })
  }

  render(context: MenuContext): HTMLElement {
    const button = super.render(context)
    button.classList.add('aieditor__tool--danger')
    return button
  }
}
