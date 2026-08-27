import { BetweenVerticalEnd } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 在下方添加表格行菜单项，封装对应的 Tiptap 命令。 */
export class AddTableRowAfterMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-row-after', label: 'Add row after', icon: BetweenVerticalEnd,
      execute: ({ editor }) => { editor.chain().focus().addRowAfter().run() },
      isEnabled: ({ editor }) => editor.can().addRowAfter(),
    })
  }
}
