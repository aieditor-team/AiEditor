import { Redo2 } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 重做菜单项，封装对应的 Tiptap 命令。 */
export class RedoMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'redo', label: 'Redo', icon: Redo2,
      execute: ({ editor }) => { editor.chain().focus().redo().run() },
      isEnabled: ({ editor }) => editor.can().redo(),
    })
  }
}
