import { MousePointer2 } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 全选菜单项，封装对应的 Tiptap 命令。 */
export class SelectAllMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'select-all', label: 'Select all', icon: MousePointer2,
      execute: ({ editor }) => { editor.chain().focus().selectAll().run() },
    })
  }
}
