import { Underline } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 下划线菜单项，封装对应的 Tiptap 命令。 */
export class UnderlineMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'underline', label: 'Underline', icon: Underline,
      execute: ({ editor }) => { editor.chain().focus().toggleUnderline().run() },
      isActive: ({ editor }) => editor.isActive('underline'),
    })
  }
}
