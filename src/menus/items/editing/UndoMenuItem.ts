import { Undo2 } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 撤销菜单项，封装对应的 Tiptap 命令。 */
export class UndoMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'undo', label: 'Undo', icon: Undo2,
      execute: ({ editor }) => { editor.chain().focus().undo().run() },
      isEnabled: ({ editor }) => editor.can().undo(),
    })
  }
}
