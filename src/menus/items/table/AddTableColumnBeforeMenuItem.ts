import { BetweenHorizontalStart } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 在左侧添加表格列菜单项，封装对应的 Tiptap 命令。 */
export class AddTableColumnBeforeMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-column-before', label: 'Add column before', icon: BetweenHorizontalStart,
      execute: ({ editor }) => { editor.chain().focus().addColumnBefore().run() },
      isEnabled: ({ editor }) => editor.can().addColumnBefore(),
    })
  }
}
