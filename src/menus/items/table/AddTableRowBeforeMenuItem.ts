import { BetweenVerticalStart } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 在上方添加表格行菜单项，封装对应的 Tiptap 命令。 */
export class AddTableRowBeforeMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'table-row-before', label: 'Add row before', icon: BetweenVerticalStart,
      execute: ({ editor }) => { editor.chain().focus().addRowBefore().run() },
      isEnabled: ({ editor }) => editor.can().addRowBefore(),
    })
  }
}
