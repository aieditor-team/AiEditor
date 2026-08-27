import { Columns3 } from 'lucide'
import { ButtonMenuItem, type MenuContext } from '../../core'

/** 删除表格列菜单项，封装对应的 Tiptap 命令。 */
export class DeleteTableColumnMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-delete-column', label: 'Delete column', icon: Columns3,
      execute: ({ editor }) => { editor.chain().focus().deleteColumn().run() },
      isEnabled: ({ editor }) => editor.can().deleteColumn(),
    })
  }

  render(context: MenuContext): HTMLElement {
    const button = super.render(context)
    button.classList.add('aieditor__tool--danger')
    return button
  }
}
