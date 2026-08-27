import { RemoveFormatting } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 清除格式菜单项，封装对应的 Tiptap 命令。 */
export class ClearFormattingMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'clear-formatting', label: 'Clear formatting', icon: RemoveFormatting,
      execute: ({ editor }) => {
        editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().unsetLineHeight().unsetIndent().run()
      },
      isEnabled: ({ editor }) => editor.isEditable,
    })
  }
}
