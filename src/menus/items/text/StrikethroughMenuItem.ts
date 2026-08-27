import { Strikethrough } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 删除线菜单项，封装对应的 Tiptap 命令。 */
export class StrikethroughMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'strike', label: 'Strikethrough', icon: Strikethrough,
      execute: ({ editor }) => { editor.chain().focus().toggleStrike().run() },
      isActive: ({ editor }) => editor.isActive('strike'),
    })
  }
}
