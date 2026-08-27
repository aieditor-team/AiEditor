import { BetweenHorizontalEnd } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 在右侧添加表格列菜单项，封装对应的 Tiptap 命令。 */
export class AddTableColumnAfterMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-column-after', label: 'Add column after', icon: BetweenHorizontalEnd,
      execute: ({ editor }) => { editor.chain().focus().addColumnAfter().run() },
      isEnabled: ({ editor }) => editor.can().addColumnAfter(),
    })
  }
}
