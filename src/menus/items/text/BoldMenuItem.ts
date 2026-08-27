import { Bold } from 'lucide'
import { ButtonMenuItem } from '../../core'

/** 粗体菜单项，封装对应的 Tiptap 命令。 */
export class BoldMenuItem extends ButtonMenuItem {
  constructor() {
    super({
      id: 'bold', label: 'Bold', icon: Bold,
      execute: ({ editor }) => { editor.chain().focus().toggleBold().run() },
      isActive: ({ editor }) => editor.isActive('bold'),
    })
  }
}
